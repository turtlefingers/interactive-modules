import { rng, clamp, localPoint, fitCanvas } from "../../lib/util.js";

export default function demo(api) {
  const { el, S } = api;
  const W = 1600, H = 1100;
  const LIMITS = { tight: [0.5, 4], wide: [0.1, 20], none: [0.02, 200] };

  api.css(`
    .zoom-root { position: absolute; inset: 0; background: var(--board); cursor: grab; }
    .zoom-root.grabbing { cursor: grabbing; }
    .zoom-ctrl { position: absolute; right: 16px; bottom: 16px; z-index: 40; display: flex; align-items: center;
      background: var(--board); border-radius: 8px; box-shadow: inset 0 0 0 1px rgba(27,27,26,.2); transition: opacity .2s; }
    .zoom-ctrl.off { opacity: 0; pointer-events: none; }
    .zoom-ctrl button { font: inherit; font-size: 18px; width: 40px; height: 38px; border: 0; background: none; color: var(--ink); cursor: pointer; }
    .zoom-ctrl button:hover { color: var(--accent); }
    .zoom-ctrl .pct { font-size: 13px; width: 64px; font-variant-numeric: tabular-nums; border-left: 1px solid rgba(27,27,26,.15); border-right: 1px solid rgba(27,27,26,.15); }
  `);
  const root = document.createElement("div");
  root.className = "zoom-root";
  el.appendChild(root);
  const { g, size } = fitCanvas(api, { parent: root });
  const ctrl = document.createElement("div");
  ctrl.className = "zoom-ctrl";
  ctrl.innerHTML = `<button data-z="out" title="축소">−</button><button class="pct" data-z="reset" title="100%로">100%</button><button data-z="in" title="확대">+</button>`;
  root.appendChild(ctrl);
  const pctEl = ctrl.querySelector(".pct");

  const INK = api.color("--ink") || "#1b1b1a";
  const INK2 = api.color("--ink-2") || "#5d5b57";
  const INK3 = api.color("--ink-3") || "#9a9790";
  const ACC = api.color("--accent") || "#ff5a36";
  const NOTE = api.color("--note") || "#fffdf6";
  const FONT = getComputedStyle(el).fontFamily;

  /* ---------- 보드 내용 ---------- */
  const rand = rng(11);
  const items = [];
  for (let i = 0; i < 46; i++) {
    const kind = rand() < 0.5 ? "rect" : rand() < 0.6 ? "note" : "dot";
    const w = kind === "dot" ? 40 + rand() * 60 : 90 + rand() * 150, h = kind === "dot" ? w : 60 + rand() * 120;
    const x = 40 + rand() * (W - w - 80), y = 40 + rand() * (H - h - 80);
    if (x + w > W / 2 - 150 && x < W / 2 + 150 && y + h > H / 2 - 110 && y < H / 2 + 110) continue; // 가운데 비우기
    items.push({ kind, x, y, w, h, tone: 0.05 + rand() * 0.1 });
  }
  const labels = [
    { t: "보드", x: 60, y: 90, fs: 48 },
    { t: "가운데 쪽지를 확대해 본다", x: W / 2 - 150, y: H / 2 - 130, fs: 18 }
  ];
  // 가운데 쪽지: 확대할수록 더 작은 글씨가 나온다
  const noteBox = { x: W / 2 - 100, y: H / 2 - 70, w: 200, h: 140 };
  const micro = [
    { t: "여기 작은 글씨가 있다", x: noteBox.x + 16, y: noteBox.y + 28, fs: 9 },
    { t: "조금 더 가까이 오면", x: noteBox.x + 16, y: noteBox.y + 50, fs: 4 },
    { t: "더 작은 글씨도 읽힌다", x: noteBox.x + 16, y: noteBox.y + 60, fs: 2 },
    { t: "여기까지 왔다면 한계를 넓힌 것이다", x: W / 2 - 18, y: H / 2 + 36, fs: 0.4 }
  ];

  /* ---------- 카메라 ---------- */
  // 화면 좌표 = (a) + (보드 좌표 − w) × s  →  기준점 a(화면)와 그 아래 보드 좌표 w를 붙잡아 둔다
  const cam = { s: 1, ts: 1, ax: 0, ay: 0, wx: W / 2, wy: H / 2, tx: 0, ty: 0 };
  const first = () => { const { w, h } = size; cam.ax = w / 2; cam.ay = h / 2; cam.wx = W / 2; cam.wy = H / 2; };
  first();
  let lastInput = "–", lastDelta = "–", pivotShow = 0, lastPivot = null, lastWheelTip = 0, hitLimit = false;

  const lim = () => LIMITS[S.limit];
  function setPivot(px, py) {
    cam.wx = (px - cam.tx) / cam.s; cam.wy = (py - cam.ty) / cam.s;
    cam.ax = px; cam.ay = py;
  }
  function zoomBy(factor, p, label) {
    const { w, h } = size;
    const pv = S.pivot === "center" || !p ? { x: w / 2, y: h / 2 } : p;
    setPivot(pv.x, pv.y);
    const [mn, mx] = lim();
    const want = cam.ts * factor;
    cam.ts = clamp(want, mn, mx);
    hitLimit = want !== cam.ts;
    if (!S.smooth) cam.s = cam.ts;
    lastInput = label; lastPivot = pv; pivotShow = 1;
    api.hideHint();
  }
  const zoomTo = (target, label) => zoomBy(target / cam.ts, null, label);

  /* ---------- 휠 · 트랙패드 ---------- */
  api.on(root, "wheel", e => {
    e.preventDefault();
    const p = localPoint(el, e);
    const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 400 : 1;
    const dy = e.deltaY * unit, dx = e.deltaX * unit;
    const mod = e.ctrlKey || e.metaKey;
    if (mod || S.wheel === "zoom") {
      const notch = Math.abs(dy) >= 40 && Number.isInteger(e.deltaY);
      const factor = notch ? (dy > 0 ? 1 / 1.2 : 1.2) : Math.exp(-clamp(dy, -50, 50) * 0.01);
      const label = !mod ? "휠" : notch ? (e.metaKey ? "⌘ + 휠" : "Ctrl + 휠") : "트랙패드 핀치";
      zoomBy(factor, p, label);
      lastDelta = dy.toFixed(1);
    } else {
      cam.ax -= dx; cam.ay -= dy;
      lastInput = "휠 (이동)"; lastDelta = dy.toFixed(1);
      const now = performance.now();
      if (now - lastWheelTip > 2500) { api.flash("그냥 휠은 이동이다 · 확대는 핀치나 Ctrl(⌘) + 휠", "idle", 2000); lastWheelTip = now; }
    }
  }, { passive: false });

  // 사파리의 트랙패드 핀치
  let gestureStart = 1;
  api.on(root, "gesturestart", e => { e.preventDefault(); gestureStart = cam.ts; });
  api.on(root, "gesturechange", e => {
    e.preventDefault();
    const p = localPoint(el, e);
    zoomBy(gestureStart * e.scale / cam.ts, p, "트랙패드 핀치");
    lastDelta = "× " + e.scale.toFixed(2);
  });
  api.on(root, "gestureend", e => e.preventDefault());

  /* ---------- 포인터: 끌어서 이동, 두 손가락 핀치 ---------- */
  const pts = new Map();
  let pinch = null;
  const mid = () => { const a = [...pts.values()]; return { x: (a[0].x + a[1].x) / 2, y: (a[0].y + a[1].y) / 2, d: Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y) }; };
  api.on(root, "pointerdown", e => {
    if (e.target.closest(".zoom-ctrl")) return;
    e.preventDefault();
    root.setPointerCapture(e.pointerId);
    pts.set(e.pointerId, localPoint(el, e));
    root.classList.add("grabbing");
    if (pts.size === 2) {
      const m = mid();
      const { w, h } = size;
      const pv = S.pivot === "center" ? { x: w / 2, y: h / 2 } : m;
      setPivot(pv.x, pv.y);
      pinch = { d0: Math.max(10, m.d), s0: cam.ts, m };
    }
  });
  api.on(root, "pointermove", e => {
    if (!pts.has(e.pointerId)) return;
    const prev = pts.get(e.pointerId), p = localPoint(el, e);
    pts.set(e.pointerId, p);
    if (pts.size === 1) { cam.ax += p.x - prev.x; cam.ay += p.y - prev.y; lastInput = "끌기 (이동)"; api.hideHint(); }
    else if (pts.size === 2 && pinch) {
      const m = mid();
      const [mn, mx] = lim();
      const want = pinch.s0 * m.d / pinch.d0;
      cam.ts = clamp(want, mn, mx); hitLimit = want !== cam.ts;
      cam.s = cam.ts; // 손가락에는 바로 붙인다
      if (S.pivot !== "center") { cam.ax += m.x - pinch.m.x; cam.ay += m.y - pinch.m.y; }
      pinch.m = m;
      lastInput = "두 손가락 핀치"; lastDelta = "× " + (m.d / pinch.d0).toFixed(2);
      lastPivot = { x: cam.ax, y: cam.ay }; pivotShow = 1;
      api.hideHint();
    }
  });
  const up = e => {
    pts.delete(e.pointerId);
    if (pts.size < 2) pinch = null;
    if (!pts.size) root.classList.remove("grabbing");
  };
  api.on(root, "pointerup", up);
  api.on(root, "pointercancel", up);

  api.on(ctrl, "click", e => {
    const b = e.target.closest("button");
    if (!b) return;
    if (b.dataset.z === "in") zoomBy(1.5, null, "+ 버튼");
    if (b.dataset.z === "out") zoomBy(1 / 1.5, null, "− 버튼");
    if (b.dataset.z === "reset") zoomTo(1, "100% 버튼");
    lastDelta = "–";
  });
  api.on(window, "keydown", e => {
    if (e.target.closest && e.target.closest("input, textarea, [contenteditable]")) return;
    if (e.ctrlKey || e.metaKey) return;
    if (e.key === "+" || e.key === "=") { e.preventDefault(); zoomBy(1.5, null, "+ 키"); }
    else if (e.key === "-" || e.key === "_") { e.preventDefault(); zoomBy(1 / 1.5, null, "− 키"); }
    else if (e.key === "0") { e.preventDefault(); zoomTo(1, "0 키"); }
  });

  api.onParam(k => {
    if (k === "limit") { const [mn, mx] = lim(); const { w, h } = size; setPivot(w / 2, h / 2); cam.ts = clamp(cam.ts, mn, mx); if (!S.smooth) cam.s = cam.ts; }
    if (k === "smooth" && !S.smooth) cam.s = cam.ts;
    if (k === "buttons") ctrl.classList.toggle("off", !S.buttons);
  });
  ctrl.classList.toggle("off", !S.buttons);

  /* ---------- 그리기 ---------- */
  const scr = (x, y) => ({ x: cam.tx + x * cam.s, y: cam.ty + y * cam.s });
  function text(t, wx, wy, fs, color, weight = 500) {
    const px = fs * cam.s, p = scr(wx, wy);
    if (px < 2.5) {
      // 너무 작으면 글자 대신 회색 줄로 보인다
      g.fillStyle = "rgba(27,27,26,.25)";
      g.fillRect(p.x, p.y - Math.max(0.5, px * 0.35), t.length * fs * 0.9 * cam.s, Math.max(0.5, px * 0.7));
      return;
    }
    g.font = `${weight} ${px}px ${FONT}`; g.fillStyle = color; g.textBaseline = "middle"; g.textAlign = "left";
    g.fillText(t, p.x, p.y);
  }

  api.frame(dt => {
    if (S.smooth) {
      const k = 1 - Math.pow(1 - 0.22, dt / 16.67);
      cam.s += (cam.ts - cam.s) * k;
      if (Math.abs(cam.ts - cam.s) < cam.ts * 0.0005) cam.s = cam.ts;
    } else cam.s = cam.ts;
    cam.tx = cam.ax - cam.wx * cam.s; cam.ty = cam.ay - cam.wy * cam.s;

    const { w, h } = size, dpr = size.dpr;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, w, h);

    // 보드 판
    const b0 = scr(0, 0);
    g.fillStyle = NOTE; g.fillRect(b0.x, b0.y, W * cam.s, H * cam.s);
    g.strokeStyle = "rgba(27,27,26,.25)"; g.lineWidth = 1; g.strokeRect(b0.x + 0.5, b0.y + 0.5, W * cam.s, H * cam.s);
    // 격자: 화면에서 너무 촘촘해지면 흐려진다
    [[100, 0.07], [20, 0.04]].forEach(([step, alpha]) => {
      const gap = step * cam.s;
      if (gap < 8) return;
      const a = alpha * clamp((gap - 8) / 20, 0, 1);
      g.strokeStyle = `rgba(27,27,26,${a})`; g.beginPath();
      const x0 = Math.max(0, Math.floor(-cam.tx / cam.s / step) * step), x1 = Math.min(W, (w - cam.tx) / cam.s);
      const y0 = Math.max(0, Math.floor(-cam.ty / cam.s / step) * step), y1 = Math.min(H, (h - cam.ty) / cam.s);
      for (let x = x0; x <= x1; x += step) { const sx = Math.round(cam.tx + x * cam.s) + 0.5; g.moveTo(sx, Math.max(0, b0.y)); g.lineTo(sx, Math.min(h, b0.y + H * cam.s)); }
      for (let y = y0; y <= y1; y += step) { const sy = Math.round(cam.ty + y * cam.s) + 0.5; g.moveTo(Math.max(0, b0.x), sy); g.lineTo(Math.min(w, b0.x + W * cam.s), sy); }
      g.stroke();
    });

    // 개체
    items.forEach(it => {
      const p = scr(it.x, it.y), sw = it.w * cam.s, sh = it.h * cam.s;
      if (p.x > w || p.y > h || p.x + sw < 0 || p.y + sh < 0) return;
      g.fillStyle = `rgba(27,27,26,${it.tone})`;
      g.strokeStyle = "rgba(27,27,26,.3)"; g.lineWidth = 1;
      g.beginPath();
      if (it.kind === "dot") g.arc(p.x + sw / 2, p.y + sh / 2, sw / 2, 0, Math.PI * 2);
      else g.rect(p.x, p.y, sw, sh);
      if (it.kind === "note") { g.fillStyle = NOTE; g.fill(); g.stroke(); }
      else g.fill();
      if (it.kind === "note") {
        g.fillStyle = "rgba(27,27,26,.12)";
        for (let k = 0; k < 3; k++) { const lw = (k === 2 ? 0.55 : 0.8) * (it.w - 28); g.fillRect(p.x + 14 * cam.s, p.y + (18 + k * 16) * cam.s, lw * cam.s, 5 * cam.s); }
      }
    });
    labels.forEach(l => text(l.t, l.x, l.y, l.fs, l === labels[0] ? INK : INK2, l === labels[0] ? 700 : 500));

    // 가운데 쪽지
    const nb = scr(noteBox.x, noteBox.y);
    g.fillStyle = NOTE; g.fillRect(nb.x, nb.y, noteBox.w * cam.s, noteBox.h * cam.s);
    g.strokeStyle = INK; g.lineWidth = 1.5; g.strokeRect(nb.x, nb.y, noteBox.w * cam.s, noteBox.h * cam.s);
    micro.forEach(m => text(m.t, m.x, m.y, m.fs, INK));
    const dot = scr(W / 2, H / 2 + 36);
    g.fillStyle = ACC; g.beginPath(); g.arc(dot.x - 3 * cam.s, dot.y, Math.max(1.5, 1.2 * cam.s), 0, Math.PI * 2); g.fill();

    // 기준점 표시
    if (lastPivot && pivotShow > 0) {
      pivotShow = Math.max(0, pivotShow - dt / 900);
      g.globalAlpha = Math.min(1, pivotShow * 2);
      g.strokeStyle = ACC; g.lineWidth = 1.5;
      const { x, y } = S.pivot === "center" ? { x: w / 2, y: h / 2 } : { x: cam.ax, y: cam.ay };
      g.beginPath(); g.moveTo(x - 10, y); g.lineTo(x + 10, y); g.moveTo(x, y - 10); g.lineTo(x, y + 10); g.stroke();
      g.beginPath(); g.arc(x, y, 16, 0, Math.PI * 2); g.stroke();
      g.globalAlpha = 1;
    }

    const pct = Math.round(cam.s * 100);
    if (pctEl.textContent !== pct + "%") pctEl.textContent = pct + "%";
    api.read("scale", pct + "%");
    api.read("pivot", lastPivot ? `${Math.round(cam.ax)}, ${Math.round(cam.ay)}` : "–");
    api.read("input", lastInput);
    api.read("delta", lastDelta);

    const [mn, mx] = lim();
    if (hitLimit && pivotShow > 0) api.status(`배율 한계에 닿았다 · ${Math.round((cam.ts >= mx ? mx : mn) * 100)}%`, "alt");
    else if (pinch) api.status(`핀치로 확대 중 · ${pct}%`, "active");
    else if (Math.abs(cam.ts - cam.s) > 0.001) api.status(`${cam.ts > cam.s ? "확대" : "축소"} 중 · ${pct}%`, "active");
    else if (pts.size === 1) api.status("끌어서 이동 중", "alt");
    else api.status(`대기 · ${pct}%`, "idle");
  });
}
