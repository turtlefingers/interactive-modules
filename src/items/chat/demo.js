export default function demo(api) {
  const { el, S } = api;

  /* ---------- 대본: 키워드 → 답 (여러 말풍선) ---------- */
  const IDEAS = ["차지 샷", "치트 코드", "캐러셀", "연타", "키보드 악기", "점프 · 앉기"];
  const SCRIPT = [
    { k: ["안녕", "하이", "반가", "hello", "hi"], name: "인사", r: () => ["안녕. 나는 이 사전을 안내하는 모듈봇이다.", "인터랙션에 대해 무엇이든 물어본다."], chips: ["추천해줘", "넌 누구야?", "농담해줘"] },
    { k: ["누구", "이름", "정체"], name: "자기소개", r: () => ["나는 정해진 대본으로만 답하는 작은 봇이다.", "진짜로 생각하지는 않지만, 점 세 개가 깜박이면 생각하는 것처럼 보인다."], chips: ["점 세 개는 뭐야?", "추천해줘"] },
    { k: ["추천", "뭐 만들", "만들까", "아이디어"], name: "추천", r: () => { const a = IDEAS[Math.floor(Math.random() * IDEAS.length)]; return [`오늘은 '${a}'을(를) 만들어 보면 좋겠다.`, "사전에서 찾아 변주를 이것저것 바꿔 본다."]; }, chips: ["다른 거", "고마워"] },
    { k: ["다른"], name: "다시 추천", r: () => { const a = IDEAS[Math.floor(Math.random() * IDEAS.length)]; return [`그럼 '${a}'은(는) 어떤가.`]; }, chips: ["다른 거", "고마워"] },
    { k: ["점", "입력 중", "타이핑", "...", "…"], name: "입력 중 표시", r: () => ["내가 답하기 전에 깜박이는 점 세 개가 '입력 중 표시'다.", "상대가 쓰고 있다는 것을 알려서, 기다리는 시간을 고장으로 여기지 않게 한다."], chips: ["왜 한 번에 안 보내?", "농담해줘"] },
    { k: ["왜", "한 번에", "나눠"], name: "순차 등장", r: () => ["사람도 말을 한 번에 몰아서 하지 않는다.", "짧게 나눠 차례로 보내면 사람이 말하는 속도처럼 보인다.", "지금처럼."], chips: ["신기하다", "고마워"] },
    { k: ["농담", "웃긴", "재밌"], name: "농담", r: () => ["개발자가 가장 무서워하는 말은?", "'내 컴퓨터에서는 되는데요.'"], chips: ["하나 더", "고마워"] },
    { k: ["하나 더", "또"], name: "농담 더", r: () => ["버튼이 왜 우울했을까.", "다들 누르기만 하고 떠나서다."], chips: ["추천해줘", "고마워"] },
    { k: ["고마", "감사", "땡큐", "thank"], name: "감사", r: () => ["천만에. 또 불러준다."], chips: ["안녕", "추천해줘"] },
    { k: ["신기", "대박", "와우", "멋지"], name: "감탄", r: () => ["그렇다. 답 전에 잠깐 기다리게 하면 사람과 대화하는 것처럼 느껴진다."], chips: ["고마워"] },
    { k: ["날씨"], name: "날씨", r: () => ["창밖은 볼 수 없지만, 인터랙션 만들기 좋은 날씨다."], chips: ["추천해줘"] },
    { k: ["도움", "help", "뭐 할", "사용법"], name: "도움말", r: () => ["이렇게 말을 걸어 본다.", "'안녕', '추천해줘', '점 세 개는 뭐야?', '농담해줘'"], chips: ["안녕", "추천해줘"] }
  ];
  const FALLBACK = [["음, 그건 아직 모른다.", "'도움'이라고 써 보면 할 수 있는 말을 알려준다."], ["잘 알아듣지 못했다. 다르게 말해 본다."]];
  const START_CHIPS = ["안녕", "추천해줘", "점 세 개는 뭐야?", "농담해줘"];

  api.css(`
    .chat-demo { position: absolute; inset: 0; display: grid; place-items: center; padding: 60px 16px 24px; background: var(--board); }
    .chat-win { width: 440px; max-width: 100%; height: 100%; max-height: 680px; display: flex; flex-direction: column;
      background: var(--note); border: 1px solid rgba(0,0,0,.12); border-radius: 14px; overflow: hidden; }
    .chat-head { display: flex; align-items: center; gap: 10px; padding: 12px 16px; border-bottom: 1px solid rgba(0,0,0,.08); }
    .chat-ava { width: 32px; height: 32px; border-radius: 50%; border: 1.5px solid var(--ink); display: grid; place-items: center; font-size: 13px; font-weight: 700; }
    .chat-head b { display: block; font-size: 15px; }
    .chat-head small { display: block; font-size: 13px; color: var(--ink-3); height: 17px; }
    .chat-head small.typing { color: var(--accent); }
    .chat-list { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 6px; touch-action: pan-y; overscroll-behavior: contain; }
    .chat-msg { max-width: 78%; padding: 9px 13px; border-radius: 16px; font-size: 15px; line-height: 1.45; word-break: keep-all; overflow-wrap: anywhere; }
    .chat-msg.bot { align-self: flex-start; background: var(--board); border-bottom-left-radius: 5px; }
    .chat-msg.me { align-self: flex-end; background: var(--ink); color: var(--board); border-bottom-right-radius: 5px; }
    .chat-msg.me + .chat-msg.bot, .chat-msg.bot + .chat-msg.me { margin-top: 10px; }
    .chat-list.anim-pop .chat-msg.new { animation: chat-pop .32s cubic-bezier(.3,1.5,.5,1); }
    .chat-list.anim-pop .chat-msg.bot.new { transform-origin: 0 100%; } .chat-list.anim-pop .chat-msg.me.new { transform-origin: 100% 100%; }
    .chat-list.anim-slide .chat-msg.new { animation: chat-slide .35s ease-out; }
    @keyframes chat-pop { from { transform: scale(.4); opacity: 0; } }
    @keyframes chat-slide { from { transform: translateY(14px); opacity: 0; } }
    .chat-dots { display: inline-flex; gap: 4px; padding: 3px 0; }
    .chat-dots i { width: 7px; height: 7px; border-radius: 50%; background: var(--ink-3); animation: chat-blink 1.1s infinite; }
    .chat-dots i:nth-child(2) { animation-delay: .15s; } .chat-dots i:nth-child(3) { animation-delay: .3s; }
    @keyframes chat-blink { 0%, 60%, 100% { transform: translateY(0); opacity: .4; } 30% { transform: translateY(-4px); opacity: 1; } }
    .chat-chips { display: flex; gap: 6px; padding: 0 12px 10px; overflow-x: auto; min-height: 0; }
    .chat-chips.hide { display: none; }
    .chat-chip { flex: none; font: inherit; font-size: 13px; padding: 6px 12px; border-radius: var(--r-pill); border: 1px solid var(--ink); background: transparent; color: var(--ink); cursor: pointer; }
    .chat-chip:hover { background: var(--ink); color: var(--board); }
    .chat-form { display: flex; gap: 8px; padding: 10px 12px; border-top: 1px solid rgba(0,0,0,.08); }
    .chat-input { flex: 1; min-width: 0; font: inherit; font-size: 15px; padding: 10px 14px; border-radius: var(--r-pill); border: 1px solid rgba(0,0,0,.18);
      background: var(--board); color: var(--ink); outline: none; user-select: text; -webkit-user-select: text; }
    .chat-input:focus { border-color: var(--ink); }
    .chat-send { font: inherit; font-size: 13px; font-weight: 600; padding: 0 16px; border-radius: var(--r-pill); border: 0; background: var(--accent); color: #fff; cursor: pointer; }
    .chat-send:disabled { background: var(--toggle-off); cursor: default; }
  `);

  const root = document.createElement("div");
  root.className = "chat-demo";
  root.innerHTML = `
    <div class="chat-win">
      <div class="chat-head"><div class="chat-ava">봇</div><div><b>모듈봇</b><small></small></div></div>
      <div class="chat-list"></div>
      <div class="chat-chips"></div>
      <form class="chat-form"><input class="chat-input" placeholder="메시지를 입력한다" autocomplete="off" maxlength="200"><button class="chat-send" type="submit" disabled>보내기</button></form>
    </div>`;
  el.appendChild(root);
  const list = root.querySelector(".chat-list"), chipsEl = root.querySelector(".chat-chips"), form = root.querySelector(".chat-form"),
    input = root.querySelector(".chat-input"), send = root.querySelector(".chat-send"), headSub = root.querySelector(".chat-head small");

  /* ---------- 상태 ---------- */
  let msgCount = 0, matched = "–", lastWait = 0, busy = false, queue = [], typingEl = null, typingOn = false, gen = 0;

  const applyAnim = () => { list.classList.toggle("anim-pop", S.anim === "pop"); list.classList.toggle("anim-slide", S.anim === "slide"); };
  applyAnim();
  const scrollDown = () => { list.scrollTo({ top: list.scrollHeight, behavior: S.anim === "none" ? "auto" : "smooth" }); };

  const addMsg = (who, text) => {
    const m = document.createElement("div");
    m.className = `chat-msg ${who} new`;
    m.textContent = text;
    list.appendChild(m);
    api.timeout(() => m.classList.remove("new"), 400);
    msgCount++;
    scrollDown();
  };
  const setChips = arr => {
    chipsEl.innerHTML = arr.map(t => `<button type="button" class="chat-chip">${t}</button>`).join("");
    chipsEl.querySelectorAll(".chat-chip").forEach(b => {
      api.on(b, "pointerdown", e => e.preventDefault());
      api.on(b, "click", () => userSend(b.textContent));
    });
    chipsEl.classList.toggle("hide", !S.chips || !arr.length);
  };
  const showTyping = on => {
    typingOn = on;
    if (on && !S.indicator && typingEl) { typingEl.remove(); typingEl = null; }
    if (on && S.indicator && !typingEl) {
      typingEl = document.createElement("div");
      typingEl.className = "chat-msg bot new";
      typingEl.innerHTML = `<span class="chat-dots"><i></i><i></i><i></i></span>`;
      list.appendChild(typingEl); scrollDown();
    }
    if (!on && typingEl) { typingEl.remove(); typingEl = null; }
    headSub.textContent = on && S.indicator ? "입력 중…" : "";
    headSub.classList.toggle("typing", on && S.indicator);
  };

  // 봇 답을 한 말풍선씩 차례로: 읽기 → 입력 중 표시 → 등장
  const runQueue = (myGen, chips) => {
    if (myGen !== gen) return;
    if (!queue.length) { busy = false; showTyping(false); setChips(chips); return; }
    const text = queue.shift();
    const wait = S.delay * (0.45 + text.length / 38) * 1000;
    lastWait = wait / 1000;
    showTyping(true);
    api.timeout(() => {
      if (myGen !== gen) return;
      showTyping(false);
      addMsg("bot", text);
      api.timeout(() => runQueue(myGen, chips), 220);
    }, wait);
  };
  const reply = text => {
    const t = text.toLowerCase();
    const hit = SCRIPT.find(s => s.k.some(k => t.includes(k)));
    matched = hit ? `${hit.name} ('${hit.k.find(k => t.includes(k))}')` : "없음 · 기본 답";
    const lines = hit ? hit.r() : FALLBACK[Math.floor(Math.random() * FALLBACK.length)];
    queue = lines.slice(); busy = true; gen++;
    const myGen = gen;
    chipsEl.classList.add("hide");
    api.timeout(() => runQueue(myGen, hit ? hit.chips : START_CHIPS), 350);   // 읽는 시간
  };
  const userSend = raw => {
    const text = raw.trim();
    if (!text) return;
    api.hideHint();
    addMsg("me", text);
    input.value = ""; send.disabled = true;
    showTyping(false);
    reply(text);
  };

  api.on(form, "submit", e => { e.preventDefault(); userSend(input.value); });
  api.on(input, "keydown", e => {
    if (e.key === "Enter" && (e.isComposing || e.keyCode === 229)) { e.preventDefault(); return; }   // 한글 조합 중 Enter는 무시
  });
  api.on(input, "input", () => { send.disabled = !input.value.trim(); });
  api.on(input, "selectstart", e => e.stopPropagation());
  api.on(send, "pointerdown", e => e.preventDefault());

  // 화면 어디서든 글자를 치면 입력칸으로 보낸다 (사이드바 입력칸은 제외)
  api.on(window, "keydown", e => {
    if (e.target === input) return;
    if (e.target && e.target.closest && e.target.closest("input, textarea, select, [contenteditable]")) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key.length === 1 || e.key === "Process") input.focus({ preventScroll: true });
  });

  api.onParam(k => {
    if (k === "anim") applyAnim();
    if (k === "chips") chipsEl.classList.toggle("hide", !S.chips || busy || !chipsEl.children.length);
    if (k === "indicator") showTyping(typingOn);
  });

  // 첫 인사
  busy = true; queue = ["안녕. 나는 모듈봇이다.", "아래 버튼을 누르거나 직접 써서 말을 건다."];
  gen++; const g0 = gen;
  api.timeout(() => runQueue(g0, START_CHIPS), 500);
  api.timeout(() => input.focus({ preventScroll: true }), 60);

  api.frame(() => {
    api.read("msgs", msgCount);
    api.read("typed", `${input.value.length}자`);
    api.read("matched", matched);
    api.read("wait", lastWait ? `${lastWait.toFixed(1)}초` : "–");
    if (typingOn && S.indicator) api.status("봇이 입력 중 · 점 세 개 표시", "alt");
    else if (typingOn) api.status("봇이 답을 준비 중 · 하지만 화면에는 아무 표시가 없다", "alt");
    else if (busy) api.status("봇이 읽는 중", "alt");
    else if (input.value) api.status(`사용자가 쓰는 중 · ${input.value.length}자`, "active");
    else api.status("대기 · 문장을 보내면 → 봇이 답한다", "idle");
  });
}
