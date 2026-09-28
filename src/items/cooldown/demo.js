import { clamp } from "../../lib/util.js";
import { ILLO } from "../../lib/draw.js";

export default function demo(api) {
  const { el, S } = api;
  const P = "cooldown";
  api.css(`
    .${P}-root { position: absolute; inset: 0; display: grid; place-items: center; background: var(--board);
      background-image: linear-gradient(var(--grid) 1px, transparent 1px), linear-gradient(90deg, var(--grid) 1px, transparent 1px);
      background-size: 100px 100px; }
    .${P}-col { position: relative; display: flex; flex-direction: column; align-items: center; gap: 16px; }
    .${P}-pips { display: flex; gap: 8px; height: 12px; }
    .${P}-pip { width: 12px; height: 12px; border-radius: 50%; border: 1.5px solid var(--ink); box-sizing: border-box; }
    /* 스킬 버튼: 잉크색 원판, 안에는 외곽선 없는 종이색 번개 실루엣 */
    .${P}-btn { position: relative; width: 112px; height: 112px; border-radius: 50%; border: 0; padding: 0; background: ${ILLO.ink}; color: var(--on-ink);
      box-sizing: border-box; cursor: pointer; overflow: hidden; font: inherit; transition: translate .2s; -webkit-tap-highlight-color: transparent; }
    .${P}-btn:focus-visible { outline: 2px solid var(--ink); outline-offset: 4px; }
    .${P}-btn.ready:hover { translate: 0 -3px; }
    .${P}-btn.cooling { cursor: not-allowed; }
    .${P}-btn svg { position: absolute; left: 50%; top: 50%; width: 48px; height: 48px; transform: translate(-50%,-50%); overflow: visible; }
    .${P}-shade { position: absolute; inset: 0; pointer-events: none; }
    .${P}-num { position: absolute; inset: 0; display: grid; place-items: center; font-size: 30px; font-weight: 800; color: #fff; mix-blend-mode: difference;
      font-variant-numeric: tabular-nums; pointer-events: none; }
    .${P}-ring { position: absolute; left: 50%; top: 50%; width: 112px; height: 112px; margin: -56px 0 0 -56px; border-radius: 50%;
      border: 2px solid var(--accent); pointer-events: none; opacity: 0; }
    .${P}-bar { width: 112px; height: 6px; border-radius: 3px; background: var(--line); overflow: hidden; transition: opacity .25s; }
    .${P}-bar b { display: block; height: 100%; background: var(--ink); transform-origin: left; }
    .${P}-cap { font-size: 13px; color: var(--ink-2); height: 18px; white-space: nowrap; }
    .${P}-cap.deny { color: var(--accent); font-weight: 700; }
  `);

  const root = document.createElement("div");
  root.className = `${P}-root`;
  root.innerHTML = `
    <div class="${P}-col">
      <div class="${P}-pips"></div>
      <div style="position:relative">
        <div class="${P}-ring"></div>
        <button class="${P}-btn ready" aria-label="스킬 사용">
          <svg viewBox="0 0 48 48"><path d="M26 3 L8 27 H22 L20 45 L38 21 H24 Z" fill="${ILLO.paper}"/></svg>
          <div class="${P}-shade"></div>
          <div class="${P}-num"></div>
        </button>
      </div>
      <div class="${P}-bar"><b></b></div>
      <div class="${P}-cap">준비됨</div>
    </div>`;
  el.appendChild(root);
  const btn = root.querySelector(`.${P}-btn`), shade = root.querySelector(`.${P}-shade`), num = root.querySelector(`.${P}-num`);
  const ring = root.querySelector(`.${P}-ring`), bar = root.querySelector(`.${P}-bar`), barFill = bar.querySelector("b");
  const pipsEl = root.querySelector(`.${P}-pips`), cap = root.querySelector(`.${P}-cap`);

  const st = { charges: +S.charges, t: 0, uses: 0, denied: 0, shake: 0, ringT: 1, readyT: 1, denyT: 1 };
  const maxC = () => Math.round(S.charges);

  const buildPips = () => {
    const m = maxC();
    st.charges = Math.min(st.charges, m);
    pipsEl.innerHTML = Array.from({ length: m }, () => `<i class="${P}-pip"></i>`).join("");
    pipsEl.style.visibility = m > 1 ? "visible" : "hidden";
  };
  buildPips();
  api.onParam(k => { if (k === "charges") buildPips(); });

  const use = () => {
    api.hideHint();
    if (st.charges <= 0) {
      st.denied++; st.shake = 1; st.denyT = 0;
      const left = (S.dur * 1000 - st.t) / 1000;
      api.flash(`거부됨 · 아직 ${left.toFixed(1)}초 남음`, "alt", 900);
      return;
    }
    if (st.charges === maxC()) st.t = 0; // 가득 찬 상태에서 쓰면 충전 시계가 이때부터 돈다
    st.charges--; st.uses++; st.ringT = 0;
  };
  api.on(btn, "click", use);
  api.on(window, "keydown", e => {
    if (e.target.closest("input, textarea, [contenteditable]")) return;
    if (e.code !== "Space" || e.target === btn) return;
    e.preventDefault();
    if (!e.repeat) use();
  });

  api.frame(dt => {
    const m = maxC(), dur = S.dur * 1000;
    if (st.charges < m) {
      st.t += dt;
      while (st.t >= dur && st.charges < m) {
        st.t -= dur; st.charges++;
        if (st.charges === 1 || st.charges === m) st.readyT = 0;
      }
      if (st.charges >= m) st.t = 0;
    }
    const cooling = st.charges <= 0;
    const frac = st.charges < m ? clamp(st.t / dur, 0, 1) : 1; // 다음 충전까지 진행도
    const left = st.charges < m ? (dur - st.t) / 1000 : 0;
    btn.classList.toggle("cooling", cooling);
    btn.classList.toggle("ready", !cooling);

    const mode = S.display;
    // 원형 스윕: 남은 부분만 덮개가 덮고, 시계 방향으로 걷힌다
    if (cooling && mode === "radial") {
      const deg = frac * 360;
      shade.style.background = `conic-gradient(transparent 0 ${deg}deg, rgba(239,233,221,.78) ${deg}deg 360deg)`;
    } else if (cooling) shade.style.background = "rgba(239,233,221,.78)";
    else shade.style.background = "none";
    num.textContent = cooling && mode !== "bar" ? (left >= 1 ? Math.ceil(left) : left.toFixed(1)) : "";
    num.style.fontSize = mode === "number" ? "40px" : "30px";
    bar.style.opacity = mode === "bar" ? 1 : 0;
    barFill.style.transform = `scaleX(${cooling ? frac : st.charges < m ? frac : 1})`;
    barFill.style.background = cooling ? "var(--ink-3)" : "var(--ink)";

    [...pipsEl.children].forEach((p, i) => {
      if (i < st.charges) p.style.background = "var(--ink)";
      else if (i === st.charges) p.style.background = `conic-gradient(var(--ink-3) 0 ${frac * 360}deg, transparent ${frac * 360}deg)`;
      else p.style.background = "transparent";
    });

    // 사용 링, 준비 완료 표시, 거부 흔들림
    st.ringT = Math.min(1, st.ringT + dt / 500);
    ring.style.opacity = (1 - st.ringT).toFixed(3);
    ring.style.transform = `scale(${1 + st.ringT * 0.9})`;
    st.readyT = Math.min(1, st.readyT + dt / 400);
    btn.style.boxShadow = st.readyT < 1 ? `0 0 0 ${3 + st.readyT * 6}px rgba(27,27,26,${(1 - st.readyT) * 0.35})` : "none";
    st.shake = Math.max(0, st.shake - dt / 350);
    st.denyT = Math.min(1, st.denyT + dt / 900);
    btn.style.transform = `translateX(${Math.sin(st.shake * 30) * st.shake * 7}px) scale(${1 - 0.07 * Math.sin(Math.PI * Math.min(1, st.ringT * 3))})`;

    if (st.denyT < 1) { cap.textContent = "아직 쓸 수 없다"; cap.classList.add("deny"); }
    else {
      cap.classList.remove("deny");
      cap.textContent = cooling ? `쿨다운 중 · ${left.toFixed(1)}초` : m > 1 ? `사용 가능 · ${st.charges}회` : "준비됨";
    }

    api.read("left", st.charges < m ? left.toFixed(1) + "초" : "–");
    api.read("charges", `${st.charges} / ${m}`);
    api.read("uses", st.uses);
    api.read("denied", st.denied);
    if (cooling) api.status(`쿨다운 중 · ${left.toFixed(1)}초 남음`, "active");
    else if (st.charges < m) api.status(`사용 가능 · 충전 중 (${st.charges}/${m}) · ${left.toFixed(1)}초`, "alt");
    else api.status("준비됨", "ok");
  });
}
