import { rng, clamp } from "../../lib/util.js";

export default function demo(api) {
  const { el, S } = api;

  api.css(`
    .scroll-driven-root { position: absolute; inset: 0; overflow: hidden; background: var(--board); outline: none; }
    .scroll-driven-layer { position: absolute; left: 0; top: 0; will-change: transform; transition: opacity .25s; }
    .scroll-driven-layer.fading { opacity: 0; }
    .scroll-driven-deco { position: absolute; left: 0; top: 0; will-change: transform; pointer-events: none; }
    .scroll-driven-deco i { position: absolute; display: block; }
    .scroll-driven-sec { position: absolute; overflow: hidden; }
    .scroll-driven-sec.alt { background: rgba(0,0,0,.025); }
    .scroll-driven-num { position: absolute; font-weight: 800; line-height: 1; color: var(--ink); opacity: .08; letter-spacing: -.04em; }
    .scroll-driven-text { position: absolute; max-width: 360px; }
    .scroll-driven-text b { display: block; font-size: 18px; color: var(--ink); margin-bottom: 8px; }
    .scroll-driven-text span { display: block; font-size: 15px; color: var(--ink-2); line-height: 1.55; }
    .scroll-driven-card { position: absolute; background: var(--note); border: 1px solid var(--line); border-radius: var(--r-card); }
    .scroll-driven-card .ln { height: 5px; border-radius: 3px; background: var(--note-line); margin: 0 14px 9px; }
    .scroll-driven-card .ln:first-child { margin-top: 16px; }
    .scroll-driven-card.acc { background: var(--accent); border-color: var(--accent); }
    .scroll-driven-bar { position: absolute; left: 0; right: 0; bottom: 0; height: 3px; background: rgba(0,0,0,.06); z-index: 30; }
    .scroll-driven-bar i { position: absolute; inset: 0; background: var(--accent); transform-origin: 0 0; }
    .scroll-driven-dots { position: absolute; right: 14px; top: 50%; transform: translateY(-50%); z-index: 30;
      display: flex; flex-direction: column; gap: 10px; }
    .scroll-driven-dots button { width: 18px; height: 18px; padding: 0; border: 0; background: none; cursor: pointer; display: grid; place-items: center; }
    .scroll-driven-dots button::after { content: ""; width: 7px; height: 7px; border-radius: 50%; background: var(--ink-3); opacity: .45; transition: all .2s; }
    .scroll-driven-dots button.on::after { background: var(--accent); opacity: 1; transform: scale(1.3); }
  `);

  const root = document.createElement("div");
  root.className = "scroll-driven-root";
  root.tabIndex = -1;
  el.appendChild(root);
  const back = document.createElement("div"), track = document.createElement("div"), front = document.createElement("div");
  back.className = "scroll-driven-layer"; track.className = "scroll-driven-layer"; front.className = "scroll-driven-layer";
  root.append(back, track, front);
  const bar = document.createElement("div"); bar.className = "scroll-driven-bar"; bar.innerHTML = "<i></i>";
  const barFill = bar.firstChild;
  const dotsBox = document.createElement("div"); dotsBox.className = "scroll-driven-dots";
  root.append(bar, dotsBox);

  /* ---------- 구간 ---------- */
  const SECS = [
    { t: "스크롤을 내리면", d: "휠을 굴린 만큼 보드가 움직인다. 페이지는 그대로이고, 이 안의 보드만 지나간다." },
    { t: "굴린 양만큼 보드가 이동한다", d: "휠 한 칸, 트랙패드 한 번 쓸기가 그대로 이동 거리로 바뀐다. 맨 아래 주황 막대가 전체 진행도다." },
    { t: "세로를 가로로", d: "축을 가로로 바꾸면 휠을 아래로 굴릴 때 보드가 옆으로 지나간다. 가로 스크롤 전시 페이지의 방식이다." },
    { t: "층마다 다른 속도", d: "패럴랙스를 켜면 앞에 있는 도형은 빠르게, 뒤에 있는 도형은 느리게 지나가서 깊이가 생긴다." },
    { t: "끝", d: "진행도 100%다. 위로 굴리면 되돌아간다." }
  ];
  const n = SECS.length;
  const secEls = SECS.map((s, i) => {
    const e = document.createElement("div");
    e.className = "scroll-driven-sec" + (i % 2 ? " alt" : "");
    const rand = rng(100 + i);
    const cards = [0, 1, 2].map(k => {
      const acc = k === 1 && i % 2 === 0;
      return `<div class="scroll-driven-card${acc ? " acc" : ""}" data-k="${k}" data-r="${rand().toFixed(3)}">${acc ? "" : '<div class="ln" style="width:60%"></div><div class="ln"></div><div class="ln" style="width:80%"></div>'}</div>`;
    }).join("");
    e.innerHTML = `<div class="scroll-driven-num">${String(i + 1).padStart(2, "0")}</div><div class="scroll-driven-text"><b>${s.t}</b><span>${s.d}</span></div>${cards}`;
    track.appendChild(e);
    return e;
  });
  const dots = SECS.map((s, i) => {
    const b = document.createElement("button");
    b.title = `${i + 1}. ${s.t}`;
    dotsBox.appendChild(b);
    return b;
  });

  /* ---------- 장식 도형 (패럴랙스 층) ---------- */
  const decos = [];
  const drand = rng(9);
  const DEPTHS = [0.35, 0.6, 1.5, 1.9];
  for (let i = 0; i < 34; i++) {
    const k = DEPTHS[Math.floor(drand() * DEPTHS.length)];
    const e = document.createElement("i");
    const far = k < 1;
    const sz = far ? 8 + drand() * 12 : 22 + drand() * 26;
    const shape = drand();
    e.style.width = e.style.height = sz + "px";
    if (far) { e.style.background = "var(--ink-3)"; e.style.opacity = k < 0.5 ? ".22" : ".35"; }
    else { e.style.border = "1.5px solid " + (drand() < 0.2 ? "var(--accent)" : "var(--ink)"); e.style.opacity = ".7"; }
    e.style.borderRadius = shape < 0.5 ? "50%" : "3px";
    const wrap = document.createElement("div"); wrap.className = "scroll-driven-deco";
    wrap.appendChild(e);
    (far ? back : front).appendChild(wrap);
    decos.push({ wrap, k, sv: drand(), along: drand(), cross: 0.08 + drand() * 0.84, sz });
  }

  /* ---------- 배치 ---------- */
  let vw = 0, vh = 0, Lsec = 0, max = 0;
  const vertical = () => S.axis === "y";
  const layout = () => {
    vw = el.clientWidth; vh = el.clientHeight;
    Lsec = vertical() ? vh : vw;
    max = (n - 1) * Lsec;
    const narrow = vw < 600;
    secEls.forEach((e, i) => {
      e.style.width = vw + "px"; e.style.height = vh + "px";
      e.style.left = (vertical() ? 0 : i * vw) + "px"; e.style.top = (vertical() ? i * vh : 0) + "px";
      const num = e.querySelector(".scroll-driven-num");
      const big = Math.min(vw, vh) * (narrow ? 0.42 : 0.36);
      num.style.fontSize = big + "px"; num.style.left = (narrow ? 20 : 48) + "px"; num.style.top = vh * (narrow ? 0.14 : 0.16) + "px";
      const tx = e.querySelector(".scroll-driven-text");
      tx.style.left = (narrow ? 24 : 56) + "px"; tx.style.top = vh * (narrow ? 0.14 : 0.16) + big * 0.9 + "px";
      tx.style.maxWidth = (narrow ? vw - 70 : Math.min(360, vw * 0.42)) + "px";
      e.querySelectorAll(".scroll-driven-card").forEach(c => {
        const k = +c.dataset.k, r = +c.dataset.r;
        const cw = narrow ? 110 : 150 + r * 60, ch = narrow ? 80 : 110 + r * 50;
        c.style.width = cw + "px"; c.style.height = ch + "px";
        if (narrow) { c.style.left = (24 + k * 110 + r * 10) + "px"; c.style.top = (vh * 0.68 + (k % 2) * 30) + "px"; }
        else { c.style.left = (vw * 0.56 + (k % 2) * vw * 0.16 + r * 20) + "px"; c.style.top = (vh * (0.14 + k * 0.24) + r * 30) + "px"; }
      });
    });
  };

  /* ---------- 스크롤 상태 ---------- */
  const sc = { s: 0, t: 0, last: 0, lastDelta: 0, snapped: true, drag: false, px: 0, py: 0 };
  let par = S.parallax ? 1 : 0;
  layout();
  api.onResize(() => { const p = max ? sc.t / max : 0, q = max ? sc.s / max : 0; layout(); sc.t = p * max; sc.s = q * max; });

  const input = d => {
    sc.t = clamp(sc.t + d, 0, max);
    sc.lastDelta = d; sc.last = performance.now(); sc.snapped = false;
    api.hideHint();
  };
  api.on(root, "wheel", e => {
    e.preventDefault();
    const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? vh : 1;
    // 세로 휠과 가로 쓸기를 모두 진행 방향 하나로 합친다
    input((Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX) * unit);
  }, { passive: false });
  api.on(root, "pointerdown", e => {
    if (e.target.closest(".scroll-driven-dots")) return;
    e.preventDefault(); root.setPointerCapture(e.pointerId);
    sc.drag = true; sc.px = e.clientX; sc.py = e.clientY;
    root.focus({ preventScroll: true });
  });
  api.on(root, "pointermove", e => {
    if (!sc.drag) return;
    const dx = e.clientX - sc.px, dy = e.clientY - sc.py;
    sc.px = e.clientX; sc.py = e.clientY;
    input(-(vertical() ? dy : dx));
  });
  const up = () => { sc.drag = false; sc.last = performance.now(); };
  api.on(root, "pointerup", up);
  api.on(root, "pointercancel", up);
  api.on(window, "keydown", e => {
    if (e.target.closest && e.target.closest("input, textarea, [contenteditable]")) return;
    const map = { ArrowDown: 120, ArrowRight: 120, ArrowUp: -120, ArrowLeft: -120, PageDown: Lsec, PageUp: -Lsec, " ": Lsec * 0.8 };
    if (!(e.key in map)) return;
    if (!el.contains(document.activeElement) && document.activeElement !== document.body) return;
    e.preventDefault(); input(map[e.key]);
  });
  dots.forEach((b, i) => api.on(b, "click", () => { sc.t = i * Lsec; sc.last = performance.now(); sc.snapped = true; api.hideHint(); }));

  api.onParam(k => {
    if (k === "axis") {
      const p = max ? sc.s / max : 0, pt = max ? sc.t / max : 0;
      [back, track, front].forEach(l => l.classList.add("fading"));
      api.timeout(() => {
        layout(); sc.s = p * max; sc.t = pt * max;
        [back, track, front].forEach(l => l.classList.remove("fading"));
      }, 250);
    }
    if (k === "snap" && S.snap) sc.snapped = false;
  });

  /* ---------- 루프 ---------- */
  api.frame(() => {
    const now = performance.now();
    // 스냅: 입력이 잠시 멈추면 가장 가까운 구간으로
    let snapping = false;
    if (S.snap && !sc.drag && !sc.snapped && now - sc.last > 160) {
      sc.t = Math.round(sc.t / Lsec) * Lsec; sc.snapped = true;
    }
    if (S.snap && Math.abs(sc.t - sc.s) > 1 && now - sc.last > 160) snapping = true;
    sc.s += (sc.t - sc.s) * S.smooth;
    if (Math.abs(sc.t - sc.s) < 0.1) sc.s = sc.t;

    const V = vertical();
    track.style.transform = V ? `translate3d(0,${-sc.s}px,0)` : `translate3d(${-sc.s}px,0,0)`;
    // 패럴랙스: 깊이 k로 지나가는 속도를 바꾼다 (끄면 모두 1로 돌아온다)
    par += ((S.parallax ? 1 : 0) - par) * 0.08;
    if (Math.abs(par - (S.parallax ? 1 : 0)) < 0.001) par = S.parallax ? 1 : 0;
    const viewLen = V ? vh : vw, crossLen = V ? vw : vh;
    for (const d of decos) {
      const kk = 1 + (d.k - 1) * par;
      const sv = -0.2 * Lsec + d.sv * (max + 0.4 * Lsec); // 이 도형이 화면에 들어오는 스크롤 시점
      const a = d.along * viewLen + (sv - sc.s) * kk;
      const c = d.cross * crossLen;
      d.wrap.style.transform = V ? `translate3d(${c}px,${a}px,0)` : `translate3d(${a}px,${c}px,0)`;
    }

    const prog = max ? sc.s / max : 0;
    barFill.style.transform = `scaleX(${prog})`;
    const sec = Lsec ? Math.round(sc.s / Lsec) : 0;
    dots.forEach((b, i) => b.classList.toggle("on", i === sec));

    api.read("delta", `${Math.round(sc.lastDelta)}px`);
    api.read("scroll", `${Math.round(sc.s)}px`);
    api.read("prog", `${Math.round(prog * 100)}%`);
    api.read("sec", `${sec + 1} / ${n}`);

    const moving = Math.abs(sc.t - sc.s) > 0.5;
    if (snapping && moving) api.status(`가까운 구간으로 맞추는 중 · ${sec + 1}번`, "alt");
    else if (moving || sc.drag) api.status(`스크롤 중 · 진행도 ${Math.round(prog * 100)}%`, "active");
    else if (prog >= 0.999) api.status("끝에 닿음 · 더 내려가지 않는다", "ok");
    else api.status("대기", "idle");
  });
}
