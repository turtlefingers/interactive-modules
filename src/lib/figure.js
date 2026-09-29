/* ============================================================
   사람 그림 — Open Peeps(Pablo Stanley, CC0) 부품을 조합해 잉크 선 + 한 색 채움으로 그린다.
   - peepSVG(opts): SVG 문자열 (DOM에 바로 넣는다)
   - drawPeep(g, opts, x, y, h, { rotate, squash, alpha }): 캔버스 (SVG를 이미지로 캐시)
   - PEOPLE: 미리 조합해 둔 사람들

   opts: { body, face, hair, accessory, facialHair, colors: { ink, fill, paper }, flip }
   body 이름은 NAMES.standing / NAMES.sitting / NAMES.bust 에서, 나머지는 NAMES.face / hair / accessories / facialHair 에서 고른다.
   ============================================================ */
import { STANDING, SITTING, BUST, FACE, HAIR, ACCESSORIES, FACIALHAIR, NAMES } from "../illo/peeps-parts.js";
import { ILLO, TONE } from "./draw.js";

export { NAMES };

/** 기본 팔레트: 검정 선, 채움은 종이색. fill에 색 하나를 주면 그 사람의 "한 색"이 된다 */
export const FIG = { ink: ILLO.ink, fill: ILLO.paper, paper: ILLO.paper };
/** 한 색 채움 세트 */
export const outfit = fill => ({ fill });

export const PEOPLE = [
  { body: "WalkingBW", face: "Smile", hair: "ShortWavy", colors: outfit(ILLO.blue) },
  { body: "ShirtWB", face: "Calm", hair: "Bun", colors: outfit(ILLO.orange) },
  { body: "EasingBW", face: "Cheeky", hair: "Afro", colors: outfit(ILLO.green) },
  { body: "PointingFingerWB", face: "Smile", hair: "Long", colors: outfit(ILLO.blue) },
  { body: "RestingWB", face: "Calm", hair: "Short", colors: outfit(TONE[2]) },
  { body: "BlazerPantsBW", face: "SmileNM", hair: "MediumBangs", colors: outfit(ILLO.pink) },
  { body: "CrossedArmsWB", face: "Serious", hair: "Turban", colors: outfit(ILLO.lilac) },
  { body: "WalkingFilled", face: "Calm", hair: "ShortCurly", colors: outfit(ILLO.yellow) }
];

const postureOf = body => STANDING[body] ? "standing" : SITTING[body] ? "sitting" : BUST[body] ? "bust" : "standing";
const partOf = body => STANDING[body] || SITTING[body] || BUST[body] || "";
const fill = (frag, c) => frag.replace(/\{\{(\w+)\}\}/g, (_, k) => c[k] || FIG[k]);

/** 조립된 <g> 조각 (Open Peeps 원본 좌표계: 머리는 translate(225 0) 기준) */
export function peepInner({ body = "WalkingBW", face = "Calm", hair = "Short", accessory = "None", facialHair = "None", colors = {} } = {}) {
  const c = { ...FIG, ...colors };
  return `<g>${fill(partOf(body), c)}
    <g transform="translate(225 0)">
      <g>${fill(HAIR[hair] || "", c)}</g>
      <g transform="translate(159 186)">${fill(FACE[face] || "", c)}</g>
      <g transform="translate(123 338)">${fill(FACIALHAIR[facialHair] || "", c)}</g>
      <g transform="translate(47 241)">${fill(ACCESSORIES[accessory] || "", c)}</g>
    </g></g>`;
}

/* ---------- 경계 상자: 포즈마다 한 번 재서 캐시한다 (브라우저에서만) ---------- */
const boxCache = new Map();
const DEFAULT_BOX = { standing: { x: -220, y: -40, w: 1540, h: 3000 }, sitting: { x: -300, y: -40, w: 1800, h: 2600 }, bust: { x: -80, y: -40, w: 1100, h: 1300 } };
export function peepBox(opts) {
  const key = [opts.body, opts.hair, opts.face, opts.accessory, opts.facialHair].join("|");
  if (boxCache.has(key)) return boxCache.get(key);
  let box = DEFAULT_BOX[postureOf(opts.body)];
  if (typeof document !== "undefined") {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "1"); svg.setAttribute("height", "1");
    svg.style.cssText = "position:absolute;left:-9999px;top:-9999px;visibility:hidden";
    svg.innerHTML = peepInner(opts);
    document.body.appendChild(svg);
    try { const b = svg.firstElementChild.getBBox(); if (b.width > 0) box = { x: b.x - 20, y: b.y - 20, w: b.width + 40, h: b.height + 40 }; } catch (e) {}
    svg.remove();
  }
  boxCache.set(key, box);
  return box;
}

