/* ============================================================
   목차와 분류
   - 항목은 src/items/<id>/meta.js(글)와 demo.js(데모)로 나눈다.
   - PARTS: 대분류(누가 움직이는가, 4부) → 중분류(무엇을 읽는가) → 항목 id.
     한 항목은 한 자리에만 둔다. 겹침은 TAXONOMY의 태그로 표현한다.
   - FACETS: 태그 어휘. 효과 · 입력 방식 · 시간 구조는 메인 페이지 필터로,
     Buxton 상태와 읽는 값은 데이터로만 쓴다.
   - TAXONOMY: 항목마다 다섯 가지 태그. 값은 FACETS의 한국어 이름(ko)으로 적는다.
   기준: handoff/theory/인터랙션-모듈-사전-분류체계-리서치.md 6절(6.1 체계, 6.2 목차)
   ============================================================ */

export const PARTS = [
  {
    id: "I", no: "제1부", name: "만지기", sub: "손이 곧 값이다",
    desc: "커서 아래의 대상이나 시야가 손의 연속 동작을 그대로 따른다. 손을 움직인 만큼 값이 바뀌어서 조작과 결과 사이에 거리가 없다(Shneiderman의 직접 조작).",
    groups: [
      { id: "1-1", name: "커서의 위치가 곧 값", sub: "누르지 않고",
        desc: "누르지 않고 커서를 올리거나 움직이기만 한다. 커서가 지금 어디에 있는지가 곧 값이다.",
        items: ["cursor-morph", "crosshair", "before-after", "mouse-parallax", "mouse-look"] },
      { id: "1-2", name: "누른 채 한 점으로 값을 정하기", sub: null,
        desc: "누른 채로 한 점을 옮겨 값을 정한다. 거쳐 온 길보다 지금 놓인 자리를 읽는다.",
        items: ["xy-pad", "virtual-joystick", "rotary-knob"] },
      { id: "1-3", name: "지나간 길이 남는다", sub: "경로와 흔적",
        desc: "움직인 길을 따라 무언가 남거나 드러난다. 어디서 어디로, 어떤 길로 지나갔는지를 읽는다.",
        items: ["freehand", "stamp-brush", "line-tool", "shape-tool", "scratch-off", "rub", "text-selection", "cursor-trail", "cursor-emitter"] },
      { id: "1-4", name: "집어서 옮기고 놓는다", sub: "대상의 변위",
        desc: "대상을 집어서 옮기고 놓는다. 무엇을 어디에 놓았는지, 얼마나 떼어 놓았는지가 결과를 정한다.",
        items: ["drag-and-drop", "drop-zone", "reorder", "break-apart", "merge", "node-wiring", "mesh-warp", "pull-out", "squeeze"] },
      { id: "1-5", name: "세계를 옮긴다", sub: "시야의 변위",
        desc: "대상이 아니라 보는 창이 움직인다. 끌기, 휠, 스크롤, 키로 시야를 옮기고 돌리고 키운다.",
        items: ["pan", "orbit", "keyboard-orbit", "zoom", "double-click-zoom", "rotate-view", "scroll-driven", "scroll-scrub"] },
      { id: "1-6", name: "얼마나 빨리, 어느 쪽으로", sub: "속도와 방향",
        desc: "움직임의 빠르기와 방향을 읽는다. 놓는 순간의 속도나 방향이 뒤집힌 횟수가 결과를 정한다.",
        items: ["fling", "slingshot", "swipe", "shake-to-cancel"] },
      { id: "1-7", name: "얼마나 오래", sub: "지속시간",
        desc: "누르고 있는 시간을 읽는다. 누르는 동안 쌓이거나 계속 나오고, 떼면 멈추거나 풀려난다.",
        items: ["press-and-hold", "charge-shot", "auto-fire", "directional-move", "jump-crouch"] }
    ]
  },
  {
    id: "II", no: "제2부", name: "누르기", sub: "누름이 곧 명령이다",
    desc: "누르는 동작의 모양과 결과가 약속으로 이어진다. 한 번 누르면 명령 하나가 실행되고, 무엇을 몇 번, 어떤 차례로 눌렀는지를 읽는다(Verplank의 「버튼」).",
    groups: [
      { id: "2-1", name: "한 번 누름", sub: "횟수와 타이밍",
        desc: "한 번 누르면 한 번 일어난다. 몇 번 눌렀는지, 어떤 간격으로 눌렀는지를 읽는다.",
        items: ["single-shot", "click-counter", "toggle", "cooldown", "click-to-target", "double-tap-like", "inline-edit", "context-menu", "button-mash", "randomizer"] },
      { id: "2-2", name: "고르고 엮기", sub: "선택의 집합",
        desc: "하나하나는 클릭이지만 읽는 것은 무엇을 골라 두었는가다. 켜 둔 것들이 모여 결과를 만든다.",
        items: ["filter-chips", "tabs-accordion", "carousel", "configurator", "branching-choice", "step-sequencer", "crafting", "undo-redo"] },
      { id: "2-3", name: "키의 문법", sub: "순서·조합·문자열",
        desc: "어떤 키를 어떤 차례로, 또는 함께 눌렀는지를 읽는다. 키가 모여 명령, 암호, 문장이 된다.",
        items: ["shortcut", "cheat-code", "passcode", "keyboard-instrument", "chat"] }
    ]
  },
  {
    id: "III", no: "제3부", name: "개체가 스스로 움직인다", sub: "자율 반응",
    desc: "사용자는 위치와 존재만 준다. 개체가 저마다 속도와 관성, 규칙을 갖고 스스로 다가오거나 달아나거나 바라본다(Reynolds의 steering).",
    groups: [
      { id: "3", name: null, sub: null, desc: null,
        items: ["proximity", "magnet", "flee", "cursor-follow", "look-at"] }
    ]
  },
  {
    id: "IV", no: "제4부", name: "입력이 없어도 입력이다", sub: "환경과 부재",
    desc: "사용자의 동작이 아니라 동작이 없는 시간이나 창·문서의 상태가 방아쇠가 된다. 아무것도 하지 않는 것도 입력이다(Saffer의 시스템 트리거).",
    groups: [
      { id: "4", name: null, sub: null, desc: null,
        items: ["idle", "page-visibility", "viewport-resize", "multi-window"] }
    ]
  }
];

