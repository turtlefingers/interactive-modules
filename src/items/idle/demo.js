import { clamp, lerp, fitCanvas } from "../../lib/util.js";
import { ILLO, TONE, LINE, zz, ellipse } from "../../lib/draw.js";
import { drawPeep, peepBox, preload, outfit } from "../../lib/figure.js";
import { drawObject } from "../../lib/objects.js";
import "../../lib/objects/index.js";

const STAGE_NAME = ["깨어 있음", "하품", "졸림", "잠", "화면보호기"];
const SAVER_AFTER = 4; // 잠든 뒤 화면보호기까지(초)

// 사람(Open Peeps): 깨어 있을 땐 서 있고(차분한 얼굴), 졸리면 피곤한 얼굴, 잠들면 눈 감은 앉은 자세 그림으로 바뀐다. 깜짝 깰 땐 놀란 얼굴. 채움 색은 파랑 하나.
const STAND = { body: "ShirtBW", face: "Calm", hair: "Short", colors: outfit(ILLO.blue) };
const DROWSY = { ...STAND, face: "Tired" };
const STARTLE = { ...STAND, face: "Awe" };
const SIT = { body: "MediumBW", face: "EyesClosed", hair: "Short", colors: outfit(ILLO.blue) };
const ALL = [STAND, DROWSY, STARTLE, SIT];
// 앉은 그림의 키: 서 있는 그림과 같은 축척이 되도록 경계 상자 비율로 맞춘다
const sitScale = () => peepBox(SIT).h / peepBox(STAND).h;

export default function demo(api) {
  const { el, S } = api;
  const { g, size } = fitCanvas(api);
  el.style.cursor = "default";
  preload(ALL);
  const FF = getComputedStyle(el).fontFamily || "sans-serif";
  const C = { board: api.color("--board"), note: api.color("--note"), ink: api.color("--ink"), ink3: api.color("--ink-3"), accent: api.color("--accent") };

  const now = () => performance.now();
  let lastInput = now(), lastKind = "–", wakes = 0;
  let stage = 0, stageT = now();

  // 연출용 값
  let startleT = -1e9, gentleT = -1e9;
  let tilt = 0, saver = 0, slept = false;
  let asleep = 0;            // 0 = 서 있는 그림, 1 = 앉아서 잠든 그림 (교차 페이드)
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
  const onInput = kind => () => {
    if (S.by === "click" && (kind === "움직임" || kind === "휠") && stage >= 3) {
      lastKind = kind + " (무시)";
      if (now() - nagT > 2500) { nagT = now(); api.flash("움직임으로는 깨지 않는다 · 클릭이나 키", "idle", 1400); }
      return;
    }
    lastKind = kind;
    const deep = S.stages === "multi" ? stage >= 2 : stage >= 3;
    if (deep) {
      wakes++;
      if (S.wake === "startle") startleT = now();
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
  const line = (x0, y0, x1, y1) => { g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); };

  // (cx, gy)는 발바닥, H는 키
  function drawCharacter(t, H, cx, gy) {
    const T = t / 1000;
    const st = stage;
    // 점프 (깜짝)
    const ks = (t - startleT) / 460;
    let jump = 0;
    if (ks >= 0 && ks < 1) jump = -Math.sin(Math.PI * ks) * H * .22;
    else if (ks >= 1 && ks < 1.5) jump = -Math.sin(Math.PI * (ks - 1) * 2) * H * .025;
    // 기지개 (천천히 위로 늘어난다)
    const kg = (t - gentleT) / 1400;
    const stretch = kg >= 0 && kg < 1 ? Math.sin(Math.PI * kg) * .1 : 0;
    // 숨
    const breath = st >= 3 ? Math.sin(T * 1.7) * .02 : Math.sin(T * 3) * .008;
    // 흔들림: 하품이면 살짝 뒤로, 졸리면 천천히 좌우로 (±0.03), 잠들면 앞으로 기운다
    const tiltT = st === 2 ? Math.sin(T * 1.1) * .03 : st === 1 ? -.03 : 0;
    tilt = lerp(tilt, tiltT, .05);
    const slump = .12 * asleep;

    // 발밑 그림자 (톤)
    ellipse(g, cx, gy + 2, H * .2 * (1 + asleep * .5), H * .025, { fill: TONE[1] });
    // 서 있는 그림 ↔ 앉아서 잠든 그림 (같은 사람, 교차 페이드). 서 있을 땐 표정만 바꾼다: 깜짝 > 졸림 > 차분
    const awake = ks >= 0 && ks < 1.5 ? STARTLE : st === 1 || st === 2 ? DROWSY : STAND;
    if (asleep < .995) drawPeep(g, awake, cx, gy + jump, H, { alpha: 1 - asleep, rotate: tilt, squash: -(breath + stretch) });
    if (asleep > .005) drawPeep(g, SIT, cx, gy, H * sitScale(), { alpha: asleep, rotate: slump + tilt, squash: -breath });

    // 느낌표 (카탈로그 exclamation: 기울어진 색 실루엣). 머리 옆 위에서 잠깐 떠 있다가 사라진다
    if (t - startleT < 900) {
      const a = 1 - clamp((t - startleT - 600) / 300, 0, 1);
      const bx = cx + H * .3, by = gy + jump - H * 1.06, eh = H * .3;
      drawObject(g, "exclamation", bx, by + eh * .26, eh, { color: C.accent, accent: C.accent, alpha: a, t: t / 1000 });
    }
  }

  function drawZ(t, H, cx, gy) {
    if (stage >= 3 && t > nextZ) {
      zs.push({ x: cx + H * .2, y: gy - H * .78, born: t, s: H * .07 });
      nextZ = t + 1100;
    }
    for (let i = zs.length - 1; i >= 0; i--) {
      const z = zs[i], k = (t - z.born) / 2600;
      if (k >= 1 || stage < 3) { zs.splice(i, 1); continue; }
      zz(g, z.x + k * H * .25 + Math.sin(k * 6) * 6, z.y - k * H * .12, { size: z.s * (1 + k), lw: LINE, t: k });
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
    // 서 있는 그림 ↔ 잠든 그림: 잠들 땐 천천히, 깜짝 깰 땐 빠르게, 살살 깰 땐 느긋하게
    const gentle = t - gentleT < 1400;
    asleep = lerp(asleep, stage >= 3 ? 1 : 0, stage >= 3 ? .04 : gentle ? .03 : .3);
    saver = lerp(saver, stage === 4 ? 1 : 0, stage === 4 ? .03 : .25);

    const { w, h } = size;
    g.clearRect(0, 0, w, h);
    g.fillStyle = C.board; g.fillRect(0, 0, w, h);
    const H = clamp(Math.min(w, h * .9) * .34, 110, 230);
    const cx = w / 2, gy = h * .56 + H * .12;
    // 바닥: 톤 면 하나
    g.fillStyle = TONE[0]; g.fillRect(0, gy, w, h - gy);
    drawCharacter(t, H, cx, gy);
    drawZ(t, H, cx, gy);
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
