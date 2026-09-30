import { ILLO, TONE } from "../../lib/draw.js";
import { peepSVG, outfit } from "../../lib/figure.js";

export default function demo(api) {
  const { el, S } = api;

  api.css(`
    .ile-demo { position: absolute; inset: 0; display: grid; place-items: center; background: var(--board); padding: 20px; }
    .ile-card { width: min(440px, 100%); background: var(--note); border: 1px solid var(--ink-3); border-radius: 8px; padding: 28px 28px 34px; }
    .ile-top { display: flex; align-items: center; gap: 16px; padding-bottom: 22px; border-bottom: 1px solid var(--line); }
    /* 아바타: Open Peeps 상반신(bust)을 원으로 잘라 넣는다 (외곽선 없음). 이름 첫 글자는 작은 배지로 */
    .ile-ava { flex: none; position: relative; width: 56px; height: 56px; }
    .ile-ava .ile-bust { width: 100%; height: 100%; border-radius: 50%; overflow: hidden; background: ${TONE[1]}; }
    .ile-ava svg { display: block; width: 100%; height: 100%; }
    .ile-ava b { position: absolute; right: -4px; bottom: -2px; min-width: 20px; height: 20px; padding: 0 5px; box-sizing: border-box; border-radius: 10px;
      background: var(--ink); color: var(--on-ink); font-size: 11px; font-weight: 600; display: grid; place-items: center; line-height: 1; }
    .ile-top .ids { min-width: 0; flex: 1; display: flex; flex-direction: column; gap: 4px; }
    .ile-row { display: grid; grid-template-columns: 52px 1fr; gap: 12px; margin-top: 22px; align-items: start; }
    .ile-lab { font-size: 13px; color: var(--ink-3); padding-top: 3px; }
    .ile-field { position: relative; margin: 0 -6px; padding: 2px 6px; border-radius: 4px; outline: 1.5px solid transparent; outline-offset: 0; }
    .ile-text { display: block; min-height: 1.5em; white-space: pre-wrap; word-break: keep-all; overflow-wrap: anywhere; outline: none; }
    .ile-field.name .ile-text { font-size: 18px; font-weight: 600; color: var(--ink); line-height: 1.4; }
    .ile-field.role .ile-text { font-size: 13px; color: var(--ink-2); line-height: 1.5; }
    .ile-field.bio .ile-text, .ile-field.loc .ile-text { font-size: 15px; color: var(--ink); line-height: 1.65; }
    .ile-field.editing .ile-text { user-select: text; -webkit-user-select: text; cursor: text; }

    /* 올렸을 때 힌트 */
    .ile-demo[data-hover="dashed"] .ile-field:not(.editing), .ile-demo[data-hover="pencil"] .ile-field:not(.editing) { cursor: text; }
    .ile-demo[data-hover="dashed"] .ile-field:not(.editing):hover .ile-text { text-decoration: underline dashed var(--ink-3); text-decoration-thickness: 1px; text-underline-offset: 5px; }
    .ile-pen { position: absolute; right: -20px; top: 50%; width: 14px; height: 14px; margin-top: -7px; opacity: 0; transition: opacity .12s; pointer-events: none; }
    .ile-pen path { fill: none; stroke: var(--ink-2); stroke-width: 1.4; stroke-linejoin: round; }
    .ile-demo[data-hover="pencil"] .ile-field:not(.editing):hover .ile-pen { opacity: 1; }

    /* 편집 모드 모양 */
    .ile-demo.look .ile-field.editing { background: var(--panel); outline-color: var(--accent); }
    .ile-demo.look .ile-field.editing .ile-text { caret-color: var(--accent); }
    .ile-help, .ile-bar { position: absolute; left: 6px; top: calc(100% + 5px); z-index: 2; font-size: 13px; color: var(--ink-3); white-space: nowrap; display: none; }
    .ile-demo.look[data-save="blur"] .ile-field.editing .ile-help { display: block; }
    .ile-demo[data-save="explicit"] .ile-field.editing .ile-bar { display: flex; gap: 6px; }
    .ile-bar button { font: inherit; font-size: 13px; border: 1px solid var(--ink-3); background: var(--panel); color: var(--ink); border-radius: 4px; padding: 3px 10px; cursor: pointer; }
    .ile-bar button.save { border-color: var(--ink); background: var(--ink); color: var(--on-ink); }
    .ile-saved { position: absolute; right: 0; bottom: calc(100% + 2px); font-size: 13px; color: var(--ink-2); opacity: 0; pointer-events: none; }
  `);

  const FIELDS = [
    { f: "name", label: "이름", text: "김하늘", multi: false },
    { f: "role", label: "직함", text: "움직이는 것을 만드는 디자이너", multi: false },
    { f: "bio", label: "소개", text: "화면 속 작은 반응을 모은다. 누르고, 끌고, 기다리는 모든 순간이 재료다.", multi: true },
    { f: "loc", label: "위치", text: "서울 석관동", multi: false }
  ];
  const fieldHTML = F => `<div class="ile-field ${F.f}" data-f="${F.f}"><span class="ile-text"></span>
    <svg class="ile-pen" viewBox="0 0 16 16"><path d="M2.5 13.5h3l7.5-7.5-3-3-7.5 7.5z M8.5 4.5l3 3"/></svg>
    <span class="ile-help">Enter 저장 · Esc 취소${F.multi ? " · Shift+Enter 줄바꿈" : ""}</span>
    <span class="ile-bar"><button class="save" data-act="save">저장</button><button data-act="cancel">취소</button></span>
    <span class="ile-saved">저장됨</span></div>`;

  const root = document.createElement("div");
  root.className = "ile-demo";
  root.innerHTML = `<div class="ile-card">
    <div class="ile-top"><div class="ile-ava"></div><div class="ids">${fieldHTML(FIELDS[0])}${fieldHTML(FIELDS[1])}</div></div>
    <div class="ile-row"><div class="ile-lab">소개</div>${fieldHTML(FIELDS[2])}</div>
    <div class="ile-row"><div class="ile-lab">위치</div>${fieldHTML(FIELDS[3])}</div>
  </div>`;
  el.appendChild(root);
  const ava = root.querySelector(".ile-ava");
  // 상반신은 세로로 길어서 너비를 원에 맞추고 위쪽(머리·어깨)을 보여준다
  ava.innerHTML = `<div class="ile-bust">${
    peepSVG({ body: "Hoodie", face: "Smile", hair: "Bun", colors: outfit(ILLO.paper) }).replace("<svg ", '<svg preserveAspectRatio="xMidYMin slice" ')
  }</div><b></b>`;
  const avaInitial = ava.querySelector("b");
  FIELDS.forEach(F => {
    F.el = root.querySelector(`.ile-field[data-f="${F.f}"]`);
    F.node = F.el.querySelector(".ile-text");
    F.node.textContent = F.text;
  });
  const fieldOf = node => node && FIELDS.find(F => F.el === node);
  const updateAva = () => { avaInitial.textContent = (FIELDS[0].node.textContent.trim()[0] || "?"); };
  updateAva();

  const applyModes = () => {
    root.dataset.hover = S.hover;
    root.dataset.save = S.save;
    root.classList.toggle("look", S.look);
  };
  applyModes();
  api.onParam(applyModes);

  /* ---------- 편집 ---------- */
  let editing = null, before = "", saves = 0;

  function placeCaret(node, x, y) {
    const sel = getSelection();
    let r = null;
    if (document.caretPositionFromPoint) {
      const p = document.caretPositionFromPoint(x, y);
      if (p && node.contains(p.offsetNode)) { r = document.createRange(); r.setStart(p.offsetNode, p.offset); }
    } else if (document.caretRangeFromPoint) {
      const q = document.caretRangeFromPoint(x, y);
      if (q && node.contains(q.startContainer)) r = q;
    }
    if (!r) { r = document.createRange(); r.selectNodeContents(node); r.collapse(false); }
    r.collapse(true);
    sel.removeAllRanges(); sel.addRange(r);
  }

  function enter(F, e) {
    if (editing === F) return;
    if (editing) {
      if (S.save === "explicit") { nag(); return; }
      commit();
    }
    editing = F; before = F.node.textContent;
    try { F.node.contentEditable = "plaintext-only"; } catch (err) { /* 지원하지 않는 브라우저 */ }
    if (F.node.contentEditable !== "plaintext-only") F.node.contentEditable = "true";
    F.el.classList.add("editing");
    F.node.focus({ preventScroll: true });
    placeCaret(F.node, e.clientX, e.clientY);
    api.hideHint();
    api.read("chars", clean(F).length);
    api.flash(`편집 모드로 들어감 · ${F.label}`, "active", 1000);
  }
  function exit() {
    const F = editing;
    if (!F) return;
    editing = null;
    F.node.removeAttribute("contenteditable");
    F.el.classList.remove("editing");
    getSelection().removeAllRanges();
  }
  function clean(F) {
    let t = F.node.innerText.replace(/ /g, " ");
    t = F.multi ? t.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim() : t.replace(/\s+/g, " ").trim();
    return t;
  }
  function commit() {
    const F = editing;
    if (!F) return;
    const t = clean(F);
    exit();
    if (!t) { F.node.textContent = before; api.flash("비워 둘 수 없어 원래 글로 되돌렸다", "alt"); return; }
    F.node.textContent = t;
    if (t === before) { api.flash("바뀐 것 없음 · 보기 모드로", "idle", 1200); return; }
    saves++;
    if (F.f === "name") updateAva();
    const tag = F.el.querySelector(".ile-saved");
    tag.animate([{ opacity: 0, transform: "translateY(4px)" }, { opacity: 1, transform: "none", offset: .15 }, { opacity: 1, offset: .75 }, { opacity: 0 }], { duration: 1400, easing: "ease-out" });
    api.flash(`저장됨 · ${F.label}`, "ok");
  }
  function cancel() {
    const F = editing;
    if (!F) return;
    F.node.textContent = before;
    exit();
    api.flash("취소 · 고치기 전으로 되돌렸다", "alt");
  }
  function nag() {
    if (!editing) return;
    editing.el.querySelector(".ile-bar").animate(
      [{ transform: "translateX(0)" }, { transform: "translateX(-5px)" }, { transform: "translateX(5px)" }, { transform: "translateX(-3px)" }, { transform: "translateX(0)" }],
      { duration: 320 });
    api.flash("저장이나 취소를 눌러야 편집이 끝난다", "alt");
  }

  /* ---------- 입력 ---------- */
  api.on(root, "dblclick", e => {
    if (S.trigger !== "dbl") return;
    const F = fieldOf(e.target.closest(".ile-field"));
    if (F && !e.target.closest(".ile-bar")) enter(F, e);
  });
  api.on(root, "click", e => {
    if (e.target.closest(".ile-bar")) return;
    const F = fieldOf(e.target.closest(".ile-field"));
    if (!F || editing === F) return;
    if (S.trigger === "click") enter(F, e);
    else if (!editing && e.detail === 1) api.flash("한 번 클릭 · 두 번 눌러야 편집된다", "idle", 1000);
  });
  // 버튼 방식: 바깥을 눌러도 끝나지 않는다
  api.on(root, "pointerdown", e => {
    if (!editing) return;
    if (e.target.closest(".ile-bar")) { e.preventDefault(); return; }
    if (e.target.closest(".ile-field") === editing.el) return;
    if (S.save === "explicit") { e.preventDefault(); nag(); }
  });
  api.on(root, "focusout", e => {
    if (!editing || e.target !== editing.node) return;
    if (S.save === "blur") commit();
  });
  api.on(root, "click", e => {
    const b = e.target.closest(".ile-bar button");
    if (!b || !editing) return;
    if (b.dataset.act === "save") commit(); else cancel();
  });
  api.on(root, "keydown", e => {
    if (!editing) return;
    if (e.key === "Enter" && !e.isComposing) {
      if (editing.multi && e.shiftKey) return;
      e.preventDefault(); commit();
    } else if (e.key === "Escape") {
      e.preventDefault(); cancel();
    }
  });
  api.on(root, "input", () => { if (editing) api.read("chars", clean(editing).length); });
  api.on(root, "paste", e => {
    if (!editing) return;
    e.preventDefault();
    const t = (e.clipboardData || window.clipboardData).getData("text/plain");
    document.execCommand("insertText", false, editing.multi ? t : t.replace(/\s+/g, " "));
  });
  // 스테이지의 선택 막기를 편집 중인 칸에서만 풀어준다
  api.on(root, "selectstart", e => {
    const t = e.target.nodeType === 3 ? e.target.parentElement : e.target;
    if (t && t.closest && t.closest(".ile-field.editing")) e.stopPropagation();
  });
  api.cleanup(() => { editing = null; });

  /* ---------- 상태 ---------- */
  api.frame(() => {
    api.read("mode", editing ? "편집" : "보기");
    api.read("field", editing ? editing.label : "–");
    api.read("saves", saves);
    if (!editing) api.read("chars", "–");
    if (editing) api.status(`편집 중 · ${editing.label}${S.save === "explicit" ? " · 버튼으로 끝내기" : " · Enter 또는 바깥 클릭으로 저장"}`, "active");
    else api.status("보기 모드", "idle");
  });
}
