import "../../lib/objects/index.js";
import { dist, fitCanvas } from "../../lib/util.js";
import { ILLO, TONE, LINE } from "../../lib/draw.js";
import { drawObject } from "../../lib/objects.js";

const NS = "http://www.w3.org/2000/svg";
const TAU = Math.PI * 2;
const ACC = ILLO.orange;   // 장면의 강조색 하나 (창문 불빛과 비밀 실루엣)
const TRIGGER_NAME = { right: "우클릭", long: "길게 누르기", triple: "세 번 클릭" };
const HINT_TEXT = { right: "어딘가를 우클릭해 보기", long: "어딘가를 길게 눌러 보기", triple: "어딘가를 세 번 클릭" };
// 키프레임 보간: [[진행도, 값], …] 을 선형으로 잇는다
const kf = (p, pts) => {
  if (p <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) if (p <= pts[i][0]) { const [a, va] = pts[i - 1], [b, vb] = pts[i]; return va + (vb - va) * (p - a) / (b - a); }
  return pts[pts.length - 1][1];
};

export default function demo(api) {
  const { el, S } = api;

  api.css(`
    .ee-demo { position: absolute; inset: 0; background: var(--board); }
    .ee-demo svg.scene { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }
    /* 그림 규칙: 외곽선 없는 톤 면 + 가는(1.5px) 잉크 디테일. 강조색은 창문 불빛 하나 */
    .ee-line { fill: none; stroke: ${ILLO.ink}; stroke-width: ${LINE}; stroke-linecap: round; stroke-linejoin: round; vector-effect: non-scaling-stroke; }
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
  // 장면은 캔버스 밑그림(카탈로그 사물, 매 프레임 다시 그림)이고, 그 위의 SVG 는 히트 영역·별자리·단서·효과만 맡는다.
  // 캔버스도 SVG 의 preserveAspectRatio="xMidYMid slice" 와 같은 변환을 쓴다
  const { g, size } = fitCanvas(api, { parent: root });
  const VW = 600, VH = 700;
  const view = () => { const sc = Math.max(size.w / VW, size.h / VH); return { sc, ox: (size.w - VW * sc) / 2, oy: (size.h - VH * sc) / 2 }; };

  // 별자리 점 (별 도상 대신 작은 잉크 점)
  const cons = [[-40, -15], [0, -35], [40, -10], [25, 30], [-20, 25]];
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("class", "scene");
  svg.setAttribute("viewBox", "0 0 600 700");
  svg.setAttribute("preserveAspectRatio", "xMidYMid slice");
  svg.innerHTML = `
    <g data-egg="stars" transform="translate(160 190)">
      <circle class="ee-hit" r="58"/>
      <path class="ee-line ee-egg" id="ee-cons" d="M${cons.map(p => p.join(" ")).join(" L")} Z"/>
      ${cons.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.6" fill="${ILLO.ink}"/>`).join("")}
    </g>
    <g data-egg="moon" transform="translate(430 190)"><circle class="ee-hit" r="56"/></g>
    <g data-egg="window" transform="translate(128 442)"><rect class="ee-hit" x="-32" y="-30" width="64" height="60"/></g>
    <g data-egg="tree" transform="translate(305 400)"><circle class="ee-hit" r="60"/></g>
    <g data-egg="pond" transform="translate(420 565)"><ellipse class="ee-hit" rx="112" ry="46"/></g>
    <g id="ee-fx"></g>
    <path id="ee-shoot" class="ee-acc" style="vector-effect:none" d="M120 60 L420 150" stroke-dasharray="320" stroke-dashoffset="320" opacity="0"/>
  `;
  root.appendChild(svg);
  const $ = id => svg.querySelector("#" + id);
  const fxLayer = $("ee-fx");

  const EGGS = {
    moon: { name: "달 속의 토끼", at: [430, 190], r: 50 },
    window: { name: "창가의 고양이", at: [128, 442], r: 30 },
    tree: { name: "나무 속 부엉이", at: [305, 400], r: 30 },
    pond: { name: "뛰어오르는 물고기", at: [420, 565], r: 40 },
    stars: { name: "숨은 별자리", at: [160, 190], r: 50 }
  };
  const KEYS = Object.keys(EGGS);
  const found = new Set();
  let tries = 0, lastTry = "–";
  // 캔버스 비밀의 드러남 시각 (null = 아직). 진행도는 매 프레임 이 값에서 계산한다
  const anim = { moon: null, window: null, tree: null, pond: null };

  const panel = document.createElement("div");
  panel.className = "ee-found";
  root.appendChild(panel);
  const renderPanel = () => {
    panel.innerHTML = `<span>발견 ${found.size} / ${KEYS.length}</span><span>${KEYS.map(k => `<i class="${found.has(k) ? "on" : ""}"></i>`).join("")}</span>`;
    api.read("found", `${found.size} / ${KEYS.length}`);
  };
  renderPanel();

  /* ---------- 장면 (캔버스) ---------- */
  // 집 A 의 창 자리: 변형 코드의 비례 (몸통 폭 1.15h, 높이 0.5h; 창 x = 0.1·폭, y = -0.72·몸통높이, 크기 0.14h × 0.16h)
  const HOUSE = { x: 104, y: 478, h: 130 };
  const WIN = { x: HOUSE.x + 0.115 * HOUSE.h, y: HOUSE.y - 0.36 * HOUSE.h, w: 0.14 * HOUSE.h, h: 0.16 * HOUSE.h };
  const prog = (k, dur, now) => anim[k] == null ? -1 : Math.min(1, Math.max(0, (now - anim[k]) / dur));

  function drawScene(now) {
    const { sc, ox, oy } = view(), t = now / 1000;
    g.setTransform(size.dpr, 0, 0, size.dpr, 0, 0);
    g.fillStyle = TONE[2]; g.fillRect(0, 0, size.w, size.h);
    g.save(); g.translate(ox, oy); g.scale(sc, sc);

    // 달 (moon C: 반지름 21u 원이 (x-2u, y-52u)에 온다 → 중심 (430, 190), 반지름 48) + 달 속 토끼
    drawObject(g, "moon", 432, 309, 192, { t });
    const pm = prog("moon", 1300, now);
    if (pm >= 0) {
      g.save(); g.beginPath(); g.arc(430, 190, 48, 0, TAU); g.clip();
      const dy = kf(pm, [[0, 10], [0.3, 0], [0.5, -8], [0.65, 0], [0.8, -6], [1, 0]]);
      // TODO: rabbit 타입이 새로 그려지면 variant 만 지정한다
      drawObject(g, "rabbit", 428, 222 + dy, 62, { color: ILLO.ink, alpha: kf(pm, [[0, 0], [0.3, 1]]), t });
      g.restore();
    }

    // 언덕 세 겹 (hill-set B), 그 위에 멀리 있는 집 둘(B·C, 불 꺼짐), 새, 나무 실루엣
    drawObject(g, "hill-set", 300, 720, 300);
    drawObject(g, "house", 500, 496, 44, { variant: "B", color: TONE[4] });
    drawObject(g, "house", 40, 540, 36, { variant: "C", color: TONE[4] });
    drawObject(g, "bird", 262, 470, 40, { color: TONE[5], t });
    drawObject(g, "bush-tree", 575, 535, 110, { color: TONE[4], flip: true });

    // 집 A: 불 켜진 창(강조색) + 창가의 고양이 (불빛이 한 번 깜빡이고 실루엣이 올라온다)
    drawObject(g, "house", HOUSE.x, HOUSE.y, HOUSE.h, { variant: "A", color: ACC, accent: ACC, state: 1 });
    const pw = prog("window", 900, now);
    if (pw >= 0) {
      const light = kf(pw, [[0, 1], [0.17, 0.35], [0.55, 1]]);
      if (light < 1) { g.save(); g.globalAlpha = 1 - light; g.fillStyle = TONE[2]; g.fillRect(WIN.x, WIN.y, WIN.w, WIN.h); g.restore(); }
      g.save(); g.beginPath(); g.rect(WIN.x, WIN.y, WIN.w, WIN.h); g.clip();
      const dy = kf(pw, [[0, 20], [0.3, 20], [0.75, -2], [1, 0]]);
      // TODO: cat 타입이 새로 그려지면 variant 만 지정한다
      drawObject(g, "cat", WIN.x + WIN.w / 2, WIN.y + WIN.h + 3 + dy, WIN.h * 1.5, { color: ILLO.ink, t });
      g.restore();
    }

    // 나무 (tree C) 와 그 앞의 부엉이 (세로로 펼쳐지며 나타나고, 한 번 눈을 깜빡이듯 접힌다)
    drawObject(g, "bush-tree", 215, 600, 120, { color: TONE[4] });
    drawObject(g, "tree", 305, 484, 150, { color: TONE[5] });
    const pt = prog("tree", 1100, now);
    if (pt >= 0) {
      const sy = kf(pt, [[0, 0], [0.3, 1], [0.55, 1], [0.65, 0.1], [1, 1]]);
      g.save(); g.translate(322, 428); g.scale(1, Math.max(0.001, sy));
      drawObject(g, "owl", 0, 0, 52, { color: ACC, t });
      g.restore();
    }

    // 연못 (pond C: state = 파문. 물고기가 뛰어들고 나올 때 퍼진다) + 뛰어오르는 물고기
    const pp = prog("pond", 1200, now);
    let ripple = 0;
    if (pp >= 0) { const ms = now - anim.pond; [0, 1150].forEach(d => { const e = (ms - d) / 800; if (e >= 0 && e < 1) ripple = Math.max(ripple, e); }); }
    drawObject(g, "pond", 426, 568, 118, { state: ripple, t });
    if (pp >= 0 && pp < 1) {
      const tx = kf(pp, [[0, -50], [0.15, -38], [0.5, 0], [0.85, 38], [1, 50]]);
      const ty = kf(pp, [[0, 0], [0.15, -40], [0.5, -95], [0.85, -40], [1, 0]]);
      const rot = kf(pp, [[0, -60], [0.15, -45], [0.5, 0], [0.85, 45], [1, 60]]) * Math.PI / 180;
      const al = kf(pp, [[0, 0], [0.15, 1], [0.85, 1], [1, 0]]);
      g.save(); g.translate(420 + tx, 565 + ty); g.rotate(rot);
      // fish 는 몸 중심이 (아래 가운데)에서 40u 위에 온다 (h = 50 → 24). TODO: fish 타입이 새로 그려지면 variant 만 지정한다
      drawObject(g, "fish", 0, 24, 50, { color: ACC, alpha: al, t: 0 });
      g.restore();
    }
    g.restore();
  }

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
    if (k in anim) { anim[k] = performance.now(); return; }   // 캔버스 비밀: drawScene 이 진행도에 따라 그린다
    if (k === "stars") {
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
    drawScene(performance.now());
    api.read("tries", tries);
    api.read("last", lastTry);
    api.read("trigger", TRIGGER_NAME[S.trigger]);
    if (hold) api.status("누르고 있는 중…", "active");
    else if (taps && performance.now() - taps.t < 450) api.status(`연속 클릭 ${taps.n} / 3`, "active");
    else if (found.size === KEYS.length) api.status("모두 찾음", "ok");
    else api.status(`조용한 풍경 · ${found.size}개 찾음`, "idle");
  });
}
