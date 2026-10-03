export default {
  name: "자유 그리기", nameEn: "Freehand Drawing",
  aliases: ["선그리기", "Pencil Tool", "Brush Stroke", "펜 도구", "손그림"],
  input: "누르고 움직이기",
  effect: "지나간 궤적이 선으로 남음",
  definition: "누른 채 움직인 궤적을 선으로 남기기",
  hint: "누른 채 움직이면 → 지나간 자리에 선이 남는다",
  description: [
    "사용자가 누른 채 움직이면 포인터가 지나간 자리에 선이 남는다. 포인터는 1초에 수십 번 위치를 알려주고, 자유 그리기는 포인터가 알려준 점들을 이어서 하나의 획을 만든다. 입력점을 다듬지 않으면 손떨림이 선에 그대로 남고, 점들을 매끄럽게 다듬으면 떨림이 줄어든 곡선이 된다.",
    "누른 점에서 커서까지 곧게 늘어나는 <strong>직선 도구</strong>와 달리 자유 그리기는 <strong>지나간 경로 전체</strong>가 결과물이다. 빠르게 그을수록 선이 가늘어지게 하면, 필압 없는 마우스로도 붓이나 만년필처럼 굵기가 달라지는 선을 그릴 수 있다."
  ],
  uses: [
    "그림판, Procreate, 일러스트레이터 연필 도구 같은 드로잉 앱",
    "PDF나 이미지 위에 손글씨로 메모하고 서명하기",
    "캐치마인드, Quick, Draw! 같은 그림 맞히기 게임",
    "화이트보드 협업 툴(Miro, FigJam)의 펜 도구"
  ],
  designPoints: [
    "포인터 입력점을 그대로 이으면 각지고 떨린다. 이전 점 쪽으로 조금씩 끌어당기는 방식(지수 이동 평균)으로 다듬고, 점 사이는 곡선으로 잇는다. 너무 매끄러우면 선이 손보다 늦게 따라온다.",
    "긋는 속도가 빠를수록 선을 가늘게 하면 필압 없는 마우스로도 선 굵기가 달라진다.",
    "잘못 그은 획을 되돌릴 수 있어야 사용자가 실수를 걱정하지 않고 그린다. 되돌리기 버튼과 <code>Ctrl/Cmd + Z</code>를 함께 둔다.",
    "커서는 <code>crosshair</code>나 펜 끝 모양으로 바꿔 그릴 수 있는 면임을 알린다."
  ],
  prompts: {
    simple: "자유 그리기(Freehand Drawing) 인터랙션을 만든다. 누른 채 움직이면 포인터가 지나간 궤적이 선으로 남고, 손을 떼면 한 획이 끝난다. 시작점과 끝점만 잇는 직선 도구와 달리 지나간 경로 전체가 그대로 결과물이 된다.",
    detailed: "자유 그리기(Freehand Drawing) 인터랙션을 만든다. 화면 전체가 그림을 그리는 면이고 커서는 십자 모양이다. 누르는 순간 새 획이 시작되고, 누른 채 움직이는 동안 들어오는 모든 포인터 위치(중간에 합쳐진 이벤트까지)를 1px 이상 떨어진 경우에만 점으로 쌓으며, 손을 떼면 획이 끝난다. 점들은 그대로 잇지 않고 직전의 다듬은 점 쪽으로 끌어당겨(매끄러움 0.5면 새 점을 55%만 반영) 떨림을 줄인 뒤, 점과 점 사이를 중간점을 지나는 곡선으로 잇는다. 선은 기본 5px 굵기의 둥근 끝으로 그린다. 속도에 따른 굵기를 켜면 두 점 사이 속도가 빠를수록 가늘게(기본 굵기의 0.3~1.6배) 그리고 굵기 변화도 부드럽게 한다. 긋는 동안에는 다듬기 전의 원래 입력점을 작은 회색 점으로 보여주고, 손을 떼면 서서히 사라진다. 화면 오른쪽 아래에 '되돌리기'와 '모두 지우기' 버튼을 두고, Ctrl/Cmd+Z로도 마지막 획을 지운다. 지운 획은 짧게 흐려지며 사라진다. 마우스, 터치, 펜에서 모두 같은 방식으로 동작한다. 색 팔레트 창, 도형 인식, 저장 기능은 넣지 않는다."
  },
  related: [
    { label: "헷갈리는 개념", items: [{ id: "line-tool", text: "직선 도구 (두 점을 곧게 이음)" }, { id: "cursor-trail", text: "커서 트레일 (누르지 않아도 잠깐 남는 꼬리)" }] },
    { label: "함께 쓰이는 것", items: [{ id: "stamp-brush", text: "스탬프 브러시 (경로에 모양을 찍음)" }, { id: "undo-redo", text: "실행 취소 · 다시 실행" }, { id: "shape-tool", text: "도형 도구" }] }
  ],
  references: [
    { name: "Quick, Draw!", url: "https://quickdraw.withgoogle.com/", note: "자유 그리기로 그린 그림을 AI가 맞히는 구글의 실험이다." },
    { name: "MDN — Pointer events", url: "https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events", note: "마우스, 터치, 펜 입력을 하나로 다루는 방법과 합쳐진 이벤트를 설명한다." },
    { name: "Draw a Stickman (Episode 1)", url: "https://drawastickman.com/episode1", note: "빈 종이에 마우스로 직접 그린 선이 그대로 졸라맨 주인공이 되어 모험을 떠난다." },
    { name: "Silk", url: "http://weavesilk.com/", note: "누른 채 그린 선이 대칭으로 복제되며 빛나는 실처럼 흘러내려 한 획이 무늬가 된다." }
  ],
  reads: "누른 채 움직이는 동안 들어오는 포인터 위치의 연속(궤적)과 점 사이의 속도 — 손을 떼면 한 획으로 묶는다.",
  readouts: [
    { key: "points", label: "지금 획의 입력점" },
    { key: "speed", label: "긋는 속도" },
    { key: "strokes", label: "획 수" },
    { key: "len", label: "획 길이" }
  ],
  variations: [
    { name: "매끄럽게", desc: "입력점을 다듬는 정도다. 0이면 손떨림까지 그대로 남고, 높이면 곡선이 매끈해지지만 손보다 늦게 따라온다. 이미 그린 획에도 바로 적용된다.",
      control: { type: "range", key: "smooth", min: 0, max: 0.95, step: 0.05, default: 0.5, ends: ["다듬지 않음", "매끈하게"] } },
    { name: "굵기", desc: "선의 기본 굵기다.",
      control: { type: "range", key: "width", min: 1, max: 24, step: 1, default: 5, ends: ["가늘게", "굵게"], unit: "px" } },
    { name: "속도에 따른 굵기", desc: "빠르게 그을수록 가늘어져서 필압이 있는 붓처럼 보인다.",
      control: { type: "toggle", key: "speedWidth", default: false } },
    { name: "색", desc: "새로 긋는 획의 색이다.",
      control: { type: "seg", key: "color", default: "ink", options: [["ink", "먹"], ["accent", "주황"], ["grey", "회색"]] } },
    { name: "서서히 사라짐", desc: "그은 뒤 잠시 뒤에 흐려져 사라진다. 끄면 사라지던 획이 다시 돌아온다.",
      control: { type: "toggle", key: "fade", default: false } }
  ]
};
