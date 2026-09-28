/* ============================================================
   동물 실루엣 — PhyloPic(CC0) 벡터를 톤이나 강조색 한 가지로 칠해 그린다.
   - drawAnimal(g, name, x, y, h, { color, flip, angle, alpha }): 캔버스. (x, y)는 발/아래 가운데, h는 높이
   - animalSVG(name, { color, flip }): SVG 문자열 (DOM)
   - ANIMAL_NAMES: sparrow-fly, sparrow, pigeon, cat-sit, cat, rabbit, dog-sit, fish, bee, ladybug
   ============================================================ */
import { ANIMALS } from "../illo/animals-parts.js";
import { TONE } from "./draw.js";

export const ANIMAL_NAMES = Object.keys(ANIMALS);

const pathCache = new Map();
function paths(name) {
  if (!pathCache.has(name)) pathCache.set(name, ANIMALS[name].paths.map(d => new Path2D(d)));
  return pathCache.get(name);
}

/** 캔버스에 그린다. 기본 색은 TONE[5](진한 회갈색). angle은 라디안, flip은 좌우 뒤집기 */
export function drawAnimal(g, name, x, y, h, { color = TONE[5], flip = false, angle = 0, alpha = 1, anchor = "bottom" } = {}) {
  const a = ANIMALS[name]; if (!a) return;
  const s = h / a.h, w = a.w * s;
  g.save();
  g.globalAlpha = alpha;
  g.translate(x, y); g.rotate(angle);
  if (flip) g.scale(-1, 1);
  g.translate(-w / 2, anchor === "center" ? -h / 2 : -h);
  g.scale(s, s);
  g.translate(a.tx, a.ty); g.scale(a.sx, a.sy);
  g.fillStyle = color;
  for (const p of paths(name)) g.fill(p);
  g.restore();
}
/** 완전한 SVG 문자열 */
export function animalSVG(name, { color = TONE[5], flip = false } = {}) {
  const a = ANIMALS[name]; if (!a) return "";
  const flipT = flip ? `translate(${a.w},0) scale(-1,1) ` : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${a.w} ${a.h}"><g transform="${flipT}translate(${a.tx},${a.ty}) scale(${a.sx},${a.sy})" fill="${color}">${a.paths.map(d => `<path d="${d}"/>`).join("")}</g></svg>`;
}
/** 가로세로 비율 (w/h) */
export const animalRatio = name => ANIMALS[name] ? ANIMALS[name].w / ANIMALS[name].h : 1;
