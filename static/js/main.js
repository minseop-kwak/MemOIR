/*
 * Video comparison sets.
 * Each tab loads   `${dir}/${tab.id}/${key}.mp4`   for every [key, label] in `rows`.
 * A missing file just stays as a placeholder, so drop videos in and they appear.
 * A tab can override `rows`, and can set `events: [{ t: seconds, label }]`
 * to mark moments on the shared scrubber (e.g. a vehicle leaving / returning).
 * A set can give `aspect` (CSS aspect-ratio for its slots, default 3 / 2), and
 * `native: true` to resize each slot to its video's own aspect once it loads.
 * Every video has a first-frame still `${key}.jpg` beside it, shown the moment its tab loads.
 * `phone: [keys]` lists videos that also have a 960-wide `${key}.m.mp4`, used on screens up to 900 px.
 */
const MEDIA_V = '202611200340';   // appended to every video URL so a browser never shows a stale cached file
const POSTER_V = '202611201330';  // first-frame stills and phone copies
const PHONE = window.matchMedia('(max-width: 900px)').matches;

const scenes = (n, prefix = 'scene') =>
  Array.from({ length: n }, (_, i) => ({ id: `${prefix}-0${i + 1}`, label: `Scene ${i + 1}` }));

const SETS = {
  /* Part 1: SceneClaw reconstructions (input | blocks world | BEV | far BEV in one video). */
  sceneclaw: {
    dir: 'videos/sceneclaw',
    aspect: '4 / 1',
    native: true,
    tabs: [
      { id: 'waymo-arterial', label: 'Waymo · Arterial' },
      { id: 'waymo-busstop', label: 'Waymo · Night Boulevard' },
      { id: 'waymo-phx-allway', label: 'Waymo · Parking Lot' },
      { id: 'waymo-phx-intersection', label: 'Waymo · Night Intersection' },
      { id: 'waymo-sf-hill', label: 'Waymo · SF Residential' },
      { id: 'av2-pittsburgh', label: 'AV2 · Pittsburgh' },
      { id: 'av2-miami', label: 'AV2 · Miami' },
      { id: 'av2-detroit', label: 'AV2 · Detroit' },
    ],
    rows: [[['combo', 'Input Video | Blocks World | BEV | Far BEV']]],
  },

  /* Part 3: one vehicle of a recorded scene edited in code; original | edited.
     BEV slots are crops of the bird's-eye view, so slots take their video's own aspect. */
  'codeworld-edit': {
    dir: 'videos/codeworld',
    native: true,
    phone: ['condition-original', 'condition-edited', 'ours-original', 'ours-edited'],   // 1224x816
    tabs: [
      { id: 'cut-in', label: 'Cut-In' },
      { id: 'merge', label: 'Overtake and Merge' },
      { id: 'right-turn', label: 'Right Turn' },
      { id: 'left-turn', label: 'Left Turn' },
      { id: 'lane-change', label: 'Lane Change' },
    ],
    // desktop: top row original, bottom row edited; column widths follow the clip aspects
    // (960x640, 960x640, 640x560) so the three panels in a row share one height
    cols: [1.5, 1.5, 640 / 560],
    rows: [
      [['condition-original', 'Original Blocks World'], ['ours-original', 'MemOIR, Original'], ['bev-original', 'Original, Bird\'s-Eye View']],
      [['condition-edited', 'Edited Blocks World'], ['ours-edited', 'MemOIR, Edited'], ['bev-edited', 'Edited, Bird\'s-Eye View']],
    ],
    // phone: keep original | edited side by side
    phoneRows: [
      [['condition-original', 'Original Blocks World'], ['condition-edited', 'Edited Blocks World']],
      [['ours-original', 'MemOIR, Original'], ['ours-edited', 'MemOIR, Edited']],
      [['bev-original', 'Original, Bird\'s-Eye View'], ['bev-edited', 'Edited, Bird\'s-Eye View']],
    ],
  },



  'counterfactual-sim': {
    dir: 'videos/counterfactual',
    tabs: [
      { id: 'carla-cutin-smoke', label: 'Scene 1' },
      { id: 'carla-beside-ctrlloss-smoke', label: 'Scene 2' },
    ],
    rows: [[['condition', 'Blocks-World Condition'], ['ours', 'MemOIR (Ours)']]],
  },

  consistency: {
    dir: 'videos/consistency',
    tabs: [
      { id: '2021.06.23.15.18.10_veh-26_00165_02848__c72__5c7e4289', label: 'Scene 1' },
      { id: '2021.07.16.18.06.21_veh-38_04933_05307__c16__b66d0d17', label: 'Scene 2' },
    ],
    rows: [
      [['condition', 'Blocks-World Condition'], ['real', 'Real Video'], ['ours', 'MemOIR (Ours)']],
    ],
  },

  'long-horizon': {
    dir: 'videos/long-horizon',
    bev: 'videos/long-horizon/bev.json?v=202611202100',   // ego route on the road map, synced to the videos
    tabs: [
      { id: 'uturn-01', label: 'U-Turn 1' },
      { id: 'uturn-02', label: 'U-Turn 2' },
      { id: 'uturn-03', label: 'U-Turn 3' },
      { id: 'straight-01', label: 'Straight 1' },
      { id: 'straight-02', label: 'Straight 2' },
      { id: 'straight-03', label: 'Straight 3' },
    ],
    rows: [
      [['condition', 'Blocks-World Condition'], ['ours', 'MemOIR (Ours)']],
      [['magi-1', 'MAGI-1 (24B)'], ['epona', 'Epona'], ['cosmos-naive', 'Cosmos-Predict2.5 (Naive)'], ['omnidreams', 'OmniDreams']],
    ],
  },

  'ablation-kv': {
    dir: 'videos/ablation/kv-cache',
    tabs: [
      { id: 'scene-04', label: 'Scene 1' },
      { id: 'scene-01', label: 'Scene 2' },
    ],
    rows: [
      [['condition', 'Blocks-World Condition'], ['real', 'Real Video'], ['ours', '+ Warped RoPE (Ours)']],
      [['no-kv', 'Baseline (No KV Memory)'], ['naive-kv', '+ Naïve KV Caching'], ['instance-kv', '+ Instance-level Caching']],
    ],
  },



  /* Single image -> blocks world (Part 1) */
  'agent-refine': {
    dir: 'videos/single-image/agent',
    aspect: '16 / 9',
    phone: ['construction'],   // 1920x1080
    tabs: scenes(1),
    rows: [[['construction', 'LLM-Agent Refinement from a Single Image']]],
  },
  'agent-drive': {
    dir: 'videos/single-image/agent-drive',
    tabs: scenes(1),
    rows: [[['condition', 'Blocks-World Condition'], ['ours', 'MemOIR (Ours)']]],
  },

  /* Zero-shot Lyft L5 */
  'lyft-matched': {
    dir: 'videos/lyft/matched',
    tabs: scenes(8),
    rows: [
      [['condition', 'Blocks-World Condition'], ['real', 'Real Video'], ['ours-noff', 'MemOIR (Ours, No Initial Frame)']],
      [['dreamforge', 'DreamForge'], ['magicdrive-v2', 'MagicDrive-V2'], ['ours', 'MemOIR (Ours)']],
    ],
  },

  /* Instance memory: revisits, pedestrians, faces */
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
  'wan-pedestrians': {
    dir: 'videos/consistency/walkingtours',
    aspect: '53 / 30',
    tabs: [   // events: chunk boundary (target out of view) and the target's return (15 fps timeline)
      { id: 'scene-01', label: 'Scene 1', events: [{ t: 4.067, label: 'Chunk boundary' }, { t: 6.6, label: 'Return' }] },
      { id: 'scene-02', label: 'Scene 2', events: [{ t: 3.067, label: 'Chunk boundary' }, { t: 4.2, label: 'Return' }] },
      { id: 'scene-03', label: 'Scene 3', events: [{ t: 3.267, label: 'Chunk boundary' }, { t: 7.867, label: 'Return' }] },
    ],
    rows: [
      [['condition', 'Condition (Depth)'], ['real', 'Real Video']],
      [['no-memory', 'Wan2.1-VACE (No Memory)'], ['ours', 'With Instance Memory (Ours)']],
    ],
  },
  'wan-faces': {
    dir: 'videos/consistency/faces',
    aspect: '64 / 61',
    tabs: [   // events: chunk 2 starts at frame 81 (native fps)
      { id: 'scene-01', label: 'Scene 1', events: [{ t: 3.24, label: 'Chunk boundary' }] },
      { id: 'scene-02', label: 'Scene 2', events: [{ t: 3.378, label: 'Chunk boundary' }] },
      { id: 'scene-03', label: 'Scene 3', events: [{ t: 1.35, label: 'Chunk boundary' }] },
      { id: 'scene-04', label: 'Scene 4', events: [{ t: 2.703, label: 'Chunk boundary' }] },
      { id: 'scene-05', label: 'Scene 5', events: [{ t: 3.378, label: 'Chunk boundary' }] },
    ],
    rows: [[['condition', 'Condition (Pose)'], ['real', 'Real Video'], ['no-memory', 'Wan2.1-VACE (Naive)'], ['ours', 'With Instance Memory (Ours)']]],
  },

  appearance: {
    dir: 'videos/appearance',
    tabs: [
      { id: 'scene-01', label: 'Scene 1' },
      { id: 'scene-02', label: 'Scene 2' },
    ],
    rows: [
      [['condition', 'Blocks-World Condition'], ['prompt-1', 'Prompt 1'], ['prompt-2', 'Prompt 2']],
      [['prompt-3', 'Prompt 3'], ['prompt-4', 'Prompt 4'], ['prompt-5', 'Prompt 5']],
    ],
  },

  freeview: {
    dir: 'videos/freeview',
    tabs: [
      { id: 'orbit', label: 'Orbit' },
      { id: 'low-orbit', label: 'Low Orbit' },
      { id: 'span', label: 'Span' },
      { id: 'low-span', label: 'Low Span' },
      { id: 'survey', label: 'Survey' },
      { id: 'crane', label: 'Crane' },
      { id: 'fpv', label: 'Low FPV' },
    ],
    rows: [[['condition', 'Blocks-World Canvas'], ['ours', 'Generated']]],
  },

  pedestrian: {
    dir: 'videos/pedestrian',
    tabs: [
      { id: 'clip-01', label: 'Clip 1' },
      { id: 'clip-02', label: 'Clip 2' },
    ],
    rows: [[['condition', 'Condition (Box + Skeleton)'], ['ours', 'Generated']]],
  },

  ablation: {
    dir: 'videos/ablation',
    tabs: [
      {
        id: 'stationary',
        label: 'w/o Stationary Instances',
        rows: [[['condition', 'Condition'], ['ablated', 'w/o Stationary'], ['ours', 'Full Model']]],
      },
      {
        id: 'kv-cache',
        label: 'w/o KV Caching',
        rows: [[['condition', 'Condition'], ['ablated', 'w/o KV Caching'], ['ours', 'Full Model']]],
      },
    ],
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

/* ---------- download parking ----------
   A video whose block was scrolled past (or whose tab was hidden) stops downloading, so the block in view gets
   the connection; its poster stays in place. unpark() resumes it from the same time. Complete downloads are kept. */

function park(v) {
  const src = v.getAttribute('src');
  if (!src) return;
  const b = v.buffered;
  if (isFinite(v.duration) && b.length && b.start(0) <= 0.05 && b.end(b.length - 1) >= v.duration - 0.05) return;
  v.dataset.t = v.currentTime;
  v.dataset.parked = src;
  v.removeAttribute('src');
  v.load();
}

function unpark(v) {
  if (v.getAttribute('src') || !v.dataset.parked) return;
  const t = Number(v.dataset.t) || 0;
  if (t) v.addEventListener('loadedmetadata', () => { v.currentTime = t; }, { once: true });
  v.src = v.dataset.parked;
  delete v.dataset.parked;
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
    this.videos.forEach(v => { v.pause(); park(v); });   // tab switch: the hidden tab stops downloading
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
    if (visible) {
      this.seen = true;
      this.videos.forEach(unpark);                    // resume downloads stopped when the block left the screen
      if (this.playing) this.play();
      return;
    }
    this.videos.forEach(v => v.pause());
    if (this.seen) this.videos.forEach(park);         // scrolled past (not merely loaded ahead): free the link
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
    const phoneRows = PHONE && set.phoneRows;
    for (const row of tab.rows || phoneRows || set.rows) {
      const r = el('div', 'grid-row');
      r.style.setProperty('--n', row.length);
      if (set.cols && !phoneRows && set.cols.length === row.length)
        r.style.setProperty('--cols', set.cols.map(c => `minmax(0, ${c}fr)`).join(' '));
      for (const [key, label] of row) {
        const fig = el('figure', 'slot' + (key.startsWith('ours') ? ' is-ours' : ''));
        const base = `${set.dir}/${tab.id}/${key}`;
        const src = PHONE && set.phone && set.phone.includes(key) ? `${base}.m.mp4?v=${POSTER_V}` : `${base}.mp4?v=${MEDIA_V}`;
        fig.dataset.src = src;
        fig.dataset.poster = `${base}.jpg?v=${POSTER_V}`;
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

    // Stills first: each slot shows its first-frame still at once; the videos are requested only once the
    // stills are in (or after 1.5 s), so on a slow link the stills never queue behind video data.
    const tab = set.tabs[i];
    if (bev) bev.show(tab.id);
    const stills = [];
    const waiting = [];
    panelFor[i].querySelectorAll('.slot').forEach(fig => {
      let v = fig.querySelector('video');
      if (!v) {
        v = el('video');
        v.muted = true;
        v.loop = true;
        v.playsInline = true;
        v.preload = 'auto';
        v.poster = fig.dataset.poster;
        v.addEventListener('loadeddata', () => {
          fig.classList.add('is-loaded');
          if (set.native && v.videoWidth) fig.style.setProperty('--aspect', `${v.videoWidth} / ${v.videoHeight}`);
          if (tab.events && v === group.master) group.setEvents(tab.events, v.duration);
        }, { once: true });
        stills.push(new Promise(done => {
          const still = new Image();                   // same request as the poster
          still.onload = () => {
            fig.classList.add('is-loaded');
            if (set.native && !v.videoWidth) fig.style.setProperty('--aspect', `${still.naturalWidth} / ${still.naturalHeight}`);
            done();
          };
          still.onerror = done;                        // no still: the video alone fills the slot
          still.src = fig.dataset.poster;
        }));
        fig.querySelector('.slot-media').prepend(v);
      }
      if (!v.getAttribute('src')) waiting.push([fig, v]);
      group.add(v);
    });
    const go = () => waiting.forEach(([fig, v]) => {
      if (v.dataset.parked) unpark(v);
      else if (!v.getAttribute('src')) v.src = fig.dataset.src;
    });
    Promise.race([Promise.all(stills), new Promise(r => setTimeout(r, 1500))]).then(go);
    if (group.playing && group.visible) group.play();   // preloaded a screen early: wait until in view
  }


  if (set.tabs.length > 1) root.append(tabs);   // a single scene needs no tab
  const bev = set.bev ? new BevRoute(set.bev, group) : null;
  if (bev) {
    const body = el('div', 'bev-body');
    body.append(panels, bev.node);
    root.append(body, bar);
  } else root.append(panels, bar);

  // Load the first tab about one screen before the block scrolls into view; play only while it is (nearly) visible.
  new IntersectionObserver((entries, ob) => {
    if (!entries.some(e => e.isIntersecting)) return;
    ob.disconnect();
    activate(0);
  }, { rootMargin: '100% 0px' }).observe(root);
  new IntersectionObserver(entries => {
    for (const e of entries) group.setVisible(e.isIntersecting);
  }, { rootMargin: '200px 0px' }).observe(root);
}

/* ---------- BEV route (long-horizon block) ---------- */

// Bird's-eye view of the ego route on the road map. The marker follows the synced videos: video time t = pose frame
// t * fps. Tall panel beside the grid; on narrow screens a wide strip under it (the map turned 90 degrees).
const SVGNS = 'http://www.w3.org/2000/svg';
function sv(tag, attrs = {}, parent) {
  const n = document.createElementNS(SVGNS, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  if (parent) parent.append(n);
  return n;
}
const BEV_PHASES = { r: ['Real Drive', '#3b6fb6'], t: ['U-Turn', '#e08a1e'], b: ['Return', '#c0392b'] };

class BevRoute {
  constructor(url, group) {
    this.url = url;
    this.group = group;
    this.node = el('figure', 'bev');
    this.box = el('div', 'bev-map');
    this.cap = el('figcaption');
    this.legend = el('div', 'bev-legend');
    this.node.append(this.box, this.cap, this.legend);
    this.wide = window.matchMedia('(max-width: 720px)');
    this.wide.addEventListener('change', () => this.render());
    new ResizeObserver(() => this.scale()).observe(this.box);
    this.loop = this.loop.bind(this);
  }

  show(id) {
    this.id = id;
    if (!this.data) {
      this.data = fetch(this.url).then(r => r.json()).then(d => { this.data = d; this.render(); }).catch(() => {});
      return;
    }
    if (!(this.data instanceof Promise)) this.render();
  }

  // world (rotated scene frame, metres, y up) -> screen units (metres, y down)
  xy(x, y) {
    const [x0, y0, x1, y1] = this.d.box;
    return this.isWide ? [y - y0, x - x0] : [x - x0, y1 - y];
  }

  pts(flat) {
    const out = [];
    for (let i = 0; i < flat.length; i += 2) out.push(this.xy(flat[i], flat[i + 1]));
    return out;
  }

  render() {
    const d = this.data && this.data[this.id];
    if (!d) return;
    this.d = d;
    this.isWide = this.wide.matches;
    this.node.classList.toggle('is-wide', this.isWide);
    const [x0, y0, x1, y1] = d.box;
    const W = this.isWide ? y1 - y0 : x1 - x0, H = this.isWide ? x1 - x0 : y1 - y0;
    this.W = W; this.H = H;
    this.box.textContent = '';
    const svg = sv('svg', { viewBox: `0 0 ${W.toFixed(1)} ${H.toFixed(1)}`, preserveAspectRatio: 'xMidYMid meet', role: 'img',
                            'aria-label': 'Bird\'s-eye view of the ego route' }, this.box);
    this.svg = svg;
    const P = a => a.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
    sv('rect', { x: -W, y: -H, width: 3 * W, height: 3 * H, class: 'bev-ground' }, svg);
    const gB = sv('g', { class: 'bev-blocks' }, svg);
    d.blocks.forEach(b => sv('polygon', { points: P(this.pts(b)) }, gB));
    const lanes = d.lanes.map(l => P(this.pts(l)));
    const gE = sv('g', { class: 'bev-road-edge' }, svg);
    const gR = sv('g', { class: 'bev-road' }, svg);
    lanes.forEach(l => { sv('polyline', { points: l }, gE); sv('polyline', { points: l }, gR); });
    const gC = sv('g', { class: 'bev-cross' }, svg);
    d.cross.forEach(c => sv('polygon', { points: P(this.pts(c)) }, gC));

    // route: faint whole route, then the travelled part on top, one polyline per phase
    this.E = this.pts(d.ego);
    const runs = [];
    for (let k = 0; k < d.phase.length; k++) {
      if (!runs.length || runs[runs.length - 1].ph !== d.phase[k]) runs.push({ ph: d.phase[k], a: Math.max(k - 1, 0), b: k });
      else runs[runs.length - 1].b = k;
    }
    const gF = sv('g', { class: 'bev-route-faint' }, svg);
    const gT = sv('g', { class: 'bev-route' }, svg);
    runs.forEach(r => {
      const col = BEV_PHASES[r.ph][1];
      sv('polyline', { points: P(this.E.slice(r.a, r.b + 1)), stroke: col }, gF);
      r.line = sv('polyline', { points: '', stroke: col }, gT);
    });
    this.runs = runs;
    const s0 = this.E[0];
    this.startDot = sv('circle', { cx: s0[0], cy: s0[1], class: 'bev-start', fill: BEV_PHASES[d.phase[0]][1] }, svg);
    this.startTxt = sv('text', { class: 'bev-label' }, svg);
    this.startTxt.textContent = 'Start';
    this.scaleBar = sv('g', { class: 'bev-scale' }, svg);
    this.ego = sv('g', { class: 'bev-ego' }, svg);
    this.egoShape = sv('path', {}, this.ego);

    const used = [...new Set(d.phase)];
    this.legend.textContent = '';
    (used.length > 1 ? used : ['r']).forEach(ph => {
      const it = el('span', 'bev-key');
      it.style.setProperty('--c', BEV_PHASES[ph][1]);
      it.textContent = used.length > 1 ? BEV_PHASES[ph][0] : 'Ego Route';
      this.legend.append(it);
    });
    this.cap.textContent = 'Bird\'s-Eye View';
    this.k = -1;
    this.scale();
    if (!this.raf) this.raf = requestAnimationFrame(this.loop);
  }

  // sizes given in screen pixels -> map units (the map is drawn in metres)
  scale() {
    if (!this.svg) return;
    const r = this.svg.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const u = Math.max(this.W / r.width, this.H / r.height);     // metres per pixel ('meet')
    this.u = u;
    this.svg.style.setProperty('--route-w', (3 * u).toFixed(3));
    this.svg.style.setProperty('--faint-w', (2.2 * u).toFixed(3));
    this.svg.style.setProperty('--edge-w', (3.6 + 1.6 * u).toFixed(3));
    this.startDot.setAttribute('r', (4 * u).toFixed(2));
    const s0 = this.E[0];
    const fs = 11 * u;
    this.startTxt.setAttribute('font-size', fs.toFixed(2));
    this.startTxt.setAttribute('x', s0[0]);                       // below the start dot
    this.startTxt.setAttribute('y', s0[1] + 8 * u + fs * 0.8);
    this.startTxt.setAttribute('text-anchor', 'middle');
    // scale bar: a round length near a third of the map's short side; bottom-left (tall) or top-left (wide) corner
    const short = Math.min(this.W, this.H);
    const len = [10, 20, 25, 50, 100].reduce((a, b) => (Math.abs(b - short * 0.3) < Math.abs(a - short * 0.3) ? b : a));
    this.scaleBar.textContent = '';
    const x = 10 * u, y = this.isWide ? 10 * u + fs * 1.3 : this.H - 10 * u;
    sv('line', { x1: x, y1: y, x2: x + len, y2: y, 'stroke-width': 1.6 * u }, this.scaleBar);
    [x, x + len].forEach(t => sv('line', { x1: t, y1: y - 3 * u, x2: t, y2: y + 0.01, 'stroke-width': 1.6 * u }, this.scaleBar));
    const t = sv('text', { x: x + len / 2, y: y - 5 * u, 'font-size': fs.toFixed(2), 'text-anchor': 'middle', class: 'bev-label' }, this.scaleBar);
    t.textContent = `${len} m`;
    const L = 15 * u;   // ego marker: an arrow head 15 px long
    this.egoShape.setAttribute('d', `M${(0.55 * L).toFixed(2)},0 L${(-0.45 * L).toFixed(2)},${(0.42 * L).toFixed(2)} L${(-0.2 * L).toFixed(2)},0 L${(-0.45 * L).toFixed(2)},${(-0.42 * L).toFixed(2)}Z`);
    this.egoShape.setAttribute('stroke-width', (1.4 * u).toFixed(2));
    this.k = -1;
  }

  loop() {
    this.raf = requestAnimationFrame(this.loop);
    if (!this.d || !this.u || !this.group.visible) return;
    const m = this.group.master;
    const n = this.d.n;
    const f = Math.min(Math.max((m ? m.currentTime : 0) * this.d.fps, 0), n - 1);
    if (f === this.k) return;
    this.k = f;
    const k = Math.floor(f), a = f - k, k2 = Math.min(k + 1, n - 1);
    const p = [this.E[k][0] + a * (this.E[k2][0] - this.E[k][0]), this.E[k][1] + a * (this.E[k2][1] - this.E[k][1])];
    // heading from the pose yaw (world, y up) turned into screen space
    let h = this.d.yaw[k];
    let dh = this.d.yaw[k2] - h;
    dh = Math.atan2(Math.sin(dh), Math.cos(dh));
    h += a * dh;
    const c = Math.cos(h), s = Math.sin(h);
    const ang = this.isWide ? Math.atan2(c, s) : Math.atan2(-s, c);
    this.ego.setAttribute('transform', `translate(${p[0].toFixed(2)},${p[1].toFixed(2)}) rotate(${(ang * 180 / Math.PI).toFixed(1)})`);
    for (const r of this.runs) {
      if (k < r.a) { r.line.setAttribute('points', ''); continue; }
      const seg = this.E.slice(r.a, Math.min(k, r.b) + 1);
      if (k < r.b) seg.push(p);
      r.line.setAttribute('points', seg.map(q => q[0].toFixed(1) + ',' + q[1].toFixed(1)).join(' '));
    }
  }
}

/* ---------- teaser wipe ---------- */

function buildWipe(root) {
  // the two layers and their videos are in the markup (fetched during parse); this adds the handle, tags and sync
  const bottom = root.querySelector('.layer.bottom');
  const top = root.querySelector('.layer.top');
  const vBottom = bottom.querySelector('video');
  const vTop = top.querySelector('video');
  const handle = el('div', 'handle');
  const tagL = el('span', 'tag left');
  const tagR = el('span', 'tag right');
  tagL.textContent = 'Blocks-World';
  tagR.textContent = 'Generated';
  vBottom.muted = vTop.muted = true;                 // muted property, not just the attribute, for autoplay policies
  [vBottom, vTop].forEach(v => {
    if (v.readyState >= 2) v.play().catch(() => {});
    else v.addEventListener('loadeddata', () => v.play().catch(() => {}), { once: true });
  });
  root.append(handle, tagL, tagR);

  vTop.addEventListener('timeupdate', () => {
    if (vBottom.readyState >= 2 && Math.abs(vBottom.currentTime - vTop.currentTime) > 0.1) {
      vBottom.currentTime = vTop.currentTime;
    }
  });
  wipeDrag(root);
}

function wipeDrag(root) {
  const setPos = x => {
    const r = root.getBoundingClientRect();
    const p = Math.min(100, Math.max(0, ((x - r.left) / r.width) * 100));
    root.style.setProperty('--pos', `${p}%`);
  };
  let dragging = false;
  root.addEventListener('pointerdown', e => {
    dragging = true;
    root.setPointerCapture(e.pointerId);
    setPos(e.clientX);
  });
  root.addEventListener('pointermove', e => {
    if (dragging || e.pointerType === 'mouse') setPos(e.clientX);
  });
  root.addEventListener('pointerup', () => (dragging = false));
  root.addEventListener('pointercancel', () => (dragging = false));
}

/* ---------- results gallery ----------
   A horizontally scrolling row of categories (cover image + name), the chosen category's examples as small
   thumbnails, and a blocks-world | generated wipe. An example plays once and the next one in the category starts
   (wrapping to the first). Files per example, under `${GALLERY.dir}/${cat.id}/${example}/`:
     canvas.mp4, generated.mp4 (+ .m.mp4 phone copies), canvas.jpg, generated.jpg (first frames), thumb.jpg
   and one `${GALLERY.dir}/${cat.id}/cover.jpg` per category. */

const GALLERY_V = '202611232300';
const GALLERY = {
  dir: 'videos/results',
  cats: [
    { id: 'driving', name: 'Driving World Generation', items: ['av2-downtown'] },
    { id: 'vehicle-motion', name: 'Counterfactual Motions', items: [
      'lyft-a009-overspeed-spin',
      'lyft-a008-wobble',
      'nusc-0521-spin',
    ] },
    { id: 'incident', name: 'Counterfactual Incident', items: [
      'lyft-a006-spin-r-fire',
      'lyft-a006-spin-r2-fire',
      'lyft-a006-wobble-r-fire',
      'lyft-a006-wobble-r2-fire',
      'lyft-a008-spin-fire',
      'lyft-a008-overspeed-fire',
      'lyft-a009-overspeed-fire',
      'lyft-a008-wobble-smoke',
      'lyft-a008-overspeed-smoke',
    ] },
    { id: 'pedestrian', name: 'Pedestrian Crossings', items: [
      'lyft-a011-jaywalk',
      'nusc-0971-jaywalk',
      'nusc-0627-jaywalk',
      'av2-80da-walk',
    ] },
    { id: 'flying-view', name: 'Flying View Generation', items: [
      'av2-5763-rise',
      'av2-8184-rise',
      'lyft-a007-rise',
      'nusc-0559-rise',
      'nusc-0103-rise',
    ] },
    { id: 'appearance', name: 'Appearance Control', items: [
      'av2-8184-rain',
      'av2-8184-snow',
      'av2-8184-sunset',
      'av2-8184-clear-b',
      'av2-8184-rain-b',
      'av2-8184-snow-b',
      'av2-8184-sunset-b',
      'av2-7cd0-rain',
      'av2-7cd0-snow',
      'av2-7cd0-sunset',
      'av2-7d3f-rain',
      'av2-7d3f-snow',
      'av2-7d3f-sunset',
    ] },
  ],
};

function buildGallery(root) {
  const cats = GALLERY.cats.filter(c => c.items.length);
  if (!cats.length) { root.remove(); return; }
  const url = (cat, ex, f) => `${GALLERY.dir}/${cat.id}/${ex}/${f}?v=${GALLERY_V}`;

  const catRow = el('div', 'g-cats', { role: 'tablist', 'aria-label': 'Result categories' });
  const exRow = el('div', 'g-items', { role: 'tablist', 'aria-label': 'Examples' });
  const stage = el('div', 'wipe g-stage');
  const bottom = el('div', 'layer bottom');
  const top = el('div', 'layer top');
  const vB = el('video');
  const vT = el('video');
  for (const v of [vB, vT]) { v.muted = true; v.playsInline = true; v.preload = 'auto'; }
  bottom.append(vB);
  top.append(vT);
  const tagL = el('span', 'tag left');
  const tagR = el('span', 'tag right');
  tagL.textContent = 'Blocks-World';
  tagR.textContent = 'Generated';
  stage.append(bottom, top, el('div', 'handle'), tagL, tagR);
  const cap = el('p', 'hero-cap');
  cap.textContent = 'Drag to compare the blocks-world condition with the generated video.';
  root.append(catRow, exRow, stage, cap);
  wipeDrag(stage);

  const catBtns = cats.map((cat, ci) => {
    const b = el('button', 'g-cat', { type: 'button', role: 'tab' });
    const cover = el('span', 'g-cover');
    const img = el('img', '', { src: `${GALLERY.dir}/${cat.id}/cover.jpg?v=${GALLERY_V}`, alt: '', loading: 'lazy', decoding: 'async' });
    const name = el('span', 'g-name');
    name.textContent = cat.name;
    cover.append(img);
    b.append(cover, name);
    b.addEventListener('click', () => show(ci, 0));
    catRow.append(b);
    return b;
  });

  let ci = -1, ii = -1, exBtns = [], token = 0, inView = true;

  const scrollRow = (row, btn) => {   // horizontal only: never moves the page
    const l = btn.offsetLeft - row.offsetLeft, r = l + btn.offsetWidth;
    if (l < row.scrollLeft) row.scrollTo({ left: l - 8, behavior: 'smooth' });
    else if (r > row.scrollLeft + row.clientWidth) row.scrollTo({ left: r - row.clientWidth + 8, behavior: 'smooth' });
  };

  function show(c, i) {
    if (c !== ci) {
      ci = c;
      catBtns.forEach((b, k) => { b.classList.toggle('is-active', k === c); b.setAttribute('aria-selected', k === c); });
      scrollRow(catRow, catBtns[c]);
      exRow.replaceChildren();
      exRow.scrollLeft = 0;
      exBtns = cats[c].items.map((ex, k) => {
        const b = el('button', 'g-item', { type: 'button', role: 'tab', 'aria-label': `${cats[c].name}, example ${k + 1}` });
        b.append(el('img', '', { src: url(cats[c], ex, 'thumb.jpg'), alt: '', loading: 'lazy', decoding: 'async' }), el('span', 'g-prog'));
        b.addEventListener('click', () => show(ci, k));
        exRow.append(b);
        return b;
      });
    }
    ii = i;
    exBtns.forEach((b, k) => { b.classList.toggle('is-active', k === i); b.setAttribute('aria-selected', k === i); b.lastChild.style.width = '0'; });
    scrollRow(exRow, exBtns[i]);
    load(cats[c], cats[c].items[i]);
  }

  function load(cat, ex) {
    const t = ++token;
    const vid = name => url(cat, ex, PHONE ? `${name}.m.mp4` : `${name}.mp4`);
    let ready = 0;
    const go = () => {
      if (t !== token || ++ready < 2) return;
      vB.currentTime = vT.currentTime = 0;
      if (inView) { vB.play().catch(() => {}); vT.play().catch(() => {}); }
    };
    for (const [v, name] of [[vB, 'canvas'], [vT, 'generated']]) {
      v.pause();
      v.poster = url(cat, ex, `${name}.jpg`);
      v.addEventListener('canplay', go, { once: true });
      v.src = vid(name);
    }
  }

  vT.addEventListener('timeupdate', () => {
    if (vB.readyState >= 2 && Math.abs(vB.currentTime - vT.currentTime) > 0.1) vB.currentTime = vT.currentTime;
  });
  vT.addEventListener('ended', () => {
    const n = cats[ci].items.length;
    if (n > 1) show(ci, (ii + 1) % n);
    else { vB.currentTime = vT.currentTime = 0; vB.play().catch(() => {}); vT.play().catch(() => {}); }
  });
  const tick = () => {
    const bar = exBtns[ii]?.lastChild;
    if (bar && vT.duration) bar.style.width = `${(vT.currentTime / vT.duration) * 100}%`;
    if (!vT.paused) requestAnimationFrame(tick);
  };
  vT.addEventListener('play', () => requestAnimationFrame(tick));

  new IntersectionObserver(([e]) => {
    inView = e.isIntersecting;
    for (const v of [vB, vT]) {
      if (!inView) v.pause();
      else if (v.readyState >= 3 && !v.ended) v.play().catch(() => {});
    }
  }, { threshold: 0.15 }).observe(stage);

  show(0, 0);
}

/* ---------- explanation videos (own controls, sound allowed) ---------- */

function buildExplainer(root) {
  const src = root.dataset.src;
  root.append(placeholder(root.dataset.label || 'Explanation video', src));
  const v = el('video');
  v.controls = true;
  v.playsInline = true;
  v.preload = 'metadata';
  v.tabIndex = -1;                                   // not focusable while the placeholder covers it
  v.setAttribute('aria-label', root.dataset.label || 'Video');
  v.addEventListener('loadedmetadata', () => { root.classList.add('is-loaded'); v.tabIndex = 0; }, { once: true });
  root.prepend(v);
  if (root.dataset.autoplay) {                       // animations: muted loop, fetched only when near the view
    v.muted = true;
    v.loop = true;
    v.preload = 'none';
    if (root.dataset.poster) root.classList.add('is-loaded');
    new IntersectionObserver((es, ob) => es.forEach(e => {
      if (!e.isIntersecting) return;
      if (root.dataset.poster) v.poster = root.dataset.poster;   // poster and video fetched only near the view
      v.preload = 'auto';
      v.src = src;
      ob.disconnect();
    }), { rootMargin: '300px 0px' }).observe(root);
    new IntersectionObserver(es => es.forEach(e => (e.isIntersecting && v.src ? v.play().catch(() => {}) : v.pause())),
      { threshold: 0.35 }).observe(root);
    v.addEventListener('loadeddata', () => {
      if (root.getBoundingClientRect().top < window.innerHeight) v.play().catch(() => {});
    }, { once: true });
    return;
  }
  if (root.dataset.autostart) {                      // the summary video: plays by itself once scrolled to (silent, so muted)
    v.muted = true;
    v.preload = 'none';
    let userPaused = false, autoPausing = false;
    if (root.dataset.poster) root.classList.add('is-loaded');
    new IntersectionObserver((es, ob) => es.forEach(e => {
      if (!e.isIntersecting) return;
      if (root.dataset.poster) v.poster = root.dataset.poster;
      v.preload = 'auto';                            // fetched a little ahead so it starts at once
      v.src = src;
      ob.disconnect();
    }), { rootMargin: '600px 0px' }).observe(root);
    const auto = play => {                           // scrolling pauses/resumes it, unless the viewer paused it
      if (!v.src || userPaused || v.ended) return;
      if (play) v.play().catch(() => {});
      else if (!v.paused) { autoPausing = true; v.pause(); }
    };
    v.addEventListener('pause', () => {
      if (autoPausing) autoPausing = false;
      else if (!v.ended) userPaused = true;
    });
    v.addEventListener('play', () => { userPaused = false; });
    let inView = false;
    new IntersectionObserver(es => es.forEach(e => { inView = e.isIntersecting; auto(inView); }), { threshold: 0.5 }).observe(root);
    v.addEventListener('loadeddata', () => { if (inView) auto(true); }, { once: true });
    return;
  }
  if (root.dataset.poster) {                         // click-to-play video: poster near the view, nothing else until play
    new IntersectionObserver((es, ob) => es.forEach(e => {
      if (!e.isIntersecting) return;
      v.poster = root.dataset.poster;
      ob.disconnect();
    }), { rootMargin: '600px 0px' }).observe(root);
    v.preload = 'none';
    v.controls = false;                              // no dark control bar over the poster until it plays
    root.classList.add('is-loaded');
    const btn = el('button', 'play-btn');
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Play ' + (root.dataset.label || 'video'));
    root.append(btn);
    const start = () => { btn.remove(); v.controls = true; v.play().catch(() => {}); };
    btn.addEventListener('click', start);
    v.addEventListener('play', () => { if (btn.isConnected) { btn.remove(); v.controls = true; } });
  }
  v.src = src;
}

/* ---------- static images ---------- */

function buildImage(root) {
  const src = root.dataset.src;
  root.append(placeholder(root.dataset.label || 'Figure', src));
  const img = new Image();
  img.alt = root.dataset.label || '';
  img.onload = () => {
    root.prepend(img);
    root.classList.add('is-loaded');
  };
  if (!('IntersectionObserver' in window)) { img.src = src; return; }
  new IntersectionObserver((es, ob) => es.forEach(e => {
    if (!e.isIntersecting) return;
    img.src = src;
    ob.disconnect();
  }), { rootMargin: '600px 0px' }).observe(root);
}

/* ---------- bibtex copy ---------- */

function buildCopy(btn) {
  btn.addEventListener('click', async () => {
    const text = btn.parentElement.querySelector('code').textContent;
    try {
      await navigator.clipboard.writeText(text);
      btn.textContent = 'Copied';
    } catch {
      btn.textContent = 'Select & copy';
    }
    setTimeout(() => (btn.textContent = 'Copy'), 1500);
  });
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
document.querySelectorAll('.hero .wipe').forEach(buildWipe);
document.querySelectorAll('.gallery').forEach(buildGallery);
document.querySelectorAll('.explainer').forEach(buildExplainer);
document.querySelectorAll('.img-slot').forEach(buildImage);
document.querySelectorAll('.copy').forEach(buildCopy);
