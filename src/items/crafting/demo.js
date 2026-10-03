import { ILLO, TONE, LINE } from "../../lib/draw.js";
import { objectDataURL } from "../../lib/objects.js";
import "../../lib/objects/index.js";

/* ---------- 재료 아이콘 ----------
   기본 재료 넷(물·불·흙·바람)과 몇몇 결과물은 사물 카탈로그(element-*, lightning)를 데이터 URL 이미지로 쓴다.
   나머지 결과물은 외곽선 없는 단색 실루엣 + 1.5px 가는 잉크 선만으로 그린 작은 SVG 다.
   색은 톤이 기본이고, 물(파랑)·불(주황)처럼 꼭 필요한 곳에만 색 하나를 쓴다 */
const NS = "http://www.w3.org/2000/svg";
const OBJ = {
  "물": ["element-water", { color: ILLO.blue }],
  "불": ["element-fire", { color: ILLO.orange }],
  "흙": ["element-earth", { color: TONE[4] }],
  "바람": ["element-wind", { color: TONE[3] }],
  "파도": ["element-water", { variant: "B", color: ILLO.blue }],
  "용암": ["element-water", { variant: "A", color: ILLO.orange }],
  "폭풍": ["element-wind", { variant: "A", color: TONE[4] }],
  "돌": ["element-earth", { variant: "A", color: TONE[3] }],
  "번개": ["lightning", { color: ILLO.orange }]
};
const objURL = {};
const objIcon = name => {
  if (!objURL[name]) { const [obj, o] = OBJ[name]; objURL[name] = objectDataURL(obj, 30, o, { w: 44, pad: 4 }); }
  return `<img class="crafting-ico" src="${objURL[name]}" alt="" draggable="false">`;
};
const I = ILLO.ink, P = ILLO.paper;
const at = (fill, o = {}) => Object.entries({ fill, ...o }).map(([k, v]) => `${k}="${v}"`).join(" ");
const ln = (d, o = {}) => `<path d="${d}" ${at("none", { stroke: I, "stroke-width": LINE, "stroke-linejoin": "round", "stroke-linecap": "round", ...o })}/>`;
const cloudD = "M9 22 A5 5 0 0 1 8 12 A6 6 0 0 1 19 9 A5 5 0 0 1 26 15 A4.5 4.5 0 0 1 24 22 Z";
const ICONS = {
  "증기": `<path d="${cloudD}" ${at(TONE[1])}/>` + ln("M12 28 Q14 26 12 24 M20 28 Q22 26 20 24"),
  "진흙": `<path d="M4 27 Q8 12 16 12 Q24 12 28 27 Z" ${at(TONE[5])}/>` + ln("M10 22 H22", { stroke: P }),
  "먼지": `<circle cx="9" cy="20" r="4" ${at(TONE[3])}/><circle cx="22" cy="12" r="5" ${at(TONE[3])}/><circle cx="21" cy="24" r="3" ${at(TONE[3])}/>`,
  "연기": ln("M16 28 Q8 22 14 16 Q20 11 12 5") + ln("M24 26 Q18 21 22 16"),
  "산": `<path d="M3 27 L13 8 L19 17 L23 12 L29 27 Z" ${at(TONE[4])}/>`,
  "구름": `<path d="${cloudD}" ${at(P)}/>` + ln(cloudD),
  "비": `<path d="M9 17 A5 5 0 0 1 8 8 A6 6 0 0 1 19 5 A4.5 4.5 0 0 1 26 10 A4 4 0 0 1 24 17 Z" ${at(TONE[2])}/>` + ln("M11 22 L9 27 M17 22 L15 27 M23 22 L21 27"),
  "벽돌": `<rect x="4" y="9" width="24" height="14" ${at(ILLO.orange)}/>` + ln("M16 9 V23", { stroke: P }),
  "새싹": ln("M16 29 Q17 20 16 12") + `<path d="M16 15 Q6 15 5 8 Q14 6 16 15 Z" ${at(TONE[4])}/><path d="M16 12 Q26 12 27 5 Q18 3 16 12 Z" ${at(TONE[4])}/>`,
  "모래": `<path d="M3 26 Q10 20 16 24 Q22 28 29 22 V29 H3 Z" ${at(TONE[2])}/><circle cx="10" cy="14" r="1.6" fill="${I}"/><circle cx="18" cy="11" r="1.6" fill="${I}"/><circle cx="23" cy="16" r="1.6" fill="${I}"/>`,
  "도자기": `<path d="M11 6 H21 V10 Q28 13 26 20 Q25 28 16 28 Q7 28 6 20 Q4 13 11 10 Z" ${at(TONE[1])}/>` + ln("M11 10 H21"),
  "나무": `<path d="M14 29 V20 H18 V29 Z" ${at(TONE[5])}/><circle cx="16" cy="13" r="10" ${at(TONE[4])}/>`,
  "실패": ln("M9 9 L23 23 M23 9 L9 23", { stroke: TONE[3] })
};
const iconOf = name => OBJ[name] ? objIcon(name) : `<svg class="crafting-ico" viewBox="0 0 32 32" xmlns="${NS}">${ICONS[name] || `<circle cx="16" cy="16" r="10" ${at(TONE[2])}/>`}</svg>`;

