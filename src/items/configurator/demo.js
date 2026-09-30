import { ILLO, TONE } from "../../lib/draw.js";
import { peepSVG, peepInner, outfit } from "../../lib/figure.js";

export default function demo(api) {
  const { el, S } = api;
  const BASE = 12000;

  /* ---------- 옵션: Open Peeps 부품을 고른다 (사람은 직접 그리지 않는다) ----------
     자세는 서 있는 몸(body) 이름, 표정 · 머리 · 안경은 머리 부품 이름, 옷 색은 outfit()으로 만든 한 색.
     view는 썸네일 viewBox(peepInner 좌표계: 머리 그룹은 translate(225 0), 머리통은 대략 x 270~665 · y 110~585). */
  const GROUPS = [
    { key: "body", name: "자세", type: "body", options: [
      { name: "서기", part: "ShirtPantsBW", price: 0 }, { name: "걷기", part: "WalkingBW", price: 1000 }, { name: "가리키기", part: "PointingFingerBW", price: 1500 },
      { name: "팔짱", part: "CrossedArmsBW", price: 1000 }, { name: "기대기", part: "EasingBW", price: 2000 }, { name: "쉬기", part: "RestingBW", price: 2000 }] },
    { key: "face", name: "표정", view: "330 130 400 400", options: [
      { name: "미소", part: "Smile", price: 0 }, { name: "차분", part: "Calm", price: 0 }, { name: "장난", part: "Cheeky", price: 1000 },
      { name: "활짝", part: "SmileBig", price: 1000 }, { name: "진지", part: "Serious", price: 0 }, { name: "눈감음", part: "EyesClosed", price: 500 }] },
    { key: "hair", name: "머리", view: "215 -40 660 700", options: [
      { name: "짧은 머리", part: "Short", price: 0 }, { name: "웨이브", part: "ShortWavy", price: 1000 }, { name: "번", part: "Bun", price: 1000 },
      { name: "긴 머리", part: "Long", price: 1500 }, { name: "아프로", part: "Afro", price: 1500 }, { name: "터번", part: "Turban", price: 2000 }] },
    { key: "accessory", name: "안경", view: "260 120 460 400", options: [
      { name: "없음", part: "None", price: 0 }, { name: "동그란", part: "GlassRound", price: 2000 },
      { name: "보잉", part: "GlassAviator", price: 3000 }, { name: "선글라스", part: "SunglassWayfarer", price: 4000 }] },
    { key: "color", name: "옷 색", type: "color", options: [
      { name: "흰색", c: ILLO.paper, price: 0 }, { name: "주황", c: ILLO.orange, price: 0 },
      { name: "초록", c: ILLO.green, price: 0 }, { name: "라일락", c: ILLO.lilac, price: 1000 }] }
  ];
  const sel = { body: 0, face: 0, hair: 0, accessory: 0, color: 0 };
  const won = n => n.toLocaleString("ko-KR") + "원";
  const G = key => GROUPS.find(g => g.key === key);
  const cur = key => G(key).options[sel[key]];
  const priceOf = () => BASE + GROUPS.reduce((s, gr) => s + gr.options[sel[gr.key]].price, 0);
  const COMBOS = GROUPS.reduce((m, gr) => m * gr.options.length, 1);

  /** 지금 조합으로 만든 사람 옵션 */
  const figOpts = () => ({
    body: cur("body").part, face: cur("face").part, hair: cur("hair").part, accessory: cur("accessory").part, colors: outfit(cur("color").c)
  });
  /* 썸네일: 자세는 몸만 경계 상자에 맞춘 SVG로, 머리 부품은 몸 없이(body: "none") 조립 좌표 그대로 그리고 머리 둘레를 viewBox로 잘라 본다.
     색은 톤으로 두어 강조색은 결과물에만 쓴다. 표정·안경 썸네일에는 머리통을 그려 주는 짧은 머리를 깔아 둔다 */
  const THUMB = outfit(TONE[3]);
  const thumb = (gr, o) => {
    if (gr.type === "body") return peepSVG({ body: o.part, face: "none", hair: "none", colors: THUMB });
    const opts = { body: "none", face: gr.key === "face" ? o.part : "Calm", hair: gr.key === "hair" ? o.part : "Short", accessory: gr.key === "accessory" ? o.part : "None", colors: THUMB };
    return `<svg viewBox="${gr.view}">${peepInner(opts)}</svg>`;
  };

  api.css(`
    .configurator-root { position: absolute; inset: 0; display: grid; gap: 22px; padding: 64px 28px 72px; }
    .configurator-root.side { grid-template-columns: minmax(250px, 340px) minmax(0, 1fr); grid-template-rows: minmax(0, 1fr); }
    .configurator-root.bottom, .configurator-root.narrow { grid-template-columns: minmax(0, 1fr); grid-template-rows: minmax(0, 1fr) auto; }
    .configurator-root.bottom .configurator-panel, .configurator-root.narrow .configurator-panel { order: 2; }
    .configurator-panel { border: 1px solid var(--line); border-radius: var(--r-card); padding: 18px;
      overflow-y: auto; align-self: center; max-height: 100%; display: flex; flex-direction: column; gap: 18px; }
    .configurator-root.bottom .configurator-panel { flex-direction: row; gap: 18px; align-self: stretch; overflow-x: auto; padding: 14px 18px; }
    .configurator-root.bottom .configurator-group { flex: 1 1 0; min-width: 150px; }
    .configurator-root.narrow .configurator-panel { max-height: 46vh; align-self: stretch; padding: 12px; gap: 12px; }
    .configurator-group h4 { margin: 0 0 8px; font-size: 13px; font-weight: 700; color: var(--ink); display: flex; gap: 8px; align-items: baseline; }
    .configurator-group h4 span { font-weight: 500; color: var(--ink-3); }
    .configurator-opts { display: flex; flex-wrap: wrap; gap: 6px; }
    .configurator-opt { font: inherit; display: flex; flex-direction: column; align-items: center; gap: 2px; width: 62px;
      padding: 5px 3px; border: 1px solid rgba(0,0,0,.14); border-radius: 8px; background: transparent; cursor: pointer; color: var(--ink);
      transition: border-color .15s, transform .15s; }
    .configurator-opt:hover { border-color: var(--ink-3); transform: translateY(-2px); }
    .configurator-opt.on { border-color: var(--accent); box-shadow: inset 0 0 0 1px var(--accent); }
    .configurator-opt svg { width: 48px; height: 40px; display: block; }
    .configurator-opt b { font-size: 11px; font-weight: 600; white-space: nowrap; }
    .configurator-opt small { font-size: 10px; color: var(--ink-3); height: 12px; line-height: 12px; }
    .configurator-root:not(.show-price) .configurator-opt small { display: none; }
    .configurator-swatch { width: 34px; height: 34px; border-radius: 50%; border: 1px solid rgba(0,0,0,.12); cursor: pointer; background: var(--sw);
      transition: transform .15s, box-shadow .15s; }
    .configurator-swatch:hover { transform: translateY(-2px); }
    .configurator-swatch.on { box-shadow: 0 0 0 3px var(--board), 0 0 0 4.5px var(--accent); }
    .configurator-view { position: relative; min-height: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
    .configurator-fig { position: relative; width: 100%; flex: 1 1 auto; min-height: 0; max-height: 500px; transform-origin: 50% 100%; }
    .configurator-layer { position: absolute; inset: 0; opacity: 0; transition: opacity .28s ease; }
    .configurator-layer.on { opacity: 1; }
    .configurator-root.instant .configurator-layer { transition: none; }
    .configurator-layer svg { width: 100%; height: 100%; display: block; overflow: visible; }
    .configurator-rand { position: absolute; top: 4px; right: 4px; font: inherit; font-size: 13px; font-weight: 600; cursor: pointer;
      background: transparent; color: var(--ink); border: 1px solid rgba(0,0,0,.2); border-radius: var(--r-pill); padding: 7px 14px;
      transition: border-color .15s, opacity .25s, transform .25s; }
    .configurator-rand:hover { border-color: var(--ink); }
    .configurator-rand:active { transform: scale(.96); }
    .configurator-root:not(.show-rand) .configurator-rand { opacity: 0; transform: scale(.9); pointer-events: none; }
    .configurator-sum { display: flex; align-items: baseline; gap: 12px; flex-wrap: wrap; justify-content: center; font-size: 13px; color: var(--ink-2);
      padding: 8px 4px 0; text-align: center; border-top: 1px solid var(--line); min-width: 260px; }
    .configurator-sum b { font-size: 15px; color: var(--ink); font-variant-numeric: tabular-nums; transition: opacity .25s; }
    .configurator-root:not(.show-price) .configurator-sum b { opacity: 0; }
  `);

  /* ---------- DOM ---------- */
  const root = document.createElement("div");
  root.className = "configurator-root";
  el.appendChild(root);

  const panel = document.createElement("div");
  panel.className = "configurator-panel";
  panel.innerHTML = GROUPS.map((gr, gi) => `
    <section class="configurator-group"><h4>${gr.name}<span data-gname="${gr.key}"></span></h4><div class="configurator-opts">
      ${gr.options.map((o, i) => gr.type === "color"
        ? `<button class="configurator-swatch" data-g="${gi}" data-i="${i}" style="--sw:${o.c}" title="${o.name}${o.price ? " +" + won(o.price) : ""}"></button>`
        : `<button class="configurator-opt" data-g="${gi}" data-i="${i}">${thumb(gr, o)}<b>${o.name}</b><small>${o.price ? "+" + won(o.price) : "기본"}</small></button>`
      ).join("")}
    </div></section>`).join("");

  const view = document.createElement("div");
  view.className = "configurator-view";
  view.innerHTML = `
    <div class="configurator-fig"><div class="configurator-layer on"></div><div class="configurator-layer"></div></div>
    <button class="configurator-rand">무작위</button>
    <div class="configurator-sum"><span class="configurator-names"></span><b class="configurator-total"></b></div>`;
  root.append(panel, view);
  const figEl = view.querySelector(".configurator-fig");
  let layers = [...view.querySelectorAll(".configurator-layer")];   // [보이는 층, 대기 층]
  const namesEl = view.querySelector(".configurator-names");
  const totalEl = view.querySelector(".configurator-total");

  /* ---------- 반영 ---------- */
  let shownPrice = priceOf(), lastPick = "–", count = 0, rolling = false, lastKey = "";
  /* 부품이 통째로 바뀌므로 두 층을 겹쳐 놓고 새 그림을 넣은 층을 서서히 켠다 (크로스페이드) */
  const swapFigure = () => {
    const key = JSON.stringify(figOpts());
    if (key === lastKey) return;
    lastKey = key;
    const [front, back] = layers;
    back.innerHTML = peepSVG(figOpts());
    back.classList.add("on"); front.classList.remove("on");
    layers = [back, front];
  };
  const render = changedKey => {
    swapFigure();
    panel.querySelectorAll("[data-g]").forEach(b => b.classList.toggle("on", sel[GROUPS[+b.dataset.g].key] === +b.dataset.i));
    GROUPS.forEach(gr => { panel.querySelector(`[data-gname="${gr.key}"]`).textContent = gr.options[sel[gr.key]].name; });
    namesEl.textContent = GROUPS.map(gr => gr.options[sel[gr.key]].name).join(" · ");
    if (changedKey && S.motion === "pop") {
      figEl.animate([{ transform: "scale(1,1)" }, { transform: "scale(1.08,.9)" }, { transform: "scale(.96,1.05)" }, { transform: "scale(1,1)" }],
        { duration: 420, easing: "ease-out" });
    }
  };
  const applyModes = () => {
    root.classList.toggle("side", S.layout === "side");
    root.classList.toggle("bottom", S.layout === "bottom");
    root.classList.toggle("narrow", el.clientWidth < 720);
    root.classList.toggle("show-rand", !!S.random);
    root.classList.toggle("show-price", !!S.price);
    root.classList.toggle("pop", S.motion === "pop");
    root.classList.toggle("instant", S.motion !== "smooth");
  };
  applyModes(); render();

  const pick = (gi, i, silent) => {
    const gr = GROUPS[gi];
    if (sel[gr.key] === i && !silent) return;
    sel[gr.key] = i;
    if (!silent) { count++; lastPick = `${gr.name}: ${gr.options[i].name}`; }
    render(gr.key);
  };
  api.on(panel, "click", e => {
    const b = e.target.closest("[data-g]");
    if (!b || rolling) return;
    api.hideHint();
    pick(+b.dataset.g, +b.dataset.i);
    b.animate([{ transform: "scale(.9)" }, { transform: "scale(1)" }], { duration: 220, easing: "cubic-bezier(.3,1.6,.5,1)" });
  });

  const randomize = () => {
    if (rolling) return;
    rolling = true; api.hideHint();
    let n = 0;
    const tick = () => {
      GROUPS.forEach(gr => { sel[gr.key] = Math.floor(Math.random() * gr.options.length); });
      n++;
      if (n < 7) { render(); api.timeout(tick, 70 + n * 12); }
      else { rolling = false; count++; lastPick = "무작위 조합"; render("rand"); api.flash("무작위 조합에서 멈췄다", "ok"); }
    };
    tick();
  };
  api.on(view.querySelector(".configurator-rand"), "click", randomize);

  /* 배치 바꾸기: 두 영역이 새 자리로 미끄러진다 (FLIP) */
  const relayout = () => {
    const els = [panel, view];
    const first = els.map(x => x.getBoundingClientRect());
    applyModes();
    if (S.motion === "none") return;
    els.forEach((x, i) => {
      const a = first[i], b = x.getBoundingClientRect();
      if (!b.width || !b.height) return;
      x.animate([
        { transformOrigin: "0 0", transform: `translate(${a.left - b.left}px, ${a.top - b.top}px) scale(${a.width / b.width}, ${a.height / b.height})` },
        { transformOrigin: "0 0", transform: "none" }
      ], { duration: 460, easing: "cubic-bezier(.2,.8,.2,1)" });
    });
  };
  api.onParam(k => { if (k === "layout") relayout(); else applyModes(); });
  api.onResize(applyModes);

  api.frame(dt => {
    const target = priceOf();
    shownPrice += (target - shownPrice) * (S.motion === "none" ? 1 : Math.min(1, dt / 90));
    if (Math.abs(target - shownPrice) < 5) shownPrice = target;
    totalEl.textContent = "합계 " + won(Math.round(shownPrice / 10) * 10);
    api.read("pick", lastPick);
    api.read("count", count);
    api.read("price", won(target));
    api.read("combos", `${GROUPS.map(g => g.options.length).join("×")} = ${COMBOS}`);
    api.status(rolling ? "무작위로 고르는 중" : `${GROUPS.map(gr => gr.options[sel[gr.key]].name).join(" · ")}`, rolling ? "alt" : "idle");
  });
}
