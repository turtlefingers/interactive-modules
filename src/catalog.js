/* ============================================================
   목차: 입력 방식(카테고리)과 항목 순서, 태그 어휘
   - 항목은 src/items/<id>/meta.js(글)와 demo.js(데모)로 나눈다.
   - 한 항목이 여러 입력 방식에 속하면 여러 카테고리에 같은 id를 넣는다.
     (첫 번째로 등장하는 카테고리가 그 항목의 대표 카테고리다)
   ============================================================ */
export const categories = [
  { id: "hover", name: "올리기", en: "Hover",
    desc: "누르지 않고 커서를 올려두기만 해도 반응한다. 이 영역은 다룰 수 있다는 신호다.",
    items: ["cursor-morph"] },
  { id: "press", name: "누르기", en: "Press & Hold",
    desc: "누르고 있는 시간이 곧 입력이다. 누르는 동안 쌓이거나 계속 나온다.",
    items: ["press-and-hold", "auto-fire"] },
  { id: "click", name: "클릭", en: "Click",
    desc: "한 번 누르고 떼는 가장 기본 입력이다. 횟수, 순간, 위치를 읽는다.",
    items: ["click-counter", "single-shot", "toggle", "cooldown", "click-to-target"] },
  { id: "dblclick", name: "더블클릭", en: "Double Click",
    desc: "빠르게 두 번 누른다. 한 번 클릭과 구분되는 한 단계 깊은 동작에 쓴다.",
    items: ["double-click-zoom", "double-tap-like", "inline-edit"] },
  { id: "rightclick", name: "우클릭", en: "Right Click",
    desc: "보조 버튼이다. 기본 메뉴를 대신하거나 숨은 층을 연다.",
    items: ["context-menu", "easter-egg"] },
  { id: "move", name: "마우스 움직임", en: "Mouse Move",
    desc: "누르지 않고 움직이기만 한다. 커서의 위치, 방향, 속도, 거리를 읽는다.",
    items: ["cursor-follow", "cursor-trail", "look-at", "mouse-look", "mouse-parallax", "shake-to-cancel", "proximity", "magnet", "flee", "orbit", "cursor-emitter", "before-after", "crosshair"] },
  { id: "idle", name: "가만히 있기", en: "Idle",
    desc: "아무 입력이 없는 시간도 입력이다. 멈추면 반응하고, 움직이면 깨어난다.",
    items: ["idle"] },
  { id: "pressmove", name: "누르고 움직이기", en: "Press & Move",
    desc: "누른 채 움직인다. 지나간 경로와 흔적이 중요하다.",
    items: ["pan", "scratch-off", "proximity", "magnet", "flee", "rub", "squeeze", "orbit", "pull-out", "freehand", "stamp-brush", "cursor-emitter", "text-selection", "xy-pad", "virtual-joystick"] },
  { id: "drag", name: "드래그 앤 드롭", en: "Drag & Drop",
    desc: "대상을 집어서 옮기고 놓는다. 무엇을 어디에 놓는지가 중요하다.",
    items: ["pan", "slingshot", "fling", "drag-and-drop", "break-apart", "merge", "drop-zone", "reorder", "mesh-warp", "node-wiring", "line-tool", "shape-tool", "rotary-knob", "swipe", "pull-out"] },
  { id: "scroll", name: "스크롤", en: "Scroll",
    desc: "휠이나 트랙패드로 내린다. 스크롤한 양이 곧 진행도다.",
    items: ["scroll-driven"] },
  { id: "button", name: "버튼", en: "Button",
    desc: "입력은 클릭이지만, 버튼을 어떻게 배치하고 엮느냐가 경험을 만든다.",
    items: ["step-sequencer", "configurator", "branching-choice", "randomizer", "undo-redo", "filter-chips", "tabs-accordion", "crafting"] },
  { id: "arrow", name: "방향키", en: "Arrow Keys",
    desc: "위, 아래, 왼쪽, 오른쪽 네 방향으로 조작한다.",
    items: ["directional-move", "jump-crouch", "carousel", "keyboard-orbit"] },
  { id: "keyhold", name: "키 누르고 있기 · 연타", en: "Key Hold & Mash",
    desc: "키를 누르고 있는 시간이나 누르는 빠르기를 읽는다.",
    items: ["charge-shot", "button-mash"] },
  { id: "keycombo", name: "키 순서 · 조합", en: "Key Sequence & Combo",
    desc: "어떤 키를 어떤 순서로, 또는 동시에 누르는지를 읽는다.",
    items: ["cheat-code", "shortcut", "passcode"] },
  { id: "typing", name: "타이핑", en: "Typing",
    desc: "글자를 입력한다. 키 하나하나가 반응하거나, 쓴 문장이 대화가 된다.",
    items: ["keyboard-instrument", "chat"] },
  { id: "pinch", name: "핀치 · 휠", en: "Pinch & Wheel",
    desc: "두 손가락이나 휠로 크기와 각도를 바꾼다.",
    items: ["zoom", "rotate-view"] },
  { id: "window", name: "탭 · 창", en: "Tab & Window",
    desc: "브라우저 탭과 창 자체가 입력이 된다.",
    items: ["page-visibility", "viewport-resize", "multi-window"] }
];

/* 태그는 이 어휘 안에서만 고른다 (목록 페이지 필터에 쓴다) */
export const TAGS = {
  "입력": ["Mouse", "Keyboard", "Wheel", "Trackpad", "Window"],
  "동작": ["Hover", "Click", "DoubleClick", "RightClick", "Press", "Move", "Drag", "Scroll", "Pinch", "Type", "Idle"],
  "효과": ["Translate", "Rotate", "Scale", "Morph", "State", "Count", "Timer", "Spawn", "Particle", "Physics", "Follow", "Attract", "Repel", "Draw", "Reveal", "Deform", "Launch", "Select", "Snap", "Camera", "Parallax", "Sound", "Data", "UI"]
};

export const catOf = id => categories.find(c => c.items.includes(id));
export const order = [...new Set(categories.flatMap(c => c.items))];
