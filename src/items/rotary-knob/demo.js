import "../../lib/objects/index.js";
import { clamp, mod, localPoint, fitCanvas } from "../../lib/util.js";
import { TONE } from "../../lib/draw.js";
import { drawObject } from "../../lib/objects.js";

export default function demo(api) {
  const { el, S } = api;
  api.css(`
    .rotary-knob-root { position: absolute; inset: 0; background: var(--board); }
    .rotary-knob-root.over { cursor: grab; }
    .rotary-knob-root.grabbing { cursor: grabbing; }
  `);
  const root = document.createElement("div");
  root.className = "rotary-knob-root";
  el.appendChild(root);
  const { g, size } = fitCanvas(api, { parent: root });

  const INK = api.color("--ink") || "#1b1b1a";
  const INK2 = api.color("--ink-2") || "#5d5b57";
  const INK3 = api.color("--ink-3") || "#9a9790";
  const ACC = api.color("--accent") || "#ff5a36";
  const FONT = getComputedStyle(el).fontFamily;
  const RAD = Math.PI / 180;
  const MIN = -135, MAX = 135;

  // 각도: 위쪽이 0°, 시계 방향이 +
  const knob = { x: 0, y: 0, r: 0, raw: 0, shown: 0 };
  const disc = { x: 0, y: 0, r: 0, a: 0, vel: 0 };   // vel: °/ms
  function layout() {
    const { w, h } = size;
    if (w >= 640) {
      knob.x = w * 0.3; knob.y = disc.y = h * 0.5; disc.x = w * 0.68;
      knob.r = Math.min(w * 0.12, h * 0.17, 100);
      disc.r = Math.min(w * 0.19, h * 0.3, 190);
    } else {
      knob.x = disc.x = w / 2; knob.y = h * 0.3; disc.y = h * 0.7;
      knob.r = Math.min(w * 0.2, h * 0.11, 90);
      disc.r = Math.min(w * 0.33, h * 0.17, 150);
    }
  }
  layout();
  api.onResize(layout);

  const ptrAngle = (o, p) => Math.atan2(p.x - o.x, -(p.y - o.y)) / RAD; // 위 0°, 시계 방향 +
  const wrap180 = a => { a = mod(a + 180, 360) - 180; return a; };
  const step = () => S.detents > 0 ? (S.limit ? (MAX - MIN) / S.detents : 360 / S.detents) : 0;
  function knobTarget() {
    const st = step();
    if (!st) return knob.raw;
    return S.limit ? MIN + Math.round((knob.raw - MIN) / st) * st : Math.round(knob.raw / st) * st;
  }
  const knobValue = a => S.limit ? (a - MIN) / (MAX - MIN) * 100 : mod(a, 360) / 360 * 100;

  const drag = { on: false, id: -1, obj: null, last: 0, lx: 0, ly: 0, start: 0, total: 0, p: null, press: null, samples: [] };
  const hit = p => {
    if (Math.hypot(p.x - knob.x, p.y - knob.y) <= knob.r + 22) return knob;
    if (Math.hypot(p.x - disc.x, p.y - disc.y) <= disc.r + 8) return disc;
    return null;
  };

  api.on(root, "pointerdown", e => {
    const p = localPoint(el, e);
    const o = hit(p);
    if (!o) return;
    e.preventDefault();
    root.setPointerCapture(e.pointerId);
    Object.assign(drag, { on: true, id: e.pointerId, obj: o, last: ptrAngle(o, p), start: ptrAngle(o, p), total: 0, lx: p.x, ly: p.y, p, press: p, samples: [] });
    if (o === disc) { disc.vel = 0; drag.samples.push({ t: performance.now(), a: disc.a }); }
    root.classList.add("grabbing");
    api.hideHint();
  });
  api.on(root, "pointermove", e => {
    const p = localPoint(el, e);
    if (!drag.on) { root.classList.toggle("over", !!hit(p)); return; }
    if (e.pointerId !== drag.id) return;
    const o = drag.obj;
    let d = 0;
    if (S.mode === "angle") {
      const a = ptrAngle(o, p);
      if (Math.hypot(p.x - o.x, p.y - o.y) > 10) d = wrap180(a - drag.last);
      drag.last = a;
    } else {
      d = -(p.y - drag.ly) * 1.0;
    }
    drag.lx = p.x; drag.ly = p.y; drag.p = p;
    drag.total += d;
    if (o === knob) {
      knob.raw += d;
      if (S.limit) knob.raw = clamp(knob.raw, MIN, MAX);
    } else {
      disc.a += d;
      const now = performance.now();
      drag.samples.push({ t: now, a: disc.a });
      while (drag.samples.length > 2 && now - drag.samples[0].t > 100) drag.samples.shift();
    }
  });
  const end = e => {
    if (!drag.on || e.pointerId !== drag.id) return;
    drag.on = false;
    root.classList.remove("grabbing");
    if (drag.obj === disc && S.inertia) {
      const s = drag.samples, a = s[0], b = s[s.length - 1];
      if (s.length > 1 && performance.now() - b.t < 80) disc.vel = clamp((b.a - a.a) / Math.max(1, b.t - a.t), -3, 3);
    }
    if (drag.obj === knob) knob.raw = knobTarget();
  };
  api.on(root, "pointerup", end);
  api.on(root, "pointercancel", end);

  api.onParam(k => {
    if (k === "limit" && S.limit) {
      // 한 바퀴 이상 돌아 있던 것을 가까운 각도로 정리한 뒤 범위 안으로 되돌린다
      const turns = Math.round(knob.raw / 360) * 360;
      knob.raw -= turns; knob.shown -= turns;
      knob.raw = clamp(knob.raw, MIN, MAX);
    }
    if (k === "detents" || k === "limit") knob.raw = knobTarget();
  });

  /* ---------- 그리기 ---------- */
  const dirX = a => Math.sin(a * RAD), dirY = a => -Math.cos(a * RAD);
  const canvasAng = a => (a - 90) * RAD; // 위 0° 시계 방향 → 캔버스 각도
  function text(t, x, y, px, color, weight = 600) {
    g.font = `${weight} ${px}px ${FONT}`; g.fillStyle = color; g.textAlign = "center"; g.textBaseline = "middle";
    g.fillText(t, x, y);
  }

  function drawKnob() {
    const { x, y, r } = knob, a = knob.shown;
    const st = step();
    // 눈금
    g.strokeStyle = INK3; g.lineWidth = 1.5;
    if (S.limit) {
      const n = st ? S.detents : 10;
      for (let i = 0; i <= n; i++) {
        const t = MIN + (MAX - MIN) * i / n;
        const r0 = r + 10, r1 = r + (st || i % 5 === 0 ? 20 : 15);
        g.beginPath(); g.moveTo(x + dirX(t) * r0, y + dirY(t) * r0); g.lineTo(x + dirX(t) * r1, y + dirY(t) * r1); g.stroke();
      }
    } else {
      const n = st ? S.detents : 12;
      for (let i = 0; i < n; i++) {
        const t = 360 * i / n, r0 = r + 10, r1 = r + (i === 0 ? 20 : 15);
        g.beginPath(); g.moveTo(x + dirX(t) * r0, y + dirY(t) * r0); g.lineTo(x + dirX(t) * r1, y + dirY(t) * r1); g.stroke();
      }
    }
    // 값 호
    g.lineWidth = 3; g.lineCap = "round";
    g.strokeStyle = "rgba(27,27,26,.1)";
    g.beginPath();
    if (S.limit) g.arc(x, y, r + 30, canvasAng(MIN), canvasAng(MAX)); else g.arc(x, y, r + 30, 0, Math.PI * 2);
    g.stroke();
    g.strokeStyle = ACC;
    g.beginPath();
    if (S.limit) g.arc(x, y, r + 30, canvasAng(MIN), canvasAng(clamp(a, MIN, MAX)));
    else { const m = mod(a, 360); if (m > 0.5) g.arc(x, y, r + 30, canvasAng(0), canvasAng(m)); }
    g.stroke(); g.lineCap = "butt";
    // 몸체 + 지시선: 카탈로그 knob A (state = 0..1 정규화 각도). 사물의 원판 중심은 (아래 가운데)에서 0.42h 위, 반지름 0.3h.
    // 사물의 지시선은 state 0에서 왼쪽 위(-135°, 캔버스 각)를 가리키므로 -90° 돌려 우리의 -135°(아래 왼쪽)에 맞춘다.
    // 한계 없음 모드에서는 state 0으로 두고 각도만큼 통째로 돌린다
    {
      const H = r / 0.3;
      g.save(); g.translate(x, y);
      if (S.limit) { g.rotate(-Math.PI / 2); drawObject(g, "knob", 0, H * 0.42, H, { state: (clamp(a, MIN, MAX) - MIN) / (MAX - MIN), accent: ACC }); }
      else { g.rotate((a + 45) * RAD); drawObject(g, "knob", 0, H * 0.42, H, { state: 0, accent: ACC }); }
      g.restore();
    }
    text(Math.round(knobValue(a)), x, y, Math.max(18, r * 0.34), INK, 700);
    text("노브", x, y + r + 54, 13, INK2);
  }

  function drawDisc() {
    const { x, y, r, a } = disc;
    // 원판: 외곽선 없는 톤 면 + 톤 홈 몇 줄 + 라벨 면(잡으면 조금 짙어진다). 방향 표시만 강조색
    g.fillStyle = TONE[1];
    g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
    g.strokeStyle = TONE[2]; g.lineWidth = 1;
    for (let k = 0.5; k < 0.97; k += 0.07) { g.beginPath(); g.arc(x, y, r * k, 0, Math.PI * 2); g.stroke(); }
    g.fillStyle = drag.on && drag.obj === disc ? TONE[3] : TONE[2];
    g.beginPath(); g.arc(x, y, r * 0.34, 0, Math.PI * 2); g.fill();
    // 원판 위 표시: 방향을 알 수 있게 한 줄과 작은 점
    g.strokeStyle = ACC; g.lineWidth = 3; g.lineCap = "round";
    g.beginPath(); g.moveTo(x + dirX(a) * r * 0.4, y + dirY(a) * r * 0.4); g.lineTo(x + dirX(a) * r * 0.94, y + dirY(a) * r * 0.94); g.stroke();
    g.lineCap = "butt";
    g.fillStyle = TONE[4];
    const b = a + 180;
    g.beginPath(); g.arc(x + dirX(b) * r * 0.2, y + dirY(b) * r * 0.2, 3, 0, Math.PI * 2); g.fill();
    g.fillStyle = INK; g.beginPath(); g.arc(x, y, 4, 0, Math.PI * 2); g.fill();
    text("원판", x, y + r + 26, 13, INK2);
  }

  function drawGuide() {
    if (!drag.on || !drag.p) return;
    const o = drag.obj, p = drag.p;
    g.strokeStyle = INK3; g.lineWidth = 1; g.setLineDash([4, 5]);
    if (S.mode === "angle") {
      g.beginPath(); g.moveTo(o.x, o.y); g.lineTo(p.x, p.y); g.stroke();
      const sa = ptrAngle(o, drag.press);
      g.beginPath(); g.moveTo(o.x, o.y); g.lineTo(o.x + dirX(sa) * (o.r + 40), o.y + dirY(sa) * (o.r + 40)); g.stroke();
      g.setLineDash([]);
      // 누른 각도에서 지금까지 돈 만큼의 호 (한 바퀴 이상이면 한 바퀴까지만)
      const tot = clamp(drag.total, -359, 359);
      const rr = Math.min(o.r * 0.6, 60);
      g.strokeStyle = ACC; g.lineWidth = 1.5;
      g.beginPath(); g.arc(o.x, o.y, rr, canvasAng(sa), canvasAng(sa + tot), tot < 0); g.stroke();
    } else {
      g.beginPath(); g.moveTo(drag.press.x, drag.press.y); g.lineTo(drag.press.x, p.y); g.stroke();
      g.setLineDash([]);
    }
    g.setLineDash([]);
  }

  api.frame(dt => {
    // 노브: 목표 각도로 살짝 부드럽게
    const tgt = drag.on && drag.obj === knob ? knobTarget() : knob.raw;
    knob.shown += (tgt - knob.shown) * (step() ? 0.45 : 0.6);
    if (Math.abs(tgt - knob.shown) < 0.01) knob.shown = tgt;
    // 원판 관성
    if (!(drag.on && drag.obj === disc)) {
      if (disc.vel) {
        disc.a += disc.vel * dt;
        const f = S.inertia ? S.friction : 0.8;
        disc.vel *= Math.pow(f, dt / 16.67);
        if (Math.abs(disc.vel) < 0.001) disc.vel = 0;
      }
    }

    const { w, h } = size;
    g.clearRect(0, 0, w, h);
    drawKnob();
    drawDisc();
    drawGuide();

    let rpm = 0;
    if (drag.on && drag.obj === disc && drag.samples.length > 1) {
      const s = drag.samples, a = s[0], b = s[s.length - 1];
      rpm = (b.a - a.a) / Math.max(1, b.t - a.t) * 60000 / 360;
    } else rpm = disc.vel * 60000 / 360;
    api.read("ptr", drag.on && drag.p ? Math.round(mod(ptrAngle(drag.obj, drag.p), 360)) + "°" : "–");
    api.read("delta", drag.on ? Math.round(drag.total) + "°" : "–");
    api.read("value", Math.round(knobValue(knob.shown)));
    api.read("rpm", rpm.toFixed(1));

    const atEnd = S.limit && drag.on && drag.obj === knob && (knob.raw <= MIN || knob.raw >= MAX);
    if (atEnd) api.status("범위 끝에 닿았다 · 더 돌려도 멈춰 있다", "alt");
    else if (drag.on) api.status(`${drag.obj === knob ? "노브를" : "원판을"} ${S.mode === "angle" ? "각도로" : "위아래로 끌어"} 돌리는 중`, "active");
    else if (disc.vel) api.status("원판이 관성으로 도는 중", "alt");
    else api.status("대기", "idle");
  });
}
