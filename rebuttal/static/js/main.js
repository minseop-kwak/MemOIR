/*
 * Rebuttal video sets.
 * Each tab loads   `${dir}/${tab.id}/${key}.mp4`   for every [key, label] in `rows`
 * ([key, label, 'jpg'|'png'] shows a still image instead of a video).
 * A missing file just stays as a placeholder, so drop videos in and they appear.
 * A tab can override `rows`, and can set `events: [{ t: seconds, label }]` to mark
 * moments on the shared scrubber (e.g. the chunk boundary).
 * A set can give `aspect` (CSS aspect-ratio for its slots, default 3 / 2), and
 * `native: true` to resize each slot to its video's own aspect once it loads.
 * Keys starting with `ours` are highlighted.
 */
const MEDIA_V = '202611170329';   // appended to every video/image URL so a browser never shows a stale cached file

const scenes = (n, prefix = 'scene') =>
  Array.from({ length: n }, (_, i) => ({ id: `${prefix}-0${i + 1}`, label: `Scene ${i + 1}` }));

const SETS = {
  /* 01 Robustness */
  'noisy-boxes': {
    dir: 'videos/robustness/noisy-boxes',
    tabs: scenes(5),
    rows: [
      [['condition', 'Clean Condition'], ['condition-jitter', 'Jittered Boxes (σ = 0.3 m)'], ['condition-dropout', 'Flickering Boxes (30% dropped)']],
      [['ours', 'MemOIR · Clean'], ['ours-jitter', 'MemOIR · Jittered'], ['ours-dropout', 'MemOIR · Flickering']],
    ],
  },
  'id-switch': {
    dir: 'videos/robustness/id-switch',
    tabs: [   // events: frame at which the target's box gets a new instance ID (12 fps)
      { id: 'scene-01', label: 'Scene 1', events: [{ t: 3.333, label: 'ID change' }] },
      { id: 'scene-02', label: 'Scene 2', events: [{ t: 3.333, label: 'ID change' }] },
      { id: 'scene-03', label: 'Scene 3', events: [{ t: 3.167, label: 'ID change' }] },
    ],
    rows: [[['condition', 'Condition (Box ID Changes)'], ['control', 'MemOIR, Same ID (Control)'], ['ours', 'MemOIR, ID Changed (Ours)']]],
  },

  /* 02 Instance memory beyond vehicles (Cosmos-Predict2.5, Lyft L5 zero-shot) */
  revisit: {
    dir: 'videos/consistency/revisit',
    tabs: [   // events: start of the reverse replay (frame 93) at each clip's native fps
      { id: 'scene-01', label: 'Scene 1', events: [{ t: 7.75, label: 'Reverse' }] },
      { id: 'scene-02', label: 'Scene 2', events: [{ t: 9.3, label: 'Reverse' }] },
      { id: 'scene-03', label: 'Scene 3', events: [{ t: 9.3, label: 'Reverse' }] },
      { id: 'scene-04', label: 'Scene 4', events: [{ t: 7.75, label: 'Reverse' }] },
    ],
    rows: [[['real', 'Real Video'], ['no-memory', 'No Memory'], ['ours', 'With Instance Memory (Ours)']]],
  },

  /* 03 Memory on another backbone (Wan2.1-VACE) */
  'wan-faces': {
    dir: 'videos/consistency/faces',
    aspect: '64 / 61',
    tabs: [   // user 11-16: CelebV-HQ faces ckpt 8000; events: chunk 2 starts at frame 81 (native fps)
      { id: 'scene-01', label: 'Scene 1', events: [{ t: 3.24, label: 'Chunk boundary' }] },
      { id: 'scene-02', label: 'Scene 2', events: [{ t: 3.378, label: 'Chunk boundary' }] },
      { id: 'scene-03', label: 'Scene 3', events: [{ t: 1.35, label: 'Chunk boundary' }] },
      { id: 'scene-04', label: 'Scene 4', events: [{ t: 2.703, label: 'Chunk boundary' }] },
      { id: 'scene-05', label: 'Scene 5', events: [{ t: 3.378, label: 'Chunk boundary' }] },
    ],
    rows: [[['condition', 'Condition (Pose)'], ['real', 'Real Video'], ['no-memory', 'Wan2.1-VACE (Naive)'], ['ours', 'With Instance Memory (Ours)']]],
  },
  'wan-pedestrians': {
    dir: 'videos/consistency/walkingtours',
    aspect: '53 / 30',
    tabs: [   // events: chunk boundary (target out of view) and the target's return, in seconds of the 15 fps timeline
      { id: 'scene-01', label: 'Scene 1', events: [{ t: 4.067, label: 'Chunk boundary' }, { t: 6.6, label: 'Return' }] },
      { id: 'scene-02', label: 'Scene 2', events: [{ t: 3.067, label: 'Chunk boundary' }, { t: 4.2, label: 'Return' }] },
      { id: 'scene-03', label: 'Scene 3', events: [{ t: 3.267, label: 'Chunk boundary' }, { t: 7.867, label: 'Return' }] },
    ],
    rows: [
      [['condition', 'Condition (Depth)'], ['real', 'Real Video']],
      [['no-memory', 'Wan2.1-VACE (No Memory)'], ['ours', 'With Instance Memory (Ours)']],
    ],
  },

  /* 04 Zero-shot Lyft L5 */
  'lyft-matched': {
    dir: 'videos/lyft/matched',
    tabs: scenes(8),   // user 11-16: 8 Lyft scenes (rebuttal_build/lyft_matched8.txt order); ours = f61 it2000 (= 80-scene table)
    rows: [
      [['condition', 'Blocks-World Condition'], ['real', 'Real Video'], ['ours-noff', 'MemOIR (Ours, No Initial Frame)']],
      [['dreamforge', 'DreamForge'], ['magicdrive-v2', 'MagicDrive-V2'], ['ours', 'MemOIR (Ours)']],
    ],
  },
  'lyft-fullchunk': {
    dir: 'videos/lyft/full-chunk',
    tabs: scenes(3),
    rows: [[['real', 'Real Video'], ['short-ft', 'MemOIR (25-frame fine-tuning)'], ['ours', 'MemOIR (full-chunk fine-tuning)']]],
  },

  /* 05 Blocks world from a single image */
  'single-image': {
    dir: 'videos/single-image/automatic',
    aspect: '16 / 9',
    tabs: scenes(3),   // user 11-16: one full-width construction timelapse per scene (AV2 ed6ad297, AV2 389069d7, Waymo 7331965)
    rows: [[['construction', 'Automatic Construction from a Single Image']]],
  },
  'agent-refine': {
    dir: 'videos/single-image/agent',
    aspect: '16 / 9',
    tabs: scenes(1),   // user 11-16: one full-width closed-loop agent timelapse (AV2 ed6ad297, same scene as 4.1 Scene 1)
    rows: [[['construction', 'LLM-Agent Refinement from a Single Image']]],
  },
  'agent-drive': {
    dir: 'videos/single-image/agent-drive',
    tabs: scenes(1),   // user 11-16: MemOIR drive through the agent-refined world (f61 it2000, first frame = initial image)
    rows: [[['condition', 'Blocks-World Condition'], ['ours', 'MemOIR (Ours)']]],
  },
};

