import { clamp, rng, localPoint, fitCanvas } from "../../lib/util.js";
import { eye, face, circle, ILLO, ILLO_CYCLE } from "../../lib/draw.js";

export default function demo(api) {
  const { el, S } = api;
  const MAX = 36;
  const TAU = Math.PI * 2;

  api.css(`
    .look-at-demo { position: absolute; inset: 0; cursor: crosshair; touch-action: none;
      background: var(--board);
      background-image: linear-gradient(var(--grid) 1px, transparent 1px), linear-gradient(90deg, var(--grid) 1px, transparent 1px);
      background-size: 100px 100px; }
  `);
  const root = document.createElement("div");
  root.className = "look-at-demo";
  el.appendChild(root);
  const { g, size } = fitCanvas(api, { parent: root });
  const C = { ink: api.color("--ink"), ink3: api.color("--ink-3"), accent: api.color("--accent"), note: api.color("--note") };

  const rand = rng(11);
  const L = [];
  for (let i = 0; i < MAX; i++) {
    L.push({ x: size.w / 2, y: size.h / 2, tx: size.w / 2, ty: size.h / 2, R: 40, tR: 40, sc: 0,
      eyes: [{ x: 0, y: 0 }, { x: 0, y: 0 }], rel: 0, fx: 0, fy: 0, tilt: 0,
      col: i % 6, blinkAt: -1, nextBlink: performance.now() + 800 + rand() * 5000 });
  }

  const layout = () => {
    const n = S.count, w = size.w, h = size.h;
    const cols = clamp(Math.round(Math.sqrt(n * w / h)), 1, n), rows = Math.ceil(n / cols);
    const aw = w * 0.84, ah = h * 0.72, cw = aw / cols, ch = ah / rows;
    const R = clamp(Math.min(cw, ch) * 0.36, 14, 110);
    for (let i = 0; i < MAX; i++) {
      const o = L[i];
      if (i >= n) continue;
      const r = Math.floor(i / cols), c = i % cols;
      const inRow = r === rows - 1 ? n - r * cols : cols;
      o.tx = w / 2 + (c - (inRow - 1) / 2) * cw;
      o.ty = h / 2 + 12 + (r - (rows - 1) / 2) * ch;
      o.tR = R;
      if (o.sc < 0.02) { o.x = o.tx; o.y = o.ty; o.R = R; }
    }
  };
  layout();
  api.onResize(layout);
  api.onParam(k => { if (k === "count") layout(); });

  const cur = { x: 0, y: 0, inside: false };
  let moved = false;
  const move = e => {
    const p = localPoint(el, e);
    cur.x = p.x; cur.y = p.y; cur.inside = true;
    if (!moved) { moved = true; api.hideHint(); }
  };
  api.on(root, "pointermove", move);
  api.on(root, "pointerdown", move);
  api.on(root, "pointerleave", () => { cur.inside = false; });

  let vis = S.kind, gm = 1;
  let guideA = S.guide ? 1 : 0; // 가이드선 표시 정도 (토글 시 부드럽게)
  const wrapPi = a => ((a + Math.PI) % TAU + TAU) % TAU - Math.PI;

  const blinkAmt = (o, now) => {
    if (o.blinkAt < 0) return 0;
    const t = (now - o.blinkAt) / 170;
    if (t >= 1) { o.blinkAt = -1; return 0; }
    return Math.sin(t * Math.PI);
  };

  const lwFor = r => clamp(r * 0.05, 1.2, 1.8);
  const drawEye = (x, y, r, p, travel, b) => {
    g.save();
    g.translate(x, y); g.scale(1, 1 - 0.92 * b);
    eye(g, 0, 0, r, { look: { x: p.x * travel / (r * 0.45), y: p.y * travel / (r * 0.45) }, lw: lwFor(r) });
    g.restore();
  };

  api.frame(dt => {
    const now = performance.now();
    const step = dt / 16.67;
    const f = 1 - Math.pow(1 - S.smooth, step);
    const e = 1 - Math.pow(0.85, step);
    // 개체 종류 바꾸기: 작아졌다가 새 모양으로 커진다
    if (S.kind !== vis) { gm += (0 - gm) * (1 - Math.pow(0.7, step)); if (gm < 0.04) { vis = S.kind; gm = 0.04; } }
    else gm += (1 - gm) * (1 - Math.pow(0.8, step));

    g.clearRect(0, 0, size.w, size.h);
    guideA += ((S.guide ? 1 : 0) - guideA) * (1 - Math.pow(0.85, step));
    let near = null, nd = Infinity;
    for (let i = 0; i < MAX; i++) {
      const o = L[i];
      const scT = i < S.count ? 1 : 0;
      o.sc += (scT - o.sc) * e; if (Math.abs(scT - o.sc) < 0.003) o.sc = scT;
      o.x += (o.tx - o.x) * e; o.y += (o.ty - o.y) * e; o.R += (o.tR - o.R) * e;
      if (o.sc <= 0) continue;
      if (S.blink && o.blinkAt < 0 && now > o.nextBlink) { o.blinkAt = now; o.nextBlink = now + 1800 + Math.random() * 5200; }
      if (!S.blink && o.blinkAt < 0) o.nextBlink = now + 600 + Math.random() * 3000;
      const b = blinkAmt(o, now);
      const R = o.R * o.sc * gm;
      const dx = cur.x - o.x, dy = cur.y - o.y, d = Math.hypot(dx, dy) || 1;
      if (cur.inside && i < S.count && d < nd) { nd = d; near = o; }

      if (vis === "eyes") {
        const er = R * 0.46;
        [-1, 1].forEach((side, k) => {
          const ex = o.x + side * R * 0.52, ey = o.y;
          const p = o.eyes[k];
          let tx = 0, ty = 0;
          if (cur.inside) {
            const ddx = cur.x - ex, ddy = cur.y - ey, dd = Math.hypot(ddx, ddy) || 1;
            const m = Math.min(dd / 150, 1);
            tx = ddx / dd * m; ty = ddy / dd * m;
          }
          p.x += (tx - p.x) * f; p.y += (ty - p.y) * f;
          drawEye(ex, ey, er, p, (er - er * 0.52 - 1) * S.limit, b);
        });
      } else if (vis === "arrow") {
        const lim = S.limit * Math.PI;
        const tr = cur.inside ? wrapPi(Math.atan2(dy, dx) + Math.PI / 2) : 0;
        if (S.limit >= 0.99) o.rel = wrapPi(o.rel + wrapPi(tr - o.rel) * f);
        else { o.rel = clamp(wrapPi(o.rel), -lim, lim); o.rel += (clamp(tr, -lim, lim) - o.rel) * f; }
        // 돌 수 있는 범위
        g.save(); g.translate(o.x, o.y);
        g.fillStyle = `rgba(0,0,0,${0.05 * guideA})`;
        if (guideA > 0.01 && S.limit < 0.99) { g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, R * 1.05, -Math.PI / 2 - lim, -Math.PI / 2 + lim); g.closePath(); g.fill(); }
        g.rotate(o.rel);
        g.fillStyle = C.ink;
        const sw = Math.max(2, R * 0.08), hl = R * 0.36;
        g.beginPath();
        g.moveTo(-sw / 2, R * 0.55); g.lineTo(-sw / 2, -R + hl); g.lineTo(-R * 0.26, -R + hl);
        g.lineTo(0, -R); g.lineTo(R * 0.26, -R + hl); g.lineTo(sw / 2, -R + hl); g.lineTo(sw / 2, R * 0.55);
        g.closePath(); g.fill();
        g.beginPath(); g.arc(0, 0, Math.max(2.5, R * 0.08), 0, TAU); g.fill();
        g.restore();
      } else {
        const m = cur.inside ? Math.min(d / 180, 1) : 0;
        const tfx = cur.inside ? dx / d * m * S.limit : 0, tfy = cur.inside ? dy / d * m * S.limit : 0;
        const tt = cur.inside ? clamp(dx / (size.w * 0.35), -1, 1) * 0.38 * S.limit : 0;
        o.fx += (tfx - o.fx) * f; o.fy += (tfy - o.fy) * f; o.tilt += (tt - o.tilt) * f;
        g.save(); g.translate(o.x + o.fx * R * 0.08, o.y + o.fy * R * 0.06); g.rotate(o.tilt);
        const lw = lwFor(R);
        circle(g, 0, 0, R, { fill: [ILLO.blue, ILLO.orange, ILLO.skin, ILLO.pink][o.col % 4] });
        // 이목구비가 커서 쪽으로 쏠려 고개를 돌린 것처럼 보인다
        face(g, o.fx * R * 0.3, o.fy * R * 0.22, R, { look: { x: o.fx, y: o.fy }, mood: b > 0.5 ? "sleepy" : "happy", lw });
        g.restore();
      }
    }
    // 커서 표시 + 가장 가까운 개체와 잇는 선
    if (cur.inside && guideA > 0.01) {
      g.globalAlpha = guideA;
      if (near) {
        g.save(); g.setLineDash([3, 6]); g.strokeStyle = C.ink3; g.globalAlpha = 0.6 * guideA; g.lineWidth = 1.2;
        g.beginPath(); g.moveTo(near.x, near.y); g.lineTo(cur.x, cur.y); g.stroke(); g.restore();
      }
      g.strokeStyle = C.accent; g.lineWidth = 2;
      g.beginPath(); g.arc(cur.x, cur.y, 6, 0, TAU); g.stroke();
      g.globalAlpha = 1;
    }

    api.read("cursor", cur.inside ? `${Math.round(cur.x)}, ${Math.round(cur.y)}` : "화면 밖");
    api.read("count", S.count);
    if (near) {
      api.read("angle", Math.round((Math.atan2(cur.y - near.y, cur.x - near.x) * 180 / Math.PI + 360) % 360));
      api.read("dist", Math.round(nd));
    } else { api.read("angle", "–"); api.read("dist", "–"); }
    if (cur.inside) api.status(`${S.count}개가 커서를 바라보는 중`, "active");
    else api.status(moved ? "커서가 없어 정면으로 돌아오는 중" : "대기", "idle");
  });
}
