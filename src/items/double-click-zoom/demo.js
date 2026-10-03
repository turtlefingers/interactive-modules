import { clamp, lerp, dist, localPoint } from "../../lib/util.js";

export default function demo(api) {
  const { el, S } = api;
  const DW = 900, DH = 620; // 보드 설계 크기

  api.css(`
    .dcz-demo { position: absolute; inset: 0; cursor: zoom-in; overflow: hidden; background: var(--board); }
    .dcz-demo.is-zoomed { cursor: zoom-out; }
    .dcz-world { position: absolute; left: 0; top: 0; width: ${DW}px; height: ${DH}px; transform-origin: 0 0; }
    .dcz-board { position: absolute; inset: 0; border: 1px solid var(--ink-3);
      background-image: linear-gradient(var(--grid) 1px, transparent 1px), linear-gradient(90deg, var(--grid) 1px, transparent 1px);
      background-size: 100px 100px; }
    .dcz-title { position: absolute; left: 36px; top: 24px; font-size: 13px; color: var(--ink-3); }
    .dcz-card { position: absolute; background: var(--note); border: 1.5px solid var(--ink); border-radius: 6px; overflow: hidden;
      outline: 2px solid transparent; outline-offset: 4px; transition: outline-color .15s; }
    .dcz-card.sel { outline-color: var(--accent); }
    .dcz-card .pic { height: 56%; display: grid; place-items: center; border-bottom: 1px solid var(--line); }
    .dcz-card .pic svg { width: 40%; height: 64%; overflow: visible; }
    .dcz-card .pic svg * { fill: none; stroke: var(--ink); stroke-width: 2.5; stroke-linejoin: round; stroke-linecap: round; }
    .dcz-card .txt { padding: 9px 12px; }
    .dcz-card b { display: block; font-size: 13px; font-weight: 600; color: var(--ink); }
    .dcz-card small { display: block; font-size: 11px; line-height: 1.5; color: var(--ink-2); margin-top: 4px; width: 200%; transform: scale(.5); transform-origin: 0 0; }
    .dcz-card .tag { position: absolute; right: 8px; top: 8px; font-size: 10px; font-weight: 600; color: var(--accent); opacity: 0; transition: opacity .15s; }
    .dcz-card.sel .tag { opacity: 1; }
    .dcz-fx { position: absolute; inset: 0; pointer-events: none; }
    .dcz-ripple { position: absolute; width: 36px; height: 36px; margin: -18px 0 0 -18px; border-radius: 50%;
      border: 1.5px solid var(--ink); animation: dcz-rip .45s ease-out forwards; }
    .dcz-ripple.two { border-color: var(--accent); }
    @keyframes dcz-rip { from { transform: scale(.3); opacity: 1; } to { transform: scale(1.3); opacity: 0; } }
    .dcz-wait { position: absolute; width: 52px; height: 52px; margin: -26px 0 0 -26px; overflow: visible; }
    .dcz-wait circle { fill: none; stroke: var(--ink); stroke-width: 1.5; transform: rotate(-90deg); transform-origin: 50% 50%; }
    .dcz-meter { position: absolute; right: 16px; bottom: 16px; z-index: 40; font-size: 13px; color: var(--ink);
      display: flex; align-items: center; gap: 10px; font-variant-numeric: tabular-nums; }
    .dcz-meter i { display: block; width: 70px; height: 2px; background: var(--line); }
    .dcz-meter i::after { content: ""; display: block; height: 100%; width: var(--p, 0%); background: var(--ink); }
  `);

  /* ---------- 보드 ---------- */
  const root = document.createElement("div");
  root.className = "dcz-demo";
  el.appendChild(root);
  const world = document.createElement("div");
  world.className = "dcz-world";
  root.appendChild(world);
  const fx = document.createElement("div");
  fx.className = "dcz-fx";
  root.appendChild(fx);
  const meter = document.createElement("div");
  meter.className = "dcz-meter";
  meter.innerHTML = `<span>1.0×</span><i></i>`;
  root.appendChild(meter);

  const shapes = {
    circle: () => `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="42"/></svg>`,
    tri: () => `<svg viewBox="0 0 100 100"><path d="M50 8 94 90H6z"/></svg>`,
    square: () => `<svg viewBox="0 0 100 100"><rect x="10" y="10" width="80" height="80"/></svg>`,
    ring: () => `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="42"/><circle cx="50" cy="50" r="22"/></svg>`,
    wave: () => `<svg viewBox="0 0 100 100"><path d="M4 50q12-24 24 0t24 0 24 0 24 0"/></svg>`,
    star: () => `<svg viewBox="0 0 100 100"><path d="M50 6l12 30 32 2-25 20 9 32-28-18-28 18 9-32-25-20 32-2z"/></svg>`
  };
  const cards = [
    { x: 60, y: 80, w: 230, h: 200, p: 0, shape: "circle", title: "해 뜨는 섬", body: "작은 글씨는 멀리서는 읽히지 않는다. 두 번 눌러 다가가야 비로소 보인다. 섬의 동쪽 끝에서는 가장 먼저 해가 뜬다." },
    { x: 340, y: 60, w: 210, h: 240, p: 1, shape: "wave", title: "파도 관측소", body: "매시 정각마다 파도의 높이를 적는다. 어제는 1.2m, 오늘은 0.8m였다. 바람은 북서쪽에서 불어온다." },
    { x: 600, y: 100, w: 240, h: 190, p: 2, shape: "tri", title: "초록 언덕", body: "언덕 꼭대기까지 걸어서 12분이 걸린다. 올라가면 마을 전체가 한눈에 내려다보인다." },
    { x: 90, y: 340, w: 210, h: 220, p: 3, shape: "star", title: "밤의 광장", body: "해가 지면 광장 바닥의 별 모양 조명이 켜진다. 조명은 모두 스물네 개다." },
    { x: 350, y: 360, w: 240, h: 200, p: 4, shape: "ring", title: "둥근 정원", body: "정원은 가운데가 비어 있는 고리 모양이다. 어느 쪽으로 걸어도 처음 자리로 돌아온다." },
    { x: 640, y: 330, w: 200, h: 230, p: 5, shape: "square", title: "네모 도서관", body: "책장은 모두 정사각형 칸으로 되어 있다. 한 칸에는 꼭 한 권만 꽂는다는 규칙이 있다." }
  ];
  let html = `<div class="dcz-board"></div><div class="dcz-title">작은 섬 안내도 · 두 번 누르면 → 확대된다</div>`;
  cards.forEach((c, i) => {
    html += `<div class="dcz-card" data-i="${i}" style="left:${c.x}px;top:${c.y}px;width:${c.w}px;height:${c.h}px">
      <div class="pic">${shapes[c.shape]()}</div>
      <div class="txt"><b>${c.title}</b><small>${c.body}</small></div><span class="tag">선택</span></div>`;
  });
  world.innerHTML = html;
  const cardEls = [...world.querySelectorAll(".dcz-card")];

  /* ---------- 카메라 ---------- */
  // 화면 좌표 = 보드 좌표 × s + (x, y)
  const cam = { s: 1, x: 0, y: 0 };
  let base = 1, homeX = 0, homeY = 0, vw = 0, vh = 0;
  let zoomed = false, anim = null, lastCenter = null;
  const measure = () => {
    vw = el.clientWidth; vh = el.clientHeight;
    base = Math.min((vw - 40) / DW, (vh - 90) / DH);
    homeX = (vw - DW * base) / 2; homeY = (vh - DH * base) / 2 + 10;
  };
  measure();
  cam.s = base; cam.x = homeX; cam.y = homeY;
  api.onResize(() => {
    const ow = vw, oh = vh;
    const level = cam.s / base;
    const cx = (ow / 2 - cam.x) / cam.s, cy = (oh / 2 - cam.y) / cam.s;
    measure();
    anim = null;
    if (!zoomed) { cam.s = base; cam.x = homeX; cam.y = homeY; }
    else { cam.s = level * base; cam.x = vw / 2 - cx * cam.s; cam.y = vh / 2 - cy * cam.s; }
  });
  const toWorld = p => ({ x: (p.x - cam.x) / cam.s, y: (p.y - cam.y) / cam.s });
  const ease = t => 1 - Math.pow(1 - t, 3);

  // F(보드 좌표)가 화면의 q0 → q1로 옮겨가며 배율 s0 → s1
  function zoomTo(F, s1, q1) {
    const q0 = { x: F.x * cam.s + cam.x, y: F.y * cam.s + cam.y };
    anim = { F, s0: cam.s, s1, q0, q1, t0: performance.now(), dur: S.dur };
    lastCenter = F;
  }

  function doubleClick(p, card) {
    const F = toWorld(p);
    if (zoomed) {
      zoomed = false;
      zoomTo(F, base, { x: F.x * base + homeX, y: F.y * base + homeY });
      api.flash("더블클릭 → 원래 크기로", "ok");
      return;
    }
    zoomed = true;
    const s1 = base * S.level;
    if (S.center === "object" && card) {
      const c = cards[+card.dataset.i];
      zoomTo({ x: c.x + c.w / 2, y: c.y + c.h / 2 }, s1, { x: vw / 2, y: vh / 2 });
    } else {
      zoomTo(F, s1, p);
    }
    api.flash(`더블클릭 → ${S.level.toFixed(1)}× 확대`, "ok");
  }

  function singleClick(pc) {
    const was = pc.card && pc.card.classList.contains("sel");
    cardEls.forEach(c => c.classList.remove("sel"));
    if (pc.card && !was) pc.card.classList.add("sel");
    api.read("judge", "한 번 → 선택");
    if (S.wait) api.flash(pc.card ? (was ? "한 번 클릭으로 판정 · 선택 해제" : "한 번 클릭으로 판정 · 카드 선택") : "한 번 클릭으로 판정 · 빈 곳 (선택 해제)", "ok");
  }

  /* ---------- 클릭 판정 ---------- */
  let pending = null; // 두 번째 클릭을 기다리는 첫 클릭
  let waitEl = null;

  const ripple = (p, two) => {
    const r = document.createElement("div");
    r.className = "dcz-ripple" + (two ? " two" : "");
    r.style.left = p.x + "px"; r.style.top = p.y + "px";
    fx.appendChild(r);
    api.timeout(() => r.remove(), 520);
  };
  const clearWait = () => { if (waitEl) { waitEl.remove(); waitEl = null; } };
  const showWait = (p, ms) => {
    clearWait();
    const C = 2 * Math.PI * 20;
    waitEl = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    waitEl.setAttribute("class", "dcz-wait");
    waitEl.setAttribute("viewBox", "0 0 52 52");
    waitEl.innerHTML = `<circle cx="26" cy="26" r="20" stroke-dasharray="${C}" stroke-dashoffset="0"/>`;
    waitEl.style.left = p.x + "px"; waitEl.style.top = p.y + "px";
    fx.appendChild(waitEl);
    const circ = waitEl.firstChild;
    circ.animate([{ strokeDashoffset: 0 }, { strokeDashoffset: C }], { duration: ms, easing: "linear", fill: "forwards" });
  };

  api.on(root, "pointerdown", e => {
    if (e.button !== 0) return;
    e.preventDefault();
    api.hideHint();
    const p = localPoint(el, e);
    const now = performance.now();
    const card = e.target.closest(".dcz-card");

    if (pending && now - pending.t <= S.interval && dist(p.x, p.y, pending.x, pending.y) < 24) {
      // 두 번째 클릭 → 더블클릭
      const gap = now - pending.t;
      clearTimeout(pending.timer);
      clearWait();
      ripple(p, true);
      api.read("gap", Math.round(gap));
      api.read("judge", pending.fired ? "두 번 → 확대 (선택도 실행됨)" : "두 번 → 확대");
      if (pending.fired) api.timeout(() => api.flash("한 번 클릭 동작도 함께 실행되었다", "alt", 1400), 700);
      doubleClick(pending.p, pending.card);
      pending = null;
      return;
    }
    // 이전 대기가 남아 있으면 한 번 클릭으로 확정
    if (pending) {
      clearTimeout(pending.timer);
      if (!pending.fired) singleClick(pending);
      api.read("gap", pending ? Math.round(now - pending.t) : "–");
    }
    ripple(p, false);
    const pc = { t: now, x: p.x, y: p.y, p, card, fired: false, timer: 0 };
    pending = pc;
    if (S.wait) {
      showWait(p, S.interval);
      pc.timer = api.timeout(() => { clearWait(); if (pending === pc) { singleClick(pc); pending = null; } }, S.interval);
    } else {
      singleClick(pc); pc.fired = true;
      pc.timer = api.timeout(() => { if (pending === pc) pending = null; }, S.interval);
    }
  });

  api.onParam(k => {
    if (k === "level" && zoomed && !anim) {
      // 확대 중에 배율을 바꾸면 화면 가운데를 기준으로 맞춘다
      const F = toWorld({ x: vw / 2, y: vh / 2 });
      anim = { F, s0: cam.s, s1: base * S.level, q0: { x: vw / 2, y: vh / 2 }, q1: { x: vw / 2, y: vh / 2 }, t0: performance.now(), dur: 150 };
    }
    if (k === "wait" && !S.wait) clearWait();
  });

  /* ---------- 루프 ---------- */
  api.frame(() => {
    if (anim) {
      const k = anim.dur <= 0 ? 1 : clamp((performance.now() - anim.t0) / anim.dur, 0, 1);
      const e = ease(k);
      cam.s = anim.s0 * Math.pow(anim.s1 / anim.s0, e);
      const qx = lerp(anim.q0.x, anim.q1.x, e), qy = lerp(anim.q0.y, anim.q1.y, e);
      cam.x = qx - anim.F.x * cam.s; cam.y = qy - anim.F.y * cam.s;
      if (k >= 1) anim = null;
    }
    world.style.transform = `translate(${cam.x}px,${cam.y}px) scale(${cam.s})`;
    root.style.backgroundPosition = `${cam.x}px ${cam.y}px`;
    root.classList.toggle("is-zoomed", zoomed);

    const level = cam.s / base;
    meter.firstChild.textContent = level.toFixed(1) + "×";
    meter.style.setProperty("--p", clamp((level - 1) / 4, 0, 1) * 100 + "%");
    api.read("level", level.toFixed(1) + "×");
    api.read("center", lastCenter ? `${Math.round(lastCenter.x)}, ${Math.round(lastCenter.y)}` : "–");

    if (pending && !pending.fired && S.wait) {
      const left = Math.max(0, S.interval - (performance.now() - pending.t));
      api.status(`두 번째 클릭을 기다리는 중 · ${(left / 1000).toFixed(2)}초`, "alt");
    } else if (anim) api.status(anim.s1 > anim.s0 ? "확대하는 중" : "축소하는 중", "active");
    else if (zoomed) api.status(`확대됨 ${level.toFixed(1)}× · 두 번 누르면 원래대로`, "idle");
    else api.status("대기", "idle");
  });
}
