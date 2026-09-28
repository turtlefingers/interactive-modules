/* ============================================================
   사물 묶음 — 데모에 쓰이는 사물(풍선, 램프, 과녁, 모자 …)
   그림체: 덩어리는 외곽선 없는 단색 실루엣, 가는 1.5px 잉크 선은 끈·홈·안경테처럼 "뼈대"에만.
   색은 o.color 하나 + TONE + 종이색. o.accent 는 상태(맞음, 뜨거움)에서만 잠깐 쓴다.
   모든 타입은 (x, y) = 아래 가운데, 크기는 h 에 비례한다. 변형 A/B/C 는 실루엣 아이디어가 다르다.
   ============================================================ */
import { registerObject } from "../objects.js";
import { ILLO, TONE, LINE, shape, circle, ellipse, roundRect, line, curve, dot, tube } from "../draw.js";

const TAU = Math.PI * 2, PI = Math.PI;
/** 두 hex 색을 t(0~1)만큼 섞는다 (램프가 달아오를 때) */
function mix(a, b, t) {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const ch = sh => Math.round(((pa >> sh) & 255) + (((pb >> sh) & 255) - ((pa >> sh) & 255)) * t);
  return `rgb(${ch(16)},${ch(8)},${ch(0)})`;
}
const V = (label, draw) => ({ label, draw });
const reg = (name, label, demos, color, height, variants) => registerObject(name, { label, group: "사물", demos, color, height, variants });
/** 잉크 점 두 개 (얼굴은 여기서 끝) */
const twoDots = (g, x, y, gap, r) => { dot(g, x - gap, y, r); dot(g, x + gap, y + r * 0.6, r); };

/* ---------- 풍선 (press-and-hold: state = 부풀기) ---------- */
/** 매듭이 (0,0)에 오는 풍선 실루엣. 위가 넓고 매듭 쪽이 좁다 */
const balloonBody = (c, rx, ry) => {
  c.moveTo(0, 0);
  c.bezierCurveTo(-rx * 0.9, -ry * 0.35, -rx * 1.15, -ry * 1.55, 0, -ry * 1.65);
  c.bezierCurveTo(rx * 1.15, -ry * 1.55, rx * 0.9, -ry * 0.35, 0, 0);
};
const knot = (c, k) => { c.moveTo(0, 0); c.lineTo(-3 * k, 5 * k); c.lineTo(3.4 * k, 4.6 * k); c.closePath(); };
reg("balloon", "풍선", ["press-and-hold"], ILLO.orange, 84, {
  A: V("달걀형, 살짝 기운 풍선과 가는 끈", (g, x, y, h, o) => {
    const s = h / 84, k = 0.5 + 0.5 * o.state, sw = Math.sin(o.t * 1.6) * 3 * s;
    g.save(); g.translate(x, y);
    curve(g, [0, 0, 9 * s + sw, -22 * s, sw * 0.6, -38 * s]);
    g.translate(sw * 0.6, -38 * s); g.rotate(-0.14 + sw * 0.01);
    shape(g, c => knot(c, s * k), { fill: o.color });
    shape(g, c => balloonBody(c, 17 * s * k, 26 * s * k), { fill: o.color });
    g.restore();
  }),
  B: V("길쭉한 풍선, 끈이 곧게 내려옴", (g, x, y, h, o) => {
    const s = h / 84, k = 0.5 + 0.5 * o.state, sw = Math.sin(o.t * 1.3) * 2 * s;
    g.save(); g.translate(x, y);
    line(g, [[0, 0], [2 * s + sw, -14 * s], [sw * 0.8, -30 * s]]);
    g.translate(sw * 0.8, -30 * s); g.rotate(0.2);
    shape(g, c => knot(c, s * k), { fill: o.color });
    shape(g, c => balloonBody(c, 12 * s * k, 31 * s * k), { fill: o.color });
    g.restore();
  }),
  C: V("납작하고 넓은 풍선, 옆으로 눕고 끈이 늘어짐", (g, x, y, h, o) => {
    const s = h / 84, k = 0.5 + 0.5 * o.state, sw = Math.sin(o.t * 1.1) * 4 * s;
    g.save(); g.translate(x, y);
    curve(g, [0, 0, -14 * s, -10 * s, -6 * s + sw * 0.4, -24 * s]);
    curve(g, [-6 * s + sw * 0.4, -24 * s, 4 * s + sw, -32 * s, 10 * s + sw * 0.5, -40 * s]);
    g.translate(10 * s + sw * 0.5, -40 * s); g.rotate(0.55);
    shape(g, c => knot(c, s * k), { fill: o.color });
    shape(g, c => balloonBody(c, 23 * s * k, 17 * s * k), { fill: o.color });
    g.restore();
  })
});

/* ---------- 요술램프 (rub: state = 열, 색이 강조색 쪽으로) ---------- */
reg("lamp", "요술램프", ["rub"], TONE[4], 84, {
  A: V("낮고 넓은 주전자형, 긴 주둥이", (g, x, y, h, o) => {
    const s = h / 84, col = mix(o.color, o.accent, o.state);
    g.save(); g.translate(x, y);
    ellipse(g, 0, -1 * s, 22 * s, 3 * s, { fill: TONE[3] });
    tube(g, [[-22 * s, -18 * s], [-36 * s, -30 * s], [-42 * s, -38 * s]], { color: col, w: 6 * s });
    shape(g, c => { c.moveTo(-20 * s, -2 * s); c.bezierCurveTo(-36 * s, -6 * s, -34 * s, -30 * s, -4 * s, -31 * s); c.bezierCurveTo(28 * s, -31 * s, 30 * s, -8 * s, 18 * s, -2 * s); c.closePath(); }, { fill: col });
    ellipse(g, -4 * s, -31 * s, 9 * s, 3 * s, { fill: col });
    dot(g, -4 * s, -35 * s, 2.2 * s);
    curve(g, [16 * s, -27 * s, 34 * s, -22 * s, 22 * s, -8 * s]);
    g.restore();
  }),
  B: V("키 큰 병 모양, 받침이 있고 주둥이가 위로 솟음", (g, x, y, h, o) => {
    const s = h / 84, col = mix(o.color, o.accent, o.state);
    g.save(); g.translate(x, y);
    ellipse(g, 1 * s, -2 * s, 13 * s, 3.5 * s, { fill: col });
    tube(g, [[-12 * s, -32 * s], [-24 * s, -46 * s], [-30 * s, -58 * s]], { color: col, w: 4.5 * s });
    shape(g, c => { c.moveTo(-8 * s, -4 * s); c.bezierCurveTo(-26 * s, -12 * s, -24 * s, -42 * s, 0, -46 * s); c.bezierCurveTo(24 * s, -42 * s, 26 * s, -12 * s, 8 * s, -4 * s); c.closePath(); }, { fill: col });
    ellipse(g, 0, -46 * s, 6 * s, 2.2 * s, { fill: col });
    dot(g, 0, -50 * s, 1.8 * s);
    curve(g, [14 * s, -38 * s, 30 * s, -30 * s, 16 * s, -14 * s]);
    g.restore();
  }),
  C: V("접시 위 둥근 항아리형, 짧은 주둥이", (g, x, y, h, o) => {
    const s = h / 84, col = mix(o.color, o.accent, o.state);
    g.save(); g.translate(x, y);
    ellipse(g, 2 * s, -2 * s, 30 * s, 5 * s, { fill: TONE[1] });
    tube(g, [[-16 * s, -18 * s], [-30 * s, -28 * s]], { color: col, w: 7 * s });
    ellipse(g, 0, -17 * s, 20 * s, 14 * s, { fill: col }, 0.06);
    ellipse(g, 1 * s, -30 * s, 8 * s, 2.6 * s, { fill: col });
    curve(g, [-4 * s, -31 * s, 1 * s, -40 * s, 7 * s, -31 * s]);
    curve(g, [17 * s, -24 * s, 30 * s, -20 * s, 20 * s, -9 * s]);
    g.restore();
  })
});

