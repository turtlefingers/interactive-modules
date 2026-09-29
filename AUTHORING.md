# 항목 작성 가이드

「인터랙티브 모듈들」의 항목 하나를 만드는 기준이다. 기준 예시는 `src/items/pan/`(팬 Pan)이다. **작업 전에 pan의 `meta.js`와 `demo.js`를 꼭 읽는다.**

- 항목 하나 = 폴더 하나: `src/items/<id>/meta.js` + `src/items/<id>/demo.js`
- `<id>`는 `src/catalog.js`에 적힌 주소다. 주소가 곧 URL(`/<id>/`)이 된다.
- 명칭과 뉘앙스는 프로젝트 루트의 `NAMING-REVIEW.md`를 따른다.
- 새 npm 패키지를 추가하지 않는다. Canvas 2D, DOM/CSS(3D transform 포함), SVG, Web Audio만 쓴다.
- 다른 항목 폴더나 공통 파일(`src/lib`, `src/pages`, `src/styles`)은 건드리지 않는다. `catalog.js`는 새 항목을 목차에 올릴 때만 고친다(아래 0절).
- 태그는 `meta.js`에 적지 않는다. 항목의 분류와 태그는 모두 `catalog.js`에 있다.

---

## 0. catalog.js — 목차와 태그

목차는 **4부(누가 움직이는가) → 중분류(무엇을 읽는가) → 항목**의 두 층이다. 기준은 `handoff/theory/인터랙션-모듈-사전-분류체계-리서치.md` 6절이다.

- `PARTS`: 4부와 그 안의 중분류(`groups`). 중분류마다 `id`("1-5"), `name`, `sub`, `desc`(한두 문장, ~이다체), `items`(항목 id 순서)가 있다. 제3부와 제4부는 이름 없는 중분류 하나(`name: null`)만 둔다.
- `FACETS`: 태그 어휘. 값마다 주소용 영문 `id`와 화면용 한국어 `ko`가 있다.
  - `effects` 효과 12 · `inputs` 입력 방식 12 · `timing` 시간 구조 7 — 메인 페이지 필터로 쓴다(`?effect=` `?input=` `?timing=`).
  - `buxton` Buxton 상태 5 · `reads` 읽는 값 11 — 데이터로만 둔다.
- `TAXONOMY`: 항목마다 `{ effects, inputs, timing, buxton, reads }`. 값은 `FACETS`의 한국어 이름으로 적고, 어휘 밖의 말을 새로 만들지 않는다. 입력이 전혀 없는 항목(예: 창 크기 반응)은 `inputs: []`.
- `order`(전체 순서), `placeOf(id)`(→ `{ part, group }`)는 여기서 계산된다. 이전 · 다음 버튼과 `/dev/qa.html`이 `order`를 쓴다.

**새 항목을 올릴 때**
1. 알맞은 중분류의 `items`에 id를 넣는다. 한 항목은 한 자리에만 둔다. 다른 자리와 겹치는 성격은 태그로 표현한다.
2. `TAXONOMY`에 같은 id로 한 줄을 더한다(효과 1~2, 입력 방식 1~2, 시간 1~2, Buxton, 읽는 값).
3. 개발 서버 콘솔에 `[catalog]` 경고가 없는지 본다(목차와 TAXONOMY가 어긋나거나 어휘 밖의 값이 있으면 알린다).

---

## 1. meta.js — 글 데이터

