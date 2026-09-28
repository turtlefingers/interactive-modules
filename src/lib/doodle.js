/* ============================================================
   동물 · 사물 선 그림 — OpenMoji black(CC BY-SA 4.0) 손그림 선 아이콘.
   사람(Open Peeps)과 같은 "검정 선" 계열이다.
   - doodleSVG(name, { color, lw, flip }): SVG 문자열 (DOM)
   - drawDoodle(g, name, x, y, h, { color, lw, flip, angle, alpha, anchor }): 캔버스 (이미지 캐시)
   - DOODLE_NAMES: cat, bird, dove, fish, bee, ladybug, rabbit, dog, owl, cloud, sun, moon, star, seedling, tree,
     flower, mountain, balloon, cup, house, bulb, box, book, flag, target, heart, key, lock, dice, magnet, pizza,
     chocolate, carrot, earth, hand, eyes … (vendor/openmoji/names.json 참고)
   ============================================================ */
import { DOODLES } from "../illo/doodles-parts.js";
import { ILLO } from "./draw.js";

export const DOODLE_NAMES = Object.keys(DOODLES);
export const hasDoodle = name => !!DOODLES[name];

/** 완전한 SVG 문자열. lw는 72 단위 좌표계 기준 선 굵기(기본 2) */
export function doodleSVG(name, { color = ILLO.ink, lw = 2, flip = false } = {}) {
  const d = DOODLES[name]; if (!d) return "";
  const inner = d.inner.replace(/\{\{ink\}\}/g, color).replace(/\{\{lw\}\}/g, lw);
  const [x, , w] = d.vb.split(/\s+/).map(Number);
  const flipT = flip ? ` transform="translate(${2 * x + w},0) scale(-1,1)"` : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${d.vb}"><g${flipT}>${inner}</g></svg>`;
}

const cache = new Map();
export function doodleImage(name, opts = {}) {
  const key = name + JSON.stringify(opts);
  let e = cache.get(key);
  if (e) return e;
  const img = new Image();
  e = { img, ready: false };
  img.onload = () => { e.ready = true; };
  img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(doodleSVG(name, opts));
  cache.set(key, e);
  return e;
}
/**
 * 캔버스에 그린다. (x, y)는 아래 가운데(anchor "bottom") 또는 중심(anchor "center"), h는 높이(px). 정사각 아이콘이다.
 * 준비되기 전에는 false를 돌려준다.
 */
export function drawDoodle(g, name, x, y, h, { color = ILLO.ink, lw = 2, flip = false, angle = 0, alpha = 1, anchor = "bottom" } = {}) {
  const e = doodleImage(name, { color, lw, flip });
  if (!e.ready) return false;
  g.save();
  g.globalAlpha = alpha;
  g.translate(x, y); g.rotate(angle);
  g.drawImage(e.img, -h / 2, anchor === "center" ? -h / 2 : -h, h, h);
  g.restore();
  return true;
}
export function preloadDoodles(names, opts) { names.forEach(n => doodleImage(n, opts)); }
