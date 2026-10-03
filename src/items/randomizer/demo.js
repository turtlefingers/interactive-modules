import { clamp } from "../../lib/util.js";
import { ILLO, TONE } from "../../lib/draw.js";
import { objectCanvas } from "../../lib/objects.js";
import "../../lib/objects/index.js";

export default function demo(api) {
  const { el, S } = api;
  const NS = "http://www.w3.org/2000/svg";
  const INK = ILLO.ink, PAPER = ILLO.paper;
  const ACC = api.color("--accent") || "#ff5a36";

  /* ---------- 결과와 확률 ---------- */
  // 등급 색: 톤 세 단계 + 전설만 강조색
  const TIERS = [
    { name: "일반", prize: "스티커", fill: TONE[0] },
    { name: "희귀", prize: "배지", fill: TONE[2] },
    { name: "영웅", prize: "피규어", fill: TONE[4] },
    { name: "전설", prize: "황금 고양이", fill: ACC }
  ];
  const TIER_W = [60, 25, 12, 3];
  const outcomes = kind => (kind === "dice" ? ["1", "2", "3", "4", "5", "6"] : TIERS.map(t => t.name));
  const weights = kind => {
    if (kind === "dice") return S.weighted ? [1, 1, 1, 1, 1, 2.5] : [1, 1, 1, 1, 1, 1];
    return S.weighted ? TIER_W : [1, 1, 1, 1];
  };
  const probs = kind => { const w = weights(kind), s = w.reduce((a, b) => a + b, 0); return w.map(x => x / s); };
  const pickWeighted = kind => {
    const p = probs(kind); let r = Math.random();
    for (let i = 0; i < p.length; i++) { r -= p[i]; if (r < 0) return i; }
    return p.length - 1;
  };
  const hist = { dice: [], gacha: [], roulette: [] };
  const LABEL = { dice: "굴리기", gacha: "뽑기", roulette: "돌리기" };

  api.css(`
    .randomizer-root { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; gap: 56px; padding: 64px 32px 72px; }
    .randomizer-main { display: flex; flex-direction: column; align-items: center; gap: 14px; }
    .randomizer-stage { position: relative; width: 300px; height: 320px; }
    .randomizer-app { position: absolute; inset: 0; display: grid; place-items: center; transition: opacity .3s, transform .3s; }
    .randomizer-app.off { opacity: 0; transform: scale(.94); pointer-events: none; }
    .randomizer-app svg { width: 100%; height: 100%; overflow: visible; }
    /* 캡슐 뽑기: 사물 카탈로그(gacha-machine, capsule) 캔버스를 300×320 무대 좌표에 놓는다 */
    .randomizer-gacha { position: absolute; left: 0; top: 0; width: 300px; height: 320px; transform-origin: 0 0; }
    .randomizer-root.narrow .randomizer-gacha { transform: scale(.8); }
    .randomizer-machine { position: absolute; left: 0; top: 0; transform-origin: 50% 100%; }
    .randomizer-machine canvas, .randomizer-outcap-img canvas { display: block; }
    .randomizer-outcap { position: absolute; left: 0; top: 0; opacity: 0; transform-origin: 50% 80%; }
    .randomizer-outcap-label { position: absolute; left: 50%; top: -30px; transform: translateX(-50%); font-size: 15px; font-weight: 700; white-space: nowrap; opacity: 0; }
    .randomizer-result { font-size: 18px; font-weight: 700; color: var(--ink); height: 26px; text-align: center; font-variant-numeric: tabular-nums; }
    .randomizer-result small { font-size: 13px; font-weight: 500; color: var(--ink-3); margin-left: 6px; }
    .randomizer-result .legend { color: var(--accent); }
    .randomizer-go { font: inherit; font-size: 15px; font-weight: 700; min-width: 160px; padding: 13px 28px; border-radius: var(--r-pill);
      background: var(--ink); color: var(--on-ink); border: 0; cursor: pointer; transition: transform .12s, opacity .2s; }
    .randomizer-go:hover { transform: translateY(-2px); }
    .randomizer-go:active { transform: scale(.96); }
    .randomizer-go[disabled] { opacity: .35; cursor: default; transform: none; }
    .randomizer-side { width: 270px; display: flex; flex-direction: column; gap: 22px; }
    .randomizer-side h4 { margin: 0 0 10px; font-size: 13px; font-weight: 700; color: var(--ink); display: flex; justify-content: space-between; }
    .randomizer-side h4 span { font-weight: 500; color: var(--ink-3); }
    .randomizer-hist { display: flex; gap: 5px; flex-wrap: wrap; min-height: 30px; align-content: flex-start; }
    .randomizer-chip { font-size: 13px; font-weight: 600; min-width: 28px; height: 28px; padding: 0 8px; border-radius: 6px; display: grid; place-items: center;
      border: 1px solid rgba(0,0,0,.16); color: var(--ink); }
    .randomizer-chip.legend { border-color: var(--accent); color: var(--accent); }
    .randomizer-chip.old { opacity: .45; }
    .randomizer-dist { display: flex; flex-direction: column; gap: 9px; }
    .randomizer-row { display: grid; grid-template-columns: 34px 1fr 64px; gap: 8px; align-items: center; font-size: 13px; }
    .randomizer-row b { font-weight: 600; }
    .randomizer-row span { color: var(--ink-3); text-align: right; font-variant-numeric: tabular-nums; }
    .randomizer-track { position: relative; height: 10px; background: rgba(0,0,0,.05); border-radius: 2px; }
    .randomizer-bar { position: absolute; left: 0; top: 0; bottom: 0; background: var(--ink); border-radius: 2px; transition: width .35s cubic-bezier(.2,.8,.2,1); }
    .randomizer-row.legend .randomizer-bar { background: var(--accent); }
    .randomizer-exp { position: absolute; top: -3px; bottom: -3px; width: 1.5px; margin-left: -.75px; background: var(--ink-3); transition: left .35s; }
    .randomizer-note { font-size: 13px; color: var(--ink-3); line-height: 1.5; }
    .randomizer-root.narrow { flex-direction: column; gap: 18px; justify-content: flex-start; overflow-y: auto; padding: 60px 16px 64px; }
    .randomizer-root.narrow .randomizer-stage { width: 240px; height: 256px; }
    .randomizer-root.narrow .randomizer-side { width: 100%; max-width: 340px; }
    .randomizer-cube-scene { width: 120px; height: 120px; perspective: 700px; }
    .randomizer-cube { position: relative; width: 120px; height: 120px; transform-style: preserve-3d; }
    /* 주사위: 종이색 면 + 톤 명도 차이로만 입체감, 1px 톤 모서리. 6은 강조면 */
    .randomizer-face { position: absolute; inset: 0; background: ${PAPER}; border: 1px solid ${TONE[3]}; border-radius: 10px; box-sizing: border-box;
      display: grid; grid-template: repeat(3, 1fr) / repeat(3, 1fr); padding: 14px; backface-visibility: hidden; }
    .randomizer-face.side { background: ${TONE[1]}; }
    .randomizer-face.cap { background: ${TONE[2]}; }
    .randomizer-face.mark { background: ${ACC}; border-color: ${ACC}; }
    .randomizer-face i { width: 18px; height: 18px; border-radius: 50%; background: ${INK}; place-self: center; visibility: hidden; }
    .randomizer-face.mark i { background: ${PAPER}; }
    .randomizer-face i.on { visibility: visible; }
    .randomizer-dice-note { position: absolute; bottom: 8px; left: 0; right: 0; text-align: center; font-size: 13px; color: var(--ink-3); transition: opacity .3s; }
  `);

  /* ---------- DOM ---------- */
  const root = document.createElement("div");
  root.className = "randomizer-root";
  el.appendChild(root);
  root.innerHTML = `
    <div class="randomizer-main">
      <div class="randomizer-stage">
        <div class="randomizer-app" data-kind="dice"><div class="randomizer-cube-scene"><div class="randomizer-cube"></div></div><div class="randomizer-dice-note">무거운 주사위 · 6이 잘 나온다</div></div>
        <div class="randomizer-app" data-kind="gacha"><div class="randomizer-gacha"><div class="randomizer-machine"></div><div class="randomizer-outcap"><div class="randomizer-outcap-img"></div><div class="randomizer-outcap-label"></div></div></div></div>
        <div class="randomizer-app" data-kind="roulette"><svg viewBox="0 0 300 320"></svg></div>
      </div>
      <div class="randomizer-result"></div>
      <button class="randomizer-go"></button>
    </div>
    <div class="randomizer-side">
      <div><h4>기록<span class="randomizer-count"></span></h4><div class="randomizer-hist"></div></div>
      <div><h4>분포<span>막대 = 나온 비율 · 선 = 확률</span></h4><div class="randomizer-dist"></div></div>
      <div class="randomizer-note"></div>
    </div>`;
  const $ = s => root.querySelector(s);
  const goBtn = $(".randomizer-go"), resultEl = $(".randomizer-result"), histEl = $(".randomizer-hist"), distEl = $(".randomizer-dist");
  const countEl = $(".randomizer-count"), noteEl = $(".randomizer-note"), diceNote = $(".randomizer-dice-note");
  const apps = {};
  root.querySelectorAll(".randomizer-app").forEach(a => { apps[a.dataset.kind] = a; });
  const mk = (tag, attrs, parent) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); parent.appendChild(e); return e; };

  /* ---------- 주사위 ---------- */
  const cube = $(".randomizer-cube");
  const PIPS = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };
  const FACE_T = { 1: "", 6: "rotateY(180deg)", 2: "rotateY(90deg)", 5: "rotateY(-90deg)", 3: "rotateX(90deg)", 4: "rotateX(-90deg)" };
  const FACE_R = { 1: [0, 0], 6: [0, 180], 2: [0, -90], 5: [0, 90], 3: [-90, 0], 4: [90, 0] };
  const FACE_CLS = { 1: "", 6: "mark", 2: "side", 5: "side", 3: "cap", 4: "cap" };
  for (let v = 1; v <= 6; v++) {
    const f = document.createElement("div");
    f.className = "randomizer-face " + FACE_CLS[v];
    f.style.transform = `${FACE_T[v]} translateZ(60px)`;
    for (let i = 0; i < 9; i++) { const p = document.createElement("i"); if (PIPS[v].includes(i)) p.className = "on"; f.appendChild(p); }
    cube.appendChild(f);
  }
  const dice = { rx: 0, ry: 0, fx: 0, fy: 0, tx: 0, ty: 0, y: 0 };
  const setCube = () => { cube.style.transform = `translateY(${dice.y}px) rotateX(-14deg) rotateY(18deg) rotateX(${dice.rx}deg) rotateY(${dice.ry}deg)`; };
  setCube();

  /* ---------- 캡슐 뽑기 기계 (사물 카탈로그) ---------- */
  // 기계는 gacha-machine(톤 몸통 + 종이색 돔, 안의 캡슐은 카탈로그가 그린다). 돌리는 동안 기계 전체가 들썩이고,
  // 배출구(카탈로그 A: 몸통 왼쪽 아래)에서 캡슐(capsule A)이 굴러 나온 뒤 열린 캡슐(capsule C)로 바뀐다. 캡슐 색 = 등급 톤, 전설만 강조색
  const MH = 250, MS = MH / 84;                      // 기계 높이(px)와 카탈로그 배율
  const MACH = { x: 150, y: 296, w: 56 * MS, pad: 4 }; // 무대 좌표의 기계 아래 가운데
  const gachaEl = apps.gacha.querySelector(".randomizer-gacha");
  const machineEl = gachaEl.querySelector(".randomizer-machine");
  const machineCv = objectCanvas("gacha-machine", MH, { color: TONE[4] }, { w: MACH.w, pad: MACH.pad });
  machineEl.appendChild(machineCv);
  Object.assign(machineEl.style, { left: MACH.x - MACH.w / 2 + "px", top: MACH.y + MACH.pad - (MH + MACH.pad * 2) + "px" });
  const outCap = gachaEl.querySelector(".randomizer-outcap"), capImg = gachaEl.querySelector(".randomizer-outcap-img"), capLabel = gachaEl.querySelector(".randomizer-outcap-label");
  const CAP = { h: 76, w: 106, pad: 4 };
  const setCap = (variant, color) => capImg.replaceChildren(objectCanvas("capsule", CAP.h, { variant, color }, { w: CAP.w, pad: CAP.pad }));
  setCap("A", TONE[2]);
  // 캡슐 아래 가운데를 무대 좌표 (x, y)에 놓는다
  const placeCap = (x, y, rot, op) => { outCap.style.opacity = op; outCap.style.transform = `translate(${x - CAP.w / 2}px, ${y + CAP.pad - (CAP.h + CAP.pad * 2)}px) rotate(${rot}deg)`; };
  const CAP_FROM = { x: MACH.x - 10.5 * MS, y: MACH.y - 6 * MS }, CAP_TO = { x: 62, y: 302 }; // 배출구 → 바닥

  /* ---------- 룰렛 ---------- */
  const rsvg = apps.roulette.querySelector("svg");
  const RC = { x: 150, y: 170, r: 128 };
  const wheel = mk("g", {}, rsvg);
  const SEG_TIER = [0, 1, 2, 3, 0, 1, 2, 3];
  const segFrac = () => { // 칸 넓이 = 확률
    const p = probs("roulette");
    return SEG_TIER.map(t => p[t] / 2);
  };
  let fr = segFrac();
  // 톤 칸 채움 + 1px 종이색 칸막이 선, 바늘은 잉크
  const segEls = SEG_TIER.map(t => ({ path: mk("path", { fill: TIERS[t].fill, stroke: PAPER, "stroke-width": 1 }, wheel),
    text: mk("text", { "text-anchor": "middle", "font-size": 13, "font-weight": 600, fill: t === 2 || t === 3 ? PAPER : INK }, wheel) }));
  mk("circle", { cx: RC.x, cy: RC.y, r: 9, fill: INK }, rsvg);
  const needle = mk("path", { d: `M${RC.x - 9} ${RC.y - RC.r - 18} H${RC.x + 9} L${RC.x} ${RC.y - RC.r + 10} Z`, fill: INK }, rsvg);
  const drawWheel = () => {
    let a0 = -Math.PI / 2;
    const pt = a => `${RC.x + Math.cos(a) * RC.r} ${RC.y + Math.sin(a) * RC.r}`;
    fr.forEach((f, i) => {
      const a1 = a0 + f * Math.PI * 2;
      segEls[i].path.setAttribute("d", `M${RC.x} ${RC.y} L${pt(a0)} A${RC.r} ${RC.r} 0 ${f > 0.5 ? 1 : 0} 1 ${pt(a1)} Z`);
      const m = (a0 + a1) / 2, show = f * 360 > 16;
      segEls[i].text.setAttribute("x", RC.x + Math.cos(m) * RC.r * 0.66);
      segEls[i].text.setAttribute("y", RC.y + Math.sin(m) * RC.r * 0.66 + 4);
      segEls[i].text.textContent = show ? TIERS[SEG_TIER[i]].name : "";
      a0 = a1;
    });
  };
  drawWheel();
  const rou = { ang: 0, from: 0, to: 0, seg: -1, kick: 0 };
  const segAt = ang => { // 바늘(위쪽) 아래에 있는 칸
    const a = ((-ang % 360) + 360) % 360 / 360;
    let acc = 0;
    for (let i = 0; i < fr.length; i++) { acc += fr[i]; if (a < acc) return i; }
    return fr.length - 1;
  };

  /* ---------- 뽑기 진행 ---------- */
  let roll = null; // { kind, idx, t0, T }
  let lastKind = S.kind;
  const go = () => {
    if (roll) return;
    api.hideHint();
    const kind = S.kind, T = S.dur * 1000;
    const r = { kind, t0: performance.now(), T, idx: 0 };
    if (kind === "roulette") {
      const a = Math.random(); // 칸 넓이에 비례하는 공정한 무작위 각도
      let acc = 0, i = 0;
      for (; i < fr.length; i++) { acc += fr[i]; if (a < acc) break; }
      r.seg = Math.min(i, fr.length - 1);
      r.idx = SEG_TIER[r.seg];
      const spins = 2 + Math.round(S.dur * 1.5);
      const base = -a * 360;
      rou.from = rou.ang;
      rou.to = rou.ang - (((rou.ang - base) % 360 + 360) % 360) - 360 * spins;
    } else {
      r.idx = pickWeighted(kind);
      if (kind === "dice") {
        const [fx, fy] = FACE_R[r.idx + 1];
        const spins = 1 + Math.round(S.dur * 1.2);
        dice.fx = dice.rx; dice.fy = dice.ry;
        dice.tx = fx + 360 * Math.ceil((dice.rx + 360 * spins - fx) / 360);
        dice.ty = fy + 360 * Math.ceil((dice.ry + 360 * spins - fy) / 360);
      }
      if (kind === "gacha") { [capImg, capLabel].forEach(x => x.getAnimations().forEach(a => a.cancel())); outCap.style.opacity = 0; setCap("A", TONE[2]); }
    }
    roll = r;
    goBtn.disabled = true;
    resultEl.innerHTML = "…";
  };
  const finish = () => {
    const r = roll; roll = null;
    if (r.kind === "roulette") r.idx = SEG_TIER[segAt(rou.ang)]; // 실제로 바늘이 가리키는 칸
    goBtn.disabled = false;
    const list = outcomes(r.kind), name = list[r.idx];
    hist[r.kind].unshift(r.idx);
    if (hist[r.kind].length > 200) hist[r.kind].pop();
    const legend = r.kind !== "dice" && r.idx === 3;
    const p = probs(r.kind)[r.idx];
    resultEl.innerHTML = r.kind === "dice" ? `${name}<small>${Math.round(p * 1000) / 10}%</small>`
      : `<span class="${legend ? "legend" : ""}">${name}${r.kind === "gacha" ? " · " + TIERS[r.idx].prize : ""}</span><small>${Math.round(p * 1000) / 10}%</small>`;
    resultEl.animate([{ transform: "scale(1.15)" }, { transform: "scale(1)" }], { duration: 260, easing: "cubic-bezier(.3,1.5,.5,1)" });
    if (r.kind === "gacha") {
      capLabel.textContent = TIERS[r.idx].name;
      capLabel.style.color = legend ? ACC : INK;
      setCap("C", r.idx === 0 ? TONE[2] : TIERS[r.idx].fill); // 열린 캡슐: 색이 등급을 알린다
    }
    lastResult = { kind: r.kind, name, p };
    renderSide(true);
    if (legend) api.flash("전설 등장 · 확률 " + Math.round(p * 1000) / 10 + "%", "ok");
  };
  let lastResult = null;

  const renderSide = fresh => {
    const kind = S.kind, h = hist[kind], list = outcomes(kind), p = probs(kind);
    countEl.textContent = `${h.length}회`;
    histEl.innerHTML = h.length ? h.slice(0, 18).map((i, n) =>
      `<div class="randomizer-chip${kind !== "dice" && i === 3 ? " legend" : ""}${n > 9 ? " old" : ""}">${list[i]}</div>`).join("")
      : `<div class="randomizer-note">아직 없다</div>`;
    const first = histEl.firstElementChild;
    if (first && fresh) first.animate([{ transform: "scale(.4)", opacity: 0 }, { transform: "none", opacity: 1 }], { duration: 260, easing: "cubic-bezier(.3,1.5,.5,1)" });
    const counts = list.map((_, i) => h.filter(x => x === i).length);
    if (distEl.children.length !== list.length) {
      distEl.innerHTML = list.map((name, i) => `<div class="randomizer-row${kind !== "dice" && i === 3 ? " legend" : ""}"><b>${name}</b><div class="randomizer-track"><div class="randomizer-bar"></div><div class="randomizer-exp"></div></div><span></span></div>`).join("");
    }
    [...distEl.children].forEach((row, i) => {
      const obs = h.length ? counts[i] / h.length : 0;
      row.querySelector(".randomizer-bar").style.width = obs * 100 + "%";
      row.querySelector(".randomizer-exp").style.left = p[i] * 100 + "%";
      row.querySelector("span").textContent = `${counts[i]}회 · ${Math.round(obs * 100)}%`;
    });
    noteEl.textContent = h.length < 20 ? "여러 번 뽑을수록 막대가 확률선에 가까워진다." : "많이 뽑을수록 나온 비율 막대가 확률선에 가까워진다.";
  };

  const applyKind = () => {
    for (const k in apps) apps[k].classList.toggle("off", k !== S.kind);
    goBtn.textContent = LABEL[S.kind];
    diceNote.style.opacity = S.weighted ? 1 : 0;
    if (lastKind !== S.kind) {
      if (roll) { roll = null; goBtn.disabled = false; }
      distEl.innerHTML = "";
      lastKind = S.kind;
      resultEl.innerHTML = "";
    }
    renderSide();
  };
  const applyNarrow = () => root.classList.toggle("narrow", el.clientWidth < 760);
  applyKind(); applyNarrow();
  api.onParam(() => applyKind());
  api.onResize(applyNarrow);

  api.on(goBtn, "click", go);
  api.on(window, "keydown", e => {
    if (e.code !== "Space" && e.key !== "Enter") return;
    if (e.target.closest && e.target.closest("input, textarea, [contenteditable]")) return;
    if (e.target !== document.body && !el.contains(e.target)) return;
    e.preventDefault(); go();
  });
  api.on(goBtn, "pointerdown", e => e.preventDefault()); // 포커스가 남아 스페이스가 두 번 눌리지 않게

  /* ---------- 루프 ---------- */
  const easeOut = p => 1 - Math.pow(1 - p, 4);
  api.frame((dt, t) => {
    const now = performance.now();
    const p = roll ? clamp((now - roll.t0) / Math.max(1, roll.T), 0, 1) : 1;
    // 룰렛 칸 넓이는 확률이 바뀌면 천천히 바뀐다
    const target = segFrac();
    let moved = false;
    fr = fr.map((f, i) => { const n = f + (target[i] - f) * Math.min(1, dt / 120); if (Math.abs(n - f) > 1e-5) moved = true; return Math.abs(target[i] - n) < 1e-4 ? target[i] : n; });
    if (moved) drawWheel();

    if (roll && roll.kind === "dice") {
      const e = easeOut(p);
      dice.rx = dice.fx + (dice.tx - dice.fx) * e;
      dice.ry = dice.fy + (dice.ty - dice.fy) * e;
      dice.y = -Math.abs(Math.sin(p * Math.PI * 3)) * (1 - p) * 60;
      setCube();
    }
    if (roll && roll.kind === "roulette") {
      rou.ang = rou.from + (rou.to - rou.from) * easeOut(p);
    }
    // 바늘: 칸 경계를 넘을 때마다 튕긴다
    const seg = segAt(rou.ang);
    if (seg !== rou.seg) { if (roll) rou.kick = 1; rou.seg = seg; }
    rou.kick = Math.max(0, rou.kick - dt / 90);
    wheel.setAttribute("transform", `rotate(${rou.ang} ${RC.x} ${RC.y})`);
    needle.setAttribute("transform", `rotate(${-rou.kick * 16} ${RC.x} ${RC.y - RC.r - 18})`);

    // 캡슐 뽑기: 앞 60%는 기계가 들썩이고(손잡이를 돌리는 동안), 그 뒤 배출구에서 캡슐이 굴러 나와 바닥에서 흔들리다 멈춘다
    const g = roll && roll.kind === "gacha";
    const shake = g && p < 0.6 ? Math.sin((p / 0.6) * Math.PI) : 0;
    machineEl.style.transform = shake > 0.001
      ? `translate(${Math.sin(t / 45) * 4 * shake}px, ${-Math.abs(Math.cos(t / 60)) * 3 * shake}px) rotate(${Math.sin(t / 70) * 2.5 * shake}deg)` : "none";
    if (g && p > 0.6) {
      const q = clamp((p - 0.6) / 0.25, 0, 1);
      const x = CAP_FROM.x + (CAP_TO.x - CAP_FROM.x) * easeOut(q), y = CAP_FROM.y + (CAP_TO.y - CAP_FROM.y) * easeOut(q);
      const wob = p > 0.85 ? Math.sin((p - 0.85) / 0.15 * Math.PI * 4) * 12 * (1 - (p - 0.85) / 0.15) : -q * 360;
      placeCap(x, y, wob, 1);
    }
    if (roll && p >= 1) {
      const opened = roll.kind === "gacha";
      finish();
      if (opened) { // 열린 캡슐(C)로 바뀌며 톡 튀고, 등급 이름이 떠오른다
        placeCap(CAP_TO.x, CAP_TO.y, 0, 1);
        capImg.animate([{ transform: "scale(.8)" }, { transform: "scale(1.08)" }, { transform: "none" }], { duration: 320, easing: "cubic-bezier(.2,.9,.3,1)" });
        capLabel.animate([{ opacity: 0, transform: "translate(-50%, 6px)" }, { opacity: 1, transform: "translate(-50%, 0)" }], { duration: 260, delay: 120, fill: "forwards" });
      }
    }

    // 읽는 값과 상태
    api.read("last", lastResult ? lastResult.name : "–");
    api.read("prob", lastResult ? Math.round(lastResult.p * 1000) / 10 + "%" : "–");
    api.read("total", hist[S.kind].length);
    api.read("time", roll ? `${((now - roll.t0) / 1000).toFixed(1)} / ${S.dur.toFixed(1)}` : "–");
    if (roll) api.status(`연출 중 · ${((now - roll.t0) / 1000).toFixed(1)}초`, "alt");
    else api.status(lastResult ? `결과 · ${lastResult.name}` : "대기", lastResult ? "ok" : "idle");
  });
}
