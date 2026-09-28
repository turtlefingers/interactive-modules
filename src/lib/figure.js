/* ============================================================
   사람 그림 — Humaaans(Pablo Stanley, CC BY 4.0) 부품을 조합해 우리 팔레트로 칠한다.
   - humaaanSVG(opts): SVG 문자열 (DOM에 바로 넣는다)
   - drawHumaaan(g, opts, x, y, h): 캔버스에 그린다 (SVG를 이미지로 캐시)
   - PEOPLE: 미리 조합해 둔 사람들

   opts: { head, torso, bottom, posture: "standing"|"sitting", colors: {skin, cloth, ...}, flip }
   부품 이름은 NAMES 에서 고른다.
   ============================================================ */
import { HEAD, TORSO, STANDING, SITTING, NAMES } from "../illo/humaaans-parts.js";
import { ILLO, TONE } from "./draw.js";

export { NAMES };

/** 기본 팔레트. 한 사람에 색은 옷 한 가지 정도만 쓴다 */
export const FIG = {
  skin: ILLO.skin, skin2: "#e2b79c", hair: ILLO.ink,
  cloth: ILLO.blue, cloth2: "#2f57b8",
  light: TONE[1], light2: TONE[2], light3: TONE[3], dark: TONE[4], paper: ILLO.paper,
  acc: ILLO.orange, acc2: "#c95d1c"
};
/** 옷 색 하나로 어울리는 세트를 만든다 */
export function outfit(cloth, { pants = null, acc = null } = {}) {
  const shade = c => mix(c, "#000000", 0.22);
  const o = { cloth, cloth2: shade(cloth) };
  if (pants) { o.light = pants; o.light2 = shade(pants); o.light3 = shade(shade(pants)); }
  if (acc) { o.acc = acc; o.acc2 = shade(acc); }
  return o;
}
function mix(a, b, t) {
  const p = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const [r1, g1, b1] = p(a), [r2, g2, b2] = p(b);
  const c = v => Math.round(v).toString(16).padStart(2, "0");
  return `#${c(r1 + (r2 - r1) * t)}${c(g1 + (g2 - g1) * t)}${c(b1 + (b2 - b1) * t)}`;
}

export const VIEW = { standing: { w: 380, h: 480, adj: 31 }, sitting: { w: 380, h: 400, adj: 24 } };

/** 미리 조합한 사람들 */
export const PEOPLE = [
  { head: "Short", torso: "TurtleNeck", bottom: "SkinnyJeans", colors: outfit(ILLO.blue) },
  { head: "Pony", torso: "LongSleeve", bottom: "Skirt", colors: outfit(ILLO.orange) },
  { head: "Curly", torso: "Hoodie", bottom: "Jogging", colors: outfit(ILLO.green) },
  { head: "ShortBeard", torso: "Jacket", bottom: "SkinnyJeansWalk", colors: outfit(TONE[3], { pants: ILLO.blue }) },
  { head: "Airy", torso: "PointingUp", bottom: "Shorts", colors: outfit(ILLO.pink) },
  { head: "Afro", torso: "TrenchCoat", bottom: "BaggyPants", colors: outfit(ILLO.yellow) },
  { head: "Hijab", torso: "LongSleeve", bottom: "SkinnyJeans", colors: outfit(ILLO.lilac) },
  { head: "Top", torso: "Jacket2", bottom: "Sprint", colors: outfit(ILLO.red) }
];

const fill = (frag, colors) => frag.replace(/\{\{(\w+)\}\}/g, (_, k) => colors[k] || FIG[k]);

/** 조립된 <g> 조각 (viewBox 0 0 380 480|400 기준) */
export function humaaanInner({ head = "Short", torso = "TurtleNeck", bottom = "SkinnyJeans", posture = "standing", colors = {}, flip = false } = {}) {
  const V = VIEW[posture], B = posture === "sitting" ? SITTING : STANDING;
  const c = { ...FIG, ...colors };
  const flipT = flip ? `translate(${V.w / 2}, 0) scale(-1, 1) translate(${-V.w / 2}, 0)` : "";
  return `<g fill-rule="evenodd" transform="${flipT} translate(40, ${V.adj})">
    <g transform="translate(82, 0)">${fill(HEAD[head] || "", c)}</g>
    <g transform="translate(0, 187)">${fill(B[bottom] || "", c)}</g>
    <g transform="translate(22, 82)">${fill(TORSO[torso] || "", c)}</g></g>`;
}
/** 완전한 SVG 문자열 */
export function humaaanSVG(opts = {}) {
  const V = VIEW[opts.posture || "standing"];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${V.w} ${V.h}">${humaaanInner(opts)}</svg>`;
}

/* ---------- 캔버스용 이미지 캐시 ---------- */
const cache = new Map();
export function humaaanImage(opts = {}) {
  const key = JSON.stringify(opts);
  let e = cache.get(key);
  if (e) return e;
  const svg = humaaanSVG(opts);
  const img = new Image();
  e = { img, ready: false, w: VIEW[opts.posture || "standing"].w, h: VIEW[opts.posture || "standing"].h };
  img.onload = () => { e.ready = true; };
  img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  cache.set(key, e);
  return e;
}
/**
 * 캔버스에 그린다. (x, y)는 발바닥 가운데, h는 그릴 높이(px).
 * 그림의 실제 발 위치는 viewBox 아래쪽 여백 때문에 h의 약 97% 지점이다.
 */
export function drawHumaaan(g, opts, x, y, h, { alpha = 1, rotate = 0, squash = 0 } = {}) {
  const e = humaaanImage(opts);
  if (!e.ready) return false;
  const scale = h / e.h, w = e.w * scale;
  g.save();
  g.globalAlpha = alpha;
  g.translate(x, y); g.rotate(rotate); g.scale(1 + squash * 0.5, 1 - squash);
  g.drawImage(e.img, -w / 2, -h * 0.985, w, h);
  g.restore();
  return true;
}
/** 여러 조합을 미리 로드해 둔다 */
export function preload(list = PEOPLE) { list.forEach(p => { humaaanImage(p); humaaanImage({ ...p, flip: true }); }); }
