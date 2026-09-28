/* ============================================================
   그림 키트 — 데모 안의 사람, 생물, 사물을 한 그림체로 그린다 (Canvas 2D)

   그림체 규칙 (레퍼런스: 외곽선 없는 평면 실루엣 + 가는 잉크 디테일)
   - 덩어리(몸, 옷, 사물)는 **외곽선 없는 평면 단색**이다. 검정 테두리를 두르지 않는다.
   - 검정 선은 얼굴, 손가락, 주름, 사물의 윤곽 같은 **안쪽 디테일에만 가늘게(1.5px)** 쓴다.
   - 한 장면의 색은 크림 바탕 + 검정 + **색 한두 개**까지다. 나머지는 TONE(베이지·회색)로 처리한다.
   - 풍경은 톤이 다른 면으로만 만든다. 세모 지붕 집, 노란 원 해, 별 같은 아이콘 도상은 쓰지 않는다.
   - 비례는 뭉툭하되 조금 길게, 얼굴은 점 두 개와 선 하나로 끝낸다.

   사용 예
     import { ILLO, TONE, person, bird, cloud, face } from "../../lib/draw.js";
     person(g, x, y, { h: 140, color: ILLO.blue, mood: "happy" });
   ============================================================ */

export const ILLO = {
  ink: "#1b1b1a",
  blue: "#3b6fe0", orange: "#f2762a", yellow: "#f4c531", green: "#2f9d6a",
  pink: "#f3a5bd", red: "#e5432f", lilac: "#a99bf0",
  skin: "#f3cdb4", paper: "#fffdf6", cream: "#f4f2ee"
};
/** 풍경·구조물용 톤. 밝은 것부터 어두운 것 순서 */
export const TONE = ["#ebe6da", "#ddd6c7", "#c9c1af", "#aca390", "#857d6e", "#4f4a42"];
/** 사람·생물에 돌아가며 쓸 색 (한 장면에 두 가지까지만) */
export const ILLO_CYCLE = [ILLO.blue, ILLO.orange, ILLO.green, ILLO.pink, ILLO.yellow, ILLO.lilac, ILLO.red];
/** 디테일 선 굵기 */
export const LINE = 1.5;

const TAU = Math.PI * 2;

/* ---------- 기본 도구 ---------- */
/** 채우고(기본), 원하면 가는 선을 두른다. offset을 주면 채움이 선에서 살짝 어긋난 인쇄 느낌이 난다 */
export function shape(g, pathFn, { fill = TONE[2], stroke = ILLO.ink, lw = 0, offset = 0 } = {}) {
  g.save();
  g.lineJoin = "round"; g.lineCap = "round";
  if (fill) {
    g.save(); if (offset) g.translate(offset, offset);
    g.beginPath(); pathFn(g); g.fillStyle = fill; g.fill();
    g.restore();
  }
  if (stroke && lw > 0) { g.beginPath(); pathFn(g); g.strokeStyle = stroke; g.lineWidth = lw; g.stroke(); }
  g.restore();
}
/** 굵은 단색 선(팔, 다리, 줄기). 외곽선은 두르지 않는다 */
export function tube(g, pts, { color = ILLO.blue, w = 14 } = {}) {
  g.save(); g.lineJoin = "round"; g.lineCap = "round";
  g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]));
  g.strokeStyle = color; g.lineWidth = w; g.stroke();
  g.restore();
}
export const circle = (g, x, y, r, o) => shape(g, c => c.arc(x, y, r, 0, TAU), o);
export const ellipse = (g, x, y, rx, ry, o, rot = 0) => shape(g, c => c.ellipse(x, y, rx, ry, rot, 0, TAU), o);
export const roundRect = (g, x, y, w, h, r, o) => shape(g, c => c.roundRect(x, y, w, h, r), o);
/** 가는 잉크 선 (얼굴, 손가락, 주름, 사물 윤곽) */
export function line(g, pts, { lw = LINE, stroke = ILLO.ink, dash } = {}) {
  g.save(); g.lineJoin = "round"; g.lineCap = "round"; g.strokeStyle = stroke; g.lineWidth = lw;
  if (dash) g.setLineDash(dash);
  g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.stroke(); g.restore();
}
/** 가는 잉크 곡선: [x0,y0, cx,cy, x1,y1] */
export function curve(g, [x0, y0, cx, cy, x1, y1], { lw = LINE, stroke = ILLO.ink } = {}) {
  g.save(); g.lineCap = "round"; g.strokeStyle = stroke; g.lineWidth = lw;
  g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo(cx, cy, x1, y1); g.stroke(); g.restore();
}
export function dot(g, x, y, r = 2, fill = ILLO.ink) { g.save(); g.fillStyle = fill; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); g.restore(); }

