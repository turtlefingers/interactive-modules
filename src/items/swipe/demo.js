import { clamp, localPoint } from "../../lib/util.js";

export default function demo(api) {
  const { el, S } = api;
  const SPRING = "transform .38s cubic-bezier(.25,1.35,.5,1)";
  const OUT = "transform .3s cubic-bezier(.4,0,.8,.6), opacity .3s";

  api.css(`
    .swipe-root { position: absolute; inset: 0; background: var(--board); color: var(--ink); }
    .swipe-scene { position: absolute; inset: 0; display: grid; place-items: center; opacity: 0; pointer-events: none; transition: opacity .25s; }
    .swipe-scene.on { opacity: 1; pointer-events: auto; }
    .swipe-guide { position: absolute; top: 0; bottom: 0; width: 0; border-left: 1.5px dashed var(--accent); opacity: .7; pointer-events: none; transition: opacity .2s; }
    .swipe-root.noguide .swipe-guide { opacity: 0 !important; }

    /* 잠금 해제 */
    .swipe-phone { position: relative; border-radius: 28px; box-shadow: inset 0 0 0 1.5px rgba(27,27,26,.25);
      display: flex; flex-direction: column; align-items: center; justify-content: space-between; padding: 48px 20px 20px; box-sizing: border-box; }
    .swipe-phone .lock { display: flex; flex-direction: column; align-items: center; gap: 14px; font-size: 15px; color: var(--ink-2); }
    .swipe-phone .lock svg { width: 44px; height: 44px; stroke: var(--ink); fill: none; stroke-width: 2; stroke-linecap: round; }
    .swipe-phone .lock .shackle { transition: transform .3s; transform-origin: 34px 20px; }
    .swipe-phone.open .lock .shackle { transform: translateY(-6px) rotate(-30deg) translateX(-10px); }
    .swipe-phone .time { font-size: 48px; font-weight: 300; letter-spacing: -.02em; color: var(--ink); }
    .swipe-track { position: relative; height: 64px; border-radius: 32px; background: rgba(27,27,26,.06); box-shadow: inset 0 0 0 1px rgba(27,27,26,.12); }
    .swipe-track .label { position: absolute; inset: 0; display: grid; place-items: center; padding-left: 40px; font-size: 15px; color: var(--ink-2); pointer-events: none; }
    .swipe-track .guide { top: 10px; bottom: 10px; }
    .swipe-knob { position: absolute; left: 4px; top: 4px; width: 56px; height: 56px; border-radius: 50%; background: var(--ink); color: var(--board);
      display: grid; place-items: center; cursor: grab; touch-action: none; }
    .swipe-knob svg { width: 22px; height: 22px; stroke: currentColor; fill: none; stroke-width: 2.4; stroke-linecap: round; stroke-linejoin: round; }
    .swipe-knob.past { background: var(--accent); }

    /* 목록 */
    .swipe-list { display: flex; flex-direction: column; gap: 8px; }
    .swipe-row { position: relative; height: 64px; border-radius: 10px; overflow: hidden; transition: height .25s, margin .25s, opacity .25s; }
    .swipe-row.gone { height: 0; margin-top: -8px; opacity: 0; }
    .swipe-row .back { position: absolute; inset: 0; background: rgba(27,27,26,.06); }
    .swipe-row .back.del { background: var(--accent); }
    .swipe-row .back.arc { background: var(--ink-2); }
    .swipe-row .act { position: absolute; top: 0; bottom: 0; display: flex; align-items: center; font-size: 15px; font-weight: 700; color: #fff; white-space: nowrap; }
    .swipe-row .front { position: absolute; inset: 0; background: var(--note); box-shadow: inset 0 0 0 1px rgba(27,27,26,.12); border-radius: 10px;
      padding: 12px 16px; box-sizing: border-box; cursor: grab; display: flex; flex-direction: column; justify-content: center; gap: 4px; touch-action: none; }
    .swipe-row .front b { font-size: 15px; }
    .swipe-row .front span { font-size: 13px; color: var(--ink-3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

    /* 카드 */
    .swipe-deck { position: relative; }
    .swipe-card { position: absolute; inset: 0; background: var(--note); border-radius: 14px; box-shadow: inset 0 0 0 1.5px rgba(27,27,26,.2);
      display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px; cursor: grab; touch-action: none;
      transition: transform .3s, opacity .3s; }
    .swipe-card .num { font-size: 56px; font-weight: 300; color: var(--ink); }
    .swipe-card .shape { width: 72px; height: 72px; border: 2px solid var(--ink-2); }
    .swipe-card .stamp { position: absolute; top: 22px; font-size: 18px; font-weight: 800; padding: 4px 10px; border: 2.5px solid; border-radius: 6px; opacity: 0; }
    .swipe-card .stamp.yes { left: 18px; color: var(--accent); transform: rotate(-12deg); }
    .swipe-card .stamp.no { right: 18px; color: var(--ink-2); transform: rotate(12deg); }
    .swipe-root.grabbing, .swipe-root.grabbing * { cursor: grabbing !important; }
  `);

  const root = document.createElement("div");
  root.className = "swipe-root";
  el.appendChild(root);
  const scenes = {};
  ["unlock", "list", "card"].forEach(k => { const s = document.createElement("div"); s.className = "swipe-scene"; root.appendChild(s); scenes[k] = s; });

  const thr = () => S.threshold / 100;
  const drag = { on: false, id: -1, kind: null, target: null, sx: 0, sy: 0, dx: 0, dy: 0, samples: [], axis: null, dist: 1, dir: 0 };
  let lastResult = "–", lastSpeed = 0;

  /* ================= 잠금 해제 ================= */
  const U = {};
  scenes.unlock.innerHTML = `
    <div class="swipe-phone">
      <div class="lock">
        <svg viewBox="0 0 44 44"><path class="shackle" d="M14 20v-6a8 8 0 0 1 16 0v6"/><rect x="9" y="20" width="26" height="19" rx="3"/></svg>
        <div class="time">09:41</div>
        <div class="msg">잠겨 있다</div>
      </div>
      <div class="swipe-track"><div class="label">밀어서 잠금 해제</div><div class="swipe-guide guide"></div>
        <div class="swipe-knob"><svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg></div></div>
    </div>`;
  U.phone = scenes.unlock.querySelector(".swipe-phone");
  U.track = scenes.unlock.querySelector(".swipe-track");
  U.knob = scenes.unlock.querySelector(".swipe-knob");
  U.label = scenes.unlock.querySelector(".label");
  U.guide = scenes.unlock.querySelector(".guide");
  U.msg = scenes.unlock.querySelector(".msg");
  U.x = 0; U.open = false;
  const uTravel = () => U.track.clientWidth - 8 - 56;

  /* ================= 목록 ================= */
  const MAILS = [
    ["김지원", "다음 주 크리틱 순서 공유한다"], ["학과 사무실", "기말 전시 공간 신청 안내"], ["박서연", "렌더링 파일 올려두었다"],
    ["이도윤", "프로토타입 테스트 일정 조율"], ["도서관", "대출한 책 반납일이 다가온다"], ["최하늘", "포트폴리오 피드백 정리본"]
  ];
  const listEl = document.createElement("div");
  listEl.className = "swipe-list";
  scenes.list.appendChild(listEl);
  let mailSeq = 0;
  function addRow() {
    const [who, what] = MAILS[mailSeq++ % MAILS.length];
    const row = document.createElement("div");
    row.className = "swipe-row";
    row.innerHTML = `<div class="back"></div><div class="act"></div><div class="swipe-guide"></div><div class="front"><b>${who}</b><span>${what}</span></div>`;
    row.querySelector(".swipe-guide").style.opacity = 0;
    listEl.appendChild(row);
    return row;
  }
  function fillList() { for (let i = 0; i < 5; i++) addRow(); }
  fillList();

  /* ================= 카드 ================= */
  const deck = document.createElement("div");
  deck.className = "swipe-deck";
  scenes.card.appendChild(deck);
  let cardSeq = 0;
  const SHAPES = ["border-radius:50%", "", "border-radius:50% 50% 0 0", "transform:rotate(45deg) scale(.8)"];
  function addCard() {
    const c = document.createElement("div");
    c.className = "swipe-card";
    const n = ++cardSeq;
    c.innerHTML = `<div class="stamp yes">좋아요</div><div class="stamp no">넘기기</div><div class="shape" style="${SHAPES[n % SHAPES.length]}"></div><div class="num">${String(n).padStart(2, "0")}</div>`;
    deck.prepend(c);
    return c;
  }
  for (let i = 0; i < 4; i++) addCard();
  const cardGuides = [document.createElement("div"), document.createElement("div")];
  cardGuides.forEach(gd => { gd.className = "swipe-guide"; scenes.card.appendChild(gd); gd.style.opacity = 0; });
  const liveCards = () => [...deck.children].filter(c => !c.classList.contains("flying"));
  function stackCards() {
    const cards = liveCards();
    cards.forEach((c, i) => {
      const depth = cards.length - 1 - i;         // 0 = 맨 위
      c.style.zIndex = 10 - depth;
      if (depth === 0 && drag.on && drag.target === c) return;
      c.style.transform = `translateY(${Math.min(depth, 2) * 10}px) scale(${1 - Math.min(depth, 2) * 0.04})`;
      c.style.opacity = depth > 2 ? 0 : 1;
    });
  }
  stackCards();

  /* ================= 배치 ================= */
  function layout() {
    const { w, h } = api.size();
    const tw = Math.min(300, w - 72);
    U.phone.style.width = tw + 40 + "px";
    U.phone.style.height = Math.min(h - 140, 460) + "px";
    U.track.style.width = tw + "px";
    listEl.style.width = Math.min(420, w - 40) + "px";
    const cw = Math.min(260, w - 100), ch = Math.min(cw * 1.3, h - 180);
    deck.style.width = cw + "px"; deck.style.height = ch + "px";
    placeGuides();
  }
  function placeGuides() {
    U.guide.style.left = 4 + 28 + thr() * uTravel() + "px";
    const { w } = api.size();
    const cw = deck.clientWidth;
    cardGuides[0].style.left = w / 2 - thr() * cw + "px";
    cardGuides[1].style.left = w / 2 + thr() * cw + "px";
  }
  layout();
  api.onResize(layout);

  function showScene() {
    Object.entries(scenes).forEach(([k, s]) => s.classList.toggle("on", k === S.use));
    root.classList.toggle("noguide", !S.guide);
    lastResult = "–";
  }
  showScene();
  api.onParam(k => {
    if (k === "use") showScene();
    if (k === "guide") root.classList.toggle("noguide", !S.guide);
    if (k === "threshold") placeGuides();
  });

  /* ================= 끌기 ================= */
  api.on(root, "pointerdown", e => {
    if (drag.on) return;
    let kind = null, target = null;
    if (S.use === "unlock" && !U.open && e.target.closest(".swipe-knob")) { kind = "unlock"; target = U.knob; }
    else if (S.use === "list") { const f = e.target.closest(".swipe-row:not(.gone) .front"); if (f && !f.dataset.busy) { kind = "list"; target = f; } }
    else if (S.use === "card") { const c = e.target.closest(".swipe-card"); if (c && c === liveCards().at(-1)) { kind = "card"; target = c; } }
    if (!kind) return;
    e.preventDefault();
    root.setPointerCapture(e.pointerId);
    const p = localPoint(el, e);
    Object.assign(drag, { on: true, id: e.pointerId, kind, target, sx: p.x, sy: p.y, dx: 0, dy: 0, axis: kind === "list" ? null : "x", samples: [{ x: p.x, t: performance.now() }] });
    target.style.transition = "none";
    if (kind === "unlock") U.label.style.transition = "none";
    if (kind === "card") target.querySelectorAll(".stamp").forEach(st => { st.style.transition = "none"; });
    drag.dist = kind === "unlock" ? uTravel() : kind === "list" ? target.clientWidth : deck.clientWidth;
    drag.dist *= thr();
    root.classList.add("grabbing");
    api.hideHint();
  });

  api.on(root, "pointermove", e => {
    if (!drag.on || e.pointerId !== drag.id) return;
    const p = localPoint(el, e);
    drag.dx = p.x - drag.sx; drag.dy = p.y - drag.sy;
    const now = performance.now();
    drag.samples.push({ x: p.x, t: now });
    while (drag.samples.length > 2 && now - drag.samples[0].t > 100) drag.samples.shift();
    if (drag.kind === "list" && !drag.axis) {
      if (Math.hypot(drag.dx, drag.dy) < 6) return;
      drag.axis = Math.abs(drag.dx) >= Math.abs(drag.dy) ? "x" : "y";
      if (drag.axis === "y") api.flash("세로 움직임이라 스와이프로 보지 않는다", "idle");
    }
    if (drag.axis !== "x") return;
    apply(drag.dx, drag.dy);
  });

  function apply(dx, dy) {
    const t = drag.target;
    if (drag.kind === "unlock") {
      const x = clamp(dx, 0, uTravel());
      U.x = x;
      t.style.transform = `translateX(${x}px)`;
      U.label.style.opacity = clamp(1 - x / (uTravel() * 0.6), 0, 1);
      t.classList.toggle("past", x >= drag.dist);
    } else if (drag.kind === "list") {
      t.style.transform = `translateX(${dx}px)`;
      const row = t.parentElement, back = row.querySelector(".back"), act = row.querySelector(".act"), gd = row.querySelector(".swipe-guide");
      const W = t.clientWidth, past = Math.abs(dx) >= drag.dist;
      back.className = "back" + (dx < 0 ? " del" : dx > 0 ? " arc" : "");
      act.textContent = dx < 0 ? "삭제" : dx > 0 ? "보관" : "";
      const aw = act.offsetWidth;
      if (dx > 0) { act.style.left = (past ? Math.max(20, dx - aw - 20) : 20) + "px"; act.style.right = "auto"; }
      else { act.style.right = (past ? Math.max(20, -dx - aw - 20) : 20) + "px"; act.style.left = "auto"; }
      gd.style.left = (dx >= 0 ? drag.dist : W - drag.dist) + "px";
      gd.style.opacity = dx === 0 ? 0 : past ? 0.25 : 0.8;
      gd.style.borderColor = "#fff";
    } else {
      t.style.transform = `translate(${dx}px, ${dy * 0.6}px) rotate(${dx * 0.05}deg)`;
      const pr = clamp(Math.abs(dx) / drag.dist, 0, 1);
      t.querySelector(".stamp.yes").style.opacity = dx > 0 ? pr : 0;
      t.querySelector(".stamp.no").style.opacity = dx < 0 ? pr : 0;
      cardGuides.forEach(gd => { gd.style.opacity = 0.7; });
    }
  }

  const end = e => {
    if (!drag.on || e.pointerId !== drag.id) return;
    drag.on = false;
    root.classList.remove("grabbing");
    const t = drag.target;
    const s = drag.samples, a = s[0], b = s[s.length - 1];
    const v = performance.now() - b.t < 80 && s.length > 1 ? (b.x - a.x) / Math.max(1, b.t - a.t) : 0;
    lastSpeed = v;
    const dx = drag.kind === "unlock" ? U.x : drag.dx;
    const byDist = Math.abs(dx) >= drag.dist;
    const byFlick = S.flick && Math.abs(v) > 0.5 && Math.sign(v) === Math.sign(dx) && Math.abs(dx) > 12;
    const okDir = drag.kind === "unlock" ? dx > 0 : dx !== 0;
    const done = drag.axis === "x" && okDir && (byDist || byFlick);
    lastResult = done ? (byDist ? "실행 · 거리로" : "실행 · 속도로") : drag.axis === "x" ? "되돌아감" : "–";
    if (done) complete(drag.kind, t, dx);
    else springBack(drag.kind, t);
    cardGuides.forEach(gd => { gd.style.opacity = 0; });
  };
  api.on(root, "pointerup", end);
  api.on(root, "pointercancel", end);

  function springBack(kind, t) {
    t.style.transition = SPRING;
    if (kind === "unlock") {
      U.x = 0; t.style.transform = "translateX(0)"; t.classList.remove("past");
      U.label.style.transition = "opacity .3s"; U.label.style.opacity = 1;
    } else if (kind === "list") {
      t.style.transform = "translateX(0)";
      const gd = t.parentElement.querySelector(".swipe-guide"); gd.style.opacity = 0;
    } else {
      t.style.transform = "translate(0,0) rotate(0)";
      t.querySelectorAll(".stamp").forEach(st => { st.style.transition = "opacity .3s"; st.style.opacity = 0; });
    }
    if (drag.axis === "x" && Math.abs(drag.dx) > 4) api.flash("기준을 못 넘겨서 되돌아갔다", "alt");
  }

  function complete(kind, t, dx) {
    if (kind === "unlock") {
      t.style.transition = "transform .2s ease-out";
      U.x = uTravel(); t.style.transform = `translateX(${U.x}px)`;
      U.open = true; U.phone.classList.add("open"); U.msg.textContent = "잠금이 풀렸다";
      api.flash("잠금 해제 · 잠시 뒤 다시 잠긴다", "ok");
      api.timeout(() => {
        U.open = false; U.phone.classList.remove("open"); U.msg.textContent = "잠겨 있다";
        t.style.transition = SPRING; U.x = 0; t.style.transform = "translateX(0)"; t.classList.remove("past");
        U.label.style.transition = "opacity .3s"; U.label.style.opacity = 1;
      }, 1800);
    } else if (kind === "list") {
      const row = t.parentElement, W = t.clientWidth;
      t.dataset.busy = "1";
      t.style.transition = "transform .22s ease-in";
      t.style.transform = `translateX(${Math.sign(dx) * (W + 20)}px)`;
      row.querySelector(".swipe-guide").style.opacity = 0;
      api.flash(dx < 0 ? "삭제했다" : "보관했다", "ok");
      api.timeout(() => row.classList.add("gone"), 220);
      api.timeout(() => {
        row.remove();
        if (!listEl.querySelector(".swipe-row:not(.gone)")) { fillList(); api.flash("목록을 다시 채웠다", "idle"); }
      }, 500);
    } else {
      const { w } = api.size();
      t.classList.add("flying");
      t.style.transition = OUT;
      t.style.transform = `translate(${Math.sign(dx) * w}px, ${drag.dy * 0.6}px) rotate(${Math.sign(dx) * 24}deg)`;
      t.style.opacity = 0;
      api.flash(dx > 0 ? "좋아요로 넘겼다" : "넘기기로 넘겼다", "ok");
      addCard();
      api.timeout(() => { t.remove(); }, 320);
      requestAnimationFrame(stackCards);
    }
  }

  /* ================= 루프: 읽는 값 ================= */
  api.frame(() => {
    if (drag.on) {
      const dx = drag.kind === "unlock" ? U.x : drag.dx;
      const s = drag.samples, a = s[0], b = s[s.length - 1];
      const v = s.length > 1 ? (b.x - a.x) / Math.max(1, b.t - a.t) : 0;
      const pr = Math.round(Math.abs(dx) / drag.dist * 100);
      api.read("dx", Math.round(dx));
      api.read("progress", pr + "%");
      api.read("speed", v.toFixed(2));
      api.read("result", pr >= 100 ? "놓으면 실행" : "놓으면 되돌아감");
      if (drag.axis === "y") api.status("세로로 움직여서 스와이프가 아니다", "idle");
      else if (pr >= 100) api.status(`기준을 넘었다 · 놓으면 실행`, "ok");
      else api.status(`미는 중 · 기준까지 ${pr}%`, "active");
    } else {
      api.read("dx", 0); api.read("progress", "0%");
      api.read("speed", lastSpeed.toFixed(2));
      api.read("result", lastResult);
      api.status(U.open && S.use === "unlock" ? "잠금 해제됨" : "대기", U.open && S.use === "unlock" ? "ok" : "idle");
    }
  });
}