```js
export default {
  name: "팬", nameEn: "Pan",              // NAMING-REVIEW.md의 확정 명칭
  aliases: ["Board 이동", "패닝"],          // 다른 이름: 노션 원래 이름, 다른 후보 명칭, 흔한 한국어 표현
  input: "누르고 움직이기",                  // 입력 (입력 방식 이름 또는 더 구체적인 입력)
  effect: "보이는 영역 전체 이동",            // 효과: 짧은 명사구
  definition: "넓은 지면을 손으로 끌어 둘러보기", // 한 줄 정의: 20자 안팎
  hint: "누른 채 끌어서 둘러보기",            // 스테이지 왼쪽 위 안내. 무엇을 해보면 되는지 12자 안팎
  description: ["문단1", "문단2"],          // 2~3문장씩 1~2문단. <strong> 허용
  uses: ["...", "..."],                    // 쓰임 3~5개
  designPoints: ["...", "..."],            // 디자인 포인트 2~4개. <code> 허용
  prompts: { simple: "...", detailed: "..." },
  related: [                               // 관련 항목 (없으면 빈 배열)
    { label: "입력만 다른 같은 효과", items: [{ id: "scroll-driven", text: "스크롤 → 이동" }] },
    { label: "헷갈리는 개념", items: [{ id: "drag-and-drop", text: "드래그 앤 드롭 (대상을 옮김)" }] },
    { label: "함께 쓰이는 것", items: [{ id: "zoom", text: "확대 · 축소" }] }
  ],
  references: [{ name: "Google Maps", url: "https://...", note: "한 줄 코멘트." }],
  reads: "이 인터랙션이 읽는 입력값 설명 한 문장",
  readouts: [{ key: "dx", label: "Δx 누른 뒤 가로 이동" }],   // 실시간 수치 2~4개 (2×2 격자로 보인다)
  variations: [                            // 변주 3~6개
    { name: "관성", desc: "설명", control: { type: "toggle", key: "inertia", default: true } },
    { name: "경계", desc: "설명", control: { type: "seg", key: "bound", default: "clamp", options: [["clamp", "멈춤"], ["bounce", "튕김"]] } },
    { name: "속도", desc: "설명", control: { type: "range", key: "speed", min: 0, max: 1, step: 0.01, default: 0.5, ends: ["느리게", "빠르게"], unit: "px" /* 선택 */ } }
  ]
};
```

### 글쓰기 규칙
- **문체는 "~이다 / ~한다"체**다. "~해요"체를 쓰지 않는다.
- 설명은 "무슨 일이 일어나는지 → 사용자가 어떤 감각을 느끼는지" 순서로 쓴다. 헷갈리는 개념이 있으면 설명 안에서 구분한다(예: "드래그가 아니라 팬이다").
- 한 줄 정의는 명사형으로 끝낸다(예: "~하기", "~하는 버튼").
- 쓰임에는 실제 서비스, 게임, 앱 사례를 구체적으로 든다.
- 레퍼런스는 **실제로 존재하는 URL만** 쓴다. 확신이 없으면 넣지 않는다(빈 배열 가능). 위키백과, MDN, Apple HIG, Material Design, 유명 서비스 홈, 유명 인터랙티브 작업처럼 오래 유지되는 주소를 우선한다.
- related의 id는 `catalog.js`에 있는 id만 쓴다. 해당 항목이 없으면 id 없이 `{ text: "..." }`로 쓴다.
- 영어 대문자 라벨을 만들지 않는다. 한국어로 쓴다.

### AI 프롬프트 규칙
- **도구 무관**: HTML, CSS, JavaScript, 라이브러리, API 이름을 쓰지 않는다. 동작으로 설명한다.
- **간단**: 2~3문장. 무엇을 만드는지, 핵심 동작, 가장 헷갈리기 쉬운 개념과의 차이만 담는다. 문장은 "~(이름) 인터랙션을 만든다."로 시작한다.
- **상세**: 한 문단(간단의 3~4배). 구성(무엇이 어디에 있는지), 입력과 반응의 정확한 관계(비율, 방향, 기준값), 경계와 예외 처리, 피드백(커서 모양 등), 입력 장치, **넣지 말 것**(추가 효과 금지)까지 담는다.
- 문체는 "~한다"체의 명세문이다.

---

## 2. demo.js — 데모

```js
import { rng, clamp, lerp, mod, dist, map, PALETTE, PALETTE_SOFT, localPoint, fitCanvas } from "../../lib/util.js";

export default function demo(api) {
  const { el, S } = api;           // el: 스테이지를 꽉 채우는 요소, S: 변주 현재값
  api.css(`.my-thing { ... }`);    // 이 데모 전용 CSS. 클래스 이름은 반드시 <id>- 로 시작한다
  // ... el 안에 DOM/Canvas/SVG를 만든다
  api.on(el, "pointerdown", e => { ... });   // 이벤트는 반드시 api.on으로 (다시 시작할 때 자동 해제)
  api.on(window, "keydown", e => { ... });   // 키보드도 api.on(window, ...)
  api.frame((dt, t) => { ... });             // 매 프레임 (dt: ms)
  api.onParam((key, value) => { ... });      // 변주가 바뀔 때 (S는 이미 바뀌어 있다)
  api.onResize(() => { ... });
  api.read("dx", 12);                         // 읽는 값 갱신 (readouts의 key)
  api.status("팬 중", "active");              // 상태 표시: idle | active | alt | ok (변형 모드에서만 보인다)
  api.flash("클릭으로 인식", "ok");            // 잠깐 보여줄 상태
  api.hideHint();                             // 사용자가 처음 조작하면 안내를 숨긴다
  api.timeout(fn, ms); api.interval(fn, ms); api.cleanup(fn);
  const { w, h } = api.size();
  return { destroy() { /* 추가 정리가 필요할 때만 */ } };
}
```

