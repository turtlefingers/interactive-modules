import { clamp, lerp, localPoint, fitCanvas } from "../../lib/util.js";

export default function demo(api) {
  const { el, S } = api;

  api.css(`
    .freehand-root { position: absolute; inset: 0; background: var(--board); cursor: crosshair; }
    .freehand-tools { position: absolute; right: 16px; bottom: 16px; display: flex; gap: 8px; z-index: 40; }
    .freehand-tools button { font: inherit; font-size: 13px; font-weight: 600; color: var(--ink); background: var(--chip-bg);
      border: 1px solid rgba(0,0,0,.14); border-radius: var(--r-pill); padding: 7px 14px; cursor: pointer; }
    .freehand-tools button:hover { border-color: var(--ink-3); }
    .freehand-tools button:disabled { color: var(--ink-3); cursor: default; border-color: rgba(0,0,0,.08); }
  `);
  const root = document.createElement("div");
  root.className = "freehand-root";
  el.appendChild(root);
  const { g, size } = fitCanvas(api, { parent: root });
  const tools = document.createElement("div");
  tools.className = "freehand-tools";
  tools.innerHTML = `<button data-a="undo">되돌리기</button><button data-a="clear">모두 지우기</button>`;
  root.appendChild(tools);
  const undoBtn = tools.querySelector('[data-a="undo"]'), clearBtn = tools.querySelector('[data-a="clear"]');

  const COLORS = { ink: "#1b1b1a", accent: "#ff5a36", grey: "#9a9790" };
  const strokes = [];
  let cur = null, rawFade = 0, speed = 0;

  /* ---------- 입력 ---------- */
  const addPoint = (x, y, t) => {
    const pts = cur.pts, last = pts[pts.length - 1];
    if (last) {
      const d = Math.hypot(x - last.x, y - last.y);
      if (d < 1) return;
      const v = d / Math.max(1, t - last.t);          // px/ms
      cur.len += d;
      speed = lerp(speed, v * 1000, 0.3);
      pts.push({ x, y, t, v });
    } else pts.push({ x, y, t, v: 0 });
  };
  api.on(root, "pointerdown", e => {
    if (e.target.closest(".freehand-tools")) return;
    e.preventDefault();
    root.setPointerCapture(e.pointerId);
    const p = localPoint(root, e);
    cur = { pts: [], color: COLORS[S.color], born: performance.now(), alpha: 1, len: 0, removing: false };
    addPoint(p.x, p.y, performance.now());
    strokes.push(cur);
    rawFade = 1;
    api.hideHint();
  });
  api.on(root, "pointermove", e => {
    if (!cur) return;
    const r = root.getBoundingClientRect();
    const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
    (evs.length ? evs : [e]).forEach(ev => addPoint(ev.clientX - r.left, ev.clientY - r.top, ev.timeStamp || performance.now()));
  });
  const end = () => {
    if (!cur) return;
    cur.born = performance.now();
    cur = null;
  };
  api.on(root, "pointerup", end);
  api.on(root, "pointercancel", end);

  const undo = () => {
    const s = [...strokes].reverse().find(q => !q.removing && q !== cur);
    if (s) { s.removing = true; api.flash("마지막 획을 되돌렸다", "ok"); }
  };
  api.on(undoBtn, "click", undo);
  api.on(clearBtn, "click", () => { strokes.forEach(s => { if (s !== cur) s.removing = true; }); });
  api.on(window, "keydown", e => {
    if (e.target.closest && e.target.closest("input, textarea, [contenteditable]")) return;
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") { e.preventDefault(); undo(); }
  });

  /* ---------- 그리기 ---------- */
  // 원래 점들을 지수 이동 평균으로 끌어당겨 매끄럽게 만든다
  function smoothPts(pts) {
    const a = 1 - S.smooth * 0.9;
    const out = [];
    let sx = pts[0].x, sy = pts[0].y, w = 1;
    for (const p of pts) {
      sx += (p.x - sx) * a; sy += (p.y - sy) * a;
      const tw = S.speedWidth ? clamp(1.6 - p.v / 1.3, 0.3, 1.6) : 1;
      w += (tw - w) * 0.25;
      out.push({ x: sx, y: sy, w });
    }
    return out;
  }
  function drawStroke(s) {
    const pts = smoothPts(s.pts), W = S.width;
    g.strokeStyle = s.color; g.fillStyle = s.color; g.lineCap = "round"; g.lineJoin = "round";
    g.globalAlpha = s.alpha;
    if (pts.length === 1) { g.beginPath(); g.arc(pts[0].x, pts[0].y, W * pts[0].w / 2, 0, 7); g.fill(); return; }
    if (!S.speedWidth) {
      g.lineWidth = W;
      g.beginPath(); g.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length - 1; i++) { const m = { x: (pts[i].x + pts[i + 1].x) / 2, y: (pts[i].y + pts[i + 1].y) / 2 }; g.quadraticCurveTo(pts[i].x, pts[i].y, m.x, m.y); }
      const l = pts[pts.length - 1]; g.lineTo(l.x, l.y); g.stroke();
      return;
    }
    // 굵기가 바뀌는 선: 구간마다 따로 긋는다
    let px = pts[0].x, py = pts[0].y;
    for (let i = 1; i < pts.length; i++) {
      const nx = i < pts.length - 1 ? (pts[i].x + pts[i + 1].x) / 2 : pts[i].x, ny = i < pts.length - 1 ? (pts[i].y + pts[i + 1].y) / 2 : pts[i].y;
      g.lineWidth = W * pts[i].w;
      g.beginPath(); g.moveTo(px, py); g.quadraticCurveTo(pts[i].x, pts[i].y, nx, ny); g.stroke();
      px = nx; py = ny;
    }
  }

  /* ---------- 루프 ---------- */
  api.frame((dt) => {
    const now = performance.now();
    g.clearRect(0, 0, size.w, size.h);
    for (let i = strokes.length - 1; i >= 0; i--) {
      const s = strokes[i];
      let target = 1;
      if (s.removing) target = 0;
      else if (S.fade && s !== cur) target = clamp(1 - ((now - s.born) / 1000 - 1.2) / 2.5, 0, 1);
      s.alpha = s.removing ? Math.max(0, s.alpha - dt / 180) : lerp(s.alpha, target, 0.12);
      if (s.removing && s.alpha <= 0) strokes.splice(i, 1);
    }
    let total = 0;
    for (const s of strokes) { total += s.pts.length; if (s.alpha > 0.005) drawStroke(s); }
    while (total > 40000 && strokes.length > 1) total -= strokes.shift().pts.length;
    g.globalAlpha = 1;

    // 지금 긋는 획의 원래 입력점 (매끄럽게 만들기 전)
    const last = cur || strokes[strokes.length - 1];
    if (!cur) rawFade = Math.max(0, rawFade - dt / 700);
    if (last && rawFade > 0 && S.smooth > 0.02) {
      g.fillStyle = `rgba(27,27,26,${0.35 * rawFade})`;
      for (const p of last.pts) g.fillRect(p.x - 1, p.y - 1, 2, 2);
    }

    if (!cur) speed = lerp(speed, 0, 0.2);
    const live = strokes.filter(s => !s.removing).length;
    undoBtn.disabled = clearBtn.disabled = live === 0;
    api.read("points", cur ? cur.pts.length : 0);
    api.read("speed", Math.round(speed) + "px/s");
    api.read("strokes", live);
    api.read("len", Math.round(cur ? cur.len : last ? last.len : 0) + "px");

    if (cur) api.status(`긋는 중 · 점 ${cur.pts.length}개`, "active");
    else if (S.fade && strokes.some(s => s.alpha > 0.02 && !s.removing)) api.status("획이 서서히 사라지는 중", "alt");
    else api.status(live ? `대기 · 획 ${live}개` : "대기", "idle");
  });
}
