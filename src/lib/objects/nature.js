/* ============================================================
   자연 · 생물 — 새싹, 잡초, 뿌리채소, 꽃, 나무, 씨앗, 화분, 구름, 달, 동물
   기준: pull-out 의 식물 (외곽선 없는 실루엣 + 1.5px 잉크 줄기·뿌리, 한 색 + TONE)
   각 사물은 A/B/C 세 가지 실루엣 아이디어를 갖는다. (x, y)는 아래 가운데, h는 높이.
   ============================================================ */
import { registerObject } from "../objects.js";
import { ILLO, TONE, LINE, shape, circle, ellipse, line, curve, tube, dot } from "../draw.js";

const PI = Math.PI, TAU = PI * 2;
const cl = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const st = o => cl(o.state ?? 0);
const tt = o => o.t || 0;
const mix = (a, b, p) => a + (b - a) * p;
const GREEN = ILLO.green;

/* ---------- 공용 도구 ---------- */
/** 비대칭 잎 실루엣. (x, y)는 잎자루, L은 길이, ang은 방향(0 = 오른쪽, -PI/2 = 위) */
function lf(g, x, y, L, ang, color, { w = 0.42, bulge = 0.62, vein = false } = {}) {
  const W = L * w;
  g.save(); g.translate(x, y); g.rotate(ang);
  shape(g, c => {
    c.moveTo(0, 0);
    c.quadraticCurveTo(L * 0.42, -W * bulge, L, 0);
    c.quadraticCurveTo(L * 0.52, W * (1 - bulge) * 0.95, 0, 0);
  }, { fill: color });
  if (vein) line(g, [[L * 0.12, 0], [L * 0.78, 0]], { lw: LINE * 0.8 });
  g.restore();
}
/** 늘어지는 잎(화분용). 잎자루에서 dx 쪽으로 솟았다 처진다 */
function droop(g, x, y, dx, L, color) {
  g.save(); g.translate(x, y);
  shape(g, c => {
    c.moveTo(0, 0);
    c.quadraticCurveTo(dx * 0.3, -L * 1.15, dx, -L * 0.3);
    c.quadraticCurveTo(dx * 0.5, -L * 0.62, 0, 0);
  }, { fill: color });
  g.restore();
}
/** 점들을 부드럽게 잇는 덩어리 (나무 수관, 몸통) */
function blob(g, pts, fill) {
  const n = pts.length, m = i => [(pts[i][0] + pts[(i + 1) % n][0]) / 2, (pts[i][1] + pts[(i + 1) % n][1]) / 2];
  shape(g, c => {
    const p0 = m(n - 1); c.moveTo(p0[0], p0[1]);
    for (let i = 0; i < n; i++) { const q = m(i); c.quadraticCurveTo(pts[i][0], pts[i][1], q[0], q[1]); }
    c.closePath();
  }, { fill });
}
/** 원 둘레를 조금씩 흔든 덩어리 */
function lump(g, cx, cy, rx, ry, wob, fill, n = 9, seed = 0) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = i / n * TAU + seed, k = 1 + wob * Math.sin(i * 2.3 + seed * 5);
    pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
  }
  blob(g, pts, fill);
}
/** 굵은 단색 곡선(꼬리 등). 외곽선 없음 */
const thick = (g, fn, w, col) => shape(g, fn, { fill: null, stroke: col, lw: w });
/** 삼각 실루엣(귀, 부리, 꼬리깃) */
const tri = (g, a, b, c2, fill) => shape(g, c => { c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.lineTo(c2[0], c2[1]); c.closePath(); }, { fill });
/** 2차 곡선 위의 점 */
const qp = ([x0, y0, cx, cy, x1, y1], p) => [(1 - p) ** 2 * x0 + 2 * (1 - p) * p * cx + p * p * x1, (1 - p) ** 2 * y0 + 2 * (1 - p) * p * cy + p * p * y1];
/** 가는 잉크 뿌리 다발 */
function roots(g, u, L = 16) {
  line(g, [[0, 0], [-1.5 * u, L * 0.4 * u], [1 * u, L * u]], { lw: LINE + 0.3 });
  line(g, [[0, L * 0.25 * u], [5 * u, L * 0.55 * u]]);
  line(g, [[-0.5 * u, L * 0.5 * u], [-6 * u, L * 0.85 * u]]);
}
/** 앉을 가지: 가는 잉크 선 */
const twig = (g, u, yy, sl = 0.08) => line(g, [[-34 * u, yy + 34 * u * sl], [-6 * u, yy + 2 * u * sl], [32 * u, yy - 30 * u * sl]], { lw: LINE + 0.5 });

const reg = (name, label, demos, variants, extra = {}) => registerObject(name, { group: "자연 · 생물", label, demos, variants, ...extra });

/* ======================= 새싹 (state = 성장) ======================= */
reg("sprout", "새싹", ["drop-zone", "page-visibility", "squeeze"], {
  A: { label: "곧은 줄기에 떡잎 둘", draw(g, x, y, h, o) {
    const u = h / 84, gr = 0.5 + 0.5 * st(o), col = o.color || GREEN;
    g.save(); g.translate(x, y); g.rotate(Math.sin(tt(o) * 1.4) * 0.035);
    const H = 56 * u * gr, S = [0, 0, 3 * u, -H * 0.55, -1 * u, -H];
    curve(g, S, { lw: LINE + 0.3 });
    const a = qp(S, 0.62);
    lf(g, a[0], a[1], 21 * u * gr, -PI * 0.84, col, { w: 0.5, vein: true });
    lf(g, -1 * u, -H, 25 * u * gr, -PI * 0.18, col, { w: 0.5, vein: true });
    g.restore();
  } },
  B: { label: "낮고 둥근 세 잎", draw(g, x, y, h, o) {
    const u = h / 84, gr = 0.5 + 0.5 * st(o), col = o.color || GREEN;
    g.save(); g.translate(x, y); g.rotate(Math.sin(tt(o) * 1.1 + 1) * 0.03);
    const H = 32 * u * gr, S = [0, 0, -2 * u, -H * 0.5, 1 * u, -H];
    curve(g, S, { lw: LINE + 0.3 });
    const a = qp(S, 0.48), b = qp(S, 0.76);
    lf(g, a[0], a[1], 13 * u * gr, -PI * 0.97, col, { w: 0.75, bulge: 0.5 });
    lf(g, b[0], b[1], 11 * u * gr, -PI * 0.12, col, { w: 0.75, bulge: 0.5 });
    lf(g, 1 * u, -H, 15 * u * gr, -PI * 0.62, col, { w: 0.7, bulge: 0.5 });
    g.restore();
  } },
  C: { label: "기운 줄기에 큰 잎 하나", draw(g, x, y, h, o) {
    const u = h / 84, gr = 0.5 + 0.5 * st(o), col = o.color || GREEN;
    g.save(); g.translate(x, y); g.rotate(Math.sin(tt(o) * 1.3 + 2) * 0.03);
    const S = [0, 0, 5 * u, -24 * u * gr, 15 * u * gr, -44 * u * gr];
    curve(g, S, { lw: LINE + 0.3 });
    const b = qp(S, 0.55), tip = qp(S, 1);
    lf(g, b[0], b[1], 9 * u * gr, -PI * 0.9, col);
    lf(g, tip[0], tip[1], 25 * u * gr, mix(-PI * 0.45, -PI * 0.08, gr), col, { w: 0.55, vein: true });
    g.restore();
  } }
});

/* ======================= 잡초 ======================= */
reg("weed", "잡초", ["pull-out"], {
  A: { label: "가는 풀잎 다발", draw(g, x, y, h, o) {
    const u = h / 84, col = o.color || GREEN, t = tt(o);
    g.save(); g.translate(x, y);
    [[-0.74, 40], [-0.62, 30], [-0.5, 48], [-0.38, 36], [-0.26, 26]].forEach(([a, L], i) =>
      lf(g, 0, 0, L * u, a * PI + Math.sin(t * 1.2 + i) * 0.025, col, { w: 0.15, bulge: 0.55 }));
    roots(g, u, 14);
    g.restore();
  } },
  B: { label: "둥근 잎 줄기 넷", draw(g, x, y, h, o) {
    const u = h / 84, col = o.color || GREEN, t = tt(o);
    g.save(); g.translate(x, y); g.rotate(Math.sin(t * 1.2) * 0.02);
    [[-0.55, 34, 16], [-0.12, 40, 19], [0.42, 30, 15], [0.18, 20, 11]].forEach(([a, L, s]) => {
      const ex = Math.sin(a) * L * 0.62 * u, ey = -Math.cos(a) * L * u;
      line(g, [[0, 0], [Math.sin(a) * 8 * u, -L * 0.45 * u], [ex, ey]]);
      lf(g, ex, ey, s * u, a - PI / 2 - 0.15, col, { w: 0.78, bulge: 0.5, vein: true });
    });
    roots(g, u, 16);
    g.restore();
  } },
  C: { label: "옆으로 눕는 풀 + 이삭", draw(g, x, y, h, o) {
    const u = h / 84, col = o.color || GREEN, t = tt(o), sw = Math.sin(t * 1.5) * 2 * u;
    g.save(); g.translate(x, y);
    lf(g, 0, 0, 34 * u, -PI * 0.3, col, { w: 0.14 });
    lf(g, 0, 0, 24 * u, -PI * 0.55, col, { w: 0.16 });
    lf(g, 0, 0, 18 * u, -PI * 0.15, col, { w: 0.18 });
    const S = [0, 0, 6 * u, -26 * u, 18 * u + sw, -38 * u];
    curve(g, S, { lw: LINE + 0.3 });
    const tip = qp(S, 1);
    ellipse(g, tip[0] + 1 * u, tip[1] - 5 * u, 2.6 * u, 7 * u, { fill: TONE[4] }, 0.5);
    roots(g, u, 14);
    g.restore();
  } }
});

