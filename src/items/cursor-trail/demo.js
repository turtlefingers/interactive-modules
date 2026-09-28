import { clamp, lerp, localPoint, fitCanvas } from "../../lib/util.js";

export default function demo(api) {
  const { el, S } = api;
  const SP = 3;          // 다시 찍는 간격 px
  const DOT = 16;        // 점 간격
  const STAMP = 44;      // 도형 간격

  api.css(`
    .cursor-trail-demo { position: absolute; inset: 0; cursor: crosshair; touch-action: none;
      background: var(--board);
      background-image: linear-gradient(var(--grid) 1px, transparent 1px), linear-gradient(90deg, var(--grid) 1px, transparent 1px);
      background-size: 100px 100px; }
  `);
  const root = document.createElement("div");
  root.className = "cursor-trail-demo";
  el.appendChild(root);
  const { g, size } = fitCanvas(api, { parent: root });

  const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const INKC = hex(api.color("--ink") || "#1b1b1a");

  const pts = [];
  let stroke = 0, arc = 0, carry = 0, lastEmit = null;
  let raw = null, mid = null, lastT = 0, spd = 0, moved = false;
  const cur = { x: -99, y: -99, inside: false };
  let sw = S.speedWidth ? 1 : 0, tp = S.taper ? 1 : 0;

  const emit = (x, y, now) => {
    let ang = 0;
    if (lastEmit) ang = Math.atan2(y - lastEmit.y, x - lastEmit.x);
    const prevS = arc;
    const p = { x, y, t: now, s: arc, sp: spd, stroke, ang,
      dot: Math.floor(prevS / DOT) !== Math.floor((prevS - SP) / DOT),
      stamp: Math.floor(prevS / STAMP) !== Math.floor((prevS - SP) / STAMP),
      shape: Math.floor(prevS / STAMP) % 5 };
    pts.push(p);
    lastEmit = p;
  };
  // 짧은 직선 조각들을 따라 걸으며 SP 간격으로 점을 찍는다
  const walk = (sample, n, now) => {
    let px = sample(0).x, py = sample(0).y;
    for (let i = 1; i <= n; i++) {
      const q = sample(i / n);
      let d = Math.hypot(q.x - px, q.y - py);
      while (carry + d >= SP) {
        const need = SP - carry;
        const t = need / d;
        px = px + (q.x - px) * t; py = py + (q.y - py) * t;
        d -= need; carry = 0; arc += SP;
        emit(px, py, now);
      }
      carry += d; px = q.x; py = q.y;
    }
  };
  const addRaw = (x, y, now) => {
    if (!raw) {
      raw = { x, y }; mid = { x, y }; carry = 0; lastEmit = null; lastT = now;
      arc += SP; emit(x, y, now);
      return;
    }
    const d = Math.hypot(x - raw.x, y - raw.y);
    const dt = Math.max(1, now - lastT); lastT = now;
    spd = spd * 0.6 + (d / dt) * 0.4;
    if (d < 0.5) return;
    if (S.smooth) {
      const nm = { x: (raw.x + x) / 2, y: (raw.y + y) / 2 };
      const a = mid, c = { ...raw }, b = nm;
      const len = Math.hypot(c.x - a.x, c.y - a.y) + Math.hypot(b.x - c.x, b.y - c.y);
      walk(t => ({ x: (1 - t) * (1 - t) * a.x + 2 * (1 - t) * t * c.x + t * t * b.x,
                   y: (1 - t) * (1 - t) * a.y + 2 * (1 - t) * t * c.y + t * t * b.y }), Math.max(2, Math.ceil(len / 2)), now);
      mid = nm;
    } else {
      const a = { ...raw };
      walk(t => ({ x: a.x + (x - a.x) * t, y: a.y + (y - a.y) * t }), 1, now);
      mid = { x, y };
    }
    raw = { x, y };
  };

  const onMove = e => {
    const now = performance.now();
    const list = e.getCoalescedEvents ? e.getCoalescedEvents() : null;
    const evs = list && list.length ? list : [e];
    const r = el.getBoundingClientRect();
    for (const ev of evs) addRaw(ev.clientX - r.left, ev.clientY - r.top, now);
    const p = localPoint(el, e);
    cur.x = p.x; cur.y = p.y; cur.inside = true;
    if (!moved) { moved = true; api.hideHint(); }
  };
  const endStroke = () => { raw = null; stroke++; spd = 0; cur.inside = false; };
  api.on(root, "pointermove", onMove);
  api.on(root, "pointerdown", e => { endStroke(); onMove(e); });
  api.on(root, "pointerleave", endStroke);
  api.on(root, "pointerup", e => { if (e.pointerType !== "mouse") endStroke(); });

  const colorAt = (s, k) => `rgba(${INKC[0]},${INKC[1]},${INKC[2]},${k})`;
  const taper = k => lerp(1, 0.15 + 0.85 * k, tp);
  const widthOf = p => lerp(6, clamp(1.5 + p.sp * 5, 1.5, 20), sw);

  const shape = (x, y, r, rot, kind) => {
    g.save(); g.translate(x, y); g.rotate(rot); g.beginPath();
    if (kind === 0) { for (let i = 0; i < 10; i++) { const rr = i % 2 ? r * 0.45 : r; const a = -Math.PI / 2 + i * Math.PI / 5; g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } }
    else if (kind === 1) { for (let i = 0; i < 3; i++) { const a = -Math.PI / 2 + i * Math.PI * 2 / 3; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } }
    else if (kind === 2) { const q = r * 0.78; g.roundRect ? g.roundRect(-q, -q, q * 2, q * 2, r * 0.25) : g.rect(-q, -q, q * 2, q * 2); }
    else if (kind === 3) { g.arc(0, 0, r * 0.8, 0, Math.PI * 2); }
    else { const t = r * 0.32; g.rect(-r, -t, r * 2, t * 2); g.rect(-t, -r, t * 2, r * 2); }
    g.closePath(); g.fill(); g.restore();
  };

  api.frame(dt => {
    const now = performance.now();
    const step = dt / 16.67;
    sw += ((S.speedWidth ? 1 : 0) - sw) * (1 - Math.pow(0.88, step));
    tp += ((S.taper ? 1 : 0) - tp) * (1 - Math.pow(0.88, step));
    const L = S.life * 1000;
    while (pts.length && now - pts[0].t > L) pts.shift();
    if (raw && now - lastT > 60) spd *= Math.pow(0.8, step);

    g.clearRect(0, 0, size.w, size.h);
    g.lineCap = "round"; g.lineJoin = "round";
    const style = S.style;
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      const k = clamp(1 - (now - p.t) / L, 0, 1);
      if (style === "line" || style === "dash") {
        if (i === 0) continue;
        const q = pts[i - 1];
        if (q.stroke !== p.stroke) continue;
        if (style === "dash" && (p.s % 18) > 10) continue;
        g.strokeStyle = colorAt(p.s, Math.pow(k, 0.7));
        g.lineWidth = Math.max(0.5, widthOf(p) * taper(k));
        g.beginPath(); g.moveTo(q.x, q.y); g.lineTo(p.x, p.y); g.stroke();
      } else if (style === "dot" && p.dot) {
        const age = now - p.t, pop = Math.min(1, age / 90);
        g.fillStyle = colorAt(p.s, Math.pow(k, 0.7));
        g.beginPath(); g.arc(p.x, p.y, Math.max(0.5, widthOf(p) * 0.6 * taper(k) * (0.6 + 0.4 * pop)), 0, Math.PI * 2); g.fill();
      } else if (style === "stamp" && p.stamp) {
        const age = now - p.t, pop = Math.min(1, age / 90);
        g.fillStyle = colorAt(p.s, Math.pow(k, 0.6));
        shape(p.x, p.y, (6 + widthOf(p) * 0.9) * pop * taper(k), p.ang, p.shape);
      }
    }

    const alive = pts.length;
    const len = alive > 1 ? pts[alive - 1].s - pts[0].s : 0;
    api.read("points", alive);
    api.read("speed", spd.toFixed(1));
    api.read("length", Math.round(len));
    api.read("life", S.life.toFixed(1));
    if (raw && now - lastT < 80) api.status(`그리는 중 · ${spd.toFixed(1)} px/ms`, "active");
    else if (alive) api.status(`사라지는 중 · 점 ${alive}개 남음`, "alt");
    else api.status("대기", "idle");
  });
}
