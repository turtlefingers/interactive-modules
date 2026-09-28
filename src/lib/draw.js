/* ============================================================
   그림 키트 — 데모 안의 사람, 생물, 사물을 한 그림체로 그린다 (Canvas 2D)

   그림체 규칙
   - 굵기가 균일한 검정 외곽선(기본 3px), 안은 평면 단색. 그라데이션·그림자 없음
   - 색은 ILLO 팔레트 안에서만 고른다
   - 얼굴은 점 두 개와 선 하나처럼 최소한으로, 몸은 뭉툭한 덩어리로
   - 한 데모 안에서 선 굵기(lw)는 하나로 통일한다

   사용 예
     import { ILLO, person, bird, cloud, sprout, eye, face } from "../../lib/draw.js";
     person(g, x, y, { h: 140, color: ILLO.blue, pose: "stand", mood: "happy" });
   ============================================================ */

export const ILLO = {
  ink: "#1b1b1a",
  blue: "#3b6fe0", orange: "#f2762a", yellow: "#f4c531", green: "#2f9d6a",
  pink: "#f3a5bd", red: "#e5432f", lilac: "#a99bf0",
  skin: "#f7d9c4", paper: "#fffdf6", grey: "#cfc9bd"
};
/** 사람·새 등에 돌아가며 쓸 색 순서 */
export const ILLO_CYCLE = [ILLO.blue, ILLO.orange, ILLO.green, ILLO.yellow, ILLO.pink, ILLO.red, ILLO.lilac];

const TAU = Math.PI * 2;

/* ---------- 기본 도구 ---------- */
/** 채우고 외곽선을 긋는다. offset을 주면 채움이 선에서 살짝 어긋난 인쇄 느낌이 난다 */
export function shape(g, pathFn, { fill = ILLO.paper, stroke = ILLO.ink, lw = 3, offset = 0 } = {}) {
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
/** 외곽선이 있는 굵은 선(팔, 다리, 줄기) */
export function tube(g, pts, { color = ILLO.blue, w = 14, lw = 3, stroke = ILLO.ink } = {}) {
  g.save(); g.lineJoin = "round"; g.lineCap = "round";
  const path = () => { g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); };
  path(); g.strokeStyle = stroke; g.lineWidth = w + lw * 2; g.stroke();
  path(); g.strokeStyle = color; g.lineWidth = w; g.stroke();
  g.restore();
}
export const circle = (g, x, y, r, o) => shape(g, c => c.arc(x, y, r, 0, TAU), o);
export const ellipse = (g, x, y, rx, ry, o, rot = 0) => shape(g, c => c.ellipse(x, y, rx, ry, rot, 0, TAU), o);
export const roundRect = (g, x, y, w, h, r, o) => shape(g, c => c.roundRect(x, y, w, h, r), o);
/** 선만 긋는다 (입, 주름, 바닥선) */
export function line(g, pts, { lw = 3, stroke = ILLO.ink, dash } = {}) {
  g.save(); g.lineJoin = "round"; g.lineCap = "round"; g.strokeStyle = stroke; g.lineWidth = lw;
  if (dash) g.setLineDash(dash);
  g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.stroke(); g.restore();
}
export function dot(g, x, y, r = 3, fill = ILLO.ink) { g.save(); g.fillStyle = fill; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); g.restore(); }

/* ---------- 얼굴 ---------- */
/**
 * 얼굴 요소만 그린다 (머리 도형은 따로).
 * look: {x, y} -1~1, 눈동자가 그쪽을 본다. mood: neutral | happy | sleepy | surprised | sad
 */
