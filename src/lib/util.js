/* 데모에서 자주 쓰는 작은 도구들 */

/** 시드 난수: 같은 시드면 항상 같은 배치가 나온다 */
export const rng = seed => () => {
  seed |= 0; seed = seed + 0x6D2B79F5 | 0;
  let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
  t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
  return ((t ^ t >>> 14) >>> 0) / 4294967296;
};
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const mod = (a, n) => ((a % n) + n) % n;
export const dist = (ax, ay, bx, by) => Math.hypot(bx - ax, by - ay);
export const map = (v, a, b, c, d) => c + (d - c) * ((v - a) / (b - a));

/** 데모에서 쓰는 개체 색 (페이퍼 스타일) */
export const PALETTE = ["#ff5a36", "#2e6fd8", "#1f8a62", "#f2b84b", "#8a4fd8", "#e0457b", "#1b1b1a"];
export const PALETTE_SOFT = ["#ffb199", "#8fb8ff", "#9ee0b8", "#ffe3a1", "#d4b8ff", "#ffb3cd", "#6d6a64"];

/** 스테이지 좌표로 변환한 포인터 위치 */
export const localPoint = (el, e) => {
  const r = el.getBoundingClientRect();
  return { x: e.clientX - r.left, y: e.clientY - r.top };
};

/** 캔버스를 만들어 요소에 채운다. 레티나 대응과 리사이즈를 처리한다. */
export function fitCanvas(api, { parent = api.el } = {}) {
  const cv = document.createElement("canvas");
  cv.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block";
  parent.appendChild(cv);
  const g = cv.getContext("2d");
  const size = { w: 0, h: 0, dpr: 1 };
  const resize = () => {
    size.dpr = window.devicePixelRatio || 1;
    size.w = parent.clientWidth; size.h = parent.clientHeight;
    cv.width = Math.round(size.w * size.dpr); cv.height = Math.round(size.h * size.dpr);
    g.setTransform(size.dpr, 0, 0, size.dpr, 0, 0);
  };
  resize();
  api.onResize(resize);
  return { cv, g, size };
}
