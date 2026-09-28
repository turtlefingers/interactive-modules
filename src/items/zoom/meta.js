export default {
  name: "확대 · 축소", nameEn: "Zoom",
  aliases: ["Board 확대", "핀치 인/아웃", "Pinch to Zoom", "Zoom to Cursor", "줌"],
  input: "핀치 · Ctrl(⌘) + 휠",
  effect: "보이는 영역의 배율 바꾸기",
  definition: "커서가 가리키는 곳을 중심으로 크게, 작게 보기",
  hint: "트랙패드 핀치나 Ctrl(⌘) + 휠로 확대",
  description: [
    "두 손가락을 벌리거나 오므리면(핀치), 또는 Ctrl(⌘)을 누른 채 휠을 굴리면 보드 전체의 배율이 바뀐다. 좋은 확대는 <strong>커서가 가리키는 지점이 제자리에 머문 채</strong> 그 둘레가 커진다. 보고 싶은 곳을 가리키고 벌리기만 하면 그곳으로 파고 들어가는 감각이다.",
    "화면 가운데를 기준으로 커지면 가리킨 곳이 점점 밖으로 밀려나서, 확대할 때마다 다시 찾아 옮겨야 한다. 확대는 대상 하나를 키우는 것이 아니라 <strong>보는 창(뷰포트)의 배율을 바꾸는 것</strong>이라서 보드 위 개체들의 크기 비율은 그대로다."
  ],
  uses: [
    "지도 앱(구글 지도, 네이버 지도)에서 핀치와 휠로 확대하기",
    "피그마, 미로 같은 캔버스 툴의 작업 공간 확대",
    "사진 앱에서 두 손가락으로 사진 크게 보기",
    "전략 게임과 시뮬레이션 게임의 전장 확대 · 축소"
  ],
  designPoints: [
    "확대의 기준점을 <strong>커서(또는 두 손가락의 가운데)</strong>로 잡는다. 확대 전후로 그 지점 아래의 보드 좌표가 같도록 이동량을 함께 계산한다.",
    "브라우저에서 트랙패드 핀치는 Ctrl을 누른 휠 이벤트로 들어온다. 기본 동작(페이지 전체 확대)을 막아야 보드만 확대된다.",
    "그냥 휠은 페이지 스크롤이나 보드 이동과 겹치기 쉽다. 캔버스 툴은 보통 그냥 휠을 이동에, 핀치와 Ctrl(⌘) + 휠을 확대에 쓴다.",
    "최소 · 최대 배율을 두고 지금 배율을 숫자로 보여준다. 한 번에 바뀌기보다 짧게 부드럽게 따라가면 어디가 커지는지 눈으로 따라갈 수 있다."
  ],
  prompts: {
    simple: "확대 · 축소(Zoom) 인터랙션을 만든다. 트랙패드에서 두 손가락을 벌리거나 Ctrl(⌘)을 누른 채 휠을 굴리면 보드 전체의 배율이 바뀌며, 이때 커서가 가리키는 지점은 제자리에 머물고 그 둘레가 커지거나 작아진다. 개체 하나를 키우는 것이 아니라 보는 창의 배율을 바꾸는 것이다.",
    detailed: "확대 · 축소(Zoom) 인터랙션을 만든다. 화면보다 큰 보드 위에 여러 개체와 아주 작은 글씨가 흩어져 있다. 트랙패드 핀치(Ctrl이 눌린 휠 입력으로 들어온다), Ctrl(⌘) + 마우스 휠, 터치 화면의 두 손가락 핀치로 배율을 바꾼다. 핀치는 휠 값에 비례해 배율을 곱으로 바꾸고(예: 배율 × e^(−휠값 × 0.01)), 마우스 휠의 한 칸은 1.2배씩 바꾼다. 확대 기준점은 커서 위치(터치는 두 손가락의 가운데)이며, 확대 전후로 그 지점 아래의 보드 좌표가 같도록 보드의 위치를 함께 옮겨서 가리킨 곳이 화면에서 움직이지 않게 한다. 배율은 50%~400% 안으로 제한하고, 한계에 닿으면 더 커지거나 작아지지 않는다. 배율은 약 0.15초 동안 부드럽게 목표값을 따라간다. 그냥 휠(Ctrl 없이)은 보드를 상하좌우로 이동시키고, 누른 채 끌어도 보드가 이동한다. 브라우저의 기본 페이지 확대가 일어나지 않게 막는다. 오른쪽 아래에 지금 배율(%)과 −, + 버튼을 두고, 버튼은 화면 가운데를 기준으로 1.5배씩 바꾸며 배율 숫자를 누르면 100%로 돌아간다. 회전, 관성, 미니맵 같은 추가 기능은 넣지 않는다."
  },
  related: [
    { label: "입력만 다른 같은 효과", items: [{ id: "double-click-zoom", text: "더블클릭 → 확대" }] },
    { label: "함께 쓰이는 것", items: [{ id: "pan", text: "팬 (끌어서 이동)" }, { id: "rotate-view", text: "화면 회전" }] },
    { label: "헷갈리는 개념", items: [{ id: "proximity", text: "근접 반응 (커서 근처만 커짐)" }] }
  ],
  references: [
    { name: "Google Maps", url: "https://www.google.com/maps", note: "커서 기준 확대의 표준이다. 휠 한 칸마다 부드럽게 파고든다." },
    { name: "Figma", url: "https://www.figma.com/", note: "그냥 휠은 이동, 핀치와 Ctrl(⌘) + 휠은 확대로 나눠 쓰는 캔버스 툴의 대표 사례다." },
    { name: "MDN — WheelEvent", url: "https://developer.mozilla.org/en-US/docs/Web/API/WheelEvent", note: "휠과 트랙패드 입력의 값(deltaY, ctrlKey)을 읽는 방법이다." },
    { name: "Apple HIG — Gestures", url: "https://developer.apple.com/design/human-interface-guidelines/gestures", note: "핀치로 확대하는 제스처의 기본 규칙이다." }
  ],
  tags: ["Trackpad", "Pinch", "Scale", "Camera"],
  reads: "핀치의 벌어진 정도(트랙패드는 Ctrl이 붙은 휠 값, 터치는 두 손가락 사이 거리의 비율)와 그 순간의 커서 위치(확대 기준점)를 읽는다.",
  readouts: [
    { key: "scale", label: "배율 %" },
    { key: "pivot", label: "기준점 x, y" },
    { key: "input", label: "들어온 입력" },
    { key: "delta", label: "입력 값 (휠 Δ · 핀치 비율)" }
  ],
  variations: [
    { name: "기준점", desc: "커서가 가리킨 곳을 중심으로 확대하거나, 화면 가운데를 중심으로 확대한다. 가운데로 바꾸고 구석을 확대해 보면 차이가 확실하다.",
      control: { type: "seg", key: "pivot", default: "cursor", options: [["cursor", "커서"], ["center", "화면 가운데"]] } },
    { name: "부드럽게", desc: "배율이 목표값을 짧게 따라간다. 끄면 입력마다 즉시 바뀌어 뚝뚝 끊긴다.",
      control: { type: "toggle", key: "smooth", default: true } },
    { name: "배율 한계", desc: "얼마나 작게, 크게 볼 수 있는지 정한다. 넓히면 보드 가운데의 아주 작은 글씨까지 읽을 수 있다.",
      control: { type: "seg", key: "limit", default: "tight", options: [["tight", "50–400%"], ["wide", "10–2000%"], ["none", "제한 없음"]] } },
    { name: "그냥 휠", desc: "Ctrl(⌘) 없이 굴린 휠을 보드 이동에 쓸지(캔버스 툴 방식), 확대에 쓸지(지도 방식) 정한다.",
      control: { type: "seg", key: "wheel", default: "pan", options: [["pan", "이동"], ["zoom", "확대"]] } },
    { name: "확대 버튼", desc: "오른쪽 아래에 −, + 버튼과 배율 숫자를 둔다. 핀치를 모르는 사람도 확대할 수 있다.",
      control: { type: "toggle", key: "buttons", default: true } }
  ]
};