/* ---------- 지니 / 연기 기둥 (rub: state = 나타남) ---------- */
reg("genie", "지니(연기 기둥)", ["rub"], TONE[4], 84, {
  A: V("위로 갈수록 넓어지는 연기 기둥, 점 두 개", (g, x, y, h, o) => {
    const s = h / 84, e = 0.35 + 0.65 * o.state, n = 6;
    g.save(); g.translate(x, y);
    tube(g, [[0, 0], [1 * s, -8 * s * e]], { color: o.color, w: 3 * s });
    for (let i = 0; i < n; i++) {
      const f = i / (n - 1), yy = -(8 + f * 56) * s * e, wob = Math.sin(o.t * 2 + i * 1.3) * 2 * s * e;
      ellipse(g, wob, yy, (5 + f * 15) * s * e, (5 + f * 6) * s * e, { fill: o.color });
    }
    twoDots(g, Math.sin(o.t * 2 + 6.5) * 2 * s * e, -60 * s * e, 5 * s * e, 1.6 * s * e);
    g.restore();
  }),
  B: V("옆으로 휘어 오르는 연기, 머리는 끝에", (g, x, y, h, o) => {
    const s = h / 84, e = 0.35 + 0.65 * o.state, n = 7;
    g.save(); g.translate(x, y);
    for (let i = 0; i < n; i++) {
      const f = i / (n - 1), yy = -(4 + f * 60) * s * e, xx = Math.sin(f * 2.4) * 18 * s * e + Math.sin(o.t * 1.7 + i) * 1.5 * s * e;
      ellipse(g, xx, yy, (4 + f * 12) * s * e, (3 + f * 7) * s * e, { fill: o.color }, -0.3 * f);
    }
    twoDots(g, Math.sin(2.4) * 18 * s * e, -64 * s * e, 4 * s * e, 1.5 * s * e);
    g.restore();
  }),
  C: V("가는 꼬리 위에 뭉게진 상체 덩어리", (g, x, y, h, o) => {
    const s = h / 84, e = 0.35 + 0.65 * o.state, wob = Math.sin(o.t * 1.5) * 2 * s * e;
    g.save(); g.translate(x, y);
    tube(g, [[0, 0], [-4 * s * e, -14 * s * e], [-6 * s * e + wob, -30 * s * e]], { color: o.color, w: 4 * s });
    ellipse(g, -4 * s * e + wob, -36 * s * e, 10 * s * e, 8 * s * e, { fill: o.color });
    circle(g, -14 * s * e + wob, -46 * s * e, 12 * s * e, { fill: o.color });
    circle(g, 8 * s * e + wob, -48 * s * e, 13 * s * e, { fill: o.color });
    circle(g, -2 * s * e + wob, -58 * s * e, 15 * s * e, { fill: o.color });
    twoDots(g, -2 * s * e + wob, -60 * s * e, 4.5 * s * e, 1.6 * s * e);
    g.restore();
  })
});

/* ---------- 창문 (rub) ---------- */
reg("window", "창문", ["rub"], TONE[4], 84, {
  A: V("두 짝 여닫이창, 톤 유리 + 가는 틀 + 창턱", (g, x, y, h, o) => {
    const s = h / 84;
    g.save(); g.translate(x, y);
    roundRect(g, -26 * s, -66 * s, 52 * s, 60 * s, 1 * s, { fill: TONE[1] });
    line(g, [[-26 * s, -66 * s], [26 * s, -66 * s], [26 * s, -6 * s], [-26 * s, -6 * s], [-26 * s, -66 * s]]);
    line(g, [[-3 * s, -66 * s], [-3 * s, -6 * s]]);
    line(g, [[-26 * s, -40 * s], [26 * s, -40 * s]], { lw: LINE * 0.8 });
    roundRect(g, -31 * s, -6 * s, 62 * s, 6 * s, 1.5 * s, { fill: o.color });
    g.restore();
  }),
  B: V("아치형 창, 가로대 하나", (g, x, y, h, o) => {
    const s = h / 84, r = 21 * s;
    const p = c => { c.moveTo(-r, -6 * s); c.lineTo(-r, -46 * s); c.arc(0, -46 * s, r, PI, 0); c.lineTo(r, -6 * s); c.closePath(); };
    g.save(); g.translate(x, y);
    shape(g, p, { fill: TONE[1] });
    shape(g, p, { fill: null, lw: LINE });
    line(g, [[-r, -36 * s], [r, -36 * s]]);
    line(g, [[1 * s, -67 * s], [1 * s, -6 * s]], { lw: LINE * 0.8 });
    roundRect(g, -26 * s, -6 * s, 52 * s, 6 * s, 1.5 * s, { fill: o.color });
    g.restore();
  }),
  C: V("둥근 선창(현창), 두꺼운 톤 테와 가는 잉크 링", (g, x, y, h, o) => {
    const s = h / 84;
    g.save(); g.translate(x, y);
    circle(g, 0, -34 * s, 32 * s, { fill: o.color });
    circle(g, 0, -34 * s, 25 * s, { fill: TONE[1] });
    circle(g, 0, -34 * s, 25 * s, { fill: null, lw: LINE });
    line(g, [[-25 * s, -30 * s], [25 * s, -30 * s]], { lw: LINE * 0.8 });
    [-1.1, 0.4, 2.3, 3.9].forEach(a => dot(g, Math.cos(a) * 29 * s, -34 * s + Math.sin(a) * 29 * s, 1.4 * s));
    g.restore();
  })
});

/* ---------- 과녁 (auto-fire, single-shot: state = 맞은 번쩍임) ---------- */
/** 동심 링. 가운데는 맞았을 때만 강조색 */
function rings(g, cx, cy, r, sy, o) {
  [[1, o.color], [0.68, TONE[1]], [0.4, o.color], [0.16, o.state > 0 ? o.accent : TONE[1]]].forEach(([k, f]) => ellipse(g, cx, cy, r * k, r * k * sy, { fill: f }));
}
reg("target", "과녁", ["auto-fire", "single-shot"], TONE[4], 84, {
  A: V("가는 잉크 다리 위에 세운 둥근 과녁판", (g, x, y, h, o) => {
    const s = h / 84;
    g.save(); g.translate(x, y);
    line(g, [[-17 * s, 0], [-4 * s, -30 * s]], { lw: LINE + 0.5 });
    line(g, [[19 * s, 0], [4 * s, -30 * s]], { lw: LINE + 0.5 });
    line(g, [[-1 * s, 0], [0, -26 * s]], { lw: LINE * 0.8 });
    rings(g, 1 * s, -50 * s, 30 * s, 1, o);
    g.restore();
  }),
  B: V("끈에 매달려 흔들리는 과녁", (g, x, y, h, o) => {
    const s = h / 84, sw = Math.sin(o.t * 1.4) * 0.06;
    g.save(); g.translate(x, y - 84 * s); g.rotate(sw);
    line(g, [[0, 0], [0, 30 * s]]);
    rings(g, 0, 56 * s, 26 * s, 1, o);
    g.restore();
  }),
  C: V("기둥 위에 비스듬히 놓인 타원 과녁", (g, x, y, h, o) => {
    const s = h / 84;
    g.save(); g.translate(x, y);
    roundRect(g, -3 * s, -44 * s, 7 * s, 44 * s, 2 * s, { fill: o.color });
    g.translate(2 * s, -56 * s); g.rotate(0.1);
    rings(g, 0, 0, 34 * s, 0.72, o);
    g.restore();
  })
});

