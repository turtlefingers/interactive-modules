export default {
  name: "스크롤 연동 이동", nameEn: "Scroll-driven Motion",
  aliases: ["Board 이동", "패럴랙스 스크롤", "Parallax Scrolling", "Horizontal Scroll", "가로 스크롤", "Scrollytelling"],
  input: "스크롤 (휠 · 트랙패드)",
  effect: "스크롤한 양만큼 보드와 배경 이동",
  definition: "스크롤한 양만큼 화면 요소를 움직이기",
  hint: "휠이나 트랙패드로 스크롤",
  description: [
    "휠을 굴리거나 트랙패드를 쓸면 그 양이 그대로 이동 거리가 되어 보드가 위아래 또는 옆으로 지나간다. 스크롤한 양이 곧 <strong>진행도</strong>이므로, 사용자는 이야기를 한 장씩 넘기듯 자기 속도로 앞뒤를 오간다.",
    "누른 채 끄는 팬과 결과는 비슷하지만 입력이 다르다. 스크롤은 한 축의 양만 읽기 때문에 길이 정해져 있고, 세로 휠을 <strong>가로 이동으로 바꾸거나</strong> 층마다 속도를 달리하는 <strong>패럴랙스</strong>를 입히기 쉽다. 여러 요소를 진행도에 묶어 이야기를 풀어가면 스크롤리텔링이 된다."
  ],
  uses: [
    "브랜드 소개와 제품 출시 페이지의 스크롤리텔링(Apple 제품 페이지)",
    "세로 휠로 가로로 지나가는 전시 · 포트폴리오 사이트",
    "뉴스 인터랙티브 기사에서 스크롤에 맞춰 그래픽이 바뀌는 구성",
    "배경과 전경의 속도를 달리해 깊이를 주는 패럴랙스 랜딩 페이지와 횡스크롤 게임"
  ],
  designPoints: [
    "휠 한 칸의 크기는 장치마다 다르다(마우스는 한 번에 100px 안팎, 트랙패드는 작은 값이 여러 번). 이동을 조금 늦게 따라오게 하면 거친 휠 입력도 부드럽게 보인다. 너무 늦으면 조작이 미끄럽게 느껴진다.",
    "세로 휠을 가로 이동으로 바꿀 때는 진행 방향을 분명히 보여줘야 한다. 진행 막대나 구간 점으로 지금 어디에 있고 얼마나 남았는지 알린다.",
    "패럴랙스는 층을 두세 개로 제한하고 속도 차이를 과하게 두지 않는다. 층이 많고 차이가 크면 읽기 어렵고 멀미가 난다.",
    "스크롤을 멈췄을 때 가까운 구간에 맞추는 스냅은 한 장씩 넘기는 이야기에 맞지만, 긴 글을 자유롭게 읽는 페이지에서는 방해가 된다."
  ],
  prompts: {
    simple: "스크롤 연동 이동(Scroll-driven Motion) 인터랙션을 만든다. 화면 크기의 구간 다섯 개가 이어진 긴 보드가 있고, 휠이나 트랙패드로 스크롤한 양만큼 보드가 위로 지나가며 아래쪽 막대에 전체 진행도가 채워진다. 누른 채 끄는 팬과 달리 스크롤 한 축의 양만 읽으므로, 세로 휠을 가로 이동으로 바꾸거나 층마다 속도를 달리할 수 있다.",
    detailed: "스크롤 연동 이동(Scroll-driven Motion) 인터랙션을 만든다. 화면 하나 크기의 구간 다섯 개를 세로로 이어 붙인 긴 보드가 있고, 각 구간에는 큰 번호(01~05), 짧은 제목과 설명, 종이 카드 몇 장이 놓여 있다. 짝수 구간은 배경을 아주 조금 어둡게 해서 경계가 보이게 한다. 휠이나 트랙패드를 쓰면 한 번의 입력량(세로 값과 가로 값 중 큰 쪽)을 목표 스크롤 위치에 더하고, 목표는 0부터 전체 길이에서 화면 하나를 뺀 값 사이로 제한한다. 실제 보드 위치는 매 프레임 목표까지 남은 거리의 15%씩 따라가서 부드럽게 멈춘다. 이 인터랙션이 작동하는 동안 페이지 자체는 스크롤되지 않는다. 화면 맨 아래에 높이 3px의 주황 막대를 두어 진행도(현재 위치 ÷ 전체 이동 거리)만큼 왼쪽부터 채우고, 오른쪽 가운데에 구간 수만큼 작은 점을 세로로 놓아 지금 구간을 주황색으로 표시한다. 점을 누르면 그 구간으로 이동한다. 터치에서는 손가락으로 끌어 올린 만큼 앞으로 간다. 보드 앞뒤로 작은 도형 30여 개를 흩어 두되, 기본은 보드와 같은 속도로 움직인다. 반동, 자동 재생, 요소가 나타나는 애니메이션, 그림자와 그라데이션은 넣지 않는다."
  },
  related: [
    { label: "입력만 다른 같은 효과", items: [{ id: "pan", text: "누르고 움직이기 → 이동" }, { id: "mouse-look", text: "마우스 무브 → 시야 이동" }] },
    { label: "헷갈리는 개념", items: [{ id: "mouse-parallax", text: "마우스 패럴랙스 (커서 위치로 층이 어긋남)" }, { id: "zoom", text: "확대 · 축소 (휠로 크기를 바꿈)" }] },
    { label: "함께 쓰이는 것", items: [{ id: "carousel", text: "캐러셀 (한 장씩 넘기기)" }] }
  ],
  references: [
    { name: "MDN — CSS scroll-driven animations", url: "https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_scroll-driven_animations", note: "스크롤 진행도에 애니메이션을 묶는 웹 표준 기능의 설명이다." },
    { name: "Scroll-driven Animations 예제 모음", url: "https://scroll-driven-animations.style/", note: "진행 막대, 가로 이동, 패럴랙스 같은 스크롤 연동 예제를 모아 두었다." },
    { name: "Parallax scrolling (위키백과)", url: "https://en.wikipedia.org/wiki/Parallax_scrolling", note: "고전 게임에서 시작된 층별 속도 차이 기법의 역사다." }
  ],
  tags: ["Wheel", "Trackpad", "Scroll", "Translate", "Parallax"],
  reads: "휠 · 트랙패드의 스크롤 변화량(deltaY, deltaX) — 입력이 들어올 때마다 목표 위치에 더하고, 그 누적값을 전체 길이로 나눈 진행도로 보드를 옮긴다.",
  readouts: [
    { key: "delta", label: "마지막 스크롤 입력량" },
    { key: "scroll", label: "누적 스크롤 위치" },
    { key: "prog", label: "진행도" },
    { key: "sec", label: "지금 구간" }
  ],
  variations: [
    { name: "이동 축", desc: "세로로 그대로 지나가거나, 세로 휠을 가로 이동으로 바꿔 옆으로 지나간다.",
      control: { type: "seg", key: "axis", default: "y", options: [["y", "세로"], ["x", "가로로 변환"]] } },
    { name: "부드러움", desc: "목표 위치를 따라가는 정도다. 낮으면 미끄러지듯 늦게 멈추고, 1이면 입력한 만큼 즉시 움직인다.",
      control: { type: "range", key: "smooth", min: 0.04, max: 1, step: 0.01, default: 0.15, ends: ["부드럽게", "즉시"] } },
    { name: "패럴랙스", desc: "보드 앞의 도형은 더 빠르게, 뒤의 도형은 더 느리게 지나간다. 속도 차이로 깊이가 생긴다.",
      control: { type: "toggle", key: "parallax", default: false } },
    { name: "구간 스냅", desc: "스크롤을 멈추면 가장 가까운 구간의 시작으로 맞춰진다. 한 장씩 넘기는 느낌이 된다.",
      control: { type: "toggle", key: "snap", default: false } }
  ]
};
