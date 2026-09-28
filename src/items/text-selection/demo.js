import { clamp } from "../../lib/util.js";

export default function demo(api) {
  const { el, S } = api;

  api.css(`
    .text-selection-root { position: absolute; inset: 0; background: var(--board); display: grid; place-items: center; padding: 64px 16px; overflow: hidden; }
    .text-selection-sheet { position: relative; width: min(640px, 100%); background: var(--note); border: 1px solid rgba(0,0,0,.12);
      border-radius: 12px; padding: 40px 44px; }
    .text-selection-text { position: relative; cursor: text; color: var(--ink); word-break: keep-all; }
    .text-selection-text h3 { margin: 0 0 14px; font-size: 24px; line-height: 1.5; font-weight: 700; letter-spacing: -.03em; position: relative; z-index: 1; }
    .text-selection-text p { margin: 0 0 12px; font-size: 18px; line-height: 1.9; letter-spacing: -.01em; position: relative; z-index: 1; }
    .text-selection-text p:last-child { margin-bottom: 0; }
    .text-selection-sheet.small { padding: 24px 22px; }
    .text-selection-sheet.small h3 { font-size: 18px; margin-bottom: 8px; }
    .text-selection-sheet.small p { font-size: 14px; line-height: 1.75; }
    .text-selection-marks { position: absolute; inset: 0; pointer-events: none; z-index: 0; }
    .text-selection-mark { position: absolute; transition: opacity .25s; }
    .text-selection-mark.out { opacity: 0; }
    .text-selection-mark.marker { background: rgba(255,90,54,.28); border-radius: 2px; }
    .text-selection-mark.marker.live { background: rgba(255,90,54,.18); }
    .text-selection-mark.underline { border-bottom: 3px solid var(--accent); }
    .text-selection-mark.underline.live { border-bottom-color: rgba(255,90,54,.5); }
    .text-selection-mark.box { border: 1.5px solid var(--ink); border-radius: 4px; }
    .text-selection-mark.box.live { border-style: dashed; }
    .text-selection-mark.focus.marker { background: rgba(255,90,54,.4); }
    .text-selection-mark.focus.underline { border-bottom-width: 4px; }
    .text-selection-mark.focus.box { border-width: 2px; }
    .text-selection-bar { position: absolute; z-index: 5; display: flex; align-items: center; gap: 10px; white-space: nowrap;
      background: var(--ink); color: #fff; border-radius: var(--r-pill); padding: 5px 6px 5px 14px; font-size: 13px;
      transform: translate(-50%, -100%); opacity: 0; pointer-events: none; transition: opacity .15s; }
    .text-selection-bar.on { opacity: 1; pointer-events: auto; }
    .text-selection-bar button { font: inherit; font-size: 13px; font-weight: 600; color: var(--ink); background: #fff; border: 0;
      border-radius: var(--r-pill); padding: 3px 10px; cursor: pointer; }
  `);

  const root = document.createElement("div");
  root.className = "text-selection-root";
  el.appendChild(root);
  const sheet = document.createElement("div");
  sheet.className = "text-selection-sheet";
  root.appendChild(sheet);
  const text = document.createElement("div");
  text.className = "text-selection-text";
  sheet.appendChild(text);
  const marks = document.createElement("div");
  marks.className = "text-selection-marks";
  text.appendChild(marks);
  const bar = document.createElement("div");
  bar.className = "text-selection-bar";
  bar.innerHTML = `<span></span><button type="button">지우기</button>`;
  sheet.appendChild(bar);
  const barText = bar.querySelector("span"), barBtn = bar.querySelector("button");

  /* ---------- 글자마다 칸 만들기 ---------- */
  const BLOCKS = [
    ["h3", "인터랙션은 대화다"],
    ["p", "좋은 인터랙션은 사용자가 무엇을 할 수 있는지 먼저 알려주고, 한 번의 행동에 분명한 반응으로 답한다. 누르면 눌린 느낌이 나고, 끌면 손을 따라오고, 놓으면 제자리를 찾는다."],
    ["p", "행동과 반응이 짝을 이루는 순간 화면은 도구가 아니라 대화 상대가 된다. 디자이너는 그 대화의 속도와 말투를 정하는 사람이다."]
  ];
  const chars = [];
  BLOCKS.forEach(([tag, str], b) => {
    const node = document.createElement(tag);
    [...str].forEach(ch => {
      const sp = document.createElement("span");
      sp.textContent = ch;
      node.appendChild(sp);
      chars.push({ ch, el: sp, block: b, l: 0, r: 0, t: 0, bt: 0, line: 0 });
    });
    text.appendChild(node);
  });
  const N = chars.length;
  let lines = [];   // { t, b, s, e } — e는 포함하지 않음

  function measure() {
    sheet.classList.toggle("small", root.clientWidth < 560);
    const base = text.getBoundingClientRect();
    lines = [];
    chars.forEach((c, i) => {
      const r = c.el.getBoundingClientRect();
      c.l = r.left - base.left; c.r = r.right - base.left; c.t = r.top - base.top; c.bt = r.bottom - base.top;
      const last = lines[lines.length - 1];
      if (!last || Math.abs(last.t - c.t) > 4 || chars[i - 1].block !== c.block) lines.push({ t: c.t, b: c.bt, s: i, e: i + 1 });
      else { last.e = i + 1; last.b = Math.max(last.b, c.bt); }
      c.line = lines.length - 1;
    });
    render();
  }

  /* ---------- 위치 → 글자 경계 / 글자 ---------- */
  function lineAt(y) {
    let li = lines.findIndex(L => y >= L.t && y < L.b);
    if (li < 0) {
      let best = Infinity;
      lines.forEach((L, i) => { const d = Math.abs((L.t + L.b) / 2 - y); if (d < best) { best = d; li = i; } });
    }
    return lines[li];
  }
  // 글자 사이 경계 (글자 단위 선택에 쓴다)
  function boundaryAt(x, y) {
    const L = lineAt(y);
    for (let i = L.s; i < L.e; i++) if (x < (chars[i].l + chars[i].r) / 2) return i;
    return L.e;
  }
  // 포인터 아래(또는 가장 가까운) 글자 (단어·줄 단위 선택에 쓴다)
  function charAt(x, y) {
    const L = lineAt(y);
    for (let i = L.s; i < L.e; i++) if (x < chars[i].r) return i;
    return L.e - 1;
  }
  const isSpace = i => i >= 0 && i < N && /\s/.test(chars[i].ch);
  function wordOf(i) {
    if (isSpace(i)) return [i, i];
    let a = i, b = i + 1;
    while (a > 0 && !isSpace(a - 1) && chars[a - 1].block === chars[i].block) a--;
    while (b < N && !isSpace(b) && chars[b].block === chars[i].block) b++;
    return [a, b];
  }
  function expand() {
    let s, e;
    if (S.unit === "char") { s = Math.min(drag.a, drag.f); e = Math.max(drag.a, drag.f); }
    else if (S.unit === "word") {
      const A = wordOf(drag.ac), F = wordOf(drag.fc);
      s = Math.min(A[0], F[0]); e = Math.max(A[1], F[1]);
    } else {
      const A = lines[chars[drag.ac].line], F = lines[chars[drag.fc].line];
      s = Math.min(A.s, F.s); e = Math.max(A.e, F.e);
    }
    // 앞뒤 공백은 빼고 표시한다
    while (e > s && isSpace(e - 1)) e--;
    while (s < e && isSpace(s)) s++;
    return [s, e];
  }

  /* ---------- 하이라이트 ---------- */
  let hls = [], seq = 0, live = null, focus = null;
  const drag = { on: false, a: 0, f: 0, ac: 0, fc: 0, moved: false, sx: 0, sy: 0 };

  function rectsOf(s, e) {
    const out = [];
    for (let li = 0; li < lines.length; li++) {
      const L = lines[li], a = Math.max(s, L.s), b = Math.min(e, L.e);
      if (a >= b) continue;
      let bb = b; while (bb > a && isSpace(bb - 1)) bb--;
      if (bb <= a) continue;
      out.push({ l: chars[a].l, r: chars[bb - 1].r, t: L.t, b: L.b });
    }
    return out;
  }
  function markEl(rc, cls) {
    const m = document.createElement("div");
    m.className = `text-selection-mark ${S.style} ${cls}`;
    const h = rc.b - rc.t;
    let top = rc.t, height = h, pad = 2;
    if (S.style === "marker") { top = rc.t + h * 0.18; height = h * 0.68; }
    if (S.style === "underline") { top = rc.t; height = h * 0.9; pad = 0; }
    if (S.style === "box") { top = rc.t + h * 0.08; height = h * 0.84; pad = 3; }
    Object.assign(m.style, { left: rc.l - pad + "px", top: top + "px", width: rc.r - rc.l + pad * 2 + "px", height: height + "px" });
    return m;
  }
  function render() {
    marks.querySelectorAll(".text-selection-mark:not(.out)").forEach(m => m.remove());
    hls.forEach(h => rectsOf(h.s, h.e).forEach(rc => marks.appendChild(markEl(rc, h === focus ? "focus" : ""))));
    if (live && live[1] > live[0]) rectsOf(live[0], live[1]).forEach(rc => marks.appendChild(markEl(rc, "live")));
    placeBar();
  }
  const fadeOut = list => list.forEach(h => rectsOf(h.s, h.e).forEach(rc => {
    const m = markEl(rc, "");
    marks.appendChild(m);
    requestAnimationFrame(() => m.classList.add("out"));
    api.timeout(() => m.remove(), 300);
  }));

  const stats = (s, e) => {
    let c = 0, w = 0;
    for (let i = s; i < e; i++) { if (!isSpace(i)) { c++; if (i === s || isSpace(i - 1) || chars[i - 1].block !== chars[i].block) w++; } }
    return { c, w };
  };
  function placeBar() {
    const h = focus;
    if (!h || drag.on) { bar.classList.remove("on"); return; }
    const rs = rectsOf(h.s, h.e);
    if (!rs.length) { bar.classList.remove("on"); return; }
    const r0 = rs[0], st = stats(h.s, h.e);
    barText.textContent = `${st.c}자 · ${st.w}단어`;
    const tb = text.getBoundingClientRect(), sb = sheet.getBoundingClientRect();
    const ox = tb.left - sb.left, oy = tb.top - sb.top;
    const bw = bar.offsetWidth || 150;
    const cx = clamp(ox + (r0.l + (rs.length > 1 ? Math.max(...rs.map(r => r.r)) : r0.r)) / 2, bw / 2 + 4, sheet.clientWidth - bw / 2 - 4);
    bar.style.left = cx + "px"; bar.style.top = (oy + r0.t - 6) + "px";
    bar.classList.add("on");
  }

  function commit(s, e) {
    if (e <= s) return;
    if (S.multi) {
      // 겹치거나 맞닿은 하이라이트는 하나로 합친다
      const over = hls.filter(h => h.s <= e && h.e >= s);
      over.forEach(h => { s = Math.min(s, h.s); e = Math.max(e, h.e); });
      hls = hls.filter(h => !over.includes(h));
    } else { fadeOut(hls); hls = []; }
    const h = { s, e, id: ++seq };
    hls.push(h); hls.sort((a, b) => a.s - b.s);
    focus = h;
  }

  /* ---------- 포인터 ---------- */
  const local = e => { const b = text.getBoundingClientRect(); return { x: e.clientX - b.left, y: e.clientY - b.top }; };
  api.on(root, "pointerdown", e => {
    if (e.target.closest(".text-selection-bar")) return;
    e.preventDefault();
    root.setPointerCapture(e.pointerId);
    const p = local(e);
    drag.on = true; drag.moved = false; drag.sx = e.clientX; drag.sy = e.clientY;
    drag.a = drag.f = boundaryAt(p.x, p.y);
    drag.ac = drag.fc = charAt(p.x, p.y);
    live = S.unit === "char" ? null : expand();
    render();
    api.hideHint();
  });
  api.on(root, "pointermove", e => {
    if (!drag.on) return;
    if (Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) > 3) drag.moved = true;
    const p = local(e);
    drag.f = boundaryAt(p.x, p.y);
    drag.fc = charAt(p.x, p.y);
    live = expand();
    render();
  });
  const up = e => {
    if (!drag.on) return;
    drag.on = false;
    const sel = live; live = null;
    if (sel && sel[1] > sel[0] && (drag.moved || S.unit !== "char")) commit(sel[0], sel[1]);
    else {
      // 드래그 없이 누르기: 하이라이트 위면 그것을 고르고, 아니면 선택 해제
      const i = drag.ac, hit = hls.find(h => i >= h.s && i < h.e);
      focus = hit || null;
    }
    render();
  };
  api.on(root, "pointerup", up);
  api.on(root, "pointercancel", up);
  api.on(barBtn, "click", () => {
    if (!focus) return;
    fadeOut([focus]); hls = hls.filter(h => h !== focus); focus = null; render();
    api.flash("하이라이트를 지웠다", "ok");
  });
  api.on(window, "keydown", e => {
    if (e.target.closest && e.target.closest("input, textarea, [contenteditable]")) return;
    if (e.key === "Escape" && focus) { focus = null; render(); }
  });

  api.onParam(k => {
    if (k === "multi" && !S.multi && hls.length > 1) {
      const keep = focus && hls.includes(focus) ? focus : hls[hls.length - 1];
      fadeOut(hls.filter(h => h !== keep)); hls = [keep]; focus = keep;
    }
    render();
  });
  api.onResize(measure);
  measure();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (text.isConnected) measure(); });
  api.timeout(measure, 300);

  /* ---------- 읽는 값 ---------- */
  api.frame(() => {
    const cur = drag.on && live ? live : focus ? [focus.s, focus.e] : null;
    const st = cur ? stats(cur[0], cur[1]) : { c: 0, w: 0 };
    api.read("chars", st.c + "자");
    api.read("words", st.w);
    api.read("range", cur && cur[1] > cur[0] ? `${cur[0]} → ${cur[1]}` : "–");
    api.read("count", hls.length);
    if (drag.on) api.status(`고르는 중 · ${st.c}자 · 단위: ${{ char: "글자", word: "단어", line: "줄" }[S.unit]}`, "active");
    else if (focus) api.status(`하이라이트 ${hls.length}개 · 고른 것 ${st.c}자`, "ok");
    else api.status(hls.length ? `대기 · 하이라이트 ${hls.length}개` : "대기", "idle");
  });
}
