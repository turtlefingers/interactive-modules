import { clamp, lerp, localPoint, fitCanvas } from "../../lib/util.js";
import { ILLO, ellipse, dot, line as inkLine, zz, roundRect, circle } from "../../lib/draw.js";

const STAGE_NAME = ["깨어 있음", "하품", "졸림", "잠", "화면보호기"];
const SAVER_AFTER = 4; // 잠든 뒤 화면보호기까지(초)

export default function demo(api) {
  const { el, S } = api;
  const { g, size } = fitCanvas(api);
  el.style.cursor = "default";
  const FF = getComputedStyle(el).fontFamily || "sans-serif";
  const C = { board: api.color("--board"), note: api.color("--note"), ink: api.color("--ink"), ink3: api.color("--ink-3"), accent: api.color("--accent") };

  const now = () => performance.now();
  let lastInput = now(), lastKind = "–", wakes = 0;
  let stage = 0, stageT = now();
  const ptr = { x: size.w / 2, y: size.h * .3 };

  // 연출용 값
  let lid = 0, blinkUntil = 0, nextBlink = now() + 2500;
  let startleT = -1e9, gentleT = -1e9, eyeBoost = 0;
  let tilt = 0, saver = 0, slept = false;
  const zs = [];
  let nextZ = 0, nagT = 0;
  const ss = { x: 60, y: 80, vx: 0.9, vy: 0.7 };

  const idleSec = () => (now() - lastInput) / 1000;
  const stageOf = t => {
    const T = S.wait;
    if (S.saver && t >= T + SAVER_AFTER) return 4;
    if (t >= T) return 3;
    if (S.stages === "multi") { if (t >= T * .7) return 2; if (t >= T * .4) return 1; }
    return 0;
  };

  /* ---------- 입력 ---------- */
  const onInput = kind => e => {
    if (e.type === "pointermove") { const p = localPoint(el, e); ptr.x = p.x; ptr.y = p.y; }
    if (S.by === "click" && (kind === "움직임" || kind === "휠") && stage >= 3) {
      lastKind = kind + " (무시)";
      if (now() - nagT > 2500) { nagT = now(); api.flash("움직임으로는 깨지 않는다 · 클릭이나 키", "idle", 1400); }
      return;
    }
    lastKind = kind;
    const deep = S.stages === "multi" ? stage >= 2 : stage >= 3;
    if (deep) {
      wakes++;
      if (S.wake === "startle") { startleT = now(); eyeBoost = 1; lid = 0; }
      else gentleT = now();
      api.flash(`깨어남 · ${kind}`, "ok");
    }
    lastInput = now();
  };
  api.on(window, "pointermove", onInput("움직임"));
  api.on(window, "pointerdown", onInput("클릭"));
  api.on(window, "keydown", onInput("키"));
  api.on(window, "wheel", onInput("휠"), { passive: true });

  /* ---------- 그리기 ---------- */
  const LW = 3;   // 그림 선 굵기 (키트와 동일)
  const line = (x0, y0, x1, y1) => { g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); };

  function drawCharacter(t, R, cx, gy) {
    const T = t / 1000;
    const st = stage;
    // 점프 (깜짝)
    const ks = (t - startleT) / 460;
    let jump = 0;
    if (ks >= 0 && ks < 1) jump = -Math.sin(Math.PI * ks) * R * .55;
    else if (ks >= 1 && ks < 1.5) jump = -Math.sin(Math.PI * (ks - 1) * 2) * R * .06;
    // 기지개 (천천히)
    const kg = (t - gentleT) / 1400;
    const stretch = kg >= 0 && kg < 1 ? Math.sin(Math.PI * kg) * .14 : 0;
    // 숨
    const breath = st >= 3 ? Math.sin(T * 1.7) * .045 : Math.sin(T * 3) * .012;
    const sy = 1 + breath + stretch, sx = 1 - stretch * .5 + breath * .3;
    // 꾸벅
    const tiltT = st === 2 ? Math.max(0, Math.sin(T * 1.5)) * .12 : st >= 3 ? .1 : 0;
    tilt = lerp(tilt, tiltT, .05);

    g.save();
    g.translate(cx, gy + jump);
    g.rotate(tilt);
    // 몸: 뭉툭한 덩어리 하나 (그림 키트 규칙 — 3px 검정 외곽선, 평면 단색)
    ellipse(g, 0, -R * sy, R * sx, R * sy, { fill: ILLO.yellow, lw: LW });
    // 눈: 점 두 개. 눈꺼풀이 내려오면 납작해지다가 선이 된다
    const ey = -R * sy * 1.12, ex = R * .36 * sx;
    const r = R * .075 * (1 + eyeBoost * .7);
    const look = lid < .8 && st < 3 ? 1 : 0;
    const dx = clamp((ptr.x - cx) / (size.w / 2), -1, 1) * R * .08 * look;
    const dy = clamp((ptr.y - (gy - R)) / (size.h / 2), -1, 1) * R * .06 * look;
    [-1, 1].forEach(s => {
      const x = s * ex + dx, y = ey + dy;
      if (lid > .88) inkLine(g, [[x - r * 1.5, y], [x + r * 1.5, y]], { lw: LW });
      else {
        const h = Math.max(.12, 1 - lid);
        if (eyeBoost > .3) circle(g, x, y, r * 1.6, { fill: ILLO.paper, lw: LW });   // 깜짝: 흰자가 보이는 눈
        ellipse(g, x, y + r * (1 - h) * .8, r, r * h, { fill: ILLO.ink, lw: 0 });
      }
    });
    // 입: 선 하나. 하품이면 세로로 벌어진 타원, 깜짝이면 작은 동그라미
    const my = -R * sy * .72;
    const yawnK = st === 1 ? clamp((t - stageT) / 1800, 0, 1) : 0;
    const yawn = Math.sin(Math.PI * yawnK);
    if (yawn > .05) ellipse(g, 0, my, R * .09 * yawn + 1, R * .16 * yawn + 1, { fill: ILLO.ink, lw: LW });
    else if (t - startleT < 900) ellipse(g, 0, my, R * .05, R * .07, { fill: ILLO.ink, lw: LW });
    else if (st >= 3) circle(g, 0, my, R * .035 * (1 + breath * 6), { fill: ILLO.ink, lw: LW });
    else inkLine(g, [[-R * .08, my], [R * .08, my]], { lw: LW });
    g.restore();

    // 느낌표 (도형으로)
    if (t - startleT < 900) {
      const a = 1 - clamp((t - startleT - 600) / 300, 0, 1);
      const bx = cx + R * .95, by = gy + jump - R * 2.1, s = R * .5;
      g.globalAlpha = a;
      roundRect(g, bx - s * .12, by - s, s * .24, s * .62, s * .12, { fill: ILLO.red, lw: LW });
      circle(g, bx, by - s * .12, s * .13, { fill: ILLO.red, lw: LW });
      g.globalAlpha = 1;
    }
    return yawn;
  }

  function drawZ(t, R, cx, gy) {
    if (stage >= 3 && t > nextZ) {
      zs.push({ x: cx + R * .55, y: gy - R * 2, born: t, s: R * .18 });
      nextZ = t + 1100;
    }
    for (let i = zs.length - 1; i >= 0; i--) {
      const z = zs[i], k = (t - z.born) / 2600;
      if (k >= 1 || stage < 3) { zs.splice(i, 1); continue; }
      zz(g, z.x + k * R * .6 + Math.sin(k * 6) * 6, z.y - k * R * .3, { size: z.s * (1 + k), lw: LW, t: k });
    }
    g.globalAlpha = 1;
  }

  function drawTimeline(t) {
    const { w, h } = size;
    const x0 = Math.max(24, w * .18), x1 = Math.min(w - 24, w * .82), y = h - 88;
    const T = S.wait, span = T + (S.saver ? SAVER_AFTER : 0) + T * .15 + 1;
    const X = s => x0 + (x1 - x0) * clamp(s / span, 0, 1);
    g.lineWidth = 1; g.strokeStyle = C.ink3;
    line(x0, y, x1, y);
    const marks = [];
    if (S.stages === "multi") marks.push([T * .4, "하품"], [T * .7, "졸림"]);
    marks.push([T, "잠"]);
    if (S.saver) marks.push([T + SAVER_AFTER, "화면보호기"]);
    g.font = `13px ${FF}`;
    g.textAlign = "center"; g.textBaseline = "top";
    marks.forEach(([s, label]) => {
      g.strokeStyle = C.ink3; line(X(s), y - 5, X(s), y + 5);
      g.fillStyle = t >= s ? C.ink : C.ink3;
      g.fillText(label, X(s), y + 12);
    });
    g.strokeStyle = C.ink; g.lineWidth = 1.5;
    line(x0, y, X(t), y);
    g.fillStyle = C.accent;
    g.beginPath(); g.arc(X(t), y, 4.5, 0, Math.PI * 2); g.fill();
    g.fillStyle = C.ink; g.textAlign = "left"; g.textBaseline = "bottom";
    g.fillText(`${t.toFixed(1)}초 멈춤`, x0, y - 12);
  }

  function drawSaver(dt) {
    if (saver < .01) return;
    const { w, h } = size;
    g.globalAlpha = saver * .94; g.fillStyle = C.ink; g.fillRect(0, 0, w, h);
    const d = new Date();
    const txt = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    const fs = clamp(Math.min(w, h) * .09, 28, 64);
    g.font = `300 ${Math.round(fs)}px ${FF}`;
    const tw = g.measureText(txt).width, th = fs;
    const k = dt / 16.67;
    ss.x += ss.vx * k; ss.y += ss.vy * k;
    if (ss.x < 0 || ss.x + tw > w) { ss.vx *= -1; ss.x = clamp(ss.x, 0, w - tw); }
    if (ss.y < th || ss.y > h) { ss.vy *= -1; ss.y = clamp(ss.y, th, h); }
    g.globalAlpha = saver; g.fillStyle = C.board; g.textAlign = "left"; g.textBaseline = "alphabetic";
    g.fillText(txt, ss.x, ss.y);
    g.globalAlpha = 1;
  }

  /* ---------- 루프 ---------- */
  api.frame((dt, t) => {
    const it = idleSec();
    const st = stageOf(it);
    if (st !== stage) {
      stage = st; stageT = now();
      if (st === 3 && !slept) { slept = true; api.hideHint(); }
      if (st === 4) { ss.x = size.w * .3; ss.y = size.h * .4; }
    }
    // 눈꺼풀 목표
    let lidT = 0;
    if (stage === 0) {
      if (t > nextBlink) { blinkUntil = t + 120; nextBlink = t + 2500 + Math.random() * 2500; }
      lidT = t < blinkUntil ? 1 : 0;
    } else if (stage === 1) lidT = .35;
    else if (stage === 2) lidT = .5 + Math.max(0, Math.sin(t / 1000 * 1.5)) * .4;
    else lidT = 1;
    const gentle = t - gentleT < 1400;
    const rate = lidT < lid ? (gentle ? .03 : t - startleT < 300 ? .5 : .35) : (stage === 0 ? .5 : .05);
    lid = lerp(lid, lidT, rate);
    eyeBoost = lerp(eyeBoost, 0, .04);
    saver = lerp(saver, stage === 4 ? 1 : 0, stage === 4 ? .03 : .25);

    const { w, h } = size;
    g.clearRect(0, 0, w, h);
    g.fillStyle = C.board; g.fillRect(0, 0, w, h);
    const R = clamp(Math.min(w, h * .9) * .13, 44, 100);
    const cx = w / 2, gy = h * .56 + R * .4;
    inkLine(g, [[cx - R * 1.7, gy], [cx + R * 1.7, gy]], { lw: LW });
    drawCharacter(t, R, cx, gy);
    drawZ(t, R, cx, gy);
    drawTimeline(it);
    drawSaver(dt);

    api.read("idle", it.toFixed(1) + "초");
    api.read("stage", STAGE_NAME[stage]);
    api.read("input", lastKind);
    api.read("wakes", wakes);
    const kinds = ["idle", "alt", "alt", "active", "active"];
    api.status(`${STAGE_NAME[stage]} · ${it.toFixed(1)}초 멈춤`, kinds[stage]);
  });
}