/* ---------- 발사대 (auto-fire, single-shot: 위를 향해 그린다, 각도는 밖에서) ---------- */
reg("turret", "발사대", ["auto-fire", "single-shot"], TONE[4], 84, {
  A: V("반구 베이스 + 곧은 원통 포신", (g, x, y, h, o) => {
    const s = h / 84;
    g.save(); g.translate(x, y);
    roundRect(g, -5 * s, -58 * s, 10 * s, 42 * s, 3 * s, { fill: o.color });
    shape(g, c => { c.arc(0, 0, 23 * s, PI, 0); c.closePath(); }, { fill: o.color });
    dot(g, 0, -18 * s, 2 * s);
    g.restore();
  }),
  B: V("가는 삼각대 위 짧고 굵은 포신", (g, x, y, h, o) => {
    const s = h / 84;
    g.save(); g.translate(x, y);
    line(g, [[-19 * s, 0], [0, -28 * s]], { lw: LINE + 0.5 });
    line(g, [[17 * s, 0], [0, -28 * s]], { lw: LINE + 0.5 });
    line(g, [[3 * s, 0], [0, -28 * s]], { lw: LINE * 0.8 });
    circle(g, 0, -28 * s, 8 * s, { fill: o.color });
    roundRect(g, -7 * s, -66 * s, 14 * s, 36 * s, 4 * s, { fill: o.color });
    g.restore();
  }),
  C: V("상자 베이스 + 길고 가는 포신, 추 달림", (g, x, y, h, o) => {
    const s = h / 84;
    g.save(); g.translate(x, y);
    roundRect(g, -21 * s, -18 * s, 42 * s, 18 * s, 3 * s, { fill: o.color });
    g.save(); g.translate(0, -18 * s); g.rotate(0.12);
    roundRect(g, -3 * s, -54 * s, 6 * s, 54 * s, 3 * s, { fill: o.color });
    circle(g, 0, 4 * s, 7 * s, { fill: TONE[5] });
    g.restore(); g.restore();
  })
});

/* ---------- 깃발 (click-to-target: state = 물결 위상) ---------- */
reg("flag", "깃발", ["click-to-target"], ILLO.red, 84, {
  A: V("가는 깃대에 삼각 깃발", (g, x, y, h, o) => {
    const s = h / 84, w = o.state * TAU + o.t * 3;
    g.save(); g.translate(x, y);
    line(g, [[0, 0], [0, -80 * s]], { lw: LINE + 0.5 });
    shape(g, c => { c.moveTo(0, -80 * s); c.quadraticCurveTo(18 * s, -76 * s + Math.sin(w) * 3 * s, 36 * s, -70 * s + Math.sin(w + 1) * 2 * s); c.lineTo(0, -57 * s); c.closePath(); }, { fill: o.color });
    g.restore();
  }),
  B: V("사각 깃발, 끝단이 물결침", (g, x, y, h, o) => {
    const s = h / 84, w = o.state * TAU + o.t * 3, a = Math.sin(w) * 3 * s, b = Math.sin(w + 1.4) * 3 * s;
    g.save(); g.translate(x, y);
    line(g, [[0, 0], [0, -82 * s]], { lw: LINE + 0.5 });
    shape(g, c => { c.moveTo(0, -82 * s); c.quadraticCurveTo(15 * s, -82 * s + a, 30 * s, -80 * s + b); c.bezierCurveTo(26 * s, -74 * s + a, 34 * s, -66 * s - b, 29 * s, -58 * s + a); c.quadraticCurveTo(15 * s, -60 * s - a, 0, -60 * s); c.closePath(); }, { fill: o.color });
    g.restore();
  }),
  C: V("가로대에 늘어뜨린 세로 현수막", (g, x, y, h, o) => {
    const s = h / 84, w = o.state * TAU + o.t * 2.5, a = Math.sin(w) * 3 * s;
    g.save(); g.translate(x, y);
    line(g, [[0, 0], [0, -82 * s]], { lw: LINE + 0.5 });
    line(g, [[-3 * s, -78 * s], [28 * s, -79 * s]]);
    shape(g, c => { c.moveTo(3 * s, -78 * s); c.lineTo(25 * s, -78 * s); c.lineTo(26 * s + a, -40 * s); c.lineTo(15 * s + a * 0.5, -46 * s); c.lineTo(3 * s + a * 0.3, -42 * s); c.closePath(); }, { fill: o.color });
    g.restore();
  })
});

/* ---------- 주사위 (randomizer) ---------- */
const pips = (g, cx, cy, r, which) => which.forEach(([px, py]) => dot(g, cx + px * r, cy + py * r, r * 0.18));
const P3 = [[-0.5, -0.5], [0, 0], [0.5, 0.5]], P2 = [[-0.45, -0.45], [0.45, 0.45]], P1 = [[0, 0]], P4 = [[-0.45, -0.45], [0.45, -0.45], [-0.45, 0.45], [0.45, 0.45]], P5 = [...P4, [0, 0]];
reg("dice", "주사위", ["randomizer"], TONE[1], 84, {
  A: V("정면 한 면, 살짝 돌아간 3", (g, x, y, h, o) => {
    const s = h / 84;
    g.save(); g.translate(x, y); g.rotate(-0.1);
    roundRect(g, -17 * s, -34 * s, 34 * s, 34 * s, 6 * s, { fill: o.color });
    pips(g, 0, -17 * s, 16 * s, P3);
    g.restore();
  }),
  B: V("세 면이 보이는 입체, 윗면 밝고 옆면 어두움", (g, x, y, h, o) => {
    const s = h / 84, a = 26 * s, dx = 12 * s, dy = 8 * s;
    g.save(); g.translate(x, y);
    shape(g, c => { c.moveTo(-18 * s, -a); c.lineTo(-18 * s + dx, -a - dy); c.lineTo(8 * s + dx, -a - dy); c.lineTo(8 * s, -a); c.closePath(); }, { fill: TONE[0] });
    shape(g, c => { c.moveTo(8 * s, -a); c.lineTo(8 * s + dx, -a - dy); c.lineTo(8 * s + dx, -dy); c.lineTo(8 * s, 0); c.closePath(); }, { fill: TONE[3] });
    roundRect(g, -18 * s, -a, a, a, 2 * s, { fill: o.color });
    pips(g, -5 * s, -13 * s, 14 * s, P2);
    pips(g, 14 * s, -17 * s, 10 * s, P1);
    [[-7, -28.5], [1, -30], [9, -31.5]].forEach(([px, py]) => dot(g, px * s, py * s, 1.8 * s));
    g.restore();
  }),
  C: V("작은 주사위 두 개, 하나는 기울어짐", (g, x, y, h, o) => {
    const s = h / 84;
    g.save(); g.translate(x, y);
    g.save(); g.translate(-15 * s, -11 * s); g.rotate(0.18);
    roundRect(g, -11 * s, -11 * s, 22 * s, 22 * s, 4 * s, { fill: o.color });
    pips(g, 0, 0, 10 * s, P4);
    g.restore();
    g.save(); g.translate(13 * s, -13 * s); g.rotate(-0.06);
    roundRect(g, -13 * s, -13 * s, 26 * s, 26 * s, 4 * s, { fill: o.color });
    pips(g, 0, 0, 12 * s, P5);
    g.restore(); g.restore();
  })
});