/* ======================= 당근 (state = 뽑힌 정도) ======================= */
function carrotLeaves(g, u, col, list, lean = 0) {
  list.forEach(([a, L, s]) => {
    const ex = Math.sin(a + lean) * L * u, ey = -Math.cos(a + lean) * L * u;
    line(g, [[0, 0], [ex, ey]]);
    lf(g, ex, ey, s * u, a + lean - PI / 2, col, { w: 0.5, bulge: 0.55 });
  });
}
reg("carrot", "당근", ["pull-out"], {
  A: { label: "길쭉하고 곧은", draw(g, x, y, h, o) {
    const u = h / 84, L = 44 * u, col = o.color || ILLO.orange;
    g.save(); g.translate(x, y - st(o) * L);
    carrotLeaves(g, u, GREEN, [[-0.5, 30, 18], [0.02, 36, 20], [0.45, 28, 16]]);
    shape(g, c => { c.moveTo(-9 * u, 0); c.quadraticCurveTo(-9 * u, L * 0.55, 1 * u, L); c.quadraticCurveTo(10 * u, L * 0.5, 9 * u, 0); c.closePath(); }, { fill: col });
    line(g, [[-6 * u, L * 0.3], [-2 * u, L * 0.32]], { lw: LINE * 0.8 });
    line(g, [[4 * u, L * 0.55], [1 * u, L * 0.57]], { lw: LINE * 0.8 });
    g.restore();
  } },
  B: { label: "짧고 통통한", draw(g, x, y, h, o) {
    const u = h / 84, L = 30 * u, col = o.color || ILLO.orange;
    g.save(); g.translate(x, y - st(o) * L);
    carrotLeaves(g, u, GREEN, [[-0.7, 20, 13], [-0.3, 26, 15], [0.1, 22, 14], [0.5, 24, 13], [0.8, 16, 11]]);
    shape(g, c => { c.moveTo(-13 * u, 0); c.bezierCurveTo(-14 * u, L * 0.6, -6 * u, L, 2 * u, L); c.bezierCurveTo(10 * u, L * 0.9, 14 * u, L * 0.5, 13 * u, 0); c.closePath(); }, { fill: col });
    line(g, [[-8 * u, L * 0.35], [-3 * u, L * 0.37]], { lw: LINE * 0.8 });
    g.restore();
  } },
  C: { label: "굽은 당근 · 잎은 반대로", draw(g, x, y, h, o) {
    const u = h / 84, L = 42 * u, col = o.color || ILLO.orange;
    g.save(); g.translate(x, y - st(o) * L);
    carrotLeaves(g, u, GREEN, [[-0.55, 32, 18], [-0.1, 34, 19], [0.35, 24, 15]], -0.25);
    shape(g, c => {
      c.moveTo(-9 * u, 0);
      c.bezierCurveTo(-11 * u, L * 0.45, 1 * u, L * 0.8, 9 * u, L);
      c.bezierCurveTo(12 * u, L * 0.6, 10 * u, L * 0.3, 9 * u, 0);
      c.closePath();
    }, { fill: col });
    line(g, [[-6 * u, L * 0.28], [-2 * u, L * 0.3]], { lw: LINE * 0.8 });
    line(g, [[6 * u, L * 0.6], [3 * u, L * 0.6]], { lw: LINE * 0.8 });
    g.restore();
  } }
}, { color: ILLO.orange });

/* ======================= 무 (state = 뽑힌 정도) ======================= */
reg("radish", "무", ["pull-out"], {
  A: { label: "둥근 무 · 큰 잎", draw(g, x, y, h, o) {
    const u = h / 84, L = 26 * u, col = o.color || ILLO.pink;
    g.save(); g.translate(x, y - st(o) * (L + 10 * u));
    [[-0.5, 12, 34], [0.05, 14, 40], [0.5, 11, 30]].forEach(([a, S, s]) => {
      const ex = Math.sin(a) * S * u, ey = -Math.cos(a) * S * u - 5 * u;
      line(g, [[0, -5 * u], [ex, ey]]);
      lf(g, ex, ey, s * u, a - PI / 2, GREEN, { w: 0.55, bulge: 0.55, vein: true });
    });
    shape(g, c => { c.moveTo(-9 * u, -6 * u); c.bezierCurveTo(-30 * u, -2 * u, -26 * u, L, 1 * u, L); c.bezierCurveTo(26 * u, L, 28 * u, -2 * u, 9 * u, -6 * u); c.closePath(); }, { fill: col });
    line(g, [[1 * u, L], [2 * u, L + 6 * u], [-1 * u, L + 12 * u]]);
    g.restore();
  } },
  B: { label: "긴 무 · 잎은 위로", draw(g, x, y, h, o) {
    const u = h / 84, L = 44 * u, col = o.color || ILLO.pink;
    g.save(); g.translate(x, y - st(o) * (L + 6 * u));
    [[-0.35, 14, 26], [-0.05, 16, 30], [0.25, 12, 24], [0.5, 9, 18]].forEach(([a, S, s]) => {
      const ex = Math.sin(a) * S * u, ey = -Math.cos(a) * S * u - 4 * u;
      line(g, [[0, -4 * u], [ex, ey]]);
      lf(g, ex, ey, s * u, a - PI / 2 - 0.1, GREEN, { w: 0.42, bulge: 0.55 });
    });
    shape(g, c => { c.moveTo(-10 * u, -5 * u); c.bezierCurveTo(-13 * u, L * 0.4, -10 * u, L, 1 * u, L); c.bezierCurveTo(11 * u, L, 13 * u, L * 0.4, 10 * u, -5 * u); c.closePath(); }, { fill: col });
    line(g, [[1 * u, L], [-1 * u, L + 8 * u]]);
    g.restore();
  } },
  C: { label: "작은 래디시 한 알 · 긴 뿌리", draw(g, x, y, h, o) {
    const u = h / 84, L = 15 * u, col = o.color || ILLO.pink;
    g.save(); g.translate(x, y - st(o) * (L + 18 * u));
    [[-0.45, 24, 14], [0.1, 30, 16], [0.55, 20, 12]].forEach(([a, S, s]) => {
      const ex = Math.sin(a) * S * u, ey = -Math.cos(a) * S * u - 3 * u;
      line(g, [[0, -3 * u], [Math.sin(a) * 6 * u, -S * 0.5 * u], [ex, ey]]);
      lf(g, ex, ey, s * u, a - PI / 2 + 0.2, GREEN, { w: 0.7, bulge: 0.5 });
    });
    ellipse(g, 0, L * 0.35, 9 * u, 9.5 * u, { fill: col });
    line(g, [[0, L], [1.5 * u, L + 6 * u], [-1 * u, L + 12 * u], [1 * u, L + 18 * u]]);
    g.restore();
  } }
}, { color: ILLO.pink });

/* ======================= 꽃 (state = 개화) ======================= */
reg("flower", "꽃", ["drop-zone", "page-visibility"], {
  A: { label: "큰 꽃 한 송이 · 다섯 잎", draw(g, x, y, h, o) {
    const u = h / 84, b = st(o), col = o.color || ILLO.pink;
    g.save(); g.translate(x, y); g.rotate(Math.sin(tt(o) * 1.2) * 0.03);
    const S = [0, 0, -5 * u, -32 * u, 2 * u, -58 * u];
    curve(g, S, { lw: LINE + 0.3 });
    const a = qp(S, 0.42);
    lf(g, a[0], a[1], 17 * u, -PI * 0.86, GREEN, { vein: true });
    const [hx, hy] = qp(S, 1);
    lf(g, hx, hy, 8 * u, -PI * 0.7, GREEN, { w: 0.4 });
    lf(g, hx, hy, 7 * u, -PI * 0.3, GREEN, { w: 0.4 });
    const jit = [0.1, -0.06, 0.08, -0.1, 0.04], len = [16, 13.5, 17, 15, 12.5];
    for (let i = 0; i < 5; i++) {
      const base = -PI / 2 + i * TAU / 5 + jit[i];
      const ang = -PI / 2 + (base + PI / 2) * (0.12 + 0.88 * b);
      lf(g, hx, hy, len[i] * u * mix(0.4, 1, b), ang, col, { w: 0.8, bulge: 0.5 });
    }
    if (b > 0.5) dot(g, hx, hy - 1 * u, 3.2 * u * cl((b - 0.5) * 2), TONE[4]);
    g.restore();
  } },
  B: { label: "고개 숙인 방울꽃", draw(g, x, y, h, o) {
    const u = h / 84, b = st(o), col = o.color || ILLO.pink;
    g.save(); g.translate(x, y); g.rotate(Math.sin(tt(o) * 1.3 + 1) * 0.03);
    const S = [0, 0, -2 * u, -66 * u, 16 * u, -46 * u];
    curve(g, S, { lw: LINE + 0.3 });
    lf(g, 0, -2 * u, 20 * u, -PI * 0.8, GREEN, { vein: true });
    lf(g, 0, -1 * u, 14 * u, -PI * 0.25, GREEN);
    const [hx, hy] = qp(S, 1), w = mix(4, 11, b) * u, L = mix(9, 15, b) * u;
    g.translate(hx, hy); g.rotate(0.25);
    shape(g, c => {
      c.moveTo(-2 * u, 0);
      c.quadraticCurveTo(-w * 1.1, L * 0.55, -w, L);
      c.quadraticCurveTo(-w * 0.4, L * 0.86, 0, L * 1.05);
      c.quadraticCurveTo(w * 0.5, L * 0.85, w, L);
      c.quadraticCurveTo(w * 1.1, L * 0.55, 2 * u, 0);
      c.closePath();
    }, { fill: col });
    g.restore();
  } },
  C: { label: "작은 송이 셋 · 층층이", draw(g, x, y, h, o) {
    const u = h / 84, b = st(o), col = o.color || ILLO.pink;
    g.save(); g.translate(x, y); g.rotate(Math.sin(tt(o) * 1.1 + 2) * 0.03);
    const S = [0, 0, -4 * u, -30 * u, 2 * u, -58 * u];
    curve(g, S, { lw: LINE + 0.3 });
    const lp = qp(S, 0.28);
    lf(g, lp[0], lp[1], 15 * u, -PI * 0.15, GREEN, { vein: true });
    [[0.55, -11, -3, 5, 0], [0.78, 10, -4, 4.2, 0.18], [1, 0, 0, 6, 0.36]].forEach(([p, dx, dy, r, d]) => {
      const [sx, sy] = qp(S, p), bx = sx + dx * u, by = sy + dy * u, k = mix(0.3, 1, cl((b - d) / 0.64));
      if (dx) line(g, [[sx, sy], [bx, by]]);
      circle(g, bx, by, r * u * k, { fill: col });
      if (k > 0.6) dot(g, bx + 0.5 * u, by, 1.3 * u, TONE[4]);
    });
    g.restore();
  } }
}, { color: ILLO.pink });

