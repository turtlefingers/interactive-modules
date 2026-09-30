import { clamp, localPoint } from "../../lib/util.js";
import { TONE } from "../../lib/draw.js";

/* 창 크기 반응 — 데모 안의 가상 브라우저 창. 오른쪽 가장자리를 끌어 폭을 바꾸면 안의 페이지가 다시 짜인다.
   페이지는 논리 폭(px) 그대로 만들고 통째로 축소해서 보여준다. 그래서 경계선(520 · 820 · 1100)이 실제 사이트의 px 값과 같다. */

const P = "viewport-resize";
const ZONES = [
  { from: 0, name: "휴대폰", cols: 1, preset: 375 },
  { from: 520, name: "태블릿", cols: 2, preset: 700 },
  { from: 820, name: "노트북", cols: 3, preset: 960 },
  { from: 1100, name: "넓은 화면", cols: 4, preset: 1320 }
];
const MINW = 360, MAXW = 1400;   // 가상 창 폭 범위 (논리 px)
const START = 960;                // 처음 폭: 3칸
const RANGE = MAXW;               // 자는 0 ~ 1400px
const BAR = 30;                   // 창 제목 줄 높이 (스테이지 px)
const TEXT_H = 66;                // 카드 글자 칸 높이 (논리 px)
const DUR = 560;                  // 다시 배치 애니메이션 (ms)
const STAGGER = 28;               // 카드마다 조금씩 늦게
const CARDS = [
  ["흔들리는 풀", "인터랙션 · 2026"], ["빛의 속도", "설치 · 2025"], ["손끝의 지도", "웹 · 2026"], ["느린 우편", "출판 · 2025"],
  ["바람 기록", "사운드 · 2026"], ["접히는 방", "공간 · 2024"], ["밤의 목록", "웹 · 2025"], ["물결 연습", "영상 · 2026"]
];
const SHADE = [1, 2, 1, 3, 2, 1, 2, 1];   // 이미지 자리 톤 (TONE 번호)

const zoneOf = W => { let z = ZONES[0]; for (const q of ZONES) if (W >= q.from) z = q; return z; };
const ease = t => 1 - Math.pow(1 - t, 3);