/* ---------- 가챠 캡슐 (randomizer: 색 + 종이톤의 두 색) ---------- */
reg("capsule", "가챠 캡슐", ["randomizer"], ILLO.orange, 84, {
  A: V("둥근 캡슐, 이음선이 비스듬함", (g, x, y, h, o) => {
    const s = h / 84, r = 19 * s;
    g.save(); g.translate(x, y - r); g.rotate(0.28);
    shape(g, c => { c.arc(0, 0, r, PI, 0); c.closePath(); }, { fill: o.color });
    shape(g, c => { c.arc(0, 0, r, 0, PI); c.closePath(); }, { fill: TONE[1] });
    line(g, [[-r, 0], [r, 0]], { lw: LINE * 0.8 });
    g.restore();
  }),
  B: V("세워진 알약형, 세로 이음선", (g, x, y, h, o) => {
    const s = h / 84, r = 12 * s, top = -56 * s;
    g.save(); g.translate(x, y); g.rotate(0.06);
    shape(g, c => { c.moveTo(0, top); c.arc(0, top + r, r, -PI / 2, PI, true); c.lineTo(-r, -r); c.arc(0, -r, r, PI, PI / 2, true); c.closePath(); }, { fill: o.color });
    shape(g, c => { c.moveTo(0, top); c.arc(0, top + r, r, -PI / 2, 0); c.lineTo(r, -r); c.arc(0, -r, r, 0, PI / 2); c.closePath(); }, { fill: TONE[1] });
    line(g, [[0, top], [0, 0]], { lw: LINE * 0.8 });
    g.restore();
  }),
  C: V("열린 캡슐: 바닥 그릇 + 옆에 떨어진 뚜껑", (g, x, y, h, o) => {
    const s = h / 84, r = 17 * s;
    g.save(); g.translate(x, y);
    shape(g, c => { c.arc(-6 * s, -r, r, 0, PI); c.closePath(); }, { fill: TONE[1] });
    line(g, [[-6 * s - r, -r], [-6 * s + r, -r]], { lw: LINE * 0.8 });
    g.translate(22 * s, -10 * s); g.rotate(0.7);
    shape(g, c => { c.arc(0, 0, r, PI, 0); c.closePath(); }, { fill: o.color });
    g.restore();
  })
});

/* ---------- 캡슐 기계 (randomizer) ---------- */
const capsBits = (g, pts, r) => pts.forEach(([px, py], i) => circle(g, px, py, r, { fill: i % 2 ? TONE[3] : TONE[2] }));
const knob = (g, cx, cy, r) => { circle(g, cx, cy, r, { fill: null, lw: LINE }); line(g, [[cx - r * 0.7, cy - r * 0.5], [cx + r * 0.7, cy + r * 0.5]]); };
reg("gacha-machine", "캡슐 기계", ["randomizer"], TONE[4], 84, {
  A: V("종이색 둥근 돔 + 낮은 상자 몸통", (g, x, y, h, o) => {
    const s = h / 84;
    g.save(); g.translate(x, y);
    roundRect(g, -23 * s, -42 * s, 46 * s, 42 * s, 3 * s, { fill: o.color });
    shape(g, c => { c.arc(0, -42 * s, 23 * s, PI, 0); c.closePath(); }, { fill: ILLO.paper });
    capsBits(g, [[-9 * s, -49 * s], [6 * s, -47 * s], [-1 * s, -57 * s], [12 * s, -55 * s]], 5 * s);
    knob(g, 8 * s, -24 * s, 5 * s);
    roundRect(g, -18 * s, -14 * s, 15 * s, 8 * s, 2 * s, { fill: TONE[2] });
    g.restore();
  }),
  B: V("키 크고 좁은 기계, 작은 발 두 개", (g, x, y, h, o) => {
    const s = h / 84;
    g.save(); g.translate(x, y);
    roundRect(g, -13 * s, -6 * s, 6 * s, 6 * s, 1 * s, { fill: o.color });
    roundRect(g, 8 * s, -6 * s, 6 * s, 6 * s, 1 * s, { fill: o.color });
    roundRect(g, -15 * s, -58 * s, 30 * s, 52 * s, 3 * s, { fill: o.color });
    shape(g, c => { c.arc(0, -58 * s, 15 * s, PI, 0); c.closePath(); }, { fill: ILLO.paper });
    capsBits(g, [[-6 * s, -63 * s], [5 * s, -61 * s], [1 * s, -69 * s]], 3.6 * s);
    knob(g, 0, -40 * s, 4 * s);
    roundRect(g, -8 * s, -20 * s, 16 * s, 6 * s, 2 * s, { fill: TONE[2] });
    g.restore();
  }),
  C: V("네모난 유리창이 있는 기계, 아래 배출구", (g, x, y, h, o) => {
    const s = h / 84;
    g.save(); g.translate(x, y);
    roundRect(g, -24 * s, -72 * s, 48 * s, 72 * s, 5 * s, { fill: o.color });
    roundRect(g, -18 * s, -66 * s, 36 * s, 34 * s, 3 * s, { fill: ILLO.paper });
    capsBits(g, [[-11 * s, -38 * s], [1 * s, -37 * s], [12 * s, -39 * s], [-5 * s, -47 * s], [7 * s, -48 * s]], 5 * s);
    knob(g, -8 * s, -22 * s, 5 * s);
    roundRect(g, 3 * s, -16 * s, 14 * s, 9 * s, 2 * s, { fill: TONE[2] });
    g.restore();
  })
});

/* ---------- 피자 (break-apart: 위에서 본 한 판) ---------- */
const pepperoni = (g, pts, r, col) => pts.forEach(([px, py]) => circle(g, px, py, r, { fill: col }));
reg("pizza", "피자", ["break-apart"], ILLO.yellow, 84, {
  A: V("둥근 한 판, 접시 위, 여섯 조각 칼선", (g, x, y, h, o) => {
    const s = h / 84, cy = -38 * s, r = 30 * s;
    g.save(); g.translate(x, y);
    circle(g, 0, cy, r + 8 * s, { fill: TONE[1] });
    circle(g, 0, cy, r, { fill: TONE[3] });
    circle(g, 1 * s, cy + 0.5 * s, r - 5 * s, { fill: o.color });
    pepperoni(g, [[-12 * s, cy - 8 * s], [9 * s, cy - 13 * s], [14 * s, cy + 6 * s], [-4 * s, cy + 12 * s], [-16 * s, cy + 8 * s], [3 * s, cy - 1 * s]], 4 * s, o.accent);
    [0.15, 1.2, 2.25].forEach(a => line(g, [[Math.cos(a) * r, cy + Math.sin(a) * r], [-Math.cos(a) * r, cy - Math.sin(a) * r]], { lw: LINE * 0.8 }));
    g.restore();
  }),
  B: V("한 조각 빠진 판, 접시 톤이 드러남", (g, x, y, h, o) => {
    const s = h / 84, cy = -38 * s, r = 30 * s, a0 = -0.35, a1 = a0 + TAU - 1.0;
    g.save(); g.translate(x, y);
    circle(g, 0, cy, r + 8 * s, { fill: TONE[1] });
    shape(g, c => { c.moveTo(0, cy); c.arc(0, cy, r, a0, a1); c.closePath(); }, { fill: TONE[3] });
    shape(g, c => { c.moveTo(0, cy); c.arc(0, cy, r - 5 * s, a0 + 0.05, a1 - 0.05); c.closePath(); }, { fill: o.color });
    pepperoni(g, [[-13 * s, cy - 7 * s], [6 * s, cy - 14 * s], [-6 * s, cy + 11 * s], [-16 * s, cy + 7 * s], [8 * s, cy + 12 * s]], 4 * s, o.accent);
    [1.3, 2.4, 3.5].forEach(a => line(g, [[0, cy], [Math.cos(a) * r, cy + Math.sin(a) * r]], { lw: LINE * 0.8 }));
    g.restore();
  }),
  C: V("네모 팬피자, 격자 칼선", (g, x, y, h, o) => {
    const s = h / 84, cy = -36 * s;
    g.save(); g.translate(x, y); g.rotate(-0.05);
    roundRect(g, -36 * s, cy - 32 * s, 72 * s, 64 * s, 4 * s, { fill: TONE[1] });
    roundRect(g, -29 * s, cy - 25 * s, 58 * s, 50 * s, 4 * s, { fill: TONE[3] });
    roundRect(g, -25 * s, cy - 21 * s, 51 * s, 43 * s, 3 * s, { fill: o.color });
    pepperoni(g, [[-14 * s, cy - 10 * s], [8 * s, cy - 12 * s], [16 * s, cy + 6 * s], [-6 * s, cy + 9 * s], [2 * s, cy - 1 * s]], 4 * s, o.accent);
    [-10, 10].forEach(k => line(g, [[k * s, cy - 25 * s], [k * s, cy + 25 * s]], { lw: LINE * 0.8 }));
    line(g, [[-29 * s, cy + 1 * s], [29 * s, cy]], { lw: LINE * 0.8 });
    g.restore();
  })
});