/* ======================= 나무 (작은) ======================= */
reg("tree", "나무", ["drop-zone", "before-after"], {
  A: { label: "둥근 수관 · 가는 줄기", draw(g, x, y, h, o) {
    const u = h / 84, col = o.color || GREEN;
    g.save(); g.translate(x, y);
    curve(g, [0, 0, 2 * u, -20 * u, 1 * u, -40 * u], { lw: LINE + 1 });
    line(g, [[1 * u, -30 * u], [-8 * u, -40 * u]], { lw: LINE });
    lump(g, 3 * u, -58 * u, 19 * u, 17 * u, 0.07, col, 9, 0.4);
    g.restore();
  } },
  B: { label: "층진 수관 셋", draw(g, x, y, h, o) {
    const u = h / 84, col = o.color || GREEN;
    g.save(); g.translate(x, y);
    shape(g, c => { c.moveTo(-3.5 * u, 0); c.lineTo(-2.5 * u, -34 * u); c.lineTo(2 * u, -34 * u); c.lineTo(3.5 * u, 0); c.closePath(); }, { fill: TONE[4] });
    ellipse(g, 2 * u, -40 * u, 27 * u, 12 * u, { fill: col }, 0.03);
    ellipse(g, -4 * u, -53 * u, 21 * u, 11 * u, { fill: col }, -0.05);
    ellipse(g, 1 * u, -66 * u, 13 * u, 9 * u, { fill: col }, 0.08);
    g.restore();
  } },
  C: { label: "기운 나무 · 한쪽이 무거운", draw(g, x, y, h, o) {
    const u = h / 84, col = o.color || GREEN;
    g.save(); g.translate(x, y);
    thick(g, c => { c.moveTo(0, 0); c.quadraticCurveTo(4 * u, -22 * u, 14 * u, -46 * u); }, 5 * u, TONE[4]);
    line(g, [[7 * u, -30 * u], [-6 * u, -46 * u]], { lw: LINE + 0.3 });
    lump(g, 16 * u, -62 * u, 22 * u, 19 * u, 0.08, col, 9, 1.2);
    lump(g, -8 * u, -52 * u, 13 * u, 11 * u, 0.06, col, 8, 2.1);
    g.restore();
  } }
});

/* ======================= 나무 실루엣 (키 큰) ======================= */
reg("bush-tree", "나무 실루엣", ["mouse-parallax", "before-after"], {
  A: { label: "가늘고 긴 침엽 · 울퉁불퉁", draw(g, x, y, h, o) {
    const col = o.color || GREEN, H = h * 0.94, w = h * 0.17;
    g.save(); g.translate(x, y);
    shape(g, c => { c.moveTo(-h * 0.02, 0); c.lineTo(-h * 0.015, -h * 0.08); c.lineTo(h * 0.02, -h * 0.08); c.lineTo(h * 0.025, 0); c.closePath(); }, { fill: TONE[4] });
    const pts = [[h * 0.01, -H]];
    for (let i = 1; i <= 6; i++) { const p = i / 7, k = 1 + 0.12 * Math.sin(i * 2.7); pts.push([w * Math.sin(p * PI) ** 0.6 * k + h * 0.01, -H * (1 - p)]); }
    pts.push([w * 0.55, -h * 0.07], [-w * 0.6, -h * 0.07]);
    for (let i = 6; i >= 1; i--) { const p = i / 7, k = 1 + 0.12 * Math.cos(i * 2.1); pts.push([-w * Math.sin(p * PI) ** 0.6 * k, -H * (1 - p)]); }
    blob(g, pts, col);
    g.restore();
  } },
  B: { label: "긴 타원 · 살짝 기운 포플러", draw(g, x, y, h, o) {
    const col = o.color || GREEN;
    g.save(); g.translate(x, y);
    shape(g, c => { c.moveTo(-h * 0.02, 0); c.lineTo(-h * 0.012, -h * 0.12); c.lineTo(h * 0.018, -h * 0.12); c.lineTo(h * 0.025, 0); c.closePath(); }, { fill: TONE[4] });
    ellipse(g, h * 0.02, -h * 0.55, h * 0.15, h * 0.45, { fill: col }, 0.06);
    g.restore();
  } },
  C: { label: "두 덩이 겹친 실루엣", draw(g, x, y, h, o) {
    const col = o.color || GREEN;
    g.save(); g.translate(x, y);
    shape(g, c => { c.moveTo(-h * 0.02, 0); c.lineTo(-h * 0.01, -h * 0.1); c.lineTo(h * 0.02, -h * 0.1); c.lineTo(h * 0.03, 0); c.closePath(); }, { fill: TONE[4] });
    lump(g, -h * 0.03, -h * 0.56, h * 0.13, h * 0.42, 0.05, col, 10, 0.7);
    lump(g, h * 0.13, -h * 0.3, h * 0.11, h * 0.2, 0.06, col, 8, 1.9);
    g.restore();
  } }
}, { height: 100 });

/* ======================= 씨앗 ======================= */
reg("seed", "씨앗", ["drop-zone"], {
  A: { label: "물방울꼴 한 알 · 기울여 눕힘", draw(g, x, y, h, o) {
    const u = h / 14, col = o.color || TONE[5];
    g.save(); g.translate(x, y - 4 * u); g.rotate(-0.55);
    shape(g, c => { c.moveTo(-7 * u, 0); c.quadraticCurveTo(-1 * u, -5.5 * u, 6 * u, -1 * u); c.quadraticCurveTo(7 * u, 0, 6 * u, 1 * u); c.quadraticCurveTo(-1 * u, 5 * u, -7 * u, 0); }, { fill: col });
    g.restore();
  } },
  B: { label: "납작 타원 + 배꼽점", draw(g, x, y, h, o) {
    const u = h / 14, col = o.color || TONE[5];
    ellipse(g, x, y - 4.5 * u, 7 * u, 4.5 * u, { fill: col }, 0.22);
    dot(g, x - 3.5 * u, y - 5.5 * u, 1.1 * u, ILLO.paper);
  } },
  C: { label: "두 알 · 크기 다르게", draw(g, x, y, h, o) {
    const u = h / 14, col = o.color || TONE[5];
    g.save(); g.translate(x, y);
    ellipse(g, -5 * u, -3 * u, 5.5 * u, 3 * u, { fill: col }, 0.1);
    g.translate(6 * u, -4 * u); g.rotate(-0.9);
    shape(g, c => { c.moveTo(-5 * u, 0); c.quadraticCurveTo(-1 * u, -4 * u, 4.5 * u, -0.5 * u); c.quadraticCurveTo(-1 * u, 3.5 * u, -5 * u, 0); }, { fill: col });
    g.restore();
  } }
}, { height: 14, color: TONE[5] });

/* ======================= 화분 (state = 성장) ======================= */
function pot(g, u, wTop, wBot, H, r = 0) {
  if (r) shape(g, c => c.roundRect(-wTop / 2 * u, -H * u, wTop * u, H * u, [1 * u, 1 * u, r * u, r * u]), { fill: TONE[3] });
  else shape(g, c => { c.moveTo(-wBot / 2 * u, 0); c.lineTo(-wTop / 2 * u, -H * u); c.lineTo(wTop / 2 * u, -H * u); c.lineTo(wBot / 2 * u, 0); c.closePath(); }, { fill: TONE[3] });
  shape(g, c => c.rect(-(wTop / 2 + 2) * u, -(H + 5) * u, (wTop + 4) * u, 5 * u), { fill: TONE[4] });
}
reg("potted-plant", "화분", ["page-visibility"], {
  A: { label: "낮은 화분 + 곧은 줄기·어긋난 잎", draw(g, x, y, h, o) {
    const u = h / 84, gr = 0.45 + 0.55 * st(o), col = o.color || GREEN;
    g.save(); g.translate(x, y);
    pot(g, u, 30, 24, 20);
    const top = -25 * u, H = 46 * u * gr, S = [0, top, 3 * u, top - H * 0.5, -1 * u, top - H];
    g.save(); g.translate(0, top); g.rotate(Math.sin(tt(o) * 1.2) * 0.02); g.translate(0, -top);
    curve(g, S, { lw: LINE + 0.3 });
    [[0.35, -0.85, 13], [0.55, -0.15, 15], [0.75, -0.9, 14], [0.95, -0.2, 12]].forEach(([p, a, L]) => {
      const q = qp(S, p); lf(g, q[0], q[1], L * u * gr, a * PI, col, { vein: true });
    });
    g.restore(); g.restore();
  } },
  B: { label: "둥근 화분 + 다육 로제트", draw(g, x, y, h, o) {
    const u = h / 84, gr = 0.45 + 0.55 * st(o), col = o.color || GREEN;
    g.save(); g.translate(x, y);
    pot(g, u, 28, 28, 22, 9);
    const top = -27 * u;
    [[-0.96, 14], [-0.8, 17], [-0.62, 12], [-0.45, 18], [-0.3, 13], [-0.14, 16], [-0.02, 10]].forEach(([a, L], i) =>
      lf(g, (i - 3) * 1.2 * u, top, L * u * gr, a * PI, col, { w: 0.6, bulge: 0.5 }));
    g.restore();
  } },
  C: { label: "키 큰 화분 + 늘어진 잎", draw(g, x, y, h, o) {
    const u = h / 84, gr = 0.45 + 0.55 * st(o), col = o.color || GREEN;
    g.save(); g.translate(x, y);
    pot(g, u, 20, 16, 34);
    const top = -39 * u;
    [[-22, 30], [18, 26], [-13, 36], [26, 34], [6, 22]].forEach(([dx, L]) => droop(g, dx * 0.1 * u, top, dx * u * gr, L * u * gr, col));
    g.restore();
  } }
});

