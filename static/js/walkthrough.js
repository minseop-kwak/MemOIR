/* =================================================================
   Live walkthrough player: replays a logged agent session step by step.
   A code step and the feedback steps right after it are shown as one slide (code, then its output).
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

  /* ---------- slides: a code step and the feedback steps right after it are one slide ---------- */
  function group(steps) {
    var slides = [], cur = null;
    steps.forEach(function (st) {
      if (st.type === "code") { cur = { kind: "pair", code: st, fbs: [] }; slides.push(cur); }
      else if (st.type === "feedback" && cur) { cur.fbs.push(st); }
      else { cur = null; slides.push({ kind: st.type in KIND ? st.type : "feedback", step: st }); }
    });
    return slides;
  }

  /* ---------- reading time (ms) ---------- */
  function nLines(code) { return code ? String(code).split("\n").length : 0; }
  function fbTime(st) {
    return 3200 + (st.text || "").length * 30 + (st.kv || []).length * 650 + (st.media || []).length * 2300;
  }
  function timing(sl) {
    // returns {dur, reveal}: total time on screen, and when the feedback half appears
    var st = sl.step || sl.code;
    if (st.duration && sl.kind !== "pair") return { dur: +st.duration, reveal: 0 };
    if (sl.kind === "pair") {
      var codeT = 2200 + nLines(sl.code.code) * 420 + (sl.code.text || "").length * 30;
      var fbT = sl.fbs.reduce(function (a, f) { return a + fbTime(f); }, 0);
      var dur = sl.code.duration ? +sl.code.duration : Math.max(9000, Math.min(codeT + fbT, 32000));
      return { dur: dur, reveal: sl.fbs.length ? Math.min(codeT, dur * 0.45) : dur };
    }
    var txt = (st.text || "").length, kv = (st.kv || []).length, media = (st.media || []).length;
    var d;
    if (sl.kind === "result") d = 9000 + nLines(st.code) * 300 + kv * 600 + txt * 30;
    else if (sl.kind === "plan") d = 4500 + txt * 30 + kv * 700 + media * 2500;
    else d = fbTime(st);
    return { dur: Math.max(5000, Math.min(d, sl.kind === "result" ? 26000 : 18000)), reveal: 0 };
  }

  /* ---------- one player ---------- */
  function Player(root, samples) {
    this.root = root;
    this.samples = samples;
    this.si = 0;          // sample index
    this.k = 0;           // slide index
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
    ["wheel", "touchstart", "mousedown", "keydown"].forEach(function (ev) {
      self.screen.addEventListener(ev, function () { self.userScrolled = true; }, { passive: true });
    });
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
      if (e.key === "ArrowRight") { self.show(Math.min(self.k + 1, self.slides.length - 1)); e.preventDefault(); }
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
    var slides = this.slides = group(d.steps || []);
    var ci = 0;
    slides.forEach(function (sl) { sl.no = sl.kind === "pair" ? ++ci : 0; sl.t = timing(sl); });
    this.prog.innerHTML = slides.map(function (sl, j) {
      return '<button type="button" class="wt-seg" aria-label="Step ' + (j + 1) + " of " + slides.length + ": " +
        esc(self.slideLabel(sl)) + '"><i></i></button>';
    }).join("");
    this.segs = Array.prototype.slice.call(this.prog.querySelectorAll(".wt-seg"));
    this.segs.forEach(function (b, j) { b.addEventListener("click", function () { self.show(j); if (!self.userPaused && !REDUCE) self.play(); }); });

    var dots = this.root.querySelectorAll(".wt-dot");
    Array.prototype.forEach.call(dots, function (dd, j) {
      dd.classList.toggle("on", j === self.si);
      if (j === self.si) dd.setAttribute("aria-current", "true"); else dd.removeAttribute("aria-current");
    });
    var cc = this.root.querySelector(".wt-ccount");
    if (cc) cc.textContent = (this.si + 1) + " / " + this.samples.length + " · " + (d.title || d.id);
    this.show(0);
  };

  Player.prototype.slideLabel = function (sl) {
    var st = sl.step || sl.code;
    return st.label || KIND[st.type] || "";
  };

  function head(kind, tag, label) {
    return '<div class="wt-step-h wt-h-' + kind + '">' + ICON[kind] + '<span class="wt-step-k">' + esc(tag) + "</span>" +
      (label ? '<span class="wt-step-l">' + esc(label) + "</span>" : "") + "</div>";
  }
  function fbBody(st, base) {
    return (st.text ? '<p class="wt-text wt-callout">' + rich(st.text) + "</p>" : "") + kvBlock(st.kv) + mediaGrid(st.media, base);
  }

  Player.prototype.renderSlide = function (sl) {
    var base = this.samples[this.si].base;
    if (sl.kind === "pair") {
      var c = sl.code;
      var html = '<div class="wt-step wt-pair' + (sl.fbs.length ? "" : " solo") + '">' +
        '<section class="wt-pc">' + head("code", "Step " + sl.no + " · Code", c.label) +
        (c.text ? '<p class="wt-text">' + rich(c.text) + "</p>" : "") + codeBlock(c.code || "") + "</section>";
      if (sl.fbs.length) {
        html += '<div class="wt-link" aria-hidden="true"><span class="wt-link-line"></span>' +
          '<span class="wt-link-tag">' + ICON.next + "output</span><span class=\"wt-link-line\"></span></div>" +
          '<section class="wt-pf"><p class="wt-wait">running…</p>' +
          sl.fbs.map(function (f) {
            return '<div class="wt-fb">' + head("feedback", "Feedback", f.label) + fbBody(f, base) + "</div>";
          }).join("") + "</section>";
      }
      return html + "</div>";
    }
    var st = sl.step, kind = sl.kind;
    var out = '<div class="wt-step wt-is-' + kind + '">' + head(kind, KIND[kind], st.label);
    if (kind === "result") {
      if (st.text) out += '<p class="wt-text">' + rich(st.text) + "</p>";
      out += mediaGrid(st.media, base) + kvBlock(st.kv);
      if (st.code) out += '<div class="wt-file">scene_world.py (excerpt)</div>' + codeBlock(st.code);
    } else if (kind === "code") {
      out += codeBlock(st.code || "");
    } else {
      out += fbBody(st, base);
    }
    return out + "</div>";
  };

  Player.prototype.show = function (j) {
    var slides = this.slides;
    if (!slides.length) return;
    this.k = Math.max(0, Math.min(j, slides.length - 1));
    this.elapsed = 0;
    this.ended = false;
    var sl = slides[this.k];
    this.stopVideos();
    this.screen.innerHTML = this.renderSlide(sl);
    this.screen.scrollTop = 0;
    this.userScrolled = false;
    this.nowLabel.textContent = this.slideLabel(sl);
    this.nowCount.textContent = (this.k + 1) + " / " + slides.length;
    var self = this;
    this.segs.forEach(function (b, i) {
      b.classList.toggle("done", i < self.k);
      b.classList.toggle("cur", i === self.k);
      if (i === self.k) b.setAttribute("aria-current", "step"); else b.removeAttribute("aria-current");
      b.querySelector("i").style.width = i < self.k ? "100%" : "0%";
    });
    // wide images (BEV strips, sheets) take a full row once their size is known
    Array.prototype.forEach.call(this.screen.querySelectorAll(".wt-fig img"), function (img) {
      var lim = img.closest(".wt-pf") ? 2.6 : 2.2;   // the narrower output column keeps 2.3:1 crops two-up
      function mark() { if (img.naturalWidth / Math.max(1, img.naturalHeight) > lim) img.closest(".wt-fig").classList.add("wide"); }
      if (img.complete) mark(); else img.addEventListener("load", mark);
    });
    this.pair = this.screen.querySelector(".wt-pair");
    this.pre = this.screen.querySelector(".wt-pc .wt-code");
    this.lines = Array.prototype.slice.call(this.screen.querySelectorAll(".wt-pc .wt-ln, .wt-is-code .wt-ln"));
    this.typeEnd = Math.min(sl.t.reveal * 0.55, this.lines.length * 160);
    if (this.playing && !REDUCE) this.arm(); else this.revealAll();
    this.startVideos();
    this.preload(this.k + 1);
    this.setPlayIcon();
  };

  // start-of-slide state while playing: code types in, feedback waits
  Player.prototype.arm = function () {
    this.typing = this.lines.length > 0;
    this.lines.forEach(function (l) { l.classList.add("hid"); });
    this.revealed = !(this.pair && this.screen.querySelector(".wt-pf"));
    if (!this.revealed) this.pair.classList.add("pending");
  };
  Player.prototype.revealAll = function () {
    this.typing = false;
    this.revealed = true;
    if (this.lines) this.lines.forEach(function (l) { l.classList.remove("hid"); });
    if (this.pair) this.pair.classList.remove("pending");
  };

  Player.prototype.preload = function (j) {
    var sl = this.slides[j];
    if (!sl) return;
    var base = this.samples[this.si].base;
    var list = [];
    (sl.fbs || []).concat(sl.step ? [sl.step] : []).forEach(function (st) { list = list.concat(st.media || []); });
    list.forEach(function (m) { if (!isVideo(m.src)) { var im = new Image(); im.src = new URL(m.src, base).href; } });
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
    if (this.elapsed === 0 && !REDUCE) this.arm();   // a slide shown while paused replays from its start
    var self = this;
    this.raf = requestAnimationFrame(function f(ts) { self.tick(ts); if (self.playing) self.raf = requestAnimationFrame(f); });
    this.setPlayIcon();
  };
  Player.prototype.pause = function () {
    this.playing = false;
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = null;
    this.revealAll();
    this.setPlayIcon();
  };
  Player.prototype.autoplay = function () { if (this.visible && !this.userPaused && !REDUCE) this.play(); };

  Player.prototype.tick = function (ts) {
    var dt = this.last == null ? 0 : Math.min(ts - this.last, 100);
    this.last = ts;
    this.elapsed += dt;
    var sl = this.slides[this.k], dur = sl.t.dur, reveal = sl.t.reveal;
    var seg = this.segs[this.k];
    if (seg) seg.querySelector("i").style.width = Math.min(100, (this.elapsed / dur) * 100) + "%";
    if (this.typing && this.lines.length) {
      var n = Math.ceil((this.elapsed / Math.max(1, this.typeEnd)) * this.lines.length);
      for (var i = 0; i < this.lines.length && i < n; i++) this.lines[i].classList.remove("hid");
      if (this.pre && n > 0) {   // keep the newest typed line in view inside a capped code box
        var lastLine = this.lines[Math.min(n, this.lines.length) - 1];
        var below = lastLine.offsetTop + lastLine.offsetHeight - this.pre.clientHeight + 14;
        if (below > this.pre.scrollTop) this.pre.scrollTop = below;
      }
      if (n >= this.lines.length) this.typing = false;
    }
    if (!this.revealed && this.elapsed >= reveal) {
      this.revealed = true;
      this.pair.classList.remove("pending");
      if (this.pre) this.pre.scrollTop = 0;
    }
    // content taller than the screen scrolls down slowly after the feedback appeared (unless the reader scrolled)
    var over = this.screen.scrollHeight - this.screen.clientHeight;
    if (over > 4 && !this.userScrolled && !REDUCE && this.revealed) {
      var t0 = Math.max(reveal + 1200, dur * 0.35), t1 = dur * 0.88;
      var p = Math.max(0, Math.min(1, (this.elapsed - t0) / Math.max(1, t1 - t0)));
      this.screen.scrollTop = Math.round(p * p * (3 - 2 * p) * over);
    }
    if (this.elapsed >= dur) {
      if (this.k < this.slides.length - 1) { this.show(this.k + 1); }
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