/* ---------- 초콜릿 바 (break-apart: 위에서 본 판, 홈은 가는 잉크) ---------- */
reg("chocolate", "초콜릿", ["break-apart"], TONE[4], 84, {
  A: V("4×2 판, 한 귀퉁이 베어 물림", (g, x, y, h, o) => {
    const s = h / 84;
    g.save(); g.translate(x, y - 20 * s); g.rotate(-0.08);
    shape(g, c => { c.roundRect(-32 * s, -16 * s, 64 * s, 32 * s, 3 * s); c.moveTo(32 * s + 6 * s, -16 * s); c.arc(32 * s, -16 * s, 9 * s, 0, TAU, true); }, { fill: o.color });
    [-16, 0, 16].forEach(k => line(g, [[k * s, -16 * s], [k * s, 16 * s]], { lw: LINE * 0.8 }));
    line(g, [[-32 * s, 0], [24 * s, 0]], { lw: LINE * 0.8 });
    g.restore();
  }),
  B: V("세로로 긴 바, 포장지가 반쯤 벗겨짐", (g, x, y, h, o) => {
    const s = h / 84;
    g.save(); g.translate(x, y);
    roundRect(g, -15 * s, -66 * s, 30 * s, 66 * s, 2 * s, { fill: o.color });
    [-50, -34, -18].forEach(k => line(g, [[-15 * s, k * s], [15 * s, k * s]], { lw: LINE * 0.8 }));
    line(g, [[0, -66 * s], [0, -10 * s]], { lw: LINE * 0.8 });
    shape(g, c => { c.moveTo(-19 * s, -30 * s); c.lineTo(-8 * s, -34 * s); c.lineTo(2 * s, -28 * s); c.lineTo(12 * s, -36 * s); c.lineTo(19 * s, -31 * s); c.lineTo(19 * s, 0); c.lineTo(-19 * s, 0); c.closePath(); }, { fill: TONE[1] });
    g.restore();
  }),
  C: V("도톰한 2×3 판, 굵은 칸", (g, x, y, h, o) => {
    const s = h / 84;
    g.save(); g.translate(x, y - 22 * s); g.rotate(0.06);
    roundRect(g, -25 * s, -20 * s, 50 * s, 40 * s, 6 * s, { fill: o.color });
    line(g, [[0, -20 * s], [0, 20 * s]], { lw: LINE });
    [-7, 7].forEach(k => line(g, [[-25 * s, k * s], [25 * s, k * s]], { lw: LINE }));
    g.restore();
  })
});

/* ---------- 쿠키 / 펠릿 (merge) ---------- */
reg("cookie", "쿠키", ["merge"], TONE[3], 40, {
  A: V("울퉁불퉁한 둥근 쿠키, 잉크 초코칩", (g, x, y, h, o) => {
    const s = h / 40, r = 17 * s, cy = -r;
    g.save(); g.translate(x, y);
    shape(g, c => { c.moveTo(-r, cy); c.bezierCurveTo(-r, cy - r * 1.2, r * 0.9, cy - r * 1.15, r, cy - r * 0.1); c.bezierCurveTo(r * 1.05, cy + r * 1.1, -r * 0.8, cy + r * 1.15, -r, cy); }, { fill: o.color });
    [[-7, -6], [4, -9], [8, 3], [-3, 6]].forEach(([px, py]) => dot(g, px * s, cy + py * s, 1.8 * s));
    g.restore();
  }),
  B: V("납작한 펠릿(알약꼴), 디테일 없음", (g, x, y, h, o) => {
    const s = h / 40;
    g.save(); g.translate(x, y); g.rotate(0.05);
    roundRect(g, -17 * s, -13 * s, 34 * s, 13 * s, 6.5 * s, { fill: o.color });
    g.restore();
  }),
  C: V("한입 베어 문 쿠키", (g, x, y, h, o) => {
    const s = h / 40, r = 16 * s, cy = -r;
    g.save(); g.translate(x, y);
    shape(g, c => { c.arc(0, cy, r, 0, TAU); c.moveTo(r * 0.75 + 7 * s, cy - r * 0.7); c.arc(r * 0.75, cy - r * 0.7, 7 * s, 0, TAU, true); }, { fill: o.color });
    [[-6, -4], [3, 5], [-2, 8]].forEach(([px, py]) => dot(g, px * s, cy + py * s, 1.7 * s));
    g.restore();
  })
});

/* ---------- 덩어리 생물 (merge: state = 입 벌림) ---------- */
const mouth = (g, cx, cy, s, st) => ellipse(g, cx, cy, (2.5 + st * 5) * s, (1.2 + st * 5) * s, { fill: ILLO.ink });
reg("blob", "덩어리", ["merge"], ILLO.blue, 60, {
  A: V("아래가 넓은 물방울 덩어리", (g, x, y, h, o) => {
    const s = h / 60, br = Math.sin(o.t * 2) * 1.5 * s;
    g.save(); g.translate(x, y);
    shape(g, c => { c.moveTo(-26 * s, 0); c.bezierCurveTo(-32 * s, -30 * s, -12 * s, -56 * s - br, 4 * s, -56 * s - br); c.bezierCurveTo(22 * s, -56 * s - br, 32 * s, -24 * s, 24 * s, 0); c.closePath(); }, { fill: o.color });
    twoDots(g, 1 * s, -34 * s, 7 * s, 1.8 * s);
    mouth(g, 3 * s, -20 * s, s, o.state);
    g.restore();
  }),
  B: V("납작하고 넓은 덩어리, 한쪽 혹", (g, x, y, h, o) => {
    const s = h / 60, br = Math.sin(o.t * 1.7) * 1.2 * s;
    g.save(); g.translate(x, y);
    ellipse(g, 0, -14 * s, 30 * s, 14 * s + br, { fill: o.color });
    circle(g, 12 * s, -26 * s - br, 12 * s, { fill: o.color });
    twoDots(g, 12 * s, -28 * s, 5 * s, 1.6 * s);
    mouth(g, 8 * s, -14 * s, s, o.state);
    g.restore();
  }),
  C: V("키 크고 기울어진 젤리", (g, x, y, h, o) => {
    const s = h / 60, br = Math.sin(o.t * 2.2) * 0.02;
    g.save(); g.translate(x, y); g.rotate(-0.08 + br);
    shape(g, c => c.roundRect(-14 * s, -58 * s, 30 * s, 58 * s, [15 * s, 15 * s, 6 * s, 6 * s]), { fill: o.color });
    twoDots(g, 1 * s, -42 * s, 5.5 * s, 1.7 * s);
    mouth(g, 3 * s, -30 * s, s, o.state);
    g.restore();
  })
});

