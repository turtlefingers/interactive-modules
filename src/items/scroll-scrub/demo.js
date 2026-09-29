import { clamp } from "../../lib/util.js";
import { ROOT } from "../../lib/items.js";

/* 스크롤 진행 애니메이션: 스크롤 위치를 애니메이션의 재생 위치(플레이헤드)에 묶는다.
   스테이지 안에 진짜 스크롤 영역을 만들고, 긴 트랙 안에서 화면을 고정한 채
   진행도 × (프레임 수 − 1) 번째 그림을 캔버스에 그린다. */
export default function demo(api) {
  const { el, S } = api;
  const N = 120, FPS = 12;
  const BASE = `${ROOT}media/scroll-scrub/`;
  const frameUrl = i => `${BASE}frames/f_${String(i + 1).padStart(3, "0")}.webp`;
  // 세 장면의 시작 프레임 (0부터 센다)
  const CHAPTERS = [
    { f: 0, name: "서 있기" },
    { f: 11, name: "달리기 시작" },
    { f: 72, name: "전력 질주" }
  ];

  api.css(`
    .scroll-scrub-root { position: absolute; inset: 0; background: var(--board); }
    .scroll-scrub-scroller { position: absolute; inset: 0; overflow-x: hidden; overflow-y: auto; outline: none;
      overscroll-behavior: contain; touch-action: pan-y; scrollbar-width: thin; }
    .scroll-scrub-track { position: relative; width: 100%; }
    .scroll-scrub-view { position: sticky; top: 0; left: 0; width: 100%; overflow: hidden; }
    .scroll-scrub-view.loose { position: relative; }
    .scroll-scrub-view canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }
    .scroll-scrub-gone { position: sticky; top: 46%; display: none; text-align: center; padding: 0 24px;
      font-size: 15px; color: var(--ink-3); line-height: 1.5; }
    .scroll-scrub-gone.on { display: block; }
    .scroll-scrub-rail { position: absolute; right: 22px; top: 72px; bottom: 72px; width: 2px; z-index: 30;
      background: rgba(0,0,0,.1); border-radius: 1px; pointer-events: none; }
    .scroll-scrub-fill { position: absolute; left: 0; top: 0; width: 100%; background: var(--accent); border-radius: 1px; }
    .scroll-scrub-head { position: absolute; left: 50%; width: 10px; height: 10px; margin: -5px 0 0 -5px;
      border-radius: 50%; background: var(--accent); }
    .scroll-scrub-target { position: absolute; left: 50%; width: 10px; height: 2px; margin: -1px 0 0 -5px;
      background: var(--ink-3); opacity: 0; transition: opacity .2s; }
    .scroll-scrub-target.on { opacity: .8; }
    .scroll-scrub-tick { position: absolute; left: 50%; width: 8px; height: 2px; margin: -1px 0 0 -4px; background: var(--ink-3); }
    .scroll-scrub-tick span { position: absolute; right: 14px; top: 50%; transform: translate(4px, -50%);
      white-space: nowrap; font-size: 13px; color: var(--ink-2); opacity: 0;
      background: var(--board); padding: 2px 7px; border-radius: 4px; transition: opacity .3s, transform .3s, color .3s; }
    .scroll-scrub-tick.passed span { opacity: .85; transform: translate(0, -50%); }
    .scroll-scrub-tick.now span { opacity: 1; color: var(--ink); font-weight: 600; }
    .scroll-scrub-load { position: absolute; left: 0; right: 0; bottom: 0; height: 2px; z-index: 30;
      background: rgba(0,0,0,.06); pointer-events: none; transition: opacity .5s; }
    .scroll-scrub-load i { position: absolute; inset: 0; background: var(--accent); transform-origin: 0 0; transform: scaleX(0); }
    .scroll-scrub-load.done { opacity: 0; }
    @media (max-width: 600px) {
      .scroll-scrub-rail { right: 16px; top: 64px; bottom: 76px; }
      .scroll-scrub-tick span { font-size: 12px; }
    }
  `);

  /* ---------- 구조 ---------- */
  const root = document.createElement("div"); root.className = "scroll-scrub-root";
  const scroller = document.createElement("div"); scroller.className = "scroll-scrub-scroller"; scroller.tabIndex = 0;
  const track = document.createElement("div"); track.className = "scroll-scrub-track";
  const view = document.createElement("div"); view.className = "scroll-scrub-view";
  const cv = document.createElement("canvas"); view.appendChild(cv);
  const gone = document.createElement("div"); gone.className = "scroll-scrub-gone";
  gone.innerHTML = "그림이 위로 지나갔다.<br>고정을 켜면 스크롤하는 동안 화면에 붙어 있는다.";
  track.append(view, gone);
  scroller.appendChild(track);

  const rail = document.createElement("div"); rail.className = "scroll-scrub-rail";
  rail.innerHTML = `<div class="scroll-scrub-fill"></div><div class="scroll-scrub-target"></div>` +
    CHAPTERS.map(c => `<div class="scroll-scrub-tick" style="top:${(c.f / (N - 1)) * 100}%"><span>${c.name}</span></div>`).join("") +
    `<div class="scroll-scrub-head"></div>`;
  const fill = rail.querySelector(".scroll-scrub-fill"), head = rail.querySelector(".scroll-scrub-head");
  const targetMark = rail.querySelector(".scroll-scrub-target");
  const ticks = [...rail.querySelectorAll(".scroll-scrub-tick")];
  const load = document.createElement("div"); load.className = "scroll-scrub-load"; load.innerHTML = "<i></i>";
  const loadBar = load.firstChild;
  root.append(scroller, rail, load);
  el.appendChild(root);
  scroller.focus({ preventScroll: true });

  const g = cv.getContext("2d");
  let vw = 0, vh = 0, dpr = 1, maxScroll = 1;
  let bg = null;          // 그림 가장자리 색 (빈 곳을 같은 색으로 채운다)
  let dirty = true;

  /* ---------- 프레임 미리 불러오기 ---------- */
  const frames = new Array(N).fill(null);
  let loaded = 0, dead = false;
  const poster = new Image();
  poster.onload = () => { if (!frames[0]) { sampleBg(poster); dirty = true; } };
  poster.src = `${BASE}poster.webp`;
  for (let i = 0; i < N; i++) {
    const im = new Image();
    im.decoding = "async";
    im.onload = () => {
      if (dead) return;
      frames[i] = im; loaded++;
      if (!bg) sampleBg(im);
      if (i === drawnFrame || drawnFrame < 0 || nearestLoaded(wantFrame) === i) dirty = true;
    };
    im.onerror = () => { loaded++; };
    im.src = frameUrl(i);
  }
  api.cleanup(() => { dead = true; });
  function sampleBg(im) {
    try {
      const c = document.createElement("canvas"); c.width = c.height = 1;
      const x = c.getContext("2d");
      x.drawImage(im, 2, 2, 1, 1, 0, 0, 1, 1);
      const d = x.getImageData(0, 0, 1, 1).data;
      bg = `rgb(${d[0]},${d[1]},${d[2]})`;
    } catch { bg = null; }
  }
  const nearestLoaded = i => { for (let k = i; k >= 0; k--) if (frames[k]) return k; for (let k = i + 1; k < N; k++) if (frames[k]) return k; return -1; };

  /* ---------- 영상 탐색 (필요할 때만 불러온다) ---------- */
  let video = null, videoReady = false;
  function ensureVideo() {
    if (video) return;
    video = document.createElement("video");
    video.muted = true; video.playsInline = true; video.preload = "auto";
    video.setAttribute("muted", ""); video.setAttribute("playsinline", "");
    video.src = `${BASE}dog-intra.mp4`;
    const ready = () => { videoReady = true; dirty = true; };
    api.on(video, "loadeddata", ready);
    api.on(video, "seeked", () => { dirty = true; });
    api.cleanup(() => { video.removeAttribute("src"); video.load(); });
  }
  const duration = () => (video && isFinite(video.duration) && video.duration) || N / FPS;

  /* ---------- 배치 ---------- */
  const lengthOf = () => ({ short: 2, normal: 4, long: 8 }[S.length] || 4);
  function layout() {
    const p = maxScroll > 0 ? scroller.scrollTop / maxScroll : 0;
    vw = scroller.clientWidth; vh = el.clientHeight;
    dpr = window.devicePixelRatio || 1;
    view.style.height = vh + "px";
    // 한 번 끝까지 달리는 데 필요한 스크롤 = 화면 높이 × 길이 배수
    track.style.height = vh * (1 + lengthOf()) + "px";
    cv.width = Math.round(vw * dpr); cv.height = Math.round(vh * dpr);
    maxScroll = Math.max(1, scroller.scrollHeight - scroller.clientHeight);
    scroller.scrollTop = p * maxScroll;
    dirty = true;
  }
  layout();
  api.onResize(layout);

  /* ---------- 상태 ---------- */
  const st = {
    target: 0,      // 스크롤이 가리키는 진행도
    furthest: 0,    // 되감기를 막았을 때 지금까지 간 가장 먼 진행도
    play: 0,        // 실제 플레이헤드 (부드럽게 따라간다)
    lastTop: 0, lastMove: 0, speed: 0, dir: 0, dirHold: 0, touched: false
  };
  let wantFrame = 0, drawnFrame = -1, drawnKey = "";
  const setView = () => {
    view.classList.toggle("loose", !S.pin);
    gone.classList.toggle("on", !S.pin);
  };
  setView();

  api.on(scroller, "scroll", () => {
    if (!st.touched) { st.touched = true; api.hideHint(); }
  }, { passive: true });

  api.onParam(k => {
    if (k === "length") {
      // 진행도는 그대로 두고 트랙 길이만 바꾼다
      const p = st.target;
      track.style.height = vh * (1 + lengthOf()) + "px";
      maxScroll = Math.max(1, scroller.scrollHeight - scroller.clientHeight);
      scroller.scrollTop = p * maxScroll;
      st.lastTop = scroller.scrollTop;
    }
    if (k === "pin") setView();
    if (k === "rewind" && !S.rewind) st.furthest = st.target;
    if (k === "mode") { if (S.mode === "video") ensureVideo(); dirty = true; drawnKey = ""; }
  });
  if (S.mode === "video") ensureVideo();

  /* ---------- 그리기 ---------- */
  function drawSource(src, sw, sh) {
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.fillStyle = bg || getComputedStyle(root).backgroundColor;
    g.fillRect(0, 0, vw, vh);
    if (!src || !sw) return;
    // 담기(contain) 맞춤. 좁은 화면에서는 조금 더 키워 강아지가 작아지지 않게 한다
    const contain = Math.min(vw / sw, vh / sh), cover = Math.max(vw / sw, vh / sh);
    const s = vw < 600 ? Math.min(cover, contain * 1.35) : contain;
    const dw = sw * s, dh = sh * s;
    g.drawImage(src, (vw - dw) / 2, (vh - dh) / 2, dw, dh);
  }

  /* ---------- 루프 ---------- */
  api.frame(dt => {
    const top = scroller.scrollTop;
    maxScroll = Math.max(1, scroller.scrollHeight - scroller.clientHeight);
    const raw = clamp(top / maxScroll, 0, 1);
    st.furthest = Math.max(st.furthest, raw);
    st.target = S.rewind ? raw : st.furthest;
    const blocked = !S.rewind && raw < st.furthest - 0.002;

    // 스크롤 속도 (px/s, 살짝 평균)
    const v = dt > 0 ? (top - st.lastTop) / (dt / 1000) : 0;
    if (top !== st.lastTop) st.lastMove = performance.now();
    st.lastTop = top;
    st.speed += (v - st.speed) * (1 - Math.pow(0.75, dt / 16.67));
    if (Math.abs(st.speed) < 1 || performance.now() - st.lastMove > 150) st.speed = 0;

    // 플레이헤드: 부드럽게 0이면 바로, 클수록 천천히 따라간다
    const prev = st.play;
    if (S.smooth <= 0.001) st.play = st.target;
    else {
      const f = 0.04 + 0.96 * Math.pow(1 - S.smooth, 1.5);
      const k = 1 - Math.pow(1 - f, dt / 16.67);
      st.play += (st.target - st.play) * k;
      if (Math.abs(st.target - st.play) < 0.0004) st.play = st.target;
    }
    const dp = st.play - prev;
    const d = dp > 0.00005 ? 1 : dp < -0.00005 ? -1 : 0;
    if (d) { st.dir = d; st.dirHold = 120; } else if ((st.dirHold -= dt) <= 0) st.dir = 0;

    // 그리기: 그림이 바뀔 때만
    const video_ = S.mode === "video";
    if (!(video_ && videoReady)) {
      // 이미지 시퀀스 (영상이 준비되기 전에도 이것을 보여준다)
      wantFrame = Math.round(st.play * (N - 1));
      const f = nearestLoaded(wantFrame);
      if (f >= 0 && (dirty || f !== drawnFrame || drawnKey !== "seq")) {
        drawSource(frames[f], frames[f].naturalWidth, frames[f].naturalHeight);
        drawnFrame = f; drawnKey = "seq"; dirty = false;
      } else if (f < 0 && dirty && poster.complete && poster.naturalWidth) {
        drawSource(poster, poster.naturalWidth, poster.naturalHeight); dirty = false;
      }
    } else {
      const t = st.play * Math.max(0, duration() - 0.001);
      // 탐색이 끝나기 전에 또 탐색하지 않는다. 끝나면 가장 최근 위치로 다시 간다
      if (!video.seeking && Math.abs(video.currentTime - t) > 1 / 60) video.currentTime = t;
      if ((dirty || drawnKey !== "video") && !video.seeking && video.readyState >= 2) {
        drawSource(video, video.videoWidth, video.videoHeight);
        drawnKey = "video"; dirty = false;
      }
    }

    // 진행 레일
    fill.style.height = st.play * 100 + "%";
    head.style.top = st.play * 100 + "%";
    targetMark.style.top = raw * 100 + "%";
    targetMark.classList.toggle("on", Math.abs(raw - st.play) > 0.01);
    const cur = Math.round(st.play * (N - 1));
    let nowIdx = 0;
    CHAPTERS.forEach((c, i) => { if (cur >= c.f) nowIdx = i; });
    ticks.forEach((t, i) => { t.classList.toggle("passed", cur >= CHAPTERS[i].f); t.classList.toggle("now", i === nowIdx); });

    // 불러오기 막대
    const lp = video_ && video && !videoReady ? 0.5 : loaded / N;
    loadBar.style.transform = `scaleX(${lp})`;
    load.classList.toggle("done", lp >= 1);

    // 읽는 값
    api.read("top", `${Math.round(top)}px`);
    api.read("prog", `${Math.round(st.play * 100)}%`);
    api.read("frame", video_ ? `${(st.play * duration()).toFixed(1)}s / ${duration().toFixed(1)}s` : `${cur + 1} / ${N}`);
    api.read("speed", `${Math.round(st.speed)}px/s`);
    api.read("dir", blocked ? "되감기 막힘" : st.dir > 0 ? "앞으로" : st.dir < 0 ? "되감기" : "멈춤");

    // 상태
    const where = video_ ? `${(st.play * duration()).toFixed(1)}초` : `프레임 ${cur + 1}`;
    if (video_ && video && !videoReady) api.status("영상 불러오는 중", "alt");
    else if (!video_ && loaded < N) api.status(`프레임 불러오는 중 · ${loaded} / ${N}`, "alt");
    else if (blocked) api.status(`되감기 막힘 · 가장 멀리 간 ${where}에 머문다`, "alt");
    else if (st.dir > 0) api.status(`앞으로 재생 중 · ${where}`, "active");
    else if (st.dir < 0) api.status(`되감는 중 · ${where}`, "active");
    else if (st.play >= 0.999) api.status(`끝 · 마지막 ${video_ ? "장면" : "프레임"}에 멈춤`, "ok");
    else if (st.play > 0.001) api.status(`멈춤 · ${where}에서 정지`, "idle");
    else api.status("대기 · 첫 장면", "idle");
  });
}