/* ======================= 구름 (state = 눌림) ======================= */
function cloudLumps(g, parts, u, fill, outline) {
  if (outline) { g.save(); g.strokeStyle = ILLO.ink; g.lineWidth = LINE; parts.forEach(([px, py, r]) => { g.beginPath(); g.arc(px * u, py * u, r * u, 0, TAU); g.stroke(); }); g.restore(); }
  g.save(); g.fillStyle = fill; parts.forEach(([px, py, r]) => { g.beginPath(); g.arc(px * u, py * u, r * u, 0, TAU); g.fill(); }); g.restore();
}
function cloudFrame(g, x, y, h, o, fn) {
  const u = h / 84, s = st(o), col = o.color || ILLO.paper;
  g.save(); g.translate(x, y - 46 * u + Math.sin(tt(o) * 0.8) * 1.5 * u); g.scale(1 + s * 0.25, 1 - s * 0.42);
  fn(u, col); g.restore();
}
reg("cloud", "구름", ["squeeze"], {
  A: { label: "납작하고 긴 구름 · 바닥 평평", draw(g, x, y, h, o) {
    cloudFrame(g, x, y, h, o, (u, col) => {
      cloudLumps(g, [[-30, -2, 11], [-12, -10, 16], [8, -6, 14], [27, 0, 9]], u, col);
      g.fillStyle = col; g.fillRect(-32 * u, -4 * u, 62 * u, 10 * u);
    });
  } },
  B: { label: "뭉게구름 + 가는 윤곽", draw(g, x, y, h, o) {
    cloudFrame(g, x, y, h, o, (u, col) => cloudLumps(g, [[-1, -14, 19], [-23, -2, 13], [19, -4, 15], [-7, 5, 12], [11, 7, 10]], u, col, true));
  } },
  C: { label: "기운 구름 · 꼬리 끌림", draw(g, x, y, h, o) {
    cloudFrame(g, x, y, h, o, (u, col) => {
      cloudLumps(g, [[-28, 6, 8], [-12, -2, 14], [8, -10, 18], [27, -4, 11]], u, col);
      ellipse(g, -8 * u, 4 * u, 34 * u, 6 * u, { fill: col }, -0.12);
    });
  } }
}, { color: ILLO.paper });

/* ======================= 달 ======================= */
reg("moon", "달", [], {
  A: { label: "보름달 · 크레이터 하나", draw(g, x, y, h, o) {
    const u = h / 84, col = o.color || ILLO.paper, cy = y - 50 * u;
    circle(g, x, cy, 23 * u, { fill: col });
    ellipse(g, x + 7 * u, cy - 5 * u, 5.5 * u, 4 * u, { fill: TONE[1] }, 0.35);
  } },
  B: { label: "초승달 · 기울임", draw(g, x, y, h, o) {
    const u = h / 84, col = o.color || ILLO.paper, R = 24 * u;
    g.save(); g.translate(x, y - 50 * u); g.rotate(-0.4);
    shape(g, c => { c.moveTo(0, -R); c.quadraticCurveTo(R * 1.35, 0, 0, R); c.quadraticCurveTo(R * 0.42, 0, 0, -R); }, { fill: col });
    g.restore();
  } },
  C: { label: "달 + 구름 조각 걸림", draw(g, x, y, h, o) {
    const u = h / 84, col = o.color || ILLO.paper, cy = y - 52 * u;
    circle(g, x - 2 * u, cy, 21 * u, { fill: col });
    ellipse(g, x - 9 * u, cy + 6 * u, 4.5 * u, 3.5 * u, { fill: TONE[1] }, -0.3);
    g.save(); g.translate(x + 8 * u, cy + 14 * u);
    cloudLumps(g, [[-14, 0, 5], [-4, -4, 7], [7, -2, 6], [16, 1, 4]], u, TONE[1]);
    g.fillStyle = TONE[1]; g.fillRect(-14 * u, -1 * u, 30 * u, 5 * u);
    g.restore();
  } }
}, { color: ILLO.paper });

/* ======================= 고양이 (옆모습, 오른쪽 보기; t = 꼬리) =======================
   종이 오리기 실루엣: 머리는 몸 길이의 1/4, 귀는 작게, 꼬리는 몸 길이만큼. 얼굴은 수염 한 줄만. */
/** 좌표 배열을 u배로 그리는 닫힌 실루엣. 점은 [x,y] | [cx,cy,x,y] | [c1x,c1y,c2x,c2y,x,y] */
function bz(g, pts, fill, u = 1) {
  shape(g, c => {
    c.moveTo(pts[0][0] * u, pts[0][1] * u);
    for (let i = 1; i < pts.length; i++) {
      const p = pts[i];
      if (p.length === 6) c.bezierCurveTo(p[0] * u, p[1] * u, p[2] * u, p[3] * u, p[4] * u, p[5] * u);
      else if (p.length === 4) c.quadraticCurveTo(p[0] * u, p[1] * u, p[2] * u, p[3] * u);
      else c.lineTo(p[0] * u, p[1] * u);
    }
    c.closePath();
  }, { fill });
}
/** 굵은 단색 3차 곡선(꼬리). [x0,y0, c1x,c1y, c2x,c2y, x1,y1] (u 단위) */
function tailC(g, u, col, [x0, y0, a, b, c2, d, x1, y1], w) {
  thick(g, c => { c.moveTo(x0 * u, y0 * u); c.bezierCurveTo(a * u, b * u, c2 * u, d * u, x1 * u, y1 * u); }, w * u, col);
}
/** 고양이 머리. (hx, hy) 중심, r 반지름(u 단위). flat 0~1 이면 귀가 뒤로 눕는다 */
function catHead(g, u, col, hx, hy, r, { tilt = 0, flip = false, flat = 0, whisker = true } = {}) {
  g.save(); g.translate(hx * u, hy * u); if (flip) g.scale(-1, 1); g.rotate(tilt);
  const R = r * u, f = flat;
  bz(g, [[-0.6, -0.5], [-0.7 - 0.2 * f, -1.0, -0.66 - 0.3 * f, -1.35 + 0.4 * f, -0.52 - 0.4 * f, -1.68 + 0.7 * f], [-0.3 - 0.2 * f, -1.3 + 0.3 * f, -0.15, -1.0, 0.02, -0.92]], col, R);
  bz(g, [[0.1, -0.95], [0.3 - 0.2 * f, -1.2 + 0.2 * f, 0.5 - 0.4 * f, -1.42 + 0.4 * f, 0.64 - 0.55 * f, -1.6 + 0.75 * f], [0.8 - 0.2 * f, -1.2 + 0.2 * f, 0.88, -0.8, 0.84, -0.45]], col, R);
  circle(g, 0, 0, R, { fill: col });
  ellipse(g, 0.68 * R, 0.24 * R, 0.46 * R, 0.34 * R, { fill: col });
  if (whisker) line(g, [[1.0 * R, 0.14 * R], [1.85 * R, 0.02 * R]], { lw: LINE * 0.8 });
  g.restore();
}
const paw = (g, u, col, x, y, r = 5.5) => ellipse(g, x * u, (y - 2.4) * u, r * u, 2.5 * u, { fill: col });
const leg = (g, u, col, x0, y0, x1, y1, w = 5.5) => tube(g, [[x0 * u, y0 * u], [x1 * u, y1 * u]], { color: col, w: w * u });

