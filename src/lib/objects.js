/* ============================================================
   사물 카탈로그 — 사람을 뺀 모든 그림(동물 · 식물 · 사물 · 장면 요소)을 여기 등록한다.
   각 사물은 타입(변형) 여러 개를 갖고, 검사 페이지(/objects.html)에서 하나를 고른다.
   고른 값은 src/lib/objects/picks.js 에 확정되며 drawObject 는 그 타입을 기본으로 쓴다.

   등록:   registerObject("balloon", { label: "풍선", demos: ["press-and-hold"],
             variants: { A: { label: "둥근", draw(g, x, y, h, o) {...} }, B: {...}, C: {...} } })
   그리기: drawObject(g, "balloon", x, y, h, { variant, color, accent, flip, angle, alpha, t, state })
           (x, y)는 아래 가운데, h는 높이. 색은 o.color(주색)와 o.accent(상태 강조색)만 쓴다.
   ============================================================ */
import { PICKS, APPROVED_ALL } from "./objects/picks.js";
export { PICKS, APPROVED_ALL };

export const OBJECTS = {};
export function registerObject(name, def) { OBJECTS[name] = def; }

export function drawObject(g, name, x, y, h, o = {}) {
  const def = OBJECTS[name]; if (!def) return false;
  const key = o.variant || PICKS[name] || Object.keys(def.variants)[0];
  const v = def.variants[key] || def.variants[Object.keys(def.variants)[0]];
  g.save();
  if (o.alpha != null) g.globalAlpha = o.alpha;
  g.translate(x, y);
  if (o.angle) g.rotate(o.angle);
  if (o.flip) g.scale(-1, 1);
  // 등록 시 준 기본색(def.color)을 검사 페이지와 같게 기본으로 쓴다.
  v.draw(g, 0, 0, h, { t: 0, state: 0, color: def.color, ...o });
  g.restore();
  return true;
}
export const objectNames = () => Object.keys(OBJECTS);

/**
 * DOM 데모용: 사물을 그린 <canvas> 요소를 만든다 (레티나 대응). 사물은 아래 가운데 정렬, 높이 h.
 * w를 주지 않으면 h와 같은 정사각형(넓은 사물은 w를 준다). pad는 아래 여백(px).
 */
export function objectCanvas(name, h, o = {}, { w = null, pad = 4 } = {}) {
  const W = Math.round(w || h), H = Math.round(h + pad * 2);
  const dpr = window.devicePixelRatio || 1;
  const cv = document.createElement("canvas");
  cv.width = W * dpr; cv.height = H * dpr;
  cv.style.width = W + "px"; cv.style.height = H + "px"; cv.style.display = "block";
  const g = cv.getContext("2d"); g.scale(dpr, dpr);
  drawObject(g, name, W / 2, H - pad, h, o);
  return cv;
}
/** 데이터 URL (배경 이미지나 <img>에 쓸 때) */
export function objectDataURL(name, h, o = {}, opts = {}) { return objectCanvas(name, h, o, opts).toDataURL(); }
