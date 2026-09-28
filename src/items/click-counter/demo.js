import { clamp, lerp, fitCanvas } from "../../lib/util.js";

export default function demo(api) {
  const { el, S } = api;
  const P = "click-counter";
  api.css(`
    .${P}-root { position: absolute; inset: 0; background: var(--board);
      background-image: linear-gradient(var(--grid) 1px, transparent 1px), linear-gradient(90deg, var(--grid) 1px, transparent 1px);
      background-size: 100px 100px; }
    .${P}-center { position: absolute; left: 50%; top: 42%; transform: translate(-50%,-50%); display: flex; flex-direction: column; align-items: center; gap: 22px; }
    .${P}-num { font-size: 96px; font-weight: 800; line-height: 1; color: var(--ink); font-variant-numeric: tabular-nums; letter-spacing: -.03em;
      transition: font-size .35s cubic-bezier(.3,1.4,.5,1); will-change: transform; }
    .${P}-root.mode-objects .${P}-num { font-size: 40px; }
    .${P}-btn { width: 150px; height: 150px; border-radius: 50%; border: 0; font: inherit; font-size: 18px; font-weight: 800;
      background: var(--accent); color: var(--on-ink); cursor: pointer;
      transition: translate .2s; will-change: transform; -webkit-tap-highlight-color: transparent; }
    .${P}-btn:hover { translate: 0 -3px; }
    .${P}-btn:focus-visible { outline: 3px solid var(--ink); outline-offset: 4px; }
    .${P}-combo { height: 26px; display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 700; color: var(--accent);
      opacity: 0; transition: opacity .25s; }
    .${P}-combo.on { opacity: 1; }
    .${P}-combo i { display: block; width: 80px; height: 5px; border-radius: 3px; background: var(--line); overflow: hidden; }
    .${P}-combo i b { display: block; height: 100%; background: var(--accent); transform-origin: left; }
    .${P}-float { position: absolute; pointer-events: none; font-size: 18px; font-weight: 800; color: var(--accent); white-space: nowrap;
      transform: translate(-50%,-50%); animation: ${P}-up .8s ease-out forwards; }
    .${P}-float.big { font-size: 24px; }
    @keyframes ${P}-up { 0% { opacity: 0; transform: translate(-50%,-30%) scale(.6); } 15% { opacity: 1; transform: translate(-50%,-60%) scale(1.1); } 100% { opacity: 0; transform: translate(-50%,-260%) scale(1); } }
    @media (max-width: 600px) { .${P}-num { font-size: 64px; } .${P}-btn { width: 120px; height: 120px; } }
  `);

  const root = document.createElement("div");
  root.className = `${P}-root`;
  el.appendChild(root);
  const { g, size } = fitCanvas(api, { parent: root });
  const C = { ink: api.color("--ink") };
  const center = document.createElement("div");
  center.className = `${P}-center`;
  center.innerHTML = `<div class="${P}-num">0</div><button class="${P}-btn">+1</button><div class="${P}-combo"><span>콤보 ×1</span><i><b></b></i></div>`;
  root.appendChild(center);
  const numEl = center.querySelector(`.${P}-num`), btn = center.querySelector(`.${P}-btn`);
  const comboEl = center.querySelector(`.${P}-combo`), comboTxt = comboEl.querySelector("span"), comboBar = comboEl.querySelector("b");

  const COMBO_MS = 450;
  const st = { clicks: 0, total: 0, shown: 0, last: 0, gap: 0, streak: 0, mult: 1, nPop: 0, nVel: 0, bPop: 0, bVel: 0 };
  const tokens = [];
  const TOK = 14, GAP = 5;
  let tokenAlpha = S.mode === "objects" ? 1 : 0;

  const applyMode = () => root.classList.toggle("mode-objects", S.mode === "objects");
  applyMode();
  const labelBtn = () => { btn.textContent = `+${S.step * (S.combo ? st.mult : 1)}`; };
  labelBtn();
  api.onParam(k => { if (k === "mode") applyMode(); labelBtn(); });

  const slotPos = i => {
    const cols = Math.max(1, Math.floor((size.w - 32) / (TOK + GAP)));
    const x0 = (size.w - cols * (TOK + GAP) + GAP) / 2 + TOK / 2;
    return { x: x0 + (i % cols) * (TOK + GAP), y: size.h - 20 - Math.floor(i / cols) * (TOK + GAP), cols };
  };
  const capacity = () => {
    const cols = slotPos(0).cols;
    const top = center.getBoundingClientRect().bottom - root.getBoundingClientRect().top + 10;
    const rows = Math.max(1, Math.floor((size.h - 20 - top) / (TOK + GAP)));
    return cols * rows;
  };

  const pop = (x, y, text, big) => {
    const f = document.createElement("div");
    f.className = `${P}-float` + (big ? " big" : "");
    f.textContent = text; f.style.left = x + "px"; f.style.top = y + "px";
    root.appendChild(f);
    api.timeout(() => f.remove(), 820);
  };

  api.on(btn, "pointerdown", e => { if (S.feedback) st.bVel -= 0.09; });
  api.on(btn, "click", e => {
    const now = performance.now();
    st.gap = st.last ? now - st.last : 0;
    st.last = now;
    if (S.combo && st.gap && st.gap < COMBO_MS) st.streak++; else st.streak = 0;
    st.mult = S.combo ? Math.min(5, 1 + Math.floor(st.streak / 4)) : 1;
    const add = S.step * st.mult;
    st.clicks++; st.total += add;
    api.hideHint();

    const r = root.getBoundingClientRect();
    const cx = e.clientX ? e.clientX - r.left : btn.getBoundingClientRect().left - r.left + 75;
    const cy = e.clientY ? e.clientY - r.top : btn.getBoundingClientRect().top - r.top + 75;
    if (S.mode === "objects") {
      const n = Math.min(add, 30);
      for (let i = 0; i < n; i++) {
        const idx = tokens.length;
        const a = Math.random() * Math.PI * 2, sp = 2 + Math.random() * 4;
        tokens.push({ x: S.feedback ? cx : NaN, y: S.feedback ? cy : NaN, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 4, s: S.feedback ? 0 : 1, c: C.ink, born: now + i * 18 });
      }
    }
    if (S.feedback) {
      st.nVel += 0.12 + Math.min(0.1, st.mult * 0.02);
      st.bVel += 0.02;
      pop(cx + (Math.random() - 0.5) * 30, cy - 20, `+${add}`, st.mult > 1);
    } else {
      st.shown = st.total;
    }
    labelBtn();
  });

  api.frame((dt, t) => {
    const k = dt / 16.67, now = performance.now();
    // 콤보 유지 시간
    const left = S.combo && st.streak > 0 ? clamp(1 - (now - st.last) / COMBO_MS, 0, 1) : 0;
    if (S.combo && st.streak > 0 && left <= 0) { st.streak = 0; st.mult = 1; labelBtn(); }
    comboEl.classList.toggle("on", S.combo && st.streak > 0);
    comboTxt.textContent = `콤보 ×${st.mult}`;
    comboBar.style.transform = `scaleX(${left})`;

    // 숫자: 피드백이 켜져 있으면 굴러 올라간다
    if (S.feedback) st.shown = st.shown < st.total ? Math.min(st.total, st.shown + Math.max(1, Math.ceil((st.total - st.shown) * 0.25))) : st.total;
    else st.shown = st.total;
    numEl.textContent = st.shown;
    st.nVel = st.nVel * 0.72 - st.nPop * 0.28; st.nPop += st.nVel;
    st.bVel = st.bVel * 0.7 - st.bPop * 0.3; st.bPop += st.bVel;
    numEl.style.transform = `scale(${1 + st.nPop})`;
    btn.style.transform = `scale(${1 + st.bPop}, ${1 - st.bPop * 0.6})`;

    // 개체
    const cap = capacity();
    const cols = slotPos(0).cols;
    const off = tokens.length > cap ? Math.ceil((tokens.length - cap) / cols) * cols : 0;
    const vis = S.mode === "objects" ? 1 : 0;
    g.clearRect(0, 0, size.w, size.h);
    for (let i = tokens.length - 1; i >= 0; i--) {
      const o = tokens[i];
      const slot = slotPos(i - off);
      if (i < off) { o.s = lerp(o.s, 0, 0.25); if (o.s < 0.02) { tokens.splice(i, 1); } continue; }
      if (isNaN(o.x)) { o.x = slot.x; o.y = slot.y; }
      if (now < o.born) continue;
      if (o.vx || o.vy) {
        o.x += o.vx * k; o.y += o.vy * k; o.vx *= 0.9; o.vy *= 0.9;
        if (Math.abs(o.vx) + Math.abs(o.vy) < 0.3) o.vx = o.vy = 0;
      }
      o.x = lerp(o.x, slot.x, 1 - Math.pow(0.86, k)); o.y = lerp(o.y, slot.y, 1 - Math.pow(0.86, k));
      o.s = lerp(o.s, 1, 0.25);
    }
    g.globalAlpha = 1;
    tokenAlpha = lerp(tokenAlpha, vis, 0.15);
    if (tokenAlpha > 0.01) {
      g.globalAlpha = tokenAlpha;
      for (const o of tokens) {
        if (now < o.born || isNaN(o.x)) continue;
        g.fillStyle = o.c;
        g.beginPath(); g.arc(o.x, o.y, TOK / 2 * o.s, 0, Math.PI * 2); g.fill();
      }
      g.globalAlpha = 1;
    }

    api.read("clicks", st.clicks);
    api.read("total", st.total);
    api.read("gap", st.gap ? Math.round(st.gap) + "ms" : "–");
    api.read("mult", "×" + st.mult);
    if (now - st.last < 300) api.status(`클릭 · +${S.step * st.mult}${st.mult > 1 ? ` (콤보 ×${st.mult})` : ""}`, "active");
    else if (st.streak > 0) api.status(`콤보 유지 중 · ${Math.round(left * COMBO_MS)}ms 안에 다시 클릭`, "alt");
    else api.status(st.clicks ? `대기 · 합계 ${st.total}` : "대기", "idle");
  });
}