export function face(g, x, y, r, { look = { x: 0, y: 0 }, mood = "happy", lw = 3, eyeGap = 0.42 } = {}) {
  const ex = r * eyeGap, ey = -r * 0.12, er = Math.max(1.6, r * 0.09);
  const lx = look.x * r * 0.12, ly = look.y * r * 0.1;
  if (mood === "sleepy") {
    line(g, [[x - ex - er * 1.6, y + ey], [x - ex + er * 1.6, y + ey]], { lw });
    line(g, [[x + ex - er * 1.6, y + ey], [x + ex + er * 1.6, y + ey]], { lw });
  } else if (mood === "surprised") {
    circle(g, x - ex + lx, y + ey + ly, er * 1.8, { fill: ILLO.paper, lw });
    circle(g, x + ex + lx, y + ey + ly, er * 1.8, { fill: ILLO.paper, lw });
    dot(g, x - ex + lx * 1.4, y + ey + ly * 1.4, er * 0.9); dot(g, x + ex + lx * 1.4, y + ey + ly * 1.4, er * 0.9);
  } else {
    dot(g, x - ex + lx, y + ey + ly, er); dot(g, x + ex + lx, y + ey + ly, er);
  }
  const my = y + r * 0.3, mw = r * 0.28;
  g.save(); g.strokeStyle = ILLO.ink; g.lineWidth = lw; g.lineCap = "round"; g.beginPath();
  if (mood === "happy") g.arc(x + lx * 0.5, my - mw * 0.4, mw, 0.25 * Math.PI, 0.75 * Math.PI);
  else if (mood === "sad") g.arc(x + lx * 0.5, my + mw * 0.6, mw, 1.25 * Math.PI, 1.75 * Math.PI);
  else if (mood === "surprised") { g.stroke(); ellipse(g, x + lx * 0.5, my, mw * 0.45, mw * 0.6, { fill: ILLO.ink, lw: 0 }); g.restore(); return; }
  else { g.moveTo(x - mw * 0.7 + lx * 0.5, my); g.lineTo(x + mw * 0.7 + lx * 0.5, my); }
  g.stroke(); g.restore();
}
/** 눈 하나: 흰자와 동공. look은 -1~1 */
export function eye(g, x, y, r, { look = { x: 0, y: 0 }, lw = 3, closed = false, fill = ILLO.paper } = {}) {
  if (closed) { line(g, [[x - r, y], [x + r, y]], { lw }); return; }
  circle(g, x, y, r, { fill, lw });
  const m = r * 0.45;
  dot(g, x + look.x * m, y + look.y * m, r * 0.38);
}
/** 잠잘 때 나오는 z. t는 0~1로 위로 떠오르는 정도 */
export function zz(g, x, y, { size = 12, lw = 3, t = 0 } = {}) {
  const s = size, yy = y - t * s * 2;
  g.save(); g.strokeStyle = ILLO.ink; g.lineWidth = lw; g.lineJoin = "round"; g.lineCap = "round";
  g.globalAlpha = 1 - t * 0.8;
  g.beginPath(); g.moveTo(x, yy); g.lineTo(x + s, yy); g.lineTo(x, yy + s); g.lineTo(x + s, yy + s); g.stroke();
  g.restore();
}

/* ---------- 사람 ---------- */
/**
 * 뭉툭한 사람. (x, y)는 발바닥 가운데, h는 키.
 * pose: stand | wave | sit | crouch | jump   mood: face()와 같다   look: 시선
 * color는 옷 색, skin은 얼굴 색(기본은 옷과 같은 색: 레퍼런스 1 스타일). skin: ILLO.skin으로 주면 살색.
 */
