import { ILLO } from "../../lib/draw.js";

export default function demo(api) {
  const { el, S } = api;
  const INK = ILLO.ink, PAPER = ILLO.paper;
  const BASE = 12000;

  /* ---------- 옵션과 부위 그림 (viewBox 0 0 200 220 기준) ----------
     그림 키트와 같은 규칙: 3px 검정 외곽선, 평면 단색(ILLO 팔레트), 얼굴은 점 두 개와 선 하나 */
  const LW = 3;
  const LINE = `stroke="${INK}" stroke-width="${LW}" stroke-linejoin="round" stroke-linecap="round"`;
  const eye = (x, kind) => {
    if (kind === "dot") return `<circle cx="${x}" cy="122" r="6" fill="${INK}"/>`;
    if (kind === "sleepy") return `<path d="M${x - 9} 122 H${x + 9}" fill="none" ${LINE}/>`;
    if (kind === "round") return `<circle cx="${x}" cy="122" r="11" fill="${PAPER}" ${LINE}/><circle cx="${x + 1.5}" cy="123" r="5" fill="${INK}"/>`;
    return `<path d="M${x - 9} 124 L${x} 119 L${x + 9} 124" fill="none" ${LINE}/>`;   // 윙크
  };
  const GROUPS = [
    { key: "color", name: "몸 색", type: "color", options: [
      { name: "크림", c: PAPER, price: 0 }, { name: "파랑", c: ILLO.blue, price: 0 }, { name: "초록", c: ILLO.green, price: 0 },
      { name: "노랑", c: ILLO.yellow, price: 0 }, { name: "주황", c: ILLO.orange, price: 1000 }] },
    { key: "eyes", name: "눈", view: "46 98 108 52", options: [
      { name: "점 눈", price: 0, svg: eye(78, "dot") + eye(122, "dot") },
      { name: "졸린 눈", price: 1000, svg: eye(78, "sleepy") + eye(122, "sleepy") },
      { name: "동그란 눈", price: 1500, svg: eye(78, "round") + eye(122, "round") },
      { name: "윙크", price: 1000, svg: eye(78, "dot") + eye(122, "wink") }] },
    { key: "hat", name: "모자", view: "18 22 164 82", drop: true, options: [
      { name: "없음", price: 0, svg: "" },
      { name: "비니", price: 3000, svg: `<path d="M56 90 C56 48 144 48 144 90 Z" fill="${ILLO.red}" ${LINE}/><rect x="50" y="82" width="100" height="14" rx="4" fill="${PAPER}" ${LINE}/><circle cx="100" cy="47" r="8" fill="${PAPER}" ${LINE}/>` },
      { name: "왕관", price: 8000, svg: `<path d="M62 92 L64 52 L82 70 L100 42 L118 70 L136 52 L138 92 Z" fill="${ILLO.yellow}" ${LINE}/>` },
      { name: "밀짚모자", price: 4000, svg: `<ellipse cx="100" cy="88" rx="78" ry="12" fill="${ILLO.yellow}" ${LINE}/><path d="M64 86 C64 48 136 48 136 86 Z" fill="${ILLO.yellow}" ${LINE}/><path d="M65 76 H135" stroke="${INK}" stroke-width="6"/>` },
      { name: "프로펠러", price: 5000, svg: `<path d="M60 92 C60 56 140 56 140 92 Z" fill="${ILLO.blue}" ${LINE}/><path d="M100 57 V40" ${LINE}/><path d="M78 40 H122" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>` }] },
    { key: "acc", name: "액세서리", view: "14 30 186 186", options: [
      { name: "없음", price: 0, svg: "" },
      { name: "목도리", price: 2500, svg: `<path d="M36 158 Q100 186 164 158 L166 174 Q100 202 34 174 Z" fill="${ILLO.green}" ${LINE}/><path d="M122 180 L136 176 L144 206 L130 209 Z" fill="${ILLO.green}" ${LINE}/>` },
      { name: "안경", price: 2000, svg: `<circle cx="78" cy="122" r="15" fill="none" ${LINE}/><circle cx="122" cy="122" r="15" fill="none" ${LINE}/><path d="M93 120 Q100 115 107 120" fill="none" ${LINE}/>` },
      { name: "나비넥타이", price: 1500, svg: `<path d="M100 172 L79 160 L79 184 Z M100 172 L121 160 L121 184 Z" fill="${ILLO.red}" ${LINE}/><rect x="95" y="166" width="10" height="12" rx="3" fill="${ILLO.red}" ${LINE}/>` },
      { name: "풍선", price: 3000, svg: `<path d="M163 150 Q176 110 174 72" fill="none" ${LINE}/><ellipse cx="174" cy="50" rx="16" ry="20" fill="${ILLO.pink}" ${LINE}/>` }] }
  ];
  const sel = { color: 0, eyes: 0, hat: 0, acc: 0 };
  const won = n => n.toLocaleString("ko-KR") + "원";
  const priceOf = () => BASE + GROUPS.reduce((s, gr) => s + gr.options[sel[gr.key]].price, 0);
  const COMBOS = GROUPS.reduce((m, gr) => m * gr.options.length, 1);

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
    .configurator-opt svg { width: 56px; height: 36px; display: block; }
    .configurator-opt b { font-size: 11px; font-weight: 600; white-space: nowrap; }
    .configurator-opt small { font-size: 10px; color: var(--ink-3); height: 12px; line-height: 12px; }
    .configurator-root:not(.show-price) .configurator-opt small { display: none; }
    .configurator-swatch { width: 34px; height: 34px; border-radius: 50%; border: 1px solid rgba(0,0,0,.25); cursor: pointer; background: var(--sw);
      transition: transform .15s, box-shadow .15s; }
    .configurator-swatch:hover { transform: translateY(-2px); }
    .configurator-swatch.on { box-shadow: 0 0 0 3px var(--board), 0 0 0 4.5px var(--accent); }
    .configurator-view { position: relative; min-height: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
    .configurator-view > svg { width: 100%; height: 100%; min-height: 0; flex: 1 1 auto; max-height: 500px; overflow: visible; }
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
    .configurator-body { transition: fill .4s ease; }
    .configurator-part { transform-box: fill-box; transform-origin: 50% 50%; opacity: 0; transform: scale(.6);
      transition: opacity .22s, transform .4s cubic-bezier(.3,1.4,.5,1); pointer-events: none; }
    .configurator-part.drop { transform: translateY(-50px); }
    .configurator-part.on { opacity: 1; transform: none; }
    .configurator-root.pop .configurator-part { transition: opacity .12s, transform .45s cubic-bezier(.2,2,.4,1); }
    .configurator-root.instant .configurator-part, .configurator-root.instant .configurator-body { transition: none; }
    .configurator-char { transform-box: fill-box; transform-origin: 50% 100%; }
  `);

  /* ---------- DOM ---------- */
  const root = document.createElement("div");
  root.className = "configurator-root";
  el.appendChild(root);

  const SIL = `<path d="M100 68 C148 68 170 104 170 140 C170 178 140 200 100 200 C60 200 30 178 30 140 C30 104 52 68 100 68 Z" fill="none" stroke="#c9c2b4" stroke-width="2"/>`;
  const panel = document.createElement("div");
  panel.className = "configurator-panel";
  panel.innerHTML = GROUPS.map((gr, gi) => `
    <section class="configurator-group"><h4>${gr.name}<span data-gname="${gr.key}"></span></h4><div class="configurator-opts">
      ${gr.options.map((o, i) => gr.type === "color"
        ? `<button class="configurator-swatch" data-g="${gi}" data-i="${i}" style="--sw:${o.c}" title="${o.name}${o.price ? " +" + won(o.price) : ""}"></button>`
        : `<button class="configurator-opt" data-g="${gi}" data-i="${i}"><svg viewBox="${gr.view}">${SIL}${o.svg}</svg><b>${o.name}</b><small>${o.price ? "+" + won(o.price) : "기본"}</small></button>`
      ).join("")}
    </div></section>`).join("");

  const view = document.createElement("div");
  view.className = "configurator-view";
  const partsOf = gr => gr.options.map((o, i) => o.svg ? `<g class="configurator-part${gr.drop ? " drop" : ""}" data-part="${gr.key}" data-i="${i}">${o.svg}</g>` : "").join("");
  const G = key => GROUPS.find(g => g.key === key);
  view.innerHTML = `
    <svg viewBox="0 0 200 220">
      <g class="configurator-char">
        <ellipse class="configurator-body" cx="72" cy="201" rx="16" ry="9" ${LINE}/><ellipse class="configurator-body" cx="128" cy="201" rx="16" ry="9" ${LINE}/>
        <path class="configurator-body" ${LINE} d="M100 68 C148 68 170 104 170 140 C170 178 140 200 100 200 C60 200 30 178 30 140 C30 104 52 68 100 68 Z"/>
        <path d="M90 146 Q100 156 110 146" fill="none" ${LINE}/>
        ${partsOf(G("eyes"))}${partsOf(G("acc"))}${partsOf(G("hat"))}
      </g>
    </svg>
    <button class="configurator-rand">무작위</button>
    <div class="configurator-sum"><span class="configurator-names"></span><b class="configurator-total"></b></div>`;
  root.append(panel, view);
  const bodyEls = view.querySelectorAll(".configurator-body");
  const charEl = view.querySelector(".configurator-char");
  const namesEl = view.querySelector(".configurator-names");
  const totalEl = view.querySelector(".configurator-total");

  /* ---------- 반영 ---------- */
  let shownPrice = priceOf(), lastPick = "–", count = 0, rolling = false;
  const render = changedKey => {
    const col = G("color").options[sel.color].c;
    bodyEls.forEach(b => b.setAttribute("fill", col));
    view.querySelectorAll(".configurator-part").forEach(p => p.classList.toggle("on", +p.dataset.i === sel[p.dataset.part]));
    panel.querySelectorAll("[data-g]").forEach(b => b.classList.toggle("on", sel[GROUPS[+b.dataset.g].key] === +b.dataset.i));
    GROUPS.forEach(gr => { panel.querySelector(`[data-gname="${gr.key}"]`).textContent = gr.options[sel[gr.key]].name; });
    namesEl.textContent = GROUPS.map(gr => gr.options[sel[gr.key]].name).filter(n => n !== "없음").join(" · ");
    if (changedKey && S.motion === "pop") {
      charEl.animate([{ transform: "scale(1,1)" }, { transform: "scale(1.1,.88)" }, { transform: "scale(.95,1.07)" }, { transform: "scale(1,1)" }],
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
    root.classList.toggle("instant", S.motion === "none");
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
      GROUPS.forEach((gr, gi) => { sel[gr.key] = Math.floor(Math.random() * gr.options.length); });
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
