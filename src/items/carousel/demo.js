import { clamp, lerp, mod } from "../../lib/util.js";

export default function demo(api) {
  const { el, S } = api;

  const ITEMS = [
    ["아침", "창문으로 들어오는 첫 빛"], ["산책", "천천히 걷는 골목"], ["바다", "파도가 밀려오는 소리"], ["노을", "하늘이 주황으로 물든다"],
    ["밤", "가로등 아래 그림자"], ["눈", "소리 없이 쌓이는 겨울"], ["숲", "나뭇잎 사이의 바람"], ["도시", "불 켜진 창문들"]
  ];
  const N = ITEMS.length;

  api.css(`
    .carousel-demo { position: absolute; inset: 0; background: var(--board); }
    .carousel-view { position: absolute; left: 0; right: 0; top: 56px; bottom: 90px; perspective: 1100px; overflow: hidden; }
    .carousel-card { position: absolute; left: 50%; top: 50%; border-radius: var(--r-card); overflow: hidden; cursor: pointer;
      background: var(--note); border: 1px solid rgba(0,0,0,.12); will-change: transform; }
    .carousel-card.is-current { cursor: default; border-color: var(--ink); }
    .carousel-art { position: absolute; left: 0; right: 0; top: 0; bottom: 30%; display: grid; place-items: center; color: var(--ink-2); }
    .carousel-art svg { width: 46%; max-width: 140px; height: auto; overflow: visible; }
    .carousel-card.is-current .carousel-art { color: var(--accent); }
    .carousel-num { position: absolute; left: 14px; top: 12px; font-size: 13px; font-weight: 600; color: var(--ink-3); }
    .carousel-text { position: absolute; left: 16px; right: 16px; bottom: 0; height: 30%; display: flex; flex-direction: column; justify-content: center; gap: 4px;
      border-top: 1px solid rgba(0,0,0,.08); }
    .carousel-text strong { font-size: 18px; color: var(--ink); }
    .carousel-text span { font-size: 13px; color: var(--ink-2); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .carousel-nav { position: absolute; top: 50%; z-index: 40; width: 52px; height: 52px; margin-top: -26px; border: 0; border-radius: 50%;
      background: var(--chip-bg); color: var(--ink); box-shadow: var(--chip-shadow); font: inherit; font-size: 20px; font-weight: 600; cursor: pointer;
      display: grid; place-items: center; transition: background .08s, color .08s, opacity .2s; touch-action: manipulation; }
    .carousel-nav small { position: absolute; bottom: -22px; font-size: 13px; font-weight: 600; color: var(--ink-3); }
    .carousel-nav.prev { left: 16px; } .carousel-nav.next { right: 16px; }
    .carousel-nav.on { background: var(--accent); color: #fff; }
    .carousel-nav.dim { opacity: .35; }
    .carousel-dots { position: absolute; left: 50%; bottom: 34px; transform: translateX(-50%); z-index: 40; display: flex; gap: 8px; align-items: center;
      padding: 8px 12px; background: var(--chip-bg); border-radius: var(--r-pill); box-shadow: var(--chip-shadow); }
    .carousel-dot { position: relative; width: 10px; height: 10px; border-radius: 5px; border: 0; padding: 0; background: var(--toggle-off);
      cursor: pointer; overflow: hidden; transition: width .3s cubic-bezier(.3,1.4,.5,1), background .2s; }
    .carousel-dot.on { width: 30px; background: var(--ink); }
    .carousel-dot.on.auto { background: var(--toggle-off); }
    .carousel-dot .fill { position: absolute; left: 0; top: 0; bottom: 0; width: 0; background: var(--ink); }
    @media (max-width: 600px) { .carousel-nav { width: 44px; height: 44px; margin-top: -22px; } .carousel-nav.prev { left: 8px; } .carousel-nav.next { right: 8px; } }
  `);

  const root = document.createElement("div");
  root.className = "carousel-demo";
  root.innerHTML = `
    <div class="carousel-view"></div>
    <button class="carousel-nav prev" aria-label="이전">‹<small>←</small></button>
    <button class="carousel-nav next" aria-label="다음">›<small>→</small></button>
    <div class="carousel-dots">${ITEMS.map((_, i) => `<button class="carousel-dot" data-i="${i}" aria-label="${i + 1}번"><span class="fill"></span></button>`).join("")}</div>`;
  el.appendChild(root);
  const view = root.querySelector(".carousel-view");
  const prevBtn = root.querySelector(".prev"), nextBtn = root.querySelector(".next");
  const dots = [...root.querySelectorAll(".carousel-dot")];

  // 카드마다 다른 선 도형 (항목이 바뀌는 것이 보이도록)
  const SHAPES = [
    `<circle cx="50" cy="50" r="40"/>`,
    `<path d="M10 80 Q30 20 50 50 T90 30"/>`,
    `<path d="M5 60 Q20 45 35 60 T65 60 T95 60 M5 78 Q20 63 35 78 T65 78 T95 78"/>`,
    `<circle cx="50" cy="62" r="26"/><path d="M5 62 H95"/>`,
    `<path d="M62 12 A40 40 0 1 0 88 70 A32 32 0 1 1 62 12 Z"/>`,
    `<path d="M50 8 V92 M14 29 L86 71 M86 29 L14 71"/>`,
    `<path d="M50 10 L80 60 H20 Z M50 40 L85 92 H15 Z"/>`,
    `<path d="M8 92 V50 H30 V92 M36 92 V22 H62 V92 M68 92 V40 H92 V92"/>`
  ];
  const cards = ITEMS.map(([title, sub], i) => {
    const c = document.createElement("div");
    c.className = "carousel-card";
    c.innerHTML = `
      <div class="carousel-art">
        <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round">${SHAPES[i]}</svg>
        <span class="carousel-num">${String(i + 1).padStart(2, "0")} / ${String(N).padStart(2, "0")}</span>
      </div>
      <div class="carousel-text"><strong>${title}</strong><span>${sub}</span></div>`;
    view.appendChild(c);
    return c;
  });

  /* ---------- 상태 ---------- */
  let target = 0, pos = 0, edge = 0, edgeV = 0;
  let cf = S.layout === "coverflow" ? 1 : 0;       // 커버플로 섞임 정도
  let vis = S.visible;                               // 보이는 개수 (부드럽게)
  let autoT = 0, hovering = false, lastDir = 0, movedAt = 0, lastKey = "–";
  const held = { left: false, right: false };

  const current = () => mod(Math.round(target), N);
  const go = dir => {
    lastDir = dir; movedAt = performance.now(); autoT = 0;
    if (S.loop) { target += dir; return true; }
    const t = target + dir;
    if (t < 0 || t > N - 1) { edgeV += dir * 5; api.flash(dir > 0 ? "마지막 항목이다 · 더 넘길 수 없다" : "첫 항목이다 · 더 넘길 수 없다", "alt", 1200); return false; }
    target = t; return true;
  };
  const goTo = i => {
    const cur = current();
    let d = i - cur;
    if (S.loop) { d = mod(d + N / 2, N) - N / 2; }
    if (!d) return;
    lastDir = Math.sign(d); movedAt = performance.now(); autoT = 0;
    target += d;
  };

  api.onParam(k => {
    if (k === "loop" && !S.loop) {
      const nt = mod(Math.round(target), N);
      pos += nt - target; target = nt;
    }
    if (k === "auto") autoT = 0;
  });

  /* ---------- 입력 ---------- */
  // 사이드바의 글자 입력칸, 슬라이더에 포커스가 있으면 반응하지 않는다 (체크박스는 예외: Space가 토글을 다시 뒤집지 않도록)
  const fromField = e => { const f = e.target && e.target.closest && e.target.closest("input, textarea, select, [contenteditable]"); return !!f && !(f.type === "checkbox" || f.type === "radio"); };
  api.on(window, "keydown", e => {
    if (fromField(e) || e.metaKey || e.ctrlKey || e.altKey) return;
    let handled = true;
    if (e.key === "ArrowRight") { held.right = true; go(1); lastKey = "→"; }
    else if (e.key === "ArrowLeft") { held.left = true; go(-1); lastKey = "←"; }
    else if (e.key === "Home") { goTo(0); lastKey = "Home"; }
    else if (e.key === "End") { goTo(N - 1); lastKey = "End"; }
    else handled = false;
    if (handled) { e.preventDefault(); api.hideHint(); }
  });
  api.on(window, "keyup", e => {
    if (e.key === "ArrowRight") held.right = false;
    else if (e.key === "ArrowLeft") held.left = false;
    else return;
    if (!fromField(e)) e.preventDefault();
  });
  api.on(window, "blur", () => { held.left = held.right = false; });

  root.querySelectorAll("button").forEach(b => api.on(b, "pointerdown", e => e.preventDefault()));   // 포커스를 가져가지 않게
  api.on(prevBtn, "click", () => { go(-1); lastKey = "‹ 버튼"; api.hideHint(); });
  api.on(nextBtn, "click", () => { go(1); lastKey = "› 버튼"; api.hideHint(); });
  dots.forEach(d => api.on(d, "click", () => { goTo(+d.dataset.i); lastKey = `점 ${+d.dataset.i + 1}`; api.hideHint(); }));
  cards.forEach((c, i) => api.on(c, "click", () => { if (i !== current()) { goTo(i); lastKey = "카드 클릭"; api.hideHint(); } }));
  api.on(view, "pointerenter", () => { hovering = true; });
  api.on(view, "pointerleave", () => { hovering = false; });

  /* ---------- 루프 ---------- */
  api.frame(dt => {
    const s = dt / 1000;
    const vw = view.clientWidth, vh = view.clientHeight;

    // 자동 넘김
    const paused = hovering || held.left || held.right;
    if (S.auto && !paused) {
      autoT += dt;
      if (autoT >= S.interval * 1000) {
        autoT = 0;
        if (!S.loop && current() === N - 1) goTo(0); else go(1);
        lastKey = "자동";
      }
    }

    pos += (target - pos) * (1 - Math.exp(-11 * s));
    if (Math.abs(target - pos) < 0.0005) pos = target;
    edgeV += (-edge * 260 - edgeV * 18) * s; edge += edgeV * s;
    cf += ((S.layout === "coverflow" ? 1 : 0) - cf) * (1 - Math.exp(-9 * s));
    vis += (S.visible - vis) * (1 - Math.exp(-9 * s));

    // 평면 배치
    const side = vw < 600 ? 60 : 88, gap = 16;
    const slot = Math.max(60, (vw - side * 2 + gap) / vis);
    const fw = slot - gap, fh = Math.min(vh * 0.86, fw * 1.25, 460);
    // 커버플로 배치
    const cw = Math.min(300, vw * 0.52), ch = Math.min(vh * 0.8, cw * 1.3);

    const P = pos + edge * 0.18;
    cards.forEach((c, i) => {
      let d = i - P;
      if (S.loop) d = mod(d + N / 2, N) - N / 2;
      const ad = Math.abs(d), sg = Math.sign(d);
      // 평면
      const fx = d * slot, fo = 1;
      // 커버플로
      const cx = sg * (Math.min(ad, 1) * cw * 0.62 + Math.max(ad - 1, 0) * cw * 0.3);
      const cry = -clamp(d, -1, 1) * 52, cz = -Math.min(ad, 3.5) * 120;
      const co = clamp(3.6 - ad, 0, 1);

      const x = lerp(fx, cx, cf), w = lerp(fw, cw, cf), hh = lerp(fh, ch, cf);
      const ry = cry * cf, z = cz * cf;
      let op = lerp(fo, co, cf);
      if (S.loop) op = Math.min(op, clamp((N / 2 - ad) * 2, 0, 1));
      c.style.width = w + "px"; c.style.height = hh + "px";
      c.style.transform = `translate3d(${x - w / 2}px, ${-hh / 2}px, ${z}px) rotateY(${ry}deg)`;
      c.style.opacity = op;
      c.style.zIndex = String(100 - Math.round(ad * 10));
      c.classList.toggle("is-current", i === current());
    });

    // 버튼, 점
    const cur = current();
    prevBtn.classList.toggle("on", held.left); nextBtn.classList.toggle("on", held.right);
    prevBtn.classList.toggle("dim", !S.loop && Math.round(target) <= 0);
    nextBtn.classList.toggle("dim", !S.loop && Math.round(target) >= N - 1);
    dots.forEach((d, i) => {
      const on = i === cur;
      d.classList.toggle("on", on);
      d.classList.toggle("auto", on && S.auto);
      d.firstChild.style.width = on && S.auto ? `${clamp(autoT / (S.interval * 1000), 0, 1) * 100}%` : "0";
    });

    api.read("index", `${cur + 1} / ${N}`);
    api.read("key", held.left ? "← 누름" : held.right ? "→ 누름" : lastKey);
    api.read("pos", (mod(pos, N)).toFixed(2));
    api.read("auto", S.auto ? (paused ? "멈춤" : `${Math.max(0, S.interval - autoT / 1000).toFixed(1)}초 뒤`) : "꺼짐");

    const moving = Math.abs(target - pos) > 0.01;
    if (moving) api.status(`넘기는 중 ${lastDir > 0 ? "→ 다음" : "← 이전"} · ${cur + 1}번으로`, "active");
    else if (Math.abs(edge) > 0.02) api.status("끝에 닿았다", "alt");
    else if (S.auto && paused) api.status("자동 넘김 멈춤 · 마우스가 위에 있다", "alt");
    else if (S.auto) api.status(`자동 넘김 · ${cur + 1}번 보는 중`, "idle");
    else api.status(`${cur + 1}번 보는 중`, "idle");
  });
}