/* ---------- 화분 (page-visibility) ---------- */
reg("pot", "화분", ["page-visibility"], TONE[3], 84, {
  A: V("사다리꼴 몸통 + 어두운 톤 테두리", (g, x, y, h, o) => {
    const s = h / 84;
    g.save(); g.translate(x, y);
    shape(g, c => { c.moveTo(-16 * s, 0); c.lineTo(16 * s, 0); c.lineTo(20 * s, -28 * s); c.lineTo(-19 * s, -28 * s); c.closePath(); }, { fill: o.color });
    roundRect(g, -23 * s, -36 * s, 45 * s, 9 * s, 1.5 * s, { fill: TONE[4] });
    g.restore();
  }),
  B: V("배가 부른 항아리형", (g, x, y, h, o) => {
    const s = h / 84;
    g.save(); g.translate(x, y);
    shape(g, c => { c.moveTo(-11 * s, 0); c.bezierCurveTo(-32 * s, -6 * s, -30 * s, -38 * s, -9 * s, -40 * s); c.lineTo(9 * s, -40 * s); c.bezierCurveTo(30 * s, -38 * s, 32 * s, -6 * s, 11 * s, 0); c.closePath(); }, { fill: o.color });
    ellipse(g, 0, -40 * s, 9 * s, 2.5 * s, { fill: TONE[4] });
    g.restore();
  }),
  C: V("긴 원통형 + 받침 접시", (g, x, y, h, o) => {
    const s = h / 84;
    g.save(); g.translate(x, y);
    ellipse(g, 0, -1.5 * s, 20 * s, 4 * s, { fill: TONE[4] });
    shape(g, c => c.roundRect(-12 * s, -50 * s, 24 * s, 49 * s, [2 * s, 2 * s, 5 * s, 5 * s]), { fill: o.color });
    ellipse(g, 0, -50 * s, 12 * s, 3 * s, { fill: TONE[4] });
    g.restore();
  })
});

/* ---------- 모자 (drag-and-drop) ---------- */
reg("hat", "모자", ["drag-and-drop"], TONE[5], 40, {
  A: V("중절모: 챙 타원 + 둥근 크라운, 가는 띠", (g, x, y, h, o) => {
    const s = h / 40;
    g.save(); g.translate(x, y); g.rotate(-0.05);
    ellipse(g, 0, -5 * s, 30 * s, 5.5 * s, { fill: o.color });
    shape(g, c => c.roundRect(-16 * s, -38 * s, 32 * s, 34 * s, [11 * s, 12 * s, 2 * s, 2 * s]), { fill: o.color });
    line(g, [[-16 * s, -13 * s], [16 * s, -12 * s]], { lw: LINE * 0.8, stroke: ILLO.paper });
    g.restore();
  }),
  B: V("비니: 접힌 밴드와 방울", (g, x, y, h, o) => {
    const s = h / 40;
    g.save(); g.translate(x, y);
    shape(g, c => { c.moveTo(-20 * s, -10 * s); c.bezierCurveTo(-22 * s, -32 * s, 18 * s, -36 * s, 20 * s, -10 * s); c.closePath(); }, { fill: o.color });
    roundRect(g, -21 * s, -12 * s, 42 * s, 10 * s, 3 * s, { fill: TONE[3] });
    circle(g, 4 * s, -34 * s, 4.5 * s, { fill: TONE[3] });
    g.restore();
  }),
  C: V("야구모자: 돔 + 한쪽으로 뻗은 챙", (g, x, y, h, o) => {
    const s = h / 40;
    g.save(); g.translate(x, y);
    shape(g, c => { c.moveTo(-16 * s, -4 * s); c.bezierCurveTo(-30 * s, -6 * s, -38 * s, -2 * s, -36 * s, 0); c.lineTo(-16 * s, 0); c.closePath(); }, { fill: o.color });
    shape(g, c => { c.moveTo(-16 * s, 0); c.bezierCurveTo(-18 * s, -22 * s, 0, -30 * s, 6 * s, -28 * s); c.bezierCurveTo(16 * s, -26 * s, 22 * s, -10 * s, 20 * s, 0); c.closePath(); }, { fill: o.color });
    curve(g, [2 * s, -26 * s, 6 * s, -14 * s, 4 * s, -1 * s], { lw: LINE * 0.8, stroke: ILLO.paper });
    dot(g, 5 * s, -28 * s, 1.5 * s);
    g.restore();
  })
});

/* ---------- 안경 (drag-and-drop: 가는 잉크 선만) ---------- */
reg("glasses", "안경", ["drag-and-drop"], ILLO.ink, 40, {
  A: V("동그란 안경, 코걸이 곡선과 다리", (g, x, y, h, o) => {
    const s = h / 40, cy = -12 * s, r = 10 * s;
    g.save(); g.translate(x, y); g.rotate(0.04);
    circle(g, -13 * s, cy, r, { fill: null, lw: LINE });
    circle(g, 13 * s, cy + 0.5 * s, r * 0.95, { fill: null, lw: LINE });
    curve(g, [-3 * s, cy - 1 * s, 0, cy - 5 * s, 3.5 * s, cy - 1 * s]);
    line(g, [[-23 * s, cy - 1 * s], [-34 * s, cy - 6 * s]]); line(g, [[22.5 * s, cy], [33 * s, cy - 5 * s]]);
    g.restore();
  }),
  B: V("네모난 뿔테, 살짝 둥근 모서리", (g, x, y, h, o) => {
    const s = h / 40, cy = -20 * s;
    g.save(); g.translate(x, y); g.rotate(-0.03);
    roundRect(g, -25 * s, cy, 21 * s, 16 * s, 3 * s, { fill: null, lw: LINE });
    roundRect(g, 3 * s, cy + 0.5 * s, 22 * s, 15 * s, 3 * s, { fill: null, lw: LINE });
    line(g, [[-4 * s, cy + 4 * s], [3 * s, cy + 4 * s]]);
    line(g, [[-25 * s, cy + 3 * s], [-35 * s, cy - 1 * s]]); line(g, [[25 * s, cy + 3 * s], [35 * s, cy - 1 * s]]);
    g.restore();
  }),
  C: V("반무테: 위 테 한 줄 + 아래 반원 렌즈", (g, x, y, h, o) => {
    const s = h / 40, cy = -18 * s;
    g.save(); g.translate(x, y); g.rotate(0.03);
    line(g, [[-24 * s, cy], [-3 * s, cy], [0, cy + 3 * s], [3 * s, cy], [24 * s, cy]]);
    shape(g, c => c.arc(-13.5 * s, cy, 10.5 * s, 0, PI), { fill: null, lw: LINE });
    shape(g, c => c.arc(13.5 * s, cy, 10.5 * s, 0, PI), { fill: null, lw: LINE });
    line(g, [[-24 * s, cy], [-34 * s, cy - 4 * s]]); line(g, [[24 * s, cy], [34 * s, cy - 4 * s]]);
    g.restore();
  })
});

/* ---------- 목도리 (drag-and-drop) ---------- */
const fringe = (g, pts) => pts.forEach(p => line(g, p, { lw: LINE * 0.8 }));
reg("scarf", "목도리", ["drag-and-drop"], ILLO.red, 60, {
  A: V("목에 두른 고리 + 한쪽으로 늘어진 끝", (g, x, y, h, o) => {
    const s = h / 60;
    g.save(); g.translate(x, y);
    g.save(); g.translate(6 * s, -44 * s); g.rotate(0.12);
    roundRect(g, -6 * s, 0, 12 * s, 42 * s, 3 * s, { fill: o.color });
    fringe(g, [[[-4 * s, 42 * s], [-5 * s, 48 * s]], [[0, 42 * s], [0, 49 * s]], [[4 * s, 42 * s], [5 * s, 47 * s]]]);
    g.restore();
    ellipse(g, 0, -46 * s, 22 * s, 9 * s, { fill: o.color });
    g.restore();
  }),
  B: V("바닥에 S자로 펼쳐진 긴 목도리", (g, x, y, h, o) => {
    const s = h / 60;
    g.save(); g.translate(x, y);
    tube(g, [[-34 * s, -6 * s], [-14 * s, -18 * s], [8 * s, -6 * s], [32 * s, -16 * s]], { color: o.color, w: 12 * s });
    fringe(g, [[[-38 * s, -9 * s], [-44 * s, -12 * s]], [[-38 * s, -5 * s], [-44 * s, -5 * s]], [[36 * s, -18 * s], [42 * s, -21 * s]], [[36 * s, -14 * s], [42 * s, -13 * s]]]);
    g.restore();
  }),
  C: V("두 번 감은 두툼한 뭉치, 짧은 꼬리 둘", (g, x, y, h, o) => {
    const s = h / 60;
    g.save(); g.translate(x, y);
    g.save(); g.translate(-4 * s, -20 * s); g.rotate(0.2); roundRect(g, -5 * s, 0, 10 * s, 16 * s, 2 * s, { fill: o.color }); fringe(g, [[[-3 * s, 16 * s], [-3 * s, 20 * s]], [[2 * s, 16 * s], [3 * s, 20 * s]]]); g.restore();
    g.save(); g.translate(8 * s, -20 * s); g.rotate(-0.25); roundRect(g, -5 * s, 0, 10 * s, 13 * s, 2 * s, { fill: o.color }); fringe(g, [[[-2 * s, 13 * s], [-3 * s, 17 * s]], [[3 * s, 13 * s], [3 * s, 17 * s]]]); g.restore();
    tube(g, [[-18 * s, -22 * s], [18 * s, -24 * s]], { color: o.color, w: 12 * s });
    tube(g, [[-17 * s, -34 * s], [19 * s, -33 * s]], { color: o.color, w: 12 * s });
    g.restore();
  })
});