/* 태그 어휘. id는 주소(?effect=view)에 쓰는 고정 이름, ko는 화면에 보이는 이름이다 */
const v = (id, ko) => ({ id, ko });
export const FACETS = {
  // B축: 무엇이 바뀌는가 (필터)
  effects: [
    v("view", "시야 이동"), v("scale", "크기·회전"), v("move", "개체 이동"), v("morph", "변형"),
    v("trace", "흔적"), v("reveal", "드러내기"), v("spawn", "생성·소멸"), v("launch", "발사"),
    v("count", "셈·누적"), v("state", "상태 전환"), v("sound", "소리"), v("respond", "응답")
  ],
  // 입력 방식 (필터). 예전 17분류에서 「버튼」「탭·창」을 뺀 것. id는 예전 분류 id를 이어 쓴다
  inputs: [
    v("hover", "올리기"), v("click", "클릭"), v("dblclick", "더블클릭"), v("rightclick", "우클릭"),
    v("move", "마우스 움직임"), v("pressmove", "누르고 움직이기"), v("drag", "드래그 앤 드롭"), v("scroll", "스크롤·휠"),
    v("arrow", "방향키"), v("keyhold", "키 홀드·연타"), v("keycombo", "키 순서·조합"), v("typing", "타이핑")
  ],
  // 시간 구조 (필터)
  timing: [
    v("instant", "즉시"), v("sustain", "지속"), v("release", "놓는 순간"), v("delay", "지연"),
    v("accumulate", "누적"), v("decay", "감쇠·회복"), v("wait", "대기")
  ],
  // Buxton 상태 (데이터만. 나중에 터치 대응 문장을 만들 때 쓴다)
  buxton: [
    v("tracking", "추적 중"), v("press", "누름"), v("dragging", "끌기 중"), v("release", "놓음"), v("outside", "모델 밖")
  ],
  // A축: 무엇을 읽는가 (데이터만. 중분류의 근거)
  reads: [
    v("position", "존재·위치"), v("distance", "거리"), v("path", "경로"), v("velocity", "속도·방향"),
    v("duration", "지속시간"), v("count", "횟수·타이밍"), v("sequence", "순서·조합"), v("selection", "선택의 집합"),
    v("absence", "부재"), v("environment", "환경")
  ]
};