/* ---------- helpers ---------- */
function el(tag, className, attrs = {}) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  return node;
}

function placeholder(label, src) {
  const ph = el('div', 'ph');
  const name = el('span', 'ph-label');
  name.textContent = label;
  const path = el('code');
  path.textContent = src;
  ph.append(name, path);
  return ph;
}

function makeVideo(src, onReady) {
  const v = el('video');
  v.muted = true;
  v.loop = true;
  v.playsInline = true;
  v.preload = 'auto';
  v.addEventListener('loadeddata', onReady, { once: true });
  v.src = src;
  return v;
}

function fmt(t) {
  if (!isFinite(t)) t = 0;
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

/* ---------- synced playback ---------- */

class SyncGroup {
  constructor(bar) {
    this.videos = [];
    this.playing = true;
    this.rate = 1;
    this.bar = bar;
    this.btn = bar.querySelector('button');
    this.range = bar.querySelector('input');
    this.time = bar.querySelector('.time');
    this.speed = bar.querySelector('select');

    this.btn.addEventListener('click', () => (this.playing ? this.pause() : this.play()));
    this.range.addEventListener('input', () => {
      const m = this.master;
      if (m && isFinite(m.duration)) this.seek((this.range.value / 1000) * m.duration);
    });
    this.speed.addEventListener('change', () => {
      this.rate = Number(this.speed.value);
      this.videos.forEach(v => (v.playbackRate = this.rate));
    });
  }

  get master() {
    return this.videos.find(v => v.readyState >= 2);
  }

  add(v) {
    this.videos.push(v);
    v.playbackRate = this.rate;
    v.addEventListener('loadeddata', () => {
      const m = this.master;
      if (m && m !== v) v.currentTime = m.currentTime;
      if (this.playing && this.visible) v.play().catch(() => {});
    });
    v.addEventListener('timeupdate', () => {
      if (v === this.master) this.tick(v);
    });
  }

  clear() {
    this.videos.forEach(v => v.pause());
    this.videos = [];
  }

  tick(m) {
    if (isFinite(m.duration)) this.range.value = (m.currentTime / m.duration) * 1000;
    this.time.textContent = `${fmt(m.currentTime)} / ${fmt(m.duration)}`;
    for (const v of this.videos) {
      if (v !== m && v.readyState >= 2 && Math.abs(v.currentTime - m.currentTime) > 0.1) {
        v.currentTime = m.currentTime;
      }
    }
  }

  play() {
    this.playing = true;
    this.btn.textContent = '❚❚';
    this.btn.setAttribute('aria-label', 'Pause');
    this.videos.forEach(v => v.readyState >= 2 && v.play().catch(() => {}));
  }

  pause() {
    this.playing = false;
    this.btn.textContent = '▶';
    this.btn.setAttribute('aria-label', 'Play');
    this.videos.forEach(v => v.pause());
  }

  seek(t) {
    this.videos.forEach(v => v.readyState >= 1 && (v.currentTime = t));
  }

  setVisible(visible) {
    this.visible = visible;
    if (!visible) this.videos.forEach(v => v.pause());
    else if (this.playing) this.play();
  }

  setEvents(events = [], duration) {
    const track = this.bar.querySelector('.track');
    track.querySelectorAll('.marker').forEach(n => n.remove());
    if (!duration) return;
    for (const e of events) {
      const mk = el('span', 'marker');
      mk.textContent = e.label;
      mk.style.left = `${(e.t / duration) * 100}%`;
      track.append(mk);
    }
  }
}

function makeSyncBar() {
  const bar = el('div', 'sync');
  bar.innerHTML = `
    <button type="button" aria-label="Pause">❚❚</button>
    <div class="track"><input type="range" min="0" max="1000" value="0" aria-label="Seek"></div>
    <span class="time">0:00 / 0:00</span>
    <select class="speed" aria-label="Playback speed">
      <option value="0.25">0.25×</option>
      <option value="0.5">0.5×</option>
      <option value="1" selected>1×</option>
    </select>`;
  return bar;
}

/* ---------- comparison blocks ---------- */

function buildCompare(root) {
  const set = SETS[root.dataset.set];
  if (!set) return;

  if (set.aspect) root.style.setProperty('--aspect', set.aspect);
  const tabs = el('div', 'tabs', { role: 'tablist' });
  const panels = el('div', 'panels');
  const bar = makeSyncBar();
  const group = new SyncGroup(bar);

  const panelFor = set.tabs.map((tab, i) => {
    const btn = el('button', 'tab', { type: 'button', role: 'tab', 'aria-selected': i === 0 ? 'true' : 'false' });
    btn.textContent = tab.label;
    tabs.append(btn);

    const panel = el('div', 'panel', { role: 'tabpanel' });
    panel.hidden = i !== 0;
    const rows = tab.rows || set.rows;
    const ncol = Math.max(...rows.map(r => r.length));
    for (const row of rows) {
      const r = el('div', 'grid-row');
      r.style.setProperty('--n', ncol);
      r.style.setProperty('--k', row.length);
      for (const [key, label, ext = 'mp4'] of row) {
        const fig = el('figure', 'slot' + (key.startsWith('ours') ? ' is-ours' : '') + ((set.contain || []).includes(key) ? ' is-contain' : ''));
        const src = `${set.dir}/${tab.id}/${key}.${ext}?v=${MEDIA_V}`;
        fig.dataset.src = src;
        fig.dataset.kind = ext === 'mp4' ? 'video' : 'image';
        const media = el('div', 'slot-media');
        media.append(placeholder(label, src));
        const cap = el('figcaption');
        cap.textContent = label;
        fig.append(media, cap);
        r.append(fig);
      }
      panel.append(r);
    }
    panels.append(panel);

    btn.addEventListener('click', () => activate(i));
    return panel;
  });

  function activate(i) {
    [...tabs.children].forEach((b, j) => b.setAttribute('aria-selected', j === i ? 'true' : 'false'));
    panelFor.forEach((p, j) => (p.hidden = j !== i));
    group.clear();
    group.setEvents();

    const tab = set.tabs[i];
    panelFor[i].querySelectorAll('.slot').forEach(fig => {
      if (fig.dataset.kind === 'image') {
        if (!fig.querySelector('img')) {
          const img = new Image();
          img.alt = fig.querySelector('figcaption').textContent;
          img.onload = () => {
            fig.querySelector('.slot-media').prepend(img);
            fig.classList.add('is-loaded');
          };
          img.src = fig.dataset.src;
        }
        return;
      }
      let v = fig.querySelector('video');
      if (!v) {
        v = makeVideo(fig.dataset.src, () => {
          fig.classList.add('is-loaded');
          if (set.native && v.videoWidth) fig.style.setProperty('--aspect', `${v.videoWidth} / ${v.videoHeight}`);
          if (tab.events && v === group.master) group.setEvents(tab.events, v.duration);
        });
        fig.querySelector('.slot-media').prepend(v);
      }
      group.add(v);
    });
    if (group.playing) group.play();
  }

  root.append(tabs, panels, bar);

  // Load the first tab only once the block scrolls near the viewport.
  let started = false;
  new IntersectionObserver(entries => {
    for (const e of entries) {
      if (e.isIntersecting && !started) {
        started = true;
        group.visible = true;
        activate(0);
      }
      group.setVisible(e.isIntersecting);
    }
  }, { rootMargin: '200px 0px' }).observe(root);
}

/* ---------- nav: highlight the section in view ---------- */

function buildToc(nav) {
  const links = new Map([...nav.querySelectorAll('a[href^="#"]')].map(a => [a.hash.slice(1), a]));
  const sections = [...links.keys()].map(id => document.getElementById(id)).filter(Boolean);
  const update = () => {
    let current = null;
    for (const s of sections) if (s.getBoundingClientRect().top < window.innerHeight * 0.35) current = s.id;
    links.forEach((a, id) => a.classList.toggle('is-active', id === current));
  };
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();
}

document.querySelectorAll('.toc').forEach(buildToc);
document.querySelectorAll('.compare').forEach(buildCompare);

/* ---------- deep links: keep the #target heading in place while fonts / videos settle ---------- */

function keepAnchor() {
  const id = decodeURIComponent(location.hash.slice(1));
  const target = id && document.getElementById(id);
  if (!target) return;
  let active = true;
  const align = () => active && target.scrollIntoView({ behavior: 'instant', block: 'start' });
  const stop = () => { active = false; ro.disconnect(); };
  const ro = new ResizeObserver(align);
  ro.observe(document.body);
  ['wheel', 'touchstart', 'keydown', 'mousedown'].forEach(ev => window.addEventListener(ev, stop, { once: true, passive: true }));
  if (document.fonts) document.fonts.ready.then(align);
  window.addEventListener('load', align, { once: true });
  align();
  setTimeout(stop, 5000);
}
keepAnchor();
window.addEventListener('hashchange', keepAnchor);
