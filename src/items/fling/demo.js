import { clamp, localPoint, fitCanvas } from "../../lib/util.js";

export default function demo(api) {
  const { el, S } = api;

  api.css(`
    .fling-root { position: absolute; inset: 0; background: var(--board); }
    .fling-root.is-over { cursor: grab; }
    .fling-root.is-holding { cursor: grabbing; }
  `);
  const root = document.createElement("div");
  root.className = "fling-root";
  el.appendChild(root);
  const { g, size } = fitCanvas(api, { parent: root });
  const C = { ink: api.color("--ink") || "#1b1b1a", ink3: api.color("--ink-3") || "#9a9790", accent: api.color("--accent") || "#ff5a36", ball: api.color("--toggle-off") || "#d6d2ca" };

  /* ---------- 개체 ---------- */
  let s = 1;
  const SPEC = [[0.2, 0.42, 46, 0], [0.4, 0.62, 58, 1], [0.58, 0.38, 38, 2], [0.76, 0.6, 50, 3], [0.88, 0.34, 32, 4]];
  const bodies = SPEC.map(([fx, fy, r, c], i) => ({ i, fx, fy, r0: r, r, c, x: 0, y: 0, vx: 0, vy: 0, a: i, hot: 0, trail: [] }));
  const place = first => {
    const { w, h } = size;
    s = clamp(Math.min(w, h) / 760, 0.55, 1.15);
    bodies.forEach(b => {
      b.r = b.r0 * s;
      if (first) { b.x = b.fx * w; b.y = b.fy * h; }
      b.x = clamp(b.x, b.r, w - b.r); b.y = clamp(b.y, b.r, h - b.r);
    });
  };
  place(true);
  api.onResize(() => place(false));

  /* ---------- 포인터 ---------- */
  const ptr = { held: null, ox: 0, oy: 0, samples: [], vx: 0, vy: 0 };
  let release = null;    // { speed, angle, body }
  let bounces = 0;
  const pick = p => { for (let i = bodies.length - 1; i >= 0; i--) { const b = bodies[i]; if (Math.hypot(p.x - b.x, p.y - b.y) < b.r + 6) return b; } return null; };
  const sampleVel = () => {
    const sm = ptr.samples, now = performance.now();
    if (sm.length < 2 || now - sm[sm.length - 1].t > 80) return { x: 0, y: 0 };   // 멈췄다가 놓으면 속도 0
    const a = sm[0], z = sm[sm.length - 1], dt = Math.max(8, z.t - a.t);
    return { x: (z.x - a.x) / dt * 16.67, y: (z.y - a.y) / dt * 16.67 };
  };

  api.on(root, "pointerdown", e => {
    e.preventDefault();
    const p = localPoint(root, e);
    const b = pick(p);
    if (!b) return;
    root.setPointerCapture(e.pointerId);
    ptr.held = b; ptr.ox = b.x - p.x; ptr.oy = b.y - p.y;
    ptr.samples = [{ x: p.x, y: p.y, t: performance.now() }];
    b.vx = b.vy = 0; b.trail.length = 0;
    bodies.splice(bodies.indexOf(b), 1); bodies.push(b);   // 잡은 것을 맨 앞으로
    root.classList.add("is-holding");
    api.hideHint();
  });
  api.on(root, "pointermove", e => {
    const p = localPoint(root, e);
    if (!ptr.held) { root.classList.toggle("is-over", !!pick(p)); return; }
    const now = performance.now();
    ptr.samples.push({ x: p.x, y: p.y, t: now });
    while (ptr.samples.length > 2 && now - ptr.samples[0].t > 90) ptr.samples.shift();
    const b = ptr.held, { w, h } = size;
    b.x = clamp(p.x + ptr.ox, b.r, w - b.r); b.y = clamp(p.y + ptr.oy, b.r, h - b.r);
  });
  const up = () => {
    const b = ptr.held;
    if (!b) return;
    const v = sampleVel();
    let vx = v.x * S.mult, vy = v.y * S.mult;
    const sp = Math.hypot(vx, vy), MAX = 70;
    if (sp > MAX) { vx *= MAX / sp; vy *= MAX / sp; }
    b.vx = vx; b.vy = vy;
    release = { speed: Math.hypot(vx, vy), angle: Math.atan2(-vy, vx) * 180 / Math.PI, body: b };
    if (release.speed < 0.5) api.flash("멈췄다가 놓아서 속도 0 · 제자리에 놓인다", "idle");
    ptr.held = null;
    root.classList.remove("is-holding");
  };
  api.on(root, "pointerup", up);
  api.on(root, "pointercancel", up);

  /* ---------- 물리 ---------- */
  const hit = (b, nx, ny, force) => { if (force >= 1.2) bounces++; };
  const step = () => {
    const { w, h } = size;
    const gr = S.gravity ? 0.55 * s : 0;
    for (const b of bodies) {
      if (b === ptr.held) continue;
      b.vy += gr;
      b.vx *= S.friction; b.vy *= S.friction;
      b.x += b.vx; b.y += b.vy;
      if (b.x < b.r) { b.x = b.r; hit(b, 1, 0, Math.abs(b.vx)); b.vx = Math.abs(b.vx) * S.bounce; }
      if (b.x > w - b.r) { b.x = w - b.r; hit(b, -1, 0, Math.abs(b.vx)); b.vx = -Math.abs(b.vx) * S.bounce; }
      if (b.y < b.r) { b.y = b.r; hit(b, 0, 1, Math.abs(b.vy)); b.vy = Math.abs(b.vy) * S.bounce; }
      if (b.y > h - b.r) {
        b.y = h - b.r; hit(b, 0, -1, Math.abs(b.vy)); b.vy = -Math.abs(b.vy) * S.bounce;
        if (gr && Math.abs(b.vy) < 1.2) { b.vy = 0; b.vx *= 0.97; }
      }
      if (Math.abs(b.vx) < 0.01) b.vx = 0;
      if (Math.abs(b.vy) < 0.01 && !gr) b.vy = 0;
      b.a += b.vx / b.r;
    }
    // 개체끼리 부딪힘 (잡힌 개체는 무한히 무거운 것으로 본다)
    for (let i = 0; i < bodies.length; i++) for (let j = i + 1; j < bodies.length; j++) {
      const A = bodies[i], B = bodies[j];
      const dx = B.x - A.x, dy = B.y - A.y, d = Math.hypot(dx, dy), md = A.r + B.r;
      if (d >= md || d === 0) continue;
      const nx = dx / d, ny = dy / d, over = md - d;
      const aHeld = A === ptr.held, bHeld = B === ptr.held;
      const ma = aHeld ? 1e9 : A.r * A.r, mb = bHeld ? 1e9 : B.r * B.r, mt = ma + mb;
      A.x -= nx * over * mb / mt; A.y -= ny * over * mb / mt;
      B.x += nx * over * ma / mt; B.y += ny * over * ma / mt;
      const hv = aHeld || bHeld ? sampleVel() : null;
      const avx = aHeld ? hv.x : A.vx, avy = aHeld ? hv.y : A.vy, bvx = bHeld ? hv.x : B.vx, bvy = bHeld ? hv.y : B.vy;
      const rel = (bvx - avx) * nx + (bvy - avy) * ny;
      if (rel >= 0) continue;
      const jImp = -(1 + S.bounce) * rel / (1 / ma + 1 / mb);
      if (!aHeld) { A.vx -= jImp / ma * nx; A.vy -= jImp / ma * ny; hit(A, -nx, -ny, -rel); }
      if (!bHeld) { B.vx += jImp / mb * nx; B.vy += jImp / mb * ny; hit(B, nx, ny, -rel); }
    }
    for (const b of bodies) {
      if (b !== ptr.held && Math.hypot(b.vx, b.vy) > 1.5) b.trail.push(b.x, b.y);
      else if (b.trail.length) b.trail.splice(0, 2);
      if (b.trail.length > 48) b.trail.splice(0, 2);
    }
  };

  /* ---------- 그리기 ---------- */
  const circle = (x, y, r) => { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); };
  const arrow = (x, y, vx, vy) => {
    const len = Math.min(220 * s, Math.hypot(vx, vy) * 7), ang = Math.atan2(vy, vx);
    if (len < 6) return;
    g.save(); g.translate(x, y); g.rotate(ang);
    g.strokeStyle = C.accent; g.fillStyle = C.accent; g.lineWidth = 3; g.lineCap = "round";
    g.setLineDash([2, 7]); g.beginPath(); g.moveTo(0, 0); g.lineTo(len - 10, 0); g.stroke(); g.setLineDash([]);
    g.beginPath(); g.moveTo(len, 0); g.lineTo(len - 12, -7); g.lineTo(len - 12, 7); g.closePath(); g.fill();
    g.restore();
  };
  let arrowA = S.arrow ? 1 : 0, acc = 0;

  api.frame(dt => {
    acc += dt;
    let n = 0;
    while (acc >= 16.67 && n < 4) { step(); acc -= 16.67; n++; }
    if (n === 4) acc = 0;
    arrowA += ((S.arrow ? 1 : 0) - arrowA) * 0.15;

    const { w, h } = size;
    g.clearRect(0, 0, w, h);
    g.strokeStyle = C.ink; g.lineWidth = 2; g.strokeRect(1, 1, w - 2, h - 2);

    g.fillStyle = C.ink3;   // 흔적: 날아간 길
    for (const b of bodies) {
      for (let i = 0; i < b.trail.length; i += 4) { g.globalAlpha = 0.5 * (i / b.trail.length); circle(b.trail[i], b.trail[i + 1], 1.8); g.fill(); }
    }
    g.globalAlpha = 1;

    for (const b of bodies) {
      const on = b === ptr.held || (release && release.body === b && Math.hypot(b.vx, b.vy) > 0.3);
      b.hot += ((on ? 1 : 0) - b.hot) * 0.15;
      circle(b.x, b.y, b.r); g.fillStyle = C.ball; g.fill();
      if (b.hot > 0.01) { g.globalAlpha = b.hot; g.fillStyle = C.accent; g.fill(); g.globalAlpha = 1; }
      g.strokeStyle = C.ink; g.lineWidth = 1; g.stroke();
      // 구르는 방향을 보여주는 점 하나
      circle(b.x + Math.cos(b.a) * b.r * 0.55, b.y + Math.sin(b.a) * b.r * 0.55, Math.max(2, b.r * 0.1)); g.fillStyle = C.ink; g.fill();
    }

    const b = ptr.held;
    const hv = b ? sampleVel() : null;
    if (b && arrowA > 0.02) {
      g.globalAlpha = arrowA;
      arrow(b.x, b.y, hv.x * S.mult, hv.y * S.mult);
      g.globalAlpha = 1;
    }

    // 읽는 값
    if (b) {
      const vx = hv.x * S.mult, vy = hv.y * S.mult, sp = Math.hypot(vx, vy);
      api.read("release", sp.toFixed(1));
      api.read("dir", sp > 0.5 ? Math.round(Math.atan2(-vy, vx) * 180 / Math.PI) + "°" : "–");
      api.read("now", sp.toFixed(1));
      api.status(`잡고 움직이는 중 · 지금 놓으면 ${sp.toFixed(1)} px/frame`, "active");
    } else {
      const moving = bodies.filter(o => Math.hypot(o.vx, o.vy) > 0.3);
      if (release) {
        api.read("release", release.speed.toFixed(1));
        api.read("dir", release.speed > 0.5 ? Math.round(release.angle) + "°" : "–");
        api.read("now", Math.hypot(release.body.vx, release.body.vy).toFixed(1));
      }
      if (moving.length) api.status(S.gravity ? "날아가는 중 · 중력과 마찰" : "날아가는 중 · 마찰로 점점 느려진다", "alt");
      else api.status("대기", "idle");
    }
    api.read("bounces", bounces);
  });
}