reg("cat", "고양이", ["rub"], {
  A: { label: "앉음 · 꼬리는 뒤로 길게", draw(g, x, y, h, o) {
    const u = h / 84, col = o.color || TONE[5], sw = Math.sin(tt(o) * 1.5) * 4;
    g.save(); g.translate(x, y);
    tailC(g, u, col, [-22, -7, -36, -6, -46, -3, -50, -12 + sw], 4.2);
    ellipse(g, -9 * u, -15 * u, 17 * u, 14.5 * u, { fill: col }, 0.05);
    bz(g, [[-24, -12], [-27, -34, -12, -52, 5, -56], [16, -58, 22, -46, 20, -30], [19, -14, 19, -6, 17, -2], [17, 0], [-10, 0], [-22, -1, -26, -5, -24, -12]], col, u);
    leg(g, u, col, 9, -22, 10, -3); leg(g, u, col, 16, -20, 18, -3, 5);
    paw(g, u, col, 11, 0); paw(g, u, col, 20, 0, 5);
    catHead(g, u, col, 10, -62, 10.5);
    g.restore();
  } },
  B: { label: "식빵 자세", draw(g, x, y, h, o) {
    const u = h / 84, col = o.color || TONE[5], sw = Math.sin(tt(o) * 1.2) * 2.5, br = 1 + Math.sin(tt(o) * 1.6) * 0.012;
    g.save(); g.translate(x, y);
    tailC(g, u, col, [-26, -9, -36, -8, -32, -2, -14, -2.5], 4.5);
    tailC(g, u, col, [-14, -2.5, -6, -2.5, 0, -2.5, 6 + sw, -3], 3.6);
    g.save(); g.scale(1, br);
    bz(g, [[-30, -8], [-32, -22, -18, -30, 0, -30], [16, -30, 26, -26, 30, -16], [32, -8, 30, -2, 26, 0], [-24, 0], [-30, -1, -31, -4, -30, -8]], col, u);
    g.restore();
    catHead(g, u, col, 22, -33, 10.5, { tilt: 0.08 });
    g.restore();
  } },
  C: { label: "앞으로 쭉 스트레칭", draw(g, x, y, h, o) {
    const u = h / 84, col = o.color || TONE[5], sw = Math.sin(tt(o) * 1.4) * 4;
    g.save(); g.translate(x, y);
    tailC(g, u, col, [-28, -32, -38, -36, -44, -48, -38 + sw, -62], 4);
    leg(g, u, col, -26, -20, -30, -3, 6); paw(g, u, col, -30, 0);
    bz(g, [[-22, -4], [-40, -8, -38, -40, -18, -40], [-4, -40, 4, -30, 14, -22], [18, -18, 20, -10, 18, -6], [16, -3], [-20, -3]], col, u);
    leg(g, u, col, 10, -14, 34, -3, 6); paw(g, u, col, 36, 0);
    leg(g, u, col, 8, -12, 27, -3, 5); paw(g, u, col, 29, 0, 5);
    catHead(g, u, col, 24, -22, 10, { tilt: 0.25 });
    g.restore();
  } },
  D: { label: "걷기 · 꼬리 반쯤", draw(g, x, y, h, o) {
    const u = h / 84, col = o.color || TONE[5], t = tt(o), sw = Math.sin(t * 1.3) * 4, st2 = Math.sin(t * 2.4) * 3;
    g.save(); g.translate(x, y);
    tailC(g, u, col, [-22, -30, -34, -30, -44, -34, -46 + sw, -50], 4);
    leg(g, u, col, -14, -24, -20 - st2, -3, 5.5); paw(g, u, col, -21 - st2, 0);
    leg(g, u, col, 14, -24, 10 + st2, -3, 5); paw(g, u, col, 9 + st2, 0);
    bz(g, [[-24, -26], [-26, -40, -8, -44, 8, -42], [20, -41, 30, -38, 32, -30], [32, -22, 22, -18, 6, -18], [-8, -18, -22, -16, -24, -26]], col, u);
    leg(g, u, col, -8, -24, -6 + st2, -3, 5.5); paw(g, u, col, -5 + st2, 0);
    leg(g, u, col, 20, -24, 24 - st2, -3, 5.5); paw(g, u, col, 25 - st2, 0);
    ellipse(g, 24 * u, -36 * u, 9 * u, 8 * u, { fill: col }, 0.4);
    catHead(g, u, col, 32, -44, 9.5, { tilt: 0.12 });
    g.restore();
  } },
  E: { label: "꼬리 세우고 걷기", draw(g, x, y, h, o) {
    const u = h / 84, col = o.color || TONE[5], t = tt(o), sw = Math.sin(t * 1.4) * 3, st2 = Math.sin(t * 2.4 + 1) * 3;
    g.save(); g.translate(x, y);
    tailC(g, u, col, [-22, -34, -30, -38, -32, -50, -30, -62], 4.2);
    tailC(g, u, col, [-30, -62, -29, -68, -25 + sw, -70, -20 + sw, -68], 3.6);
    leg(g, u, col, -14, -26, -19 - st2, -3, 5.5); paw(g, u, col, -20 - st2, 0);
    leg(g, u, col, 14, -26, 11 + st2, -3, 5); paw(g, u, col, 10 + st2, 0);
    bz(g, [[-24, -30], [-26, -44, -8, -48, 8, -46], [20, -45, 28, -42, 30, -34], [30, -24, 22, -20, 6, -20], [-8, -20, -22, -18, -24, -30]], col, u);
    leg(g, u, col, -8, -26, -5 + st2, -3, 5.5); paw(g, u, col, -4 + st2, 0);
    leg(g, u, col, 20, -26, 24 - st2, -3, 5.5); paw(g, u, col, 25 - st2, 0);
    ellipse(g, 24 * u, -42 * u, 9 * u, 8 * u, { fill: col }, 0.5);
    catHead(g, u, col, 30, -52, 9.5, { tilt: -0.05 });
    g.restore();
  } },
  F: { label: "둥글게 말고 잠", draw(g, x, y, h, o) {
    const u = h / 84, col = o.color || TONE[5], br = 1 + Math.sin(tt(o) * 1.4) * 0.015;
    g.save(); g.translate(x, y);
    g.save(); g.scale(1, br);
    bz(g, [[-28, -6], [-32, -20, -18, -28, -2, -28], [12, -28, 20, -22, 24, -12], [26, -5, 22, 0, 16, 0], [-22, 0], [-28, 0, -29, -3, -28, -6]], col, u);
    g.restore();
    catHead(g, u, col, 22, -13, 9.5, { tilt: 0.42, flat: 0.3 });
    tailC(g, u, col, [-26, -8, -38, -8, -34, -1, -14, -2.5], 4.5);
    tailC(g, u, col, [-14, -2.5, 0, -3, 14, -4, 30, -4], 3.8);
    g.restore();
  } },
  G: { label: "등을 활처럼 세움", draw(g, x, y, h, o) {
    const u = h / 84, col = o.color || TONE[5], sw = Math.sin(tt(o) * 1.6) * 3;
    g.save(); g.translate(x, y);
    tailC(g, u, col, [-18, -30, -28, -36, -30, -52, -24 + sw, -68], 5.5);
    leg(g, u, col, -14, -24, -18, -3, 5.5); paw(g, u, col, -19, 0);
    leg(g, u, col, 12, -22, 14, -3, 5); paw(g, u, col, 15, 0, 5);
    bz(g, [[-18, -10], [-28, -34, -12, -64, 2, -66], [16, -68, 24, -50, 22, -30], [22, -18, 21, -12, 20, -8], [18, -4], [-14, -4]], col, u);
    leg(g, u, col, -8, -24, -8, -3, 5.5); paw(g, u, col, -7, 0);
    leg(g, u, col, 18, -22, 22, -3, 5.5); paw(g, u, col, 23, 0);
    catHead(g, u, col, 24, -26, 9.5, { tilt: 0.6, flat: 0.6 });
    g.restore();
  } },
  H: { label: "고개 돌려 그루밍", draw(g, x, y, h, o) {
    const u = h / 84, col = o.color || TONE[5], sw = Math.sin(tt(o) * 1.5) * 3, nod = Math.sin(tt(o) * 2.2) * 0.05;
    g.save(); g.translate(x, y);
    tailC(g, u, col, [-22, -8, -36, -6, -44, -3, -48 + sw, -8], 4.2);
    ellipse(g, -9 * u, -15 * u, 17 * u, 14.5 * u, { fill: col }, 0.05);
    bz(g, [[-24, -12], [-27, -34, -12, -50, 6, -54], [16, -56, 22, -44, 20, -30], [19, -14, 19, -6, 17, -2], [17, 0], [-10, 0], [-22, -1, -26, -5, -24, -12]], col, u);
    leg(g, u, col, 9, -22, 10, -3); leg(g, u, col, 16, -20, 18, -3, 5);
    paw(g, u, col, 11, 0); paw(g, u, col, 20, 0, 5);
    catHead(g, u, col, 3, -47, 10, { flip: true, tilt: 0.6 + nod, whisker: false });
    g.restore();
  } },
  I: { label: "꼿꼿이 앉아 꼬리로 발 감쌈", draw(g, x, y, h, o) {
    const u = h / 84, col = o.color || TONE[5], sw = Math.sin(tt(o) * 1.4) * 2;
    g.save(); g.translate(x, y);
    ellipse(g, -6 * u, -14 * u, 15 * u, 13.5 * u, { fill: col }, 0.05);
    bz(g, [[-20, -10], [-22, -36, -8, -58, 4, -64], [12, -66, 18, -54, 17, -36], [16, -18, 17, -6, 15, -2], [15, 0], [-8, 0], [-18, 0, -22, -4, -20, -10]], col, u);
    leg(g, u, col, 7, -26, 8, -3, 5.5); leg(g, u, col, 13, -24, 15, -3, 5);
    paw(g, u, col, 9, 0, 5.5); paw(g, u, col, 17, 0, 5);
    tailC(g, u, col, [-18, -6, -30, -6, -26, 1, -6, -1.5], 4.4);
    tailC(g, u, col, [-6, -1.5, 8, -2, 22, -3, 26 + sw, -8 + sw * 0.6], 3.8);
    catHead(g, u, col, 7, -70, 10, { tilt: -0.05 });
    g.restore();
  } },
  J: { label: "고개 들어 올려다봄", draw(g, x, y, h, o) {
    const u = h / 84, col = o.color || TONE[5], sw = Math.sin(tt(o) * 1.5) * 3;
    g.save(); g.translate(x, y);
    tailC(g, u, col, [-22, -7, -34, -6, -44, -4, -50 + sw, -6 + sw * 0.5], 4.2);
    ellipse(g, -10 * u, -15 * u, 17 * u, 14.5 * u, { fill: col }, 0.05);
    bz(g, [[-25, -12], [-30, -34, -18, -50, 0, -54], [10, -56, 20, -50, 22, -36], [22, -18, 21, -6, 19, -2], [19, 0], [-10, 0], [-22, -1, -27, -5, -25, -12]], col, u);
    leg(g, u, col, 10, -24, 12, -3); leg(g, u, col, 17, -22, 20, -3, 5);
    paw(g, u, col, 13, 0); paw(g, u, col, 22, 0, 5);
    catHead(g, u, col, 8, -60, 10.5, { tilt: -0.62 });
    g.restore();
  } }
}, { color: TONE[5] });

/* ======================= 새 (앉은 모습) ======================= */
reg("bird", "새", [], {
  A: { label: "통통한 참새 · 가지 위", draw(g, x, y, h, o) {
    const u = h / 84, col = o.color || TONE[5], bob = Math.sin(tt(o) * 2) * 0.6 * u;
    g.save(); g.translate(x, y - 10 * u);
    twig(g, u, 0, 0.06);
    g.translate(0, bob);
    line(g, [[1 * u, -12 * u], [0, -1 * u]]); line(g, [[6 * u, -12 * u], [6 * u, -1 * u]]);
    tri(g, [-10 * u, -19 * u], [-24 * u, -14 * u], [-22 * u, -22 * u], col);
    ellipse(g, 0, -21 * u, 14 * u, 10 * u, { fill: col }, -0.18);
    circle(g, 10 * u, -31 * u, 7 * u, { fill: col });
    tri(g, [16 * u, -32 * u], [23 * u, -30.5 * u], [16 * u, -29 * u], col);
    g.restore();
  } },
  B: { label: "긴 꼬리 · 날씬한 몸", draw(g, x, y, h, o) {
    const u = h / 84, col = o.color || TONE[5], bob = Math.sin(tt(o) * 2.2) * 0.5 * u;
    g.save(); g.translate(x, y - 12 * u);
    twig(g, u, 0, 0.1);
    g.translate(0, bob);
    line(g, [[2 * u, -16 * u], [1 * u, -1 * u]]); line(g, [[6 * u, -16 * u], [7 * u, -1 * u]]);
    tri(g, [-8 * u, -22 * u], [-32 * u, -4 * u], [-26 * u, -2 * u], col);
    ellipse(g, 0, -26 * u, 12 * u, 7.5 * u, { fill: col }, -0.38);
    circle(g, 10 * u, -37 * u, 5.8 * u, { fill: col });
    tri(g, [15 * u, -38 * u], [24 * u, -36.5 * u], [15 * u, -35.5 * u], col);
    g.restore();
  } },
  C: { label: "고개 든 새 · 꼬리 아래로", draw(g, x, y, h, o) {
    const u = h / 84, col = o.color || TONE[5], bob = Math.sin(tt(o) * 1.8) * 0.5 * u;
    g.save(); g.translate(x, y - 9 * u);
    twig(g, u, 0, 0.05);
    g.translate(0, bob);
    line(g, [[-1 * u, -14 * u], [-2 * u, -1 * u]]); line(g, [[4 * u, -14 * u], [5 * u, -1 * u]]);
    tri(g, [-4 * u, -18 * u], [-11 * u, -6 * u], [-1 * u, -10 * u], col);
    ellipse(g, 0, -28 * u, 8.5 * u, 14 * u, { fill: col }, 0.15);
    circle(g, 5 * u, -44 * u, 6.2 * u, { fill: col });
    tri(g, [9 * u, -48 * u], [17 * u, -52 * u], [10.5 * u, -44 * u], col);
    g.restore();
  } }
}, { color: TONE[5] });

