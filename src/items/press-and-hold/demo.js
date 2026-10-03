import { clamp, lerp, localPoint, fitCanvas } from "../../lib/util.js";
import { ILLO, LINE, circle } from "../../lib/draw.js";
import { drawObject } from "../../lib/objects.js";
import "../../lib/objects/index.js";

export default function demo(api) {
  const { el, S } = api;
  api.css(`
    .press-and-hold-root { position: absolute; inset: 0; background: var(--board);
      background-image: linear-gradient(var(--grid) 1px, transparent 1px), linear-gradient(90deg, var(--grid) 1px, transparent 1px);
      background-size: 100px 100px; }
    .press-and-hold-root.is-over { cursor: pointer; }
    .press-and-hold-root.is-down { cursor: grabbing; }
  `);
  const root = document.createElement("div");
  root.className = "press-and-hold-root";
  el.appendChild(root);
  const { g, size } = fitCanvas(api, { parent: root });
  const FONT = getComputedStyle(root).fontFamily;

  const C = { ink: api.color("--ink"), ink2: api.color("--ink-2"), ink3: api.color("--ink-3"), acc: api.color("--accent"), accSoft: api.color("--accent-soft"), note: api.color("--note"), line: api.color("--line") };
  const K = 2.2;
  const curve = {
    linear: [p => p, v => v],
    easeOut: [p => 1 - Math.pow(1 - p, K), v => 1 - Math.pow(1 - v, 1 / K)],
    easeIn: [p => Math.pow(p, K), v => Math.pow(v, 1 / K)]
  };

  const st = { v: 0, dv: 0, vel: 0, hold: false, holdT: 0, popped: false, popT: 0, pops: 0, rate: 0, key: false };
  const hist = []; // {t, v, hold}
  const shreds = [];
  // 카탈로그 풍선 A의 비례(h = 84 기준): 끈 38, 몸통 반지름 17×26, 매듭 기울기 -0.14. state 가 0→1 이면 몸통이 절반→전체 크기
  const BAL = { STR: 38, RX: 17, RY: 26, TILT: -0.14 };
  let layout = {};
  const doLayout = () => {
    const w = size.w, h = size.h;
    const br = 36, bx = w / 2, by = Math.min(h - 70, h * 0.64 + 90);
    const top = by - br - 9;                                            // 끈이 시작하는 곳(값 링 위)
    const s = Math.max(0.5, Math.min((top - 40) / 84, w * 0.28 / 21));   // 풍선 배율: 위 여백 40px, 옆은 화면 폭의 28%
    layout = { w, h, cx: bx, bx, by, br, top, s, oh: 84 * s, knotY: top - BAL.STR * s };
  };
  doLayout();
  api.onResize(doLayout);

  /** 카탈로그가 그린 풍선 몸통의 화면 위치 (매듭, 몸통 가운데, 반지름, 기울기) */
  const bodyOf = (v, tSec) => {
    const { s, cx, knotY } = layout, k = 0.5 + 0.5 * v, sw = Math.sin(tSec * 1.6) * 3 * s;
    const kx = cx + sw * 0.6, th = BAL.TILT + sw * 0.01;
    const rx = BAL.RX * s * k, ry = BAL.RY * s * k, d = ry * 0.825; // 매듭에서 몸통 가운데까지
    return { kx, ky: knotY, x: kx + Math.sin(th) * d, y: knotY - Math.cos(th) * d, rx, ry, th };
  };
  let body = bodyOf(0, 0);
  const hitBalloon = (x, y) => ((x - body.x) / (body.rx * 1.15)) ** 2 + ((y - body.y) / (body.ry * 0.85)) ** 2 < 1;
  const hitButton = (x, y) => Math.hypot(x - layout.bx, y - layout.by) < layout.br + 8;

  const press = () => {
    if (st.hold) return;
    st.hold = true; st.holdT = 0;
    api.hideHint();
    root.classList.add("is-down");
  };
  const release = () => {
    if (!st.hold) return;
    st.hold = false;
    root.classList.remove("is-down");
    if (st.popped) { st.popped = false; st.v = 0; st.dv = 0; st.vel = 0; return; }
    if (S.release === "reset" && st.v > 0) { st.v = 0; api.flash("손을 뗌 → 값이 0으로 돌아갔다", "alt"); }
  };

  api.on(root, "pointerdown", e => {
    const p = localPoint(root, e);
    if (!hitBalloon(p.x, p.y) && !hitButton(p.x, p.y)) { api.flash("풍선이나 아래 버튼을 누르고 있어야 한다", "idle"); return; }
    e.preventDefault();
    root.setPointerCapture(e.pointerId);
    press();
  });
  api.on(root, "pointermove", e => {
    const p = localPoint(root, e);
    root.classList.toggle("is-over", hitBalloon(p.x, p.y) || hitButton(p.x, p.y));
  });
  api.on(root, "pointerup", release);
  api.on(root, "pointercancel", release);
  api.on(window, "keydown", e => {
    if (e.target.closest("input, textarea, [contenteditable]")) return;
    if (e.code !== "Space") return;
    e.preventDefault();
    if (!e.repeat) { st.key = true; press(); }
  });
  api.on(window, "keyup", e => { if (e.code === "Space" && st.key) { st.key = false; release(); } });
  api.on(window, "blur", release);

  const pop = () => {
    const r = body.rx * 1.1, cy = body.y;
    for (let i = 0; i < 26; i++) {
      const a = Math.random() * Math.PI * 2, sp = 3 + Math.random() * 7;
      shreds.push({ x: body.x + Math.cos(a) * r * 0.8, y: cy + Math.sin(a) * r * 1.1, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 2, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.5, life: 1, s: 6 + Math.random() * 10 });
    }
    st.popped = true; st.popT = 0; st.pops++;
    st.v = 0; st.dv = 0; st.vel = 0;
    api.flash("값이 최대에 닿음 → 풍선이 터졌다", "ok");
  };

  // 풍선: 사물 카탈로그(balloon). state = 값(부풀기), t = 끈의 흔들림. 값 숫자는 몸통 위에 얹는다
  const drawBalloon = (v, tSec) => {
    const { bx, top, oh } = layout;
    const atMax = !S.pop && st.hold && st.v >= 1;
    const jx = atMax ? Math.sin(tSec * 90) * 2.2 : 0;
    body = bodyOf(v, tSec);
    g.save(); g.translate(jx, 0);
    drawObject(g, "balloon", bx, top, oh, { color: C.acc, state: v, t: tSec });
    const fs = clamp(body.rx * 0.9, 13, 64);
    g.translate(body.x, body.y); g.rotate(body.th);
    g.fillStyle = ILLO.paper; g.font = `800 ${fs}px ${FONT}`;
    g.textAlign = "center"; g.textBaseline = "middle";
    g.fillText(Math.round(st.v * 100), 0, 1);
    g.restore();
    body.x += jx;
  };

  const drawButton = () => {
    const { bx, by, br } = layout;
    const s = st.hold ? 0.92 : 1;
    g.save(); g.translate(bx, by); g.scale(s, s);
    // 값 링 (얇은 선은 그대로)
    g.strokeStyle = C.line; g.lineWidth = 3;
    g.beginPath(); g.arc(0, 0, br + 9, 0, Math.PI * 2); g.stroke();
    g.strokeStyle = C.acc; g.lineCap = "round";
    if (st.v > 0.002) { g.beginPath(); g.arc(0, 0, br + 9, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * st.v); g.stroke(); }
    // 펌프 버튼: 외곽선 있는 평면 원
    circle(g, 0, 0, br, { fill: st.hold ? ILLO.ink : ILLO.paper, lw: LINE / s });
    g.fillStyle = st.hold ? ILLO.paper : ILLO.ink; g.font = `700 15px ${FONT}`;
    g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(st.hold ? "누르는 중" : "꾹", 0, 1);
    g.restore();
  };

  const drawGraph = now => {
    const W = 200, H = 100;
    const x0 = layout.w - W - 16, y0 = layout.h - H - 16;
    if (layout.w < 480) return;
    g.fillStyle = C.note; g.strokeStyle = C.line; g.lineWidth = 1;
    g.beginPath(); g.roundRect(x0, y0, W, H, 10); g.fill(); g.stroke();
    const px = x0 + 10, py = y0 + 26, pw = W - 20, ph = H - 36, span = 5000;
    g.fillStyle = C.ink2; g.font = `600 13px ${FONT}`; g.textAlign = "left"; g.textBaseline = "alphabetic";
    g.fillText("값의 변화 · 최근 5초", x0 + 10, y0 + 18);
    // 누른 구간
    g.fillStyle = "rgba(255,90,54,.12)";
    for (let i = 1; i < hist.length; i++) if (hist[i].hold) {
      const xa = px + pw * (1 - (now - hist[i - 1].t) / span), xb = px + pw * (1 - (now - hist[i].t) / span);
      g.fillRect(Math.max(px, xa), py, Math.max(0, xb - Math.max(px, xa)) + 0.5, ph);
    }
    g.strokeStyle = C.line; g.lineWidth = 1; g.beginPath(); g.moveTo(px, py + ph); g.lineTo(px + pw, py + ph); g.stroke();
    g.strokeStyle = C.acc; g.lineWidth = 2; g.lineJoin = "round"; g.beginPath();
    hist.forEach((p, i) => { const x = px + pw * (1 - (now - p.t) / span), y = py + ph * (1 - p.v); if (x < px) return; i && x >= px ? g.lineTo(x, y) : g.moveTo(x, y); });
    g.stroke();
  };

  api.frame((dt, t) => {
    const sec = dt / 1000, rate = 1 / S.dur;
    const [f, inv] = curve[S.curve] || curve.linear;
    const before = st.v;
    if (st.popped) {
      st.popT += dt;
    } else if (st.hold) {
      st.holdT += dt;
      const p = clamp(inv(st.v) + rate * sec, 0, 1);
      st.v = f(p);
      if (p >= 1) { st.v = 1; if (S.pop) pop(); }
    } else if (S.release === "shrink") {
      st.v = Math.max(0, st.v - rate * 0.7 * sec);
    } else if (S.release === "reset") {
      st.v = 0;
    }
    st.rate = lerp(st.rate, (st.v - before) / Math.max(sec, 0.001), 0.2);

    // 보이는 크기는 스프링으로 따라간다 (리셋 때 살짝 출렁인다)
    const kSp = S.release === "reset" && !st.hold ? 0.3 : 0.22;
    st.vel = st.vel * 0.72 + (st.v - st.dv) * kSp;
    st.dv = clamp(st.dv + st.vel, -0.05, 1.08);

    const now = performance.now();
    hist.push({ t: now, v: st.v, hold: st.hold });
    while (hist.length && now - hist[0].t > 5200) hist.shift();

    g.clearRect(0, 0, size.w, size.h);
    drawButton();
    if (!st.popped) drawBalloon(Math.max(0, st.dv), t / 1000);
    else {
      const a = clamp(1 - st.popT / 600, 0, 1);
      g.globalAlpha = a; g.fillStyle = ILLO.red; g.font = `900 44px ${FONT}`; g.textAlign = "center";
      g.fillText("펑!", layout.cx, layout.knotY - 40 * layout.s - st.popT * 0.04); g.globalAlpha = 1;
    }
    for (let i = shreds.length - 1; i >= 0; i--) {
      const s = shreds[i];
      s.x += s.vx; s.y += s.vy; s.vy += 0.35; s.vx *= 0.97; s.rot += s.vr; s.life -= dt / 1100;
      if (s.life <= 0) { shreds.splice(i, 1); continue; }
      g.save(); g.globalAlpha = s.life; g.translate(s.x, s.y); g.rotate(s.rot); g.fillStyle = i % 3 ? ILLO.red : ILLO.ink;
      g.fillRect(-s.s / 2, -s.s / 4, s.s, s.s / 2); g.restore();
    }
    drawGraph(now);

    api.read("hold", st.hold ? (st.holdT / 1000).toFixed(1) + "초" : "–");
    api.read("value", Math.round(st.v * 100) + "%");
    api.read("rate", (st.rate * 100 >= 0 ? "+" : "") + Math.round(st.rate * 100) + "%/초");
    api.read("pops", st.pops);

    if (st.popped) api.status(st.hold ? "터짐 · 손을 떼면 새 풍선이 나온다" : "터짐", "ok");
    else if (st.hold && st.v >= 1) api.status("최대 · 더 커지지 않는다", "alt");
    else if (st.hold) api.status(`누르는 중 · ${(st.holdT / 1000).toFixed(1)}초`, "active");
    else if (st.v > 0 && S.release === "shrink") api.status("놓음 · 일정한 속도로 줄어드는 중", "alt");
    else if (st.v > 0) api.status("놓음 · 값을 유지한다", "idle");
    else api.status("대기", "idle");
  });
}
