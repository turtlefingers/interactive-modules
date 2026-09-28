import { cat, ILLO } from "../../lib/draw.js";

export default function demo(api) {
  const { el, S } = api;

  /* ---------- 이야기: 고양이 두부의 밤 산책 ---------- */
  const N = {
    start: { label: "창문", t: "밤 11시. 고양이 두부가 창문 틈으로 살짝 빠져나왔다. 골목 끝에서 무언가 반짝인다.",
      c: [["반짝이는 쪽으로 간다", "shiny"], ["지붕 위로 올라간다", "roof"], ["그냥 집으로 돌아간다", "e_home"]] },
    shiny: { label: "골목", t: "반짝이던 것은 은색 병뚜껑이었다. 그 옆에서 생쥐 한 마리가 병뚜껑을 노려보고 있다.",
      c: [["병뚜껑을 차지한다", "cap"], ["생쥐에게 양보한다", "mouse"]] },
    roof: { label: "지붕", t: "지붕 위는 바람이 시원하다. 달이 유난히 크고, 옆 지붕에는 처음 보는 까만 고양이가 앉아 있다.",
      c: [["말을 걸어 본다", "friend"], ["달을 향해 점프한다", "e_moon"]] },
    cap: { label: "병뚜껑", t: "병뚜껑을 굴리며 놀다 보니 생선가게 앞이다. 셔터 틈으로 고소한 냄새가 새어 나온다.",
      c: [["틈으로 들어간다", "e_fish"], ["병뚜껑만 물고 집으로", "e_treasure"]] },
    mouse: { label: "생쥐", t: "생쥐가 고맙다며 따라오라고 한다. 담벼락 구멍 너머로 작은 불빛이 깜빡인다.",
      c: [["따라간다", "e_party"], ["정중히 거절한다", "e_polite"]] },
    friend: { label: "연탄", t: "까만 고양이의 이름은 연탄이다. 연탄은 이 동네에서 가장 높은 곳을 안다며 꼬리를 흔든다.",
      c: [["연탄을 따라간다", "e_tower"], ["내일 또 만나자고 한다", "e_promise"]] },
    e_home: { end: "포근한 결말", t: "두부는 다시 이불 속으로 파고들었다. 모험은 내일로 미룬다. 그것도 나쁘지 않다." },
    e_moon: { end: "달 착륙 실패", t: "멋진 점프였지만 달은 생각보다 멀었다. 두부는 옆집 빨래 바구니 위에 폭신하게 착지했다." },
    e_fish: { end: "생선가게의 밤", t: "주인 아저씨에게 들키고 말았다. 그런데 아저씨는 웃으며 멸치 한 줌을 내밀었다." },
    e_treasure: { end: "첫 번째 보물", t: "병뚜껑은 침대 밑 보물 상자의 첫 번째 보물이 되었다. 두부는 뿌듯하게 잠들었다." },
    e_party: { end: "생쥐들의 파티", t: "구멍 너머에서는 생쥐들의 생일 파티가 한창이었다. 두부는 케이크 부스러기를 얻고 모두와 친구가 되었다." },
    e_polite: { end: "예의 바른 고양이", t: "생쥐는 아쉬워하며 인사했다. 다음 날 아침, 창문 앞에 작은 도토리 하나가 놓여 있었다." },
    e_tower: { end: "가장 높은 곳", t: "교회 종탑 꼭대기에서 두부와 연탄은 해가 뜰 때까지 잠든 동네를 내려다보았다." },
    e_promise: { end: "내일의 약속", t: "연탄은 고개를 끄덕이고 어둠 속으로 사라졌다. 두부는 내일 밤이 벌써 기다려진다." }
  };
  const ENDS = Object.keys(N).filter(k => N[k].end);
  // 장면마다 두부의 표정 (그림 키트 cat의 mood)
  const MOOD = { start: "neutral", shiny: "surprised", roof: "happy", cap: "happy", mouse: "neutral", friend: "happy",
    e_home: "sleepy", e_moon: "sad", e_fish: "happy", e_treasure: "happy", e_party: "happy", e_polite: "neutral", e_tower: "happy", e_promise: "happy" };

  /* ---------- 지도 배치: 깊이는 가로, 결말은 오른쪽 끝에 세로로 ---------- */
  const MAXD = 3;
  let row = 0;
  const pos = {}, edges = [];
  const place = (id, d) => {
    const n = N[id];
    if (n.end) { pos[id] = { d: MAXD, r: row++ }; return pos[id].r; }
    const rs = n.c.map(([, to]) => { edges.push({ from: id, to }); return place(to, d + 1); });
    pos[id] = { d, r: rs.reduce((a, b) => a + b, 0) / rs.length };
    return pos[id].r;
  };
  place("start", 0);
  const ROWS = row;

  api.css(`
    .branching-choice-root { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; gap: 0;
      padding: 64px 32px 72px; }
    .branching-choice-card { width: 440px; max-width: 100%; display: flex; flex-direction: column; gap: 18px; }
    .branching-choice-meta { font-size: 13px; color: var(--ink-3); display: flex; justify-content: space-between; }
    .branching-choice-cat { display: block; width: 96px; height: 80px; margin-bottom: 4px; }
    .branching-choice-text { font-size: 18px; line-height: 1.65; color: var(--ink); min-height: 5.2em; word-break: keep-all; cursor: default; }
    .branching-choice-text .caret { display: inline-block; width: 2px; height: 1em; background: var(--ink); vertical-align: -2px; margin-left: 2px;
      animation: branching-choice-blink 1s steps(1) infinite; }
    @keyframes branching-choice-blink { 50% { opacity: 0; } }
    .branching-choice-end { font-size: 13px; font-weight: 700; color: var(--accent); margin-bottom: 6px; }
    .branching-choice-choices { display: flex; flex-direction: column; gap: 8px; min-height: 40px; }
    .branching-choice-choice { font: inherit; font-size: 15px; text-align: left; color: var(--ink); background: transparent; cursor: pointer;
      border: 1px solid rgba(0,0,0,.18); border-radius: var(--r-box); padding: 12px 14px; display: flex; gap: 10px; align-items: baseline;
      opacity: 0; transform: translateY(6px); transition: opacity .25s, transform .25s, border-color .15s, background .15s; }
    .branching-choice-choice.show { opacity: 1; transform: none; }
    .branching-choice-choice:hover { border-color: var(--ink); }
    .branching-choice-choice:active { background: rgba(0,0,0,.04); }
    .branching-choice-choice kbd { font: inherit; font-size: 13px; color: var(--ink-3); min-width: 12px; }
    .branching-choice-choice.restart { justify-content: center; background: var(--ink); color: var(--on-ink); border-color: var(--ink); }
    .branching-choice-choice.restart kbd { display: none; }
    .branching-choice-back { font: inherit; font-size: 13px; color: var(--ink-2); background: none; border: 0; padding: 4px 0; cursor: pointer;
      align-self: flex-start; transition: opacity .2s; }
    .branching-choice-back:hover { color: var(--ink); }
    .branching-choice-back[disabled] { opacity: .35; cursor: default; }
    .branching-choice-back.hidden { opacity: 0; pointer-events: none; }
    .branching-choice-mapwrap { flex: 0 1 auto; width: 400px; max-width: 400px; overflow: hidden; margin-left: 56px;
      transition: max-width .45s cubic-bezier(.2,.8,.2,1), opacity .35s, margin-left .45s cubic-bezier(.2,.8,.2,1); }
    .branching-choice-mapwrap.off { max-width: 0; opacity: 0; margin-left: 0; }
    .branching-choice-map { width: 400px; display: block; overflow: visible; }
    .branching-choice-map .edge { fill: none; stroke: rgba(0,0,0,.12); stroke-width: 1.2; transition: stroke .25s, stroke-width .25s; }
    .branching-choice-map .edge.seen { stroke: rgba(0,0,0,.3); }
    .branching-choice-map .edge.path { stroke: var(--ink); stroke-width: 2; }
    .branching-choice-map .edge.preview { stroke: var(--accent); stroke-width: 2; stroke-dasharray: 4 4; }
    .branching-choice-map .node { fill: var(--board); stroke: rgba(0,0,0,.25); stroke-width: 1.2; transition: fill .25s, stroke .25s, r .25s; }
    .branching-choice-map .node.seen { fill: rgba(0,0,0,.25); stroke: transparent; }
    .branching-choice-map .node.path { fill: var(--ink); stroke: var(--ink); }
    .branching-choice-map .node.now { fill: var(--accent); stroke: var(--accent); r: 7px; }
    .branching-choice-map text { font-size: 12px; fill: var(--ink-3); font-family: inherit; }
    .branching-choice-map text.path { fill: var(--ink); font-weight: 600; }
    .branching-choice-map .count { font-size: 13px; fill: var(--ink-2); }
    .branching-choice-root.narrow { flex-direction: column; justify-content: flex-start; padding: 60px 16px 64px; overflow-y: auto; }
    .branching-choice-root.narrow .branching-choice-mapwrap { margin: 24px 0 0; width: 100%; max-width: 100%; }
    .branching-choice-root.narrow .branching-choice-mapwrap.off { max-width: 100%; max-height: 0; margin: 0; }
    .branching-choice-root.narrow .branching-choice-map { width: 100%; }
    .branching-choice-root.narrow .branching-choice-text { font-size: 15px; }
  `);

  /* ---------- DOM ---------- */
  const root = document.createElement("div");
  root.className = "branching-choice-root";
  el.appendChild(root);
  root.innerHTML = `
    <div class="branching-choice-card">
      <div class="branching-choice-meta"><span class="step"></span><span class="found"></span></div>
      <div class="branching-choice-body"><canvas class="branching-choice-cat"></canvas><div class="branching-choice-endtag"></div><div class="branching-choice-text"></div></div>
      <div class="branching-choice-choices"></div>
      <button class="branching-choice-back">← 한 단계 뒤로</button>
    </div>
    <div class="branching-choice-mapwrap"><svg class="branching-choice-map"></svg></div>`;
  const $ = s => root.querySelector(s);
  const card = $(".branching-choice-card"), body = $(".branching-choice-body"), textEl = $(".branching-choice-text");
  const endTag = $(".branching-choice-endtag"), choicesEl = $(".branching-choice-choices"), backBtn = $(".branching-choice-back");
  const stepEl = $(".step"), foundEl = $(".found"), mapWrap = $(".branching-choice-mapwrap"), svg = $(".branching-choice-map");

  /* ---------- 두부 그림 (그림 키트 cat) ---------- */
  const catCv = $(".branching-choice-cat");
  const CW = 96, CH = 80, dpr = window.devicePixelRatio || 1;
  catCv.width = CW * dpr; catCv.height = CH * dpr;
  const cg = catCv.getContext("2d");
  const drawCat = t => {
    cg.setTransform(dpr, 0, 0, dpr, 0, 0);
    cg.clearRect(0, 0, CW, CH);
    const id = path[path.length - 1];
    cat(cg, 40, CH - 6, { size: 68, color: ILLO.paper, mood: MOOD[id] || "neutral", look: { x: 0.4, y: 0 }, tailT: t / 500 });
  };

  /* ---------- 지도 그리기 ---------- */
  const MW = 400, ROWH = 34, MH = ROWS * ROWH + 16;
  const X = d => 14 + d * 86, Y = r => 14 + r * ROWH;
  svg.setAttribute("viewBox", `0 0 ${MW} ${MH}`);
  const NS = "http://www.w3.org/2000/svg";
  const mk = (tag, attrs, parent = svg) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); parent.appendChild(e); return e; };
  const edgeEls = {}, nodeEls = {}, labelEls = {};
  edges.forEach(({ from, to }) => {
    const a = pos[from], b = pos[to];
    const x1 = X(a.d), y1 = Y(a.r), x2 = X(b.d), y2 = Y(b.r), mx = x1 + 40;
    edgeEls[from + ">" + to] = mk("path", { class: "edge", d: `M${x1} ${y1} C${mx} ${y1} ${mx} ${y2} ${x1 + 70} ${y2} L${x2} ${y2}` });
  });
  Object.keys(N).forEach(id => {
    const p = pos[id];
    nodeEls[id] = mk("circle", { class: "node", cx: X(p.d), cy: Y(p.r), r: 5 });
    if (N[id].end) labelEls[id] = mk("text", { x: X(p.d) + 12, y: Y(p.r) + 4 });
    else labelEls[id] = mk("text", { x: X(p.d), y: Y(p.r) + 20, "text-anchor": "middle" });
  });

  /* ---------- 상태 ---------- */
  let path = ["start"], picks = 0, typed = 0, typing = false, preview = null;
  const seenNodes = new Set(["start"]), seenEdges = new Set(), found = new Set();
  const cur = () => N[path[path.length - 1]];

  const paintMap = () => {
    const onPath = new Set(path), pathEdges = new Set();
    for (let i = 1; i < path.length; i++) pathEdges.add(path[i - 1] + ">" + path[i]);
    for (const k in edgeEls) {
      const e = edgeEls[k];
      e.classList.toggle("seen", seenEdges.has(k));
      e.classList.toggle("path", pathEdges.has(k));
      e.classList.toggle("preview", k === preview);
    }
    const now = path[path.length - 1];
    for (const id in nodeEls) {
      nodeEls[id].classList.toggle("seen", seenNodes.has(id));
      nodeEls[id].classList.toggle("path", onPath.has(id));
      nodeEls[id].classList.toggle("now", id === now);
      const lab = labelEls[id];
      lab.textContent = N[id].end ? (found.has(id) ? N[id].end : "?") : (seenNodes.has(id) ? N[id].label : "");
      lab.classList.toggle("path", onPath.has(id));
    }
  };

  const showChoices = () => {
    [...choicesEl.children].forEach((b, i) => api.timeout(() => b.classList.add("show"), 60 + i * 70));
  };
  const renderScene = () => {
    const n = cur();
    stepEl.textContent = n.end ? "결말" : path.length === 1 ? "처음" : `${path.length - 1}번째 선택 뒤`;
    foundEl.textContent = `발견한 결말 ${found.size} / ${ENDS.length}`;
    endTag.innerHTML = n.end ? `<div class="branching-choice-end">결말 · ${n.end}</div>` : "";
    choicesEl.innerHTML = n.end
      ? `<button class="branching-choice-choice restart" data-restart="1">처음부터 다시</button>`
      : n.c.map(([label, to], i) => `<button class="branching-choice-choice" data-to="${to}"><kbd>${i + 1}</kbd><span>${label}</span></button>`).join("");
    typed = 0; delete textEl.dataset.n;
    typing = !!S.typing;
    if (!typing) { textEl.textContent = n.t; showChoices(); }
    else textEl.innerHTML = `<span class="caret"></span>`;
    backBtn.disabled = path.length < 2;
    backBtn.classList.toggle("hidden", !S.back);
    preview = null;
    paintMap();
  };
  const finishTyping = () => {
    if (!typing) return;
    typing = false;
    textEl.textContent = cur().t;
    showChoices();
  };
  let busy = false;
  const transition = fn => {
    busy = true;
    body.animate([{ opacity: 1, transform: "none" }, { opacity: 0, transform: "translateY(-6px)" }], { duration: 140, easing: "ease-in" })
      .onfinish = () => {
        fn(); busy = false;
        body.animate([{ opacity: 0, transform: "translateY(8px)" }, { opacity: 1, transform: "none" }], { duration: 220, easing: "ease-out" });
      };
  };
  const go = to => {
    if (busy) return;
    const from = path[path.length - 1];
    path.push(to); picks++;
    seenNodes.add(to); seenEdges.add(from + ">" + to);
    if (N[to].end) { const isNew = !found.has(to); found.add(to); if (isNew) api.flash(`새 결말 발견 · ${N[to].end}`, "ok"); }
    transition(renderScene);
  };
  const back = () => {
    if (!S.back || path.length < 2 || busy) return;
    path.pop();
    transition(renderScene);
  };
  const restart = () => { if (busy) return; path = ["start"]; transition(renderScene); };

  api.on(choicesEl, "click", e => {
    const b = e.target.closest(".branching-choice-choice");
    if (!b || !b.classList.contains("show")) return;
    api.hideHint();
    if (b.dataset.restart) restart(); else go(b.dataset.to);
  });
  api.on(choicesEl, "pointerover", e => {
    const b = e.target.closest("[data-to]");
    const k = b ? path[path.length - 1] + ">" + b.dataset.to : null;
    if (k !== preview) { preview = k; paintMap(); }
  });
  api.on(choicesEl, "pointerleave", () => { if (preview) { preview = null; paintMap(); } });
  api.on(body, "click", finishTyping);
  api.on(backBtn, "click", back);
  api.on(window, "keydown", e => {
    if (e.target.closest && e.target.closest("input, textarea, [contenteditable]")) return;
    if (e.target !== document.body && !el.contains(e.target)) return;
    const n = +e.key;
    if (n >= 1 && n <= 3) {
      if (typing) { finishTyping(); e.preventDefault(); return; }
      const b = choicesEl.children[n - 1];
      if (b && b.classList.contains("show")) { e.preventDefault(); api.hideHint(); b.dataset.restart ? restart() : go(b.dataset.to); }
    }
  });

  const applyModes = () => {
    mapWrap.classList.toggle("off", !S.map);
    root.classList.toggle("narrow", el.clientWidth < 820);
    backBtn.classList.toggle("hidden", !S.back);
  };
  api.onParam(k => {
    if (k === "typing" && !S.typing) finishTyping();
    applyModes();
  });
  api.onResize(applyModes);
  applyModes();
  renderScene();

  api.frame((dt, t) => {
    drawCat(t);
    if (typing) {
      const full = cur().t;
      typed += dt / S.speed;
      const n = Math.min(full.length, Math.floor(typed));
      const shown = textEl.dataset.n ? +textEl.dataset.n : -1;
      if (n !== shown) { textEl.dataset.n = n; textEl.innerHTML = ""; textEl.append(full.slice(0, n)); textEl.insertAdjacentHTML("beforeend", `<span class="caret"></span>`); }
      if (n >= full.length) { delete textEl.dataset.n; finishTyping(); }
    }
    const n = cur();
    api.read("depth", `${path.length - 1} / ${MAXD}`);
    api.read("picks", picks);
    api.read("ends", `${found.size} / ${ENDS.length}`);
    api.read("branch", n.end ? "결말" : `${n.c.length}갈래`);
    if (typing) api.status("글자가 나타나는 중 · 누르면 건너뛴다", "alt");
    else if (n.end) api.status(`결말에 닿았다 · ${n.end}`, "ok");
    else api.status(`선택을 기다리는 중 · ${n.c.length}갈래`, "active");
  });
}
