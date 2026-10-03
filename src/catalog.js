/* ============================================================
   목차와 분류
   - 항목은 src/items/<id>/meta.js(글)와 demo.js(데모)로 나눈다.
   - PARTS: 대분류(누가 움직이는가, 4부) → 중분류(무엇을 읽는가) → 항목 id.
     한 항목은 한 자리에만 둔다. 겹침은 TAXONOMY의 태그로 표현한다.
   - FACETS: 태그 어휘. 무엇이 바뀌나(effects) · 어떻게 조작하나(inputs) · 언제 반응하나(timing)는
     메인 페이지 필터로, 손의 상태(buxton)와 읽는 값(reads)은 데이터로만 쓴다.
   - 화면에 보이는 이름은 비유나 이론 용어 없이 무엇이 어떻게 되는지 그대로 적는다(2026-09 리뉴얼).
     id와 주소 이름은 그대로 두어 예전 링크가 깨지지 않게 한다.
   - TAXONOMY: 항목마다 다섯 가지 태그. 값은 FACETS의 한국어 이름(ko)으로 적는다.
   기준: handoff/theory/인터랙션-모듈-사전-분류체계-리서치.md 6절(6.1 체계, 6.2 목차)
   ============================================================ */

export const PARTS = [
  {
    id: "I", no: "제1부", name: "손으로 움직이기", short: "손으로 움직이기", sub: "화면이 손의 움직임을 그대로 따른다",
    desc: "사용자가 마우스를 움직이거나 끌거나 키를 누르고 있는 동안, 화면 속 대상이나 보이는 영역이 그 움직임을 그대로 따른다. 사용자가 손을 움직인 만큼 값이 바뀌므로, 조작하는 동안 결과도 함께 바뀐다. 벤 슈나이더만(Ben Shneiderman)은 화면이 손의 움직임을 그대로 따르는 방식을 직접 조작(direct manipulation)이라고 불렀다.",
    groups: [
      { id: "1-1", name: "커서 위치에 따라 바뀐다", sub: "누르지 않고 올려 두기만",
        desc: "사용자는 마우스 버튼을 누르지 않고 커서를 올리거나 움직이기만 한다. 커서가 지금 화면의 어디에 있는지에 따라 화면 속 대상의 모양이나 화면에 보이는 부분이 바뀐다.",
        items: ["cursor-morph", "crosshair", "before-after", "mouse-parallax", "mouse-look"] },
      { id: "1-2", name: "손잡이를 끌어 값 정하기", sub: "패드·조이스틱·노브",
        desc: "사용자가 패드 위의 점, 조이스틱, 노브 같은 손잡이를 누른 채 옮겨 값을 정한다. 손잡이가 거쳐 온 길이 아니라 손잡이가 지금 놓인 자리가 값이 된다.",
        items: ["xy-pad", "virtual-joystick", "rotary-knob"] },
      { id: "1-3", name: "지나간 길이 화면에 남는다", sub: "그리기·긁기·궤적",
        desc: "커서가 움직인 길을 따라 선이 그려지거나, 덮개가 벗겨지거나, 자국이 잠시 남는다. 커서가 어디서 어디로, 어떤 길로 지나갔는지가 결과를 정한다.",
        items: ["freehand", "stamp-brush", "line-tool", "shape-tool", "scratch-off", "rub", "text-selection", "cursor-trail", "cursor-emitter"] },
      { id: "1-4", name: "대상을 집어 옮기고 놓는다", sub: "놓은 자리가 결과를 정한다",
        desc: "사용자가 화면 속 대상을 집어서 옮기고 놓는다. 무엇을 어디에 놓았는지, 처음 자리에서 얼마나 떼어 놓았는지가 결과를 정한다.",
        items: ["drag-and-drop", "drop-zone", "reorder", "break-apart", "merge", "node-wiring", "mesh-warp", "pull-out", "squeeze"] },
      { id: "1-5", name: "보이는 영역을 옮긴다", sub: "대상은 그대로, 화면이 움직인다",
        desc: "대상 하나를 옮기는 것이 아니라 화면에 보이는 영역 전체가 움직인다. 사용자가 끌기, 휠, 스크롤, 키로 화면에 보이는 영역을 옮기고, 돌리고, 확대·축소한다.",
        items: ["pan", "orbit", "keyboard-orbit", "zoom", "double-click-zoom", "rotate-view", "scroll-driven", "scroll-scrub"] },
      { id: "1-6", name: "움직인 빠르기와 방향을 읽는다", sub: "던지기·밀기·흔들기",
        desc: "컴퓨터가 마우스 움직임의 빠르기와 방향을 읽는다. 사용자가 손을 놓는 순간의 속도, 민 방향, 좌우로 방향을 바꾼 횟수가 결과를 정한다.",
        items: ["fling", "slingshot", "swipe", "shake-to-cancel"] },
      { id: "1-7", name: "누르고 있는 시간을 읽는다", sub: "누르는 동안 쌓이거나 계속된다",
        desc: "컴퓨터가 사용자가 버튼이나 키를 누르고 있는 시간을 읽는다. 사용자가 누르는 동안 값이 쌓이거나 동작이 계속되고, 손을 떼면 동작이 멈추거나 쌓인 값만큼의 동작이 한 번에 일어난다.",
        items: ["press-and-hold", "charge-shot", "auto-fire", "directional-move", "jump-crouch"] }
    ]
  },
  {
    id: "II", no: "제2부", name: "눌러서 명령하기", short: "눌러서 명령하기", sub: "누를 때마다 명령이 실행된다",
    desc: "사용자가 한 번 누르는 동작이 명령 하나로 이어진다. 사용자가 누르면 정해진 일이 한 번 일어나고, 무엇을 몇 번, 어떤 차례로 눌렀는지가 결과를 정한다. 빌 버플랭크(Bill Verplank)는 누를 때마다 명령 하나가 실행되는 방식을 손잡이처럼 계속 조절하는 방식과 구별해 버튼(button)형 조작이라고 불렀다.",
    groups: [
      { id: "2-1", name: "한 번 누르면 한 번 일어난다", sub: "몇 번, 어떤 간격으로 눌렀나",
        desc: "사용자가 한 번 누르면 정해진 일이 한 번 일어난다. 컴퓨터는 사용자가 몇 번 눌렀는지, 어떤 간격으로 눌렀는지를 읽는다.",
        items: ["single-shot", "click-counter", "toggle", "cooldown", "click-to-target", "double-tap-like", "inline-edit", "context-menu", "button-mash", "randomizer"] },
      { id: "2-2", name: "골라 둔 것들이 결과를 정한다", sub: "필터·탭·옵션 고르기",
        desc: "사용자의 조작 하나하나는 클릭이지만, 컴퓨터가 읽는 것은 지금 무엇을 골라 두었는가다. 켜 둔 필터, 열어 둔 탭, 고른 옵션이 모여 결과를 만든다.",
        items: ["filter-chips", "tabs-accordion", "carousel", "configurator", "branching-choice", "step-sequencer", "crafting", "undo-redo"] },
      { id: "2-3", name: "키를 누른 순서와 조합", sub: "단축키·암호·타이핑",
        desc: "컴퓨터는 사용자가 어떤 키를 어떤 차례로, 또는 동시에 눌렀는지를 읽는다. 키가 모여 명령, 암호, 문장이 된다.",
        items: ["shortcut", "cheat-code", "passcode", "keyboard-instrument", "chat"] }
    ]
  },
  {
    id: "III", no: "제3부", name: "개체가 스스로 움직인다", short: "스스로 움직이는 개체", sub: "개체가 커서 쪽으로 다가오거나 피한다",
    desc: "사용자는 커서를 어디에 두는지만 정한다. 화면 속 개체가 저마다 속도와 관성, 규칙을 갖고 커서에 다가오거나 달아나거나 커서 쪽을 바라본다. 제3부의 항목은 크레이그 레이놀즈(Craig Reynolds)가 새 떼 시뮬레이션에서 정리한 조향 행동(steering behavior)을 바탕으로 한다.",
    groups: [
      { id: "3", name: null, sub: null, desc: null,
        items: ["proximity", "magnet", "flee", "cursor-follow", "look-at"] }
    ]
  },
  {
    id: "IV", no: "제4부", name: "조작하지 않아도 반응한다", short: "조작 없이 반응", sub: "컴퓨터가 입력 없는 시간과 창 상태를 읽는다",
    desc: "사용자의 동작이 아니라 아무것도 하지 않고 지난 시간, 탭을 떠났는지, 창의 크기나 위치 같은 상태가 반응을 일으킨다. 댄 새퍼(Dan Saffer)는 사람이 아니라 시스템의 상태가 반응을 시작하는 경우를 시스템 트리거(system trigger)라고 불렀다.",
    groups: [
      { id: "4", name: null, sub: null, desc: null,
        items: ["idle", "page-visibility", "viewport-resize", "multi-window"] }
    ]
  }
];