/* ============================================================
   TAXONOMY — 항목별 태그 (75행, PARTS 순서)
   출처
   - effects · buxton · timing: 리서치 6.2 표의 효과 · Buxton · 시간 열을 한 줄씩 옮겼다.
   - inputs: 예전 catalog.js의 입력 방식 분류에서 옮기고(누르기 → 클릭 또는 누르고 움직이기,
     스크롤/핀치·휠 → 스크롤·휠, 키 누르고 있기·연타 → 키 홀드·연타, 버튼 → 클릭,
     탭·창 → 없음, 가만히 있기 → 마우스 움직임), 데모가 실제로 듣는 입력과 6.3을 보고 더했다.
   - reads: 6.2에 열이 없다. 중분류에서 정하고(1-1·1-2 존재·위치, 1-3 경로, 1-6 속도·방향,
     1-7 지속시간, 2-1 횟수·타이밍, 2-2 선택의 집합, 2-3 순서·조합, 제3부 거리, 제4부 부재·환경),
     분명한 경우만 항목별로 고쳤다(2.2의 ② 표 참고).
   정규화 규칙
   - 효과 칸의 괄호 설명은 버린다: "변형(커서)" → 변형, "크기·회전(시야)" → 크기·회전.
   - 합성 표기는 나눈다: "개체 이동·상태(두 값)" → 개체 이동 + 상태 전환,
     "흔적·생성" → 흔적 + 생성·소멸, "크기·시야" → 크기·회전 + 시야 이동,
     "시야 이동·회전" → 시야 이동 + 크기·회전, "소리·상태" → 소리 + 상태 전환.
   - Buxton: "끌기 중 → 놓음" → 끌기 중 + 놓음, "누름×2" · "누름 반복" · "누름(다른 버튼)" → 누름,
     "모델 밖(키)" → 모델 밖, "끌기 중(정지)" → 끌기 중, "추적 중(부재)" → 추적 중, "누름 / 키" → 누름 + 모델 밖.
   - 시간: "놓는 순간 → 감쇠" → 놓는 순간 + 감쇠·회복, "감쇠" → 감쇠·회복,
     "감쇠 누적(멈추면 빠짐)" → 감쇠·회복 + 누적, "지속 → 놓는 순간" → 지속 + 놓는 순간,
     "즉시(점프) / 지속(앉기)" → 즉시 + 지속, "지연(가속)" · "지연(이동 시간)" → 지연.
   - scroll-scrub은 6.2 표에 없다(교수 결정으로 1-5 scroll-driven 뒤에 둔다).
   ============================================================ */
