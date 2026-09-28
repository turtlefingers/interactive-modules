export default {
  name: "창 크기 반응", nameEn: "Viewport Resize",
  aliases: ["Squash and Stretch", "창 크기에 따라 눌리거나 늘어남", "리사이즈 반응", "반응형 캐릭터"],
  input: "탭 · 창",
  effect: "창 크기에 따라 개체가 눌리거나 늘어남",
  definition: "창을 줄이고 늘리는 대로 찌그러지는 개체",
  hint: "창 모서리를 끌기",
  description: [
    "창의 모서리를 끌어 납작하게 줄이면 안의 캐릭터들이 위에서 눌린 듯 넓적해지고, 좁고 길게 늘리면 따라서 길쭉해진다. 빠르게 줄일수록 더 세게 눌리고, 손을 놓으면 젤리처럼 출렁이다 멈춘다. 창이 <strong>단단한 틀이 아니라 캐릭터를 누르는 손</strong>처럼 느껴진다.",
    "입력은 창의 가로 · 세로 크기와 그 크기가 바뀌는 빠르기다. 반응형 웹처럼 크기에 맞춰 배치를 바꾸는 것과 달리, 여기서는 개체의 모양 자체가 눌리고 늘어난다. 애니메이션 원칙의 '찌그러지고 늘어나기(Squash and Stretch)'를 창 크기에 연결한 것이다."
  ],
  uses: [
    "창을 줄이면 캐릭터나 로고가 눌렸다가 튕겨 나오는 인터랙티브 포트폴리오 사이트",
    "브라우저 창 크기에 맞춰 글자가 늘어나고 줄어드는 가변 글꼴 타이포그래피",
    "창 비율에 따라 가로 한 줄 · 세로 한 줄로 다시 쌓이는 반응형 일러스트",
    "창 크기 자체를 게임의 조작으로 쓰는 실험적 웹 게임"
  ],
  designPoints: [
    "모양은 창의 <strong>비율</strong>(가로 ÷ 세로)에서, 순간적인 찌그러짐은 크기가 바뀌는 <strong>빠르기</strong>에서 온다. 두 가지를 나누면 멈춰 있을 때와 움직일 때가 모두 자연스럽다.",
    "찌그러질 때 부피가 유지되게 한다. 세로로 눌리면 그만큼 가로로 퍼져야 말랑한 물체처럼 보인다.",
    "크기 변화가 끝난 뒤 스프링처럼 출렁이다 멈추면, 방금 일어난 변화가 눈에 남는다.",
    "창 크기 이벤트는 창 전체만 알려준다. 요소 하나의 크기 변화를 읽으려면 <code>ResizeObserver</code>로 그 요소를 지켜본다."
  ],
  prompts: {
    simple: "창 크기 반응(Viewport Resize) 인터랙션을 만든다. 창 안에 둥근 캐릭터 세 개가 바닥에 서 있고, 창을 납작하게 줄이면 캐릭터가 눌려 넓적해지고 좁고 길게 늘리면 길쭉해진다. 크기를 빠르게 바꿀수록 더 세게 찌그러지고, 멈추면 젤리처럼 출렁이다 제 모양을 찾는다.",
    detailed: "창 크기 반응(Viewport Resize) 인터랙션을 만든다. 화면 가운데에 가는 선으로 그린 창(제목 줄에 현재 크기 '640 × 420'을 표시)이 있고, 창 아래쪽 바닥선 위에 크기가 조금씩 다른 둥근 캐릭터 세 개가 두 눈을 뜨고 서 있다. 창의 오른쪽 아래 모서리 손잡이나 오른쪽 · 아래쪽 가장자리를 끌면 창이 가운데를 중심으로 커지고 작아진다. 캐릭터의 모양은 두 가지로 정한다. 첫째, 창의 가로세로 비율이 기준(1.5)보다 넓어질수록 세로로 눌리고, 좁아질수록 세로로 늘어난다. 둘째, 창 높이가 빠르게 줄어드는 순간에는 추가로 더 눌리고, 빠르게 늘어나는 순간에는 더 늘어난다. 세로가 줄어든 만큼 가로는 늘어나 넓이가 유지된다. 모양은 스프링처럼 목표 모양을 따라가서, 크기 변화를 멈추면 두세 번 출렁이다 멈춘다. 많이 눌리면 눈을 '> <' 모양으로 찡그린다. 캐릭터 크기는 창 높이에 맞춰 커지고 작아진다. 실제 브라우저 창 크기를 바꿔도 같은 방식으로 반응한다. 배경 장식, 그림자, 소리 같은 추가 효과는 넣지 않는다."
  },
  related: [
    { label: "같은 탭 · 창 입력", items: [{ id: "page-visibility", text: "탭 이탈 반응" }, { id: "multi-window", text: "멀티 윈도우 (창 위치)" }] },
    { label: "입력만 다른 같은 효과", items: [{ id: "squeeze", text: "누르고 움직이기 → 찌그러뜨리기" }, { id: "mesh-warp", text: "메시 변형" }] }
  ],
  references: [
    { name: "MDN · ResizeObserver", url: "https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver", note: "창 전체가 아니라 요소 하나의 크기 변화를 알려준다." },
    { name: "위키백과 · Squash and stretch", url: "https://en.wikipedia.org/wiki/Squash_and_stretch", note: "디즈니 애니메이션 12원칙의 첫 번째, 찌그러지고 늘어나기다." }
  ],
  tags: ["Window", "Deform", "Physics", "Scale"],
  reads: "창(요소)의 가로 · 세로 크기와 비율, 그리고 크기가 바뀌는 빠르기(초당 px).",
  readouts: [
    { key: "size", label: "창 크기 가로 × 세로" },
    { key: "ratio", label: "가로세로 비율" },
    { key: "speed", label: "크기 변화 px/s" },
    { key: "squash", label: "찌그러짐 %" }
  ],
  variations: [
    { name: "크기 입력", desc: "데모 안의 창 손잡이를 끌거나, 실제 브라우저 창 크기를 바꾼다. 실제 창 방식에서는 데모 창이 무대를 꽉 채운다.",
      control: { type: "seg", key: "source", default: "handle", options: [["handle", "손잡이로"], ["window", "실제 창"]] } },
    { name: "찌그러짐 정도", desc: "비율과 빠르기가 모양을 얼마나 바꿀지 정한다. 0이면 캐릭터는 크기만 바뀐다.",
      control: { type: "range", key: "amount", min: 0, max: 2, step: 0.05, default: 1, ends: ["단단하게", "말랑하게"] } },
    { name: "출렁임", desc: "끄면 목표 모양으로 부드럽게 따라가기만 하고 출렁이지 않는다.",
      control: { type: "toggle", key: "jiggle", default: true } },
    { name: "비율 따라 배치", desc: "넓은 창에서는 한 줄로, 정사각형에 가까우면 피라미드로, 좁은 창에서는 위로 쌓인다.",
      control: { type: "toggle", key: "layout", default: false } }
  ]
};
