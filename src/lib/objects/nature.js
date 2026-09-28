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
reg("tree", "나무", ["drop-zone", "easter-egg", "before-after"], {
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
reg("moon", "달", ["easter-egg"], {
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

/* ======================= 고양이 (옆모습, 앉음; t = 꼬리) ======================= */
function catEars(g, u, col, hx, hy, r) {
  tri(g, [hx - r * 0.75, hy - r * 0.6], [hx - r * 0.85, hy - r * 1.75], [hx - r * 0.05, hy - r * 0.95], col);
  tri(g, [hx + r * 0.25, hy - r * 0.9], [hx + r * 0.65, hy - r * 1.7], [hx + r * 0.95, hy - r * 0.5], col);
}
reg("cat", "고양이", ["rub", "easter-egg"], {
  A: { label: "앉아서 꼬리를 앞으로 감음", draw(g, x, y, h, o) {
    const u = h / 84, col = o.color || TONE[5], sw = Math.sin(tt(o) * 1.6) * 3 * u;
    g.save(); g.translate(x, y);
    thick(g, c => { c.moveTo(-22 * u, -12 * u); c.quadraticCurveTo(-36 * u, -4 * u, -22 * u, -2.5 * u); c.quadraticCurveTo(-4 * u, -1 * u, 14 * u + sw, -2.5 * u - sw * 0.3); }, 5 * u, col);
    ellipse(g, -8 * u, -18 * u, 20 * u, 18 * u, { fill: col });
    ellipse(g, 6 * u, -32 * u, 13 * u, 23 * u, { fill: col }, 0.12);
    tube(g, [[11 * u, -24 * u], [12 * u, -2 * u]], { color: col, w: 6 * u });
    tube(g, [[17 * u, -22 * u], [19 * u, -2 * u]], { color: col, w: 5 * u });
    catEars(g, u, col, 16 * u, -56 * u, 11 * u);
    circle(g, 16 * u, -56 * u, 11 * u, { fill: col });
    line(g, [[26 * u, -52 * u], [36 * u, -54 * u]], { lw: LINE * 0.8 });
    g.restore();
  } },
  B: { label: "꼿꼿이 앉아 꼬리를 위로 세움", draw(g, x, y, h, o) {
    const u = h / 84, col = o.color || TONE[5], sw = Math.sin(tt(o) * 1.4) * 4 * u;
    g.save(); g.translate(x, y);
    thick(g, c => { c.moveTo(-20 * u, -14 * u); c.quadraticCurveTo(-34 * u, -20 * u, -32 * u, -40 * u); c.quadraticCurveTo(-31 * u, -52 * u, -24 * u + sw, -58 * u); }, 4.5 * u, col);
    ellipse(g, -6 * u, -16 * u, 18 * u, 16 * u, { fill: col });
    ellipse(g, 4 * u, -38 * u, 12 * u, 28 * u, { fill: col }, 0.05);
    tube(g, [[7 * u, -28 * u], [7 * u, -2 * u]], { color: col, w: 5.5 * u });
    tube(g, [[13 * u, -26 * u], [14 * u, -2 * u]], { color: col, w: 5 * u });
    catEars(g, u, col, 11 * u, -67 * u, 10.5 * u);
    circle(g, 11 * u, -67 * u, 10.5 * u, { fill: col });
    g.restore();
  } },
  C: { label: "식빵 자세 · 낮게 웅크림", draw(g, x, y, h, o) {
    const u = h / 84, col = o.color || TONE[5], sw = Math.sin(tt(o) * 1.3) * 2.5 * u;
    g.save(); g.translate(x, y);
    thick(g, c => { c.moveTo(-26 * u, -12 * u); c.quadraticCurveTo(-36 * u, -6 * u, -28 * u, -2.5 * u); c.quadraticCurveTo(-16 * u, -1.5 * u, -6 * u + sw, -2.5 * u); }, 5 * u, col);
    ellipse(g, 0, -15 * u, 30 * u, 15 * u, { fill: col }, -0.04);
    ellipse(g, 20 * u, -24 * u, 12 * u, 10 * u, { fill: col }, 0.2);
    catEars(g, u, col, 24 * u, -36 * u, 11 * u);
    circle(g, 24 * u, -36 * u, 11 * u, { fill: col });
    line(g, [[34 * u, -32 * u], [44 * u, -33 * u]], { lw: LINE * 0.8 });
    g.restore();
  } }
}, { color: TONE[5] });

/* ======================= 새 (앉은 모습) ======================= */
reg("bird", "새", ["easter-egg"], {
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

/* ======================= 물고기 ======================= */
function fishFrame(g, x, y, h, o, fn) {
  const u = h / 84, col = o.color || ILLO.blue;
  g.save(); g.translate(x, y - 40 * u + Math.sin(tt(o) * 1.1) * 2 * u);
  fn(u, col, Math.sin(tt(o) * 3.2) * 0.16); g.restore();
}
reg("fish", "물고기", ["easter-egg"], {
  A: { label: "통통한 붕어 · 갈래 꼬리", draw(g, x, y, h, o) {
    fishFrame(g, x, y, h, o, (u, col, wag) => {
      g.save(); g.translate(-20 * u, 0); g.rotate(wag);
      shape(g, c => { c.moveTo(0, 0); c.lineTo(-13 * u, -11 * u); c.lineTo(-9 * u, 0); c.lineTo(-13 * u, 11 * u); c.closePath(); }, { fill: col });
      g.restore();
      tri(g, [-5 * u, -10 * u], [3 * u, -17 * u], [9 * u, -9 * u], col);
      ellipse(g, 0, 0, 22 * u, 12 * u, { fill: col });
      tri(g, [-2 * u, 10 * u], [-7 * u, 16 * u], [4 * u, 11 * u], col);
    });
  } },
  B: { label: "길쭉한 몸 · 뾰족한 머리", draw(g, x, y, h, o) {
    fishFrame(g, x, y, h, o, (u, col, wag) => {
      g.save(); g.translate(-25 * u, 0); g.rotate(wag);
      shape(g, c => { c.moveTo(0, 0); c.quadraticCurveTo(-6 * u, -3 * u, -11 * u, -9 * u); c.quadraticCurveTo(-7 * u, 0, -11 * u, 9 * u); c.quadraticCurveTo(-6 * u, 3 * u, 0, 0); }, { fill: col });
      g.restore();
      blob(g, [[29 * u, 0.5 * u], [18 * u, -6.5 * u], [-6 * u, -7.5 * u], [-24 * u, -4 * u], [-25 * u, 3 * u], [-8 * u, 7.5 * u], [16 * u, 6.5 * u]], col);
      shape(g, c => { c.moveTo(-14 * u, -6 * u); c.quadraticCurveTo(-2 * u, -14 * u, 12 * u, -6 * u); c.closePath(); }, { fill: col });
    });
  } },
  C: { label: "몸 높은 돔 · 작은 꼬리", draw(g, x, y, h, o) {
    fishFrame(g, x, y, h, o, (u, col, wag) => {
      g.save(); g.translate(-15 * u, 1 * u); g.rotate(wag);
      shape(g, c => { c.moveTo(0, 0); c.lineTo(-9 * u, -8 * u); c.lineTo(-7 * u, 0); c.lineTo(-9 * u, 8 * u); c.closePath(); }, { fill: col });
      g.restore();
      blob(g, [[22 * u, 2 * u], [14 * u, -10 * u], [0, -19 * u], [-12 * u, -12 * u], [-16 * u, 2 * u], [-8 * u, 14 * u], [8 * u, 13 * u]], col);
      tri(g, [-2 * u, -17 * u], [4 * u, -25 * u], [9 * u, -13 * u], col);
    });
  } }
}, { color: ILLO.blue });

/* ======================= 토끼 (옆모습) ======================= */
const puff = (g, x, y, r) => circle(g, x, y, r, { fill: ILLO.paper });
reg("rabbit", "토끼", ["easter-egg"], {
  A: { label: "앉은 토끼 · 귀 하나는 기움", draw(g, x, y, h, o) {
    const u = h / 84, col = o.color || TONE[4], tw = Math.sin(tt(o) * 1.7) * 0.03;
    g.save(); g.translate(x, y);
    lf(g, 14 * u, -42 * u, 26 * u, -PI * 0.62 + tw, col, { w: 0.3, bulge: 0.5 });
    lf(g, 19 * u, -41 * u, 23 * u, -PI * 0.42 - tw, col, { w: 0.3, bulge: 0.5 });
    ellipse(g, -4 * u, -18 * u, 21 * u, 17 * u, { fill: col }, -0.05);
    ellipse(g, 6 * u, -2.5 * u, 10 * u, 3 * u, { fill: col });
    circle(g, 16 * u, -34 * u, 10.5 * u, { fill: col });
    puff(g, -22 * u, -14 * u, 4 * u);
    g.restore();
  } },
  B: { label: "웅크린 토끼 · 귀는 뒤로", draw(g, x, y, h, o) {
    const u = h / 84, col = o.color || TONE[4], tw = Math.sin(tt(o) * 1.5) * 0.03;
    g.save(); g.translate(x, y);
    lf(g, 16 * u, -30 * u, 24 * u, -PI * 0.9 + tw, col, { w: 0.3, bulge: 0.5 });
    lf(g, 18 * u, -27 * u, 21 * u, -PI * 0.98 - tw, col, { w: 0.3, bulge: 0.5 });
    ellipse(g, 0, -13 * u, 26 * u, 13 * u, { fill: col }, 0.03);
    circle(g, 21 * u, -22 * u, 9.5 * u, { fill: col });
    puff(g, -25 * u, -9 * u, 3.5 * u);
    g.restore();
  } },
  C: { label: "일어선 토끼 · 길게", draw(g, x, y, h, o) {
    const u = h / 84, col = o.color || TONE[4], tw = Math.sin(tt(o) * 1.6) * 0.03;
    g.save(); g.translate(x, y);
    lf(g, 4 * u, -59 * u, 27 * u, -PI * 0.56 + tw, col, { w: 0.28, bulge: 0.5 });
    lf(g, 9 * u, -59 * u, 24 * u, -PI * 0.36 - tw, col, { w: 0.28, bulge: 0.5 });
    ellipse(g, 0, -26 * u, 13 * u, 25 * u, { fill: col }, 0.06);
    ellipse(g, 5 * u, -2.5 * u, 12 * u, 3 * u, { fill: col });
    circle(g, 6 * u, -52 * u, 9.5 * u, { fill: col });
    puff(g, -13 * u, -9 * u, 3.5 * u);
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
reg("owl", "올빼미", ["easter-egg"], {
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
