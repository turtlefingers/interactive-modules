import { clamp, lerp, localPoint, fitCanvas } from "../../lib/util.js";
import { ILLO, TONE } from "../../lib/draw.js";
import { drawPeep, preload, outfit } from "../../lib/figure.js";

// 사람(Open Peeps): 서기(ShirtBW) / 걷기(WalkingBW) / 달리기(WalkingFilled, 세기 0.5 초과) 자세. 기본 그림은 오른쪽을 보므로 왼쪽으로 갈 땐 flip.
const STAND = { body: "ShirtBW", face: "Calm", hair: "Short", colors: outfit(ILLO.blue) };
const WALK = { ...STAND, body: "WalkingBW" };
const RUN = { ...STAND, body: "WalkingFilled" };
const both = o => ({ R: o, L: { ...o, flip: true } });
const FIG = { stand: both(STAND), walk: both(WALK), run: both(RUN) };

export default function demo(api) {
  const { el, S } = api;

  api.css(`
    .virtual-joystick-root { position: absolute; inset: 0; background: var(--board);
      background-image: linear-gradient(var(--grid) 1px, transparent 1px), linear-gradient(90deg, var(--grid) 1px, transparent 1px);
      background-size: 100px 100px; }
    .virtual-joystick-root.floating { cursor: pointer; }
    .virtual-joystick-root.active, .virtual-joystick-root.active * { cursor: grabbing; }
  `);
  const root = document.createElement("div");
  root.className = "virtual-joystick-root";
  el.appendChild(root);
  const { g, size } = fitCanvas(api, { parent: root });
  preload([STAND, WALK, RUN]);

  const INK = ILLO.ink, PAPER = ILLO.paper, ACC = "#ff5a36";
  const R = 58, KNOB = 24, MAX = 300;   // 받침 반지름, 손잡이 반지름, 최대 속도(px/s)

  /* ---------- 조이스틱 ---------- */
  const joy = { bx: 0, by: 0, kx: 0, ky: 0, kvx: 0, kvy: 0, active: false, vis: 1, id: null };
  const home = () => ({ x: Math.max(R + 40, Math.min(size.w * 0.16, 150)), y: size.h - R - 80 });
  const placeHome = () => { const h = home(); joy.bx = h.x; joy.by = h.y; };
  placeHome();
  api.onResize(() => { if (S.mode === "fixed") placeHome(); hero.x = clamp(hero.x, 20, size.w - 20); hero.y = clamp(hero.y, 20, size.h - 20); });

  const hero = { x: size.w * 0.55, y: size.h * 0.45, vx: 0, vy: 0, face: 0, step: 0 };
  const trail = [];
  let travelled = 0;

  // 손잡이 위치 → 출력(세기, 각도)
  function output() {
    const d = Math.hypot(joy.kx, joy.ky), raw = Math.min(1, d / R);
    let mag = raw <= S.dead ? 0 : (raw - S.dead) / (1 - S.dead);
    let ang = Math.atan2(-joy.ky, joy.kx);         // 오른쪽 0°, 위쪽 90°
    if (S.dir === "eight") ang = Math.round(ang / (Math.PI / 4)) * (Math.PI / 4);
    if (mag === 0) ang = 0;
    return { raw, mag, ang, x: Math.cos(ang) * mag, y: Math.sin(ang) * mag };
  }

  const setKnob = p => {
    let dx = p.x - joy.bx, dy = p.y - joy.by;
    const d = Math.hypot(dx, dy);
    if (d > R) { dx *= R / d; dy *= R / d; }
    joy.kx = dx; joy.ky = dy;
  };

  api.on(root, "pointerdown", e => {
    if (joy.active) return;
    const p = localPoint(root, e);
    if (S.mode === "fixed") {
      if (Math.hypot(p.x - joy.bx, p.y - joy.by) > R * 1.5) { api.flash("고정 방식: 왼쪽 아래 조이스틱을 누른다", "idle"); return; }
    } else {
      // 떠 있는 방식: 누른 자리에 조이스틱이 나타난다
      joy.bx = clamp(p.x, R + 12, size.w - R - 12); joy.by = clamp(p.y, R + 12, size.h - R - 12);
      joy.kx = joy.ky = 0; joy.vis = 0.3;
    }
    e.preventDefault();
    root.setPointerCapture(e.pointerId);
    joy.active = true; joy.id = e.pointerId;
    setKnob(p);
    api.hideHint();
  });
  api.on(root, "pointermove", e => { if (joy.active && e.pointerId === joy.id) setKnob(localPoint(root, e)); });
  const up = e => {
    if (!joy.active || e.pointerId !== joy.id) return;
    joy.active = false; joy.kvx = joy.kvy = 0;
  };
  api.on(root, "pointerup", up);
  api.on(root, "pointercancel", up);
  api.onParam(k => {
    if (k === "mode") { if (S.mode === "fixed") placeHome(); }
    if (k === "spring" && S.spring && !joy.active) joy.kvx = joy.kvy = 0;
  });

  /* ---------- 그리기 ---------- */
  // 캐릭터(키 70): 움직이는 쪽을 보고, 걸으면 위아래로 흔들리고, 세기가 0.5를 넘으면 달리는 자세
  const HERO_H = 70;
  function drawHero(o) {
    const sp = Math.min(1, Math.hypot(hero.vx, hero.vy) / MAX);
    const bob = Math.abs(Math.sin(hero.step)) * sp * 3;
    const moving = sp > 0.03;
    const fig = moving && o.mag > 0.5 ? FIG.run : moving ? FIG.walk : FIG.stand;
    const flip = Math.cos(hero.face) < 0;
    drawPeep(g, flip ? fig.L : fig.R, hero.x, hero.y + HERO_H / 2 - bob, HERO_H, { rotate: (flip ? -1 : 1) * sp * 0.06 });
  }
  function drawJoystick(o) {
    if (joy.vis < 0.01) return;
    g.save(); g.globalAlpha = joy.vis;
    const { bx, by } = joy;
    g.fillStyle = "rgba(255,253,246,.7)"; g.strokeStyle = INK; g.lineWidth = 1.5;
    g.beginPath(); g.arc(bx, by, R, 0, 7); g.fill(); g.stroke();
    // 데드존
    if (S.dead > 0.01) {
      g.setLineDash([3, 4]); g.strokeStyle = "rgba(27,27,26,.4)"; g.lineWidth = 1;
      g.beginPath(); g.arc(bx, by, R * S.dead, 0, 7); g.stroke(); g.setLineDash([]);
    }
    // 8방향 눈금
    if (S.dir === "eight") {
      g.strokeStyle = "rgba(27,27,26,.45)"; g.lineWidth = 1.5;
      for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; g.beginPath(); g.moveTo(bx + Math.cos(a) * (R - 9), by + Math.sin(a) * (R - 9)); g.lineTo(bx + Math.cos(a) * (R - 2), by + Math.sin(a) * (R - 2)); g.stroke(); }
    }
    // 세기 원호 (바깥쪽)
    if (o.mag > 0) {
      g.strokeStyle = ACC; g.lineWidth = 3; g.lineCap = "round";
      const a = -o.ang;
      g.beginPath(); g.arc(bx, by, R + 7, a - 0.5 * o.mag, a + 0.5 * o.mag); g.stroke();
    }
    // 손잡이: 8방향이면 눈금 쪽으로 붙는다
    let kx = joy.kx, ky = joy.ky;
    if (S.dir === "eight" && o.mag > 0) { const d = Math.hypot(kx, ky); kx = Math.cos(o.ang) * d; ky = -Math.sin(o.ang) * d; }
    g.strokeStyle = "rgba(27,27,26,.35)"; g.lineWidth = 1;
    g.beginPath(); g.moveTo(bx, by); g.lineTo(bx + kx, by + ky); g.stroke();
    g.fillStyle = joy.active ? INK : PAPER; g.strokeStyle = INK; g.lineWidth = 2;
    g.beginPath(); g.arc(bx + kx, by + ky, KNOB, 0, 7); g.fill(); g.stroke();
    g.restore();
  }

  /* ---------- 루프 ---------- */
  api.frame((dt) => {
    const s = dt / 1000;
    // 놓으면 손잡이가 가운데로 튕겨 돌아간다 (스프링)
    if (!joy.active && S.spring) {
      joy.kvx += -joy.kx * 0.35; joy.kvy += -joy.ky * 0.35;
      joy.kvx *= 0.62; joy.kvy *= 0.62;
      joy.kx += joy.kvx; joy.ky += joy.kvy;
      if (Math.hypot(joy.kx, joy.ky) < 0.3 && Math.hypot(joy.kvx, joy.kvy) < 0.3) { joy.kx = joy.ky = 0; joy.kvx = joy.kvy = 0; }
    }
    const floatingHidden = S.mode === "floating" && !joy.active && (S.spring ? Math.hypot(joy.kx, joy.ky) < 0.5 : false);
    joy.vis = lerp(joy.vis, floatingHidden ? 0 : 1, floatingHidden ? 0.12 : 0.3);

    const o = output();
    // 캐릭터: 세기만큼 빠르게, 각도 쪽으로
    const tvx = o.x * MAX, tvy = -o.y * MAX;
    hero.vx = lerp(hero.vx, tvx, 0.18); hero.vy = lerp(hero.vy, tvy, 0.18);
    const nx = clamp(hero.x + hero.vx * s, 30, size.w - 30), ny = clamp(hero.y + hero.vy * s, HERO_H / 2 + 6, size.h - HERO_H / 2 - 6);
    const moved = Math.hypot(nx - hero.x, ny - hero.y);
    hero.x = nx; hero.y = ny;
    const sp = Math.hypot(hero.vx, hero.vy);
    if (sp > 8) {
      const fa = Math.atan2(hero.vy, hero.vx);
      hero.face += Math.atan2(Math.sin(fa - hero.face), Math.cos(fa - hero.face)) * 0.25;
    }
    hero.step += moved * 0.25;
    travelled += moved;
    if (travelled > 16) { travelled = 0; trail.push({ x: hero.x, y: hero.y + HERO_H / 2, t: performance.now() }); }
    const now = performance.now();
    while (trail.length && now - trail[0].t > 2500) trail.shift();

    g.clearRect(0, 0, size.w, size.h);
    // 지나온 자리: 작은 톤 점
    g.fillStyle = TONE[3];
    trail.forEach(p => { g.globalAlpha = 0.9 * (1 - (now - p.t) / 2500); g.beginPath(); g.arc(p.x, p.y, 2.5, 0, 7); g.fill(); });
    g.globalAlpha = 1;
    drawHero(o);
    drawJoystick(o);

    root.classList.toggle("floating", S.mode === "floating" && !joy.active);
    root.classList.toggle("active", joy.active);

    const deg = Math.round(((o.ang * 180 / Math.PI) + 360) % 360);
    api.read("mag", o.mag.toFixed(2));
    api.read("angle", o.mag ? deg + "°" : "–");
    api.read("xy", `${o.x.toFixed(2)}, ${o.y.toFixed(2)}`);
    api.read("speed", Math.round(sp) + "px/s");

    if (joy.active && o.raw > 0 && o.mag === 0) api.status("데드존 안 · 반응하지 않음", "idle");
    else if (joy.active) api.status(`밀고 있음 · 세기 ${o.mag.toFixed(2)} · ${o.mag < 0.5 ? "걷기" : "달리기"}`, "active");
    else if (o.mag > 0 && !S.spring) api.status(`손을 뗐지만 손잡이가 그대로 · 계속 ${o.mag < 0.5 ? "걷는" : "달리는"} 중`, "alt");
    else if (Math.hypot(joy.kx, joy.ky) > 0.5) api.status("손잡이가 가운데로 돌아가는 중", "alt");
    else api.status("대기", "idle");
  });
}
