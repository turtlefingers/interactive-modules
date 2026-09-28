export default {
  name: "마우스 패럴랙스", nameEn: "Mouse Parallax",
  aliases: ["패럴랙스", "Interactive Parallax", "시차 효과", "Hover Parallax", "깊이감 레이어"],
  input: "마우스 움직임",
  effect: "여러 층이 깊이에 따라 다르게 이동",
  definition: "가까운 층은 많이, 먼 층은 적게 움직이는 화면",
  hint: "커서를 좌우로 움직여보기",
  description: [
    "화면이 하늘, 먼 산, 가까운 산, 언덕, 땅처럼 여러 층으로 나뉘어 있고, 커서를 움직이면 층마다 <strong>다른 양만큼</strong> 움직인다. 가까운 층은 많이, 먼 층은 조금 움직인다. 평평한 화면인데도 고개를 옆으로 기울여 보는 듯한 깊이감이 생긴다.",
    "보드 한 장이 통째로 움직이는 마우스 룩과 달리, 패럴랙스의 핵심은 <strong>층 사이의 움직임 차이(시차)</strong>다. 모든 층이 같은 양만큼 움직이면 깊이감은 사라지고 그냥 화면 이동이 된다. 스크롤로 같은 효과를 내면 스크롤 패럴랙스다."
  ],
  uses: [
    "게임과 영화 홍보 사이트의 첫 화면 풍경",
    "iOS 홈 화면처럼 기기를 기울이면 배경이 아이콘과 다르게 움직이는 배경화면",
    "카드나 포스터 위에 커서를 올리면 안의 그림이 입체적으로 어긋나는 효과",
    "2D 게임의 여러 겹 배경 (가까운 나무는 빨리, 먼 산은 느리게 지나감)"
  ],
  designPoints: [
    "층마다 깊이 값을 정하고, 이동량을 <code>커서 위치 × 깊이 × 세기</code>로 계산한다. 층 사이 비율이 일정해야 자연스럽다.",
    "기본은 커서와 반대 방향이다. 커서를 오른쪽으로 옮기면 시선이 오른쪽으로 돌아간 것처럼 가까운 층이 왼쪽으로 밀린다.",
    "층이 움직여도 가장자리의 빈 곳이 보이지 않도록 각 층을 최대 이동량만큼 화면보다 넓게 그린다.",
    "이동량이 크면 멀미가 나고 글을 읽기 어렵다. 부드럽게 따라가게 하고, 동작 줄이기 설정을 켠 사용자에게는 끈다."
  ],
  prompts: {
    simple: "마우스 패럴랙스(Mouse Parallax) 인터랙션을 만든다. 풍경이 먼 산부터 가까운 땅까지 여러 층으로 나뉘어 있고, 누르지 않고 커서를 움직이면 가까운 층일수록 많이, 먼 층일수록 적게 커서와 반대 방향으로 움직인다. 화면 전체가 같은 양만큼 움직이는 시점 이동과 달리 층 사이의 움직임 차이가 깊이감을 만든다.",
    detailed: "마우스 패럴랙스(Mouse Parallax) 인터랙션을 만든다. 크림색 하늘 위에 해, 먼 산, 가까운 산, 나무가 있는 언덕, 땅, 맨 앞의 풀잎까지 여섯 층이 겹쳐 있고, 먼 층일수록 옅은 회색, 가까울수록 진한 색의 납작한 실루엣이다. 각 층에는 깊이 값(해 0.08, 먼 산 0.25, 가까운 산 0.45, 언덕 0.7, 땅 1.0, 풀잎 1.4)이 있다. 사용자가 누르지 않고 커서를 움직이면, 화면 가운데를 0으로 하고 가장자리를 ±1로 하는 커서의 상대 위치를 구해, 각 층을 커서와 반대 방향으로 (상대 위치 × 깊이 × 60px)만큼 가로로 옮기고, 세로로는 그 절반만큼 옮긴다. 층은 목표 위치로 즉시 가지 않고 매 프레임 남은 거리의 8%씩 다가간다. 각 층은 최대 이동량보다 넓게 그려서 가장자리의 빈 곳이 보이지 않게 한다. 커서가 화면 밖으로 나가면 모든 층이 천천히 제자리로 돌아온다. 터치에서는 손가락이 닿은 위치를 쓴다. 누르거나 스크롤할 필요는 없으며, 화면 전체의 입체 기울이기, 흔들림, 빛 효과 같은 추가 효과는 넣지 않는다."
  },
  related: [
    { label: "입력만 다른 같은 효과", items: [{ id: "scroll-driven", text: "스크롤 패럴랙스" }] },
    { label: "헷갈리는 개념", items: [{ id: "mouse-look", text: "마우스 룩 (보드 한 장이 통째로 이동)" }, { id: "orbit", text: "궤도 회전 (3D 대상 둘레를 돎)" }] },
    { label: "함께 쓰이는 것", items: [{ id: "pan", text: "팬" }, { id: "look-at", text: "바라보기" }] }
  ],
  references: [
    { name: "Wikipedia — Parallax scrolling", url: "https://en.wikipedia.org/wiki/Parallax_scrolling", note: "2D 게임에서 여러 겹 배경으로 깊이를 만든 역사를 다룬다." },
    { name: "Parallax Engine (wagerfield/parallax)", url: "https://github.com/wagerfield/parallax", note: "커서 위치와 기기 기울기에 반응하는 여러 층 패럴랙스 라이브러리다." }
  ],
  tags: ["Mouse", "Move", "Parallax", "Translate", "Camera"],
  reads: "스테이지 가운데를 0, 가장자리를 ±1로 둔 커서의 상대 위치(x, y). 각 층은 이 값에 자기 깊이를 곱한 만큼 움직인다.",
  readouts: [
    { key: "ratio", label: "커서 상대 위치 x, y" },
    { key: "far", label: "가장 먼 층 이동 px" },
    { key: "near", label: "가장 가까운 층 이동 px" },
    { key: "ratio2", label: "가까운 층 ÷ 먼 층" }
  ],
  variations: [
    { name: "깊이 세기", desc: "층들이 움직이는 전체 양이다. 0이면 아무것도 움직이지 않는다.",
      control: { type: "range", key: "strength", min: 0, max: 2, step: 0.01, default: 1, ends: ["평평하게", "깊게"] } },
    { name: "방향", desc: "반대로는 커서 반대쪽으로 밀려 시선이 돌아간 느낌을, 같은 방향은 층들이 커서를 따라오는 느낌을 준다.",
      control: { type: "seg", key: "dir", default: "against", options: [["against", "커서 반대로"], ["with", "커서 따라"]] } },
    { name: "깊이 단계", desc: "서로 다른 깊이의 수다. 1단계로 줄이면 모든 층이 같이 움직여 깊이감이 사라지고 마우스 룩과 같아진다.",
      control: { type: "range", key: "levels", min: 1, max: 6, step: 1, default: 6, ends: ["1단계", "6단계"], unit: "단계" } },
    { name: "입체 기울이기", desc: "층 이동에 더해 화면 전체를 커서 쪽으로 살짝 기울여 원근을 더한다.",
      control: { type: "toggle", key: "tilt", default: false } },
    { name: "부드러움", desc: "층들이 목표 위치로 따라가는 빠르기다.",
      control: { type: "range", key: "smooth", min: 0.02, max: 1, step: 0.01, default: 0.08, ends: ["묵직하게", "즉시"] } },
    { name: "가이드선", desc: "오른쪽 아래에 층마다 지금 얼마나 움직였는지 점으로 보여준다. 가까운 층의 점일수록 멀리 움직인다.",
      control: { type: "toggle", key: "guide", default: false } }
  ]
};
