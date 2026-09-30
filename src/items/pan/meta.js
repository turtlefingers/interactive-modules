export default {
  name: "팬", nameEn: "Pan",
  aliases: ["Board 이동", "화면 이동", "패닝", "드래그 스크롤", "Hand Tool"],
  input: "누르고 움직이기",
  effect: "보이는 영역 전체 이동",
  definition: "넓은 지면을 손으로 끌어 둘러보기",
  hint: "누른 채 끌어서 둘러보기",
  description: [
    "화면을 누른 채 움직이면 배경이 통째로 따라 움직인다. 화면보다 큰 공간이 있고, 사용자가 그 위를 돌아다닌다는 감각을 준다.",
    "특정 물건을 옮기는 것(드래그)이 아니라, 보고 있는 <strong>창문(뷰포트)을 옮기는 것</strong>이다."
  ],
  uses: [
    "지도 둘러보기",
    "화면보다 큰 사진 보드나 무드보드 탐색",
    "보드게임과 전략게임의 맵 이동",
    "캔버스형 툴(Figma, Miro)의 작업 공간 이동"
  ],
  designPoints: [
    "커서를 <code>grab</code>(펼친 손)으로 두고, 누르는 동안 <code>grabbing</code>(쥔 손)으로 바꿔 잡을 수 있다는 것을 알린다.",
    "보드 위의 클릭 가능한 요소와 헷갈리지 않도록, 일정 거리 이상 움직였을 때만 이동으로 인식한다.",
    "전체 중 현재 위치를 미니맵이나 위치 표시로 알려주면 사용자가 길을 잃지 않는다. 미니맵을 클릭하면 그 위치로 이동한다."
  ],
  prompts: {
    simple: "팬(Pan) 인터랙션을 만든다. 화면보다 큰 보드를 누른 채 끌면 보드 전체가 포인터를 따라 1:1로 움직인다. 개체 하나를 옮기는 드래그가 아니라 보이는 영역 자체를 옮기는 것이므로, 보드 위 개체들의 상대 위치는 바뀌지 않는다.",
    detailed: "팬(Pan) 인터랙션을 만든다. 화면보다 큰 보드(예: 화면의 3배 너비, 2배 높이) 위에 여러 개체가 흩어져 있고, 사용자가 보드의 빈 곳이나 개체 위를 누른 채 움직이면 보드 전체가 포인터가 움직인 거리(Δx, Δy)만큼 같은 방향으로 1:1로 따라 움직인다. 이것은 개체 하나를 집어 옮기는 드래그 앤 드롭이 아니라 보이는 영역 자체를 옮기는 것이므로, 개체들끼리의 상대 위치는 절대 바뀌지 않는다. 보드 가장자리 밖의 빈 공간이 화면에 보이지 않도록 이동 범위를 제한한다. 커서는 평소에 펼친 손(grab), 누르고 있는 동안에는 쥔 손(grabbing) 모양으로 바꾼다. 누른 뒤 5px 이상 움직였을 때만 팬으로 인식하고, 그보다 적게 움직이고 떼면 클릭으로 처리해서 개체 클릭과 충돌하지 않게 한다. 누르고 있는 동안에는 포인터가 보드 밖으로 나가도 팬이 끊기지 않고, 마우스와 터치에서 모두 같은 방식으로 동작한다. 관성, 패럴랙스, 확대 같은 추가 효과는 넣지 않는다."
  },
  related: [
    { label: "입력만 다른 같은 효과", items: [{ id: "scroll-driven", text: "스크롤 → 이동" }, { id: "mouse-look", text: "마우스 움직임 → 보이는 영역 이동" }] },
    { label: "헷갈리는 개념", items: [{ id: "drag-and-drop", text: "드래그 앤 드롭 (대상을 옮김)" }] },
    { label: "함께 쓰이는 것", items: [{ id: "zoom", text: "핀치 · 휠 → 확대" }, { id: "mouse-parallax", text: "패럴랙스" }] }
  ],
  references: [
    { name: "Google Maps", url: "https://www.google.com/maps", note: "팬의 표준이다. 관성과 확대가 결합된 형태다." },
    { name: "Weird Christmas ~ Create your card!", url: "http://christmas.rogue.studio/", note: "넓은 보드를 끌어 다니며 요소를 발견하는 구조다." }
  ],
  reads: "위치 변화량 — 누른 뒤 움직인 거리(Δx, Δy). 관성을 쓰면 손을 떼는 순간의 속도도 읽는다.",
  readouts: [
    { key: "dx", label: "Δx 누른 뒤 가로 이동" },
    { key: "dy", label: "Δy 누른 뒤 세로 이동" },
    { key: "speed", label: "속도 px/frame" },
    { key: "cam", label: "뷰포트 위치" }
  ],
  variations: [
    { name: "관성", desc: "손을 떼도 미끄러지다 멈춘다. 떼는 순간의 속도를 읽는다.",
      control: { type: "toggle", key: "inertia", default: true } },
    { name: "미끄러짐 정도", desc: "관성이 얼마나 오래 이어지는지 정한다.",
      control: { type: "range", key: "friction", min: 0.8, max: 0.985, step: 0.005, default: 0.94, ends: ["금방 멈춤", "오래 미끄러짐"] } },
    { name: "경계", desc: "끝에서 멈추거나, 고무줄처럼 튕기거나, 무한 반복된다.",
      control: { type: "seg", key: "bound", default: "clamp", options: [["clamp", "멈춤"], ["bounce", "튕김"], ["wrap", "무한 반복"]] } },
    { name: "축 고정", desc: "가로 또는 세로로만 움직인다.",
      control: { type: "seg", key: "axis", default: "free", options: [["free", "자유"], ["x", "가로"], ["y", "세로"]] } },
    { name: "패럴랙스", desc: "보드 위 개체마다 높이를 달리 줘서, 높이 떠 있는 개체일수록 더 빠르게 움직이게 한다. 개체들 사이의 시차로 공간감이 생긴다.",
      control: { type: "toggle", key: "parallax", default: false } },
    { name: "따라오는 정도", desc: "1:1로 딱 붙어 움직이거나, 살짝 늦게 부드럽게 따라온다.",
      control: { type: "range", key: "follow", min: 0.04, max: 1, step: 0.01, default: 1, ends: ["부드럽게 늦게", "즉시"] } },
    { name: "드래그 인식 거리", desc: "이 거리 이상 움직여야 팬으로 인식한다. 0으로 두고 카드를 눌러보면 클릭과 팬이 뒤섞인다.",
      control: { type: "range", key: "threshold", min: 0, max: 40, step: 1, default: 6, ends: ["0px", "40px"], unit: "px" } }
  ]
};
