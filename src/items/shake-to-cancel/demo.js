import { rng, clamp, localPoint, fitCanvas } from "../../lib/util.js";
import { TONE } from "../../lib/draw.js";

export default function demo(api) {
  const { el, S } = api;
  const TAU = Math.PI * 2;
  const N = 16, STICK_R = 24;

  api.css(`
    .shake-to-cancel-demo { position: absolute; inset: 0; cursor: crosshair; touch-action: none;
      background: var(--board);
      background-image: linear-gradient(var(--grid) 1px, transparent 1px), linear-gradient(90deg, var(--grid) 1px, transparent 1px);
      background-size: 100px 100px; }
    .shake-to-cancel-meter { position: absolute; right: 16px; bottom: 16px; z-index: 40; pointer-events: none;
      display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--ink-2);
      background: var(--board); border: 1px solid var(--ink); border-radius: var(--r-box); padding: 8px 12px; }
    .shake-to-cancel-cells { display: flex; gap: 3px; }
    .shake-to-cancel-cells i { width: 12px; height: 14px; border: 1px solid var(--ink); border-radius: 2px; transition: background .08s; }
    .shake-to-cancel-cells i.on { background: var(--accent); border-color: var(--accent); }
    .shake-to-cancel-meter.fire .shake-to-cancel-cells i { background: var(--accent); border-color: var(--accent); }
  `);
  const root = document.createElement("div");
  root.className = "shake-to-cancel-demo";
  el.appendChild(root);
  const { g, size } = fitCanvas(api, { parent: root });
  const C = { ink: api.color("--ink"), ink3: api.color("--ink-3"), accent: api.color("--accent"), note: api.color("--note"), board: api.color("--board") };

  /* ---------- 게이지 ---------- */
  const meter = document.createElement("div");
  meter.className = "shake-to-cancel-meter";
  meter.innerHTML = `<span>흔들기</span><div class="shake-to-cancel-cells"></div>`;
  root.appendChild(meter);
  const cellsEl = meter.querySelector(".shake-to-cancel-cells");
  let cellCount = 0;
  const buildCells = () => { cellCount = S.need; cellsEl.innerHTML = "<i></i>".repeat(S.need); };
  buildCells();

  /* ---------- 가시 공 (붙은 개체) ---------- */
  const rand = rng(9);
  const burrs = [];
  const placeHomes = () => {
    const w = size.w, h = size.h;
    burrs.forEach((b, i) => {
      const cols = 4, rows = 4, cx = i % cols, cy = Math.floor(i / cols);
      b.hx = w * (0.18 + (cx + 0.2 + b.jx * 0.6) / cols * 0.64);
      b.hy = h * (0.2 + (cy + 0.2 + b.jy * 0.6) / rows * 0.6);
      if (b.state === "home") { b.x = b.hx; b.y = b.hy; }
    });
  };
  for (let i = 0; i < N; i++) burrs.push({ x: 0, y: 0, hx: 0, hy: 0, vx: 0, vy: 0, ox: 0, oy: 0, rot: rand() * TAU, spin: 0,
    state: "home", t: 0, jx: rand(), jy: rand() });
  placeHomes();

  /* ---------- 카드 (선택 상태) ---------- */
  const cards = [];
  const placeCards = () => {
    const w = size.w, h = size.h;
    const cw = w < 600 ? 60 : 84, ch = cw * 0.72, gap = w < 600 ? 12 : 20;
    const cols = clamp(Math.floor((w * 0.8 + gap) / (cw + gap)), 2, 6), rows = 3;
    const tw = cols * cw + (cols - 1) * gap, th = rows * ch + (rows - 1) * gap;
    const need = cols * rows;
    while (cards.length < need) cards.push({ x: 0, y: 0, w: 0, h: 0, sel: 0, on: false, jig: -1 });
    cards.length = need;
    cards.forEach((c, i) => {
      c.w = cw; c.h = ch;
      c.x = (w - tw) / 2 + (i % cols) * (cw + gap);
      c.y = (h - th) / 2 + Math.floor(i / cols) * (ch + gap);
    });
  };
  placeCards();
  api.onResize(() => { placeHomes(); placeCards(); });

  /* ---------- 흔들기 인식 ---------- */
  const cur = { x: size.w / 2, y: size.h / 2, px: 0, py: 0, inside: false, spd: 0 };
  const ax = { dir: 0, travel: 0, id: "x" }, ay = { dir: 0, travel: 0, id: "y" };
  let revs = [];          // { t, x, y, a: 축 }
  const marks = [];       // 가이드: 방향 전환 지점
  const rings = [];       // 풀리는 순간의 원
  let lastAmp = 0, cool = 0, moved = false, fireT = -1;
  let ma = S.target === "select" ? 1 : 0, guideA = S.guide ? 1 : 0;

  const axis = (a, d, now) => {
    const s = Math.sign(d);
    if (!s) return;
    if (a.dir === 0 || s === a.dir) { a.dir = s; a.travel += Math.abs(d); return; }
    if (a.travel >= S.amp) {
      lastAmp = a.travel;
      revs.push({ t: now, x: cur.x, y: cur.y, a: a.id });
      marks.push({ t: now, x: cur.x, y: cur.y });
    }
    a.dir = s; a.travel = Math.abs(d);
  };

  const heldCount = () => S.target === "stick" ? burrs.filter(b => b.state === "stuck").length : cards.filter(c => c.on).length;

  const release = now => {
    rings.push({ x: cur.x, y: cur.y, t: now });
    fireT = now;
    if (S.target === "stick") {
      burrs.forEach(b => {
        if (b.state !== "stuck") return;
        const dx = b.x - cur.x, dy = b.y - cur.y, d = Math.hypot(dx, dy) || 1;
        const sp = 9 + Math.random() * 6;
        b.vx = dx / d * sp + (Math.random() - 0.5) * 3; b.vy = dy / d * sp + (Math.random() - 0.5) * 3;
        b.spin = (Math.random() - 0.5) * 0.4;
        b.state = "flying"; b.t = now;
      });
    } else {
      cards.forEach(c => {
        if (!c.on) return;
        const d = Math.hypot(c.x + c.w / 2 - cur.x, c.y + c.h / 2 - cur.y);
        c.on = false; c.jig = now + d * 0.6;
      });
    }
  };

  const move = e => {
    const now = performance.now();
    const p = localPoint(el, e);
    if (!cur.inside) { cur.x = p.x; cur.y = p.y; }
    const dx = p.x - cur.x, dy = p.y - cur.y;
    cur.x = p.x; cur.y = p.y; cur.inside = true;
    axis(ax, dx, now); axis(ay, dy, now);
    if (!moved) { moved = true; api.hideHint(); }
    // 지나가며 붙이기 · 선택하기
    if (S.target === "stick") {
      burrs.forEach(b => {
        if (b.state !== "home" || Math.hypot(b.x - cur.x, b.y - cur.y) > STICK_R) return;
        const a = Math.atan2(b.y - cur.y, b.x - cur.x), r = 14 + Math.random() * 14;
        b.ox = Math.cos(a) * r; b.oy = Math.sin(a) * r; b.state = "stuck"; b.vx = b.vy = 0;
      });
    } else {
      cards.forEach(c => {
        if (!c.on && c.jig < now - 400 && cur.x > c.x && cur.x < c.x + c.w && cur.y > c.y && cur.y < c.y + c.h) { c.on = true; c.jig = -1; }
      });
    }
  };
  api.on(root, "pointermove", move);
  api.on(root, "pointerdown", e => { cur.inside = false; move(e); });
  api.on(root, "pointerleave", () => { cur.inside = false; ax.dir = ay.dir = 0; ax.travel = ay.travel = 0; });
  api.onParam(k => { if (k === "need") buildCells(); });

  const drawBurr = (x, y, rot, alpha) => {
    g.save(); g.translate(x, y); g.rotate(rot); g.globalAlpha = alpha;
    g.strokeStyle = C.ink; g.fillStyle = C.ink; g.lineWidth = 1.5; g.lineCap = "round";
    g.beginPath();
    for (let k = 0; k < 8; k++) { const a = k * TAU / 8; g.moveTo(Math.cos(a) * 6, Math.sin(a) * 6); g.lineTo(Math.cos(a) * 11, Math.sin(a) * 11); }
    g.stroke();
    g.beginPath(); g.arc(0, 0, 6.5, 0, TAU); g.fill();
    g.restore();
  };

  api.frame((dt) => {
    const now = performance.now();
    const step = dt / 16.67;
    const e = 1 - Math.pow(0.85, step);
    ma += ((S.target === "select" ? 1 : 0) - ma) * e;
    guideA += ((S.guide ? 1 : 0) - guideA) * e;
    if (cellCount !== S.need) buildCells();

    // 시간 창 밖의 전환은 버린다
    revs = revs.filter(r => now - r.t < S.window);
    while (marks.length && now - marks[0].t > S.window) marks.shift();
    // 가로와 세로를 따로 센다 (원을 그리는 움직임이 흔들기로 잡히지 않게)
    const count = Math.max(revs.filter(r => r.a === "x").length, revs.filter(r => r.a === "y").length);
    const inten = clamp(count / S.need, 0, 1);
    if (count >= S.need && now > cool) {
      const held = heldCount();
      if (held) { release(now); api.flash(`흔들기 인식 · ${held}개가 풀렸다`, "ok"); }
      else { fireT = now; api.flash("흔들기 인식 · 풀 것이 없다", "alt"); }
      revs = []; cool = now + 450;
    }
    cur.spd = cur.spd * 0.7 + Math.hypot(cur.x - cur.px, cur.y - cur.py) / Math.max(step, 0.01) * 0.3;
    cur.px = cur.x; cur.py = cur.y;

    g.clearRect(0, 0, size.w, size.h);

    /* 붙은 개체 */
    const aStick = 1 - ma;
    for (const b of burrs) {
      if (b.state === "stuck") {
        const k = 1 + inten * 0.5;
        const jit = inten * 5;
        const tx = cur.x + b.ox * k + (Math.random() - 0.5) * jit, ty = cur.y + b.oy * k + (Math.random() - 0.5) * jit;
        b.vx = b.vx * Math.pow(0.68, step) + (tx - b.x) * 0.28 * step;
        b.vy = b.vy * Math.pow(0.68, step) + (ty - b.y) * 0.28 * step;
        b.x += b.vx * step; b.y += b.vy * step;
        b.rot += (b.vx * 0.02) * step;
      } else if (b.state === "flying") {
        b.x += b.vx * step; b.y += b.vy * step; b.rot += b.spin * step;
        const fr = Math.pow(0.9, step); b.vx *= fr; b.vy *= fr; b.spin *= fr;
        if (b.x < 12 || b.x > size.w - 12) { b.vx *= -0.6; b.x = clamp(b.x, 12, size.w - 12); }
        if (b.y < 12 || b.y > size.h - 12) { b.vy *= -0.6; b.y = clamp(b.y, 12, size.h - 12); }
        if (Math.hypot(b.vx, b.vy) < 0.2) { b.state = "resting"; b.t = now; }
      } else if (b.state === "resting") {
        if (now - b.t > 1000) b.state = "returning";
      } else if (b.state === "returning") {
        b.x += (b.hx - b.x) * (1 - Math.pow(0.94, step)); b.y += (b.hy - b.y) * (1 - Math.pow(0.94, step));
        if (Math.hypot(b.hx - b.x, b.hy - b.y) < 0.8) { b.x = b.hx; b.y = b.hy; b.state = "home"; }
      }
      if (aStick > 0.01) {
        if (guideA > 0.01 && b.state === "home") {
          g.save(); g.globalAlpha = aStick * guideA * 0.5; g.strokeStyle = C.ink3; g.setLineDash([2, 4]); g.lineWidth = 1;
          g.beginPath(); g.arc(b.x, b.y, STICK_R, 0, TAU); g.stroke(); g.restore();
        }
        drawBurr(b.x, b.y, b.rot, aStick * (b.state === "resting" || b.state === "returning" ? 0.45 : 1));
      }
    }

    /* 선택 상태 */
    if (ma > 0.01) {
      for (const c of cards) {
        c.sel += ((c.on ? 1 : 0) - c.sel) * (1 - Math.pow(c.on ? 0.6 : 0.8, step));
        let jx = 0;
        if (c.jig > 0 && now > c.jig) {
          const t = (now - c.jig) / 380;
          if (t < 1) jx = Math.sin(t * Math.PI * 7) * 6 * (1 - t);
        }
        // 카드: 외곽선 없는 톤 면. 선택되면 가는 강조색 테두리와 점이 생긴다
        g.save(); g.globalAlpha = ma; g.translate(c.x + jx, c.y);
        g.fillStyle = TONE[1]; g.beginPath();
        g.roundRect ? g.roundRect(0, 0, c.w, c.h, 8) : g.rect(0, 0, c.w, c.h);
        g.fill();
        if (c.sel > 0.02) {
          g.globalAlpha = ma * c.sel; g.lineWidth = 1.5; g.strokeStyle = C.accent; g.stroke(); g.globalAlpha = ma;
          g.fillStyle = C.accent;
          g.beginPath(); g.arc(c.w - 10, 10, 4.5 * c.sel, 0, TAU); g.fill();
        }
        g.restore();
      }
    }

    /* 가이드: 방향 전환 지점 */
    if (guideA > 0.01) {
      g.save(); g.strokeStyle = C.ink; g.lineWidth = 1.5;
      for (const m of marks) {
        g.globalAlpha = guideA * clamp(1 - (now - m.t) / S.window, 0, 1);
        g.beginPath(); g.moveTo(m.x - 5, m.y - 5); g.lineTo(m.x + 5, m.y + 5); g.moveTo(m.x + 5, m.y - 5); g.lineTo(m.x - 5, m.y + 5); g.stroke();
      }
      g.restore();
    }

    /* 풀리는 순간의 원 */
    for (let i = rings.length - 1; i >= 0; i--) {
      const r = rings[i], t = (now - r.t) / 480;
      if (t >= 1) { rings.splice(i, 1); continue; }
      g.save(); g.globalAlpha = 1 - t; g.strokeStyle = C.accent; g.lineWidth = 1.5;
      g.beginPath(); g.arc(r.x, r.y, 12 + (1 - Math.pow(1 - t, 3)) * 90, 0, TAU); g.stroke(); g.restore();
    }

    /* 게이지 */
    const cells = cellsEl.children;
    const firing = now - fireT < 280;
    meter.classList.toggle("fire", firing);
    for (let i = 0; i < cells.length; i++) cells[i].classList.toggle("on", i < count);

    /* 읽는 값 · 상태 */
    const held = heldCount();
    api.read("rev", `${count} / ${S.need}`);
    api.read("amp", Math.round(lastAmp));
    api.read("speed", cur.spd.toFixed(1));
    api.read("held", held);
    if (count > 0) api.status(`흔드는 중 · 방향 전환 ${count} / ${S.need}`, "active");
    else if (held) api.status(S.target === "stick" ? `${held}개가 붙어 있다 · 흔들어 떼기` : `${held}개 선택됨 · 흔들어 풀기`, "alt");
    else api.status(S.target === "stick" ? "대기 · 가시 공 위로 지나가면 → 커서에 붙는다" : "대기 · 카드 위로 지나가면 → 선택된다", "idle");
  });
}