/* ======================= 물고기 (오른쪽 보기; t = 꼬리 흔듦) =======================
   자연사 도감 실루엣: 종마다 몸 비례·지느러미 모양이 다르다. 눈은 종이색 점 하나. */
function fishFrame(g, x, y, h, o, fn) {
  const u = h / 84, col = o.color || ILLO.blue;
  g.save(); g.translate(x, y - 40 * u + Math.sin(tt(o) * 1.1) * 2 * u);
  fn(u, col, Math.sin(tt(o) * 3.2) * 0.16); g.restore();
}
/** 갈래 꼬리지느러미. (x, y)는 꼬리자루, ang 방향(0 = 왼쪽으로 뻗음), L 길이, sp 벌어짐, fork 파임 0~1 */
function tailFin(g, u, col, x, y, ang, L, sp, fork = 0.35) {
  g.save(); g.translate(x * u, y * u); g.rotate(ang);
  bz(g, [[0, 0], [-L * 0.35, -sp * 0.25, -L * 0.75, -sp * 0.85, -L, -sp], [-L * (1 - fork), 0, -L, sp], [-L * 0.75, sp * 0.85, -L * 0.35, sp * 0.25, 0, 0]], col, u);
  g.restore();
}
/** 눈: 종이색 점 */
const fEye = (g, u, x, y, r = 1.7) => dot(g, x * u, y * u, r * u, ILLO.paper);
/** 2차 곡선의 접선 */
const qd = ([x0, y0, cx, cy, x1, y1], p) => [2 * (1 - p) * (cx - x0) + 2 * p * (x1 - cx), 2 * (1 - p) * (cy - y0) + 2 * p * (y1 - cy)];
/** 굽은 등뼈(S: 꼬리자루 → 코)를 따라 두께를 주어 몸을 만든다. wmax 최대 반두께 */
function spineBody(g, u, col, S, wmax, n = 24) {
  const top = [], bot = [];
  for (let i = 0; i <= n; i++) {
    const s = i / n, p = qp(S, s), d = qd(S, s), len = Math.hypot(d[0], d[1]) || 1, nx = -d[1] / len, ny = d[0] / len;
    const w = wmax * (0.12 + 0.88 * Math.sin(PI * Math.pow(s, 0.72)) ** 0.9);
    top.push([p[0] + nx * w, p[1] + ny * w]); bot.push([p[0] - nx * w, p[1] - ny * w]);
  }
  shape(g, c => {
    top.forEach(([px, py], i) => i ? c.lineTo(px * u, py * u) : c.moveTo(px * u, py * u));
    bot.reverse().forEach(([px, py]) => c.lineTo(px * u, py * u));
    c.closePath();
  }, { fill: col });
}
/** 작은 물고기 한 마리(피라미). (x, y) 중심, L 몸길이 */
function minnow(g, u, col, x, y, L, wag, eye = true) {
  g.save(); g.translate(x * u, y * u);
  const s = L / 40;
  tailFin(g, u, col, -18 * s, 0, wag, 9 * s, 6 * s, 0.4);
  bz(g, [[20 * s, 0], [17 * s, -4 * s, 6 * s, -5.5 * s, -6 * s, -4.5 * s], [-13 * s, -3.5 * s, -17 * s, -1.5 * s, -19 * s, 0], [-17 * s, 1.5 * s, -13 * s, 3.5 * s, -6 * s, 4.5 * s], [6 * s, 5.5 * s, 17 * s, 4 * s, 20 * s, 0]], col, u);
  bz(g, [[-4 * s, -4.5 * s], [-1 * s, -9 * s, 4 * s, -9 * s, 7 * s, -5 * s]], col, u);
  if (eye) fEye(g, u, 13 * s, -1.2 * s, 1.3 * s);
  g.restore();
}

reg("fish", "물고기", [], {
  A: { label: "금붕어 · 부채꼬리", draw(g, x, y, h, o) {
    fishFrame(g, x, y, h, o, (u, col, wag) => {
      g.save(); g.translate(-9 * u, 0); g.rotate(wag * 0.7);
      bz(g, [[0, -3], [-8, -12, -20, -22, -30, -16], [-26, -9, -20, -3, -14, 0], [-20, 3, -26, 9, -30, 16], [-20, 22, -8, 12, 0, 3]], col, u);
      g.restore();
      bz(g, [[-6, -11], [-3, -20, 6, -21, 11, -12]], col, u);
      ellipse(g, 3 * u, 0, 15 * u, 12.5 * u, { fill: col }, -0.06);
      bz(g, [[2, 11], [0, 17, -6, 18, -9, 13]], col, u);
      bz(g, [[10, 4], [12, 9, 8, 12, 4, 8]], col, u);
      fEye(g, u, 12, -3);
    });
  } },
  B: { label: "잉어 · 길고 낮은 등지느러미", draw(g, x, y, h, o) {
    fishFrame(g, x, y, h, o, (u, col, wag) => {
      tailFin(g, u, col, -27, 0, wag, 13, 11, 0.4);
      bz(g, [[-10, -9], [-6, -17, 6, -18, 12, -9]], col, u);
      bz(g, [[28, 0], [26, -8, 10, -12, -4, -11], [-14, -10, -22, -6, -28, -2], [-28, 2], [-22, 6, -14, 10, -4, 11], [10, 12, 26, 8, 28, 0]], col, u);
      bz(g, [[8, 8], [6, 14, -1, 16, -4, 12]], col, u);
      ellipse(g, 12 * u, 5 * u, 6 * u, 2.6 * u, { fill: col }, 0.6);
      fEye(g, u, 20, -3);
      line(g, [[27 * u, 2 * u], [31 * u, 5 * u]], { lw: LINE * 0.8 });
    });
  } },
  C: { label: "엔젤피시 · 키 큰 지느러미", draw(g, x, y, h, o) {
    fishFrame(g, x, y, h, o, (u, col, wag) => {
      g.save(); g.translate(-15 * u, 0); g.rotate(wag * 0.6);
      bz(g, [[0, -3], [-5, -6, -8, -9, -11, -11], [-9, -4, -9, 4, -11, 11], [-8, 9, -5, 6, 0, 3]], col, u);
      g.restore();
      bz(g, [[-3, -13], [-2, -24, -7, -34, -14, -42], [-12, -30, -15, -18, -15, -8]], col, u);
      bz(g, [[-3, 13], [-2, 24, -7, 34, -14, 42], [-12, 30, -15, 18, -15, 8]], col, u);
      bz(g, [[15, -2], [11, -12, 2, -16, -5, -14], [-13, -11, -16, -5, -16, 0], [-16, 5, -13, 11, -5, 14], [2, 16, 11, 12, 15, 2]], col, u);
      thick(g, c => { c.moveTo(4 * u, 12 * u); c.quadraticCurveTo(2 * u, 22 * u, -3 * u, 30 * u); }, 1.8 * u, col);
      fEye(g, u, 8, -4);
    });
  } },
  D: { label: "피라미 · 가늘게", draw(g, x, y, h, o) {
    fishFrame(g, x, y, h, o, (u, col, wag) => {
      g.translate(0, 6 * u);
      minnow(g, u, col, 0, 0, 52, wag);
      ellipse(g, 4 * u, 3.5 * u, 4 * u, 1.6 * u, { fill: col }, 0.5);
    });
  } },
  E: { label: "복어 · 둥글게 부풀림", draw(g, x, y, h, o) {
    fishFrame(g, x, y, h, o, (u, col, wag) => {
      tailFin(g, u, col, -15, 1, wag, 9, 7, 0.2);
      bz(g, [[-4, -15], [-2, -21, 4, -21, 6, -15]], col, u);
      circle(g, 0, 0, 16 * u, { fill: col });
      ellipse(g, 12 * u, 3 * u, 6.5 * u, 4.5 * u, { fill: col }, 0.2);
      [[-13, -9, -0.9], [-8, -14, -1.1], [-1, -16, -1.4], [6, -14, -1.8], [11, -10, -2.2], [-15, -3, -0.5], [-14, 6, 0.2], [-9, 12, 0.7], [-2, 15, 1.2], [5, 14, 1.6]].forEach(([px, py, a], i) => {
        const L = (2.4 + (i % 3) * 0.6);
        g.save(); g.translate(px * u, py * u); g.rotate(a + PI);
        tri(g, [-1.6 * u, 0], [1.6 * u, 0], [0, -L * u], col);
        g.restore();
      });
      bz(g, [[4, 7], [7, 11, 3, 14, -1, 10]], col, u);
      fEye(g, u, 8, -5, 2);
    });
  } },
  F: { label: "베타 · 너울거리는 지느러미", draw(g, x, y, h, o) {
    fishFrame(g, x, y, h, o, (u, col, wag) => {
      const t = tt(o), fl = Math.sin(t * 2.1) * 2, fl2 = Math.sin(t * 2.1 + 1.3) * 2;
      g.save(); g.translate(-6 * u, 0); g.rotate(wag * 0.5);
      bz(g, [[0, -3], [-8, -6, -22, -14, -32, -24 + fl], [-36, -12, -37, -4, -38, 0], [-37, 4, -36, 12, -32, 24 - fl], [-22, 14, -8, 6, 0, 3]], col, u);
      g.restore();
      bz(g, [[4, -6], [-2, -12, -12, -16 + fl2, -22, -22], [-16, -12, -10, -6, -4, -5]], col, u);
      bz(g, [[8, 5], [0, 14, -10, 20 - fl2, -20, 24], [-14, 14, -8, 7, -2, 5]], col, u);
      bz(g, [[12, 2], [10, 8, 4, 12, -2, 14 + fl], [2, 8, 4, 4, 6, 2]], col, u);
      ellipse(g, 5 * u, 0, 12 * u, 6.2 * u, { fill: col }, -0.04);
      fEye(g, u, 12, -1.5, 1.5);
    });
  } },
  G: { label: "위에서 본 비단잉어", draw(g, x, y, h, o) {
    fishFrame(g, x, y, h, o, (u, col, wag) => {
      tailFin(g, u, col, -28, 0, wag * 1.3, 12, 9, 0.35);
      [[-1, 1], [1, -1]].forEach(([sy, ro]) => {
        g.save(); g.scale(1, sy);
        bz(g, [[10, 7], [4, 12, -6, 16, -12, 14], [-6, 10, 2, 8, 10, 7]], col, u);
        g.restore();
      });
      bz(g, [[28, 0], [26, -7, 12, -9, -2, -8], [-14, -7, -22, -4, -28, -1.5], [-28, 1.5], [-22, 4, -14, 7, -2, 8], [12, 9, 26, 7, 28, 0]], col, u);
      ellipse(g, 6 * u, -1.5 * u, 7 * u, 4 * u, { fill: ILLO.paper }, 0.15);
      ellipse(g, -14 * u, 1.5 * u, 4 * u, 3 * u, { fill: ILLO.paper }, -0.3);
      fEye(g, u, 21, -4, 1.3); fEye(g, u, 21, 4, 1.3);
    });
  } },
  H: { label: "뛰어오름 · 활처럼", draw(g, x, y, h, o) {
    fishFrame(g, x, y, h, o, (u, col, wag) => {
      g.translate(0, 8 * u);
      const S = [-20, 22, -2, -8, 22, -20];
      const d = qd(S, 0), a = Math.atan2(d[1], d[0]);
      tailFin(g, u, col, S[0], S[1], a + wag * 0.6, 13, 11, 0.5);
      spineBody(g, u, col, S, 8.5);
      const m = qp(S, 0.5), md = qd(S, 0.5), ma = Math.atan2(md[1], md[0]);
      g.save(); g.translate(m[0] * u, m[1] * u); g.rotate(ma);
      bz(g, [[-7, -7], [-4, -12, 3, -12, 7, -7.5]], col, u);
      bz(g, [[6, 6], [6, 11, 1, 13, -3, 9]], col, u);
      g.restore();
      const e = qp(S, 0.88);
      fEye(g, u, e[0] + 1, e[1] - 2.5, 1.5);
      [[-24, 30, 1.6], [-16, 34, 1.1], [-30, 36, 0.9]].forEach(([px, py, r]) => dot(g, px * u, py * u, r * u, col));
    });
  } },
  I: { label: "머리를 아래로", draw(g, x, y, h, o) {
    fishFrame(g, x, y, h, o, (u, col, wag) => {
      const S = [-4, -30, 6, -6, 2, 22];
      const d = qd(S, 0), a = Math.atan2(d[1], d[0]);
      tailFin(g, u, col, S[0], S[1], a + wag * 0.8, 11, 9, 0.4);
      spineBody(g, u, col, S, 9);
      const m = qp(S, 0.5), md = qd(S, 0.5), ma = Math.atan2(md[1], md[0]);
      g.save(); g.translate(m[0] * u, m[1] * u); g.rotate(ma);
      bz(g, [[-7, -8], [-4, -15, 5, -15, 9, -9]], col, u);
      bz(g, [[2, 8], [4, 13, 0, 15, -3, 10]], col, u);
      g.restore();
      const e = qp(S, 0.9);
      fEye(g, u, e[0] + 3, e[1], 1.5);
    });
  } },
  J: { label: "작은 물고기 세 마리", draw(g, x, y, h, o) {
    fishFrame(g, x, y, h, o, (u, col) => {
      const t = tt(o);
      minnow(g, u, col, -14, -12 + Math.sin(t * 1.3) * 1.5, 24, Math.sin(t * 3.4) * 0.2);
      minnow(g, u, col, 10, -2 + Math.sin(t * 1.5 + 1) * 1.5, 22, Math.sin(t * 3.1 + 1.2) * 0.2);
      minnow(g, u, col, -6, 12 + Math.sin(t * 1.4 + 2) * 1.5, 19, Math.sin(t * 3.6 + 2.4) * 0.2);
    });
  } }
}, { color: ILLO.blue });