/* ---------- 얼굴 ---------- */
/**
 * 얼굴 디테일만 그린다 (머리 도형은 따로). 점 두 개와 선 하나가 기본이다.
 * look: {x, y} -1~1 시선.  mood: neutral | happy | sleepy | surprised | sad
 */
export function face(g, x, y, r, { look = { x: 0, y: 0 }, mood = "neutral", lw = LINE, eyeGap = 0.36 } = {}) {
  const ex = r * eyeGap, ey = -r * 0.1, er = Math.max(1.4, r * 0.07);
  const lx = look.x * r * 0.14, ly = look.y * r * 0.1;
  if (mood === "sleepy") {
    line(g, [[x - ex - er * 2, y + ey], [x - ex + er * 2, y + ey]], { lw });
    line(g, [[x + ex - er * 2, y + ey], [x + ex + er * 2, y + ey]], { lw });
  } else if (mood === "surprised") {
    circle(g, x - ex + lx, y + ey + ly, er * 2.2, { fill: null, lw });
    circle(g, x + ex + lx, y + ey + ly, er * 2.2, { fill: null, lw });
    dot(g, x - ex + lx * 1.3, y + ey + ly * 1.3, er); dot(g, x + ex + lx * 1.3, y + ey + ly * 1.3, er);
  } else {
    dot(g, x - ex + lx, y + ey + ly, er); dot(g, x + ex + lx, y + ey + ly, er);
  }
  const my = y + r * 0.34, mw = r * 0.22;
  if (mood === "happy") curve(g, [x - mw + lx * 0.5, my - mw * 0.25, x + lx * 0.5, my + mw * 0.55, x + mw + lx * 0.5, my - mw * 0.25], { lw });
  else if (mood === "sad") curve(g, [x - mw + lx * 0.5, my + mw * 0.3, x + lx * 0.5, my - mw * 0.4, x + mw + lx * 0.5, my + mw * 0.3], { lw });
  else if (mood === "surprised") ellipse(g, x + lx * 0.5, my, mw * 0.4, mw * 0.55, { fill: ILLO.ink });
  else line(g, [[x - mw * 0.8 + lx * 0.5, my], [x + mw * 0.8 + lx * 0.5, my]], { lw });
}
/** 눈 하나: 흰자에 가는 윤곽, 동공. look은 -1~1 */
export function eye(g, x, y, r, { look = { x: 0, y: 0 }, lw = LINE, closed = false, fill = ILLO.paper } = {}) {
  if (closed) { line(g, [[x - r, y], [x + r, y]], { lw }); return; }
  circle(g, x, y, r, { fill, lw });
  const m = r * 0.5;
  dot(g, x + look.x * m, y + look.y * m, r * 0.32);
}
/** 잠잘 때 나오는 z. t는 0~1로 위로 떠오르는 정도 */
export function zz(g, x, y, { size = 12, lw = LINE, t = 0 } = {}) {
  const s = size, yy = y - t * s * 2;
  g.save(); g.strokeStyle = ILLO.ink; g.lineWidth = lw; g.lineJoin = "round"; g.lineCap = "round";
  g.globalAlpha = 1 - t * 0.8;
  g.beginPath(); g.moveTo(x, yy); g.lineTo(x + s, yy); g.lineTo(x, yy + s); g.lineTo(x + s, yy + s); g.stroke();
  g.restore();
}

