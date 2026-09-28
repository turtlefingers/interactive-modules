import { clamp, fitCanvas } from "../../lib/util.js";
import { ILLO, TONE as T, circle, ellipse, roundRect } from "../../lib/draw.js";

export default function demo(api) {
  const { el, S } = api;
  const MAXN = 16;
  // 줄마다 무대 위 실루엣 하나 (외곽선 없는 톤 면): 원(킥), 네모(스네어), 납작한 타원(하이햇), 작은 점(톤)
  // 울리는 동안에는 강조색으로 채워진다. 격자 라벨 아이콘도 같은 모양·같은 톤이다
  const TRACKS = [
    { name: "킥", color: T[4], icon: `<circle cx="7" cy="7" r="5.5" fill="${T[4]}"/>` },
    { name: "스네어", color: T[3], icon: `<rect x="2" y="2" width="10" height="10" rx="1.5" fill="${T[3]}"/>` },
    { name: "하이햇", color: T[2], icon: `<ellipse cx="7" cy="7" rx="6" ry="2.2" fill="${T[2]}"/>` },
    { name: "톤", color: "accent", icon: `<circle cx="7" cy="7" r="3.2" fill="var(--accent)"/>` }
  ];
  // 톤 줄: 칸 위치마다 정해진 음 (마이너 펜타토닉, 반음 단위)
  const TONE = [12, 0, 7, 10, 12, 15, 10, 7, 5, 7, 10, 12, 15, 17, 12, 10];
  const pattern = [
    "x...x...x.x.x...",
    "....x.......x..x",
    "x.x.x.x.x.x.x.xx",
    "x..x..x...x.x..."
  ].map(r => [...r].map(c => c === "x"));

  api.css(`
    .step-sequencer-root { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center;
      gap: 16px; padding: 64px 24px 72px; }
    .step-sequencer-vis { position: relative; width: 100%; max-width: 820px; flex: 1 1 200px; min-height: 110px; max-height: 240px;
      border: 1px solid var(--line); border-radius: var(--r-card); overflow: hidden; }
    .step-sequencer-bar { width: 100%; max-width: 820px; display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
    .step-sequencer-btn { font: inherit; font-size: 13px; font-weight: 600; color: var(--ink); background: transparent;
      border: 1px solid rgba(0,0,0,.18); border-radius: var(--r-pill); padding: 7px 14px; cursor: pointer; transition: border-color .15s, background .15s; }
    .step-sequencer-btn:hover { border-color: var(--ink); }
    .step-sequencer-btn:active { background: rgba(0,0,0,.05); }
    .step-sequencer-play { width: 42px; height: 42px; padding: 0; display: grid; place-items: center; background: var(--ink); color: var(--on-ink); border-color: var(--ink); }
    .step-sequencer-play:active { background: var(--ink); }
    .step-sequencer-play svg { width: 14px; height: 14px; fill: currentColor; }
    .step-sequencer-bpm { font-size: 15px; font-weight: 700; font-variant-numeric: tabular-nums; min-width: 84px; }
    .step-sequencer-bpm small { font-size: 13px; font-weight: 500; color: var(--ink-3); margin-left: 3px; }
    .step-sequencer-spacer { flex: 1; }
    .step-sequencer-sound { font-size: 13px; color: var(--ink-3); }
    .step-sequencer-sound.on { color: var(--ink-2); }
    .step-sequencer-grid { width: 100%; max-width: 820px; display: grid; gap: 6px; align-items: center; }
    .step-sequencer-label { font: inherit; font-size: 13px; font-weight: 600; color: var(--ink); display: flex; align-items: center; gap: 7px;
      background: none; border: 0; padding: 0; cursor: pointer; white-space: nowrap; text-align: left; }
    .step-sequencer-label svg { width: 12px; height: 12px; flex: none; }
    .step-sequencer-cell { position: relative; aspect-ratio: 1; padding: 0; border-radius: 6px; cursor: pointer; background: transparent;
      border: 1px solid rgba(0,0,0,.14); transition: background .1s, border-color .1s; }
    .step-sequencer-cell.beat { border-color: rgba(0,0,0,.34); }
    .step-sequencer-cell.gap { margin-left: 8px; }
    .step-sequencer-cell:hover { border-color: var(--ink); }
    .step-sequencer-cell.on { background: var(--ink); border-color: var(--ink); }
    .step-sequencer-cell.now { background: rgba(0,0,0,.06); }
    .step-sequencer-cell.now.on { background: var(--accent); border-color: var(--accent); }
    .step-sequencer-cell.off-range { display: none; }
    .step-sequencer-cell .pitch { position: absolute; left: 50%; width: 4px; height: 4px; margin-left: -2px; border-radius: 50%;
      background: rgba(0,0,0,.22); pointer-events: none; }
    .step-sequencer-cell.on .pitch { background: var(--board); }
    .step-sequencer-led { height: 3px; border-radius: 2px; background: rgba(0,0,0,.08); }
    .step-sequencer-led.gap { margin-left: 8px; }
    .step-sequencer-led.now { background: var(--accent); }
    .step-sequencer-led.off-range { display: none; }
    .step-sequencer-root.painting, .step-sequencer-root.painting * { cursor: pointer !important; }
    @media (max-width: 700px) {
      .step-sequencer-root { padding: 60px 12px 64px; gap: 12px; }
      .step-sequencer-grid { gap: 3px; }
      .step-sequencer-cell { border-radius: 3px; }
      .step-sequencer-cell.gap, .step-sequencer-led.gap { margin-left: 4px; }
      .step-sequencer-label span { display: none; }
    }
  `);

  /* ---------- DOM ---------- */
  const root = document.createElement("div");
  root.className = "step-sequencer-root";
  el.appendChild(root);

  const vis = document.createElement("div");
  vis.className = "step-sequencer-vis";
  root.appendChild(vis);

  const bar = document.createElement("div");
  bar.className = "step-sequencer-bar";
  const ICON_PLAY = `<svg viewBox="0 0 16 16"><path d="M4 2.5v11l9.5-5.5z"/></svg>`;
  const ICON_PAUSE = `<svg viewBox="0 0 16 16"><rect x="3" y="2.5" width="3.4" height="11"/><rect x="9.6" y="2.5" width="3.4" height="11"/></svg>`;
  bar.innerHTML = `
    <button class="step-sequencer-btn step-sequencer-play" title="재생 / 정지 (스페이스)"></button>
    <div class="step-sequencer-bpm"></div>
    <div class="step-sequencer-sound"></div>
    <div class="step-sequencer-spacer"></div>
    <button class="step-sequencer-btn" data-act="random">무작위</button>
    <button class="step-sequencer-btn" data-act="clear">지우기</button>`;
  root.appendChild(bar);
  const playBtn = bar.querySelector(".step-sequencer-play");
  const bpmEl = bar.querySelector(".step-sequencer-bpm");
  const soundEl = bar.querySelector(".step-sequencer-sound");

  const grid = document.createElement("div");
  grid.className = "step-sequencer-grid";
  root.appendChild(grid);
  const cells = TRACKS.map(() => []);
  const leds = [];
  TRACKS.forEach((tr, r) => {
    const lab = document.createElement("button");
    lab.className = "step-sequencer-label";
    lab.dataset.row = r;
    lab.title = "눌러서 미리 듣기";
    lab.innerHTML = `<svg viewBox="0 0 14 14">${tr.icon}</svg><span>${tr.name}</span>`;
    grid.appendChild(lab);
    for (let i = 0; i < MAXN; i++) {
      const c = document.createElement("button");
      c.className = "step-sequencer-cell" + (i % 4 === 0 ? " beat" : "") + (i % 4 === 0 && i > 0 ? " gap" : "");
      c.dataset.row = r; c.dataset.i = i;
      if (r === 3) c.innerHTML = `<span class="pitch" style="bottom:${14 + TONE[i] / 17 * 64}%"></span>`;
      grid.appendChild(c);
      cells[r].push(c);
    }
  });
  grid.appendChild(document.createElement("div"));
  for (let i = 0; i < MAXN; i++) {
    const d = document.createElement("div");
    d.className = "step-sequencer-led" + (i % 4 === 0 && i > 0 ? " gap" : "");
    grid.appendChild(d); leds.push(d);
  }

  const labelW = () => (el.clientWidth < 700 ? 16 : 70);
  const layout = () => {
    const n = S.steps;
    grid.style.gridTemplateColumns = `${labelW()}px repeat(${n}, minmax(0, 1fr))`;
    // 격자가 세로로 넘치지 않게 칸 크기를 제한한다
    const maxCell = clamp((el.clientHeight - 64 - 72 - 110 - 60 - 16 * 3) / 5 - 6, 14, 58);
    grid.style.maxWidth = Math.min(820, labelW() + n * (maxCell + 6) + 24) + "px";
    for (let r = 0; r < 4; r++) cells[r].forEach((c, i) => c.classList.toggle("off-range", i >= n));
    leds.forEach((d, i) => d.classList.toggle("off-range", i >= n));
  };
  const paint = () => {
    for (let r = 0; r < 4; r++) cells[r].forEach((c, i) => c.classList.toggle("on", pattern[r][i]));
  };

  const { cv, g, size } = fitCanvas(api, { parent: vis });
  const fitVis = () => { // 격자 높이가 바뀌면 무대 크기도 바뀐다
    if (vis.clientWidth === size.w && vis.clientHeight === size.h) return;
    size.w = vis.clientWidth; size.h = vis.clientHeight;
    cv.width = Math.round(size.w * size.dpr); cv.height = Math.round(size.h * size.dpr);
    g.setTransform(size.dpr, 0, 0, size.dpr, 0, 0);
  };
  const C = { ink: api.color("--ink") || "#1b1b1a", ink3: api.color("--ink-3") || "#9a9790", accent: api.color("--accent") || "#ff5a36" };

  /* ---------- 소리 (첫 클릭 때 만든다) ---------- */
  let ac = null, master = null, noise = null;
  const ensureAudio = () => {
    if (ac) { if (ac.state === "suspended") ac.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ac = new AC();
    master = ac.createGain(); master.gain.value = 0.2; master.connect(ac.destination);
    noise = ac.createBuffer(1, Math.floor(ac.sampleRate * 0.4), ac.sampleRate);
    const d = noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  };
  api.cleanup(() => { if (ac) ac.close(); });
  const env = (t, peak, dur, attack = 0.002) => {
    const gn = ac.createGain();
    gn.gain.setValueAtTime(0.0001, t);
    gn.gain.exponentialRampToValueAtTime(peak, t + attack);
    gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    gn.connect(master);
    return gn;
  };
  const noiseSrc = (t, dur, type, freq, peak) => {
    const s = ac.createBufferSource(); s.buffer = noise;
    const f = ac.createBiquadFilter(); f.type = type; f.frequency.value = freq;
    s.connect(f); f.connect(env(t, peak, dur)); s.start(t); s.stop(t + dur + 0.02);
  };
  const voice = (r, when, step) => {
    if (!ac || !S.sound) return;
    const t = Math.max(when, ac.currentTime + 0.005);
    if (r === 0) {
      const o = ac.createOscillator(); o.type = "sine";
      o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.14);
      o.connect(env(t, 1, 0.38)); o.start(t); o.stop(t + 0.4);
    } else if (r === 1) {
      noiseSrc(t, 0.18, "highpass", 1300, 0.6);
      const o = ac.createOscillator(); o.type = "triangle"; o.frequency.setValueAtTime(190, t);
      o.connect(env(t, 0.35, 0.1)); o.start(t); o.stop(t + 0.12);
    } else if (r === 2) {
      noiseSrc(t, 0.05, "highpass", 7500, 0.35);
    } else {
      const o = ac.createOscillator(); o.type = "triangle";
      o.frequency.setValueAtTime(220 * Math.pow(2, TONE[step] / 12), t);
      o.connect(env(t, 0.55, 0.32, 0.008)); o.start(t); o.stop(t + 0.35);
    }
  };

  /* ---------- 무대: 줄마다 도형 하나. 울리면 채워지고 움직인다 ---------- */
  const fig = TRACKS.map(() => ({ p: 0, ang: 0, angT: 0, y: 0.5, yT: 0.5 }));
  const rings = [];
  const react = (r, step) => {
    const f = fig[r];
    f.p = 1;
    if (r === 0) rings.push({ t: 0 });
    if (r === 1) f.angT += Math.PI / 2;
    if (r === 3) f.yT = TONE[step] / 17;
  };
  // 울리는 동안(f.p > 0)은 강조색, 평소에는 제 톤. 외곽선은 없다
  const figure = (r, x, y, s, f, e) => {
    const base = TRACKS[r].color === "accent" ? C.accent : TRACKS[r].color;
    const fill = f.p > 0 ? C.accent : base;
    if (r === 0) circle(g, x, y, s * (0.8 + 0.3 * e), { fill });
    else if (r === 1) {
      const q = s * 1.3;
      g.save(); g.translate(x, y); g.rotate(f.ang); roundRect(g, -q / 2, -q / 2, q, q, s * 0.18, { fill }); g.restore();
    } else if (r === 2) ellipse(g, x, y - e * s, s * 0.9, s * 0.3, { fill });
    else circle(g, x, y, s * (0.32 + 0.14 * e), { fill });
  };
  const drawStage = dt => {
    fitVis();
    const { w, h } = size;
    g.clearRect(0, 0, w, h);
    const s = Math.min(h * 0.2, w / 12);
    const cy = h * 0.54;
    // 바닥선
    g.strokeStyle = "rgba(0,0,0,.08)"; g.lineWidth = 1;
    g.beginPath(); g.moveTo(w * 0.06, cy + s * 1.35); g.lineTo(w * 0.94, cy + s * 1.35); g.stroke();
    fig.forEach((f, r) => {
      f.p = Math.max(0, f.p - dt / 280);
      const e = f.p * f.p;
      f.ang += (f.angT - f.ang) * Math.min(1, dt / 70);
      f.y += (f.yT - f.y) * Math.min(1, dt / 60);
      const x = w * (r + 0.5) / 4;
      const y = r === 3 ? cy + s * 1.1 - f.y * s * 2.4 : cy;
      if (r === 3) { // 톤: 음 높이 눈금
        g.strokeStyle = "rgba(0,0,0,.1)"; g.beginPath(); g.moveTo(x, cy + s * 1.1); g.lineTo(x, cy + s * 1.1 - s * 2.4); g.stroke();
      }
      figure(r, x, y, s, f, e);
    });
    // 킥 파문 (얇은 선)
    for (let i = rings.length - 1; i >= 0; i--) {
      const o = rings[i]; o.t += dt / 650;
      if (o.t >= 1) { rings.splice(i, 1); continue; }
      g.strokeStyle = C.ink; g.globalAlpha = (1 - o.t) * 0.35; g.lineWidth = 1.5;
      g.beginPath(); g.arc(w / 8, cy, s * (1.1 + o.t * 1.6), 0, Math.PI * 2); g.stroke(); g.globalAlpha = 1;
    }
  };

  /* ---------- 재생 시계 ---------- */
  let playing = true, cur = -1, lastHits = [];
  let nextIdx = 0, gridT = performance.now() + 200;
  const queue = [];
  const stepMs = () => 60000 / S.bpm / 4;
  const swingMs = i => (i % 2 === 1 ? S.swing / 100 * stepMs() : 0);

  const setNow = idx => {
    if (cur >= 0) { for (let r = 0; r < 4; r++) cells[r][cur].classList.remove("now"); leds[cur].classList.remove("now"); }
    cur = idx;
    if (cur >= 0) { for (let r = 0; r < 4; r++) cells[r][cur].classList.add("now"); leds[cur].classList.add("now"); }
  };
  const fire = ev => {
    if (ev.idx >= S.steps) return;
    setNow(ev.idx);
    lastHits = ev.hits;
    ev.hits.forEach(r => {
      react(r, ev.idx);
      cells[r][ev.idx].animate([{ transform: "scale(1.12)" }, { transform: "scale(1)" }], { duration: 180, easing: "ease-out" });
    });
  };
  const setPlaying = on => {
    playing = on;
    playBtn.innerHTML = on ? ICON_PAUSE : ICON_PLAY;
    queue.length = 0;
    if (on) { gridT = performance.now() + 30; nextIdx = cur < 0 ? 0 : (cur + 1) % S.steps; }
  };
  setPlaying(true);

  const refreshBar = () => {
    bpmEl.innerHTML = `${S.bpm}<small>BPM</small>`;
    const on = S.sound && ac;
    soundEl.classList.toggle("on", !!on);
    soundEl.textContent = !S.sound ? "소리 끔 · 움직임만" : on ? "소리 켜짐" : "클릭하면 소리가 켜진다";
  };

  /* ---------- 입력: 누르고 끌어 칠하기 ---------- */
  let painting = false, paintVal = true;
  const setCell = (c, v) => {
    const r = +c.dataset.row, i = +c.dataset.i;
    if (pattern[r][i] === v) return;
    pattern[r][i] = v;
    c.classList.toggle("on", v);
  };
  api.on(root, "pointerdown", e => {
    ensureAudio(); refreshBar();
    if (e.target.closest("button")) e.preventDefault(); // 버튼에 포커스가 남지 않게 (스페이스 중복 방지)
    const c = e.target.closest(".step-sequencer-cell");
    if (c) {
      api.hideHint();
      painting = true;
      paintVal = !pattern[+c.dataset.row][+c.dataset.i];
      setCell(c, paintVal);
      root.classList.add("painting");
      if (!playing && paintVal) { const r = +c.dataset.row; voice(r, 0, +c.dataset.i); react(r, +c.dataset.i); }
    }
  });
  api.on(window, "pointermove", e => {
    if (!painting) return;
    const t = document.elementFromPoint(e.clientX, e.clientY);
    const c = t && t.closest && t.closest(".step-sequencer-cell");
    if (c && root.contains(c)) setCell(c, paintVal);
  });
  const endPaint = () => { painting = false; root.classList.remove("painting"); };
  api.on(window, "pointerup", endPaint);
  api.on(window, "pointercancel", endPaint);

  api.on(root, "click", e => {
    const lab = e.target.closest(".step-sequencer-label");
    if (lab) { const r = +lab.dataset.row; const i = Math.max(0, cur); voice(r, 0, i); react(r, i); return; }
    if (e.target.closest(".step-sequencer-play")) { setPlaying(!playing); api.hideHint(); return; }
    const act = e.target.closest("[data-act]");
    if (!act) return;
    if (act.dataset.act === "clear") pattern.forEach(row => row.fill(false));
    if (act.dataset.act === "random") pattern.forEach((row, r) => {
      const dens = [0.3, 0.2, 0.55, 0.3][r];
      for (let i = 0; i < MAXN; i++) row[i] = Math.random() < dens + (r === 0 && i % 4 === 0 ? 0.4 : 0);
    });
    paint();
    api.flash(act.dataset.act === "clear" ? "패턴을 모두 지웠다" : "무작위 패턴", "ok");
  });
  api.on(window, "keydown", e => {
    if (e.code !== "Space") return;
    if (e.target.closest && e.target.closest("input, textarea, [contenteditable]")) return;
    if (e.target !== document.body && !el.contains(e.target)) return;
    e.preventDefault();
    ensureAudio(); setPlaying(!playing); refreshBar(); api.hideHint();
  });

  api.onParam(k => {
    if (k === "steps") { layout(); if (cur >= S.steps) setNow(-1); nextIdx = nextIdx % S.steps; queue.length = 0; }
    refreshBar();
  });
  api.onResize(layout);
  layout(); paint(); refreshBar();

  /* ---------- 루프 ---------- */
  api.frame(dt => {
    const now = performance.now();
    if (playing) {
      if (gridT < now - 300) gridT = now; // 탭이 숨겨졌다 돌아온 경우
      while (gridT + swingMs(nextIdx) < now + 100) {
        const idx = nextIdx % S.steps;
        const t = gridT + swingMs(idx);
        const hits = [0, 1, 2, 3].filter(r => pattern[r][idx]);
        if (ac && S.sound) hits.forEach(r => voice(r, ac.currentTime + Math.max(0, t - now) / 1000, idx));
        queue.push({ t, idx, hits });
        gridT += stepMs();
        nextIdx = (idx + 1) % S.steps;
      }
    }
    while (queue.length && queue[0].t <= now) fire(queue.shift());
    drawStage(dt);

    let on = 0;
    for (let r = 0; r < 4; r++) for (let i = 0; i < S.steps; i++) if (pattern[r][i]) on++;
    api.read("step", cur < 0 ? "–" : `${cur + 1} / ${S.steps}`);
    api.read("bpm", S.bpm);
    api.read("on", on);
    api.read("hit", lastHits.length ? lastHits.map(r => TRACKS[r].name).join(" · ") : "없음");
    if (painting) api.status(paintVal ? "칸 켜는 중 · 끌면 이어서 칠한다" : "칸 끄는 중 · 끌면 이어서 지운다", "active");
    else if (playing) api.status(`재생 중 · ${cur + 1}/${S.steps} 스텝${S.swing ? ` · 스윙 ${S.swing}%` : ""}`, "active");
    else api.status("정지 · 스페이스로 재생", "idle");
  });
}
