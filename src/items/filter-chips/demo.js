import { rng } from "../../lib/util.js";

export default function demo(api) {
  const { el, S } = api;
  const INK = "#1b1b1a";
  const ACC = api.color("--accent") || "#ff5a36";
  const GROUPS = [
    { key: "color", name: "색", values: [["ink", "먹색", INK], ["grey", "회색", "#a8a39a"], ["accent", "주황", ACC]] },
    { key: "shape", name: "모양", values: [["circle", "원"], ["square", "네모"], ["triangle", "세모"]] },
    { key: "size", name: "크기", values: [["s", "작은"], ["m", "중간"], ["l", "큰"]] }
  ];
  const CHIPS = GROUPS.flatMap(g => g.values.map(([v, name, c]) => ({ g: g.key, v, name, c, id: g.key + ":" + v })));

  // 모든 조합 27개를 섞어서 놓는다
  const items = [];
  GROUPS[0].values.forEach(c => GROUPS[1].values.forEach(s => GROUPS[2].values.forEach(z => items.push({ color: c[0], fill: c[2], shape: s[0], size: z[0] }))));
  const r = rng(11);
  for (let i = items.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [items[i], items[j]] = [items[j], items[i]]; }

  api.css(`
    .filter-chips-root { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 64px 28px 72px; }
    .filter-chips-top { width: 100%; max-width: 860px; display: flex; flex-wrap: wrap; gap: 10px 22px; align-items: center; }
    .filter-chips-group { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
    .filter-chips-group > b { font-size: 13px; font-weight: 600; color: var(--ink-3); margin-right: 2px; }
    .filter-chips-chip { font: inherit; font-size: 13px; font-weight: 600; color: var(--ink); background: transparent; cursor: pointer;
      border: 1px solid rgba(0,0,0,.2); border-radius: var(--r-pill); padding: 6px 12px; display: inline-flex; gap: 6px; align-items: center;
      transition: background .15s, color .15s, border-color .15s, opacity .2s; }
    .filter-chips-chip:hover { border-color: var(--ink); }
    .filter-chips-chip.on { background: var(--ink); border-color: var(--ink); color: var(--on-ink); }
    .filter-chips-chip.dead { opacity: .35; }
    .filter-chips-chip i { width: 9px; height: 9px; border-radius: 50%; border: 1px solid rgba(0,0,0,.3); }
    .filter-chips-chip.on i { border-color: rgba(255,255,255,.6); }
    .filter-chips-chip small { font-size: 11px; font-weight: 500; color: var(--ink-3); font-variant-numeric: tabular-nums; }
    .filter-chips-chip.on small { color: rgba(255,255,255,.6); }
    .filter-chips-root:not(.counts) .filter-chips-chip small { display: none; }
    .filter-chips-root:not(.counts) .filter-chips-chip.dead { opacity: 1; }
    .filter-chips-clear { font: inherit; font-size: 13px; color: var(--ink-2); background: none; border: 0; cursor: pointer; padding: 6px 4px;
      text-decoration: underline; text-underline-offset: 3px; transition: opacity .2s; }
    .filter-chips-clear[disabled] { opacity: .3; cursor: default; }
    .filter-chips-info { width: 100%; max-width: 860px; display: flex; gap: 14px; align-items: baseline; font-size: 13px; color: var(--ink-2);
      border-top: 1px solid var(--line); padding-top: 12px; }
    .filter-chips-info b { font-size: 18px; color: var(--ink); font-variant-numeric: tabular-nums; }
    .filter-chips-scroll { width: 100%; max-width: 860px; flex: 1 1 auto; min-height: 0; overflow-y: auto; }
    .filter-chips-grid { position: relative; display: grid; grid-template-columns: repeat(auto-fill, minmax(78px, 1fr)); gap: 8px; }
    .filter-chips-card { aspect-ratio: 1; border: 1px solid var(--line); border-radius: 8px; display: grid; place-items: center; background: var(--board); }
    .filter-chips-card svg { width: 64%; height: 64%; overflow: visible; }
    .filter-chips-card.hidden { display: none; }
    .filter-chips-empty { position: absolute; left: 0; right: 0; top: 40px; text-align: center; font-size: 15px; color: var(--ink-3);
      opacity: 0; transition: opacity .3s; pointer-events: none; }
    .filter-chips-empty.show { opacity: 1; }
    @media (max-width: 700px) { .filter-chips-root { padding: 60px 14px 64px; } .filter-chips-grid { grid-template-columns: repeat(auto-fill, minmax(56px, 1fr)); gap: 6px; } }
  `);

  /* ---------- DOM ---------- */
  const root = document.createElement("div");
  root.className = "filter-chips-root";
  el.appendChild(root);
  root.innerHTML = `
    <div class="filter-chips-top">
      ${GROUPS.map(g => `<div class="filter-chips-group"><b>${g.name}</b>${CHIPS.filter(c => c.g === g.key).map(c =>
        `<button class="filter-chips-chip" data-id="${c.id}">${c.c ? `<i style="background:${c.c}"></i>` : ""}${c.name}<small></small></button>`).join("")}</div>`).join("")}
      <button class="filter-chips-clear">모두 해제</button>
    </div>
    <div class="filter-chips-info"><b class="filter-chips-num"></b><span class="filter-chips-expr"></span></div>
    <div class="filter-chips-scroll"><div class="filter-chips-grid"><div class="filter-chips-empty">조건을 모두 만족하는 것이 없다</div></div></div>`;
  const grid = root.querySelector(".filter-chips-grid"), numEl = root.querySelector(".filter-chips-num"), exprEl = root.querySelector(".filter-chips-expr");
  const emptyEl = root.querySelector(".filter-chips-empty"), clearBtn = root.querySelector(".filter-chips-clear");
  const chipEls = new Map([...root.querySelectorAll(".filter-chips-chip")].map(b => [b.dataset.id, b]));

  const SZ = { s: 0.5, m: 0.75, l: 1 };
  const shapeSVG = it => {
    const k = SZ[it.size], h = 50 * k;
    const a = `fill="${it.fill}" stroke="${INK}" stroke-width="1.2" stroke-linejoin="round"`;
    if (it.shape === "circle") return `<circle cx="50" cy="50" r="${h}" ${a}/>`;
    if (it.shape === "square") return `<rect x="${50 - h * 0.9}" y="${50 - h * 0.9}" width="${h * 1.8}" height="${h * 1.8}" ${a}/>`;
    return `<path d="M50 ${50 - h} L${50 + h} ${50 + h * 0.8} H${50 - h} Z" ${a}/>`;
  };
  items.forEach(it => {
    const d = document.createElement("div");
    d.className = "filter-chips-card";
    d.innerHTML = `<svg viewBox="0 0 100 100">${shapeSVG(it)}</svg>`;
    grid.appendChild(d);
    it.el = d; it.shown = true;
  });

  /* ---------- 거르기 ---------- */
  let active = []; // 켠 순서대로
  let last = "–";
  const matchWith = (it, list) => {
    if (!list.length) return true;
    const hit = c => it[c.split(":")[0]] === c.split(":")[1];
    return S.logic === "and" ? list.every(hit) : list.some(hit);
  };
  const countWith = list => items.filter(it => matchWith(it, list)).length;
  const toggled = id => {
    if (active.includes(id)) return active.filter(x => x !== id);
    return S.select === "single" ? [id] : [...active, id];
  };

  const apply = animate => {
    const gridR = grid.getBoundingClientRect();
    const first = new Map();
    items.forEach(it => { if (it.shown) first.set(it, it.el.getBoundingClientRect()); });
    const leaving = [];
    items.forEach(it => {
      const m = matchWith(it, active);
      it.el.getAnimations().forEach(a => a.cancel());
      it.el.style.cssText = "";
      if (it.shown && !m) leaving.push(it);
      it.entering = !it.shown && m;
      it.shown = m;
      it.el.classList.toggle("hidden", !m);
    });
    if (animate && S.animate) {
      // 빠지는 카드: 원래 자리에 잠시 남아 작아지며 사라진다
      leaving.forEach(it => {
        const f = first.get(it);
        it.el.classList.remove("hidden");
        Object.assign(it.el.style, { position: "absolute", left: f.left - gridR.left + "px", top: f.top - gridR.top + "px", width: f.width + "px", height: f.height + "px", zIndex: 0 });
        it.el.animate([{ opacity: 1, transform: "scale(1)" }, { opacity: 0, transform: "scale(.4)" }], { duration: 260, easing: "ease-in", fill: "forwards" })
          .onfinish = () => { if (!it.shown) { it.el.style.cssText = ""; it.el.classList.add("hidden"); } };
      });
      items.forEach(it => {
        if (!it.shown) return;
        if (it.entering) {
          it.el.animate([{ opacity: 0, transform: "scale(.4)" }, { opacity: 1, transform: "scale(1)" }], { duration: 320, delay: 120, easing: "cubic-bezier(.3,1.4,.5,1)", fill: "backwards" });
          return;
        }
        const f = first.get(it), l = it.el.getBoundingClientRect();
        const dx = f.left - l.left, dy = f.top - l.top;
        if (dx || dy) it.el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "none" }], { duration: 420, easing: "cubic-bezier(.2,.8,.2,1)" });
      });
    }
    render();
  };

  const render = () => {
    const n = items.filter(it => it.shown).length;
    numEl.textContent = `${items.length}개 중 ${n}개`;
    const names = active.map(id => CHIPS.find(c => c.id === id).name);
    exprEl.textContent = names.length ? "조건: " + names.join(S.logic === "and" ? " 그리고 " : " 또는 ") : "조건 없음 · 전부 보인다";
    emptyEl.classList.toggle("show", n === 0);
    clearBtn.disabled = !active.length;
    chipEls.forEach((b, id) => {
      const on = active.includes(id);
      const c = countWith(toggled(id));
      b.classList.toggle("on", on);
      b.classList.toggle("dead", !on && c === 0);
      b.querySelector("small").textContent = c;
    });
    root.classList.toggle("counts", !!S.counts);
  };

  api.on(root, "click", e => {
    const b = e.target.closest(".filter-chips-chip");
    if (b) {
      api.hideHint();
      const id = b.dataset.id;
      const was = active.includes(id);
      active = toggled(id);
      last = `${CHIPS.find(c => c.id === id).name} ${was ? "끔" : "켬"}`;
      apply(true);
      return;
    }
    if (e.target.closest(".filter-chips-clear") && active.length) { active = []; last = "모두 해제"; apply(true); }
  });
  api.on(root, "pointerdown", e => { if (e.target.closest("button")) e.preventDefault(); });

  api.onParam(k => {
    if (k === "select" && S.select === "single" && active.length > 1) active = [active[active.length - 1]];
    if (k === "logic" || k === "select") apply(true);
    else render();
  });
  apply(false);

  api.frame(() => {
    const n = items.filter(it => it.shown).length;
    api.read("count", `${n} / ${items.length}`);
    api.read("on", active.length);
    api.read("logic", S.logic === "and" ? "모두 만족 AND" : "하나라도 OR");
    api.read("last", last);
    api.status(active.length ? `${active.length}개 조건 · ${n}개 남음` : "조건 없음 · 전부 보인다", active.length ? "active" : "idle");
  });
}