export function person(g, x, y, { h = 140, color = ILLO.blue, skin = null, pose = "stand", mood = "happy", look = { x: 0, y: 0 }, lw = 3, facing = 1, squash = 0 } = {}) {
  const s = h / 140;
  const sy = 1 - squash, sx = 1 + squash * 0.6;
  g.save(); g.translate(x, y); g.scale(sx, sy);
  const hr = 20 * s;                 // 머리 반지름
  const bw = 52 * s, bh = 58 * s;    // 몸통
  const legW = 15 * s, armW = 13 * s;
  const sit = pose === "sit", crouch = pose === "crouch", jump = pose === "jump";
  const legLen = crouch ? 18 * s : sit ? 24 * s : 40 * s;
  const bodyBottom = -legLen;        // 몸통 아래
  const bodyTop = bodyBottom - bh;
  const headY = bodyTop - hr + 4 * s;

  // 다리
  if (sit) {
    tube(g, [[-bw * 0.25, bodyBottom - 6 * s], [-bw * 0.25 + 26 * s * facing, bodyBottom - 6 * s], [-bw * 0.25 + 26 * s * facing, 0]], { color: ILLO.ink, w: legW * 0.8, lw, stroke: ILLO.ink });
    tube(g, [[bw * 0.1, bodyBottom - 6 * s], [bw * 0.1 + 22 * s * facing, bodyBottom - 6 * s], [bw * 0.1 + 22 * s * facing, 0]], { color: ILLO.ink, w: legW * 0.8, lw, stroke: ILLO.ink });
  } else {
    const spread = jump ? 10 * s : 0;
    tube(g, [[-bw * 0.22, bodyBottom - 6 * s], [-bw * 0.22 - spread, 0]], { color: ILLO.ink, w: legW, lw });
    tube(g, [[bw * 0.22, bodyBottom - 6 * s], [bw * 0.22 + spread, 0]], { color: ILLO.ink, w: legW, lw });
  }
  // 몸통
  roundRect(g, -bw / 2, bodyTop, bw, bh, 16 * s, { fill: color, lw });
  // 팔
  const shY = bodyTop + 14 * s;
  const wave = pose === "wave" || jump;
  tube(g, [[-bw / 2 + 4 * s, shY], [-bw / 2 - 10 * s, wave && facing < 0 ? bodyTop - 24 * s : bodyBottom - 8 * s]], { color, w: armW, lw });
  tube(g, [[bw / 2 - 4 * s, shY], [bw / 2 + 10 * s, wave && facing > 0 ? bodyTop - 24 * s : bodyBottom - 8 * s]], { color, w: armW, lw });
  // 머리
  circle(g, 0, headY, hr, { fill: skin || color, lw });
  face(g, 0, headY, hr, { look, mood, lw });
  g.restore();
}

/* ---------- 생물 ---------- */
/**
 * 새. (x, y)는 몸 중심, angle은 진행 방향(라디안), flap은 -1~1 날개짓.
 */