/* 태그 어휘. id는 주소(?effect=view)에 쓰는 고정 이름(바꾸지 않는다), ko는 화면에 보이는 이름,
   desc는 칩에 마우스를 올렸을 때 보이는 풀이다. TAXONOMY에는 ko로 적는다 */
const v = (id, ko, desc) => ({ id, ko, desc });
export const FACETS = {
  // 무엇이 바뀌는가 (필터)
  effects: [
    v("view", "보이는 영역 이동", "화면에 보이는 범위가 옮겨진다. 대상은 그대로 있다."),
    v("scale", "크기·회전", "대상이나 보이는 영역이 커지고 작아지거나 돈다."),
    v("move", "개체 이동", "화면 속 개체의 자리가 바뀐다."),
    v("morph", "모양 변화", "개체의 모양, 색, 기울기가 바뀐다."),
    v("trace", "흔적", "지나간 자리에 선이나 자국이 남는다."),
    v("reveal", "드러내기", "가려져 있던 내용이나 메뉴가 보이게 된다."),
    v("spawn", "생성·소멸", "개체가 새로 생기거나 없어진다."),
    v("launch", "발사", "개체가 튀어 나가 스스로 날아간다."),
    v("count", "수 세기·쌓기", "누른 횟수나 시간이 숫자나 게이지로 쌓인다."),
    v("state", "상태 전환", "켜짐·꺼짐, 열림·닫힘처럼 정해진 상태 사이를 오간다."),
    v("sound", "소리", "소리가 난다."),
    v("respond", "응답", "사용자의 입력이나 상태에 맞춰 화면에 글이나 개체의 동작이 나타난다.")
  ],
  // 어떻게 조작하는가 (필터). 예전 17분류에서 「버튼」「탭·창」을 뺀 것. id는 예전 분류 id를 이어 쓴다
  inputs: [
    v("hover", "커서 올리기", "누르지 않고 커서를 대상 위에 올린다."),
    v("click", "클릭", "마우스 버튼을 한 번 눌렀다 뗀다."),
    v("dblclick", "더블클릭", "마우스 버튼을 빠르게 두 번 누른다."),
    v("rightclick", "우클릭", "마우스 오른쪽 버튼을 누른다."),
    v("move", "마우스 움직임", "누르지 않고 마우스를 움직인다."),
    v("pressmove", "누르고 움직이기", "마우스 버튼을 누른 채로 움직인다. 화면 속 대상을 집지 않아도 된다."),
    v("drag", "드래그 앤 드롭", "대상을 집어서 끌고 가 놓는다."),
    v("scroll", "스크롤·휠", "휠이나 트랙패드로 스크롤한다."),
    v("arrow", "방향키", "방향키나 WASD를 누른다."),
    v("keyhold", "키 누르고 있기·연타", "키를 계속 누르고 있거나 빠르게 여러 번 누른다."),
    v("keycombo", "키 순서·조합", "여러 키를 정해진 차례로, 또는 동시에 누른다."),
    v("typing", "타이핑", "키보드로 글자를 입력한다.")
  ],
  // 언제 반응하는가 (필터)
  timing: [
    v("instant", "즉시", "화면이 입력과 동시에 바뀐다."),
    v("sustain", "하는 동안 계속", "사용자가 누르거나 움직이는 동안 반응이 계속 이어진다."),
    v("release", "놓는 순간", "사용자가 버튼이나 키에서 손을 떼는 순간에 결과가 정해진다."),
    v("delay", "시간차를 두고", "화면 속 대상이 입력보다 조금 늦게 바뀐다."),
    v("accumulate", "쌓이면서", "사용자의 입력이 여러 번 쌓여야 결과가 나온다."),
    v("decay", "서서히 줄고 회복", "생긴 효과가 시간이 지나며 서서히 사라지거나 원래대로 돌아온다."),
    v("wait", "기다린 뒤", "아무 입력 없이 시간이 지나야 반응한다.")
  ],
  // 손의 상태 (데이터만). Bill Buxton의 3상태 모델에서 왔다. 나중에 터치 대응 문장을 만들 때 쓴다
  buxton: [
    v("tracking", "누르지 않고 움직임", "버튼을 누르지 않은 채 커서만 움직이는 상태."),
    v("press", "누름", "버튼이나 키를 누르는 순간."),
    v("dragging", "누른 채 움직임", "버튼을 누른 채 움직이는 상태."),
    v("release", "놓음", "누르던 버튼을 떼는 순간."),
    v("outside", "마우스 밖 입력", "키보드, 휠, 창 상태처럼 마우스 버튼과 커서로 설명되지 않는 입력.")
  ],
  // 무엇을 읽는가 (데이터만. 중분류의 근거)
  reads: [
    v("position", "위치", "커서나 대상이 지금 어디에 있는가."),
    v("distance", "거리", "기준점이나 커서에서 얼마나 떨어져 있는가."),
    v("path", "지나간 경로", "어디서 어디로, 어떤 길로 지나갔는가."),
    v("velocity", "빠르기·방향", "얼마나 빨리, 어느 쪽으로 움직였는가."),
    v("duration", "누른 시간", "얼마나 오래 누르고 있었는가."),
    v("count", "횟수·간격", "몇 번, 어떤 간격으로 눌렀는가."),
    v("sequence", "순서·조합", "어떤 키를 어떤 차례로, 또는 함께 눌렀는가."),
    v("selection", "골라 둔 것들", "지금 무엇을 켜 두거나 골라 두었는가."),
    v("absence", "입력 없음", "아무 입력이 없는 시간이 얼마나 지났는가."),
    v("environment", "창·탭 상태", "창의 크기와 위치, 탭이 보이는지 같은 브라우저 상태.")
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
   - 위 규칙의 이름은 리서치 문서의 옛 이름이다. 2026-09 리뉴얼로 화면 이름이 바뀌었다:
     시야 이동 → 보이는 영역 이동, 변형 → 모양 변화, 셈·누적 → 수 세기·쌓기, 올리기 → 커서 올리기,
     키 홀드·연타 → 키 누르고 있기·연타, 지속 → 하는 동안 계속, 지연 → 시간차를 두고, 누적 → 쌓이면서,
     감쇠·회복 → 서서히 줄고 회복, 대기 → 기다린 뒤, 추적 중 → 누르지 않고 움직임, 끌기 중 → 누른 채 움직임,
     모델 밖 → 마우스 밖 입력, 존재·위치 → 위치, 경로 → 지나간 경로, 속도·방향 → 빠르기·방향,
     지속시간 → 누른 시간, 횟수·타이밍 → 횟수·간격, 선택의 집합 → 골라 둔 것들, 부재 → 입력 없음, 환경 → 창·탭 상태.
   - scroll-scrub은 6.2 표에 없다(교수 결정으로 1-5 scroll-driven 뒤에 둔다).
   ============================================================ */
export const TAXONOMY = {
  /* 1-1 커서 위치에 따라 바뀐다 */
  "cursor-morph":     { effects: ["모양 변화"], inputs: ["커서 올리기"], timing: ["즉시"], buxton: ["누르지 않고 움직임"], reads: ["위치"] },
  "crosshair":        { effects: ["드러내기"], inputs: ["마우스 움직임"], timing: ["즉시"], buxton: ["누르지 않고 움직임"], reads: ["위치"] },
  "before-after":     { effects: ["드러내기"], inputs: ["마우스 움직임", "누르고 움직이기"], timing: ["즉시"], buxton: ["누르지 않고 움직임", "누른 채 움직임"], reads: ["위치"] },
  "mouse-parallax":   { effects: ["보이는 영역 이동"], inputs: ["마우스 움직임"], timing: ["즉시"], buxton: ["누르지 않고 움직임"], reads: ["위치"] },
  "mouse-look":       { effects: ["보이는 영역 이동"], inputs: ["마우스 움직임"], timing: ["즉시"], buxton: ["누르지 않고 움직임"], reads: ["위치"] },
  /* 1-2 손잡이를 끌어 값 정하기 */
  "xy-pad":           { effects: ["개체 이동", "상태 전환"], inputs: ["누르고 움직이기"], timing: ["즉시"], buxton: ["누른 채 움직임"], reads: ["위치"] },
  // 새 정의(7.2): 기준점과의 차이 벡터 → 위치 + 거리
  "virtual-joystick": { effects: ["개체 이동"], inputs: ["누르고 움직이기"], timing: ["하는 동안 계속"], buxton: ["누른 채 움직임"], reads: ["위치", "거리"] },
  "rotary-knob":      { effects: ["크기·회전"], inputs: ["드래그 앤 드롭"], timing: ["즉시"], buxton: ["누른 채 움직임"], reads: ["위치"] },
  /* 1-3 지나간 길이 화면에 남는다 */
  "freehand":         { effects: ["흔적"], inputs: ["누르고 움직이기"], timing: ["즉시"], buxton: ["누른 채 움직임"], reads: ["지나간 경로"] },
  "stamp-brush":      { effects: ["흔적", "생성·소멸"], inputs: ["누르고 움직이기"], timing: ["즉시"], buxton: ["누른 채 움직임"], reads: ["지나간 경로"] },
  "line-tool":        { effects: ["흔적"], inputs: ["드래그 앤 드롭"], timing: ["즉시"], buxton: ["누른 채 움직임", "놓음"], reads: ["지나간 경로"] },
  "shape-tool":       { effects: ["흔적"], inputs: ["드래그 앤 드롭"], timing: ["즉시"], buxton: ["누른 채 움직임", "놓음"], reads: ["지나간 경로"] },
  "scratch-off":      { effects: ["드러내기"], inputs: ["누르고 움직이기"], timing: ["쌓이면서"], buxton: ["누른 채 움직임"], reads: ["지나간 경로"] },
  "rub":              { effects: ["드러내기", "수 세기·쌓기"], inputs: ["누르고 움직이기"], timing: ["쌓이면서"], buxton: ["누른 채 움직임"], reads: ["지나간 경로"] },
  "text-selection":   { effects: ["흔적"], inputs: ["누르고 움직이기"], timing: ["즉시"], buxton: ["누른 채 움직임"], reads: ["지나간 경로"] },
  "cursor-trail":     { effects: ["흔적"], inputs: ["마우스 움직임"], timing: ["서서히 줄고 회복"], buxton: ["누르지 않고 움직임"], reads: ["지나간 경로"] },
  "cursor-emitter":   { effects: ["생성·소멸"], inputs: ["마우스 움직임", "누르고 움직이기"], timing: ["서서히 줄고 회복"], buxton: ["누르지 않고 움직임"], reads: ["지나간 경로"] },
  /* 1-4 대상을 집어 옮기고 놓는다 */
  "drag-and-drop":    { effects: ["개체 이동"], inputs: ["드래그 앤 드롭"], timing: ["즉시"], buxton: ["누른 채 움직임", "놓음"], reads: ["위치"] },
  "drop-zone":        { effects: ["상태 전환"], inputs: ["드래그 앤 드롭"], timing: ["놓는 순간"], buxton: ["놓음"], reads: ["위치"] },
  "reorder":          { effects: ["개체 이동"], inputs: ["드래그 앤 드롭"], timing: ["즉시"], buxton: ["누른 채 움직임", "놓음"], reads: ["위치"] },
  "break-apart":      { effects: ["생성·소멸"], inputs: ["드래그 앤 드롭"], timing: ["놓는 순간"], buxton: ["놓음"], reads: ["거리"] },
  "merge":            { effects: ["생성·소멸"], inputs: ["드래그 앤 드롭"], timing: ["놓는 순간"], buxton: ["놓음"], reads: ["위치"] },
  // "흔적·상태(연결)" → 흔적 + 상태 전환
  "node-wiring":      { effects: ["흔적", "상태 전환"], inputs: ["드래그 앤 드롭"], timing: ["즉시"], buxton: ["누른 채 움직임", "놓음"], reads: ["위치"] },
  "mesh-warp":        { effects: ["모양 변화"], inputs: ["드래그 앤 드롭"], timing: ["즉시"], buxton: ["누른 채 움직임"], reads: ["위치"] },
  // "생성·소멸(분리) / 상태 전환(문턱 실행)" → 두 하위 변형의 효과를 모두. 변위가 문턱을 넘는가 → 거리
  "pull-out":         { effects: ["생성·소멸", "상태 전환"], inputs: ["누르고 움직이기", "드래그 앤 드롭"], timing: ["놓는 순간"], buxton: ["누른 채 움직임", "놓음"], reads: ["거리"] },
  // 새 정의(7.2): 움직이는 세기로 차오르고 멈추면 빠지는 게이지 → 속도·방향
  "squeeze":          { effects: ["모양 변화", "생성·소멸"], inputs: ["누르고 움직이기"], timing: ["서서히 줄고 회복", "쌓이면서"], buxton: ["누른 채 움직임"], reads: ["빠르기·방향"] },
  /* 1-5 보이는 영역을 옮긴다 (끌기·휠로 옮긴 양 = 거리, 스크롤 위치 = 위치) */
  "pan":              { effects: ["보이는 영역 이동"], inputs: ["누르고 움직이기", "드래그 앤 드롭"], timing: ["즉시"], buxton: ["누른 채 움직임"], reads: ["거리"] },
  "orbit":            { effects: ["보이는 영역 이동", "크기·회전"], inputs: ["마우스 움직임", "누르고 움직이기"], timing: ["즉시"], buxton: ["누른 채 움직임"], reads: ["거리"] },
  // "지속(단계 각도)" → 지속. 누른 방향키 = 속도·방향
  "keyboard-orbit":   { effects: ["보이는 영역 이동", "크기·회전"], inputs: ["방향키"], timing: ["하는 동안 계속"], buxton: ["마우스 밖 입력"], reads: ["빠르기·방향"] },
  "zoom":             { effects: ["크기·회전", "보이는 영역 이동"], inputs: ["스크롤·휠"], timing: ["즉시"], buxton: ["마우스 밖 입력"], reads: ["거리"] },
  "double-click-zoom":{ effects: ["크기·회전", "보이는 영역 이동"], inputs: ["더블클릭"], timing: ["즉시"], buxton: ["누름"], reads: ["위치", "횟수·간격"] },
  "rotate-view":      { effects: ["크기·회전"], inputs: ["스크롤·휠"], timing: ["즉시"], buxton: ["마우스 밖 입력"], reads: ["거리"] },
  "scroll-driven":    { effects: ["보이는 영역 이동", "모양 변화"], inputs: ["스크롤·휠"], timing: ["즉시"], buxton: ["마우스 밖 입력"], reads: ["위치"] },
  "scroll-scrub":     { effects: ["모양 변화"], inputs: ["스크롤·휠"], timing: ["즉시"], buxton: ["마우스 밖 입력"], reads: ["위치"] },
  /* 1-6 움직인 빠르기와 방향을 읽는다 */
  "fling":            { effects: ["개체 이동", "발사"], inputs: ["드래그 앤 드롭"], timing: ["놓는 순간", "서서히 줄고 회복"], buxton: ["놓음"], reads: ["빠르기·방향"] },
  // 당긴 방향(속도·방향)과 당긴 길이(거리)를 함께 읽는다
  "slingshot":        { effects: ["발사"], inputs: ["드래그 앤 드롭"], timing: ["놓는 순간"], buxton: ["누른 채 움직임", "놓음"], reads: ["빠르기·방향", "거리"] },
  "swipe":            { effects: ["상태 전환"], inputs: ["드래그 앤 드롭"], timing: ["놓는 순간"], buxton: ["놓음"], reads: ["빠르기·방향"] },
  // "누적(반전 횟수)" → 누적. 새 정의(7.2): 짧은 시간 안 방향 반전 N회
  "shake-to-cancel":  { effects: ["상태 전환"], inputs: ["마우스 움직임"], timing: ["쌓이면서"], buxton: ["누르지 않고 움직임", "누른 채 움직임"], reads: ["빠르기·방향", "횟수·간격"] },
  /* 1-7 누르고 있는 시간을 읽는다 */
  "press-and-hold":   { effects: ["수 세기·쌓기"], inputs: ["클릭", "키 누르고 있기·연타"], timing: ["하는 동안 계속"], buxton: ["누른 채 움직임"], reads: ["누른 시간"] },
  "charge-shot":      { effects: ["발사"], inputs: ["키 누르고 있기·연타", "클릭"], timing: ["하는 동안 계속", "놓는 순간"], buxton: ["누른 채 움직임", "놓음"], reads: ["누른 시간"] },
  "auto-fire":        { effects: ["발사"], inputs: ["누르고 움직이기", "키 누르고 있기·연타"], timing: ["하는 동안 계속"], buxton: ["누른 채 움직임"], reads: ["누른 시간"] },
  "directional-move": { effects: ["개체 이동"], inputs: ["방향키"], timing: ["하는 동안 계속"], buxton: ["마우스 밖 입력"], reads: ["누른 시간", "빠르기·방향"] },
  "jump-crouch":      { effects: ["개체 이동", "모양 변화"], inputs: ["방향키"], timing: ["즉시", "하는 동안 계속"], buxton: ["마우스 밖 입력"], reads: ["누른 시간", "빠르기·방향"] },
  /* 2-1 한 번 누르면 한 번 일어난다 */
  "single-shot":      { effects: ["발사"], inputs: ["클릭"], timing: ["즉시"], buxton: ["누름"], reads: ["횟수·간격"] },
  "click-counter":    { effects: ["수 세기·쌓기"], inputs: ["클릭"], timing: ["쌓이면서"], buxton: ["누름"], reads: ["횟수·간격"] },
  "toggle":           { effects: ["상태 전환"], inputs: ["클릭"], timing: ["즉시"], buxton: ["누름"], reads: ["횟수·간격"] },
  "cooldown":         { effects: ["상태 전환"], inputs: ["클릭"], timing: ["서서히 줄고 회복"], buxton: ["누름"], reads: ["횟수·간격"] },
  // 찍은 자리도 읽는다
  "click-to-target":  { effects: ["개체 이동"], inputs: ["클릭"], timing: ["시간차를 두고"], buxton: ["누름"], reads: ["횟수·간격", "위치"] },
  "double-tap-like":  { effects: ["상태 전환"], inputs: ["더블클릭"], timing: ["즉시"], buxton: ["누름"], reads: ["횟수·간격"] },
  "inline-edit":      { effects: ["상태 전환"], inputs: ["더블클릭", "타이핑"], timing: ["즉시"], buxton: ["누름"], reads: ["횟수·간격"] },
  "context-menu":     { effects: ["드러내기"], inputs: ["우클릭"], timing: ["즉시"], buxton: ["누름"], reads: ["횟수·간격"] },
  "button-mash":      { effects: ["수 세기·쌓기"], inputs: ["키 누르고 있기·연타", "클릭"], timing: ["쌓이면서"], buxton: ["누름"], reads: ["횟수·간격"] },
  "randomizer":       { effects: ["상태 전환"], inputs: ["클릭"], timing: ["시간차를 두고"], buxton: ["누름"], reads: ["횟수·간격"] },
  /* 2-2 골라 둔 것들이 결과를 정한다 */
  "filter-chips":     { effects: ["상태 전환", "드러내기"], inputs: ["클릭"], timing: ["즉시"], buxton: ["누름"], reads: ["골라 둔 것들"] },
  "tabs-accordion":   { effects: ["드러내기"], inputs: ["클릭"], timing: ["즉시"], buxton: ["누름"], reads: ["골라 둔 것들"] },
  "carousel":         { effects: ["보이는 영역 이동"], inputs: ["방향키", "클릭"], timing: ["즉시"], buxton: ["누름", "마우스 밖 입력"], reads: ["골라 둔 것들"] },
  "configurator":     { effects: ["상태 전환", "모양 변화"], inputs: ["클릭"], timing: ["즉시"], buxton: ["누름"], reads: ["골라 둔 것들"] },
  "branching-choice": { effects: ["상태 전환"], inputs: ["클릭"], timing: ["즉시"], buxton: ["누름"], reads: ["골라 둔 것들"] },
  "step-sequencer":   { effects: ["소리", "상태 전환"], inputs: ["클릭"], timing: ["하는 동안 계속"], buxton: ["누름"], reads: ["골라 둔 것들"] },
  "crafting":         { effects: ["생성·소멸"], inputs: ["클릭"], timing: ["쌓이면서"], buxton: ["누름", "놓음"], reads: ["골라 둔 것들"] },
  "undo-redo":        { effects: ["상태 전환"], inputs: ["클릭", "키 순서·조합"], timing: ["즉시"], buxton: ["누름", "마우스 밖 입력"], reads: ["골라 둔 것들"] },
  /* 2-3 키를 누른 순서와 조합 */
  "shortcut":         { effects: ["상태 전환"], inputs: ["키 순서·조합"], timing: ["즉시"], buxton: ["마우스 밖 입력"], reads: ["순서·조합"] },
  "cheat-code":       { effects: ["드러내기"], inputs: ["키 순서·조합"], timing: ["쌓이면서"], buxton: ["마우스 밖 입력"], reads: ["순서·조합"] },
  "passcode":         { effects: ["드러내기"], inputs: ["키 순서·조합"], timing: ["쌓이면서"], buxton: ["마우스 밖 입력"], reads: ["순서·조합"] },
  "keyboard-instrument": { effects: ["소리", "생성·소멸"], inputs: ["타이핑"], timing: ["즉시"], buxton: ["마우스 밖 입력"], reads: ["순서·조합"] },
  "chat":             { effects: ["응답"], inputs: ["타이핑"], timing: ["시간차를 두고"], buxton: ["마우스 밖 입력"], reads: ["순서·조합"] },
  /* 제3부 개체가 스스로 움직인다 */
  // "변형·크기" → 변형 + 크기·회전
  "proximity":        { effects: ["모양 변화", "크기·회전"], inputs: ["마우스 움직임", "누르고 움직이기"], timing: ["즉시"], buxton: ["누르지 않고 움직임"], reads: ["거리"] },
  "magnet":           { effects: ["개체 이동"], inputs: ["마우스 움직임", "누르고 움직이기"], timing: ["시간차를 두고"], buxton: ["누르지 않고 움직임"], reads: ["거리"] },
  "flee":             { effects: ["개체 이동"], inputs: ["마우스 움직임", "누르고 움직이기"], timing: ["시간차를 두고"], buxton: ["누르지 않고 움직임"], reads: ["거리"] },
  "cursor-follow":    { effects: ["개체 이동"], inputs: ["마우스 움직임"], timing: ["시간차를 두고"], buxton: ["누르지 않고 움직임"], reads: ["거리"] },
  // "즉시 / 지연" → 둘 다. 바라보는 방향은 커서의 위치로 정한다
  "look-at":          { effects: ["모양 변화"], inputs: ["마우스 움직임"], timing: ["즉시", "시간차를 두고"], buxton: ["누르지 않고 움직임"], reads: ["위치"] },
  /* 제4부 조작하지 않아도 반응한다 */
  "idle":             { effects: ["응답"], inputs: ["마우스 움직임"], timing: ["기다린 뒤"], buxton: ["누르지 않고 움직임"], reads: ["입력 없음"] },
  "page-visibility":  { effects: ["드러내기"], inputs: [], timing: ["기다린 뒤"], buxton: ["마우스 밖 입력"], reads: ["창·탭 상태", "입력 없음"] },
  "viewport-resize":  { effects: ["모양 변화"], inputs: [], timing: ["즉시"], buxton: ["마우스 밖 입력"], reads: ["창·탭 상태"] },
  "multi-window":     { effects: ["응답"], inputs: [], timing: ["즉시"], buxton: ["마우스 밖 입력"], reads: ["창·탭 상태"] }
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
  { key: "effects", param: "effect", label: "무엇이 바뀌나", short: "바뀌는 것" },
  { key: "inputs", param: "input", label: "어떻게 조작하나", short: "조작" },
  { key: "timing", param: "timing", label: "언제 반응하나", short: "반응 시점" }
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
