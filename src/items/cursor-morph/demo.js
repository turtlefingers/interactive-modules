import "../../lib/objects/index.js";
import { clamp, lerp, localPoint } from "../../lib/util.js";
import { ILLO, TONE } from "../../lib/draw.js";
import { objectCanvas } from "../../lib/objects.js";

export default function demo(api) {
  const { el, S } = api;

  api.css(`
    .cursor-morph-root { position: absolute; inset: 0; display: grid; place-items: center; padding: 16px;
      background: var(--board);
      background-image: linear-gradient(var(--grid) 1px, transparent 1px), linear-gradient(90deg, var(--grid) 1px, transparent 1px);
      background-size: 100px 100px; }
    .cursor-morph-root.hide-native, .cursor-morph-root.hide-native * { cursor: none !important; }
    .cursor-morph-sheet { width: min(600px, 100%); background: var(--note); border-radius: var(--r-card); border: 1px solid var(--line);
      padding: 28px; display: flex; flex-direction: column; gap: 22px; }
    .cursor-morph-text { margin: 0; font-size: 18px; line-height: 1.6; color: var(--ink); cursor: text; }
    .cursor-morph-row { display: flex; gap: 14px; align-items: center; flex-wrap: wrap; }
    /* 버튼: 종이색 면 + 1px 톤 테두리. 색은 커서 쪽(잉크·강조색)에만 쓴다 */
    .cursor-morph-btn { font: inherit; font-size: 15px; font-weight: 600; border: 1px solid ${TONE[3]}; background: ${ILLO.paper}; color: var(--ink); cursor: pointer;
      transition: background .2s, color .2s, transform .2s, border-color .2s; }
    .cursor-morph-icon { width: 52px; height: 52px; border-radius: 50%; font-size: 24px; line-height: 1; }
    .cursor-morph-icon:hover { transform: scale(.92); }
    .cursor-morph-pill { height: 44px; padding: 0 22px; border-radius: var(--r-pill); }
    .cursor-morph-pill:hover { background: ${TONE[0]}; }
    .cursor-morph-pill.is-off { background: ${TONE[0]}; border-color: ${TONE[1]}; color: var(--ink-3); cursor: not-allowed; }
    .cursor-morph-link { font-size: 15px; font-weight: 600; color: var(--ink); text-decoration: underline; text-underline-offset: 4px; cursor: pointer; align-self: flex-start; }
    .cursor-morph-photos { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    .cursor-morph-photo { height: 130px; display: grid; place-items: center; cursor: zoom-in; transition: transform .3s; } /* 사진: 카탈로그 photo-placeholder */
    .cursor-morph-photo canvas { pointer-events: none; }
    .cursor-morph-photo:hover { transform: scale(.98); }
    .cursor-morph-cur { position: absolute; left: 0; top: 0; z-index: 45; pointer-events: none; will-change: transform; }
    .cursor-morph-cur.blend { mix-blend-mode: difference; }
    .cursor-morph-arrow { position: absolute; pointer-events: none; } /* 기본 상태의 화살표: 카탈로그 cursor-arrow, 끝점이 포인터에 온다 */
    .cursor-morph-cur.blend .cursor-morph-arrow { filter: invert(1); }
    .cursor-morph-body { position: absolute; left: 0; top: 0; box-sizing: border-box; display: grid; place-items: center; }
    .cursor-morph-label { position: absolute; font-size: 13px; font-weight: 700; white-space: nowrap; color: #fff; }
    .cursor-morph-bar { position: absolute; width: 16px; height: 2.5px; border-radius: 2px; }
    @media (max-width: 600px) { .cursor-morph-sheet { padding: 20px; gap: 16px; } .cursor-morph-text { font-size: 15px; } .cursor-morph-photo { height: 90px; } }
  `);

  const P = "cursor-morph";
  const root = document.createElement("div");
  root.className = `${P}-root`;
  root.innerHTML = `
    <div class="${P}-sheet">
      <p class="${P}-text" data-cm="text">커서를 이 문단 위에 올리면 글자를 고를 수 있는 모양으로 바뀐다. 모양은 뚝 끊기지 않고 녹아들듯 이어진다.</p>
      <div class="${P}-row">
        <button class="${P}-btn ${P}-icon" data-cm="ring" aria-label="추가">＋</button>
        <button class="${P}-btn ${P}-pill" data-cm="wrap">저장하기</button>
        <button class="${P}-btn ${P}-pill is-off" data-cm="deny">사용 불가</button>
      </div>
      <a class="${P}-link" data-cm="link">자세히 보기</a>
      <div class="${P}-photos">
        <div class="${P}-photo" data-cm="view"></div>
        <div class="${P}-photo" data-cm="view"></div>
      </div>
    </div>`;
  el.appendChild(root);
  // 사진 자리: 카탈로그 photo-placeholder(폴라로이드)를 칸 높이에 맞춰 캔버스로 넣는다. 둘째는 좌우 반전으로 변화만 준다
  const photos = [...root.querySelectorAll(`.${P}-photo`)];
  const fitPhotos = () => photos.forEach((ph, i) => {
    const h = Math.max(48, ph.clientHeight - 14);
    ph.replaceChildren(objectCanvas("photo-placeholder", h, { color: TONE[3], flip: i === 1 }, { w: Math.max(h, ph.clientWidth), pad: 6 }));
  });
  fitPhotos();
  api.onResize(fitPhotos);

  const cur = document.createElement("div");
  cur.className = `${P}-cur`;
  cur.innerHTML = `<div class="${P}-body"><span class="${P}-label" data-l="link">열기 ↗</span><span class="${P}-label" data-l="view">보기</span><i class="${P}-bar"></i><i class="${P}-bar"></i></div>`;
  root.appendChild(cur);
  const body = cur.firstChild;
  const labels = { link: body.querySelector('[data-l="link"]'), view: body.querySelector('[data-l="view"]') };
  const bars = [...body.querySelectorAll(`.${P}-bar`)];
  // 기본 상태의 화살표(카탈로그 cursor-arrow). 모핑은 CSS 몸체가 맡고, 화살표는 기본 상태에서만 나타난다.
  // cursor-arrow는 (아래 가운데) 기준 top = -0.66h 에 끝점이 있으므로, 그 끝점이 포인터 위치(0, 0)에 오도록 놓는다
  const AH = 36, AP = 2;
  const arrow = objectCanvas("cursor-arrow", AH, {}, { w: AH, pad: AP });
  arrow.className = `${P}-arrow`;
  arrow.style.left = -AH / 2 + "px";
  arrow.style.top = -(AH + AP * 2 - AP - AH * 0.66) + "px";
  cur.appendChild(arrow);

  const INK = [27, 27, 26], ACC = [255, 90, 54], RED = [224, 69, 123], WHITE = [255, 255, 255];
  const NAMES = { none: "기본 · 화살표", text: "문단 · 글자 커서", ring: "아이콘 버튼 · 커진 링", wrap: "버튼 · 감싸기", deny: "비활성 · 금지 표시", link: "링크 · 라벨 원", view: "사진 · 보기 원" };

  // 현재 모양 (매 프레임 목표값으로 다가간다). arrow = 화살표가 보이는 정도
  const c = { x: 0, y: 0, w: 6, h: 6, r: 3, fill: 1, ring: 0, rot: 0, col: INK.slice(), link: 0, view: 0, bar: 0, arrow: 1, alpha: 0, press: 1 };
  const ptr = { x: -100, y: -100, inside: false, down: false, zone: null, kind: "none" };
  let d0 = 1, lastKind = "none", seen = false;

  const applyNative = () => root.classList.toggle("hide-native", !S.native);
  const applyBlend = () => cur.classList.toggle("blend", !!S.blend);
  applyNative(); applyBlend();
  api.onParam(k => { if (k === "native") applyNative(); if (k === "blend") applyBlend(); });

  const target = () => {
    const k = ptr.kind, blend = S.blend;
    // 기본: 화살표 + 끝점의 작은 점. 다른 상태로 가면 화살표는 사라지고 점이 그 모양으로 녹아든다
    const t = { x: ptr.x, y: ptr.y, w: 6, h: 6, r: 3, fill: 1, ring: 0, rot: 0, col: INK, link: 0, view: 0, bar: 0, arrow: 1 };
    if (k !== "none") Object.assign(t, { w: 16, h: 16, r: 8, arrow: 0 });
    if (k === "text") Object.assign(t, { w: 3, h: 30, r: 2, col: INK });
    else if (k === "ring") Object.assign(t, { w: 68, h: 68, r: 34, fill: 0, ring: 2, col: ACC });
    else if (k === "wrap" && ptr.zone) {
      const rr = ptr.zone.getBoundingClientRect(), er = root.getBoundingClientRect();
      const cx = rr.left - er.left + rr.width / 2, cy = rr.top - er.top + rr.height / 2;
      // 버튼 모양으로 달라붙고, 커서 쪽으로 살짝 끌린다
      Object.assign(t, { x: cx + (ptr.x - cx) * 0.12, y: cy + (ptr.y - cy) * 0.12, w: rr.width + 14, h: rr.height + 14, r: (rr.height + 14) / 2, fill: 0, ring: 2, col: ACC });
    }
    else if (k === "deny") Object.assign(t, { w: 36, h: 36, r: 18, fill: 0, ring: 2, rot: 45, col: RED, bar: 1 });
    else if (k === "link") Object.assign(t, { w: 76, h: 76, r: 38, col: ACC, link: 1 });
    else if (k === "view") Object.assign(t, { w: 96, h: 96, r: 48, col: INK, view: 1 });
    if (blend) t.col = WHITE;
    return t;
  };
  const diff = t => Math.abs(t.w - c.w) + Math.abs(t.h - c.h) + Math.abs(t.r - c.r) + Math.abs(t.rot - c.rot) + Math.abs(t.fill - c.fill) * 40 + Math.abs(t.ring - c.ring) * 10;

  const setZone = z => {
    ptr.zone = z;
    ptr.kind = z ? z.dataset.cm : "none";
    if (ptr.kind !== lastKind) { lastKind = ptr.kind; d0 = Math.max(1, diff(target())); }
  };

  api.on(root, "pointermove", e => {
    const p = localPoint(root, e);
    ptr.x = p.x; ptr.y = p.y; ptr.inside = true;
    if (!seen) { seen = true; c.x = p.x; c.y = p.y; }
    setZone(e.target.closest("[data-cm]"));
    api.hideHint();
  });
  api.on(root, "pointerdown", e => {
    const p = localPoint(root, e);
    ptr.x = p.x; ptr.y = p.y; ptr.inside = true; ptr.down = true;
    if (!seen) { seen = true; c.x = p.x; c.y = p.y; }
    setZone(e.target.closest("[data-cm]"));
    if (e.target.closest("a")) e.preventDefault();
    if (ptr.kind === "deny") api.flash("비활성 버튼 · 누를 수 없다", "alt");
  });
  api.on(window, "pointerup", () => { ptr.down = false; });
  api.on(root, "pointerleave", () => { ptr.inside = false; ptr.down = false; setZone(null); });

  api.frame(dt => {
    const t = target();
    const k = 1 - Math.pow(1 - clamp(S.morph, 0.01, 1), dt / 16.67);
    const f = 1 - Math.pow(1 - clamp(S.follow, 0.01, 1), dt / 16.67);
    // 감싸기 상태에서는 따라가는 속도도 모양 변화 속도를 따른다 (버튼으로 빨려 들어가는 느낌)
    const fp = ptr.kind === "wrap" ? Math.min(f, k) : f;
    c.x = lerp(c.x, t.x, fp); c.y = lerp(c.y, t.y, fp);
    for (const key of ["w", "h", "r", "fill", "ring", "rot", "link", "view", "bar", "arrow"]) c[key] = lerp(c[key], t[key], k);
    for (let i = 0; i < 3; i++) c.col[i] = lerp(c.col[i], t.col[i], k);
    c.alpha = lerp(c.alpha, ptr.inside ? 1 : 0, 0.2);
    c.press = lerp(c.press, ptr.down ? 0.82 : 1, 0.3);

    const col = c.col.map(Math.round).join(",");
    cur.style.transform = `translate3d(${c.x}px,${c.y}px,0)`;
    cur.style.opacity = c.alpha.toFixed(3);
    const bs = body.style;
    bs.width = c.w + "px"; bs.height = c.h + "px";
    bs.borderRadius = c.r + "px";
    bs.transform = `translate(-50%,-50%) rotate(${c.rot}deg) scale(${c.press})`;
    bs.background = `rgba(${col},${c.fill.toFixed(3)})`;
    bs.border = `${c.ring.toFixed(2)}px solid rgba(${col},${clamp(c.ring / 2, 0, 1).toFixed(3)})`;
    arrow.style.opacity = c.arrow.toFixed(3);
    labels.link.style.opacity = c.link.toFixed(3);
    labels.view.style.opacity = c.view.toFixed(3);
    labels.link.style.transform = labels.view.style.transform = `rotate(${-c.rot}deg)`;
    labels.link.style.color = labels.view.style.color = S.blend ? "#000" : "#fff";
    bars.forEach((b, i) => { b.style.opacity = c.bar.toFixed(3); b.style.background = `rgb(${col})`; b.style.transform = `rotate(${i * 90}deg) scale(${c.bar})`; });

    const prog = clamp(1 - diff(t) / d0, 0, 1);
    api.read("zone", NAMES[ptr.kind].split(" · ")[0]);
    api.read("pos", ptr.inside ? `${Math.round(ptr.x)}, ${Math.round(ptr.y)}` : "–");
    api.read("size", `${Math.round(c.w)}×${Math.round(c.h)}`);
    api.read("morph", Math.round(prog * 100) + "%");

    if (!ptr.inside) api.status("대기 · 커서가 스테이지 밖에 있다", "idle");
    else if (prog < 0.97) api.status(`모핑 중 → ${NAMES[ptr.kind]}`, "active");
    else api.status(`커서 모양: ${NAMES[ptr.kind]}`, ptr.kind === "none" ? "idle" : "ok");
  });
}
