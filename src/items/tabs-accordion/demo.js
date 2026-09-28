import { ILLO, TONE, LINE } from "../../lib/draw.js";

export default function demo(api) {
  const { el, S } = api;
  const INK = ILLO.ink;
  const DATA = [
    // 행성 그림: 외곽선 없는 톤 원판 + 가는(1.5px) 잉크 호 한두 개. 강조색은 화성 하나
    { name: "수성", r: 14, fill: TONE[3], orbit: "88일", moons: "0개", detail: `<path d="M23 25 a3 3 0 1 0 6 0 M31 32 a2 2 0 1 0 4 0"/>`,
      t: "태양에 가장 가까운 행성이다. 대기가 거의 없어서 낮과 밤의 온도 차가 매우 크다." },
    { name: "금성", r: 22, fill: TONE[1], orbit: "225일", moons: "0개", detail: `<path d="M14 26 q10 -6 20 0 t16 2 M18 36 q8 -5 16 0"/>`,
      t: "두꺼운 이산화탄소 대기 때문에 표면이 약 460°C로, 태양계 행성 중 가장 뜨겁다. 대부분의 행성과 반대 방향으로 자전한다." },
    { name: "지구", r: 23, fill: TONE[4], orbit: "365일", moons: "1개", detail: `<path d="M20 20 q8 -6 14 0 q6 6 -2 10 q-8 4 -12 -2 q-4 -4 0 -8" style="stroke:${TONE[0]}"/>`,
      t: "표면의 약 71%가 물로 덮여 있다. 지금까지 알려진 행성 중 생명이 사는 유일한 곳이다." },
    { name: "화성", r: 17, fill: "var(--accent)", orbit: "687일", moons: "2개", detail: `<path d="M30 25 a3 3 0 1 0 6 0 M22 36 q6 3 12 0"/>`,
      t: "흙 속의 산화철 때문에 붉게 보인다. 태양계에서 가장 높은 화산인 올림푸스 산이 있다." }
  ];
  const EASE = { smooth: "cubic-bezier(.2,.8,.2,1)", elastic: "cubic-bezier(.3,1.35,.5,1)", none: "linear" };
  const dur = ms => (S.motion === "none" ? 0 : ms);

  api.css(`
    .tabs-accordion-root { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; padding: 64px 24px 72px; overflow-y: auto; }
    .tabs-accordion-card { width: 600px; max-width: 100%; margin: auto 0; }
    .tabs-accordion-root button:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
    .tabs-accordion-tablist { position: relative; display: flex; border-bottom: 1px solid var(--line); }
    .tabs-accordion-tab { font: inherit; font-size: 15px; font-weight: 600; color: var(--ink-3); background: none; border: 0; cursor: pointer;
      flex: 1; padding: 12px 8px; position: relative; z-index: 1; border-radius: var(--r-pill); transition: color .2s; }
    .tabs-accordion-tab:hover { color: var(--ink-2); }
    .tabs-accordion-tab[aria-selected="true"] { color: var(--ink); }
    .tabs-accordion-ind { position: absolute; left: 0; width: 0; pointer-events: none; }
    .tabs-accordion-ind.line { bottom: -1px; height: 2px; background: var(--ink); }
    .tabs-accordion-ind.pill { top: 4px; bottom: 4px; border: 1px solid var(--ink); border-radius: var(--r-pill); }
    .tabs-accordion-root.pill .tabs-accordion-tablist { border-bottom-color: transparent; }
    .tabs-accordion-panelwrap { position: relative; overflow: hidden; }
    .tabs-accordion-panel { display: grid; grid-template-columns: 72px 1fr; gap: 20px; padding: 22px 4px; align-items: start; }
    .tabs-accordion-panel svg { width: 72px; height: 72px; }
    .tabs-accordion-planet circle { stroke: none; }
    .tabs-accordion-planet path { fill: none; stroke: ${INK}; stroke-width: ${LINE}; stroke-linecap: round; stroke-linejoin: round; vector-effect: non-scaling-stroke; }
    .tabs-accordion-panel p { margin: 0 0 12px; font-size: 15px; line-height: 1.65; color: var(--ink); word-break: keep-all; }
    .tabs-accordion-facts { display: flex; gap: 22px; font-size: 13px; color: var(--ink-3); }
    .tabs-accordion-facts b { color: var(--ink); font-weight: 600; margin-left: 5px; }
    .tabs-accordion-item { border-bottom: 1px solid var(--line); }
    .tabs-accordion-item:first-child { border-top: 1px solid var(--line); }
    .tabs-accordion-head { font: inherit; font-size: 15px; font-weight: 600; color: var(--ink); background: none; border: 0; cursor: pointer;
      width: 100%; display: flex; justify-content: space-between; align-items: center; padding: 15px 4px; border-radius: 4px; text-align: left; }
    .tabs-accordion-head svg { width: 14px; height: 14px; fill: none; stroke: var(--ink); stroke-width: 1.5; }
    .tabs-accordion-region { height: 0; overflow: hidden; }
    .tabs-accordion-region .tabs-accordion-panel { padding-top: 4px; }
    .tabs-accordion-view.hide { display: none; }
    @media (max-width: 560px) { .tabs-accordion-panel { grid-template-columns: 48px 1fr; gap: 14px; } .tabs-accordion-panel svg { width: 48px; height: 48px; } .tabs-accordion-tab { font-size: 13px; } }
  `);

  const panelHTML = d => `<div class="tabs-accordion-panel"><svg viewBox="0 0 60 60" class="tabs-accordion-planet"><circle cx="30" cy="30" r="${d.r}" fill="${d.fill}"/>${d.detail || ""}</svg>
    <div><p>${d.t}</p><div class="tabs-accordion-facts"><span>공전 주기<b>${d.orbit}</b></span><span>위성<b>${d.moons}</b></span></div></div></div>`;

  const root = document.createElement("div");
  root.className = "tabs-accordion-root";
  el.appendChild(root);
  root.innerHTML = `<div class="tabs-accordion-card">
    <div class="tabs-accordion-view" data-form="tabs">
      <div class="tabs-accordion-tablist" role="tablist">${DATA.map((d, i) => `<button class="tabs-accordion-tab" role="tab" data-i="${i}">${d.name}</button>`).join("")}<div class="tabs-accordion-ind"></div></div>
      <div class="tabs-accordion-panelwrap" role="tabpanel"></div>
    </div>
    <div class="tabs-accordion-view" data-form="accordion">${DATA.map((d, i) => `<div class="tabs-accordion-item">
      <button class="tabs-accordion-head" data-i="${i}" aria-expanded="false">${d.name}<svg viewBox="0 0 14 14"><path d="M5 2.5 L9.5 7 L5 11.5"/></svg></button>
      <div class="tabs-accordion-region">${panelHTML(d)}</div></div>`).join("")}</div>
  </div>`;
  const $$ = s => [...root.querySelectorAll(s)];
  const tabs = $$(".tabs-accordion-tab"), heads = $$(".tabs-accordion-head"), regions = $$(".tabs-accordion-region");
  const ind = root.querySelector(".tabs-accordion-ind"), wrap = root.querySelector(".tabs-accordion-panelwrap");
  const views = { tabs: root.querySelector('[data-form="tabs"]'), accordion: root.querySelector('[data-form="accordion"]') };

  let sel = 0, lastKey = "–";
  const open = new Set([0]);

  /* ---------- 탭 ---------- */
  const indPos = i => ({ left: tabs[i].offsetLeft, width: tabs[i].offsetWidth });
  const placeInd = () => { const p = indPos(sel); ind.style.left = p.left + "px"; ind.style.width = p.width + "px"; };
  const moveInd = (from, to) => {
    const a = indPos(from), b = indPos(to);
    ind.getAnimations().forEach(x => x.cancel());
    placeInd();
    if (S.motion === "none" || from === to) return;
    const frames = S.motion === "elastic"
      ? [{ left: a.left + "px", width: a.width + "px" },
         { left: Math.min(a.left, b.left) + "px", width: Math.max(a.left + a.width, b.left + b.width) - Math.min(a.left, b.left) + "px", offset: 0.45 },
         { left: b.left + "px", width: b.width + "px" }]
      : [{ left: a.left + "px", width: a.width + "px" }, { left: b.left + "px", width: b.width + "px" }];
    ind.animate(frames, { duration: S.motion === "elastic" ? 480 : 350, easing: S.motion === "elastic" ? "cubic-bezier(.4,0,.2,1)" : EASE.smooth });
  };
  const showPanel = (i, dir) => {
    const h0 = wrap.offsetHeight;
    wrap.innerHTML = panelHTML(DATA[i]);
    const h1 = wrap.offsetHeight;
    if (!dur(1)) return;
    wrap.animate([{ height: h0 + "px" }, { height: h1 + "px" }], { duration: 320, easing: EASE[S.motion] });
    if (dir) wrap.firstElementChild.animate([{ opacity: 0, transform: `translateX(${dir * 18}px)` }, { opacity: 1, transform: "none" }], { duration: 300, easing: EASE.smooth });
  };
  const selectTab = (i, focus) => {
    const prev = sel;
    sel = i;
    tabs.forEach((t, k) => { t.setAttribute("aria-selected", k === i); t.tabIndex = k === i ? 0 : -1; });
    if (focus) tabs[i].focus();
    if (prev !== i) { moveInd(prev, i); showPanel(i, Math.sign(i - prev)); }
    open.clear(); open.add(i);
  };

  /* ---------- 아코디언 ---------- */
  const setRegion = (i, on, animate) => {
    const r = regions[i];
    heads[i].setAttribute("aria-expanded", on);
    const chev = heads[i].querySelector("svg");
    r.getAnimations().forEach(a => a.cancel());
    const target = on ? r.scrollHeight : 0;
    const from = r.offsetHeight;
    r.style.height = on ? "auto" : "0px";
    const d = animate ? dur(380) : 0;
    chev.style.transition = d ? `transform ${d}ms ${EASE[S.motion]}` : "none";
    chev.style.transform = on ? "rotate(90deg)" : "none";
    if (d && from !== target) r.animate([{ height: from + "px" }, { height: target + "px" }], { duration: d, easing: EASE[S.motion] });
  };
  const toggleHead = i => {
    const on = !open.has(i);
    if (on && !S.multi) [...open].forEach(k => { if (k !== i) { open.delete(k); setRegion(k, false, true); } });
    on ? open.add(i) : open.delete(i);
    setRegion(i, on, true);
    if (on) sel = i;
    else if (open.size) sel = [...open][open.size - 1];
  };

  /* ---------- 형태 ---------- */
  let form = null;
  const setForm = animate => {
    const f = S.form;
    if (f === form) return;
    const go = () => {
      form = f;
      views.tabs.classList.toggle("hide", f !== "tabs");
      views.accordion.classList.toggle("hide", f !== "accordion");
      if (f === "tabs") {
        sel = open.size ? (open.has(sel) ? sel : [...open][0]) : sel;
        tabs.forEach((t, k) => { t.setAttribute("aria-selected", k === sel); t.tabIndex = k === sel ? 0 : -1; });
        open.clear(); open.add(sel);
        wrap.innerHTML = panelHTML(DATA[sel]);
        placeInd();
      } else {
        heads.forEach((h, k) => setRegion(k, open.has(k), false));
      }
      if (animate && S.motion !== "none") views[f].animate([{ opacity: 0, transform: "translateY(8px)" }, { opacity: 1, transform: "none" }], { duration: 260, easing: EASE.smooth });
    };
    if (animate && form && S.motion !== "none") views[form].animate([{ opacity: 1 }, { opacity: 0 }], { duration: 140 }).onfinish = go;
    else go();
  };
  const applyStyle = () => {
    ind.className = "tabs-accordion-ind " + S.indicator;
    root.classList.toggle("pill", S.indicator === "pill");
  };
  applyStyle(); setForm(false);

  /* ---------- 입력 ---------- */
  api.on(root, "click", e => {
    const t = e.target.closest(".tabs-accordion-tab");
    if (t) { api.hideHint(); selectTab(+t.dataset.i, false); lastKey = "클릭"; return; }
    const h = e.target.closest(".tabs-accordion-head");
    if (h) { api.hideHint(); toggleHead(+h.dataset.i); lastKey = e.detail ? "클릭" : lastKey; }
  });
  api.on(window, "keydown", e => {
    if (e.target.closest && e.target.closest("input, textarea, [contenteditable]")) return;
    if (e.target !== document.body && !el.contains(e.target)) return;
    const list = form === "tabs" ? tabs : heads;
    const keys = form === "tabs" ? { prev: "ArrowLeft", next: "ArrowRight" } : { prev: "ArrowUp", next: "ArrowDown" };
    let i = list.indexOf(document.activeElement);
    const focused = i >= 0;
    if (!focused) i = sel;
    let n = null;
    if (e.key === keys.prev) n = (i - 1 + list.length) % list.length;
    else if (e.key === keys.next) n = (i + 1) % list.length;
    else if (e.key === "Home") n = 0;
    else if (e.key === "End") n = list.length - 1;
    else if ((e.key === "Enter" || e.key === " ") && focused) { lastKey = e.key === "Enter" ? "Enter" : "Space"; return; } // 버튼의 기본 클릭에 맡긴다
    if (n === null) return;
    e.preventDefault(); api.hideHint();
    lastKey = { ArrowLeft: "←", ArrowRight: "→", ArrowUp: "↑", ArrowDown: "↓" }[e.key] || e.key;
    if (form === "tabs") {
      if (S.auto) selectTab(n, true);
      else { tabs.forEach((t, k) => { t.tabIndex = k === n ? 0 : -1; }); tabs[n].focus(); }
    } else heads[n].focus();
  });

  api.onParam(k => {
    if (k === "form") setForm(true);
    if (k === "indicator") { applyStyle(); if (form === "tabs") placeInd(); }
    if (k === "multi" && !S.multi && open.size > 1 && form === "accordion") {
      [...open].forEach(x => { if (x !== sel) { open.delete(x); setRegion(x, false, true); } });
    }
  });
  api.onResize(() => { if (form === "tabs") placeInd(); });

  api.frame(() => {
    const focusIdx = (form === "tabs" ? tabs : heads).indexOf(document.activeElement);
    api.read("form", form === "tabs" ? "탭" : "아코디언");
    api.read("active", form === "tabs" ? `${DATA[sel].name} (${sel + 1}/4)` : open.size ? [...open].sort().map(i => DATA[i].name).join(" · ") : "없음");
    api.read("open", open.size);
    api.read("key", lastKey);
    if (focusIdx >= 0 && form === "tabs" && focusIdx !== sel) api.status(`포커스는 ${DATA[focusIdx].name} · 엔터를 누르면 선택`, "alt");
    else if (form === "tabs") api.status(`${DATA[sel].name} 탭을 보는 중`, "active");
    else api.status(open.size ? `${open.size}개 펼침${S.multi ? " · 여러 개 열기" : ""}` : "모두 접힘", open.size ? "active" : "idle");
  });
}
