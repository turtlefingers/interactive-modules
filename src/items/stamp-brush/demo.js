import { clamp, lerp, localPoint, fitCanvas } from "../../lib/util.js";

export default function demo(api) {
  const { el, S } = api;

  api.css(`
    .stamp-brush-root { position: absolute; inset: 0; background: var(--board); cursor: crosshair; }
    .stamp-brush-tools { position: absolute; right: 16px; bottom: 16px; display: flex; gap: 8px; z-index: 40; }
    .stamp-brush-tools button { font: inherit; font-size: 13px; font-weight: 600; color: var(--ink); background: var(--chip-bg);
      border: 1px solid rgba(0,0,0,.14); border-radius: var(--r-pill); padding: 7px 14px; cursor: pointer; }
    .stamp-brush-tools button:hover { border-color: var(--ink-3); }
    .stamp-brush-tools button:disabled { color: var(--ink-3); cursor: default; border-color: rgba(0,0,0,.08); }
  `);
  const root = document.createElement("div");
  root.className = "stamp-brush-root";
  el.appendChild(root);
  const { g, size } = fitCanvas(api, { parent: root });
  const tools = document.createElement("div");
  tools.className = "stamp-brush-tools";
  tools.innerHTML = `<button data-a="undo">되돌리기</button><button data-a="clear">모두 지우기</button>`;
  root.appendChild(tools);
  const undoBtn = tools.querySelector('[data-a="undo"]'), clearBtn = tools.querySelector('[data-a="clear"]');

  const INK = "#1b1b1a", ACC = "#ff5a36";

  /* ---------- 모양 ---------- */
  // 모두 오른쪽(+x)을 진행 방향으로 그린다
  function shape(kind, r, side) {
    g.beginPath();
    if (kind === "dot") { g.arc(0, 0, r * 0.5, 0, 7); g.fill(); }
    else if (kind === "star") {
      for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2, rr = i % 2 ? r * 0.24 : r * 0.6; g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
      g.closePath(); g.fill();
    } else if (kind === "leaf") {
      g.moveTo(-r * 0.7, 0); g.quadraticCurveTo(0, -r * 0.55, r * 0.7, 0); g.quadraticCurveTo(0, r * 0.55, -r * 0.7, 0); g.fill();
      g.strokeStyle = "#efe9dd"; g.lineWidth = 1.2; g.beginPath(); g.moveTo(-r * 0.6, 0); g.lineTo(r * 0.55, 0); g.stroke();
    } else if (kind === "foot") {
      g.save(); g.scale(1, side);
      g.ellipse(-r * 0.1, 0, r * 0.52, r * 0.26, 0, 0, 7); g.fill();
      [[0.5, -0.2, 0.11], [0.56, 0, 0.1], [0.52, 0.18, 0.09], [0.44, 0.32, 0.08]].forEach(([x, y, rr]) => { g.beginPath(); g.arc(x * r, y * r, rr * r, 0, 7); g.fill(); });
      g.restore();
    }
  }

  /* ---------- 경로와 도장 ---------- */
  const strokes = [];   // { pts:[], stamps:[], removing, alpha }
  let cur = null, since = 0, lastAng = 0, step = 0;

  const place = (x, y, ang) => {
    const sc = S.scatter;
    const jitterS = 1 + (Math.random() - 0.5) * 1.2 * sc;
    const off = (Math.random() - 0.5) * S.size * 2.2 * sc;
    const side = S.shape === "foot" ? (step % 2 ? 1 : -1) : 1;
    const perp = S.shape === "foot" ? side * S.size * 0.32 : 0;
    const jit = (Math.random() - 0.5) * Math.PI * 1.2 * sc;
    const rot = (S.rotate ? ang : 0) + jit;
    const nx = -Math.sin(ang), ny = Math.cos(ang);
    cur.stamps.push({
      x: x + nx * (off + perp), y: y + ny * (off + perp), rot, jit, s: S.size * jitterS, shape: S.shape, side, t0: performance.now()
    });
    step++;
  };

  api.on(root, "pointerdown", e => {
    if (e.target.closest(".stamp-brush-tools")) return;
    e.preventDefault();
    root.setPointerCapture(e.pointerId);
    const p = localPoint(root, e);
    cur = { pts: [p], stamps: [], removing: false, alpha: 1, len: 0 };
    strokes.push(cur);
    since = 0; step = 0;
    place(p.x, p.y, lastAng);
    api.hideHint();
  });
  api.on(root, "pointermove", e => {
    if (!cur) return;
    const p = localPoint(root, e), last = cur.pts[cur.pts.length - 1];
    const dx = p.x - last.x, dy = p.y - last.y, d = Math.hypot(dx, dy);
    if (d < 0.5) return;
    const ang = Math.atan2(dy, dx);
    // 첫 도장은 방향을 모른 채 찍혔으니 처음 움직인 방향으로 맞춘다
    if (cur.pts.length === 1 && cur.stamps.length === 1 && S.rotate) cur.stamps[0].rot = ang + cur.stamps[0].jit;
    lastAng = ang;
    // 일정한 간격마다 정확한 위치에 찍는다
    let t = 0;
    while (since + (d - t) >= S.spacing) {
      t += S.spacing - since;
      since = 0;
      place(last.x + dx * t / d, last.y + dy * t / d, ang);
    }
    since += d - t;
    cur.len += d;
    cur.pts.push(p);
  });
  const end = () => { cur = null; };
  api.on(root, "pointerup", end);
  api.on(root, "pointercancel", end);

  const undo = () => { const s = [...strokes].reverse().find(q => !q.removing && q !== cur); if (s) { s.removing = true; api.flash("마지막 획을 되돌렸다", "ok"); } };
  api.on(undoBtn, "click", undo);
  api.on(clearBtn, "click", () => strokes.forEach(s => { if (s !== cur) s.removing = true; }));
  api.on(window, "keydown", e => {
    if (e.target.closest && e.target.closest("input, textarea, [contenteditable]")) return;
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") { e.preventDefault(); undo(); }
  });

  /* ---------- 루프 ---------- */
  let pathA = S.path ? 1 : 0;
  api.frame((dt) => {
    const now = performance.now();
    g.clearRect(0, 0, size.w, size.h);
    pathA = lerp(pathA, S.path ? 1 : 0, 0.15);
    let total = 0;
    for (let i = strokes.length - 1; i >= 0; i--) {
      const s = strokes[i];
      if (s.removing) { s.alpha -= dt / 180; if (s.alpha <= 0) { strokes.splice(i, 1); continue; } }
      total += s.stamps.length;
    }
    while (total > 5000 && strokes.length > 1) total -= strokes.shift().stamps.length;

    for (const s of strokes) {
      // 지나간 경로
      if (pathA > 0.01 && s.pts.length > 1) {
        g.globalAlpha = s.alpha * pathA;
        g.strokeStyle = "rgba(27,27,26,.28)"; g.lineWidth = 1; g.setLineDash([3, 4]);
        g.beginPath(); s.pts.forEach((p, i) => i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y)); g.stroke();
        g.setLineDash([]);
      }
      g.globalAlpha = s.alpha;
      for (const st of s.stamps) {
        const k = clamp((now - st.t0) / 140, 0, 1), pop = 0.5 + 0.5 * (1 - Math.pow(1 - k, 3));
        g.save(); g.translate(st.x, st.y); g.rotate(st.rot); g.scale(pop, pop);
        g.fillStyle = now - st.t0 < 260 ? ACC : INK; shape(st.shape, st.s, st.side);
        g.restore();
      }
    }
    g.globalAlpha = 1;

    const live = strokes.filter(s => !s.removing);
    undoBtn.disabled = clearBtn.disabled = live.length === 0;
    const count = live.reduce((n, s) => n + s.stamps.length, 0);
    api.read("count", count);
    api.read("next", cur ? Math.round(S.spacing - since) + "px" : "–");
    api.read("angle", Math.round((lastAng * 180 / Math.PI + 360) % 360) + "°");
    api.read("len", Math.round(cur ? cur.len : live.length ? live[live.length - 1].len : 0) + "px");

    if (cur) api.status(`찍는 중 · ${S.spacing}px마다 한 번 · 이번 획 ${cur.stamps.length}개`, "active");
    else api.status(count ? `대기 · 도장 ${count}개` : "대기", "idle");
  });
}