/* ---------- 사람 ---------- */
/**
 * 사람. (x, y)는 발바닥 가운데, h는 키. 외곽선 없는 실루엣 + 가는 디테일.
 * pose: stand | wave | sit | crouch | jump   mood: face()와 같다   look: 시선
 * color: 옷 색 (덩어리). skin: 얼굴·손 색 (기본 ILLO.skin). hair: 머리카락 덩어리(검정) 여부.
 */
export function person(g, x, y, { h = 140, color = ILLO.blue, skin = ILLO.skin, hair = true, pose = "stand", mood = "neutral", look = { x: 0, y: 0 }, lw = LINE, facing = 1, squash = 0 } = {}) {
  const s = h / 140;
  g.save(); g.translate(x, y); g.scale((1 + squash * 0.5) * (facing < 0 ? -1 : 1), 1 - squash);
  const hr = 17 * s;                      // 머리
  const bw = 46 * s, bh = 62 * s;         // 몸통(길쭉하게)
  const legW = 13 * s, armW = 12 * s;
  const sit = pose === "sit", crouch = pose === "crouch", jump = pose === "jump", wave = pose === "wave";
  const legLen = crouch ? 16 * s : sit ? 22 * s : 44 * s;
  const bodyBottom = -legLen, bodyTop = bodyBottom - bh;
  const headY = bodyTop - hr + 6 * s;
  const legColor = TONE[5];
  // 다리
  if (sit) {
    tube(g, [[-bw * 0.2, bodyBottom - 8 * s], [24 * s, bodyBottom - 8 * s], [24 * s, 0]], { color: legColor, w: legW });
    tube(g, [[bw * 0.1, bodyBottom - 8 * s], [30 * s, bodyBottom - 4 * s], [30 * s, 0]], { color: legColor, w: legW * 0.9 });
  } else {
    const spread = jump ? 9 * s : crouch ? 8 * s : 0;
    tube(g, [[-bw * 0.2, bodyBottom - 6 * s], [-bw * 0.2 - spread, 0]], { color: legColor, w: legW });
    tube(g, [[bw * 0.2, bodyBottom - 6 * s], [bw * 0.2 + spread, 0]], { color: legColor, w: legW });
    // 신발
    ellipse(g, -bw * 0.2 - spread + 1 * s, 0, 9 * s, 3.5 * s, { fill: ILLO.ink });
    ellipse(g, bw * 0.2 + spread + 1 * s, 0, 9 * s, 3.5 * s, { fill: ILLO.ink });
  }
  // 몸통 (어깨가 둥근 실루엣)
  shape(g, c => c.roundRect(-bw / 2, bodyTop, bw, bh, [20 * s, 20 * s, 10 * s, 10 * s]), { fill: color });
  // 팔
  const shY = bodyTop + 12 * s;
  const rightUp = wave || jump, leftUp = jump;
  const armL = [[-bw / 2 + 5 * s, shY], [-bw / 2 - 8 * s, leftUp ? bodyTop - 18 * s : bodyBottom - 4 * s]];
  const armR = [[bw / 2 - 5 * s, shY], [bw / 2 + 8 * s, rightUp ? bodyTop - 18 * s : bodyBottom - 4 * s]];
  tube(g, armL, { color, w: armW }); tube(g, armR, { color, w: armW });
  // 손 + 손가락 선
  for (const [a, dir] of [[armL, -1], [armR, 1]]) {
    const [hx, hy] = a[1];
    circle(g, hx, hy, 6 * s, { fill: skin });
    for (let i = -1; i <= 1; i++) line(g, [[hx + i * 2.4 * s, hy + 1 * s], [hx + i * 2.8 * s, hy + 5.5 * s]], { lw: lw * 0.8 });
  }
  // 목·머리
  tube(g, [[0, bodyTop + 2 * s], [0, headY + hr * 0.6]], { color: skin, w: 8 * s });
  circle(g, 0, headY, hr, { fill: skin });
  if (hair) shape(g, c => { c.arc(0, headY, hr + 1.5 * s, Math.PI * 1.02, Math.PI * 1.98); c.closePath(); }, { fill: ILLO.ink });
  face(g, 0, headY + 2 * s, hr, { look, mood, lw });
  g.restore();
}

