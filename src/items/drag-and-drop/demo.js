import { clamp, dist, localPoint } from "../../lib/util.js";
import { ILLO } from "../../lib/draw.js";
import { peepSVG, peepBox, peepPartSVG, peepPartBox, outfit } from "../../lib/figure.js";

export default function demo(api) {
  const { el, S } = api;

  api.css(`
    .drag-and-drop-root { position: absolute; inset: 0; overflow: hidden; background: var(--board); }
    .drag-and-drop-root.is-dragging, .drag-and-drop-root.is-dragging * { cursor: grabbing !important; }
    .drag-and-drop-gridlines { position: absolute; inset: 0; opacity: 0; transition: opacity .3s; pointer-events: none;
      background-image: linear-gradient(rgba(0,0,0,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,.1) 1px, transparent 1px); }
    .drag-and-drop-root.show-grid .drag-and-drop-gridlines { opacity: 1; }
    .drag-and-drop-tray { position: absolute; border: 1px dashed rgba(0,0,0,.2); border-radius: 18px; pointer-events: none; }
    .drag-and-drop-tray span { position: absolute; font-size: 11px; line-height: 1; color: var(--ink-3); letter-spacing: .02em; white-space: nowrap; }
    .drag-and-drop-char { position: absolute; left: 0; top: 0; pointer-events: none; z-index: 1; }
    .drag-and-drop-char svg { display: block; width: 100% !important; height: 100% !important; overflow: visible; }
    .drag-and-drop-part svg { position: absolute; display: block; overflow: visible; }
    .drag-and-drop-slot { position: absolute; left: 0; top: 0; border-radius: 50%; border: 2px dashed var(--ink-3);
      opacity: 0; transform: scale(.7); transition: opacity .2s, transform .25s cubic-bezier(.3,1.6,.5,1), background-color .2s, border-color .2s;
      pointer-events: none; z-index: 2; }
    .drag-and-drop-slot.is-shown { opacity: .55; transform: scale(1); }
    .drag-and-drop-slot.is-hot { opacity: 1; border-color: var(--accent); background: var(--accent-soft); transform: scale(1.12); }
    .drag-and-drop-slot.is-pulse { animation: drag-and-drop-pulse .5s ease-out; }
    @keyframes drag-and-drop-pulse { 0% { opacity: 1; transform: scale(1); border-color: var(--accent); } 100% { opacity: 0; transform: scale(1.6); border-color: var(--accent); } }
    .drag-and-drop-ghost { position: absolute; left: 0; top: 0; border: 2px dashed var(--accent); border-radius: 12px; opacity: 0;
      pointer-events: none; transition: opacity .15s; z-index: 3; }
    .drag-and-drop-ghost.is-shown { opacity: .8; }
    .drag-and-drop-part { position: absolute; left: 0; top: 0; cursor: grab; touch-action: none; }
    .drag-and-drop-root.is-live .drag-and-drop-part { transition: transform .38s cubic-bezier(.3,1.35,.5,1), opacity .3s; }
    .drag-and-drop-part.is-held { transition: none; }
    .drag-and-drop-part.is-held.is-step { transition: transform .08s ease-out; }
    /* 상자 안에서는 조금 크게(TS) 보이고, 자리에 맞춰 붙을 때 사람 그림과 같은 배율(1)로 줄어든다 */
    .drag-and-drop-part-sc { width: 100%; height: 100%; transform-origin: 50% 50%; }
    .drag-and-drop-root.is-live .drag-and-drop-part-sc { transition: transform .3s cubic-bezier(.3,1.25,.5,1); }
    .drag-and-drop-part-in { width: 100%; height: 100%; transition: transform .22s cubic-bezier(.3,1.6,.5,1), filter .22s;
      filter: drop-shadow(0 0 0 rgba(0,0,0,0)); }
    .drag-and-drop-root:not(.is-dragging) .drag-and-drop-part:hover .drag-and-drop-part-in { transform: translateY(-3px); }
    .drag-and-drop-root.lift .drag-and-drop-part.is-held .drag-and-drop-part-in { transform: scale(1.1) rotate(-3deg);
      filter: drop-shadow(0 12px 10px rgba(0,0,0,.2)); }
    .drag-and-drop-root:not(.lift) .drag-and-drop-part .drag-and-drop-part-in { transform: none; }
    .drag-and-drop-part { opacity: 1; }
    .drag-and-drop-root.blend .drag-and-drop-part { mix-blend-mode: multiply; opacity: .78; }
    /* 붙은 파츠: 사람 그림이 그 파츠를 쓴 모습으로 다시 그려지므로 썸네일은 투명해진다(집을 수 있게 자리는 지킨다) */
    .drag-and-drop-root .drag-and-drop-part.is-attached { opacity: 0; }
  `);

  const root = document.createElement("div");
  root.className = "drag-and-drop-root";
  el.appendChild(root);
  const gridEl = document.createElement("div"); gridEl.className = "drag-and-drop-gridlines"; root.appendChild(gridEl);
  const tray = document.createElement("div"); tray.className = "drag-and-drop-tray"; root.appendChild(tray);

  /* ---------- 자리 종류(kind)와 고를 수 있는 파츠 ----------
     자리는 종류마다 하나다(머리 · 눈 · 수염 · 표정). 같은 종류의 파츠를 또 붙이면 앞의 것과 바꿔 끼운다.
     clip: 머리 부품에는 머리통 선이 같이 들어 있어, 모자만 보이도록 오려 낼 선(peepInner 좌표) — 비니는 띠 아랫선, 중절모는 챙 안쪽 곡선(얼굴이 드러나는 선)을 따라 오린다 */
  const KINDS = [
    { kind: "hair", label: "머리", options: [
      { part: "Beanie", name: "비니", cut: b => ({ box: { ...b, h: 180 }, clip: `M${b.x - 40} ${b.y - 40}H${b.x + b.w + 40}V119L${b.x - 40} 239Z` }) },
      { part: "HatHip", name: "중절모", cut: b => ({ box: { ...b, h: 330 - b.y }, clip: "M100 -40H800V292L655 292L618 175L543 190L494 207L445 225L396 250L347 284L297 316L100 330Z" }) },
      { part: "Turban", name: "터번" },
      { part: "Bun", name: "올림머리" },
      { part: "Afro", name: "아프로" }] },
    { kind: "accessory", label: "눈", options: [
      { part: "GlassRound", name: "동그란 안경" },
      { part: "GlassButterfly", name: "나비 안경" },
      { part: "GlassAviator", name: "보잉 안경" },
      { part: "SunglassWayfarer", name: "선글라스" },
      { part: "Eyepatch", name: "안대" }] },
    { kind: "facialHair", label: "수염", options: [
      { part: "Full", name: "덥수룩 수염" },
      { part: "Goatee", name: "염소 수염" },
      { part: "Handlebars", name: "팔자 콧수염" },
      { part: "MoustacheThin", name: "가는 콧수염" }] },
    { kind: "face", label: "표정", options: [
      { part: "SmileBig", name: "활짝" },
      { part: "Awe", name: "놀람" },
      { part: "LoveGrin", name: "반함" },
      { part: "Cute", name: "윙크" }] }
  ];
  const KIND = Object.fromEntries(KINDS.map(k => [k.kind, k]));

  /* ---------- 캐릭터: Open Peeps 사람 (서 있음). 파츠를 붙이면 그 부품을 쓴 모습으로 다시 그린다 ----------
     경계 상자는 기본 모습과 모든 파츠 하나하나를 쓴 모습의 합집합으로 고정해, 어떤 조합에서도 그림이 움직이지 않게 한다
     (부품끼리는 겹치기만 하므로, 조합의 상자는 낱개 상자의 합집합과 같다). 높이 340(배율 1 기준) 상자에 세로 맞춤으로 넣는다 */
  const COLORS = outfit(ILLO.paper);
  const BASE = { body: "RestingBW", face: "Calm", hair: "Short", accessory: "None", facialHair: "None", colors: COLORS };
  const union = (a, b) => { const x = Math.min(a.x, b.x), y = Math.min(a.y, b.y); return { x, y, w: Math.max(a.x + a.w, b.x + b.w) - x, h: Math.max(a.y + a.h, b.y + b.h) - y }; };
  const BOX = KINDS.reduce((acc, k) => k.options.reduce((a, o) => union(a, peepBox({ ...BASE, [k.kind]: o.part })), acc), peepBox(BASE));
  const CH = 340, U = CH / BOX.h, CW = BOX.w * U;    // U: 그림 단위 → 배율 1 px
  const charEl = document.createElement("div");
  charEl.className = "drag-and-drop-char";
  root.appendChild(charEl);
  const worn = {};                                    // kind → 부품 이름 (붙은 것만)
  const renderFigure = () => { charEl.innerHTML = peepSVG({ ...BASE, ...worn }, BOX); };
  renderFigure();

  /* ---------- 파츠: 사람 그림의 부품 그 자체를 잘라 낸 썸네일 (같은 선·같은 색). 스티커만 자리 없는 실루엣 ----------
     썸네일 viewBox 는 그 부품의 경계 상자이고, 붙일 때는 그 상자 가운데(target)에 배율 1로 내려앉아 사람 그림의 부품과 정확히 겹친다
     (그 뒤 그림을 다시 그리고 썸네일은 투명해진다). 집기 쉽도록 상자 둘레에 PAD 를 더한다 */
  const PAD = 10;
  const partDef = (k, o) => {
    const full = peepPartBox(k.kind, o.part);
    const { box, clip } = o.cut ? o.cut(full) : { box: full, clip: null };
    return { id: o.part, name: o.name, kind: k.kind, part: o.part, box, w: box.w * U + PAD * 2, h: box.h * U + PAD * 2,
      target: [(box.x + box.w / 2 - BOX.x) * U, (box.y + box.h / 2 - BOX.y) * U],
      svg: peepPartSVG(k.kind, o.part, { colors: COLORS, pad: 0, box, clip }) };
  };
  /* 자리 고리: 그 종류 파츠들의 상자를 합친 곳의 가운데 */
  KINDS.forEach(k => {
    const b = k.options.map(o => peepPartBox(k.kind, o.part)).reduce(union);
    k.slot = [(b.x + b.w / 2 - BOX.x) * U, (b.y + b.h / 2 - BOX.y) * U];
    k.r = Math.min(Math.max(b.w, b.h) * U * 0.5 + 8, 70);
  });
  const starPath = (cx, cy, r) => Array.from({ length: 10 }, (_, i) => { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; return `${i ? "L" : "M"}${(cx + Math.cos(a) * rr).toFixed(1)} ${(cy + Math.sin(a) * rr).toFixed(1)}`; }).join(" ") + " Z";
  const sticker = (id, name, shape) => ({ id, name, kind: null, w: 34 + PAD * 2, h: 34 + PAD * 2, target: null, svg: `<svg viewBox="0 0 64 64">${shape}</svg>` });
  const STICKERS = [
    sticker("star", "별 스티커", `<path d="${starPath(32, 33, 30)}" fill="${ILLO.orange}"/>`),
    sticker("heart", "하트 스티커", `<path d="M32 56C14 43 5 33 5 22 5 13 12 7 20 7c5 0 9 3 12 7 3-4 7-7 12-7 8 0 15 6 15 15 0 11-9 21-27 34Z" fill="${ILLO.orange}"/>`),
    sticker("dot", "동그라미 스티커", `<circle cx="32" cy="32" r="26" fill="${ILLO.orange}"/>`)
  ];
  const ROWS = [...KINDS.map(k => ({ label: k.label, items: k.options.map(o => partDef(k, o)) })), { label: "스티커", items: STICKERS, max: 1 }];
  const PARTS = ROWS.flatMap(r => r.items);
  const slotCount = KINDS.length;

  let zTop = 40;
  const parts = PARTS.map((d, i) => {
    const node = document.createElement("div");
    node.className = "drag-and-drop-part";
    node.innerHTML = `<div class="drag-and-drop-part-sc"><div class="drag-and-drop-part-in">${d.svg}</div></div>`;
    node.style.zIndex = 10 + i;
    root.appendChild(node);
    return { d, i, node, sc: node.firstElementChild, x: 0, y: 0, attached: false, moved: false, z: 10 + i, svg: node.querySelector("svg") };
  });
  KINDS.forEach(k => { k.slotEl = document.createElement("div"); k.slotEl.className = "drag-and-drop-slot"; root.appendChild(k.slotEl); });
  const rowLabels = ROWS.map(r => { const s = document.createElement("span"); s.textContent = r.label; tray.appendChild(s); return s; });
  const wornPart = kind => parts.find(o => o.attached && o.d.kind === kind);
  /* 붙였다 뗐다: 사람 그림을 다시 그린다 */
  const wear = (p, on) => { if (!p.d.kind) return; if (on) worn[p.d.kind] = p.d.part; else if (worn[p.d.kind] === p.d.part) delete worn[p.d.kind]; renderFigure(); };
  const ghost = document.createElement("div"); ghost.className = "drag-and-drop-ghost"; root.appendChild(ghost);

  /* ---------- 배치 ---------- */
  const L = { s: 1, cx: 0, cy: 0 };
  const toScreen = ([x, y]) => ({ x: L.cx + (x - CW / 2) * L.s, y: L.cy + (y - CH / 2) * L.s });
  const setScale = (p, k) => { p.k = k; p.sc.style.transform = k === 1 ? "none" : `scale(${k})`; };
  const put = (p, x, y) => { p.x = x; p.y = y; p.node.style.transform = `translate(${x - p.d.w * L.s / 2}px, ${y - p.d.h * L.s / 2}px)`; };
  const goHome = p => { p.moved = false; put(p, p.home.x, p.home.y); setScale(p, p.ts); };
  /* 상자 안: 종류마다 한 줄, 줄 머리에 작은 이름표.
     줄마다 상자 폭에 맞는 만큼 크게 보여 준다(상자 안 배율 ts, 최대 TS_MAX). 작은 안경·표정은 크게, 큰 머리는 덜 키운다.
     줄 높이의 합이 상자 높이를 넘으면 모든 줄을 같은 비율로 줄인다 */
  const LABEL = 16, GAP_X = 8, GAP_Y = 8, IN = 14, TS_MAX = 1.8;
  const layoutTray = tr => {
    const iw = tr.w - IN * 2, ih = tr.h - IN * 2;
    const rowW = ROWS.map(r => r.items.reduce((a, d) => a + d.w, 0));
    const rowH = ROWS.map(r => Math.max(...r.items.map(d => d.h)));
    let ks = ROWS.map((r, i) => Math.min((r.max || TS_MAX) * L.s, (iw - GAP_X * (r.items.length - 1)) / rowW[i]));   // px / 배율1 px
    const fixed = ROWS.length * LABEL + GAP_Y * (ROWS.length - 1);
    const need = ks.reduce((a, k, i) => a + rowH[i] * k, 0);
    if (need > ih - fixed) ks = ks.map(k => k * (ih - fixed) / need);
    const used = ks.reduce((a, k, i) => a + rowH[i] * k, 0) + fixed;
    let y = tr.y + IN + Math.max(0, (ih - used) / 2);
    ROWS.forEach((r, i) => {
      const k = ks[i], ts = k / L.s;
      Object.assign(rowLabels[i].style, { left: IN + "px", top: y - tr.y + "px" });
      y += LABEL;
      const gap = Math.min((iw - rowW[i] * k) / (r.items.length - 1), 44 * L.s);
      let x = tr.x + IN + (iw - rowW[i] * k - gap * (r.items.length - 1)) / 2;   // 남는 폭은 줄 가운데로 모은다
      r.items.forEach(d => {
        const p = parts[PARTS.indexOf(d)];
        p.ts = ts;
        p.home = { x: x + d.w * k / 2, y: y + rowH[i] * k / 2 };
        x += d.w * k + gap;
      });
      y += rowH[i] * k + GAP_Y;
    });
  };
  const layout = () => {
    const w = el.clientWidth, h = el.clientHeight;
    let tr;
    if (w >= 640) {
      L.s = clamp(Math.min(h * 0.72 / CH, w * 0.3 / CW), 0.5, 1.4);
      L.cx = w * 0.21; L.cy = h * 0.52;
      const x0 = Math.max(L.cx + CW * L.s / 2 + 28, w * 0.36);
      tr = { x: x0, y: h * 0.08, w: w - x0 - Math.max(20, w * 0.03), h: h * 0.84 };
    } else {
      L.s = clamp(Math.min(h * 0.36 / CH, w * 0.5 / CW), 0.4, 1.2);
      L.cx = w * 0.5; L.cy = h * 0.03 + CH * L.s / 2;
      const y0 = L.cy + CH * L.s / 2 + 10;
      tr = { x: 10, y: y0, w: w - 20, h: h - y0 - 52 };   // 아래 상태 표시가 덮지 않도록 비워 둔다
    }
    Object.assign(tray.style, { left: tr.x + "px", top: tr.y + "px", width: tr.w + "px", height: tr.h + "px" });
    Object.assign(charEl.style, { width: CW * L.s + "px", height: CH * L.s + "px", transform: `translate(${L.cx - CW / 2 * L.s}px, ${L.cy - CH / 2 * L.s}px)` });
    layoutTray(tr);
    KINDS.forEach(k => {
      const sp = toScreen(k.slot), r = k.r * L.s;
      Object.assign(k.slotEl.style, { width: r * 2 + "px", height: r * 2 + "px", left: sp.x - r + "px", top: sp.y - r + "px" });
    });
    parts.forEach(p => {
      const pw = p.d.w * L.s, ph = p.d.h * L.s, pad = PAD * L.s;
      p.node.style.width = pw + "px"; p.node.style.height = ph + "px";
      Object.assign(p.svg.style, { left: pad + "px", top: pad + "px", width: pw - pad * 2 + "px", height: ph - pad * 2 + "px" });
      if (p.attached) { const sp = toScreen(p.d.target); put(p, sp.x, sp.y); setScale(p, 1); }
      else if (!p.moved) goHome(p);
      else { put(p, clamp(p.x, 10, w - 10), clamp(p.y, 10, h - 10)); setScale(p, p.ts); }
    });
  };
  layout();
  api.onResize(layout);
  // 첫 배치는 전환 없이 제자리에 놓고, 그 뒤부터 움직임에 전환을 건다 (처음 그릴 때 왼쪽 위에서 날아오지 않게)
  requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add("is-live")));

  const applyModes = () => {
    root.classList.toggle("show-grid", !!S.snapGrid);
    root.classList.toggle("lift", !!S.lift);
    root.classList.toggle("blend", !!S.blend);
    const gs = S.gridSize;
    gridEl.style.backgroundSize = `${gs}px ${gs}px`;
    gridEl.style.backgroundPosition = `${-gs / 2}px ${-gs / 2}px, 0 0, 0 0`;
  };
  applyModes();

  /* ---------- 드래그 ---------- */
  const drag = { p: null, ox: 0, oy: 0, sx: 0, sy: 0, cand: null, moved: 0 };
  const candidate = (x, y) => {
    const p = drag.p, w = el.clientWidth, h = el.clientHeight;
    if (S.snapSlots && p.d.kind) {
      const k = KIND[p.d.kind], sp = toScreen(k.slot);
      if (dist(x, y, sp.x, sp.y) < Math.max(75, k.r) * L.s + 10) { const t = toScreen(p.d.target); return { kind: "slot", x: t.x, y: t.y, rx: sp.x, ry: sp.y }; }
    }
    if (S.snapGrid) {
      const gs = S.gridSize;
      const gx = Math.round(x / gs), gy = Math.round(y / gs);
      return { kind: "grid", x: clamp(gx * gs, 0, w), y: clamp(gy * gs, 0, h), gx, gy };
    }
    return { kind: "free", x, y };
  };
  // 집는 동안: 들고 있는 파츠의 자리는 늘(바꿔 끼울 수 있으니), 다른 자리는 비어 있을 때만 보인다
  const showSlots = on => KINDS.forEach(k => k.slotEl.classList.toggle("is-shown",
    on && S.snapSlots && (k.kind === drag.p?.d.kind || !wornPart(k.kind))));
  const dropText = (p, c) => c.kind === "slot" ? `${KIND[p.d.kind].label} 자리` : c.kind === "grid" ? `격자 ${c.gx}, ${c.gy}` : "빈 곳";

  api.on(root, "pointerdown", e => {
    const node = e.target.closest(".drag-and-drop-part");
    if (!node) return;
    e.preventDefault();
    root.setPointerCapture(e.pointerId);
    const p = parts.find(o => o.node === node);
    const pt = localPoint(root, e);
    drag.p = p; drag.ox = p.x - pt.x; drag.oy = p.y - pt.y; drag.sx = p.x; drag.sy = p.y; drag.moved = 0;
    drag.cand = { kind: "free", x: p.x, y: p.y };
    if (p.attached) { p.attached = false; wear(p, false); api.flash(`${p.d.name} 떼어냄`, "alt", 900); }
    if (S.front) { zTop++; p.node.style.zIndex = zTop; }
    p.node.classList.add("is-held"); p.node.classList.remove("is-attached");
    root.classList.add("is-dragging");
    showSlots(true);
    api.hideHint();
  });
  api.on(root, "pointermove", e => {
    const p = drag.p;
    if (!p) return;
    const pt = localPoint(root, e);
    const w = el.clientWidth, h = el.clientHeight;
    const x = clamp(pt.x + drag.ox, 0, w), y = clamp(pt.y + drag.oy, 0, h);
    p.moved = true;
    drag.moved = dist(x, y, drag.sx, drag.sy);
    const c = drag.cand = candidate(x, y);
    KINDS.forEach(k => k.slotEl.classList.toggle("is-hot", k.kind === p.d.kind && c.kind === "slot"));
    p.node.classList.toggle("is-step", c.kind === "grid");
    setScale(p, c.kind === "slot" ? 1 : p.ts);                   // 자리 위에서는 사람 그림 배율로 줄어 미리 맞춰 본다
    if (c.kind === "grid") {
      put(p, c.x, c.y);
      const gw = p.d.w * L.s * p.ts, gh = p.d.h * L.s * p.ts;
      Object.assign(ghost.style, { width: gw + 12 + "px", height: gh + 12 + "px", transform: `translate(${c.x - gw / 2 - 6}px, ${c.y - gh / 2 - 6}px)` });
      ghost.classList.add("is-shown");
    } else {
      ghost.classList.remove("is-shown");
      if (c.kind === "slot") put(p, x + (c.x - x) * 0.35, y + (c.y - y) * 0.35);   // 자리 근처에서는 살짝 끌려간다
      else put(p, x, y);
    }
    api.read("pos", `${Math.round(p.x)}, ${Math.round(p.y)}`);
    api.read("moved", Math.round(drag.moved));
    api.read("drop", dropText(p, c));
  });
  const end = () => {
    const p = drag.p;
    if (!p) return;
    const c = drag.cand;
    p.node.classList.remove("is-held", "is-step");
    root.classList.remove("is-dragging");
    ghost.classList.remove("is-shown");
    KINDS.forEach(k => k.slotEl.classList.remove("is-hot"));
    showSlots(false);
    drag.p = null;
    put(p, c.x, c.y);
    if (c.kind === "slot") {
      const k = KIND[p.d.kind], prev = wornPart(p.d.kind);
      // 같은 자리에 이미 붙은 파츠가 있으면 떼어서 상자의 제자리로 돌려보낸다 (바꿔 끼우기)
      if (prev) {
        prev.attached = false; wear(prev, false);
        prev.node.classList.remove("is-attached");
        prev.node.style.zIndex = prev.z;
        goHome(prev);
      }
      p.attached = true;
      setScale(p, 1);
      // 썸네일이 자리에 내려앉은 뒤(전환 .38s) 사람 그림을 그 부품을 쓴 모습으로 바꾸고 썸네일은 사라진다
      api.timeout(() => { if (p.attached && drag.p !== p) { wear(p, true); p.node.classList.add("is-attached"); } }, 340);
      k.slotEl.classList.remove("is-pulse"); void k.slotEl.offsetWidth; k.slotEl.classList.add("is-pulse");
      const n = parts.filter(o => o.attached).length;
      if (prev) api.flash(`${k.label} 교체 · ${prev.d.name} → ${p.d.name}`, "ok");
      else api.flash(n === slotCount ? `${k.label} · ${p.d.name} — 모든 자리를 채웠다` : `${k.label} · ${p.d.name} 부착 · ${n} / ${slotCount}`, "ok");
    } else setScale(p, p.ts);
    api.read("drop", dropText(p, c));
  };
  api.on(root, "pointerup", end);
  api.on(root, "pointercancel", end);

  api.onParam(k => {
    applyModes();
    if (k === "front" && !S.front) parts.forEach(p => { p.node.style.zIndex = p.z; });
    if (k === "snapSlots" && !S.snapSlots) KINDS.forEach(o => o.slotEl.classList.remove("is-shown", "is-hot"));
  });

  api.frame(() => {
    const n = parts.filter(o => o.attached).length;
    api.read("attached", `${n} / ${slotCount}`);
    if (drag.p) api.status(`옮기는 중 · ${drag.p.d.name}${drag.cand.kind === "slot" ? (wornPart(drag.p.d.kind) ? " · 놓으면 바꿔 끼운다" : " · 놓으면 붙는다") : drag.cand.kind === "grid" ? " · 격자에 맞춰 이동" : ""}`, "active");
    else api.status("대기", "idle");
  });
}
