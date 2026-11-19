/* =================================================================
   Live walkthrough player: replays a logged agent session step by step.
   Usage: <div class="walkthrough" data-src="walkthroughs/<id>/walkthrough.json[, more.json]"></div>
   Data format: walkthroughs/FORMAT.md. No external libraries.
   ================================================================= */
(function () {
  "use strict";

  var REDUCE = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var KIND = { plan: "Plan", code: "Code", feedback: "Feedback", result: "Result" };

  /* ---------- icons (inline SVG, stroke = currentColor) ---------- */
  function svg(d, extra) {
    return '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false" ' +
      'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"' +
      (extra || "") + ">" + d + "</svg>";
  }
  var ICON = {
    play: svg('<path d="M7 4.5v15l12.5-7.5z" fill="currentColor" stroke="none"/>'),
    pause: svg('<rect x="6" y="4.5" width="4" height="15" rx="1" fill="currentColor" stroke="none"/><rect x="14" y="4.5" width="4" height="15" rx="1" fill="currentColor" stroke="none"/>'),
    restart: svg('<path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1"/><path d="M3.5 4v5h5"/>'),
    prev: svg('<path d="M15 5l-7 7 7 7"/>'),
    next: svg('<path d="M9 5l7 7-7 7"/>'),
    plan: svg('<path d="M4 6h16M4 12h10M4 18h13"/>'),
    code: svg('<path d="M4 7l5 5-5 5"/><path d="M12 18h8"/>'),
    feedback: svg('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 15l5-4 4 3 3-2 6 4"/>'),
    result: svg('<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M12 12l8-4.5M12 12v9M12 12L4 7.5"/>')
  };

  /* ---------- text helpers ---------- */
  function esc(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  // plain text -> HTML: escape, then `code` and **bold**, newline = line break
  function rich(s) {
    return esc(s)
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>")
      .replace(/\n/g, "<br>");
  }

  /* ---------- tiny Python highlighter (one line at a time) ---------- */
  var KW = {};
  ("False None True and as assert async await break class continue def del elif else except finally for from " +
   "global if import in is lambda nonlocal not or pass raise return try while with yield").split(" ").forEach(function (k) { KW[k] = 1; });
  var BUILTIN = {};
  ("print len range list dict tuple set str int float bool min max sum abs round sorted enumerate zip map " +
   "isinstance hasattr getattr type any all open").split(" ").forEach(function (k) { BUILTIN[k] = 1; });
  var TOK = /(#.*$)|((?:\b[rRbBfFuU]{1,2})?(?:'(?:\\.|[^'\\])*'?|"(?:\\.|[^"\\])*"?))|(\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b|\.\d+\b)|(@[A-Za-z_][\w.]*)|([A-Za-z_]\w*)(?=\s*\()|([A-Za-z_]\w*)/g;
  function hlLine(line) {
    var out = "", last = 0, m;
    TOK.lastIndex = 0;
    while ((m = TOK.exec(line))) {
      out += esc(line.slice(last, m.index));
      var t = m[0], cls = null;
      if (m[1]) cls = "c";
      else if (m[2]) cls = "s";
      else if (m[3]) cls = "n";
      else if (m[4]) cls = "d";
      else if (m[5]) cls = KW[t] ? "k" : (BUILTIN[t] ? "b" : "f");
      else if (m[6]) cls = KW[t] ? "k" : null;
      out += cls ? '<span class="wt-' + cls + '">' + esc(t) + "</span>" : esc(t);
      last = m.index + t.length;
      if (t.length === 0) TOK.lastIndex++;
    }
    return out + esc(line.slice(last));
  }
  function codeBlock(code) {
    var lines = String(code).replace(/\s+$/, "").split("\n");
    return '<pre class="wt-code" tabindex="0"><code>' + lines.map(function (l) {
      return '<span class="wt-ln">' + (hlLine(l) || " ") + "</span>";
    }).join("") + "</code></pre>";
  }

  /* ---------- media ---------- */
  function isVideo(src) { return /\.(mp4|webm|mov)(\?|#|$)/i.test(src); }
  function mediaItem(m, base, opts) {
    var src = new URL(m.src, base).href;
    var label = m.label ? esc(m.label) : "";
    var inner;
    if (isVideo(src)) {
      var poster = m.poster ? ' poster="' + esc(new URL(m.poster, base).href) + '"' : "";
      inner = '<video muted loop playsinline preload="none"' + poster + ' aria-label="' + label + '">' +
        '<source src="' + esc(src) + '" type="video/mp4"></video>';
    } else {
      inner = '<a href="' + esc(src) + '" target="_blank" rel="noopener" aria-label="Open image full size' + (label ? ": " + label : "") + '">' +
        '<img src="' + esc(src) + '" alt="' + label + '" loading="lazy" decoding="async"></a>';
    }
    return '<figure class="wt-fig' + (opts && opts.cls ? " " + opts.cls : "") + '">' + inner +
      (label ? "<figcaption>" + label + "</figcaption>" : "") + "</figure>";
  }
  function mediaGrid(list, base) {
    if (!list || !list.length) return "";
    return '<div class="wt-media n' + Math.min(list.length, 3) + '">' +
      list.map(function (m) { return mediaItem(m, base); }).join("") + "</div>";
  }
  function kvBlock(kv) {
    if (!kv || !kv.length) return "";
    return '<dl class="wt-kv">' + kv.map(function (p) {
      return "<div><dt>" + esc(p[0]) + "</dt><dd>" + esc(p[1]) + "</dd></div>";
    }).join("") + "</dl>";
  }

  /* ---------- per-step reading time (ms) ---------- */
  function durFor(st) {
    if (st.duration) return +st.duration;
    var txt = (st.text || "").length, kv = (st.kv || []).length, media = (st.media || []).length;
    var lines = st.code ? String(st.code).split("\n").length : 0;
    var d;
    if (st.type === "code") d = 4000 + lines * 520 + txt * 30;
    else if (st.type === "result") d = 9000 + lines * 300 + kv * 600 + txt * 30;
    else if (st.type === "plan") d = 4500 + txt * 32 + kv * 700 + media * 2500;
    else d = 4000 + txt * 32 + kv * 800 + media * 2600;
    return Math.max(5000, Math.min(d, st.type === "result" ? 26000 : 18000));
  }

  /* ---------- one player ---------- */
  function Player(root, samples) {
    this.root = root;
    this.samples = samples;
    this.si = 0;          // sample index
    this.k = 0;           // step index
    this.elapsed = 0;
    this.playing = false;
    this.userPaused = false;
    this.visible = false;
    this.ended = false;
    this.raf = null;
    this.build();
    this.load(0);
    this.observe();
  }

  Player.prototype.build = function () {
    var multi = this.samples.length > 1;
    var r = this.root;
    r.classList.add("wt-ready");
    r.innerHTML =
      '<article class="wt-card">' +
        '<header class="wt-head"></header>' +
        '<div class="wt-term">' +
          '<div class="wt-bar">' +
            '<button type="button" class="wt-btn wt-play" aria-label="Play">' + ICON.play + "</button>" +
            '<button type="button" class="wt-btn wt-restart" aria-label="Restart from the first step">' + ICON.restart + "</button>" +
            '<div class="wt-prog" role="group" aria-label="Steps"></div>' +
            '<div class="wt-now"><span class="wt-now-label"></span><span class="wt-now-count"></span></div>' +
          "</div>" +
          '<div class="wt-screen" tabindex="-1"></div>' +
        "</div>" +
      "</article>" +
      (multi ?
        '<nav class="wt-foot" aria-label="Walkthrough samples">' +
          '<button type="button" class="wt-nav wt-prev" aria-label="Previous sample">' + ICON.prev + "</button>" +
          '<div class="wt-dots"></div>' +
          '<button type="button" class="wt-nav wt-next" aria-label="Next sample">' + ICON.next + "</button>" +
          '<span class="wt-ccount"></span>' +
        "</nav>" : "");

    this.head = r.querySelector(".wt-head");
    this.screen = r.querySelector(".wt-screen");
    this.prog = r.querySelector(".wt-prog");
    this.nowLabel = r.querySelector(".wt-now-label");
    this.nowCount = r.querySelector(".wt-now-count");
    this.playBtn = r.querySelector(".wt-play");
    var self = this;
    this.playBtn.addEventListener("click", function () {
      if (self.playing) { self.userPaused = true; self.pause(); }
      else { self.userPaused = false; if (self.ended) self.show(0); self.play(); }
    });
    r.querySelector(".wt-restart").addEventListener("click", function () {
      self.userPaused = false; self.show(0); self.play();
    });
    // arrow keys step through when focus is inside the terminal
    r.querySelector(".wt-term").addEventListener("keydown", function (e) {
      if (e.target && e.target.tagName === "PRE") return;   // let code blocks scroll
      if (e.key === "ArrowRight") { self.show(Math.min(self.k + 1, self.steps().length - 1)); e.preventDefault(); }
      else if (e.key === "ArrowLeft") { self.show(Math.max(self.k - 1, 0)); e.preventDefault(); }
    });
    if (multi) {
      var dots = r.querySelector(".wt-dots");
      dots.innerHTML = this.samples.map(function (s, i) {
        return '<button type="button" class="wt-dot" aria-label="Sample ' + (i + 1) + ": " + esc(s.data.title || s.data.id) + '"></button>';
      }).join("");
      Array.prototype.forEach.call(dots.querySelectorAll(".wt-dot"), function (d, i) {
        d.addEventListener("click", function () { self.load(i); self.autoplay(); });
      });
      r.querySelector(".wt-prev").addEventListener("click", function () { self.load(self.si - 1); self.autoplay(); });
      r.querySelector(".wt-next").addEventListener("click", function () { self.load(self.si + 1); self.autoplay(); });
    }
  };

  Player.prototype.steps = function () { return this.samples[this.si].data.steps || []; };

  Player.prototype.load = function (i) {
    var n = this.samples.length;
    this.si = ((i % n) + n) % n;
    var s = this.samples[this.si], d = s.data, base = s.base;
    var inputs = d.inputs || [];
    this.head.innerHTML =
      '<div class="wt-meta">' +
        '<span class="wt-tag">Agent session</span>' +
        '<span class="wt-title">' + esc(d.title || d.id) + "</span>" +
        (d.subtitle ? '<span class="wt-sub">' + esc(d.subtitle) + "</span>" : "") +
      "</div>" +
      '<p class="wt-kicker">Task</p>' +
      '<p class="wt-task">' + rich(d.task || "") + "</p>" +
      (inputs.length ?
        '<div class="wt-inputs n' + Math.min(inputs.length, 6) + '">' + inputs.map(function (m) {
          var src = new URL(m.src, base).href, lab = esc(m.label || "");
          var el = isVideo(src) ?
            '<video muted loop playsinline autoplay preload="metadata" aria-label="' + lab + '"><source src="' + esc(src) + '" type="video/mp4"></video>' :
            '<img src="' + esc(src) + '" alt="' + lab + '" loading="lazy" decoding="async">';
          return '<figure class="wt-in">' + el + (lab ? "<figcaption>" + lab + "</figcaption>" : "") + "</figure>";
        }).join("") + "</div>" : "");
    if (REDUCE) Array.prototype.forEach.call(this.head.querySelectorAll("video"), function (v) { v.removeAttribute("autoplay"); v.controls = true; });

    var self = this;
    var steps = this.steps();
    var ci = 0;
    this.codeNo = steps.map(function (st) { return st.type === "code" ? ++ci : 0; });
    this.durs = steps.map(durFor);
    this.prog.innerHTML = steps.map(function (st, j) {
      return '<button type="button" class="wt-seg" aria-label="Step ' + (j + 1) + " of " + steps.length + ": " +
        esc((KIND[st.type] || st.type) + ", " + (st.label || "")) + '"><i></i></button>';
    }).join("");
    this.segs = Array.prototype.slice.call(this.prog.querySelectorAll(".wt-seg"));
    this.segs.forEach(function (b, j) { b.addEventListener("click", function () { self.show(j); if (!self.userPaused && !REDUCE) self.play(); }); });

    var dots = this.root.querySelectorAll(".wt-dot");
    Array.prototype.forEach.call(dots, function (d, j) {
      d.classList.toggle("on", j === self.si);
      if (j === self.si) d.setAttribute("aria-current", "true"); else d.removeAttribute("aria-current");
    });
    var cc = this.root.querySelector(".wt-ccount");
    if (cc) cc.textContent = (this.si + 1) + " / " + this.samples.length + " · " + (d.title || d.id);
    this.show(0);
  };

  Player.prototype.renderStep = function (st, j) {
    var base = this.samples[this.si].base;
    var kind = st.type in KIND ? st.type : "feedback";
    var tag = kind === "code" ? "Step " + this.codeNo[j] + " · Code" : KIND[kind];
    var html = '<div class="wt-step wt-' + kind + '">' +
      '<div class="wt-step-h">' + ICON[kind] + '<span class="wt-step-k">' + esc(tag) + "</span>" +
      (st.label ? '<span class="wt-step-l">' + esc(st.label) + "</span>" : "") + "</div>";
    if (kind === "code") {
      if (st.text) html += '<p class="wt-text">' + rich(st.text) + "</p>";
      html += codeBlock(st.code || "");
    } else if (kind === "result") {
      if (st.text) html += '<p class="wt-text">' + rich(st.text) + "</p>";
      html += mediaGrid(st.media, base) + kvBlock(st.kv);
      if (st.code) html += '<div class="wt-file">scene_world.py (excerpt)</div>' + codeBlock(st.code);
    } else {
      if (st.text) html += '<p class="wt-text wt-callout">' + rich(st.text) + "</p>";
      html += kvBlock(st.kv) + mediaGrid(st.media, base);
    }
    return html + "</div>";
  };

  Player.prototype.show = function (j) {
    var steps = this.steps();
    if (!steps.length) return;
    this.k = Math.max(0, Math.min(j, steps.length - 1));
    this.elapsed = 0;
    this.ended = false;
    var st = steps[this.k];
    this.stopVideos();
    this.screen.innerHTML = this.renderStep(st, this.k);
    this.screen.scrollTop = 0;
    this.nowLabel.textContent = st.label || KIND[st.type] || "";
    this.nowCount.textContent = (this.k + 1) + " / " + steps.length;
    var self = this;
    this.segs.forEach(function (b, i) {
      b.classList.toggle("done", i < self.k);
      b.classList.toggle("cur", i === self.k);
      if (i === self.k) b.setAttribute("aria-current", "step"); else b.removeAttribute("aria-current");
      b.querySelector("i").style.width = i < self.k ? "100%" : "0%";
    });
    // wide images (BEV strips, sheets) take a full row once their size is known
    Array.prototype.forEach.call(this.screen.querySelectorAll(".wt-fig img"), function (img) {
      function mark() { if (img.naturalWidth / Math.max(1, img.naturalHeight) > 2.2) img.closest(".wt-fig").classList.add("wide"); }
      if (img.complete) mark(); else img.addEventListener("load", mark);
    });
    // code: reveal lines one by one while playing
    this.lines = Array.prototype.slice.call(this.screen.querySelectorAll(".wt-code .wt-ln"));
    this.typing = this.playing && !REDUCE && st.type === "code";
    if (this.typing) this.lines.forEach(function (l) { l.classList.add("hid"); });
    this.typeEnd = Math.min(this.durs[this.k] * 0.45, this.lines.length * 140);
    this.startVideos();
    this.preload(this.k + 1);
    this.setPlayIcon();
  };

  Player.prototype.preload = function (j) {
    var st = this.steps()[j];
    if (!st || !st.media) return;
    var base = this.samples[this.si].base;
    st.media.forEach(function (m) { if (!isVideo(m.src)) { var im = new Image(); im.src = new URL(m.src, base).href; } });
  };

  Player.prototype.startVideos = function () {
    if (!this.visible || REDUCE) {
      if (REDUCE) Array.prototype.forEach.call(this.screen.querySelectorAll("video"), function (v) { v.controls = true; v.preload = "metadata"; });
      return;
    }
    Array.prototype.forEach.call(this.screen.querySelectorAll("video"), function (v) {
      v.preload = "auto";
      var p = v.play(); if (p && p.catch) p.catch(function () {});
    });
  };
  Player.prototype.stopVideos = function () {
    Array.prototype.forEach.call(this.screen.querySelectorAll("video"), function (v) { v.pause(); });
  };

  Player.prototype.setPlayIcon = function () {
    var b = this.playBtn;
    if (this.playing) { b.innerHTML = ICON.pause; b.setAttribute("aria-label", "Pause"); }
    else if (this.ended) { b.innerHTML = ICON.restart; b.setAttribute("aria-label", "Replay from the first step"); }
    else { b.innerHTML = ICON.play; b.setAttribute("aria-label", "Play"); }
    this.root.classList.toggle("wt-playing", this.playing);
  };

  Player.prototype.play = function () {
    if (this.playing) return;
    this.playing = true;
    this.last = null;
    var st = this.steps()[this.k];
    if (this.elapsed === 0 && !REDUCE && st && st.type === "code" && this.lines.length) {
      this.typing = true;   // a code step shown while paused types out once playback starts
      this.lines.forEach(function (l) { l.classList.add("hid"); });
    }
    var self = this;
    this.raf = requestAnimationFrame(function f(ts) { self.tick(ts); if (self.playing) self.raf = requestAnimationFrame(f); });
    this.setPlayIcon();
  };
  Player.prototype.pause = function () {
    this.playing = false;
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = null;
    this.typing = false;
    if (this.lines) this.lines.forEach(function (l) { l.classList.remove("hid"); });
    this.setPlayIcon();
  };
  Player.prototype.autoplay = function () { if (this.visible && !this.userPaused && !REDUCE) this.play(); };

  Player.prototype.tick = function (ts) {
    var dt = this.last == null ? 0 : Math.min(ts - this.last, 100);
    this.last = ts;
    this.elapsed += dt;
    var dur = this.durs[this.k];
    var seg = this.segs[this.k];
    if (seg) seg.querySelector("i").style.width = Math.min(100, (this.elapsed / dur) * 100) + "%";
    if (this.typing && this.lines.length) {
      var n = Math.ceil((this.elapsed / Math.max(1, this.typeEnd)) * this.lines.length);
      for (var i = 0; i < this.lines.length && i < n; i++) this.lines[i].classList.remove("hid");
      if (n >= this.lines.length) this.typing = false;
    }
    if (this.elapsed >= dur) {
      if (this.k < this.steps().length - 1) { this.show(this.k + 1); }
      else if (this.samples.length > 1) { this.load(this.si + 1); }
      else { this.pause(); this.ended = true; this.setPlayIcon(); }
    }
  };

  Player.prototype.observe = function () {
    var self = this;
    if (REDUCE) { this.visible = true; return; }
    if (!("IntersectionObserver" in window)) { this.visible = true; this.autoplay(); return; }
    new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        self.visible = e.isIntersecting;
        if (self.visible) { self.startVideos(); if (!self.ended) self.autoplay(); }
        else { self.stopVideos(); if (self.playing) self.pause(); }
      });
    }, { threshold: 0.35 }).observe(this.root.querySelector(".wt-term"));
    document.addEventListener("visibilitychange", function () {
      if (document.hidden && self.playing) self.pause();
      else if (!document.hidden && self.visible && !self.ended) self.autoplay();
    });
  };

  /* ---------- boot ---------- */
  function boot(el) {
    if (el.__wt) return;
    el.__wt = true;
    var srcs = (el.getAttribute("data-src") || "").split(",").map(function (s) { return s.trim(); }).filter(Boolean);
    if (!srcs.length) return;
    el.innerHTML = '<p class="wt-loading">Loading walkthrough…</p>';
    Promise.all(srcs.map(function (src) {
      var url = new URL(src, document.baseURI).href;
      return fetch(url).then(function (r) {
        if (!r.ok) throw new Error(src + ": HTTP " + r.status);
        return r.json();
      }).then(function (data) { return { data: data, base: url }; });
    })).then(function (samples) {
      new Player(el, samples);
    }).catch(function (err) {
      el.innerHTML = '<p class="wt-loading">Walkthrough could not be loaded (' + esc(err.message) + ").</p>";
      if (window.console) console.warn("[walkthrough]", err);
    });
  }
  function init() { Array.prototype.forEach.call(document.querySelectorAll(".walkthrough[data-src]"), boot); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
  window.Walkthrough = { init: init };
})();