export function bird(g, x, y, { size = 26, color = ILLO.orange, angle = 0, flap = 0, lw = 3, look = { x: 1, y: 0 } } = {}) {
  const s = size / 26;
  g.save(); g.translate(x, y); g.rotate(angle);
  // 꼬리
  shape(g, c => { c.moveTo(-12 * s, -2 * s); c.lineTo(-22 * s, -8 * s); c.lineTo(-20 * s, 4 * s); c.closePath(); }, { fill: color, lw });
  // 몸
  ellipse(g, 0, 0, 14 * s, 9 * s, { fill: color, lw });
  // 날개
  const wy = -2 * s, tip = -flap * 14 * s;
  shape(g, c => { c.moveTo(-4 * s, wy); c.quadraticCurveTo(-2 * s, wy + tip - 6 * s, -18 * s, wy + tip); c.lineTo(6 * s, wy); c.closePath(); }, { fill: color, lw });
  // 머리·부리·눈
  circle(g, 12 * s, -5 * s, 6.5 * s, { fill: color, lw });
  shape(g, c => { c.moveTo(18 * s, -6 * s); c.lineTo(25 * s, -4 * s); c.lineTo(18 * s, -2 * s); c.closePath(); }, { fill: ILLO.yellow, lw });
  dot(g, 13.5 * s + look.x * 1.2 * s, -6 * s + look.y * s, 1.6 * s);
  g.restore();
}
/** 벌레(딱정벌레). angle은 진행 방향 */
export function bug(g, x, y, { size = 18, color = ILLO.green, angle = 0, lw = 3, legT = 0 } = {}) {
  const s = size / 18;
  g.save(); g.translate(x, y); g.rotate(angle);
  for (let i = -1; i <= 1; i++) {
    const k = Math.sin(legT * TAU + i) * 2 * s;
    line(g, [[i * 5 * s, -6 * s], [i * 5 * s + k, -11 * s]], { lw });
    line(g, [[i * 5 * s, 6 * s], [i * 5 * s - k, 11 * s]], { lw });
  }
  ellipse(g, 0, 0, 10 * s, 7 * s, { fill: color, lw });
  line(g, [[-8 * s, 0], [8 * s, 0]], { lw });
  circle(g, 10 * s, 0, 4 * s, { fill: ILLO.ink, lw });
  g.restore();
}
/** 고양이 (앉은 모습). */
export function cat(g, x, y, { size = 80, color = ILLO.orange, mood = "sleepy", look = { x: 0, y: 0 }, lw = 3, tailT = 0 } = {}) {
  const s = size / 80;
  g.save(); g.translate(x, y);
  // 꼬리
  shape(g, c => { c.moveTo(22 * s, -10 * s); c.quadraticCurveTo(46 * s, -14 * s + Math.sin(tailT) * 8 * s, 40 * s, -38 * s); }, { fill: null, lw: lw + 6 * s, stroke: ILLO.ink });
  shape(g, c => { c.moveTo(22 * s, -10 * s); c.quadraticCurveTo(46 * s, -14 * s + Math.sin(tailT) * 8 * s, 40 * s, -38 * s); }, { fill: null, lw: 6 * s, stroke: color });
  // 몸·머리
  ellipse(g, 0, -16 * s, 26 * s, 18 * s, { fill: color, lw });
  shape(g, c => { c.moveTo(-22 * s, -36 * s); c.lineTo(-18 * s, -56 * s); c.lineTo(-6 * s, -46 * s); c.closePath(); }, { fill: color, lw });
  shape(g, c => { c.moveTo(22 * s, -36 * s); c.lineTo(18 * s, -56 * s); c.lineTo(6 * s, -46 * s); c.closePath(); }, { fill: color, lw });
  circle(g, 0, -36 * s, 20 * s, { fill: color, lw });
  face(g, 0, -34 * s, 20 * s, { mood, look, lw, eyeGap: 0.4 });
  line(g, [[-24 * s, -30 * s], [-12 * s, -29 * s]], { lw: lw * 0.7 }); line(g, [[24 * s, -30 * s], [12 * s, -29 * s]], { lw: lw * 0.7 });
  g.restore();
}

