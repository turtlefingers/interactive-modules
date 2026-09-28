import { clamp } from "../../lib/util.js";

import { ILLO } from "../../lib/draw.js";

export default function demo(api) {
  const { el, S } = api;

  const SEQS = {
    konami: { keys: ["↑", "↑", "↓", "↓", "←", "→", "←", "→", "B", "A"], name: "코나미 커맨드", prize: "목숨 30개" },
    iddqd: { keys: ["I", "D", "D", "Q", "D"], name: "IDDQD", prize: "무적 모드" },
    short: { keys: ["↓", "→", "A"], name: "짧은 커맨드", prize: "필살기" }
  };

  api.css(`
    .cheat-code-demo { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 26px;
      padding: 60px 16px 90px; background: var(--board); color: var(--ink); transition: background .5s, color .5s; }
    .cheat-code-demo.open { background: var(--ink); color: var(--board); }
    .cheat-code-seal { position: relative; width: 120px; height: 120px; display: grid; place-items: center; }
    .cheat-code-seal svg { width: 100%; height: 100%; overflow: visible; }
    .cheat-code-seal .lid { transform-origin: 20px 44px; transition: transform .6s cubic-bezier(.3,1.5,.5,1); }
    .cheat-code-demo.open .cheat-code-seal .lid { transform: rotate(-38deg) translateY(-6px); }
    .cheat-code-seal .star { transform-origin: 60px 60px; transform: scale(0); transition: transform .5s .15s cubic-bezier(.3,1.6,.5,1); }
    .cheat-code-demo.open .cheat-code-seal .star { transform: scale(1) translateY(-34px); }
    .cheat-code-prize { height: 18px; font-size: 15px; font-weight: 600; opacity: 0; transition: opacity .4s .2s; }
    .cheat-code-demo.open .cheat-code-prize { opacity: 1; color: var(--accent); }
    .cheat-code-row { display: flex; flex-wrap: wrap; justify-content: center; gap: 6px; max-width: 640px; }
    .cheat-code-row.shake { animation: cheat-code-shake .35s; }
    @keyframes cheat-code-shake { 20% { transform: translateX(-8px); } 40% { transform: translateX(7px); } 60% { transform: translateX(-5px); } 80% { transform: translateX(3px); } }
    .cheat-code-slot { width: 44px; height: 44px; border-radius: 8px; border: 1.5px solid currentColor; opacity: .35; display: grid; place-items: center;
      font-size: 18px; font-weight: 600; transition: background .12s, color .12s, opacity .12s, border-color .12s; }
    .cheat-code-slot.done { opacity: 1; background: var(--ink); color: var(--board); border-color: var(--ink); }
    .cheat-code-demo.open .cheat-code-slot.done { background: var(--accent); border-color: var(--accent); color: #fff; }
    .cheat-code-slot.next { opacity: 1; border-color: var(--accent); }
    .cheat-code-time { width: min(520px, 90%); height: 2px; background: rgba(0,0,0,.08); position: relative; }
    .cheat-code-time i { position: absolute; left: 0; top: 0; bottom: 0; background: var(--ink); }
    .cheat-code-demo.open .cheat-code-time { background: rgba(255,255,255,.15); } .cheat-code-demo.open .cheat-code-time i { background: var(--board); }
    .cheat-code-hist { display: flex; gap: 4px; align-items: center; min-height: 28px; font-size: 13px; opacity: .7; }
    .cheat-code-hist span { min-width: 26px; height: 26px; padding: 0 6px; border-radius: 6px; border: 1px solid currentColor; display: grid; place-items: center; }
    .cheat-code-hist span.bad { border-color: var(--accent); color: var(--accent); }
    .cheat-code-hist em { font-style: normal; margin-right: 6px; }
    .cheat-code-pad { position: absolute; right: 16px; bottom: 16px; z-index: 40; display: flex; flex-wrap: wrap; gap: 6px; max-width: 250px; justify-content: flex-end;
      padding: 10px; background: var(--chip-bg); border-radius: var(--r-box); box-shadow: var(--chip-shadow); }
    .cheat-code-pad button { width: 40px; height: 40px; border-radius: 8px; border: 1.5px solid rgba(0,0,0,.16); background: transparent; color: var(--ink);
      font: inherit; font-size: 15px; font-weight: 600; cursor: pointer; touch-action: manipulation; }
    .cheat-code-pad button.on { background: var(--accent); border-color: var(--accent); color: #fff; }
    @media (max-width: 600px) { .cheat-code-slot { width: 32px; height: 32px; font-size: 15px; } .cheat-code-pad { max-width: 190px; } .cheat-code-demo { gap: 18px; } }
  `);

  const root = document.createElement("div");
  root.className = "cheat-code-demo";
  root.innerHTML = `
    <div class="cheat-code-seal">
      <svg viewBox="0 0 120 120" fill="none" stroke="${ILLO.ink}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round">
        <path class="star" d="M60 34 L67 52 L86 52 L71 63 L77 82 L60 71 L43 82 L49 63 L34 52 L53 52 Z" fill="${ILLO.yellow}"/>
        <rect x="20" y="52" width="80" height="52" rx="5" fill="${ILLO.orange}"/>
        <path d="M52 74 h16 M60 70 v12"/>
        <g class="lid"><rect x="15" y="39" width="90" height="15" rx="4" fill="${ILLO.orange}"/></g>
      </svg>
    </div>
    <div class="cheat-code-prize"></div>
    <div class="cheat-code-row"></div>
    <div class="cheat-code-time"><i></i></div>
    <div class="cheat-code-hist"></div>`;
  el.appendChild(root);
  const row = root.querySelector(".cheat-code-row"), timeBar = root.querySelector(".cheat-code-time i"),
    hist = root.querySelector(".cheat-code-hist"), prize = root.querySelector(".cheat-code-prize");
  const pad = document.createElement("div");
  pad.className = "cheat-code-pad";
  el.appendChild(pad);

  /* ---------- 상태 ---------- */
  let p = 0, lastT = 0, open = false, history = [], fails = 0, found = 0, lastKey = "–";
  const seq = () => SEQS[S.seq].keys;
  const padBtns = {};

  const build = () => {
    const ks = seq();
    row.innerHTML = ks.map(k => `<div class="cheat-code-slot">${k}</div>`).join("");
    const set = ["↑", "↓", "←", "→", ...new Set(ks.filter(k => !"↑↓←→".includes(k)))];
    if (S.seq === "iddqd") set.splice(0, 4);
    pad.innerHTML = set.map(k => `<button data-k="${k}">${k}</button>`).join("");
    for (const k in padBtns) delete padBtns[k];
    pad.querySelectorAll("button").forEach(b => {
      padBtns[b.dataset.k] = b;
      api.on(b, "pointerdown", e => { e.preventDefault(); e.stopPropagation(); input(b.dataset.k); });
    });
    prize.textContent = `${SEQS[S.seq].prize} · ${SEQS[S.seq].name}`;
    render();
  };
  const render = () => {
    [...row.children].forEach((n, i) => {
      n.classList.toggle("done", S.progress && i < p);
      n.classList.toggle("next", S.progress && i === p);
    });
    hist.innerHTML = `<em>입력</em>` + (history.length ? history.map(h => `<span class="${h.bad ? "bad" : ""}">${h.k}</span>`).join("") : `<span style="border-style:dashed;opacity:.5">…</span>`);
  };
  const shake = () => { row.classList.remove("shake"); void row.offsetWidth; row.classList.add("shake"); };

  // 지금까지 맞춘 부분 + 새 키에서, 순서의 앞부분과 겹치는 가장 긴 꼬리를 찾는다
  const advance = (prev, k) => {
    const ks = seq();
    const s = ks.slice(0, prev).concat(k);
    for (let len = Math.min(s.length, ks.length); len > 0; len--) {
      let ok = true;
      for (let i = 0; i < len; i++) if (s[s.length - len + i] !== ks[i]) { ok = false; break; }
      if (ok) return len;
    }
    return 0;
  };

  const input = k => {
    api.hideHint();
    const now = performance.now();
    if (S.timeLimit && p > 0 && now - lastT > S.timeout * 1000) { p = 0; }
    const np = advance(p, k);
    const good = np === p + 1;
    if (!good && p > 0) { shake(); fails++; api.flash(np ? `틀렸다 · ${np}개부터 다시` : "틀렸다 · 처음부터 다시", "alt", 1000); }
    p = np; lastT = now; lastKey = k;
    history.push({ k, bad: !good }); if (history.length > 12) history.shift();
    const b = padBtns[k]; if (b) { b.classList.add("on"); api.timeout(() => b.classList.remove("on"), 120); }
    if (p === seq().length) {
      open = !open; p = 0; found++;
      root.classList.toggle("open", open);
      api.flash(open ? `비밀이 열렸다 · ${SEQS[S.seq].prize}` : "비밀을 다시 닫았다", "ok", 2000);
    }
    render();
  };

  api.onParam(k => { if (k === "seq") { p = 0; history = []; build(); } else render(); });
  build();

  const ARROWS = { ArrowUp: "↑", ArrowDown: "↓", ArrowLeft: "←", ArrowRight: "→" };
  // 사이드바의 글자 입력칸, 슬라이더에 포커스가 있으면 반응하지 않는다 (체크박스는 예외: Space가 토글을 다시 뒤집지 않도록)
  const fromField = e => { const f = e.target && e.target.closest && e.target.closest("input, textarea, select, [contenteditable]"); return !!f && !(f.type === "checkbox" || f.type === "radio"); };
  api.on(window, "keydown", e => {
    if (fromField(e) || e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;
    let k = ARROWS[e.key];
    if (k) e.preventDefault();
    else if (/^Key[A-Z]$/.test(e.code)) k = e.code.slice(3);
    else if (/^Digit\d$/.test(e.code)) k = e.code.slice(5);
    else if (e.code === "Space") { k = "␣"; e.preventDefault(); }
    else if (e.code === "Enter") k = "⏎";
    if (!k) return;
    input(k);
  });

  api.frame(() => {
    const now = performance.now();
    const gap = p > 0 ? (now - lastT) / 1000 : 0;
    if (S.timeLimit && p > 0 && gap > S.timeout) {
      p = 0; fails++; render(); shake();
      api.flash("너무 늦었다 · 처음부터 다시", "alt", 1200);
    }
    const left = S.timeLimit && p > 0 ? clamp(1 - gap / S.timeout, 0, 1) : 0;
    timeBar.style.width = `${left * 100}%`;

    api.read("matched", `${p} / ${seq().length}`);
    api.read("last", lastKey);
    api.read("gap", p > 0 ? `${gap.toFixed(1)}초` : "–");
    api.read("found", open ? "열림" : fails ? `닫힘 · 실패 ${fails}번` : "닫힘");

    if (p > 0) api.status(`입력 중 · ${p} / ${seq().length}${S.timeLimit ? ` · ${Math.max(0, S.timeout - gap).toFixed(1)}초 안에 다음 키` : ""}`, "active");
    else if (open) api.status("비밀이 열린 상태 · 다시 입력하면 닫힌다", "ok");
    else api.status("대기", "idle");
  });
}
