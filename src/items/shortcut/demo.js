import { clamp, localPoint } from "../../lib/util.js";

export default function demo(api) {
  const { el, S } = api;

  api.css(`
    .shortcut-demo { position: absolute; inset: 0; background: var(--board);
      background-image: linear-gradient(var(--grid) 1px, transparent 1px), linear-gradient(90deg, var(--grid) 1px, transparent 1px); background-size: 20px 20px; }
    .shortcut-obj { position: absolute; background: var(--note); border: 1.5px solid var(--ink); cursor: pointer; touch-action: none; }
    .shortcut-obj.circle { border-radius: 50%; }
    .shortcut-obj.rect { border-radius: 4px; }
    .shortcut-obj.sel { outline: 2px solid var(--accent); outline-offset: 3px; }
    .shortcut-obj.born { animation: shortcut-born .3s ease-out; }
    @keyframes shortcut-born { from { opacity: 0; } }
    .shortcut-group { position: absolute; border: 1px dashed var(--ink-2); pointer-events: none; }
    .shortcut-group span { position: absolute; left: -1px; top: -20px; font-size: 13px; color: var(--ink-2); }
    .shortcut-sheet { position: absolute; right: 16px; top: 64px; z-index: 40; width: 270px; max-height: calc(100% - 150px); overflow: auto;
      background: var(--chip-bg); border-radius: var(--r-box); box-shadow: var(--chip-shadow); padding: 8px; font-size: 13px;
      transition: opacity .2s, transform .2s; }
    .shortcut-sheet.hide { opacity: 0; transform: translateY(-6px); pointer-events: none; }
    .shortcut-sheet h4 { margin: 4px 8px 6px; font-size: 13px; font-weight: 600; color: var(--ink-2); }
    .shortcut-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 6px 8px; border-radius: 6px; cursor: pointer; color: var(--ink); }
    .shortcut-row:hover { background: rgba(0,0,0,.04); }
    .shortcut-row.fire { background: var(--accent); color: #fff; }
    .shortcut-row.fire kbd { border-color: rgba(255,255,255,.7); color: #fff; }
    .shortcut-row.off { color: var(--ink-3); }
    .shortcut-sheet p { margin: 8px 8px 4px; color: var(--ink-3); line-height: 1.5; }
    .shortcut-demo kbd, .shortcut-sheet kbd { display: inline-grid; place-items: center; min-width: 22px; height: 22px; padding: 0 5px; margin-left: 3px;
      border: 1px solid rgba(0,0,0,.25); border-radius: 5px; font: inherit; font-size: 13px; font-weight: 600; }
    .shortcut-chord { position: absolute; left: 50%; bottom: 20px; transform: translateX(-50%); z-index: 40; display: flex; align-items: center; gap: 8px;
      min-height: 52px; padding: 8px 14px; background: var(--chip-bg); border-radius: var(--r-box); box-shadow: var(--chip-shadow); font-size: 15px; white-space: nowrap;
      transition: opacity .2s; }
    .shortcut-chord.hide { opacity: 0; pointer-events: none; }
    .shortcut-chord .k { min-width: 36px; height: 36px; padding: 0 10px; display: grid; place-items: center; border-radius: 7px; border: 1.5px solid var(--ink);
      font-size: 15px; font-weight: 600; }
    .shortcut-chord .k.mod { background: var(--ink); color: var(--board); }
    .shortcut-chord .k.hit { background: var(--accent); border-color: var(--accent); color: #fff; }
    .shortcut-chord .plus { color: var(--ink-3); }
    .shortcut-chord .cmd { color: var(--accent); font-weight: 600; margin-left: 6px; }
    .shortcut-chord .empty { color: var(--ink-3); font-size: 13px; }
    .shortcut-chord.fade .k, .shortcut-chord.fade .plus { opacity: .45; }
    .shortcut-help { position: absolute; right: 16px; bottom: 16px; z-index: 40; width: 40px; height: 40px; border-radius: 50%; border: 0;
      background: var(--chip-bg); box-shadow: var(--chip-shadow); font: inherit; font-size: 15px; font-weight: 700; color: var(--ink); cursor: pointer; }
    @media (max-width: 700px) {
      .shortcut-sheet { left: 16px; right: 16px; width: auto; top: auto; bottom: 64px; max-height: 44%; }
      .shortcut-chord { display: none; }
    }
  `);

  const root = document.createElement("div");
  root.className = "shortcut-demo";
  el.appendChild(root);
  const layer = document.createElement("div");
  root.appendChild(layer);

  /* ---------- 문서 모델 ---------- */
  let uid = 1, gid = 1;
  let items = [];
  let sel = new Set();
  const undo = [], redo = [];
  const W0 = el.clientWidth || 900, H0 = el.clientHeight || 700;
  const ox = Math.max(40, W0 * 0.12), oy = Math.max(90, H0 * 0.22);
  [[0, 0, 120, 90, "rect"], [170, 30, 90, 90, "circle"], [60, 150, 160, 70, "rect"], [270, 170, 70, 70, "circle"], [300, 0, 80, 120, "rect"]]
    .forEach(([x, y, w, h, shape]) => items.push({ id: uid++, x: ox + x, y: oy + y, w, h, shape, group: 0 }));

  const snapshot = () => JSON.stringify({ items, sel: [...sel] });
  const restore = str => { const o = JSON.parse(str); items = o.items; sel = new Set(o.sel); };
  const commit = () => { undo.push(snapshot()); if (undo.length > 60) undo.shift(); redo.length = 0; };
  const byId = id => items.find(i => i.id === id);
  const expandGroups = ids => {
    const out = new Set(ids);
    items.forEach(i => { if (i.group && [...ids].some(id => byId(id) && byId(id).group === i.group)) out.add(i.id); });
    return out;
  };

  /* ---------- 명령 ---------- */
  const isMac = () => (S.platform === "mac" ? true : S.platform === "win" ? false : /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent));
  const L = () => (isMac()
    ? { mod: "⌘", shift: "⇧", alt: "⌥", ctrl: "⌃", del: "⌫", esc: "esc" }
    : { mod: "Ctrl", shift: "Shift", alt: "Alt", ctrl: "Ctrl", del: "Delete", esc: "Esc" });

  const CMDS = [
    { id: "all", name: "모두 선택", keys: l => [l.mod, "A"], can: () => items.length > 0,
      run: () => { sel = new Set(items.map(i => i.id)); } },
    { id: "dup", name: "복제", keys: l => [l.mod, "D"], can: () => sel.size > 0,
      run: () => {
        commit();
        const map = new Map(), next = new Set();
        items.filter(i => sel.has(i.id)).forEach(i => {
          let g = 0;
          if (i.group) { if (!map.has(i.group)) map.set(i.group, gid++); g = map.get(i.group); }
          const c = { ...i, id: uid++, x: i.x + 24, y: i.y + 24, group: g, born: true };
          items.push(c); next.add(c.id);
        });
        sel = next;
      } },
    { id: "del", name: "삭제", keys: l => [l.del], can: () => sel.size > 0,
      run: () => { commit(); items = items.filter(i => !sel.has(i.id)); sel.clear(); } },
    { id: "group", name: "그룹 묶기", keys: l => [l.mod, "G"], can: () => sel.size > 1,
      run: () => { commit(); const g = gid++; items.forEach(i => { if (sel.has(i.id)) i.group = g; }); } },
    { id: "ungroup", name: "그룹 풀기", keys: l => [l.mod, l.shift, "G"], can: () => items.some(i => sel.has(i.id) && i.group),
      run: () => { commit(); items.forEach(i => { if (sel.has(i.id)) i.group = 0; }); } },
    { id: "undo", name: "되돌리기", keys: l => [l.mod, "Z"], can: () => undo.length > 0,
      run: () => { redo.push(snapshot()); restore(undo.pop()); } },
    { id: "redo", name: "다시 하기", keys: l => [l.mod, l.shift, "Z"], can: () => redo.length > 0,
      run: () => { undo.push(snapshot()); restore(redo.pop()); } },
    { id: "nudge", name: "조금 옮기기", keys: () => ["←↑↓→"], can: () => sel.size > 0, run: () => {} },
    { id: "nudge10", name: "크게 옮기기", keys: l => [l.shift, "←↑↓→"], can: () => sel.size > 0, run: () => {} },
    { id: "none", name: "선택 해제", keys: l => [l.esc], can: () => sel.size > 0, run: () => { sel.clear(); } },
    { id: "help", name: "이 목록 열고 닫기", keys: () => ["?"], can: () => true, run: () => { sheetOpen = !sheetOpen; } }
  ];
  const cmd = id => CMDS.find(c => c.id === id);

  let lastCmd = "–", lastChord = [], chordAt = 0, firedName = "";
  const exec = (id, chord) => {
    const c = cmd(id);
    if (!c) return false;
    firedName = c.name; chordAt = performance.now();
    if (chord) lastChord = chord;
    if (!c.can()) { lastCmd = `${c.name} (대상 없음)`; api.flash(`${c.name} · 선택한 것이 없어 아무 일도 없다`, "alt", 1100); render(); return true; }
    c.run();
    lastCmd = c.name;
    api.flash(`${c.name} 실행`, "ok", 900);
    const row = sheet.querySelector(`[data-c="${id}"]`);
    if (row) { row.classList.remove("fire"); void row.offsetWidth; row.classList.add("fire"); api.timeout(() => row.classList.remove("fire"), 380); }
    render();
    return true;
  };
  const nudge = (dx, dy, big) => {
    if (!sel.size) { exec(big ? "nudge10" : "nudge"); return; }
    const k = big ? 20 : 2;
    const now = performance.now();
    if (now - (nudge.t || 0) > 600) commit();       // 연속으로 누른 이동은 한 번의 되돌리기로
    nudge.t = now;
    items.forEach(i => { if (sel.has(i.id)) { i.x += dx * k; i.y += dy * k; } });
    exec(big ? "nudge10" : "nudge");
  };

  /* ---------- 화면: 치트시트, 코드 표시 ---------- */
  const sheet = document.createElement("div");
  sheet.className = "shortcut-sheet";
  el.appendChild(sheet);
  let sheetOpen = S.sheet;
  const helpBtn = document.createElement("button");
  helpBtn.className = "shortcut-help"; helpBtn.textContent = "?"; helpBtn.title = "단축키 목록";
  el.appendChild(helpBtn);
  api.on(helpBtn, "pointerdown", e => e.preventDefault());
  api.on(helpBtn, "click", () => { sheetOpen = !sheetOpen; render(); });

  const buildSheet = () => {
    const l = L();
    sheet.innerHTML = `<h4>단축키 · 누르거나 클릭해서 실행</h4>` +
      CMDS.map(c => `<div class="shortcut-row" data-c="${c.id}"><span>${c.name}</span><span>${c.keys(l).map(k => `<kbd>${k}</kbd>`).join("")}</span></div>`).join("") +
      `<p>${l.mod}W(탭 닫기), ${l.mod}T(새 탭), ${l.mod}R(새로고침)처럼 브라우저가 쓰는 단축키는 빼앗지 않는다.</p>`;
    sheet.querySelectorAll("[data-c]").forEach(r => api.on(r, "click", () => {
      const id = r.dataset.c;
      if (id === "nudge" || id === "nudge10") nudge(1, 0, id === "nudge10");
      else exec(id);
    }));
  };

  const chordBox = document.createElement("div");
  chordBox.className = "shortcut-chord";
  el.appendChild(chordBox);

  /* ---------- 누르고 있는 키 ---------- */
  const mods = { meta: false, ctrl: false, alt: false, shift: false };
  const keysHeld = new Map();   // code → 표시 이름
  const MOD_CODES = /^(Meta|OS|Control|Alt|Shift)(Left|Right)?$/;
  const nameOf = e => {
    const m = { ArrowLeft: "←", ArrowRight: "→", ArrowUp: "↑", ArrowDown: "↓", Backspace: "⌫", Delete: "Del", Escape: L().esc, Space: "Space", Enter: "⏎", Tab: "Tab", Slash: "/" };
    if (m[e.code]) return m[e.code];
    if (/^Key[A-Z]$/.test(e.code)) return e.code.slice(3);
    if (/^Digit\d$/.test(e.code)) return e.code.slice(5);
    return e.key && e.key.length === 1 ? e.key.toUpperCase() : e.code;
  };
  const syncMods = e => { mods.meta = e.metaKey; mods.ctrl = e.ctrlKey; mods.alt = e.altKey; mods.shift = e.shiftKey; };
  const chordNow = () => {
    const l = L(), out = [];
    if (mods.meta) out.push({ t: isMac() ? "⌘" : "Win", mod: true });
    if (mods.ctrl) out.push({ t: isMac() ? "⌃" : "Ctrl", mod: true });
    if (mods.alt) out.push({ t: l.alt, mod: true });
    if (mods.shift) out.push({ t: l.shift, mod: true });
    keysHeld.forEach(v => out.push({ t: v, mod: false }));
    return out;
  };

  // 사이드바의 글자 입력칸, 슬라이더에 포커스가 있으면 반응하지 않는다 (체크박스는 예외: Space가 토글을 다시 뒤집지 않도록)
  const fromField = e => { const f = e.target && e.target.closest && e.target.closest("input, textarea, select, [contenteditable]"); return !!f && !(f.type === "checkbox" || f.type === "radio"); };
  api.on(window, "keydown", e => {
    if (fromField(e)) return;
    syncMods(e);
    if (!MOD_CODES.test(e.code)) keysHeld.set(e.code, nameOf(e));
    api.hideHint();
    const chord = chordNow().map(c => c.t);
    const mod = e.metaKey || e.ctrlKey;
    let id = null;
    if (mod && !e.altKey) {
      if (e.code === "KeyA" && !e.shiftKey) id = "all";
      else if (e.code === "KeyD" && !e.shiftKey) id = "dup";
      else if (e.code === "KeyG") id = e.shiftKey ? "ungroup" : "group";
      else if (e.code === "KeyZ") id = e.shiftKey ? "redo" : "undo";
      else if (e.code === "KeyY" && !isMac()) id = "redo";
    } else if (!mod && !e.altKey) {
      if (e.code === "Backspace" || e.code === "Delete") id = "del";
      else if (e.code === "Escape") id = "none";
      else if (e.key === "?") id = "help";
      else if (e.code.startsWith("Arrow")) {
        e.preventDefault();
        const d = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.code];
        nudge(d[0], d[1], e.shiftKey);
        lastChord = chord;
        return;
      }
    }
    // 그 밖의 조합(⌘W, ⌘T, ⌘R 등)은 건드리지 않고 브라우저에 맡긴다
    if (!id) { renderChord(); return; }
    e.preventDefault();
    if (e.repeat && (id === "dup" || id === "group" || id === "help")) return;
    exec(id, chord);
  });
  api.on(window, "keyup", e => {
    syncMods(e);
    keysHeld.delete(e.code);
    // macOS에서는 ⌘를 누른 채 다른 키를 떼면 keyup이 오지 않는다 → ⌘를 뗄 때 함께 비운다
    if (e.key === "Meta") keysHeld.clear();
    renderChord();
  });
  api.on(window, "blur", () => { keysHeld.clear(); mods.meta = mods.ctrl = mods.alt = mods.shift = false; renderChord(); });

  /* ---------- 포인터: 선택과 끌기 ---------- */
  const drag = { on: false, id: 0, sx: 0, sy: 0, moved: false, start: null };
  api.on(root, "pointerdown", e => {
    const node = e.target.closest(".shortcut-obj");
    e.preventDefault();
    el.focus({ preventScroll: true });
    api.hideHint();
    if (!node) { if (sel.size) { sel.clear(); render(); } return; }
    const id = +node.dataset.id;
    const grp = expandGroups([id]);
    if (e.shiftKey) { const has = sel.has(id); grp.forEach(i => (has ? sel.delete(i) : sel.add(i))); }
    else if (!sel.has(id)) sel = grp;
    render();
    if (!sel.has(id)) return;
    root.setPointerCapture(e.pointerId);
    const p = localPoint(el, e);
    Object.assign(drag, { on: true, id, sx: p.x, sy: p.y, moved: false, start: snapshot(), orig: items.filter(i => sel.has(i.id)).map(i => [i, i.x, i.y]) });
  });
  api.on(root, "pointermove", e => {
    if (!drag.on) return;
    const p = localPoint(el, e);
    const dx = p.x - drag.sx, dy = p.y - drag.sy;
    if (!drag.moved && Math.hypot(dx, dy) < 3) return;
    if (!drag.moved) { drag.moved = true; undo.push(drag.start); redo.length = 0; }
    drag.orig.forEach(([i, x, y]) => { i.x = x + dx; i.y = y + dy; });
    render();
  });
  const endDrag = () => { drag.on = false; };
  api.on(root, "pointerup", endDrag); api.on(root, "pointercancel", endDrag);

  /* ---------- 그리기 ---------- */
  const nodes = new Map();
  const render = () => {
    const alive = new Set(items.map(i => i.id));
    nodes.forEach((n, id) => { if (!alive.has(id)) { n.remove(); nodes.delete(id); } });
    items.forEach(i => {
      let n = nodes.get(i.id);
      if (!n) {
        n = document.createElement("div");
        n.className = `shortcut-obj ${i.shape}${i.born ? " born" : ""}`; n.dataset.id = i.id;
        layer.appendChild(n); nodes.set(i.id, n);
        delete i.born;
      }
      n.style.left = i.x + "px"; n.style.top = i.y + "px"; n.style.width = i.w + "px"; n.style.height = i.h + "px";
      n.classList.toggle("sel", sel.has(i.id));
    });
    // 그룹 테두리
    layer.querySelectorAll(".shortcut-group").forEach(n => n.remove());
    const groups = new Map();
    items.forEach(i => { if (i.group) { if (!groups.has(i.group)) groups.set(i.group, []); groups.get(i.group).push(i); } });
    let gi = 0;
    groups.forEach(list => {
      const x0 = Math.min(...list.map(i => i.x)) - 10, y0 = Math.min(...list.map(i => i.y)) - 10;
      const x1 = Math.max(...list.map(i => i.x + i.w)) + 10, y1 = Math.max(...list.map(i => i.y + i.h)) + 10;
      const b = document.createElement("div");
      b.className = "shortcut-group";
      b.style.cssText = `left:${x0}px;top:${y0}px;width:${x1 - x0}px;height:${y1 - y0}px`;
      b.innerHTML = `<span>그룹 ${++gi}</span>`;
      layer.appendChild(b);
    });
    sheet.classList.toggle("hide", !sheetOpen);
    sheet.querySelectorAll("[data-c]").forEach(r => r.classList.toggle("off", !cmd(r.dataset.c).can()));
    renderChord();
  };
  const renderChord = () => {
    chordBox.classList.toggle("hide", !S.chord);
    const now = chordNow();
    const recent = performance.now() - chordAt < 1200;
    const show = now.length ? now.map(c => ({ ...c, hit: false })) : recent ? lastChord.map(t => ({ t, mod: false, hit: true })) : [];
    chordBox.classList.toggle("fade", !now.length && recent);
    chordBox.innerHTML = show.length
      ? show.map(c => `<span class="k${c.mod ? " mod" : ""}${c.hit ? " hit" : ""}">${c.t}</span>`).join(`<span class="plus">+</span>`) +
        (recent && firedName ? `<span class="cmd">${firedName}</span>` : "")
      : `<span class="empty">누르고 있는 키가 여기 보인다</span>`;
  };

  api.onParam(k => {
    if (k === "platform") buildSheet();
    if (k === "sheet") sheetOpen = S.sheet;
    render();
  });
  buildSheet();
  render();

  let lastChordRender = 0;
  api.frame(() => {
    const now = performance.now();
    if (now - chordAt < 1400 && now - lastChordRender > 100) { renderChord(); lastChordRender = now; }
    const held = chordNow().map(c => c.t);
    api.read("keys", held.length ? held.join(" + ") : "–");
    const modNames = chordNow().filter(c => c.mod).map(c => c.t);
    api.read("mods", modNames.length ? modNames.join(" ") : "없음");
    api.read("cmd", lastCmd);
    api.read("sel", `${sel.size} / ${items.length}`);
    const modOnly = held.length && chordNow().every(c => c.mod);
    if (modOnly) api.status(`${held.join(" + ")} 누르는 중 · 다음 키를 기다린다`, "active");
    else if (held.length) api.status(`${held.join(" + ")}`, "active");
    else if (drag.on && drag.moved) api.status("끌어서 옮기는 중", "active");
    else api.status(sel.size ? `${sel.size}개 선택됨` : "대기", "idle");
  });
}
