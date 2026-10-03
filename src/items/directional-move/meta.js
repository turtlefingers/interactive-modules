export default {
  name: "방향 이동", nameEn: "Directional Movement",
  aliases: ["캐릭터 이동", "8방향 이동", "8-way Movement", "탱크 조작", "Tank Controls", "WASD 이동"],
  input: "방향키 · WASD",
  effect: "캐릭터 위치 이동",
  definition: "누른 방향으로 캐릭터를 움직이기",
  hint: "방향키·WASD를 누르면 → 캐릭터가 걷는다",
  description: [
    "사용자가 방향키를 누르고 있는 동안 캐릭터가 누른 방향으로 걸어간다. 사용자가 두 키를 함께 누르면 캐릭터가 대각선으로 가고, 키를 떼면 캐릭터가 멈춘다. 방향 이동은 사용자가 누른 키의 방향이 그대로 캐릭터의 이동 방향이 되는 조작으로, 게임에서 가장 기본이 되는 조작이다.",
    "방향을 해석하는 기준이 두 가지다. <strong>절대 좌표</strong>는 화면 기준으로 ↑가 언제나 화면 위쪽이다. <strong>상대 좌표(탱크 조작)</strong>는 캐릭터 기준으로 ↑가 '바라보는 쪽으로 전진', ←→가 '제자리 회전'이다. 같은 ↑ 키를 눌러도 절대 좌표에서는 캐릭터가 화면 위쪽으로, 상대 좌표에서는 캐릭터가 바라보는 쪽으로 움직인다."
  ],
  uses: [
    "탑다운 RPG와 액션 게임(젤다의 전설, 뱀파이어 서바이버즈)의 캐릭터 이동",
    "초기 바이오하자드, 레이싱 게임의 탱크 조작",
    "게더타운 같은 2D 메타버스 공간의 아바타 이동",
    "웹 전시나 인터랙티브 지도에서 키보드로 둘러보기"
  ],
  designPoints: [
    "대각선에서 가로와 세로 입력을 그대로 더하면 속도가 약 1.41배 빨라진다. 입력 벡터의 길이를 1로 맞추는 <strong>정규화</strong>를 해야 모든 방향이 같은 속도가 된다.",
    "키는 누른 순간 한 번이 아니라 <strong>누르고 있는 상태</strong>를 읽는다. <code>keydown</code>과 <code>keyup</code>으로 눌린 키 목록을 유지하고, 매 프레임 그 목록에서 방향을 계산한다. 창이 포커스를 잃으면 목록을 비워 캐릭터가 계속 걸어가는 일을 막는다.",
    "WASD는 글자가 아니라 키의 위치(<code>KeyboardEvent.code</code>)로 읽어야 한글 입력 상태에서도 동작한다.",
    "가속과 마찰을 넣으면 캐릭터가 서서히 출발하고 미끄러지다 멈추지만, 너무 오래 미끄러지면 사용자가 원하는 곳에 캐릭터를 세우기 어렵다. 퍼즐 게임은 즉시 멈추게, 얼음판이나 우주선은 오래 미끄러지게 한다."
  ],
  prompts: {
    simple: "방향 이동(Directional Movement) 인터랙션을 만든다. 위아래좌우 방향키나 W·A·S·D를 누르고 있는 동안 캐릭터가 그 방향으로 일정한 속도로 움직이고, 두 키를 함께 누르면 대각선으로 움직인다. 누른 순간 한 번 움직이는 것이 아니라 누르고 있는 동안 계속 움직이며, 대각선 속도는 직선 속도와 같게 맞춘다.",
    detailed: "방향 이동(Directional Movement) 인터랙션을 만든다. 위에서 내려다본 평면 위에 원형 캐릭터 하나가 가운데에 있고, 캐릭터에는 바라보는 방향을 알려주는 눈과 뾰족한 코가 있다. 위아래좌우 방향키 또는 W·A·S·D(글자가 아닌 키 위치 기준)를 누르고 있는 동안 캐릭터가 화면 기준으로 그 방향으로 초당 260px 움직이고, 두 키를 함께 누르면 대각선으로 움직인다. 대각선일 때는 가로·세로 입력 벡터의 길이를 1로 맞춰 직선과 같은 속도가 되게 한다. 반대 방향 키를 함께 누르면 그 축은 0이 된다. 캐릭터는 움직이는 방향으로 부드럽게 몸을 돌린다. 키를 떼면 즉시 멈추고, 화면 가장자리에 닿으면 캐릭터가 화면 밖으로 나가지 않게 막는다. 창이 포커스를 잃으면 눌린 키를 모두 뗀 것으로 처리한다. 방향키를 눌러도 페이지가 스크롤되지 않게 한다. 화면 오른쪽 아래에 네 방향 버튼을 두어 누른 키를 강조해서 보여주고, 터치 화면에서는 이 버튼을 누르고 있는 동안 같은 방식으로 움직이게 한다. 점프, 공격, 카메라 추적 같은 추가 동작은 넣지 않는다."
  },
  related: [
    { label: "입력만 다른 같은 효과", items: [{ id: "virtual-joystick", text: "가상 조이스틱 → 이동" }, { id: "click-to-target", text: "클릭한 곳으로 이동" }, { id: "cursor-follow", text: "커서 따라가기" }] },
    { label: "헷갈리는 개념", items: [{ id: "pan", text: "팬 (캐릭터가 아니라 화면이 움직임)" }] },
    { label: "함께 쓰이는 것", items: [{ id: "jump-crouch", text: "점프 · 앉기" }, { id: "keyboard-orbit", text: "키보드 궤도 회전" }] }
  ],
  references: [
    { name: "Arrow keys — Wikipedia", url: "https://en.wikipedia.org/wiki/Arrow_keys", note: "방향키와 WASD 배치가 어떻게 굳어졌는지 정리되어 있다." },
    { name: "Tank controls — Wikipedia", url: "https://en.wikipedia.org/wiki/Tank_controls", note: "캐릭터 기준으로 전진과 회전을 나누는 상대 좌표 조작이다." },
    { name: "KeyboardEvent.code — MDN", url: "https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code", note: "입력 언어와 상관없이 키의 물리적 위치를 읽는 방법이다." },
    { name: "Bruno Simon", url: "https://bruno-simon.com/", note: "방향키나 WASD로 작은 차를 몰아 3D 섬을 돌아다니며 포트폴리오 작업을 찾아간다." }
  ],
  reads: "누르고 있는 방향키의 조합 — 매 프레임 눌린 키들로 가로·세로 입력 벡터(-1~1)를 만들고, 그 방향과 길이로 속도를 정한다.",
  readouts: [
    { key: "keys", label: "누르고 있는 키" },
    { key: "vec", label: "입력 벡터 (가로, 세로)" },
    { key: "speed", label: "속도 px/s" },
    { key: "angle", label: "바라보는 각도 (위 = 0°)" }
  ],
  variations: [
    { name: "조작 방식", desc: "8방향은 화면 기준(절대 좌표)으로 움직인다. 탱크는 ↑↓가 바라보는 쪽으로 전진·후진, ←→가 제자리 회전(상대 좌표)이다.",
      control: { type: "seg", key: "scheme", default: "abs", options: [["abs", "8방향"], ["tank", "탱크"]] } },
    { name: "대각선 정규화", desc: "끄면 대각선이 약 1.41배 빨라진다. 오른쪽 아래 입력 벡터의 점이 원 밖 모서리까지 나간다.",
      control: { type: "toggle", key: "norm", default: true } },
    { name: "가속과 마찰", desc: "캐릭터에 서서히 속도가 붙고, 사용자가 키를 떼면 캐릭터가 미끄러지다 멈춘다.",
      control: { type: "toggle", key: "accel", default: false } },
    { name: "미끄러짐 정도", desc: "가속과 마찰을 켰을 때, 손을 뗀 뒤 얼마나 오래 미끄러지는지 정한다.",
      control: { type: "range", key: "friction", min: 0.8, max: 0.98, step: 0.005, default: 0.9, ends: ["금방 멈춤", "얼음판"] } },
    { name: "속도", desc: "캐릭터가 1초에 움직이는 거리다.",
      control: { type: "range", key: "speed", min: 100, max: 520, step: 10, default: 260, ends: ["느리게", "빠르게"], unit: "px/s" } },
    { name: "가장자리", desc: "캐릭터가 화면 가장자리에서 벽에 막히거나, 반대편으로 넘어가 다시 나타난다.",
      control: { type: "seg", key: "edge", default: "wall", options: [["wall", "벽"], ["wrap", "반대편으로"]] } }
  ]
};