/* ---------- 자연·사물 ---------- */
/** 구름. (x, y)는 중심, w는 너비. squeeze 0~1이면 눌린 모양 */
export function cloud(g, x, y, { w = 120, color = ILLO.paper, lw = 3, squeeze = 0 } = {}) {
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
export function drop(g, x, y, { size = 14, color = ILLO.blue, lw = 3 } = {}) {
  const s = size / 14;
  shape(g, c => { c.moveTo(x, y); c.quadraticCurveTo(x + 9 * s, y - 10 * s, x, y - 20 * s); c.quadraticCurveTo(x - 9 * s, y - 10 * s, x, y); }, { fill: color, lw });
}
/** 새싹·식물. growth 0~1. (x, y)는 땅에 닿는 점 */
export function sprout(g, x, y, { growth = 1, color = ILLO.green, lw = 3, size = 60 } = {}) {
  const s = size / 60 * Math.max(0.05, growth);
  const top = y - 50 * s;
  tube(g, [[x, y], [x + 3 * s, y - 25 * s], [x, top]], { color, w: 5 * s + 2, lw });
  if (growth > 0.25) {
    ellipse(g, x - 14 * s, y - 24 * s, 14 * s, 7 * s, { fill: color, lw }, -0.5);
    ellipse(g, x + 14 * s, y - 36 * s, 14 * s, 7 * s, { fill: color, lw }, 0.5);
  }
  if (growth > 0.85) circle(g, x, top - 4 * s, 7 * s, { fill: ILLO.yellow, lw });
}
/** 나뭇잎 */
export function leaf(g, x, y, { size = 30, color = ILLO.green, angle = 0, lw = 3 } = {}) {
  const s = size / 30;
  g.save(); g.translate(x, y); g.rotate(angle);
  shape(g, c => { c.moveTo(-15 * s, 0); c.quadraticCurveTo(0, -14 * s, 15 * s, 0); c.quadraticCurveTo(0, 14 * s, -15 * s, 0); }, { fill: color, lw });
  line(g, [[-12 * s, 0], [10 * s, 0]], { lw: lw * 0.8 });
  g.restore();
}
/** 별 */
export function star(g, x, y, { r = 12, color = ILLO.yellow, lw = 3 } = {}) {
  shape(g, c => { for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; c[i ? "lineTo" : "moveTo"](x + Math.cos(a) * rr, y + Math.sin(a) * rr); } c.closePath(); }, { fill: color, lw });
}
/** 하트 */
export function heart(g, x, y, { r = 12, color = ILLO.red, lw = 3 } = {}) {
  shape(g, c => { c.moveTo(x, y + r); c.bezierCurveTo(x - r * 1.6, y - r * 0.2, x - r * 0.9, y - r * 1.3, x, y - r * 0.5); c.bezierCurveTo(x + r * 0.9, y - r * 1.3, x + r * 1.6, y - r * 0.2, x, y + r); }, { fill: color, lw });
}
/** 깃발. (x, y)는 깃대 아래 */
export function flag(g, x, y, { h = 44, color = ILLO.red, lw = 3, wave = 0 } = {}) {
  const s = h / 44;
  line(g, [[x, y], [x, y - 44 * s]], { lw: lw + 1 });
  shape(g, c => { c.moveTo(x, y - 44 * s); c.quadraticCurveTo(x + 14 * s, y - 40 * s + wave * 4 * s, x + 26 * s, y - 36 * s); c.lineTo(x, y - 26 * s); c.closePath(); }, { fill: color, lw });
}
/** 컵 (손잡이 있는 머그) */
export function mug(g, x, y, { size = 40, color = ILLO.green, lw = 3 } = {}) {
  const s = size / 40;
  shape(g, c => c.arc(x + 20 * s, y - 20 * s, 9 * s, -Math.PI / 2, Math.PI / 2), { fill: null, lw: lw + 5 * s, stroke: ILLO.ink });
  shape(g, c => c.arc(x + 20 * s, y - 20 * s, 9 * s, -Math.PI / 2, Math.PI / 2), { fill: null, lw: 5 * s, stroke: color });
  roundRect(g, x - 18 * s, y - 36 * s, 38 * s, 36 * s, 5 * s, { fill: color, lw });
  ellipse(g, x + 1 * s, y - 36 * s, 19 * s, 5 * s, { fill: ILLO.paper, lw });
}
/** 손 (펼침 / 쥠 / 가리킴). (x, y)는 손바닥 중심 */
export function hand(g, x, y, { size = 44, color = ILLO.skin, pose = "open", lw = 3, angle = 0 } = {}) {
  const s = size / 44;
  g.save(); g.translate(x, y); g.rotate(angle);
  if (pose === "grab") {
    roundRect(g, -16 * s, -14 * s, 32 * s, 30 * s, 12 * s, { fill: color, lw });
    for (let i = 0; i < 3; i++) line(g, [[-9 * s + i * 9 * s, -14 * s], [-9 * s + i * 9 * s, -2 * s]], { lw: lw * 0.8 });
  } else {
    roundRect(g, -15 * s, -8 * s, 30 * s, 28 * s, 10 * s, { fill: color, lw });
    const fingers = pose === "point" ? [[-9, -18, 0.55], [-2, -6, 0.5], [5, -6, 0.5], [12, -5, 0.45]] : [[-10, -22, 0.5], [-3, -26, 0.5], [4, -25, 0.5], [11, -20, 0.45]];
    fingers.forEach(([fx, fy, fw]) => tube(g, [[fx * s, -6 * s], [fx * s, fy * s]], { color, w: 9 * s * fw * 2, lw }));
    roundRect(g, -15 * s, -8 * s, 30 * s, 28 * s, 10 * s, { fill: color, lw: 0 });
    tube(g, [[-17 * s, 2 * s], [-24 * s, -8 * s]], { color, w: 9 * s, lw });
  }
  g.restore();
}
