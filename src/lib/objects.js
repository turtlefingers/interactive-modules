/* ============================================================
   사물 카탈로그 — 사람을 뺀 모든 그림(동물 · 식물 · 사물 · 장면 요소)을 여기 등록한다.
   각 사물은 타입(변형) 여러 개를 갖고, 검사 페이지(/objects.html)에서 하나를 고른다.
   고른 값은 src/lib/objects/picks.js 에 확정되며 drawObject 는 그 타입을 기본으로 쓴다.

   등록:   registerObject("balloon", { label: "풍선", demos: ["press-and-hold"],
             variants: { A: { label: "둥근", draw(g, x, y, h, o) {...} }, B: {...}, C: {...} } })
   그리기: drawObject(g, "balloon", x, y, h, { variant, color, accent, flip, angle, alpha, t, state })
           (x, y)는 아래 가운데, h는 높이. 색은 o.color(주색)와 o.accent(상태 강조색)만 쓴다.
   ============================================================ */
import { PICKS } from "./objects/picks.js";

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
  v.draw(g, 0, 0, h, { t: 0, state: 0, ...o });
  g.restore();
  return true;
}
export const objectNames = () => Object.keys(OBJECTS);