- 스테이지 오른쪽 위에는 「처음 상태로」 버튼, 왼쪽 위에는 안내, 왼쪽 아래에는 상태 표시가 겹친다. 이 세 곳에 중요한 UI를 두지 않는다(z-index 50 오버레이).
- 스테이지 크기는 정해져 있지 않다(데스크톱 약 980×850, 모바일 약 375×560). 크기에 맞춰 배치하고 `api.onResize`로 대응한다.
- `fitCanvas(api)`는 레티나와 리사이즈를 처리한 캔버스를 만들어준다: `const { g, size } = fitCanvas(api);` 그리고 매 프레임 `g.clearRect(0,0,size.w,size.h)`.
- 포인터 좌표는 `localPoint(el, e)`로 스테이지 기준 좌표로 바꾼다.
- 마우스와 터치 모두 동작하도록 **Pointer Events**를 쓴다. 끌기 동작은 `el.setPointerCapture(e.pointerId)`를 쓰고 `pointerdown`에서 `e.preventDefault()`를 한다.
- 키보드 데모는 처리한 키에 `e.preventDefault()`를 해서 페이지가 스크롤되지 않게 한다. 단, 사이드바 입력 요소(`input`, `textarea`)에 포커스가 있으면 반응하지 않는다(`if (e.target.closest("input, textarea, [contenteditable]")) return;` — 데모 안의 입력창은 예외).
- 소리를 내는 데모는 첫 사용자 입력 때 `AudioContext`를 만들고, `api.cleanup`에서 닫는다. 소리는 작게(gain 0.2 이하).
- **변주 토글을 끄면 데모가 원래 상태로 부드럽게 돌아와야 한다.** 파라미터를 바꿔도 데모가 멈추거나 초기화되면 안 된다.
- 데모의 목적은 **개념이 한눈에 보이는 것**이다. 과한 장식 없이, 인터랙션의 핵심이 3초 안에 느껴지게 만든다.

### 스타일
- **미니멀하게 만든다.** 하이라이트, 광택, 글로우, 장식용 그라데이션을 쓰지 않는다. 납작한 도형, 가는 선, 절제된 색(크림 보드 위에 잉크와 회색, 필요한 곳에만 강조색 하나)으로 인터랙션을 설명하는 데 필요한 것만 남긴다.
- 페이퍼 스타일: 배경은 `var(--board)`(크림색)가 기본이다. 개체 색은 `PALETTE`/`PALETTE_SOFT` 또는 `var(--c1)`~`var(--c6)`, 강조는 `var(--accent)`(주황), 글자는 `var(--ink)`, `var(--ink-2)`, `var(--ink-3)`을 쓴다.
- 카드형 개체: `background: var(--note)` 또는 팔레트 색, `border-radius: var(--r-card)`, `box-shadow: var(--shadow-card)`, 호버 시 `var(--shadow-hover)`와 살짝 떠오르기(translateY(-3px) scale(1.015)).
- 격자 배경이 필요하면 `var(--grid)` 선 100px 간격.
- 데모 안의 버튼과 텍스트는 사이트와 같은 서체(상속)와 글자 크기(13 / 15 / 18px)를 쓴다.
- 커서 모양을 인터랙션에 맞게 바꾼다(grab, grabbing, pointer, crosshair 등).

### 그림 스타일 (사람 · 생물 · 사물 · 풍경)
기준은 **"검정 손그림 선 + 한 색 채움"**(Open Peeps 계열)이며, 인물 외의 환경은 톤 면으로 조용하게 받쳐준다. 굵은 검정 테두리를 두른 원색 그림(색칠공부 느낌)과 유치원 아이콘 도상(세모 지붕 집, 노란 원 해, 별)은 금지다.