/* ======================= 토끼 (옆모습, 오른쪽 보기; t = 귀 움찔) =======================
   긴 귀(끝이 둥근), 큰 뒷다리 덩이, 앞으로 뻗는 긴 뒷발, 종이색 꼬리 솜뭉치가 종의 표식이다. */
const puff = (g, x, y, r) => circle(g, x, y, r, { fill: ILLO.paper });
/** 귀: 둥근 끝의 긴 타원. (x, y) 뿌리, L 길이, ang 방향(-PI/2 = 위), w 너비 비율 */
function ear(g, u, col, x, y, L, ang, w = 0.3) {
  ellipse(g, (x + Math.cos(ang) * L / 2) * u, (y + Math.sin(ang) * L / 2) * u, L / 2 * u, L * w / 2 * u, { fill: col }, ang);
}
/** 토끼 머리: 타원 + 볼 + 눈(종이색 점). tilt 는 코 방향(+면 아래) */
function rabHead(g, u, col, x, y, { tilt = 0, r = 10, eye = true } = {}) {
  g.save(); g.translate(x * u, y * u); g.rotate(tilt);
  ellipse(g, 0, 0, r * 1.1 * u, r * 0.82 * u, { fill: col }, -0.12);
  circle(g, -r * 0.45 * u, r * 0.2 * u, r * 0.6 * u, { fill: col });
  ellipse(g, r * 0.85 * u, r * 0.05 * u, r * 0.4 * u, r * 0.34 * u, { fill: col }, 0.2);
  if (eye) dot(g, r * 0.42 * u, -r * 0.18 * u, r * 0.14 * u, ILLO.paper);
  g.restore();
}
/** 앞으로 뻗은 긴 뒷발 */
const hindFoot = (g, u, col, x, y, L = 12) => ellipse(g, x * u, (y - 2.4) * u, L * u, 2.6 * u, { fill: col });

