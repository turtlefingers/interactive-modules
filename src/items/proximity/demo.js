import { clamp, lerp, localPoint, fitCanvas } from "../../lib/util.js";
import { TONE } from "../../lib/draw.js";

export default function demo(api) {
  const { el, S } = api;
  const TAU = Math.PI * 2;

  api.css(`
    .proximity-demo { position: absolute; inset: 0; cursor: crosshair; touch-action: none; background: var(--board); }
    .proximity-demo.is-press { cursor: pointer; }
  `);
  const root = document.createElement("div");
  root.className = "proximity-demo";
  el.appendChild(root);
  const { g, size } = fitCanvas(api, { parent: root });
  const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const C = { ink: api.color("--ink"), ink3: api.color("--ink-3"), accent: api.color("--accent"), note: api.color("--note") };
  const INK = hex(C.ink || "#1b1b1a"), ACC = hex(C.accent || "#ff5a36");

  const mk = (bx, by) => ({ bx, by, s: 1, dx: 0, dy: 0, heat: 0, u: 0 });
  let dots = [], icons = [];
  const SP = 34;
  const build = () => {
    const w = size.w, h = size.h;
    const cols = Math.floor((w - 40) / SP), rows = Math.floor((h - 40) / SP);
    const x0 = (w - (cols - 1) * SP) / 2, y0 = (h - (rows - 1) * SP) / 2;
    const old = dots; dots = [];
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const d = mk(x0 + c * SP, y0 + r * SP);
      const o = old[r * cols + c]; if (o) { d.s = o.s; d.heat = o.heat; }
      dots.push(d);
    }
    const n = w < 600 ? 7 : 9;
    if (icons.length !== n) icons = Array.from({ length: n }, () => mk(0, 0));
  };
  build();
  api.onResize(build);

  const cur = { x: -999, y: -999, inside: false, down: false };
  let moved = false, ga = S.layout === "dock" ? 1 : 0, guideA = S.guide ? 1 : 0, ringR = S.radius;
  const move = e => {
    const p = localPoint(el, e);
    cur.x = p.x; cur.y = p.y; cur.inside = true;
    if (!moved) { moved = true; api.hideHint(); }
  };
  api.on(root, "pointermove", move);
  api.on(root, "pointerdown", e => {
    e.preventDefault(); root.setPointerCapture(e.pointerId);
    cur.down = true; root.classList.add("is-press"); move(e);
  });
  const up = e => { cur.down = false; root.classList.remove("is-press"); if (e.pointerType !== "mouse") cur.inside = false; };
  api.on(root, "pointerup", up);
  api.on(root, "pointercancel", up);
  api.on(root, "pointerleave", () => { if (!cur.down) cur.inside = false; });

  const curve = x => {
    if (x >= 1) return 0;
    const t = 1 - x;
    if (S.falloff === "linear") return t;
    if (S.falloff === "sharp") return t * t * t;
    return t * t * (3 - 2 * t);
  };

  // 한 개체의 목표값 계산 → 부드럽게 따라가기
  const react = (o, bx, by, step, big) => {
    const active = cur.inside && (!S.pressOnly || cur.down);
    const dx = cur.x - bx, dy = cur.y - by, d = Math.hypot(dx, dy) || 0.001, R = S.radius;
    const u = active ? curve(d / R) : 0;
    o.u = u;
    let ts = 1, tx = 0, ty = 0;
    const ef = S.effect;
    if (ef === "scale") ts = 1 + u * (big ? 1.1 : 2);
    else if (ef === "shrink") ts = 1 - u * 0.92;
    else if (ef === "attract") { const m = u * Math.min(d, R) * 0.45; tx = dx / d * m; ty = dy / d * m; }
    else if (ef === "distort") {
      const x = d / R;
      if (active && x < 1) { const m = Math.sin(Math.PI * x) * R * 0.22 * (0.4 + 0.6 * curve(x * 0.5)); tx = -dx / d * m; ty = -dy / d * m; }
      ts = 1 + u * 0.6;
    } else if (ef === "ignite") {
      o.heat = Math.min(1, o.heat + u * 0.12 * step);
      ts = 1 + o.heat * (big ? 0.35 : 0.9);
    }
    o.heat *= Math.pow(ef === "ignite" ? 0.988 : 0.9, step);
    const e = 1 - Math.pow(0.8, step);
    o.s += (ts - o.s) * e; o.dx += (tx - o.dx) * e; o.dy += (ty - o.dy) * e;
    return d;
  };
  const TONE2 = hex(TONE[2]);
  const colorOf = (o, from = INK) => {
    const k = clamp(o.heat, 0, 1);
    return `rgb(${lerp(from[0], ACC[0], k) | 0},${lerp(from[1], ACC[1], k) | 0},${lerp(from[2], ACC[2], k) | 0})`;
  };

  api.frame(dt => {
    const step = dt / 16.67;
    const w = size.w, h = size.h;
    const e = 1 - Math.pow(0.85, step);
    ga += ((S.layout === "dock" ? 1 : 0) - ga) * e;
    guideA += ((S.guide ? 1 : 0) - guideA) * e;
    ringR += (S.radius - ringR) * e;
    g.clearRect(0, 0, w, h);

    let nearest = Infinity, affected = 0, peak = 0;
    const tally = (o, d, on) => { if (!on) return; if (d < nearest) nearest = d; if (o.u > 0) affected++; peak = Math.max(peak, o.u); };

    /* 점 격자 */
    const gOn = S.layout === "grid";
    for (const o of dots) {
      const d = react(o, o.bx, o.by, step, false);
      tally(o, d, gOn);
      if (ga > 0.99) continue;
      g.globalAlpha = 1 - ga;
      g.fillStyle = colorOf(o);
      g.beginPath(); g.arc(o.bx + o.dx, o.by + o.dy, Math.max(0.3, 3 * o.s), 0, TAU); g.fill();
    }
    g.globalAlpha = 1;

    /* 한 줄 (독): 커진 아이콘이 이웃을 밀어낸다 */
    const n = icons.length, base = w < 600 ? 34 : 48, gap = w < 600 ? 8 : 12;
    const baseW = n * base + (n - 1) * gap;
    const x0 = (w - baseW) / 2, yb = h * 0.58;
    const dOn = S.layout === "dock";
    icons.forEach((o, i) => {
      const bx = x0 + i * (base + gap) + base / 2, by = yb - base / 2;
      const d = react(o, bx, by, step, true);
      tally(o, d, dOn);
    });
    if (ga > 0.01) {
      const tot = icons.reduce((a, o) => a + base * o.s, 0) + (n - 1) * gap;
      let x = w / 2 - tot / 2;
      g.globalAlpha = ga;
      g.strokeStyle = C.ink; g.lineWidth = 1;
      g.beginPath(); g.moveTo(w / 2 - tot / 2 - 16, yb + 8.5); g.lineTo(w / 2 + tot / 2 + 16, yb + 8.5); g.stroke();
      for (const o of icons) {
        const sz = base * o.s;
        const ix = x + o.dx, iy = yb - sz + o.dy;
        // 아이콘: 외곽선 없는 톤 면. 달아오르면 강조색으로
        g.fillStyle = o.heat > 0.01 ? colorOf(o, TONE2) : TONE[2];
        g.beginPath(); g.roundRect ? g.roundRect(ix, iy, sz, sz, sz * 0.22) : g.rect(ix, iy, sz, sz);
        g.fill();
        x += sz + gap;
      }
      g.globalAlpha = 1;
    }

    /* 가이드: 영향 반경 */
    const active = cur.inside && (!S.pressOnly || cur.down);
    if (guideA > 0.01 && cur.inside) {
      g.save(); g.globalAlpha = guideA * (active ? 0.7 : 0.3); g.strokeStyle = C.ink3; g.setLineDash([3, 5]); g.lineWidth = 1.2;
      g.beginPath(); g.arc(cur.x, cur.y, ringR, 0, TAU); g.stroke(); g.restore();
    }

    api.read("cursor", cur.inside ? `${Math.round(cur.x)}, ${Math.round(cur.y)}` : "화면 밖");
    api.read("nearest", cur.inside && nearest < Infinity ? Math.round(nearest) : "–");
    api.read("affected", affected);
    api.read("peak", peak.toFixed(2));
    if (S.pressOnly && cur.inside && !cur.down) api.status("누르고 있을 때만 반응 · 눌러보기", "idle");
    else if (affected) api.status(`반경 안 ${affected}개가 반응하는 중`, "active");
    else if (S.effect === "ignite" && (S.layout === "grid" ? dots : icons).some(o => o.heat > 0.05)) api.status("천천히 식는 중", "alt");
    else api.status("대기", "idle");
  });
}