/* ---------- 생물 ---------- */
/** 새. (x, y)는 몸 중심, angle은 진행 방향(라디안), flap은 -1~1 날개짓. 실루엣 + 가는 눈·날개선 */
export function bird(g, x, y, { size = 26, color = ILLO.orange, angle = 0, flap = 0, lw = LINE } = {}) {
  const s = size / 26;
  g.save(); g.translate(x, y); g.rotate(angle);
  shape(g, c => { c.moveTo(-10 * s, -1 * s); c.lineTo(-22 * s, -7 * s); c.lineTo(-19 * s, 5 * s); c.closePath(); }, { fill: color });
  ellipse(g, 0, 0, 14 * s, 8.5 * s, { fill: color });
  circle(g, 12 * s, -5 * s, 6 * s, { fill: color });
  const tip = -flap * 13 * s;
  shape(g, c => { c.moveTo(-4 * s, -2 * s); c.quadraticCurveTo(-3 * s, tip - 6 * s, -17 * s, tip - 2 * s); c.lineTo(5 * s, -2 * s); c.closePath(); }, { fill: color });
  line(g, [[-4 * s, -2 * s], [-15 * s, tip - 2 * s]], { lw: lw * 0.8 });
  shape(g, c => { c.moveTo(17.5 * s, -6 * s); c.lineTo(24 * s, -4.5 * s); c.lineTo(17.5 * s, -3 * s); c.closePath(); }, { fill: ILLO.ink });
  dot(g, 13.5 * s, -6.5 * s, 1.4 * s);
  g.restore();
}
/** 벌레. angle은 진행 방향 */
export function bug(g, x, y, { size = 18, color = TONE[5], angle = 0, lw = LINE, legT = 0 } = {}) {
  const s = size / 18;
  g.save(); g.translate(x, y); g.rotate(angle);
  for (let i = -1; i <= 1; i++) {
    const k = Math.sin(legT * TAU + i) * 2 * s;
    line(g, [[i * 5 * s, -5 * s], [i * 5 * s + k, -10 * s]], { lw });
    line(g, [[i * 5 * s, 5 * s], [i * 5 * s - k, 10 * s]], { lw });
  }
  ellipse(g, 0, 0, 10 * s, 6.5 * s, { fill: color });
  line(g, [[-7 * s, 0], [7 * s, 0]], { lw, stroke: ILLO.paper });
  circle(g, 10 * s, 0, 3.5 * s, { fill: ILLO.ink });
  g.restore();
}
/** 고양이 (앉은 모습). 실루엣 + 가는 얼굴선 */
export function cat(g, x, y, { size = 80, color = TONE[4], mood = "neutral", look = { x: 0, y: 0 }, lw = LINE, tailT = 0 } = {}) {
  const s = size / 80;
  g.save(); g.translate(x, y);
  shape(g, c => { c.moveTo(22 * s, -10 * s); c.quadraticCurveTo(46 * s, -14 * s + Math.sin(tailT) * 8 * s, 40 * s, -38 * s); }, { fill: null, lw: 6 * s, stroke: color });
  ellipse(g, 0, -16 * s, 26 * s, 18 * s, { fill: color });
  shape(g, c => { c.moveTo(-22 * s, -36 * s); c.lineTo(-18 * s, -56 * s); c.lineTo(-6 * s, -47 * s); c.closePath(); }, { fill: color });
  shape(g, c => { c.moveTo(22 * s, -36 * s); c.lineTo(18 * s, -56 * s); c.lineTo(6 * s, -47 * s); c.closePath(); }, { fill: color });
  circle(g, 0, -36 * s, 20 * s, { fill: color });
  face(g, 0, -35 * s, 20 * s, { mood, look, lw, eyeGap: 0.38 });
  line(g, [[-26 * s, -31 * s], [-13 * s, -30 * s]], { lw: lw * 0.8 }); line(g, [[26 * s, -31 * s], [13 * s, -30 * s]], { lw: lw * 0.8 });
  g.restore();
}