reg("rabbit", "토끼", [], {
  A: { label: "앉아서 경계 · 귀 쫑긋", draw(g, x, y, h, o) {
    const u = h / 84, col = o.color || TONE[4], tw = Math.sin(tt(o) * 1.7) * 0.03;
    g.save(); g.translate(x, y);
    ear(g, u, col, 11, -45, 27, -PI * 0.56 + tw, 0.3);
    ear(g, u, col, 15, -44, 25, -PI * 0.43 - tw, 0.3);
    ellipse(g, -8 * u, -16 * u, 18 * u, 15.5 * u, { fill: col }, -0.05);
    bz(g, [[-18, -28], [-8, -40, 4, -42, 14, -38], [22, -34, 22, -20, 18, -4], [16, 0], [-10, 0]], col, u);
    hindFoot(g, u, col, 2, 0, 13);
    tube(g, [[12 * u, -14 * u], [13 * u, -3 * u]], { color: col, w: 4.5 * u });
    tube(g, [[18 * u, -13 * u], [19 * u, -3 * u]], { color: col, w: 4 * u });
    rabHead(g, u, col, 14, -40, { tilt: -0.1 });
    puff(g, -25 * u, -15 * u, 4.2 * u);
    g.restore();
  } },
  B: { label: "웅크림 · 귀 뒤로", draw(g, x, y, h, o) {
    const u = h / 84, col = o.color || TONE[4], tw = Math.sin(tt(o) * 1.4) * 0.025;
    g.save(); g.translate(x, y);
    ear(g, u, col, 14, -22, 25, -PI * 0.9 + tw, 0.28);
    ear(g, u, col, 16, -19, 22, -PI * 0.97 - tw, 0.28);
    bz(g, [[-28, -6], [-30, -18, -14, -26, 2, -25], [14, -24, 24, -20, 28, -12], [30, -6, 26, 0, 20, 0], [-22, 0], [-28, 0, -29, -2, -28, -6]], col, u);
    hindFoot(g, u, col, 8, 0, 10);
    rabHead(g, u, col, 23, -19, { tilt: 0.12, r: 9 });
    puff(g, -26 * u, -8 * u, 3.6 * u);
    g.restore();
  } },
  C: { label: "뛰는 중 · 쭉 뻗음", draw(g, x, y, h, o) {
    const u = h / 84, col = o.color || TONE[4], tw = Math.sin(tt(o) * 1.6) * 0.03;
    g.save(); g.translate(x, y - 8 * u);
    ear(g, u, col, 22, -44, 22, -PI * 0.86 + tw, 0.3);
    ear(g, u, col, 25, -42, 20, -PI * 0.96 - tw, 0.3);
    ellipse(g, -17 * u, -30 * u, 11 * u, 9.5 * u, { fill: col }, -0.3);
    tube(g, [[-18 * u, -28 * u], [-34 * u, -13 * u]], { color: col, w: 6.5 * u });
    ellipse(g, -36 * u, -11 * u, 8 * u, 3 * u, { fill: col }, -0.6);
    bz(g, [[-26, -26], [-22, -40, 0, -46, 16, -42], [26, -40, 30, -34, 28, -26], [24, -18, 6, -18, -8, -20], [-20, -22, -26, -22, -26, -26]], col, u);
    tube(g, [[14 * u, -26 * u], [28 * u, -12 * u]], { color: col, w: 4.5 * u });
    tube(g, [[10 * u, -24 * u], [20 * u, -10 * u]], { color: col, w: 4 * u });
    rabHead(g, u, col, 27, -38, { tilt: -0.28, r: 9.5 });
    puff(g, -27 * u, -32 * u, 4 * u);
    g.restore();
  } },
  D: { label: "뒷다리로 일어섬", draw(g, x, y, h, o) {
    const u = h / 84, col = o.color || TONE[4], tw = Math.sin(tt(o) * 1.7) * 0.03;
    g.save(); g.translate(x, y);
    ear(g, u, col, 3, -62, 25, -PI * 0.56 + tw, 0.3);
    ear(g, u, col, 7, -61, 23, -PI * 0.42 - tw, 0.3);
    ellipse(g, -5 * u, -12 * u, 14 * u, 11.5 * u, { fill: col });
    bz(g, [[-16, -12], [-16, -34, -8, -52, 2, -58], [10, -60, 14, -48, 14, -34], [14, -22, 12, -8, 10, -2], [10, 0], [-10, 0]], col, u);
    hindFoot(g, u, col, 4, 0, 13);
    tube(g, [[9 * u, -40 * u], [15 * u, -34 * u]], { color: col, w: 4 * u });
    tube(g, [[10 * u, -35 * u], [15 * u, -30 * u]], { color: col, w: 3.6 * u });
    rabHead(g, u, col, 7, -57, { tilt: -0.15, r: 9.5 });
    puff(g, -18 * u, -9 * u, 3.6 * u);
    g.restore();
  } },
  E: { label: "앞발로 세수", draw(g, x, y, h, o) {
    const u = h / 84, col = o.color || TONE[4], tw = Math.sin(tt(o) * 1.5) * 0.025, wash = Math.sin(tt(o) * 4) * 1.5;
    g.save(); g.translate(x, y);
    ear(g, u, col, 10, -34, 25, -PI * 0.74 + tw, 0.3);
    ear(g, u, col, 14, -32, 23, -PI * 0.84 - tw, 0.3);
    ellipse(g, -10 * u, -15 * u, 18 * u, 15 * u, { fill: col }, -0.05);
    bz(g, [[-20, -26], [-12, -38, 0, -40, 10, -36], [16, -32, 16, -20, 14, -4], [12, 0], [-12, 0]], col, u);
    hindFoot(g, u, col, 0, 0, 12);
    rabHead(g, u, col, 20, -27, { tilt: 0.7, r: 9.5, eye: false });
    tube(g, [[8 * u, -12 * u], [22 * u + wash, -20 * u]], { color: col, w: 4.2 * u });
    tube(g, [[13 * u, -11 * u], [27 * u - wash, -17 * u]], { color: col, w: 3.8 * u });
    puff(g, -25 * u, -14 * u, 4 * u);
    g.restore();
  } },
  F: { label: "귀 하나는 서고 하나는 접힘", draw(g, x, y, h, o) {
    const u = h / 84, col = o.color || TONE[4], tw = Math.sin(tt(o) * 1.6) * 0.035;
    g.save(); g.translate(x, y);
    ear(g, u, col, 9, -40, 27, -PI * 0.52 + tw, 0.3);
    ear(g, u, col, 16, -38, 22, PI * 0.12 - tw * 0.5, 0.32);
    bz(g, [[-26, -8], [-28, -22, -14, -32, 0, -32], [14, -32, 22, -26, 24, -14], [25, -6, 22, 0, 16, 0], [-20, 0], [-26, 0, -27, -3, -26, -8]], col, u);
    hindFoot(g, u, col, 6, 0, 10);
    rabHead(g, u, col, 15, -35, { tilt: -0.05, r: 9.8 });
    puff(g, -25 * u, -10 * u, 3.8 * u);
    g.restore();
  } },
  G: { label: "풀 뜯기 · 코를 땅에", draw(g, x, y, h, o) {
    const u = h / 84, col = o.color || TONE[4], tw = Math.sin(tt(o) * 1.5) * 0.03, nib = Math.sin(tt(o) * 5) * 0.03;
    g.save(); g.translate(x, y);
    ear(g, u, col, 14, -22, 24, -PI * 0.72 + tw, 0.28);
    ear(g, u, col, 18, -20, 22, -PI * 0.6 - tw, 0.28);
    bz(g, [[-24, -8], [-30, -22, -16, -32, 0, -31], [12, -30, 22, -26, 26, -16], [28, -10, 26, -4, 24, -2], [22, 0], [-16, 0], [-24, 0, -26, -3, -24, -8]], col, u);
    hindFoot(g, u, col, -6, 0, 11);
    tube(g, [[14 * u, -10 * u], [15 * u, -3 * u]], { color: col, w: 4.5 * u });
    tube(g, [[20 * u, -9 * u], [22 * u, -3 * u]], { color: col, w: 4 * u });
    rabHead(g, u, col, 26, -13, { tilt: 0.85 + nib, r: 9.5 });
    lf(g, 40 * u, 0, 8 * u, -PI * 0.55, col, { w: 0.5 });
    lf(g, 42 * u, 0, 6 * u, -PI * 0.35, col, { w: 0.5 });
    puff(g, -26 * u, -12 * u, 4 * u);
    g.restore();
  } },
  H: { label: "둥글게 말고 잠", draw(g, x, y, h, o) {
    const u = h / 84, col = o.color || TONE[4], br = 1 + Math.sin(tt(o) * 1.3) * 0.015;
    g.save(); g.translate(x, y);
    g.save(); g.scale(1, br);
    bz(g, [[-24, -6], [-28, -18, -14, -25, -2, -25], [10, -25, 18, -21, 22, -12], [24, -5, 20, 0, 14, 0], [-18, 0], [-24, 0, -25, -3, -24, -6]], col, u);
    g.restore();
    ear(g, u, col, 12, -22, 25, -PI * 0.9, 0.3);
    ear(g, u, col, 14, -19, 23, -PI * 0.96, 0.3);
    rabHead(g, u, col, 20, -11, { tilt: 0.45, r: 9, eye: false });
    puff(g, -22 * u, -7 * u, 3.6 * u);
    g.restore();
  } },
  I: { label: "뒷모습 · 솜꼬리", draw(g, x, y, h, o) {
    const u = h / 84, col = o.color || TONE[4], tw = Math.sin(tt(o) * 1.6) * 0.03;
    g.save(); g.translate(x, y);
    ear(g, u, col, -5, -34, 26, -PI * 0.6 + tw, 0.3);
    ear(g, u, col, 5, -34, 25, -PI * 0.42 - tw, 0.3);
    bz(g, [[-19, -10], [-20, -28, -10, -38, 0, -38], [10, -38, 20, -28, 19, -10], [18, -2, 12, 0, 0, 0], [-12, 0, -18, -2, -19, -10]], col, u);
    circle(g, 0, -34 * u, 11 * u, { fill: col });
    ellipse(g, -10 * u, -2.4 * u, 7.5 * u, 2.6 * u, { fill: col });
    ellipse(g, 10 * u, -2.4 * u, 7 * u, 2.6 * u, { fill: col });
    puff(g, 1 * u, -8 * u, 5 * u);
    g.restore();
  } },
  J: { label: "아기 토끼 · 작게", draw(g, x, y, h, o) {
    const u = h / 84, col = o.color || TONE[4], tw = Math.sin(tt(o) * 2) * 0.04;
    g.save(); g.translate(x, y);
    ear(g, u, col, 7, -19, 14, -PI * 0.6 + tw, 0.38);
    ear(g, u, col, 10, -18, 13, -PI * 0.42 - tw, 0.38);
    ellipse(g, -2 * u, -9 * u, 13 * u, 9 * u, { fill: col }, -0.05);
    hindFoot(g, u, col, 2, 0, 8);
    rabHead(g, u, col, 9, -16, { tilt: -0.05, r: 7.5 });
    puff(g, -14 * u, -8 * u, 2.6 * u);
    g.restore();
  } }
}, { color: TONE[4] });

/* ======================= 올빼미 ======================= */
function owlEyes(g, u, col, ex, ey, r1, r2, gap) {
  circle(g, ex - gap * u, ey, r1 * u, { fill: ILLO.paper });
  circle(g, ex + gap * u, ey + 0.5 * u, r2 * u, { fill: ILLO.paper });
  dot(g, ex - gap * u + 0.6 * u, ey, 1.7 * u, col);
  dot(g, ex + gap * u + 0.6 * u, ey + 0.5 * u, 1.6 * u, col);
}
function owlTufts(g, u, col, cx, cy, k = 1) {
  tri(g, [cx - 12 * u, cy], [cx - 16 * u, cy - 12 * u * k], [cx - 5 * u, cy - 4 * u], col);
  tri(g, [cx + 10 * u, cy], [cx + 15 * u, cy - 11 * u * k], [cx + 4 * u, cy - 4 * u], col);
}
reg("owl", "올빼미", [], {
  A: { label: "둥근 달걀 몸 · 가지 위", draw(g, x, y, h, o) {
    const u = h / 84, col = o.color || TONE[4], blink = ((tt(o) * 0.5) % 1) > 0.94;
    g.save(); g.translate(x, y - 8 * u);
    twig(g, u, 0, 0.07);
    line(g, [[-5 * u, -8 * u], [-6 * u, -1 * u]]); line(g, [[4 * u, -8 * u], [5 * u, -1 * u]]);
    owlTufts(g, u, col, 0, -50 * u);
    blob(g, [[0, -58 * u], [12 * u, -52 * u], [17 * u, -30 * u], [13 * u, -8 * u], [0, -4 * u], [-14 * u, -8 * u], [-17 * u, -30 * u], [-12 * u, -52 * u]], col);
    if (!blink) owlEyes(g, u, col, 0, -44 * u, 5, 4.6, 6.5);
    g.restore();
  } },
  B: { label: "길쭉한 몸 · 살짝 기움", draw(g, x, y, h, o) {
    const u = h / 84, col = o.color || TONE[4], blink = ((tt(o) * 0.45 + 0.3) % 1) > 0.94;
    g.save(); g.translate(x, y - 8 * u);
    twig(g, u, 0, 0.1);
    line(g, [[-3 * u, -8 * u], [-4 * u, -1 * u]]); line(g, [[5 * u, -8 * u], [6 * u, -1 * u]]);
    g.save(); g.rotate(0.06);
    owlTufts(g, u, col, 0, -62 * u, 1.3);
    ellipse(g, 0, -36 * u, 12.5 * u, 32 * u, { fill: col });
    if (!blink) owlEyes(g, u, col, 0, -56 * u, 4.2, 4, 5.2);
    g.restore(); g.restore();
  } },
  C: { label: "고개 갸웃 · 눈 높이 다르게", draw(g, x, y, h, o) {
    const u = h / 84, col = o.color || TONE[4], blink = ((tt(o) * 0.55 + 0.6) % 1) > 0.94;
    g.save(); g.translate(x, y - 8 * u);
    twig(g, u, 0, 0.05);
    line(g, [[-4 * u, -8 * u], [-5 * u, -1 * u]]); line(g, [[5 * u, -8 * u], [6 * u, -1 * u]]);
    blob(g, [[2 * u, -52 * u], [14 * u, -46 * u], [17 * u, -28 * u], [12 * u, -8 * u], [0, -4 * u], [-13 * u, -8 * u], [-17 * u, -28 * u], [-13 * u, -46 * u]], col);
    g.save(); g.translate(0, -44 * u); g.rotate(-0.22);
    owlTufts(g, u, col, 0, -6 * u);
    circle(g, 0, 0, 15 * u, { fill: col });
    if (!blink) owlEyes(g, u, col, 0, 0, 5, 4.4, 6.5);
    g.restore(); g.restore();
  } }
}, { color: TONE[4] });
