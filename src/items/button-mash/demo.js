import { clamp } from "../../lib/util.js";

export default function demo(api) {
  const { el, S } = api;

  api.css(`
    .button-mash-demo { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 28px; padding: 60px 16px 80px; }
    .button-mash-ring { position: relative; width: min(260px, 52vh, 70vw); aspect-ratio: 1; }
    .button-mash-ring svg { position: absolute; inset: 0; width: 100%; height: 100%; transform: rotate(-90deg); overflow: visible; }
    .button-mash-ring .num { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; }
    .button-mash-ring .num b { font-size: 56px; font-weight: 700; letter-spacing: -.03em; color: var(--ink); line-height: 1; font-variant-numeric: tabular-nums; }
    .button-mash-ring .num span { font-size: 13px; color: var(--ink-2); }
    .button-mash-ring.win .num b { color: var(--accent); }
    .button-mash-keys { display: flex; gap: 10px; }
    .button-mash-key { height: 56px; min-width: 56px; padding: 0 18px; display: grid; place-items: center; border-radius: 10px;
      border: 1.5px solid rgba(0,0,0,.2); color: var(--ink); font-size: 18px; font-weight: 600; cursor: pointer; touch-action: none; user-select: none;
      transition: background .05s, color .05s, border-color .1s; }
    .button-mash-key.wide { min-width: 240px; font-size: 15px; }
    .button-mash-key.next { border-color: var(--accent); }
    .button-mash-key.on { background: var(--accent); border-color: var(--accent); color: #fff; }
    .button-mash-key.bad { background: var(--ink); border-color: var(--ink); color: #fff; }
    .button-mash-meter { display: flex; align-items: flex-end; gap: 14px; font-size: 13px; color: var(--ink-2); }
    .button-mash-meter svg { display: block; }
    .button-mash-meter b { display: block; font-size: 18px; color: var(--ink); font-variant-numeric: tabular-nums; }
    .button-mash-timer { height: 18px; font-size: 15px; font-weight: 600; color: var(--ink); font-variant-numeric: tabular-nums; }
    @media (max-width: 600px) { .button-mash-key.wide { min-width: 180px; } .button-mash-ring .num b { font-size: 44px; } }
  `);

  const root = document.createElement("div");
  root.className = "button-mash-demo";
  const R = 44, CIRC = 2 * Math.PI * R;
  root.innerHTML = `
    <div class="button-mash-timer"></div>
    <div class="button-mash-ring">
      <svg viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="${R}" fill="none" stroke="rgba(0,0,0,.1)" stroke-width="6"/>
        <circle class="bar" cx="50" cy="50" r="${R}" fill="none" stroke="var(--accent)" stroke-width="6" stroke-dasharray="${CIRC}" stroke-dashoffset="${CIRC}"/>
        <line class="goal" x1="94" y1="50" x2="100" y2="50" stroke="var(--ink)" stroke-width="1.5"/>
      </svg>
      <div class="num"><b>0</b><span>%</span></div>
    </div>
    <div class="button-mash-keys"></div>
    <div class="button-mash-meter">
      <div><span>초당 누름</span><b class="tps">0.0</b></div>
      <svg class="spark" width="160" height="40"></svg>
    </div>`;
  el.appendChild(root);
  const ring = root.querySelector(".button-mash-ring"), bar = root.querySelector(".bar"), numB = root.querySelector(".num b"), numS = root.querySelector(".num span");
  const keysBox = root.querySelector(".button-mash-keys"), tpsEl = root.querySelector(".tps"), spark = root.querySelector(".spark"), timerEl = root.querySelector(".button-mash-timer");

  /* ---------- 상태 ---------- */
  let v = 0, taps = 0, win = 0, bump = 0, expect = "left", lastBad = 0, wins = 0;
  const tapTimes = [];
  let round = null;             // 시간 제한: { t0 }
  const keyEls = {};
  const buildKeys = () => {
    keysBox.innerHTML = S.target === "alt"
      ? `<div class="button-mash-key" data-k="left">←</div><div class="button-mash-key" data-k="right">→</div>`
      : `<div class="button-mash-key wide" data-k="space">Space</div>`;
    for (const k in keyEls) delete keyEls[k];
    keysBox.querySelectorAll("[data-k]").forEach(k => {
      keyEls[k.dataset.k] = k;
      api.on(k, "pointerdown", e => { e.preventDefault(); e.stopPropagation(); press(k.dataset.k); });
    });
  };

  const flashKey = (k, cls) => {
    const node = keyEls[k]; if (!node) return;
    node.classList.remove("on", "bad"); void node.offsetWidth; node.classList.add(cls);
    clearTimeout(node._t); node._t = setTimeout(() => node.classList.remove(cls), 90);
  };
  api.cleanup(() => Object.values(keyEls).forEach(n => clearTimeout(n._t)));

  const press = k => {
    api.hideHint();
    if (win > 0) return;
    if (S.target === "alt") {
      if (k !== "left" && k !== "right") return;
      if (k !== expect) { flashKey(k, "bad"); lastBad = performance.now(); api.flash("같은 키를 두 번 눌렀다 · 번갈아 눌러야 한다", "alt", 900); return; }
      expect = k === "left" ? "right" : "left";
    } else if (k !== "space") return;
    flashKey(k, "on");
    if (S.limit && !round) round = { t0: performance.now() };
    taps++; tapTimes.push(performance.now());
    v = Math.min(100, v + S.gain);
    bump = 1;
    if (v >= 100) { win = 1600; wins++; round = null; api.flash("성공 · 게이지를 가득 채웠다", "ok", 1600); }
  };

  api.onParam(k => { if (k === "target") { buildKeys(); expect = "left"; } if (k === "limit") round = null; });
  buildKeys();

  // 사이드바의 글자 입력칸, 슬라이더에 포커스가 있으면 반응하지 않는다 (체크박스는 예외: Space가 토글을 다시 뒤집지 않도록)
  const fromField = e => { const f = e.target && e.target.closest && e.target.closest("input, textarea, select, [contenteditable]"); return !!f && !(f.type === "checkbox" || f.type === "radio"); };
  api.on(window, "keydown", e => {
    if (fromField(e) || e.metaKey || e.ctrlKey || e.altKey) return;
    let k = null;
    if (e.code === "Space") k = "space";
    else if (e.code === "ArrowLeft") k = "left";
    else if (e.code === "ArrowRight") k = "right";
    if (!k) return;
    e.preventDefault();
    if (e.repeat) return;            // 누르고 있기는 연타가 아니다
    press(k);
  });
  api.on(window, "keyup", e => { if (["Space", "ArrowLeft", "ArrowRight"].includes(e.code) && !fromField(e)) e.preventDefault(); });

  /* ---------- 루프 ---------- */
  const BUCKET = 250, NB = 16;
  api.frame(dt => {
    const s = dt / 1000;
    const now = performance.now();
    while (tapTimes.length && now - tapTimes[0] > BUCKET * NB) tapTimes.shift();
    const tps = tapTimes.filter(t => now - t <= 1000).length;

    if (win > 0) {
      win -= dt;
      if (win <= 0) { v = 0; win = 0; }
    } else {
      v = Math.max(0, v - S.decay * s);
    }
    if (round) {
      const left = 5 - (now - round.t0) / 1000;
      if (left <= 0) { round = null; v = 0; api.flash("시간 초과 · 5초 안에 채우지 못했다", "alt", 1600); }
    }
    bump *= Math.pow(0.0005, s);

    // 그리기
    bar.setAttribute("stroke-dashoffset", String(CIRC * (1 - v / 100)));
    ring.style.transform = `scale(${1 + bump * 0.035})`;
    ring.classList.toggle("win", win > 0);
    numB.textContent = win > 0 ? "성공" : String(Math.floor(v));
    numS.textContent = win > 0 ? `${wins}번째` : "%";
    tpsEl.textContent = tps.toFixed(0);
    timerEl.textContent = S.limit ? (round ? `남은 시간 ${Math.max(0, 5 - (now - round.t0) / 1000).toFixed(1)}초` : "누르면 5초 시작") : "";
    if (S.target === "alt") {
      const bad = now - lastBad < 250;
      Object.entries(keyEls).forEach(([k, n]) => n.classList.toggle("next", k === expect && !bad));
    }
    // 스파크라인: 0.25초마다 누른 횟수
    const counts = new Array(NB).fill(0);
    tapTimes.forEach(t => { const i = NB - 1 - Math.floor((now - t) / BUCKET); if (i >= 0 && i < NB) counts[i]++; });
    const bw = 160 / NB;
    spark.innerHTML = counts.map((c, i) => {
      const hh = Math.min(40, c * 8);
      return `<rect x="${i * bw + 1}" y="${40 - hh}" width="${bw - 2}" height="${hh}" fill="${i === NB - 1 ? "var(--accent)" : "var(--ink-3)"}"/>`;
    }).join("") + `<line x1="0" y1="39.5" x2="160" y2="39.5" stroke="rgba(0,0,0,.2)"/>`;

    const need = S.decay / S.gain;
    api.read("taps", taps);
    api.read("tps", `${tps}회`);
    api.read("gauge", `${Math.floor(v)}%`);
    api.read("need", `${need.toFixed(1)}회/초`);

    if (win > 0) api.status("성공", "ok");
    else if (round) api.status(`연타 중 · ${tps}회/초 · 5초 제한`, "active");
    else if (tps > 0 && tps >= need) api.status(`연타 중 · ${tps}회/초 · 오르는 중`, "active");
    else if (tps > 0) api.status(`연타 중 · ${tps}회/초 · 줄어드는 속도를 못 이긴다`, "alt");
    else if (v > 0) api.status("멈췄다 · 게이지가 줄어드는 중", "alt");
    else api.status("대기", "idle");
  });
}
