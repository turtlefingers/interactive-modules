import { localPoint, fitCanvas } from "../../lib/util.js";

export default function demo(api) {
  const { el, S } = api;

  api.css(`.cursor-emitter-root { position: absolute; inset: 0; cursor: crosshair; background: var(--board); }`);
  const root = document.createElement("div");
  root.className = "cursor-emitter-root";
  el.appendChild(root);
  const { g, size } = fitCanvas(api, { parent: root });
  const INK = api.color("--ink") || "#1b1b1a";
  const INK3 = api.color("--ink-3") || "#9a9790";
  const ACC = api.color("--accent") || "#ff5a36";

  /* ---------- 포인터 ---------- */
  const p = { x: 0, y: 0, inside: false, down: false, vx: 0, vy: 0, lx: 0, ly: 0, lt: 0 };
  const setPos = e => {
    const q = localPoint(el, e), now = performance.now();
    if (p.lt) {
      const dt = Math.max(1, now - p.lt) / 16.67;
      p.vx = p.vx * 0.5 + (q.x - p.lx) / dt * 0.5; p.vy = p.vy * 0.5 + (q.y - p.ly) / dt * 0.5;
    }
    p.lx = q.x; p.ly = q.y; p.lt = now; p.x = q.x; p.y = q.y;
  };
  api.on(root, "pointerenter", e => { p.inside = true; p.lt = 0; setPos(e); });
  api.on(root, "pointermove", e => { p.inside = true; setPos(e); api.hideHint(); });
  api.on(root, "pointerleave", () => { if (!p.down) { p.inside = false; p.vx = p.vy = 0; } });
  api.on(root, "pointerdown", e => {
    e.preventDefault(); root.setPointerCapture(e.pointerId);
    p.inside = true; p.down = true; p.lt = 0; setPos(e); api.hideHint();
  });
  const up = e => { p.down = false; if (e.pointerType !== "mouse") p.inside = false; };
  api.on(root, "pointerup", up);
  api.on(root, "pointercancel", up);
  const emitting = () => p.inside && (!S.pressOnly || p.down);

  /* ---------- 입자 ---------- */
  const parts = [];
  const MAX = 1800;
  let acc = 0, total = 0;
  const stamps = []; // 최근 1초 동안 만든 시각
  const SHAPES = ["circle", "square", "tri"];
  const spawn = () => {
    const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * S.spread;
    const x = p.x + Math.cos(a) * r, y = p.y + Math.sin(a) * r;
    const out = 0.3 + Math.random() * 1.1;
    const type = S.type;
    const o = {
      x, y, age: 0, life: S.life * 1000 * (0.75 + Math.random() * 0.5), type,
      vx: Math.cos(a) * out + p.vx * 0.2, vy: Math.sin(a) * out + p.vy * 0.2 - (type === "confetti" ? 1.2 : 0),
      rot: Math.random() * Math.PI * 2, vr: (Math.random() - 0.5) * 0.2, ph: Math.random() * 6.28,
      s: type === "dot" ? 1.5 + Math.random() * 2 : type === "shape" ? 4 + Math.random() * 4 : 3 + Math.random() * 2,
      shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
      col: type === "confetti" ? (Math.random() < 0.35 ? ACC : INK) : type === "shape" ? INK : (Math.random() < 0.15 ? ACC : INK)
    };
    parts.push(o);
    if (parts.length > MAX) parts.shift();
    total++; stamps.push(performance.now());
  };
  api.onParam(k => { if (k === "type") parts.forEach(o => { o.age = Math.max(o.age, o.life * 0.7); }); });

  /* ---------- 루프 ---------- */
  api.frame(dt => {
    const { w, h } = size;
    const f = dt / 16.67;
    const on = emitting();
    if (on) {
      acc += S.rate * dt / 1000;
      let n = 0;
      while (acc >= 1 && n < 60) { spawn(); acc -= 1; n++; }
    } else acc = 0;
    const now = performance.now();
    while (stamps.length && now - stamps[0] > 1000) stamps.shift();

    const G = S.gravity;
    for (let i = parts.length - 1; i >= 0; i--) {
      const o = parts[i];
      o.age += dt;
      if (o.age >= o.life || o.y > h + 40 || o.y < -60) { parts.splice(i, 1); continue; }
      if (o.type === "confetti") {
        // 종이는 공기 저항이 커서 흔들리며 천천히 떨어진다
        o.vy += G * 0.5 * f; o.vx *= Math.pow(0.95, f); o.vy *= Math.pow(0.96, f);
        o.ph += 0.12 * f; o.x += Math.sin(o.ph) * 0.6 * f;
      } else {
        o.vy += G * f; o.vx *= Math.pow(0.985, f); o.vy *= Math.pow(0.985, f);
      }
      o.x += o.vx * f; o.y += o.vy * f; o.rot += o.vr * f;
    }

    g.clearRect(0, 0, w, h);
    for (const o of parts) {
      const k = o.age / o.life;
      const alpha = 1 - k * k;
      const sc = k > 0.7 ? 1 - (k - 0.7) / 0.3 * 0.6 : 1;
      g.globalAlpha = alpha;
      if (o.type === "dot") {
        g.fillStyle = o.col; g.beginPath(); g.arc(o.x, o.y, o.s * sc, 0, Math.PI * 2); g.fill();
      } else if (o.type === "shape") {
        g.save(); g.translate(o.x, o.y); g.rotate(o.rot); g.scale(sc, sc);
        g.strokeStyle = o.col; g.lineWidth = 1.2; g.beginPath();
        const s = o.s;
        if (o.shape === "circle") g.arc(0, 0, s, 0, Math.PI * 2);
        else if (o.shape === "square") g.rect(-s, -s, s * 2, s * 2);
        else { g.moveTo(0, -s * 1.1); g.lineTo(s, s * 0.7); g.lineTo(-s, s * 0.7); g.closePath(); }
        g.stroke(); g.restore();
      } else {
        g.save(); g.translate(o.x, o.y); g.rotate(o.rot);
        g.scale(Math.cos(o.ph * 1.3) * sc, sc); // 뒤집히며 나풀거림
        g.fillStyle = o.col; g.fillRect(-o.s, -o.s * 0.55, o.s * 2, o.s * 1.1);
        g.restore();
      }
    }
    g.globalAlpha = 1;

    // 발생 범위
    if (p.inside) {
      g.save();
      if (S.spread > 2) {
        g.beginPath(); g.arc(p.x, p.y, S.spread, 0, Math.PI * 2);
        g.setLineDash([3, 4]); g.strokeStyle = on ? "rgba(27,27,26,.4)" : "rgba(27,27,26,.18)"; g.lineWidth = 1; g.stroke();
        g.setLineDash([]);
      }
      g.strokeStyle = on ? INK : INK3; g.lineWidth = 1.5;
      g.beginPath(); g.moveTo(p.x - 5, p.y); g.lineTo(p.x + 5, p.y); g.moveTo(p.x, p.y - 5); g.lineTo(p.x, p.y + 5); g.stroke();
      g.restore();
    }

    const sp = Math.hypot(p.vx, p.vy);
    api.read("rate", `${stamps.length}개/초`);
    api.read("alive", parts.length);
    api.read("pos", p.inside ? `${Math.round(p.x)}, ${Math.round(p.y)}` : "–");
    api.read("total", total);
    // 포인터 이벤트가 없으면(커서가 멈추면) 속도를 줄인다
    if (now - p.lt > 60) { p.vx *= 0.8; p.vy *= 0.8; }

    if (S.pressOnly && !p.down) api.status(p.inside ? "누르는 동안만 생긴다" : "대기", "idle");
    else if (on && sp < 0.3) api.status(`멈춰 있어도 계속 생성 중 · 초당 ${S.rate}개`, "active");
    else if (on) api.status(`생성 중 · 초당 ${S.rate}개`, "active");
    else if (parts.length) api.status("남은 입자가 사라지는 중", "alt");
    else api.status("대기", "idle");
  });
}
