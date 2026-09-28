/* ============================================================
   데모 런타임 — 데모 함수에 넘겨주는 api
   demo(api) 는 필요하면 { destroy() } 를 돌려준다.
   api.on / frame / timeout / css 로 등록한 것은 다시 시작할 때 자동으로 정리된다.
   ============================================================ */
import { rng } from "./util.js";

export function createRuntime({ meta, demo, S, stage, hintEl, statusEl, statusText }) {
  let ctx = null;
  let lastT = performance.now();
  let status = { text: "대기", kind: "idle" }, flash = null;

  function makeApi(el) {
    const c = { cleanups: [], frames: [], params: [], resizes: [], destroy: null };
    const api = {
      /** 데모를 그리는 요소 (스테이지를 꽉 채운다) */
      el,
      /** 변주 파라미터 현재값 (control.key → 값) */
      S,
      /** 이벤트 등록 (자동 해제) */
      on(target, type, fn, opts) { target.addEventListener(type, fn, opts); c.cleanups.push(() => target.removeEventListener(type, fn, opts)); },
      /** 매 프레임 호출: fn(dt ms, t ms) */
      frame(fn) { c.frames.push(fn); },
      /** 변주 값이 바뀔 때: fn(key, value) */
      onParam(fn) { c.params.push(fn); },
      /** 스테이지 크기가 바뀔 때 */
      onResize(fn) { c.resizes.push(fn); },
      /** 다시 시작할 때 실행할 정리 함수 */
      cleanup(fn) { c.cleanups.push(fn); },
      timeout(fn, ms) { const t = setTimeout(fn, ms); c.cleanups.push(() => clearTimeout(t)); return t; },
      interval(fn, ms) { const t = setInterval(fn, ms); c.cleanups.push(() => clearInterval(t)); return t; },
      /** 데모 전용 CSS */
      css(text) { const s = document.createElement("style"); s.textContent = text; document.head.appendChild(s); c.cleanups.push(() => s.remove()); },
      /** 읽는 값 갱신 (meta.readouts의 key) */
      read(key, value) { const b = document.querySelector(`[data-read="${key}"]`); if (b && b.textContent !== String(value)) b.textContent = value; },
      /** 상태 표시 (변형 모드에서만 보인다). kind: idle | active | alt | ok */
      status(text, kind = "active") { status = { text, kind }; },
      /** 잠깐 보여줄 상태 */
      flash(text, kind = "ok", ms = 1600) { flash = { text, kind, until: performance.now() + ms }; },
      hint(text) { hintEl.textContent = text; hintEl.classList.remove("gone"); },
      hideHint() { hintEl.classList.add("gone"); },
      size() { return { w: el.clientWidth, h: el.clientHeight }; },
      color(name) { return getComputedStyle(document.body).getPropertyValue(name).trim(); },
      rng
    };
    return { c, api };
  }

  function mount() {
    const el = document.createElement("div");
    el.className = "demo"; el.tabIndex = 0;
    stage.prepend(el);
    const { c, api } = makeApi(el);
    ctx = { el, c };
    hintEl.textContent = meta.hint || ""; hintEl.classList.toggle("gone", !meta.hint);
    status = { text: "대기", kind: "idle" }; flash = null;
    (meta.readouts || []).forEach(r => api.read(r.key, "–"));
    try {
      const r = demo ? demo(api) : null;
      c.destroy = r && r.destroy;
    } catch (err) {
      console.error(err);
      el.innerHTML = `<div style="padding:40px;color:var(--ink-2)">데모를 불러오지 못했다.</div>`;
    }
    el.focus({ preventScroll: true });
  }
  function unmount() {
    if (!ctx) return;
    try { ctx.c.destroy && ctx.c.destroy(); } catch (e) { console.error(e); }
    ctx.c.cleanups.forEach(f => { try { f(); } catch (e) { console.error(e); } });
    ctx.el.remove();
    ctx = null;
  }
  function loop(t) {
    const dt = Math.min(50, t - lastT); lastT = t;
    if (ctx) ctx.c.frames.forEach(f => { try { f(dt, t); } catch (e) { console.error(e); } });
    const now = performance.now();
    const s = flash && now < flash.until ? flash : status;
    if (statusEl.dataset.s !== s.kind) statusEl.dataset.s = s.kind;
    if (statusText.textContent !== s.text) statusText.textContent = s.text;
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
  new ResizeObserver(() => { if (ctx) ctx.c.resizes.forEach(f => f()); }).observe(stage);
  stage.addEventListener("selectstart", e => e.preventDefault());

  return {
    mount,
    remount() { unmount(); mount(); },
    param(k, v) { if (ctx) ctx.c.params.forEach(f => f(k, v)); }
  };
}