/* ---------- 부품 하나만 따로 (모자·안경·수염을 파츠처럼 쓸 때) ----------
   kind: "hair" | "accessory" | "facialHair" | "face". 좌표는 peepInner 와 같다(머리 그룹 translate(225 0) 포함). */
const PART_DICT = { hair: HAIR, accessory: ACCESSORIES, facialHair: FACIALHAIR, face: FACE };
const PART_OFFSET = { hair: [225, 0], accessory: [225 + 47, 241], facialHair: [225 + 123, 338], face: [225 + 159, 186] };
/** 부품 하나의 <g> 조각 (peepInner 좌표계) */
export function peepPartInner(kind, name, colors = {}) {
  const [ox, oy] = PART_OFFSET[kind] || [0, 0];
  return `<g transform="translate(${ox} ${oy})">${fill((PART_DICT[kind] || {})[name] || "", { ...FIG, ...colors })}</g>`;
}
const partBoxCache = new Map();
/** 부품 하나의 경계 상자 (peepInner 좌표계). 브라우저 밖에서는 대략값 */
export function peepPartBox(kind, name) {
  const key = kind + "|" + name;
  if (partBoxCache.has(key)) return partBoxCache.get(key);
  const [ox, oy] = PART_OFFSET[kind] || [0, 0];
  let box = { x: ox, y: oy, w: 400, h: 300 };
  if (typeof document !== "undefined") {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "1"); svg.setAttribute("height", "1");
    svg.style.cssText = "position:absolute;left:-9999px;top:-9999px;visibility:hidden";
    svg.innerHTML = peepPartInner(kind, name);
    document.body.appendChild(svg);
    try { const b = svg.firstElementChild.getBBox(); if (b.width > 0) box = { x: b.x + ox, y: b.y + oy, w: b.width, h: b.height }; } catch (e) {}
    svg.remove();
  }
  partBoxCache.set(key, box);
  return box;
}
/** 부품 하나를 담은 완전한 SVG 문자열. viewBox는 그 부품의 경계 상자(+pad)로, 사람 그림과 같은 선·색이다.
    box: viewBox 를 직접 줄 때(peepInner 좌표), clip: 그 좌표계의 path d — 머리 부품에서 모자만 오려낼 때 쓴다 */
let clipSeq = 0;
export function peepPartSVG(kind, name, { colors = {}, pad = 6, box = null, clip = null } = {}) {
  const b = box || peepPartBox(kind, name);
  const inner = peepPartInner(kind, name, colors);
  const id = clip ? `peep-clip-${++clipSeq}` : "";
  const body = clip ? `<clipPath id="${id}"><path d="${clip}"/></clipPath><g clip-path="url(#${id})">${inner}</g>` : inner;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${b.x - pad} ${b.y - pad} ${b.w + pad * 2} ${b.h + pad * 2}">${body}</svg>`;
}

/** 완전한 SVG 문자열. viewBox는 그 조합의 경계 상자에 맞춘다 (box를 주면 그 상자를 쓴다) */
export function peepSVG(opts = {}, box = null) {
  const b = box || peepBox(opts);
  const flipT = opts.flip ? `transform="translate(${2 * b.x + b.w},0) scale(-1,1)"` : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${b.x} ${b.y} ${b.w} ${b.h}"><g ${flipT}>${peepInner(opts)}</g></svg>`;
}

/* ---------- 캔버스용 이미지 캐시 ---------- */
const cache = new Map();
export function peepImage(opts = {}) {
  const key = JSON.stringify(opts);
  let e = cache.get(key);
  if (e) return e;
  const b = peepBox(opts);
  const img = new Image();
  e = { img, ready: false, w: b.w, h: b.h };
  img.onload = () => { e.ready = true; };
  img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(peepSVG(opts));
  cache.set(key, e);
  return e;
}
/**
 * 캔버스에 그린다. (x, y)는 발바닥 가운데(경계 상자 아래 가운데), h는 그릴 높이(px).
 * 이미지가 준비되기 전에는 false를 돌려준다.
 */
export function drawPeep(g, opts, x, y, h, { alpha = 1, rotate = 0, squash = 0 } = {}) {
  const e = peepImage(opts);
  if (!e.ready) return false;
  const scale = h / e.h, w = e.w * scale;
  g.save();
  g.globalAlpha = alpha;
  g.translate(x, y); g.rotate(rotate); g.scale(1 + squash * 0.5, 1 - squash);
  g.drawImage(e.img, -w / 2, -h, w, h);
  g.restore();
  return true;
}
/** 여러 조합을 미리 로드해 둔다 */
export function preload(list = PEOPLE) { list.forEach(p => { peepImage(p); peepImage({ ...p, flip: true }); }); }
/** 가로세로 비율 (w/h) */
export const peepRatio = opts => { const b = peepBox(opts); return b.w / b.h; };