/* ---------- 가방 (drag-and-drop) ---------- */
reg("bag", "가방", ["drag-and-drop"], TONE[4], 60, {
  A: V("토트백: 사다리꼴 몸통 + 가는 잉크 손잡이 두 줄", (g, x, y, h, o) => {
    const s = h / 60;
    g.save(); g.translate(x, y);
    curve(g, [-11 * s, -38 * s, -5 * s, -60 * s, 7 * s, -38 * s]);
    curve(g, [-9 * s, -38 * s, -1 * s, -57 * s, 9 * s, -38 * s]);
    shape(g, c => { c.moveTo(-23 * s, 0); c.lineTo(23 * s, 0); c.lineTo(19 * s, -38 * s); c.lineTo(-18 * s, -38 * s); c.closePath(); }, { fill: o.color });
    g.restore();
  }),
  B: V("배낭: 둥근 몸통 + 톤 주머니 + 위 고리", (g, x, y, h, o) => {
    const s = h / 60;
    g.save(); g.translate(x, y);
    curve(g, [-6 * s, -56 * s, 1 * s, -66 * s, 8 * s, -56 * s]);
    shape(g, c => c.roundRect(-18 * s, -56 * s, 36 * s, 56 * s, [14 * s, 15 * s, 6 * s, 6 * s]), { fill: o.color });
    roundRect(g, -12 * s, -24 * s, 25 * s, 19 * s, 4 * s, { fill: TONE[2] });
    g.restore();
  }),
  C: V("크로스백: 작은 몸통 + 어두운 덮개 + 긴 끈", (g, x, y, h, o) => {
    const s = h / 60;
    g.save(); g.translate(x, y);
    curve(g, [-13 * s, -22 * s, 2 * s, -66 * s, 14 * s, -22 * s]);
    roundRect(g, -16 * s, -24 * s, 32 * s, 24 * s, 4 * s, { fill: o.color });
    shape(g, c => c.roundRect(-16 * s, -26 * s, 32 * s, 13 * s, [4 * s, 4 * s, 6 * s, 6 * s]), { fill: TONE[5] });
    g.restore();
  })
});

/* ---------- 번개 (cooldown 아이콘: 가늘고 날렵한 볼트) ---------- */
reg("lightning", "번개", ["cooldown"], ILLO.yellow, 60, {
  A: V("한 번 꺾인 가는 볼트, 아래로 갈수록 뾰족", (g, x, y, h, o) => {
    const s = h / 60;
    g.save(); g.translate(x, y);
    shape(g, c => { c.moveTo(7 * s, -60 * s); c.lineTo(-5 * s, -30 * s); c.lineTo(0, -30 * s); c.lineTo(-8 * s, 0); c.lineTo(4 * s, -33 * s); c.lineTo(-0.5 * s, -33 * s); c.lineTo(12 * s, -60 * s); c.closePath(); }, { fill: o.color });
    g.restore();
  }),
  B: V("곡선으로 흐르는 리본형 볼트", (g, x, y, h, o) => {
    const s = h / 60;
    g.save(); g.translate(x, y);
    shape(g, c => { c.moveTo(6 * s, -60 * s); c.bezierCurveTo(-12 * s, -40 * s, 12 * s, -26 * s, -5 * s, 0); c.bezierCurveTo(8 * s, -22 * s, -10 * s, -38 * s, 11 * s, -59 * s); c.closePath(); }, { fill: o.color });
    g.restore();
  }),
  C: V("가는 줄기 볼트 + 짧은 가지 하나", (g, x, y, h, o) => {
    const s = h / 60;
    g.save(); g.translate(x, y);
    tube(g, [[6 * s, -60 * s], [-2 * s, -36 * s], [3 * s, -30 * s], [-6 * s, 0]], { color: o.color, w: 3 * s });
    tube(g, [[-2 * s, -36 * s], [-13 * s, -24 * s]], { color: o.color, w: 1.6 * s });
    g.restore();
  })
});