/* ---------- 자연·사물 ---------- */
/** 구름. (x, y)는 중심, w는 너비. 종이색 실루엣 + 가는 윤곽. squeeze 0~1이면 눌린 모양 */
export function cloud(g, x, y, { w = 120, color = ILLO.paper, lw = LINE, squeeze = 0 } = {}) {
  const s = w / 120;
  const sy = 1 - squeeze * 0.45, sx = 1 + squeeze * 0.2;
  const parts = [[0, -8, 30], [-34, 2, 22], [34, 2, 22], [-14, 10, 20], [16, 10, 21]];
  g.save(); g.translate(x, y); g.scale(sx * s, sy * s);
  g.lineJoin = "round"; g.strokeStyle = ILLO.ink; g.lineWidth = (lw * 2) / (s * Math.min(sx, sy));
  parts.forEach(([px, py, r]) => { g.beginPath(); g.arc(px, py, r, 0, TAU); g.stroke(); });
  g.fillStyle = color;
  parts.forEach(([px, py, r]) => { g.beginPath(); g.arc(px, py, r, 0, TAU); g.fill(); });
  g.restore();
}
/** 물방울. (x, y)는 아래 뾰족한 끝 */
export function drop(g, x, y, { size = 14, color = ILLO.blue } = {}) {
  const s = size / 14;
  shape(g, c => { c.moveTo(x, y); c.quadraticCurveTo(x + 9 * s, y - 10 * s, x, y - 20 * s); c.quadraticCurveTo(x - 9 * s, y - 10 * s, x, y); }, { fill: color });
}
/** 새싹·식물. growth 0~1. (x, y)는 땅에 닿는 점. 줄기는 가는 선, 잎은 실루엣 */
export function sprout(g, x, y, { growth = 1, color = ILLO.green, lw = LINE, size = 60 } = {}) {
  const s = size / 60 * Math.max(0.05, growth);
  const top = y - 50 * s;
  curve(g, [x, y, x + 4 * s, y - 25 * s, x, top], { lw: lw + 0.5 });
  if (growth > 0.25) {
    ellipse(g, x - 13 * s, y - 24 * s, 13 * s, 6 * s, { fill: color }, -0.5);
    ellipse(g, x + 13 * s, y - 36 * s, 13 * s, 6 * s, { fill: color }, 0.5);
  }
  if (growth > 0.85) circle(g, x, top - 4 * s, 6 * s, { fill: ILLO.ink });
}
/** 나뭇잎 */
export function leaf(g, x, y, { size = 30, color = ILLO.green, angle = 0, lw = LINE } = {}) {
  const s = size / 30;
  g.save(); g.translate(x, y); g.rotate(angle);
  shape(g, c => { c.moveTo(-15 * s, 0); c.quadraticCurveTo(0, -14 * s, 15 * s, 0); c.quadraticCurveTo(0, 14 * s, -15 * s, 0); }, { fill: color });
  line(g, [[-11 * s, 0], [9 * s, 0]], { lw: lw * 0.8 });
  g.restore();
}
/** 별 (작은 장식·표식). 실루엣만 */
export function star(g, x, y, { r = 12, color = ILLO.ink } = {}) {
  shape(g, c => { for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; c[i ? "lineTo" : "moveTo"](x + Math.cos(a) * rr, y + Math.sin(a) * rr); } c.closePath(); }, { fill: color });
}
/** 하트. 실루엣만 */
export function heart(g, x, y, { r = 12, color = ILLO.red } = {}) {
  shape(g, c => { c.moveTo(x, y + r); c.bezierCurveTo(x - r * 1.6, y - r * 0.2, x - r * 0.9, y - r * 1.3, x, y - r * 0.5); c.bezierCurveTo(x + r * 0.9, y - r * 1.3, x + r * 1.6, y - r * 0.2, x, y + r); }, { fill: color });
}
/** 깃발. (x, y)는 깃대 아래. 깃대는 가는 선, 깃발은 실루엣 */
export function flag(g, x, y, { h = 44, color = ILLO.red, lw = LINE, wave = 0 } = {}) {
  const s = h / 44;
  line(g, [[x, y], [x, y - 44 * s]], { lw: lw + 0.5 });
  shape(g, c => { c.moveTo(x, y - 44 * s); c.quadraticCurveTo(x + 14 * s, y - 40 * s + wave * 4 * s, x + 26 * s, y - 36 * s); c.lineTo(x, y - 26 * s); c.closePath(); }, { fill: color });
}
/** 머그. 실루엣 + 가는 윤곽선 (사물은 레퍼런스 4·5처럼 가는 선으로 그린다) */
export function mug(g, x, y, { size = 40, color = TONE[1], lw = LINE } = {}) {
  const s = size / 40;
  shape(g, c => c.arc(x + 20 * s, y - 20 * s, 9 * s, -Math.PI / 2, Math.PI / 2), { fill: null, lw: lw + 4 * s, stroke: color });
  shape(g, c => c.arc(x + 20 * s, y - 20 * s, 9 * s, -Math.PI / 2, Math.PI / 2), { fill: null, lw, stroke: ILLO.ink });
  roundRect(g, x - 18 * s, y - 36 * s, 38 * s, 36 * s, 5 * s, { fill: color, lw });
  ellipse(g, x + 1 * s, y - 36 * s, 19 * s, 5 * s, { fill: ILLO.paper, lw });
}
/** 손 (펼침 / 쥠 / 가리킴). (x, y)는 손바닥 중심. 실루엣 + 손가락 사이 가는 선 */
export function hand(g, x, y, { size = 44, color = ILLO.skin, pose = "open", lw = LINE, angle = 0 } = {}) {
  const s = size / 44;
  g.save(); g.translate(x, y); g.rotate(angle);
  if (pose === "grab") {
    roundRect(g, -16 * s, -14 * s, 32 * s, 30 * s, 12 * s, { fill: color });
    for (let i = 0; i < 3; i++) line(g, [[-9 * s + i * 9 * s, -14 * s], [-9 * s + i * 9 * s, -3 * s]], { lw });
  } else {
    const fingers = pose === "point" ? [[-9, -18, 0.55], [-2, -6, 0.5], [5, -6, 0.5], [12, -5, 0.45]] : [[-10, -22, 0.5], [-3, -26, 0.5], [4, -25, 0.5], [11, -20, 0.45]];
    fingers.forEach(([fx, fy, fw]) => tube(g, [[fx * s, -6 * s], [fx * s, fy * s]], { color, w: 9 * s * fw * 2 }));
    roundRect(g, -15 * s, -8 * s, 30 * s, 28 * s, 10 * s, { fill: color });
    tube(g, [[-17 * s, 2 * s], [-24 * s, -8 * s]], { color, w: 9 * s });
    fingers.slice(0, 3).forEach(([fx], i) => line(g, [[(fx + 3.5) * s, -8 * s], [(fx + 3.5) * s, -1 * s]], { lw: lw * 0.8 }));
  }
  g.restore();
}
