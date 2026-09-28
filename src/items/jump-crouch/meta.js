export default {
  name: "점프 · 앉기", nameEn: "Jump & Crouch",
  aliases: ["앉기 / 점프", "점프", "앉기", "플랫포머 조작", "Platformer Controls"],
  input: "방향키 · Space",
  effect: "중력을 받는 점프와 몸 낮추기",
  definition: "위로 뛰어오르고 아래로 몸을 낮추기",
  hint: "↑ · Space 점프, ↓ 앉기",
  description: [
    "옆에서 본 캐릭터가 ↑(또는 Space)를 누르면 뛰어올랐다가 중력에 끌려 내려오고, ↓를 누르고 있으면 몸을 낮춘다. 위아래 방향키가 '이동'이 아니라 <strong>동작</strong>이 되는, 플랫폼 게임의 기본 조작이다.",
    "점프의 손맛은 높이보다 <strong>타이밍</strong>에서 나온다. 오래 누를수록 높이 뛰고, 발판 끝을 막 벗어난 순간에도 점프를 받아주고, 착지할 때 몸이 찌그러지면 조작이 한결 너그럽고 살아있게 느껴진다."
  ],
  uses: [
    "슈퍼 마리오, 셀레스트, 할로우 나이트 같은 플랫폼 게임",
    "크롬 공룡 게임처럼 장애물을 뛰어넘거나 숙여 피하는 러너 게임",
    "스크롤에 맞춰 캐릭터가 달리는 웹 포트폴리오와 이벤트 페이지",
    "구글 두들처럼 짧은 미니게임"
  ],
  designPoints: [
    "<strong>가변 점프</strong>: 키를 일찍 떼면 올라가는 속도를 깎아 낮게 뛴다. 한 키로 높이를 조절할 수 있게 된다.",
    "<strong>코요테 타임</strong>: 발판 끝을 벗어난 뒤 0.1초 정도는 점프를 받아준다. 플레이어는 '분명히 눌렀는데'라는 억울함을 느끼지 않는다. 만화에서 절벽 밖으로 걸어나간 코요테가 잠깐 허공에 떠 있는 장면에서 온 이름이다.",
    "올라갈 때보다 떨어질 때 중력을 조금 더 세게 주면 둥실 떠다니지 않고 경쾌해진다.",
    "점프 순간 세로로 늘어나고 착지 순간 가로로 퍼지는 <strong>찌그러짐과 늘어남(squash & stretch)</strong>은 애니메이션의 기본 원칙으로, 무게감을 가장 싸게 전달한다."
  ],
  prompts: {
    simple: "점프 · 앉기(Jump & Crouch) 인터랙션을 만든다. 옆에서 본 캐릭터가 위쪽 방향키나 스페이스를 누르면 위로 뛰어올랐다가 중력으로 포물선을 그리며 떨어지고, 아래쪽 방향키를 누르고 있는 동안은 키가 낮아진 채 천천히 움직인다. 위아래 키가 위치 이동이 아니라 점프와 앉기라는 동작을 일으킨다는 점이 방향 이동과 다르다.",
    detailed: "점프 · 앉기(Jump & Crouch) 인터랙션을 만든다. 화면을 옆에서 본 장면으로, 아래쪽 4분의 1 지점에 바닥이 있고 공중에 발판 두세 개가 떠 있다. 둥근 사각형 캐릭터가 바닥에 서 있고, 왼쪽·오른쪽 방향키를 누르고 있는 동안 초당 300px로 걷는다. 위쪽 방향키나 스페이스를 누르는 순간(누르고 있는 동안이 아니라 누른 순간 한 번) 최대 170px 높이로 뛰어오르고, 일정한 중력으로 포물선을 그리며 떨어진다. 떨어질 때는 올라갈 때보다 중력을 15% 세게 한다. 올라가는 도중에 키를 떼면 위로 가는 속도를 40% 정도로 줄여 낮게 뛴다. 발판은 아래에서 위로는 통과하고 위에서 떨어질 때만 올라설 수 있다. 발판 끝에서 걸어 떨어진 뒤 0.1초 안에 점프를 누르면 점프를 받아준다. 공중에서는 다시 점프할 수 없다. 아래쪽 방향키를 누르고 있으면 바닥에 있을 때만 캐릭터 키가 60% 정도로 낮아지고 걷는 속도가 3분의 1로 줄며, 떼면 원래 키로 돌아온다. 점프하는 순간 캐릭터가 세로로 늘어나고 착지하는 순간 가로로 퍼졌다가 탄력 있게 돌아온다. 키 입력 반복(누르고 있을 때 자동 반복)으로 연속 점프가 일어나지 않게 하고, 방향키와 스페이스로 페이지가 스크롤되지 않게 한다. 화면에 왼쪽·아래·오른쪽·점프 버튼을 두어 누른 키를 강조하고, 터치로도 같은 조작을 하게 한다. 공격, 벽 타기, 대시 같은 추가 동작은 넣지 않는다."
  },
  related: [
    { label: "헷갈리는 개념", items: [{ id: "directional-move", text: "방향 이동 (위에서 본 이동)" }] },
    { label: "함께 쓰이는 것", items: [{ id: "charge-shot", text: "차지 샷 (누른 만큼 강하게)" }, { id: "press-and-hold", text: "누르고 있기" }] }
  ],
  references: [
    { name: "Platformer — Wikipedia", url: "https://en.wikipedia.org/wiki/Platformer", note: "점프와 앉기를 기본 동작으로 삼는 장르의 역사다." },
    { name: "Squash and stretch — Wikipedia", url: "https://en.wikipedia.org/wiki/Squash_and_stretch", note: "디즈니 애니메이션 12원칙 중 첫 번째로, 점프에 무게감을 준다." },
    { name: "Celeste", url: "https://www.celestegame.com/", note: "코요테 타임, 점프 버퍼 같은 너그러운 조작으로 유명하다." }
  ],
  tags: ["Keyboard", "Press", "Translate", "Physics", "Deform"],
  reads: "점프 키를 누른 순간과 뗀 순간, 그리고 ↓와 ←→를 누르고 있는 상태 — 누른 순간에 뛰고, 떼는 순간이 점프 높이를 정한다.",
  readouts: [
    { key: "keys", label: "누르고 있는 키" },
    { key: "height", label: "바닥에서 높이 px" },
    { key: "vy", label: "세로 속도 px/s (위 +)" },
    { key: "hold", label: "점프 키 누른 시간" }
  ],
  variations: [
    { name: "가변 점프", desc: "짧게 누르면 낮게, 길게 누르면 높게 뛴다. 끄면 언제나 같은 높이로 뛴다.",
      control: { type: "toggle", key: "hold", default: true } },
    { name: "코요테 타임", desc: "발판에서 떨어진 뒤에도 이 시간 안에는 점프를 받아준다. 머리 위 고리가 남은 시간이다. 0으로 두면 엄격해진다.",
      control: { type: "range", key: "coyote", min: 0, max: 300, step: 10, default: 100, ends: ["0ms", "300ms"], unit: "ms" } },
    { name: "2단 점프", desc: "공중에서 한 번 더 뛸 수 있다. 머리 위 점이 남은 점프다.",
      control: { type: "toggle", key: "double", default: false } },
    { name: "찌그러짐과 늘어남", desc: "뛸 때 늘어나고 떨어질 때 찌그러진다. 끄면 딱딱한 상자처럼 움직인다.",
      control: { type: "toggle", key: "squash", default: true } },
    { name: "중력", desc: "약하면 달처럼 오래 떠 있고, 강하면 짧고 날카롭게 뛴다. 높이는 같다.",
      control: { type: "range", key: "gravity", min: 900, max: 4200, step: 50, default: 2200, ends: ["둥실", "묵직"], unit: "px/s²" } }
  ]
};
