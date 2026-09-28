import { dist } from "../../lib/util.js";
import { ILLO, TONE, LINE } from "../../lib/draw.js";

const NS = "http://www.w3.org/2000/svg";
const ACC = ILLO.orange;   // 장면의 강조색 하나 (창문 불빛과 비밀 실루엣)
const TRIGGER_NAME = { right: "우클릭", long: "길게 누르기", triple: "세 번 클릭" };
const HINT_TEXT = { right: "어딘가를 우클릭해 보기", long: "어딘가를 길게 눌러 보기", triple: "어딘가를 세 번 클릭" };

export default function demo(api) {
  const { el, S } = api;

  api.css(`
    .ee-demo { position: absolute; inset: 0; background: var(--board); }
    .ee-demo svg.scene { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }
    /* 그림 규칙: 외곽선 없는 톤 면 + 가는(1.5px) 잉크 디테일. 강조색은 창문 불빛 하나 */
    .ee-line { fill: none; stroke: ${ILLO.ink}; stroke-width: ${LINE}; stroke-linecap: round; stroke-linejoin: round; vector-effect: non-scaling-stroke; }
    .ee-ripple { fill: none; stroke: ${TONE[2]}; stroke-width: ${LINE}; vector-effect: non-scaling-stroke; }
    .ee-acc { fill: none; stroke: ${ACC}; stroke-width: ${LINE}; stroke-linecap: round; stroke-linejoin: round; vector-effect: non-scaling-stroke; }
    .ee-hit { fill: transparent; stroke: none; pointer-events: all; }
    .ee-egg { opacity: 0; }
    .ee-ring { fill: none; stroke: var(--ink-3); stroke-width: 1.2; vector-effect: non-scaling-stroke; pointer-events: none; }
    .ee-mark { fill: none; stroke: var(--accent); stroke-width: 1.2; stroke-dasharray: 4 4; vector-effect: non-scaling-stroke; pointer-events: none;
      animation: ee-pulse 1.6s ease-in-out infinite; }
    @keyframes ee-pulse { 50% { opacity: .35; } }
    .ee-found { position: absolute; right: 16px; bottom: 16px; z-index: 40; display: flex; align-items: center; gap: 10px; font-size: 13px; color: var(--ink);
      font-variant-numeric: tabular-nums; }
    .ee-found i { display: inline-block; width: 8px; height: 8px; border-radius: 50%; border: 1.2px solid var(--ink); margin-left: 4px; transition: background .2s; }
    .ee-found i.on { background: var(--ink); }
    .ee-hold { position: absolute; width: 44px; height: 44px; margin: -22px 0 0 -22px; pointer-events: none; }
    .ee-hold circle { fill: none; stroke: var(--ink-2); stroke-width: 1.5; transform: rotate(-90deg); transform-origin: 50% 50%; }
  `);

  const root = document.createElement("div");
  root.className = "ee-demo";
  el.appendChild(root);

  // 설계 크기 600×700. 좁은 화면에서 좌우가, 넓은 화면에서 위아래가 잘리므로 비밀은 가운데 영역에 둔다.
  // 별자리 점 (별 도상 대신 작은 잉크 점)
  const cons = [[-40, -15], [0, -35], [40, -10], [25, 30], [-20, 25]];
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("class", "scene");
  svg.setAttribute("viewBox", "0 0 600 700");
  svg.setAttribute("preserveAspectRatio", "xMidYMid slice");
  // 밤 풍경: 하늘 → 달 → 먼 언덕 → 가까운 언덕 순서로 겹치는 톤 면. 외곽선 없음.
  svg.innerHTML = `
    <defs><clipPath id="ee-win"><rect x="-12" y="-11" width="24" height="22"/></clipPath></defs>
    <rect x="-20" y="-20" width="640" height="740" fill="${TONE[2]}"/>

    <g data-egg="stars" transform="translate(160 190)">
      <circle class="ee-hit" r="58"/>
      <path class="ee-line ee-egg" id="ee-cons" d="M${cons.map(p => p.join(" ")).join(" L")} Z"/>
      ${cons.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.6" fill="${ILLO.ink}"/>`).join("")}
    </g>

    <g data-egg="moon" transform="translate(430 190)">
      <circle class="ee-hit" r="56"/>
      <circle fill="${TONE[0]}" r="48"/>
      <!-- 달 속 토끼: 잉크 실루엣 -->
      <g class="ee-egg" id="ee-rabbit" fill="${ILLO.ink}">
        <ellipse cx="6" cy="16" rx="17" ry="12"/>
        <ellipse cx="-15" cy="-15" rx="3.6" ry="12" transform="rotate(-14 -15 -15)"/>
        <ellipse cx="-6" cy="-16" rx="3.6" ry="12" transform="rotate(8 -6 -16)"/>
        <circle cx="-10" cy="2" r="10"/>
        <circle cx="22" cy="12" r="4.5"/>
      </g>
    </g>

    <!-- 먼 언덕 / 가까운 땅 -->
    <path fill="${TONE[3]}" d="M-20 430 Q110 380 230 418 T460 402 T620 420 V720 H-20 Z"/>
    <path fill="${TONE[4]}" d="M-20 500 Q120 470 260 492 T620 484 V720 H-20 Z"/>

    <g data-egg="window">
      <!-- 집: 톤 실루엣 사각형 + 강조색 창문 하나 -->
      <rect fill="${TONE[5]}" x="96" y="392" width="108" height="86"/>
      <g transform="translate(128 424)">
        <rect class="ee-hit" x="-32" y="-30" width="64" height="60"/>
        <rect id="ee-light" x="-12" y="-11" width="24" height="22" fill="${ACC}"/>
        <g clip-path="url(#ee-win)"><g id="ee-cat" style="transform: translateY(20px)" fill="${ILLO.ink}">
          <path d="M-8 6l1-9 5 5z M8 6l-1-9-5 5z"/>
          <rect x="-9" y="10" width="18" height="18" rx="5"/>
          <circle cx="0" cy="8" r="7.5"/>
        </g></g>
      </g>
    </g>

    <g data-egg="tree" transform="translate(305 400)">
      <circle class="ee-hit" r="60"/>
      <!-- 나무: 가늘고 긴 톤 실루엣 -->
      <path fill="${TONE[5]}" d="M-24 84 Q-22 20 0 -78 Q22 20 24 84 Z"/>
      <!-- 부엉이: 강조색 실루엣 -->
      <g class="ee-egg" id="ee-owl" fill="${ACC}">
        <path d="M-13 -10 L-10 -20 L-3 -12 Z M13 -10 L10 -20 L3 -12 Z"/>
        <ellipse cy="2" rx="14" ry="16"/>
        <circle cx="-5.5" cy="-2" r="2" fill="${TONE[5]}"/><circle cx="5.5" cy="-2" r="2" fill="${TONE[5]}"/>
      </g>
    </g>

    <g data-egg="pond" transform="translate(420 565)">
      <ellipse class="ee-hit" rx="112" ry="46"/>
      <ellipse fill="${TONE[5]}" rx="100" ry="24"/>
      <g id="ee-ripples"></g>
      <!-- 물고기: 강조색 실루엣 -->
      <g class="ee-egg" id="ee-fish" fill="${ACC}">
        <path d="M-14 0q12-11 24 0q-12 11-24 0z"/>
        <path d="M9 0l10-8v16z"/>
      </g>
    </g>
    <g id="ee-fx"></g>
    <path id="ee-shoot" class="ee-acc" style="vector-effect:none" d="M120 60 L420 150" stroke-dasharray="320" stroke-dashoffset="320" opacity="0"/>
  `;
  root.appendChild(svg);
  const $ = id => svg.querySelector("#" + id);
  const fxLayer = $("ee-fx");

  const EGGS = {
    moon: { name: "달 속의 토끼", at: [430, 190], r: 50 },
    window: { name: "창가의 고양이", at: [128, 424], r: 30 },
    tree: { name: "나무 속 부엉이", at: [305, 400], r: 30 },
    pond: { name: "뛰어오르는 물고기", at: [420, 565], r: 40 },
    stars: { name: "숨은 별자리", at: [160, 190], r: 50 }
  };
  const KEYS = Object.keys(EGGS);
  const found = new Set();
  let tries = 0, lastTry = "–";

  const panel = document.createElement("div");
  panel.className = "ee-found";
  root.appendChild(panel);
  const renderPanel = () => {
    panel.innerHTML = `<span>발견 ${found.size} / ${KEYS.length}</span><span>${KEYS.map(k => `<i class="${found.has(k) ? "on" : ""}"></i>`).join("")}</span>`;
    api.read("found", `${found.size} / ${KEYS.length}`);
  };
  renderPanel();

  /* ---------- 좌표 · 소리 ---------- */
  const toSvg = e => {
    const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
    return pt.matrixTransform(svg.getScreenCTM().inverse());
  };
  let ac = null;
  const chime = () => {
    if (!S.sound) return;
    try {
      if (!ac) ac = new (window.AudioContext || window.webkitAudioContext)();
      const t = ac.currentTime;
      [[784, 0], [1175, .09]].forEach(([f, d]) => {
        const o = ac.createOscillator(), g = ac.createGain();
        o.type = "sine"; o.frequency.value = f;
        g.gain.setValueAtTime(0, t + d);
        g.gain.linearRampToValueAtTime(0.08, t + d + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.5);
        o.connect(g).connect(ac.destination);
        o.start(t + d); o.stop(t + d + 0.55);
      });
    } catch (err) { /* 소리 없이 진행 */ }
  };
  api.cleanup(() => { if (ac) ac.close(); });

  const ring = (x, y, r0, r1, dur, parent = fxLayer, cls = "ee-ring") => {
    const c = document.createElementNS(NS, "circle");
    c.setAttribute("class", cls); c.setAttribute("cx", x); c.setAttribute("cy", y); c.setAttribute("r", r1);
    c.style.transformOrigin = `${x}px ${y}px`; c.style.transformBox = "view-box";
    parent.appendChild(c);
    const a = c.animate([{ transform: `scale(${r0 / r1})`, opacity: .9 }, { transform: "scale(1)", opacity: 0 }],
      { duration: dur, easing: "ease-out", fill: "forwards" });
    a.onfinish = () => c.remove();
  };

  /* ---------- 드러내기 ---------- */
  const show = (node, keyframes, opts) => node.animate(keyframes, { fill: "forwards", ...opts });
  function reveal(k) {
    if (k === "moon") {
      const r = $("ee-rabbit");
      show(r, [{ opacity: 0, transform: "translateY(10px)" }, { opacity: 1, transform: "translateY(0)", offset: .3 },
        { transform: "translateY(-8px)", offset: .5 }, { transform: "translateY(0)", offset: .65 }, { transform: "translateY(-6px)", offset: .8 }, { opacity: 1, transform: "translateY(0)" }],
        { duration: 1300, easing: "ease-out" });
    } else if (k === "window") {
      // 창문 불빛이 한 번 깜빡이고 고양이 실루엣이 올라온다
      $("ee-light").animate([{ opacity: 1 }, { opacity: .35, offset: .3 }, { opacity: 1 }], { duration: 500, easing: "ease-out" });
      show($("ee-cat"), [{ transform: "translateY(20px)" }, { transform: "translateY(20px)", offset: .3 }, { transform: "translateY(-2px)", offset: .75 }, { transform: "translateY(0)" }],
        { duration: 900, easing: "ease-out" });
    } else if (k === "tree") {
      show($("ee-owl"), [{ opacity: 1, transform: "scaleY(0)" }, { transform: "scaleY(1)", offset: .3 }, { transform: "scaleY(1)", offset: .55 },
        { transform: "scaleY(.1)", offset: .65 }, { opacity: 1, transform: "scaleY(1)" }], { duration: 1100, easing: "ease-out" });
    } else if (k === "pond") {
      const f = $("ee-fish");
      show(f, [
        { opacity: 0, transform: "translate(-50px, 0) rotate(-60deg)" },
        { opacity: 1, transform: "translate(-38px, -40px) rotate(-45deg)", offset: .15 },
        { transform: "translate(0px, -95px) rotate(0deg)", offset: .5 },
        { opacity: 1, transform: "translate(38px, -40px) rotate(45deg)", offset: .85 },
        { opacity: 0, transform: "translate(50px, 0) rotate(60deg)" }], { duration: 1200, easing: "linear" });
      const rp = $("ee-ripples");
      [[-50, 0], [50, 1150]].forEach(([x, delay]) => api.timeout(() => {
        for (let i = 0; i < 2; i++) api.timeout(() => {
          const e = document.createElementNS(NS, "ellipse");
          e.setAttribute("class", "ee-ripple"); e.setAttribute("cx", x); e.setAttribute("rx", 28); e.setAttribute("ry", 7);
          rp.appendChild(e);
          e.style.transformOrigin = `${x}px 0px`; e.style.transformBox = "view-box";
          const a = e.animate([{ transform: "scale(.2)", opacity: 1 }, { transform: "scale(1.2)", opacity: 0 }], { duration: 800, easing: "ease-out", fill: "forwards" });
          a.onfinish = () => e.remove();
        }, i * 180);
      }, delay));
    } else if (k === "stars") {
      const p = $("ee-cons");
      const len = p.getTotalLength ? p.getTotalLength() : 300;
      p.style.strokeDasharray = len;
      show(p, [{ opacity: 1, strokeDashoffset: len }, { opacity: 1, strokeDashoffset: 0 }], { duration: 1200, easing: "ease-in-out" });
    }
  }

  function trigger(target, e) {
    tries++;
    const g = target && target.closest && target.closest("[data-egg]");
    const k = g && g.dataset.egg;
    api.hideHint();
    if (!k) {
      lastTry = "빈 곳";
      if (S.miss) { const p = toSvg(e); ring(p.x, p.y, 4, 22, 600); api.flash("여기에는 아무것도 없다", "idle", 1000); }
      return;
    }
    lastTry = EGGS[k].name;
    const isNew = !found.has(k);
    found.add(k);
    reveal(k);
    renderPanel();
    updateHints();
    if (isNew) {
      chime();
      api.flash(`발견 · ${EGGS[k].name} (${found.size} / ${KEYS.length})`, "ok", 2000);
      if (found.size === KEYS.length) api.timeout(celebrate, 900);
    } else api.flash(`이미 찾은 비밀 · ${EGGS[k].name}`, "idle", 1200);
  }
  function celebrate() {
    const s = $("ee-shoot");
    s.animate([{ opacity: 1, strokeDashoffset: 320 }, { opacity: 1, strokeDashoffset: 0, offset: .6 }, { opacity: 0, strokeDashoffset: -320 }],
      { duration: 1400, easing: "ease-in-out" });
    api.flash("다섯 개를 모두 찾았다", "ok", 2600);
  }

  /* ---------- 단서 ---------- */
  const markLayer = document.createElementNS(NS, "g");
  svg.insertBefore(markLayer, fxLayer);
  function updateHints() {
    markLayer.innerHTML = "";
    if (S.hint !== "obvious") return;
    KEYS.filter(k => !found.has(k)).forEach(k => {
      const [x, y] = EGGS[k].at;
      markLayer.insertAdjacentHTML("beforeend", `<circle class="ee-mark" cx="${x}" cy="${y}" r="${EGGS[k].r + 8}"/>`);
    });
  }
  updateHints();
  let hintIdx = 0;
  api.interval(() => {
    if (S.hint !== "subtle") return;
    const left = KEYS.filter(k => !found.has(k));
    if (!left.length) return;
    const k = left[hintIdx++ % left.length];
    const [x, y] = EGGS[k].at;
    ring(x, y, 2, 16, 1400, fxLayer, "ee-ring");
  }, 1800);

  /* ---------- 입력 ---------- */
  let hold = null, taps = null;
  const holdRing = document.createElement("div");
  holdRing.className = "ee-hold";
  holdRing.innerHTML = `<svg viewBox="0 0 44 44"><circle cx="22" cy="22" r="18" stroke-dasharray="113" stroke-dashoffset="113"/></svg>`;
  holdRing.style.display = "none";
  root.appendChild(holdRing);
  const endHold = () => { if (hold) { clearTimeout(hold.timer); hold.anim && hold.anim.cancel(); hold = null; } holdRing.style.display = "none"; };

  api.on(root, "contextmenu", e => {
    if (S.trigger === "triple") return; // 이 방식에서는 기본 메뉴를 그대로 둔다
    e.preventDefault();
    if (S.trigger === "right") trigger(e.target, e);
  });
  api.on(root, "pointerdown", e => {
    if (e.button !== 0) return;
    const r = el.getBoundingClientRect();
    const lp = { x: e.clientX - r.left, y: e.clientY - r.top };
    if (S.trigger === "long") {
      e.preventDefault();
      endHold();
      const target = e.target, ev = { clientX: e.clientX, clientY: e.clientY };
      holdRing.style.display = "block"; holdRing.style.left = lp.x + "px"; holdRing.style.top = lp.y + "px";
      const c = holdRing.querySelector("circle");
      hold = { x: lp.x, y: lp.y, anim: c.animate([{ strokeDashoffset: 113 }, { strokeDashoffset: 0 }], { duration: 600, fill: "forwards" }),
        timer: api.timeout(() => { endHold(); trigger(target, ev); }, 600) };
    } else if (S.trigger === "triple") {
      const now = performance.now();
      if (taps && now - taps.t < 450 && dist(lp.x, lp.y, taps.x, taps.y) < 24) taps.n++;
      else taps = { n: 1 };
      taps.t = now; taps.x = lp.x; taps.y = lp.y;
      const p = toSvg(e);
      ring(p.x, p.y, 2, 6 + taps.n * 4, 300);
      if (taps.n === 3) { taps = null; trigger(e.target, e); }
    }
  });
  api.on(root, "pointermove", e => {
    if (!hold) return;
    const r = el.getBoundingClientRect();
    if (dist(e.clientX - r.left, e.clientY - r.top, hold.x, hold.y) > 10) endHold();
  });
  api.on(root, "pointerup", endHold);
  api.on(root, "pointercancel", endHold);

  api.onParam(k => {
    if (k === "hint") updateHints();
    if (k === "trigger") { endHold(); taps = null; api.hint(HINT_TEXT[S.trigger]); }
  });

  api.frame(() => {
    api.read("tries", tries);
    api.read("last", lastTry);
    api.read("trigger", TRIGGER_NAME[S.trigger]);
    if (hold) api.status("누르고 있는 중…", "active");
    else if (taps && performance.now() - taps.t < 450) api.status(`연속 클릭 ${taps.n} / 3`, "active");
    else if (found.size === KEYS.length) api.status("모두 찾음", "ok");
    else api.status(`조용한 풍경 · ${found.size}개 찾음`, "idle");
  });
}
