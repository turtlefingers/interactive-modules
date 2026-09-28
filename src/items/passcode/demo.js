export default function demo(api) {
  const { el, S } = api;
  const CODES = { 4: "2580", 6: "147258" };

  api.css(`
    .passcode-demo { position: absolute; inset: 0; display: grid; place-items: center; padding: 56px 16px 70px; background: var(--board); }
    .passcode-panel { width: 300px; max-width: 100%; display: flex; flex-direction: column; align-items: center; gap: 18px; color: var(--ink); }
    .passcode-lock { width: 40px; height: 48px; overflow: visible; }
    .passcode-lock .shackle { transition: transform .45s cubic-bezier(.3,1.5,.5,1); transform-origin: 28px 20px; }
    .passcode-demo.open .passcode-lock .shackle { transform: translateY(-7px) rotate(28deg); }
    .passcode-title { font-size: 15px; font-weight: 600; height: 20px; }
    .passcode-dots { display: flex; gap: 16px; height: 22px; align-items: center; }
    .passcode-dots.shake { animation: passcode-shake .45s; }
    @keyframes passcode-shake { 15% { transform: translateX(-12px); } 35% { transform: translateX(10px); } 55% { transform: translateX(-7px); } 75% { transform: translateX(4px); } }
    .passcode-dot { width: 14px; height: 14px; border-radius: 50%; border: 1.5px solid var(--ink); display: grid; place-items: center;
      font-size: 13px; font-weight: 700; transition: background .12s, border-color .2s, width .12s, height .12s; }
    .passcode-dot.fill { background: var(--ink); }
    .passcode-dot.peek { width: 22px; height: 22px; background: transparent; }
    .passcode-dots.bad .passcode-dot { border-color: var(--accent); }
    .passcode-dots.bad .passcode-dot.fill { background: var(--accent); }
    .passcode-dots.good .passcode-dot { background: var(--ink); }
    .passcode-pad { display: grid; grid-template-columns: repeat(3, 68px); gap: 12px 20px; }
    .passcode-key { width: 68px; height: 68px; border-radius: 50%; border: 1.5px solid rgba(0,0,0,.18); background: transparent; color: var(--ink);
      font: inherit; font-size: 24px; font-weight: 500; cursor: pointer; touch-action: manipulation; transition: background .08s, color .08s, border-color .08s; }
    .passcode-key.fn { border-color: transparent; font-size: 13px; color: var(--ink-2); }
    .passcode-key.on { background: var(--ink); border-color: var(--ink); color: var(--board); }
    .passcode-pad.disabled .passcode-key { opacity: .3; pointer-events: none; }
    .passcode-hint { font-size: 13px; color: var(--ink-2); height: 18px; }
    .passcode-hint b { color: var(--ink); letter-spacing: .15em; font-weight: 600; }
    .passcode-lockout { font-size: 13px; color: var(--accent); font-weight: 600; height: 18px; }
    .passcode-home { display: none; flex-direction: column; align-items: center; gap: 20px; }
    .passcode-demo.open .passcode-home { display: flex; animation: passcode-in .4s ease-out; }
    .passcode-demo.open .passcode-lockgroup { display: none; }
    @keyframes passcode-in { from { opacity: 0; transform: translateY(16px); } }
    .passcode-apps { display: grid; grid-template-columns: repeat(4, 44px); gap: 16px; }
    .passcode-apps i { width: 44px; height: 44px; border-radius: 11px; border: 1.5px solid var(--ink); }
    .passcode-apps i:nth-child(3n+1) { border-radius: 50%; }
    .passcode-relock { font: inherit; font-size: 13px; font-weight: 600; padding: 8px 16px; border-radius: var(--r-pill); border: 1.5px solid var(--ink);
      background: transparent; color: var(--ink); cursor: pointer; }
    .passcode-lockgroup { display: flex; flex-direction: column; align-items: center; gap: 18px; }
    @media (max-height: 640px) { .passcode-pad { grid-template-columns: repeat(3, 56px); gap: 8px 16px; } .passcode-key { width: 56px; height: 56px; font-size: 20px; } .passcode-panel { gap: 12px; } }
  `);

  const root = document.createElement("div");
  root.className = "passcode-demo";
  root.innerHTML = `
    <div class="passcode-panel">
      <svg class="passcode-lock" viewBox="0 0 40 48" fill="none" stroke="currentColor" stroke-width="2">
        <path class="shackle" d="M11 22 V14 a9 9 0 0 1 18 0 V22"/>
        <rect x="5" y="22" width="30" height="22" rx="3"/>
        <path d="M20 30 v6"/>
      </svg>
      <div class="passcode-lockgroup">
        <div class="passcode-title">암호 입력</div>
        <div class="passcode-dots"></div>
        <div class="passcode-lockout"></div>
        <div class="passcode-pad">
          ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `<button class="passcode-key" data-k="${n}">${n}</button>`).join("")}
          <button class="passcode-key fn" data-k="clear">취소</button>
          <button class="passcode-key" data-k="0">0</button>
          <button class="passcode-key fn" data-k="back">지우기</button>
        </div>
        <div class="passcode-hint"></div>
      </div>
      <div class="passcode-home">
        <div class="passcode-title">열렸다</div>
        <div class="passcode-apps">${"<i></i>".repeat(8)}</div>
        <button class="passcode-relock">다시 잠그기 · Enter</button>
      </div>
    </div>`;
  el.appendChild(root);
  const dotsEl = root.querySelector(".passcode-dots"), padEl = root.querySelector(".passcode-pad"), hintEl = root.querySelector(".passcode-hint"),
    lockoutEl = root.querySelector(".passcode-lockout"), titleEl = root.querySelector(".passcode-lockgroup .passcode-title");
  const keyBtns = {};
  padEl.querySelectorAll("[data-k]").forEach(b => { keyBtns[b.dataset.k] = b; });

  /* ---------- 상태 ---------- */
  let entry = "", busy = false, open = false, wrong = 0, lockUntil = 0, peekUntil = 0, lastKey = "–", totalWrong = 0;
  const code = () => CODES[S.length];

  const renderDots = () => {
    const n = +S.length;
    if (dotsEl.children.length !== n) dotsEl.innerHTML = `<i class="passcode-dot"></i>`.repeat(n);
    const peek = S.peek && performance.now() < peekUntil;
    [...dotsEl.children].forEach((d, i) => {
      const isPeek = peek && i === entry.length - 1;
      d.classList.toggle("fill", i < entry.length && !isPeek);
      d.classList.toggle("peek", isPeek);
      d.textContent = isPeek ? entry[i] : "";
    });
  };
  const renderHint = () => { hintEl.innerHTML = S.hint ? `힌트 · 정답은 <b>${code()}</b>` : ""; };

  const lit = k => { const b = keyBtns[k]; if (!b) return; b.classList.add("on"); api.timeout(() => b.classList.remove("on"), 110); };

  const reject = () => {
    busy = true; wrong++; totalWrong++;
    const fb = S.feedback;
    if (fb !== "none") dotsEl.classList.add("bad");
    if (fb === "shake") { dotsEl.classList.remove("shake"); void dotsEl.offsetWidth; dotsEl.classList.add("shake"); if (navigator.vibrate) try { navigator.vibrate(120); } catch (e) { /* 무시 */ } }
    titleEl.textContent = fb === "none" ? "암호 입력" : "틀렸다";
    api.flash(fb === "none" ? "틀렸지만 아무 반응이 없다 · 사용자는 알 수 없다" : "틀렸다 · 다시 입력한다", "alt", 1100);
    api.timeout(() => {
      entry = ""; busy = false;
      dotsEl.classList.remove("bad", "shake");
      titleEl.textContent = "암호 입력";
      if (S.attempts && wrong >= 3) { lockUntil = performance.now() + S.cooldown * 1000; wrong = 0; }
      renderDots();
    }, fb === "none" ? 250 : 650);
  };
  const accept = () => {
    busy = true;
    dotsEl.classList.add("good");
    api.timeout(() => {
      open = true; busy = false; wrong = 0;
      root.classList.add("open");
      dotsEl.classList.remove("good");
      entry = ""; renderDots();
      api.flash("맞았다 · 잠금 해제", "ok", 1400);
    }, 260);
  };
  const relock = () => { open = false; root.classList.remove("open"); entry = ""; renderDots(); };

  const input = k => {
    api.hideHint();
    if (open) { if (k === "enter" || k === "clear") relock(); return; }
    if (busy || performance.now() < lockUntil) return;
    lit(k); lastKey = k === "back" ? "지우기" : k === "clear" ? "취소" : k;
    if (k === "back") entry = entry.slice(0, -1);
    else if (k === "clear") entry = "";
    else if (/^\d$/.test(k) && entry.length < +S.length) {
      entry += k; peekUntil = performance.now() + 700;
      if (entry.length === +S.length) { renderDots(); api.timeout(() => (entry === code() ? accept() : reject()), 180); return; }
    }
    renderDots();
  };

  // 버튼이 포커스를 가져가지 않게 한다 (키보드 입력과 섞이지 않도록)
  root.querySelectorAll("button").forEach(b => api.on(b, "pointerdown", e => e.preventDefault()));
  padEl.querySelectorAll("[data-k]").forEach(b => api.on(b, "click", () => input(b.dataset.k)));
  api.on(root.querySelector(".passcode-relock"), "click", relock);

  // 사이드바의 글자 입력칸, 슬라이더에 포커스가 있으면 반응하지 않는다 (체크박스는 예외: Space가 토글을 다시 뒤집지 않도록)
  const fromField = e => { const f = e.target && e.target.closest && e.target.closest("input, textarea, select, [contenteditable]"); return !!f && !(f.type === "checkbox" || f.type === "radio"); };
  api.on(window, "keydown", e => {
    if (fromField(e) || e.metaKey || e.ctrlKey || e.altKey) return;
    let k = null;
    const m = /^(?:Digit|Numpad)(\d)$/.exec(e.code);
    if (m) k = m[1];
    else if (e.key === "Backspace") k = "back";
    else if (e.key === "Escape") k = "clear";
    else if (e.key === "Enter") k = "enter";
    if (!k) return;
    e.preventDefault();
    input(k);
  });

  api.onParam(k => {
    if (k === "length") { entry = ""; renderDots(); renderHint(); }
    if (k === "hint") renderHint();
    if (k === "attempts" && !S.attempts) { lockUntil = 0; wrong = 0; }
  });
  renderDots(); renderHint();

  let wasPeek = false;
  api.frame(() => {
    const now = performance.now();
    const locked = now < lockUntil;
    padEl.classList.toggle("disabled", locked);
    lockoutEl.textContent = locked ? `너무 많이 틀렸다 · ${Math.ceil((lockUntil - now) / 1000)}초 뒤 다시 시도` : S.attempts && wrong ? `남은 기회 ${3 - wrong}번` : "";
    const peek = S.peek && now < peekUntil;
    if (peek !== wasPeek) { renderDots(); wasPeek = peek; }

    api.read("entered", `${entry.length} / ${S.length}`);
    api.read("last", lastKey);
    api.read("wrong", S.attempts ? `${wrong} / 3 (누적 ${totalWrong})` : `${totalWrong}번`);
    api.read("lock", locked ? `${((lockUntil - now) / 1000).toFixed(1)}초` : open ? "열림" : "잠김");

    if (open) api.status("잠금 해제됨", "ok");
    else if (locked) api.status(`입력 막힘 · ${Math.ceil((lockUntil - now) / 1000)}초 남음`, "alt");
    else if (busy) api.status("확인 중", "active");
    else if (entry.length) api.status(`입력 중 · ${entry.length} / ${S.length}`, "active");
    else api.status("대기", "idle");
  });
}