export const TAXONOMY = {
  /* 1-1 커서의 위치가 곧 값 */
  "cursor-morph":     { effects: ["변형"], inputs: ["올리기"], timing: ["즉시"], buxton: ["추적 중"], reads: ["존재·위치"] },
  "crosshair":        { effects: ["드러내기"], inputs: ["마우스 움직임"], timing: ["즉시"], buxton: ["추적 중"], reads: ["존재·위치"] },
  "before-after":     { effects: ["드러내기"], inputs: ["마우스 움직임", "누르고 움직이기"], timing: ["즉시"], buxton: ["추적 중", "끌기 중"], reads: ["존재·위치"] },
  "mouse-parallax":   { effects: ["시야 이동"], inputs: ["마우스 움직임"], timing: ["즉시"], buxton: ["추적 중"], reads: ["존재·위치"] },
  "mouse-look":       { effects: ["시야 이동"], inputs: ["마우스 움직임"], timing: ["즉시"], buxton: ["추적 중"], reads: ["존재·위치"] },
  /* 1-2 누른 채 한 점으로 값을 정하기 */
  "xy-pad":           { effects: ["개체 이동", "상태 전환"], inputs: ["누르고 움직이기"], timing: ["즉시"], buxton: ["끌기 중"], reads: ["존재·위치"] },
  // 새 정의(7.2): 기준점과의 차이 벡터 → 위치 + 거리
  "virtual-joystick": { effects: ["개체 이동"], inputs: ["누르고 움직이기"], timing: ["지속"], buxton: ["끌기 중"], reads: ["존재·위치", "거리"] },
  "rotary-knob":      { effects: ["크기·회전"], inputs: ["드래그 앤 드롭"], timing: ["즉시"], buxton: ["끌기 중"], reads: ["존재·위치"] },
  /* 1-3 지나간 길이 남는다 */
  "freehand":         { effects: ["흔적"], inputs: ["누르고 움직이기"], timing: ["즉시"], buxton: ["끌기 중"], reads: ["경로"] },
  "stamp-brush":      { effects: ["흔적", "생성·소멸"], inputs: ["누르고 움직이기"], timing: ["즉시"], buxton: ["끌기 중"], reads: ["경로"] },
  "line-tool":        { effects: ["흔적"], inputs: ["드래그 앤 드롭"], timing: ["즉시"], buxton: ["끌기 중", "놓음"], reads: ["경로"] },
  "shape-tool":       { effects: ["흔적"], inputs: ["드래그 앤 드롭"], timing: ["즉시"], buxton: ["끌기 중", "놓음"], reads: ["경로"] },
  "scratch-off":      { effects: ["드러내기"], inputs: ["누르고 움직이기"], timing: ["누적"], buxton: ["끌기 중"], reads: ["경로"] },
  "rub":              { effects: ["드러내기", "셈·누적"], inputs: ["누르고 움직이기"], timing: ["누적"], buxton: ["끌기 중"], reads: ["경로"] },
  "text-selection":   { effects: ["흔적"], inputs: ["누르고 움직이기"], timing: ["즉시"], buxton: ["끌기 중"], reads: ["경로"] },
  "cursor-trail":     { effects: ["흔적"], inputs: ["마우스 움직임"], timing: ["감쇠·회복"], buxton: ["추적 중"], reads: ["경로"] },
  "cursor-emitter":   { effects: ["생성·소멸"], inputs: ["마우스 움직임", "누르고 움직이기"], timing: ["감쇠·회복"], buxton: ["추적 중"], reads: ["경로"] },
  /* 1-4 집어서 옮기고 놓는다 */
  "drag-and-drop":    { effects: ["개체 이동"], inputs: ["드래그 앤 드롭"], timing: ["즉시"], buxton: ["끌기 중", "놓음"], reads: ["존재·위치"] },
  "drop-zone":        { effects: ["상태 전환"], inputs: ["드래그 앤 드롭"], timing: ["놓는 순간"], buxton: ["놓음"], reads: ["존재·위치"] },
  "reorder":          { effects: ["개체 이동"], inputs: ["드래그 앤 드롭"], timing: ["즉시"], buxton: ["끌기 중", "놓음"], reads: ["존재·위치"] },
  "break-apart":      { effects: ["생성·소멸"], inputs: ["드래그 앤 드롭"], timing: ["놓는 순간"], buxton: ["놓음"], reads: ["거리"] },
  "merge":            { effects: ["생성·소멸"], inputs: ["드래그 앤 드롭"], timing: ["놓는 순간"], buxton: ["놓음"], reads: ["존재·위치"] },
  // "흔적·상태(연결)" → 흔적 + 상태 전환
  "node-wiring":      { effects: ["흔적", "상태 전환"], inputs: ["드래그 앤 드롭"], timing: ["즉시"], buxton: ["끌기 중", "놓음"], reads: ["존재·위치"] },
  "mesh-warp":        { effects: ["변형"], inputs: ["드래그 앤 드롭"], timing: ["즉시"], buxton: ["끌기 중"], reads: ["존재·위치"] },
  // "생성·소멸(분리) / 상태 전환(문턱 실행)" → 두 하위 변형의 효과를 모두. 변위가 문턱을 넘는가 → 거리
  "pull-out":         { effects: ["생성·소멸", "상태 전환"], inputs: ["누르고 움직이기", "드래그 앤 드롭"], timing: ["놓는 순간"], buxton: ["끌기 중", "놓음"], reads: ["거리"] },
  // 새 정의(7.2): 움직이는 세기로 차오르고 멈추면 빠지는 게이지 → 속도·방향
  "squeeze":          { effects: ["변형", "생성·소멸"], inputs: ["누르고 움직이기"], timing: ["감쇠·회복", "누적"], buxton: ["끌기 중"], reads: ["속도·방향"] },
  /* 1-5 세계를 옮긴다 (끌기·휠로 옮긴 양 = 거리, 스크롤 위치 = 존재·위치) */
  "pan":              { effects: ["시야 이동"], inputs: ["누르고 움직이기", "드래그 앤 드롭"], timing: ["즉시"], buxton: ["끌기 중"], reads: ["거리"] },
  "orbit":            { effects: ["시야 이동", "크기·회전"], inputs: ["마우스 움직임", "누르고 움직이기"], timing: ["즉시"], buxton: ["끌기 중"], reads: ["거리"] },
  // "지속(단계 각도)" → 지속. 누른 방향키 = 속도·방향
  "keyboard-orbit":   { effects: ["시야 이동", "크기·회전"], inputs: ["방향키"], timing: ["지속"], buxton: ["모델 밖"], reads: ["속도·방향"] },
  "zoom":             { effects: ["크기·회전", "시야 이동"], inputs: ["스크롤·휠"], timing: ["즉시"], buxton: ["모델 밖"], reads: ["거리"] },
  "double-click-zoom":{ effects: ["크기·회전", "시야 이동"], inputs: ["더블클릭"], timing: ["즉시"], buxton: ["누름"], reads: ["존재·위치", "횟수·타이밍"] },
  "rotate-view":      { effects: ["크기·회전"], inputs: ["스크롤·휠"], timing: ["즉시"], buxton: ["모델 밖"], reads: ["거리"] },
  "scroll-driven":    { effects: ["시야 이동", "변형"], inputs: ["스크롤·휠"], timing: ["즉시"], buxton: ["모델 밖"], reads: ["존재·위치"] },
  "scroll-scrub":     { effects: ["변형"], inputs: ["스크롤·휠"], timing: ["즉시"], buxton: ["모델 밖"], reads: ["존재·위치"] },
  /* 1-6 얼마나 빨리, 어느 쪽으로 */
  "fling":            { effects: ["개체 이동", "발사"], inputs: ["드래그 앤 드롭"], timing: ["놓는 순간", "감쇠·회복"], buxton: ["놓음"], reads: ["속도·방향"] },
  // 당긴 방향(속도·방향)과 당긴 길이(거리)를 함께 읽는다
  "slingshot":        { effects: ["발사"], inputs: ["드래그 앤 드롭"], timing: ["놓는 순간"], buxton: ["끌기 중", "놓음"], reads: ["속도·방향", "거리"] },
  "swipe":            { effects: ["상태 전환"], inputs: ["드래그 앤 드롭"], timing: ["놓는 순간"], buxton: ["놓음"], reads: ["속도·방향"] },
  // "누적(반전 횟수)" → 누적. 새 정의(7.2): 짧은 시간 안 방향 반전 N회
  "shake-to-cancel":  { effects: ["상태 전환"], inputs: ["마우스 움직임"], timing: ["누적"], buxton: ["추적 중", "끌기 중"], reads: ["속도·방향", "횟수·타이밍"] },
  /* 1-7 얼마나 오래 */
  "press-and-hold":   { effects: ["셈·누적"], inputs: ["클릭", "키 홀드·연타"], timing: ["지속"], buxton: ["끌기 중"], reads: ["지속시간"] },
  "charge-shot":      { effects: ["발사"], inputs: ["키 홀드·연타", "클릭"], timing: ["지속", "놓는 순간"], buxton: ["끌기 중", "놓음"], reads: ["지속시간"] },
  "auto-fire":        { effects: ["발사"], inputs: ["누르고 움직이기", "키 홀드·연타"], timing: ["지속"], buxton: ["끌기 중"], reads: ["지속시간"] },
  "directional-move": { effects: ["개체 이동"], inputs: ["방향키"], timing: ["지속"], buxton: ["모델 밖"], reads: ["지속시간", "속도·방향"] },
  "jump-crouch":      { effects: ["개체 이동", "변형"], inputs: ["방향키"], timing: ["즉시", "지속"], buxton: ["모델 밖"], reads: ["지속시간", "속도·방향"] },
  /* 2-1 한 번 누름 */
  "single-shot":      { effects: ["발사"], inputs: ["클릭"], timing: ["즉시"], buxton: ["누름"], reads: ["횟수·타이밍"] },
  "click-counter":    { effects: ["셈·누적"], inputs: ["클릭"], timing: ["누적"], buxton: ["누름"], reads: ["횟수·타이밍"] },
  "toggle":           { effects: ["상태 전환"], inputs: ["클릭"], timing: ["즉시"], buxton: ["누름"], reads: ["횟수·타이밍"] },
  "cooldown":         { effects: ["상태 전환"], inputs: ["클릭"], timing: ["감쇠·회복"], buxton: ["누름"], reads: ["횟수·타이밍"] },
  // 찍은 자리도 읽는다
  "click-to-target":  { effects: ["개체 이동"], inputs: ["클릭"], timing: ["지연"], buxton: ["누름"], reads: ["횟수·타이밍", "존재·위치"] },
  "double-tap-like":  { effects: ["상태 전환"], inputs: ["더블클릭"], timing: ["즉시"], buxton: ["누름"], reads: ["횟수·타이밍"] },
  "inline-edit":      { effects: ["상태 전환"], inputs: ["더블클릭", "타이핑"], timing: ["즉시"], buxton: ["누름"], reads: ["횟수·타이밍"] },
  "context-menu":     { effects: ["드러내기"], inputs: ["우클릭"], timing: ["즉시"], buxton: ["누름"], reads: ["횟수·타이밍"] },
  "button-mash":      { effects: ["셈·누적"], inputs: ["키 홀드·연타", "클릭"], timing: ["누적"], buxton: ["누름"], reads: ["횟수·타이밍"] },
  "randomizer":       { effects: ["상태 전환"], inputs: ["클릭"], timing: ["지연"], buxton: ["누름"], reads: ["횟수·타이밍"] },
  /* 2-2 고르고 엮기 */
  "filter-chips":     { effects: ["상태 전환", "드러내기"], inputs: ["클릭"], timing: ["즉시"], buxton: ["누름"], reads: ["선택의 집합"] },
  "tabs-accordion":   { effects: ["드러내기"], inputs: ["클릭"], timing: ["즉시"], buxton: ["누름"], reads: ["선택의 집합"] },
  "carousel":         { effects: ["시야 이동"], inputs: ["방향키", "클릭"], timing: ["즉시"], buxton: ["누름", "모델 밖"], reads: ["선택의 집합"] },
  "configurator":     { effects: ["상태 전환", "변형"], inputs: ["클릭"], timing: ["즉시"], buxton: ["누름"], reads: ["선택의 집합"] },
  "branching-choice": { effects: ["상태 전환"], inputs: ["클릭"], timing: ["즉시"], buxton: ["누름"], reads: ["선택의 집합"] },
  "step-sequencer":   { effects: ["소리", "상태 전환"], inputs: ["클릭"], timing: ["지속"], buxton: ["누름"], reads: ["선택의 집합"] },
  "crafting":         { effects: ["생성·소멸"], inputs: ["클릭"], timing: ["누적"], buxton: ["누름", "놓음"], reads: ["선택의 집합"] },
  "undo-redo":        { effects: ["상태 전환"], inputs: ["클릭", "키 순서·조합"], timing: ["즉시"], buxton: ["누름", "모델 밖"], reads: ["선택의 집합"] },
  /* 2-3 키의 문법 */
  "shortcut":         { effects: ["상태 전환"], inputs: ["키 순서·조합"], timing: ["즉시"], buxton: ["모델 밖"], reads: ["순서·조합"] },
  "cheat-code":       { effects: ["드러내기"], inputs: ["키 순서·조합"], timing: ["누적"], buxton: ["모델 밖"], reads: ["순서·조합"] },
  "passcode":         { effects: ["드러내기"], inputs: ["키 순서·조합"], timing: ["누적"], buxton: ["모델 밖"], reads: ["순서·조합"] },
  "keyboard-instrument": { effects: ["소리", "생성·소멸"], inputs: ["타이핑"], timing: ["즉시"], buxton: ["모델 밖"], reads: ["순서·조합"] },
  "chat":             { effects: ["응답"], inputs: ["타이핑"], timing: ["지연"], buxton: ["모델 밖"], reads: ["순서·조합"] },
  /* 제3부 개체가 스스로 움직인다 */
  // "변형·크기" → 변형 + 크기·회전
  "proximity":        { effects: ["변형", "크기·회전"], inputs: ["마우스 움직임", "누르고 움직이기"], timing: ["즉시"], buxton: ["추적 중"], reads: ["거리"] },
  "magnet":           { effects: ["개체 이동"], inputs: ["마우스 움직임", "누르고 움직이기"], timing: ["지연"], buxton: ["추적 중"], reads: ["거리"] },
  "flee":             { effects: ["개체 이동"], inputs: ["마우스 움직임", "누르고 움직이기"], timing: ["지연"], buxton: ["추적 중"], reads: ["거리"] },
  "cursor-follow":    { effects: ["개체 이동"], inputs: ["마우스 움직임"], timing: ["지연"], buxton: ["추적 중"], reads: ["거리"] },
  // "즉시 / 지연" → 둘 다. 바라보는 방향은 커서의 위치로 정한다
  "look-at":          { effects: ["변형"], inputs: ["마우스 움직임"], timing: ["즉시", "지연"], buxton: ["추적 중"], reads: ["존재·위치"] },
  /* 제4부 입력이 없어도 입력이다 */
  "idle":             { effects: ["응답"], inputs: ["마우스 움직임"], timing: ["대기"], buxton: ["추적 중"], reads: ["부재"] },
  "page-visibility":  { effects: ["드러내기"], inputs: [], timing: ["대기"], buxton: ["모델 밖"], reads: ["환경", "부재"] },
  "viewport-resize":  { effects: ["변형"], inputs: [], timing: ["즉시"], buxton: ["모델 밖"], reads: ["환경"] },
  "multi-window":     { effects: ["응답"], inputs: [], timing: ["즉시"], buxton: ["모델 밖"], reads: ["환경"] }
};