export default function demo(api) {
  const { el, S } = api;
  const BASE = ["물", "불", "흙", "바람"];
  const RECIPES = [
    [["물", "불"], "증기"], [["물", "흙"], "진흙"], [["불", "흙"], "용암"], [["흙", "바람"], "먼지"],
    [["불", "바람"], "연기"], [["물", "바람"], "파도"], [["바람", "바람"], "폭풍"], [["흙", "흙"], "산"],
    [["증기", "바람"], "구름"], [["구름", "물"], "비"], [["용암", "물"], "돌"], [["진흙", "불"], "벽돌"],
    [["비", "흙"], "새싹"], [["돌", "바람"], "모래"],
    [["물", "흙", "불"], "도자기"], [["새싹", "물", "흙"], "나무"], [["구름", "바람", "불"], "번개"]
  ];
  const keyOf = list => [...list].sort().join("+");
  const TABLE = new Map(RECIPES.map(([ins, out], i) => [keyOf(ins), i]));

  api.css(`
    .crafting-root { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; gap: 22px; padding: 64px 28px 72px; }
    .crafting-bench { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; justify-content: center; }
    .crafting-slot, .crafting-out { width: 72px; height: 72px; border-radius: 50%; border: 1.5px dashed rgba(0,0,0,.22); display: grid; place-items: center;
      position: relative; transition: border-color .2s; }
    .crafting-slot.full { border-style: solid; border-color: transparent; cursor: pointer; }
    .crafting-slot.hidden { display: none; }
    .crafting-op { font-size: 18px; color: var(--ink-3); }
    .crafting-op.hidden { display: none; }
    .crafting-token { font: inherit; width: 64px; height: 64px; border-radius: 50%; border: 1.5px solid var(--ink); background: var(--board);
      color: var(--ink); font-size: 11px; font-weight: 600; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1px;
      cursor: pointer; padding: 0; line-height: 1; transition: transform .15s, border-color .2s, color .2s; }
    .crafting-ico { width: 30px; height: 30px; display: block; overflow: visible; object-fit: contain; pointer-events: none; }
    .crafting-root.narrow .crafting-ico { width: 26px; height: 26px; }
    .crafting-token:hover { transform: translateY(-2px); }
    .crafting-token:active { transform: scale(.94); }
    .crafting-token.new { border-color: var(--accent); color: var(--accent); }
    .crafting-token.fail { border: 1.5px dashed var(--ink-3); color: var(--ink-3); cursor: default; }
    .crafting-token.fly { position: fixed; z-index: 60; pointer-events: none; margin: 0; }
    .crafting-slot .crafting-token, .crafting-out .crafting-token { width: 64px; height: 64px; }
    .crafting-out .crafting-token { cursor: default; }
    .crafting-go { font: inherit; font-size: 15px; font-weight: 700; padding: 12px 22px; border-radius: var(--r-pill); border: 0; cursor: pointer;
      background: var(--ink); color: var(--on-ink); margin-left: 8px; transition: opacity .2s, transform .12s; }
    .crafting-go:active { transform: scale(.96); }
    .crafting-go[disabled] { opacity: .3; cursor: default; }
    .crafting-go.hidden { display: none; }
    .crafting-msg { font-size: 13px; color: var(--ink-2); height: 18px; text-align: center; }
    .crafting-msg b { color: var(--accent); }
    .crafting-lower { width: 100%; max-width: 900px; flex: 1 1 auto; min-height: 0; display: grid; grid-template-columns: 1fr 290px; gap: 28px; }
    .crafting-lower h4 { margin: 0 0 12px; font-size: 13px; font-weight: 700; display: flex; justify-content: space-between; }
    .crafting-lower h4 span { font-weight: 500; color: var(--ink-3); }
    .crafting-shelf { display: flex; flex-wrap: wrap; gap: 10px; align-content: flex-start; }
    .crafting-bookwrap { border-left: 1px solid var(--line); padding-left: 24px; min-height: 0; display: flex; flex-direction: column; }
    .crafting-book { overflow-y: auto; font-size: 13px; display: flex; flex-direction: column; }
    .crafting-rec { padding: 6px 0; border-bottom: 1px solid var(--line); color: var(--ink-3); display: flex; justify-content: space-between; gap: 8px; }
    .crafting-rec.known { color: var(--ink); }
    .crafting-rec.fresh { color: var(--accent); }
    .crafting-rec small { color: var(--ink-3); font-size: 11px; }
    .crafting-root.narrow { overflow-y: auto; padding: 60px 14px 64px; gap: 14px; }
    .crafting-root.narrow .crafting-lower { grid-template-columns: 1fr; flex: none; }
    .crafting-root.narrow .crafting-bookwrap { border-left: 0; padding-left: 0; border-top: 1px solid var(--line); padding-top: 14px; }
    .crafting-root.narrow .crafting-slot, .crafting-root.narrow .crafting-out { width: 60px; height: 60px; }
    .crafting-root.narrow .crafting-token { width: 54px; height: 54px; }
  `);

  const root = document.createElement("div");
  root.className = "crafting-root";
  el.appendChild(root);
  root.innerHTML = `
    <div class="crafting-bench">
      <div class="crafting-slot" data-s="0"></div><span class="crafting-op">+</span>
      <div class="crafting-slot" data-s="1"></div><span class="crafting-op" data-op="2">+</span>
      <div class="crafting-slot" data-s="2"></div>
      <span class="crafting-op">=</span><div class="crafting-out"></div>
      <button class="crafting-go">조합</button>
    </div>
    <div class="crafting-msg"></div>
    <div class="crafting-lower">
      <div><h4>재료<span>누르면 → 칸에 들어간다</span></h4><div class="crafting-shelf"></div></div>
      <div class="crafting-bookwrap"><h4>레시피 북<span class="crafting-count"></span></h4><div class="crafting-book"></div></div>
    </div>`;
  const $ = s => root.querySelector(s);
  const slotEls = [...root.querySelectorAll(".crafting-slot")];
  const op3 = $('[data-op="2"]'), outEl = $(".crafting-out"), goBtn = $(".crafting-go"), msgEl = $(".crafting-msg");
  const shelf = $(".crafting-shelf"), book = $(".crafting-book"), countEl = $(".crafting-count");

  const slots = [null, null, null];
  const known = new Set(BASE), found = new Set(), freshItems = new Set();
  let tries = 0, last = "–", busy = false, freshRec = -1;
  const token = (name, cls = "") => `<button class="crafting-token ${cls}" data-name="${name}">${iconOf(name)}<span>${name}</span></button>`;

  const renderShelf = () => {
    shelf.innerHTML = [...known].map(n => token(n, freshItems.has(n) ? "new" : "")).join("");
  };
  const renderBook = () => {
    book.innerHTML = RECIPES.map(([ins, out], i) => {
      const k = found.has(i);
      const txt = k ? `${ins.join(" + ")} → ${out}` : S.hints ? `${ins[0]} + ${ins.slice(1).map(() => "?").join(" + ")} → ${out}` : `${ins.map(() => "?").join(" + ")} → ?`;
      return `<div class="crafting-rec${k ? " known" : ""}${i === freshRec ? " fresh" : ""}"><span>${txt}</span>${ins.length === 3 ? "<small>3칸</small>" : ""}</div>`;
    }).join("");
    countEl.textContent = `${found.size} / ${RECIPES.length}`;
  };
  const filled = () => slots.slice(0, S.slots).filter(Boolean).length;
  const renderSlots = () => {
    slotEls.forEach((s, i) => {
      s.classList.toggle("hidden", i >= S.slots);
      s.classList.toggle("full", !!slots[i]);
      s.innerHTML = slots[i] ? token(slots[i]) : "";
    });
    op3.classList.toggle("hidden", S.slots < 3);
    goBtn.classList.toggle("hidden", S.mode === "auto");
    goBtn.disabled = filled() < 2 || busy;
  };
  const say = html => { msgEl.innerHTML = html; };

  const combine = () => {
    if (busy || filled() < 2) return;
    busy = true; tries++;
    const ins = slots.slice(0, S.slots).filter(Boolean);
    const idx = TABLE.get(keyOf(ins));
    const toks = slotEls.map(s => s.firstElementChild).filter(Boolean);
    const bench = $(".crafting-bench").getBoundingClientRect(), cx = bench.left + bench.width / 2;
    toks.forEach(t => {
      const r = t.getBoundingClientRect();
      t.animate([{ transform: "none", opacity: 1 }, { transform: `translateX(${(cx - r.left - r.width / 2) * 0.4}px) scale(.3)`, opacity: 0 }], { duration: 260, easing: "ease-in", fill: "forwards" });
    });
    api.timeout(() => {
      slots.fill(null);
      if (idx === undefined) {
        outEl.innerHTML = token("실패", "fail");
        $(".crafting-bench").animate([{ transform: "translateX(0)" }, { transform: "translateX(-8px)" }, { transform: "translateX(8px)" }, { transform: "translateX(-4px)" }, { transform: "translateX(0)" }], { duration: 320 });
        last = "실패";
        say(`${ins.join(" + ")} — 조합표에 없는 조합이다`);
      } else {
        const out = RECIPES[idx][1], isNew = !found.has(idx);
        outEl.innerHTML = token(out, isNew ? "new" : "");
        last = out;
        if (isNew) {
          found.add(idx); freshRec = idx;
          if (!known.has(out)) { known.add(out); freshItems.add(out); }
          say(`<b>새로운 발견</b> · ${ins.join(" + ")} → ${out}`);
          api.flash(`새로운 발견 · ${out}`, "ok");
        } else say(`${ins.join(" + ")} → ${out} · 이미 아는 조합이다`);
        renderShelf(); renderBook();
      }
      outEl.firstElementChild.animate([{ transform: "scale(.3)", opacity: 0 }, { transform: "scale(1)", opacity: 1 }], { duration: 320, easing: "cubic-bezier(.3,1.5,.5,1)" });
      busy = false;
      renderSlots();
    }, 280);
  };

  const put = btn => {
    if (busy) return;
    const i = slots.findIndex((s, k) => k < S.slots && !s);
    if (i < 0) { say("칸이 가득 찼다 · 칸을 누르면 뺄 수 있다"); slotEls.slice(0, S.slots).forEach(s => s.animate([{ transform: "scale(1)" }, { transform: "scale(1.08)" }, { transform: "scale(1)" }], { duration: 200 })); return; }
    const name = btn.dataset.name;
    freshItems.delete(name); btn.classList.remove("new");
    slots[i] = name;
    const a = btn.getBoundingClientRect(), b = slotEls[i].getBoundingClientRect();
    renderSlots();
    const landed = slotEls[i].firstElementChild;
    landed.animate([{ transform: `translate(${a.left + a.width / 2 - b.left - b.width / 2}px, ${a.top + a.height / 2 - b.top - b.height / 2}px)` }, { transform: "none" }],
      { duration: 300, easing: "cubic-bezier(.2,.8,.2,1)" });
    outEl.innerHTML = "";
    if (S.mode === "auto" && filled() === S.slots) api.timeout(combine, 380);
  };

  api.on(root, "click", e => {
    const t = e.target.closest(".crafting-token");
    if (t && shelf.contains(t)) { api.hideHint(); put(t); return; }
    const s = e.target.closest(".crafting-slot.full");
    if (s && !busy) { slots[+s.dataset.s] = null; renderSlots(); say(""); return; }
    if (e.target.closest(".crafting-go")) combine();
  });
  api.on(root, "pointerdown", e => { if (e.target.closest("button")) e.preventDefault(); });

  const applyNarrow = () => root.classList.toggle("narrow", el.clientWidth < 760);
  api.onParam(k => {
    if (k === "slots") for (let i = S.slots; i < 3; i++) slots[i] = null;
    if (k === "mode" && S.mode === "auto" && filled() === S.slots) api.timeout(combine, 380);
    renderSlots(); renderBook();
  });
  api.onResize(applyNarrow);
  applyNarrow(); renderShelf(); renderBook(); renderSlots();
  say("재료 두 개를 칸에 넣고 조합을 누르면 → 결과가 나온다");

  api.frame(() => {
    api.read("slots", `${filled()} / ${S.slots}`);
    api.read("found", `${found.size} / ${RECIPES.length}`);
    api.read("tries", tries);
    api.read("last", last);
    if (busy) api.status("조합하는 중", "active");
    else if (filled() >= 2) api.status(S.mode === "auto" ? `칸 ${filled()}/${S.slots} · 가득 차면 자동으로 합쳐진다` : `칸 ${filled()}/${S.slots} · 조합을 누르면 → 합쳐진다`, "alt");
    else api.status(`재료를 기다리는 중 · 칸 ${filled()}/${S.slots}`, "idle");
  });
}
