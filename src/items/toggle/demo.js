import { clamp, lerp } from "../../lib/util.js";

export default function demo(api) {
  const { el, S } = api;
  const P = "toggle";
  const NAMES = { 2: ["끔", "켬"], 3: ["끔", "약", "강"], 4: ["끔", "약", "중", "강"] };
  const STEP = 44, KNOB = 32;

  api.css(`
    .${P}-root { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; gap: 72px; padding: 16px;
      background: var(--board);
      background-image: linear-gradient(var(--grid) 1px, transparent 1px), linear-gradient(90deg, var(--grid) 1px, transparent 1px);
      background-size: 100px 100px; }
    .${P}-sw { display: flex; flex-direction: column; align-items: center; gap: 12px; transition: opacity .3s, transform .3s; }
    .${P}-root.target-object .${P}-sw { opacity: 0; transform: scale(.9); pointer-events: none; }
    .${P}-track { position: relative; height: 40px; border-radius: 20px; background: var(--toggle-off); border: 0; padding: 0; cursor: pointer;
      transition: background .25s, width .3s; font: inherit; }
    .${P}-track:focus-visible { outline: 2px solid var(--ink); outline-offset: 4px; }
    .${P}-knob { position: absolute; left: 4px; top: 4px; width: ${KNOB}px; height: ${KNOB}px; border-radius: 50%; background: #fff; }
    .${P}-marks { position: relative; height: 18px; }
    .${P}-marks span { position: absolute; top: 0; transform: translateX(-50%); font-size: 13px; color: var(--ink-3); transition: color .2s; white-space: nowrap; }
    .${P}-marks span.on { color: var(--ink); font-weight: 700; }
    .${P}-obj { display: flex; flex-direction: column; align-items: center; gap: 14px; }
    .${P}-fan { width: 180px; height: 180px; border-radius: 50%; transition: translate .2s; }
    .${P}-root.target-object .${P}-fan { cursor: pointer; }
    .${P}-root.target-object .${P}-fan:hover { translate: 0 -3px; }
    .${P}-fan svg { display: block; width: 100%; height: 100%; overflow: visible; }
    .${P}-name { font-size: 18px; font-weight: 700; color: var(--ink); min-width: 4em; text-align: center; }
    .${P}-dots { display: flex; gap: 6px; }
    .${P}-dots i { width: 7px; height: 7px; border-radius: 50%; background: var(--toggle-off); transition: background .2s; }
    .${P}-dots i.on { background: var(--ink); }
    @media (max-width: 640px) { .${P}-root { flex-direction: column; gap: 32px; } .${P}-fan { width: 140px; height: 140px; } }
  `);

  const root = document.createElement("div");
  root.className = `${P}-root`;
  root.innerHTML = `
    <div class="${P}-sw">
      <button class="${P}-track" aria-label="상태 바꾸기"><span class="${P}-knob"></span></button>
      <div class="${P}-marks"></div>
    </div>
    <div class="${P}-obj">
      <div class="${P}-fan">
        <svg viewBox="-100 -100 200 200">
          <circle r="94" fill="var(--note)" stroke="var(--ink)" stroke-width="2"/>
          <g class="${P}-blades"></g>
          <circle r="14" fill="var(--ink)"/>
        </svg>
      </div>
      <div class="${P}-name"></div>
      <div class="${P}-dots"></div>
    </div>`;
  el.appendChild(root);
  const track = root.querySelector(`.${P}-track`), knob = root.querySelector(`.${P}-knob`);
  const marks = root.querySelector(`.${P}-marks`), fan = root.querySelector(`.${P}-fan`);
  const blades = root.querySelector(`.${P}-blades`), nameEl = root.querySelector(`.${P}-name`), dots = root.querySelector(`.${P}-dots`);
  blades.innerHTML = [0, 120, 240].map(a => `<path transform="rotate(${a})" d="M0,-12 C26,-30 34,-70 12,-82 C-6,-86 -14,-40 0,-12 Z"/>`).join("");
  const bladePaths = [...blades.querySelectorAll("path")];

  const st = { i: 0, dir: 1, clicks: 0, lastChange: 0, rot: 0, speed: 0, vel: 0, fill: 0, fillV: 0 };
  const N = () => +S.states;

  const build = () => {
    const n = N();
    st.i = Math.min(st.i, n - 1);
    track.style.width = (KNOB + 8 + (n - 1) * STEP) + "px";
    marks.style.width = track.style.width;
    marks.innerHTML = NAMES[n].map((t, k) => `<span style="left:${4 + KNOB / 2 + k * STEP}px">${t}</span>`).join("");
    dots.innerHTML = NAMES[n].map(() => "<i></i>").join("");
    render();
  };
  const transition = () => {
    const tr = S.trans === "instant" ? "none" : S.trans === "bounce" ? "transform .45s cubic-bezier(.3,1.8,.5,1)" : "transform .3s cubic-bezier(.4,0,.2,1)";
    knob.style.transition = tr;
    track.style.transition = S.trans === "instant" ? "width .3s" : "background .25s, width .3s";
  };
  const render = () => {
    const n = N();
    knob.style.transform = `translateX(${st.i * STEP}px)`;
    track.style.background = st.i === 0 ? "var(--toggle-off)" : "var(--accent)";
    [...marks.children].forEach((m, k) => m.classList.toggle("on", k === st.i));
    [...dots.children].forEach((d, k) => d.classList.toggle("on", k === st.i));
    nameEl.textContent = NAMES[n][st.i];
    root.classList.toggle("target-object", S.target === "object");
  };

  const next = () => {
    const n = N();
    if (S.cycle === "pingpong" && n > 2) {
      if (st.i + st.dir > n - 1 || st.i + st.dir < 0) st.dir *= -1;
      st.i += st.dir;
    } else st.i = (st.i + 1) % n;
    st.clicks++; st.lastChange = performance.now();
    render();
    api.hideHint();
  };

  transition(); build();
  api.onParam(k => { if (k === "states") build(); if (k === "trans") transition(); render(); });

  api.on(track, "click", () => { if (S.target === "switch") next(); });
  api.on(fan, "click", () => { if (S.target === "object") next(); else api.flash("스위치로 바꾸는 모드다 · 왼쪽 스위치를 누른다", "idle"); });
  api.on(window, "keydown", e => {
    if (e.target.closest("input, textarea, [contenteditable]")) return;
    if (e.code !== "Space" && e.code !== "Enter") return;
    if (e.target === track) return; // 버튼 자체의 기본 동작이 처리한다
    e.preventDefault();
    if (!e.repeat) next();
  });

  api.frame(dt => {
    const n = N(), lv = st.i / (n - 1), k = dt / 16.67;
    const target = lv * 900; // 도/초
    if (S.trans === "instant") { st.speed = target; st.vel = 0; st.fill = lv > 0 ? 1 : 0; }
    else if (S.trans === "bounce") {
      st.vel = st.vel * Math.pow(0.9, k) + (target - st.speed) * 0.02 * k; st.speed += st.vel * k;
      st.fillV = st.fillV * 0.75 + ((lv > 0 ? 1 : 0) - st.fill) * 0.12; st.fill += st.fillV;
    } else {
      st.speed = lerp(st.speed, target, 1 - Math.pow(0.95, k));
      st.fill = lerp(st.fill, lv > 0 ? 1 : 0, 1 - Math.pow(0.85, k));
    }
    st.rot = (st.rot + Math.max(0, st.speed) * dt / 1000) % 360;
    blades.setAttribute("transform", `rotate(${st.rot.toFixed(2)})`);
    const f = clamp(st.fill, 0, 1.2);
    const g = Math.round(lerp(214, 27, clamp(f, 0, 1))); // 꺼짐: 연회색 → 켜짐: 먹색
    bladePaths.forEach(p => p.setAttribute("fill", `rgb(${g},${Math.round(lerp(210, 27, clamp(f, 0, 1)))},${Math.round(lerp(202, 26, clamp(f, 0, 1)))})`));
    fan.style.transform = `scale(${1 + (f - clamp(f, 0, 1)) * 0.4})`;

    const since = st.lastChange ? (performance.now() - st.lastChange) / 1000 : 0;
    api.read("state", NAMES[n][st.i]);
    api.read("index", `${st.i + 1} / ${n}`);
    api.read("clicks", st.clicks);
    api.read("since", st.lastChange ? since.toFixed(1) + "초" : "–");
    const moving = Math.abs(st.speed - target) > 8;
    if (moving) api.status(`전환 중 → ${NAMES[n][st.i]}`, "active");
    else api.status(`상태: ${NAMES[n][st.i]} (${st.i + 1}/${n})`, st.i ? "ok" : "idle");
  });
}