/* ---------- 파생값 ---------- */
export const order = PARTS.flatMap(p => p.groups.flatMap(g => g.items));

/** 항목이 놓인 자리: { part, group } */
export const placeOf = id => {
  for (const part of PARTS) for (const group of part.groups) if (group.items.includes(id)) return { part, group };
  return null;
};

/** 페이지 안 앵커 이름 */
export const partAnchor = part => `part-${part.id.toLowerCase()}`;
export const groupAnchor = group => `g${group.id}`;

/* 필터 주소 이름(?effect= ?input= ?timing=)과 FACETS 키 */
export const FILTERS = [
  { key: "effects", param: "effect", label: "효과" },
  { key: "inputs", param: "input", label: "입력 방식" },
  { key: "timing", param: "timing", label: "시간 구조" }
];

/** 한국어 이름 → 태그 값 { id, ko } */
export const facetValue = (key, ko) => FACETS[key].find(x => x.ko === ko);

/** 항목의 태그를 slug 배열로: tagsOf("pan").effects → ["view"] */
export const tagsOf = id => {
  const row = TAXONOMY[id] || {};
  return Object.fromEntries(Object.keys(FACETS).map(k => [k, (row[k] || []).map(ko => facetValue(k, ko)?.id).filter(Boolean)]));
};

/* 개발 중 점검: 목차와 TAXONOMY가 어긋나거나 어휘 밖의 값이 있으면 알린다 */
if (import.meta.env?.DEV) {
  for (const id of order) if (!TAXONOMY[id]) console.warn(`[catalog] TAXONOMY에 ${id} 행이 없다`);
  for (const [id, row] of Object.entries(TAXONOMY)) {
    if (!order.includes(id)) console.warn(`[catalog] PARTS에 없는 id: ${id}`);
    for (const k of Object.keys(FACETS)) for (const ko of row[k] || []) if (!facetValue(k, ko)) console.warn(`[catalog] ${id}.${k}: 어휘 밖의 값 "${ko}"`);
  }
}