export default function demo(api) {
  const { el, S } = api;

  api.css(`
    .${P}-root { position: absolute; inset: 0; background: var(--board); }
    .${P}-ruler { position: absolute; height: 46px; }
    .${P}-base { position: absolute; left: 0; right: 0; top: 24px; height: 1px; background: var(--ink-3); }
    .${P}-tick { position: absolute; top: 18px; width: 1px; height: 13px; background: var(--ink-2); transition: opacity .3s; }
    .${P}-tick.dim, .${P}-num.dim { opacity: .3; }
    .${P}-num { position: absolute; top: 32px; transform: translateX(-50%); font-size: 13px; line-height: 14px; color: var(--ink-3);
      font-variant-numeric: tabular-nums; white-space: nowrap; transition: opacity .3s; }
    .${P}-zone { position: absolute; top: 0; transform: translateX(-50%); font-size: 13px; line-height: 16px; color: var(--ink-3); white-space: nowrap;
      transition: color .2s; }
    .${P}-zone.on { color: var(--ink); font-weight: 600; }
    .${P}-dot { position: absolute; top: 19px; width: 11px; height: 11px; margin-left: -5.5px; border-radius: 50%; background: var(--accent); }
    .${P}-info { position: absolute; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px 16px; }
    .${P}-now { font-size: 13px; color: var(--ink-2); white-space: nowrap; font-variant-numeric: tabular-nums; }
    .${P}-now b { font-size: 18px; color: var(--ink); font-weight: 700; margin-right: 6px; }
    .${P}-presets { display: flex; gap: 6px; flex-wrap: wrap; }
    .${P}-presets button { font: inherit; font-size: 13px; color: var(--ink-2); background: transparent; border: 1px solid var(--toggle-off);
      border-radius: var(--r-pill); padding: 0 12px; height: 32px; cursor: pointer; touch-action: manipulation; transition: background .15s, color .15s, border-color .15s; }
    .${P}-presets button:hover { border-color: var(--ink-3); color: var(--ink); }
    .${P}-presets button.on { background: var(--ink); border-color: var(--ink); color: var(--on-ink); }
    .${P}-frame { position: absolute; border: 1px solid var(--ink); border-radius: 8px; background: var(--note); overflow: hidden; }
    .${P}-bar { height: ${BAR}px; box-sizing: border-box; display: flex; align-items: center; gap: 5px; padding: 0 8px; border-bottom: 1px solid var(--note-line);
      background: ${TONE[0]}; }
    .${P}-bar i { width: 7px; height: 7px; border-radius: 50%; border: 1px solid var(--ink-3); flex: none; }
    .${P}-url { flex: 1; min-width: 0; height: 18px; margin-left: 6px; border-radius: 9px; background: var(--note); font-size: 12px; line-height: 18px;
      color: var(--ink-2); padding: 0 10px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .${P}-view { position: absolute; left: 0; right: 0; top: ${BAR}px; bottom: 0; overflow: hidden; }
    .${P}-page { position: absolute; left: 0; top: 0; transform-origin: 0 0; background: var(--note); color: var(--ink); line-height: 1.3; }
    .${P}-head { display: flex; align-items: center; justify-content: space-between; padding: 30px 40px 0; height: 88px; box-sizing: border-box; }
    .${P}-logo { font-size: 20px; font-weight: 800; letter-spacing: -.02em; }
    .${P}-nav { display: flex; gap: 28px; font-size: 16px; color: var(--ink-2); transition: opacity .25s; }
    .${P}-burger { position: absolute; right: 14px; top: 26px; width: 44px; height: 44px; display: grid; align-content: center; justify-items: center; gap: 6px;
      opacity: 0; transition: opacity .25s; }
    .${P}-burger i { display: block; width: 24px; height: 2px; background: var(--ink); }
    .${P}-title { margin: 0; padding: 26px 40px 0; font-size: 60px; line-height: 1.12; font-weight: 700; letter-spacing: -.035em; word-break: keep-all; }
    .${P}-lead { margin: 0; padding: 12px 40px 36px; font-size: 18px; color: var(--ink-2); }
    .${P}-grid { position: relative; }
    .${P}-card { position: absolute; left: 0; top: 0; border-radius: 10px; background: ${TONE[0]}; overflow: hidden; will-change: transform; }
    .${P}-img { aspect-ratio: 4 / 3; }
    .${P}-txt { height: ${TEXT_H}px; box-sizing: border-box; padding: 12px 14px 0; }
    .${P}-txt b { display: block; font-size: 17px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .${P}-txt span { display: block; margin-top: 4px; font-size: 14px; color: var(--ink-2); white-space: nowrap; }
    .${P}-foot { padding: 28px 40px 40px; font-size: 14px; color: var(--ink-3); }
    /* 경계선별 모양: 가상 창 폭 기준 */
    .${P}-page[data-bp="3"] .${P}-title { font-size: 48px; }
    .${P}-page[data-bp="2"] .${P}-title { font-size: 38px; }
    .${P}-page[data-bp="1"] .${P}-title { font-size: 28px; }
    .${P}-page[data-bp="2"] .${P}-head, .${P}-page[data-bp="2"] .${P}-title, .${P}-page[data-bp="2"] .${P}-lead, .${P}-page[data-bp="2"] .${P}-foot { padding-left: 28px; padding-right: 28px; }
    .${P}-page[data-bp="1"] .${P}-head, .${P}-page[data-bp="1"] .${P}-title, .${P}-page[data-bp="1"] .${P}-lead, .${P}-page[data-bp="1"] .${P}-foot { padding-left: 18px; padding-right: 18px; }
    .${P}-page[data-bp="1"] .${P}-lead { font-size: 16px; padding-bottom: 24px; }
    .${P}-page[data-bp="1"] .${P}-nav { opacity: 0; }
    .${P}-page[data-bp="1"] .${P}-burger { opacity: 1; }
    .${P}-root.anim .${P}-title { transition: font-size .45s cubic-bezier(.2,.7,.2,1), padding .45s cubic-bezier(.2,.7,.2,1); }
    .${P}-root.anim .${P}-head, .${P}-root.anim .${P}-lead { transition: padding .45s cubic-bezier(.2,.7,.2,1); }
    /* 손잡이: 오른쪽 가장자리. 누르는 자리는 48px 폭 */
    .${P}-handle { position: absolute; width: 48px; margin-left: -24px; cursor: ew-resize; touch-action: none; z-index: 5; }
    .${P}-grip { position: absolute; left: 50%; top: 50%; width: 14px; height: 64px; margin: -32px 0 0 -7px; border-radius: 7px; background: var(--ink);
      transition: transform .15s; }
    .${P}-grip::before, .${P}-grip::after { content: ""; position: absolute; top: 20px; bottom: 20px; width: 1.5px; background: var(--note); opacity: .75; }
    .${P}-grip::before { left: 4px; } .${P}-grip::after { right: 4px; }
    .${P}-handle:hover .${P}-grip, .${P}-handle.drag .${P}-grip { transform: scaleX(1.25); }
    .${P}-arrows { position: absolute; left: 50%; top: calc(50% - 50px); transform: translateX(-50%); font-size: 13px; color: var(--ink-2); white-space: nowrap;
      pointer-events: none; }
  `);

  /* ---------- 뼈대 ---------- */
  const root = document.createElement("div");
  root.className = `${P}-root`;
  root.innerHTML = `
    <div class="${P}-ruler"></div>
    <div class="${P}-info">
      <div class="${P}-now"></div>
      <div class="${P}-presets">${ZONES.map((z, i) => `<button data-i="${i}">${z.name}</button>`).join("")}</div>
    </div>
    <div class="${P}-frame">
      <div class="${P}-bar"><i></i><i></i><i></i><span class="${P}-url">studio.kr</span></div>
      <div class="${P}-view">
        <div class="${P}-page">
          <header class="${P}-head"><span class="${P}-logo">studio.kr</span>
            <nav class="${P}-nav"><span>작업</span><span>전시</span><span>소개</span><span>연락</span></nav>
            <span class="${P}-burger"><i></i><i></i><i></i></span></header>
          <h2 class="${P}-title">움직이는 것들의 아카이브</h2>
          <p class="${P}-lead">2026 졸업 전시 · 여덟 개의 작업</p>
          <div class="${P}-grid">${CARDS.map(([t, m], i) => `
            <div class="${P}-card"><div class="${P}-img" style="background:${TONE[SHADE[i]]}"></div>
              <div class="${P}-txt"><b>${t}</b><span>${m}</span></div></div>`).join("")}</div>
          <footer class="${P}-foot">© studio.kr</footer>
        </div>
      </div>
    </div>
    <div class="${P}-handle" role="slider" aria-label="창 폭" aria-valuemin="${MINW}" aria-valuemax="${MAXW}"><span class="${P}-arrows">↔</span><div class="${P}-grip"></div></div>`;
  el.appendChild(root);
  const $ = s => root.querySelector(s);
  const ruler = $(`.${P}-ruler`), info = $(`.${P}-info`), nowEl = $(`.${P}-now`);
  const presetEls = [...root.querySelectorAll(`.${P}-presets button`)];
  const frame = $(`.${P}-frame`), page = $(`.${P}-page`), grid = $(`.${P}-grid`), handle = $(`.${P}-handle`);
  const cardEls = [...root.querySelectorAll(`.${P}-card`)];
  const url = $(`.${P}-url`);

  /* ---------- 자 (0 ~ 1400px) ---------- */
  const pct = v => (v / RANGE * 100) + "%";
  ruler.innerHTML = `<div class="${P}-base"></div>`
    + ZONES.map((z, i) => {
      const to = ZONES[i + 1] ? ZONES[i + 1].from : RANGE;
      return `<span class="${P}-zone" style="left:${pct((z.from + to) / 2)}">${z.name}</span>`;
    }).join("")
    + ZONES.slice(1).map(z => `<i class="${P}-tick" data-c="${z.cols}" style="left:${pct(z.from)}"></i><span class="${P}-num" data-c="${z.cols}" style="left:${pct(z.from)}">${z.from}</span>`).join("")
    + `<i class="${P}-dot"></i>`;
  const zoneEls = [...ruler.querySelectorAll(`.${P}-zone`)];
  const tickEls = [...ruler.querySelectorAll(`.${P}-tick, .${P}-num`)];
  const dot = ruler.querySelector(`.${P}-dot`);
  let zoneKey = "";
  function labelZones(scale) {
    // 구간이 넉넉하면 "태블릿 · 2칸", 좁으면 이름만
    const key = `${scale.toFixed(3)}|${S.maxCols}`;
    if (key === zoneKey) return;
    zoneKey = key;
    zoneEls.forEach((z, i) => {
      const q = ZONES[i], to = ZONES[i + 1] ? ZONES[i + 1].from : RANGE;
      const n = Math.min(q.cols, +S.maxCols);
      z.textContent = (to - q.from) * scale > 104 ? `${q.name} · ${n}칸` : q.name;
    });
    tickEls.forEach(t => t.classList.toggle("dim", +t.dataset.c > +S.maxCols));
  }

  /* ---------- 상태 ---------- */
  let W = START;          // 지금 가상 창 폭 (논리 px)
  let target = null;      // 버튼 · 키로 정한 목표 폭 (부드럽게 옮겨간다)
  let drag = null, grab = 0;
  let cols = 0, flipT0 = -1e9;
  const cards = CARDS.map(() => ({ x: 0, y: 0, w: 0, fx: 0, fy: 0, fw: 0 }));
  let geo = { s: 1, x0: 0 };
  const cache = new Map();
  const setStyle = (node, prop, v) => {
    let m = cache.get(node); if (!m) cache.set(node, m = {});
    if (m[prop] !== v) { m[prop] = v; node.style[prop] = v; }
  };
  const goTo = w => { target = clamp(Math.round(w), MINW, MAXW); if (!S.anim) { W = target; target = null; } api.hideHint(); };

  root.classList.toggle("anim", !!S.anim);
  api.onParam(k => { if (k === "anim") root.classList.toggle("anim", !!S.anim); });

  /* ---------- 손잡이 ---------- */
  api.on(handle, "pointerdown", e => {
    e.preventDefault();
    handle.setPointerCapture(e.pointerId);
    grab = localPoint(el, e).x - (geo.x0 + W * geo.s);
    drag = e.pointerId; target = null;
    handle.classList.add("drag");
    api.hideHint();
  });
  api.on(handle, "pointermove", e => {
    if (drag !== e.pointerId) return;
    W = clamp((localPoint(el, e).x - grab - geo.x0) / geo.s, MINW, MAXW);
  });
  const end = e => { if (drag === e.pointerId) { drag = null; handle.classList.remove("drag"); } };
  api.on(handle, "pointerup", end);
  api.on(handle, "pointercancel", end);
  api.on(handle, "lostpointercapture", end);

  api.on(root, "click", e => {
    const b = e.target.closest(`.${P}-presets button`);
    if (b) goTo(ZONES[+b.dataset.i].preset);
  });
  // ←/→ 로 20px씩 (Shift는 100px)
  api.on(window, "keydown", e => {
    if (e.target.closest && e.target.closest("input, textarea, select, [contenteditable]")) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    const step = (e.shiftKey ? 100 : 20) * (e.key === "ArrowRight" ? 1 : -1);
    goTo((target ?? W) + step);
  });

  /* ---------- 매 프레임 ---------- */
  api.frame((dt, t) => {
    const { w, h } = api.size();
    if (!w || !h) return;

    // 축소 비율: 0 ~ 1400px 를 스테이지 폭에 맞춘다 (손잡이가 튀어나올 자리 24px)
    const x0 = w < 600 ? 16 : 28;
    const s = Math.min(1, (w - x0 * 2 - 24) / RANGE);
    geo = { s, x0 };

    if (target !== null) {
      W += (target - W) * (1 - Math.exp(-dt / 90));
      if (Math.abs(target - W) < .5) { W = target; target = null; }
    }

    // 자
    setStyle(ruler, "left", x0 + "px"); setStyle(ruler, "top", "60px"); setStyle(ruler, "width", RANGE * s + "px");
    labelZones(s);
    const zone = zoneOf(W);
    zoneEls.forEach((z, i) => z.classList.toggle("on", ZONES[i] === zone));
    presetEls.forEach((b, i) => b.classList.toggle("on", ZONES[i] === zone));
    setStyle(dot, "left", (W / RANGE * 100).toFixed(3) + "%");

    // 지금 칸 수
    const bpCols = zone.cols;
    const nc = Math.min(bpCols, +S.maxCols);
    const nowTxt = `<b>${nc}칸</b>${zone.name} 구간 · 창 폭 ${Math.round(W)}px`;
    if (nowEl.dataset.t !== nowTxt) { nowEl.dataset.t = nowTxt; nowEl.innerHTML = nowTxt; }
    setStyle(info, "left", x0 + "px"); setStyle(info, "width", (w - x0 * 2) + "px"); setStyle(info, "top", "118px");
    const frameTop = 118 + info.offsetHeight + 16;
    const frameH = Math.max(80, h - frameTop - 16);

    // 창틀과 손잡이
    const fw = W * s;
    setStyle(frame, "left", x0 + "px"); setStyle(frame, "top", frameTop + "px");
    setStyle(frame, "width", fw + "px"); setStyle(frame, "height", frameH + "px");
    setStyle(handle, "left", x0 + fw + "px"); setStyle(handle, "top", frameTop + "px"); setStyle(handle, "height", frameH + "px");
    handle.setAttribute("aria-valuenow", Math.round(W));
    setStyle(url, "visibility", fw < 130 ? "hidden" : "visible");

    // 페이지: 논리 폭으로 만들고 축소
    setStyle(page, "width", W + "px");
    setStyle(page, "minHeight", Math.ceil((frameH - BAR) / s) + "px");
    setStyle(page, "transform", `scale(${s})`);
    if (page.dataset.bp !== String(bpCols)) page.dataset.bp = bpCols;

    // 카드 배치 (칸 수가 바뀌면 FLIP: 지금 자리에서 새 자리로 옮겨간다)
    if (nc !== cols) {
      if (cols) {
        if (S.anim) { cards.forEach(c => { c.fx = c.x; c.fy = c.y; c.fw = c.w; }); flipT0 = t; }
        api.flash(`${cols}칸 → ${nc}칸으로 다시 배치`, "ok", 1400);
      }
      cols = nc;
    }
    if (!S.anim) flipT0 = -1e9;
    const pad = W >= 820 ? 40 : W >= 520 ? 28 : 18;
    const gap = W >= 820 ? 24 : 16;
    const cw = (W - pad * 2 - gap * (cols - 1)) / cols;
    const chH = cw * .75 + TEXT_H;
    let moving = false, bottom = 0;
    cards.forEach((c, i) => {
      const tx = pad + (i % cols) * (cw + gap), ty = Math.floor(i / cols) * (chH + gap);
      const k = clamp((t - flipT0 - i * STAGGER) / DUR, 0, 1);
      if (k < 1) {
        const e = ease(k); moving = true;
        c.x = c.fx + (tx - c.fx) * e; c.y = c.fy + (ty - c.fy) * e; c.w = c.fw + (cw - c.fw) * e;
      } else { c.x = tx; c.y = ty; c.w = cw; }
      setStyle(cardEls[i], "transform", `translate(${c.x.toFixed(1)}px, ${c.y.toFixed(1)}px)`);
      setStyle(cardEls[i], "width", c.w.toFixed(1) + "px");
      bottom = Math.max(bottom, ty + chH);
    });
    setStyle(grid, "height", Math.ceil(bottom) + "px");

    // 읽는 값 · 상태
    api.read("win", Math.round(W));
    api.read("cols", nc);
    api.read("zone", zone.name);
    if (drag !== null) api.status(`창 폭 바꾸는 중 · ${Math.round(W)}px`, "active");
    else if (moving) api.status(`다시 배치하는 중 · ${nc}칸`, "alt");
    else api.status(`${zone.name} 구간 · ${nc}칸`, "idle");
  });
}