- **사람은 직접 그리지 않는다.** `src/lib/figure.js`의 Open Peeps(Pablo Stanley, CC0) 조합을 쓴다.
  - DOM/SVG: `peepSVG({ body, face, hair, accessory, facialHair, colors: { fill }, flip })` 문자열을 넣는다. 상반신만 필요하면 `body`에 `NAMES.bust` 이름을 준다.
  - Canvas: `drawPeep(g, opts, x, y, h, { rotate, squash, alpha })` — (x, y)는 발바닥 가운데, h는 높이. 준비되기 전에는 false를 돌려주므로 시작할 때 `preload()`를 부른다.
  - 사람 목록은 `PEOPLE`, 색은 `outfit(색)` 하나만(선은 항상 검정). 포즈는 `NAMES.standing`(걷기 `WalkingBW`/`WalkingWB`, 서기 `ShirtBW`, 가리키기 `PointingFingerBW`, 팔짱 `CrossedArmsBW`, 기대기 `EasingBW`, 쉬기 `RestingBW`), `NAMES.sitting`(`MediumBW`, `CrossedLegs`, `OneLegUpBW`, `Wheelchair`), `NAMES.bust`에서 고른다. 표정은 `NAMES.face`(Smile, Calm, Cheeky, EyesClosed, Tired, Awe, Fear, Serious …), 머리는 `NAMES.hair`.
  - 점프·웅크림은 `rotate`/`squash`와 y 이동으로, 잠은 표정 `EyesClosed`/`Tired`와 앉기 포즈로 표현한다.
- **왜 세련되어 보이는가 (사물을 그릴 때 지킬 7가지)** — 기준 예: `pull-out`의 식물
  1. 선은 장식이 아니라 구조다. 줄기·뿌리·끈처럼 "형태의 뼈대"에만 1.5px 검정 선을 쓰고, 덩어리에 테두리를 두르지 않는다.
  2. 기호(아이콘)가 아니라 형태의 추상이다. 세모 지붕 집, 뾰족한 해, 별 모양 같은 "어린이 도상"을 쓰지 않고, 실물의 실루엣을 단순화한다.
  3. 색은 두 개다. 톤 배경 + 색 하나. 상태 변화(잡힘, 뜨거움)에서만 잠깐 강조색이 더해진다. 채도 높은 원색 여러 개를 함께 쓰지 않는다.
  4. 여백이 대부분이다. 화면을 채우지 않는다. 사물은 작게, 땅은 넓게.
  5. 비대칭과 리듬. 완벽한 원·정삼각형·좌우 대칭을 피하고, 크기와 각도를 조금씩 다르게 둔다.
  6. 배경은 탁한 톤(`TONE`)이다. 순백이나 밝은 원색 배경을 쓰지 않는다.
  7. 하나의 지평선. 사물은 한 선 위에 놓여 구도의 질서를 만든다.
- **동물과 사물**은 당분간 **외곽선 없는 톤 면 실루엣**으로만 그린다(`src/lib/draw.js`의 `shape`/`circle`/`ellipse` 등, `TONE` 색). 동물이 꼭 필요한 데모는 사람(Open Peeps)으로 바꾸는 쪽을 먼저 검토한다. Open Peeps와 같은 손그림 계열의 동물·사물 자산은 AI 생성으로 따로 만들 예정이며, 준비되면 이 항목을 갱신한다.
- **풍경과 구조물**은 톤 면(`TONE`)으로만 그리고 외곽선을 두르지 않는다. 필요한 곳(풍선 끈, 줄기)에만 1.5px 가는 잉크 선(`src/lib/draw.js`의 `line/curve`)을 쓴다. 강조색은 장면에 하나만.
- 3D 장면은 `keyboard-orbit`처럼 그린다: 납작한 면 채움, 가는 외곽선, 강조면 하나, 회색 격자 바닥.
- 사이트 어딘가에 Open Peeps 출처 표기가 있어야 한다(메인 페이지 푸터에 있음).
- 개발 서버에서 `/dev/people.html`(사람 그림 런타임)과 `/dev/objects.html`(사물 카탈로그)을 열어 기준을 확인할 수 있다.

### 읽는 값과 상태
- readouts는 이 인터랙션이 **실제로 읽는 입력값**을 보여준다(위치, 거리, 속도, 각도, 누른 시간, 횟수 등). 숫자는 정수나 소수 1자리로 짧게.
- 상태는 지금 무슨 일이 일어나는지 한 줄로: "대기", "누르는 중 · 0.8초", "쿨다운 중 · 1.2초 남음" 등.

---

## 3. 검증

작업이 끝나면 `site` 폴더에서 아래를 실행해 오류가 없는지 확인한다(개발 서버나 브라우저는 띄우지 않는다).

```bash
node --check src/items/<id>/demo.js
node -e 'import("./src/items/<id>/meta.js").then(m=>{const d=m.default;const need=["name","nameEn","input","effect","definition","hint","description","uses","designPoints","prompts","reads","readouts","variations"];const miss=need.filter(k=>!(k in d));if(miss.length)throw new Error("missing "+miss);console.log("ok",d.name)})'
```