/* ---------- 재료 4종 (crafting: 작게) ---------- */
reg("element-water", "물", ["crafting"], ILLO.blue, 40, {
  A: V("살짝 기운 물방울 한 방울", (g, x, y, h, o) => {
    const s = h / 40;
    g.save(); g.translate(x, y);
    shape(g, c => { c.moveTo(2 * s, -36 * s); c.bezierCurveTo(12 * s, -22 * s, 14 * s, -3 * s, 0, 0); c.bezierCurveTo(-14 * s, -3 * s, -10 * s, -20 * s, 2 * s, -36 * s); c.closePath(); }, { fill: o.color });
    g.restore();
  }),
  B: V("세 줄 물결, 위로 갈수록 짧게", (g, x, y, h, o) => {
    const s = h / 40;
    g.save(); g.translate(x, y);
    [[-8, 18], [-18, 14], [-28, 10]].forEach(([yy, w], i) => {
      const pts = []; for (let k = 0; k <= 8; k++) { const f = k / 8; pts.push([(-w + f * 2 * w) * s + i * 2 * s, yy * s + Math.sin(f * TAU + i) * 2 * s]); }
      tube(g, pts, { color: o.color, w: 4.5 * s });
    });
    g.restore();
  }),
  C: V("웅덩이 타원 + 가는 파문 링", (g, x, y, h, o) => {
    const s = h / 40;
    g.save(); g.translate(x, y);
    ellipse(g, 0, -5 * s, 22 * s, 7 * s, { fill: o.color });
    ellipse(g, 5 * s, -6.5 * s, 8 * s, 2.6 * s, { fill: null, lw: LINE * 0.8 });
    g.restore();
  })
});
reg("element-fire", "불", ["crafting"], ILLO.red, 40, {
  A: V("한쪽으로 기운 불꽃 한 줄기", (g, x, y, h, o) => {
    const s = h / 40, f = Math.sin(o.t * 6) * 1.5 * s;
    g.save(); g.translate(x, y);
    shape(g, c => { c.moveTo(-12 * s, 0); c.bezierCurveTo(-18 * s, -14 * s, -4 * s, -18 * s, 5 * s + f, -38 * s); c.bezierCurveTo(4 * s, -22 * s, 18 * s, -16 * s, 11 * s, 0); c.closePath(); }, { fill: o.color });
    g.restore();
  }),
  B: V("큰 불꽃 + 작은 곁불꽃 두 갈래", (g, x, y, h, o) => {
    const s = h / 40, f = Math.sin(o.t * 5) * 1.5 * s;
    g.save(); g.translate(x, y);
    shape(g, c => { c.moveTo(-10 * s, 0); c.bezierCurveTo(-16 * s, -12 * s, -6 * s, -18 * s, -2 * s - f, -34 * s); c.bezierCurveTo(0, -20 * s, 12 * s, -14 * s, 8 * s, 0); c.closePath(); }, { fill: o.color });
    shape(g, c => { c.moveTo(6 * s, 0); c.bezierCurveTo(6 * s, -8 * s, 12 * s, -10 * s, 15 * s + f, -20 * s); c.bezierCurveTo(16 * s, -10 * s, 20 * s, -6 * s, 17 * s, 0); c.closePath(); }, { fill: o.color });
    g.restore();
  }),
  C: V("장작 두 개 위의 낮은 잔불", (g, x, y, h, o) => {
    const s = h / 40, f = Math.sin(o.t * 6) * 1.2 * s;
    g.save(); g.translate(x, y);
    shape(g, c => { c.moveTo(-8 * s, -4 * s); c.bezierCurveTo(-12 * s, -14 * s, -2 * s, -16 * s, 3 * s + f, -26 * s); c.bezierCurveTo(4 * s, -14 * s, 12 * s, -12 * s, 8 * s, -4 * s); c.closePath(); }, { fill: o.color });
    tube(g, [[-17 * s, -2 * s], [15 * s, -5 * s]], { color: TONE[4], w: 5 * s });
    tube(g, [[-14 * s, -6 * s], [16 * s, -1 * s]], { color: TONE[4], w: 4.5 * s });
    g.restore();
  })
});
reg("element-earth", "흙", ["crafting"], TONE[4], 40, {
  A: V("각진 돌멩이 하나", (g, x, y, h, o) => {
    const s = h / 40;
    g.save(); g.translate(x, y);
    shape(g, c => { c.moveTo(-16 * s, 0); c.lineTo(-19 * s, -10 * s); c.lineTo(-8 * s, -23 * s); c.lineTo(9 * s, -25 * s); c.lineTo(19 * s, -12 * s); c.lineTo(14 * s, 0); c.closePath(); }, { fill: o.color });
    g.restore();
  }),
  B: V("흙무더기 + 작은 자갈 하나", (g, x, y, h, o) => {
    const s = h / 40;
    g.save(); g.translate(x, y);
    shape(g, c => { c.moveTo(-25 * s, 0); c.quadraticCurveTo(-10 * s, -27 * s, 4 * s, -22 * s); c.quadraticCurveTo(17 * s, -19 * s, 24 * s, 0); c.closePath(); }, { fill: o.color });
    ellipse(g, 9 * s, -5 * s, 4 * s, 3 * s, { fill: TONE[2] }, 0.3);
    g.restore();
  }),
  C: V("납작한 돌 세 개 쌓기, 어긋나게", (g, x, y, h, o) => {
    const s = h / 40;
    g.save(); g.translate(x, y);
    ellipse(g, 0, -6 * s, 17 * s, 6 * s, { fill: o.color });
    ellipse(g, 3 * s, -16 * s, 12 * s, 5 * s, { fill: o.color }, 0.06);
    ellipse(g, -1 * s, -24 * s, 8 * s, 4 * s, { fill: o.color }, -0.1);
    g.restore();
  })
});
reg("element-wind", "바람", ["crafting"], TONE[3], 40, {
  A: V("소용돌이 한 줄", (g, x, y, h, o) => {
    const s = h / 40, pts = [];
    for (let k = 0; k <= 30; k++) { const a = k / 30 * PI * 2.6, r = (2 + k * 0.5) * s; pts.push([Math.cos(a) * r, -18 * s + Math.sin(a) * r * 0.8]); }
    pts.push([22 * s, -4 * s]);
    g.save(); g.translate(x, y);
    tube(g, pts, { color: o.color, w: 3 * s });
    g.restore();
  }),
  B: V("길이가 다른 흐름 세 줄", (g, x, y, h, o) => {
    const s = h / 40, ph = o.t * 2;
    g.save(); g.translate(x, y);
    [[-26, 6, -8], [-18, -2, -18], [-10, 16, -28]].forEach(([w0, w1, yy], i) => {
      const pts = []; for (let k = 0; k <= 8; k++) { const f = k / 8; pts.push([(w0 + f * (w1 - w0)) * s, yy * s + Math.sin(f * 4 + ph + i) * 2.5 * s]); }
      tube(g, pts, { color: o.color, w: 2.6 * s });
    });
    g.restore();
  }),
  C: V("날리는 잎 두 장 + 흐름 한 줄", (g, x, y, h, o) => {
    const s = h / 40, ph = o.t * 2;
    g.save(); g.translate(x, y);
    const pts = []; for (let k = 0; k <= 10; k++) { const f = k / 10; pts.push([(-24 + f * 40) * s, (-10 - f * 14) * s + Math.sin(f * 5 + ph) * 2 * s]); }
    tube(g, pts, { color: o.color, w: 2 * s });
    ellipse(g, -8 * s, -22 * s, 6 * s, 3 * s, { fill: o.color }, -0.6 + Math.sin(ph) * 0.2);
    ellipse(g, 12 * s, -30 * s, 5 * s, 2.5 * s, { fill: o.color }, 0.4 + Math.cos(ph) * 0.2);
    g.restore();
  })
});

/* ---------- 사진 자리표시 (mouse-look, cursor-morph) ---------- */
reg("photo-placeholder", "사진 자리표시", ["mouse-look", "cursor-morph"], TONE[3], 60, {
  A: V("가로 사진: 톤 면 안의 산 실루엣과 작은 해", (g, x, y, h, o) => {
    const s = h / 60;
    g.save(); g.translate(x, y);
    roundRect(g, -36 * s, -48 * s, 72 * s, 48 * s, 2 * s, { fill: TONE[1] });
    g.save(); g.beginPath(); g.rect(-36 * s, -48 * s, 72 * s, 48 * s); g.clip();
    circle(g, 18 * s, -34 * s, 5 * s, { fill: ILLO.paper });
    shape(g, c => { c.moveTo(-40 * s, -8 * s); c.lineTo(-10 * s, -36 * s); c.lineTo(3 * s, -22 * s); c.lineTo(12 * s, -30 * s); c.lineTo(40 * s, -8 * s); c.closePath(); }, { fill: o.color });
    g.restore(); g.restore();
  }),
  B: V("세로 사진: 둥근 언덕 두 개", (g, x, y, h, o) => {
    const s = h / 60;
    g.save(); g.translate(x, y);
    roundRect(g, -24 * s, -64 * s, 48 * s, 64 * s, 2 * s, { fill: TONE[1] });
    g.save(); g.beginPath(); g.rect(-24 * s, -64 * s, 48 * s, 64 * s); g.clip();
    circle(g, -10 * s, -46 * s, 5 * s, { fill: ILLO.paper });
    ellipse(g, 12 * s, -6 * s, 26 * s, 22 * s, { fill: o.color });
    ellipse(g, -16 * s, -4 * s, 22 * s, 14 * s, { fill: o.color });
    g.restore(); g.restore();
  }),
  C: V("폴라로이드: 종이 틀이 아래로 넓고 살짝 돌아감", (g, x, y, h, o) => {
    const s = h / 60;
    g.save(); g.translate(x, y); g.rotate(0.06);
    roundRect(g, -30 * s, -60 * s, 60 * s, 60 * s, 2 * s, { fill: ILLO.paper });
    roundRect(g, -26 * s, -56 * s, 52 * s, 40 * s, 1 * s, { fill: TONE[1] });
    g.save(); g.beginPath(); g.rect(-26 * s, -56 * s, 52 * s, 40 * s); g.clip();
    circle(g, 14 * s, -44 * s, 4.5 * s, { fill: TONE[0] });
    shape(g, c => { c.moveTo(-30 * s, -16 * s); c.lineTo(-6 * s, -36 * s); c.lineTo(6 * s, -26 * s); c.lineTo(30 * s, -16 * s); c.closePath(); }, { fill: o.color });
    g.restore(); g.restore();
  })
});
