export default {
  name: "바라보기", nameEn: "Look At",
  aliases: ["눈동자 따라가기", "Eyes Follow", "lookAt", "시선 추적 연출", "Face the Cursor"],
  input: "마우스 움직임",
  effect: "고정된 개체가 커서 쪽으로 방향을 돌림",
  definition: "제자리에서 커서 쪽으로 고개를 돌리는 개체",
  hint: "커서를 움직이면 → 눈이 커서를 본다",
  description: [
    "화면에 고정된 눈, 얼굴, 화살표가 자리는 그대로 둔 채 <strong>방향만</strong> 커서 쪽으로 돌린다. 각 개체는 자기 위치에서 커서까지의 각도를 계산해 그쪽을 향한다. 사용자는 화면 속 눈과 얼굴이 자기를 쳐다본다고 느낀다.",
    "개체가 커서 쪽으로 다가오는 따라오기와 달리 <strong>위치는 움직이지 않는다</strong>. 눈동자는 눈 안에서만, 고개는 정해진 각도 안에서만 돌아가도록 범위를 제한해야 실제 눈과 고개처럼 움직인다."
  ],
  uses: [
    "로그인 화면에서 입력하는 곳을 쳐다보는 캐릭터",
    "커서를 눈으로 쫓는 오래된 데스크톱 장난감 xeyes",
    "게임에서 플레이어를 향해 도는 포탑과 NPC의 고개",
    "브랜드 사이트의 마스코트, 에러 페이지의 두리번거리는 캐릭터"
  ],
  designPoints: [
    "각도는 개체 중심에서 커서까지의 가로·세로 거리로 구한다(<code>atan2(dy, dx)</code>). 3D 엔진에서는 이 계산을 <code>lookAt()</code>이라는 이름으로 제공한다.",
    "눈동자는 눈 밖으로 나가면 안 된다. 커서가 가까우면 조금만, 멀면 가장자리까지 움직이게 거리로 세기를 조절한다.",
    "개체마다 계산하므로, 여러 개가 각자 다른 각도로 커서를 향할 때 커서 위치가 가장 또렷하게 드러난다.",
    "커서가 화면 밖으로 나가면 정면으로 돌아오게 하고, 가끔 눈을 깜빡이게 하면 커서가 멈춰 있을 때도 개체가 움직인다."
  ],
  prompts: {
    simple: "바라보기(Look At) 인터랙션을 만든다. 화면에 고정된 여러 쌍의 눈이 있고, 누르지 않고 커서를 움직이면 각 눈동자가 자기 위치에서 커서 쪽을 향해 움직인다. 눈은 제자리에 있고 방향만 바뀌며, 눈동자는 눈 밖으로 나가지 않는다.",
    detailed: "바라보기(Look At) 인터랙션을 만든다. 크림색 화면에 눈 한 쌍으로 된 개체 12개가 격자로 고르게 놓인다. 각 눈은 가는 먹색 테두리의 흰 원과 그 안의 검은 눈동자로 이루어진다. 사용자가 누르지 않고 커서를 움직이면, 눈 하나하나가 자기 중심에서 커서까지의 방향을 계산해 눈동자를 그 방향으로 옮긴다. 옮기는 거리는 커서와의 거리에 비례하되, 약 150px 이상 떨어지면 최대치가 되고, 최대치는 흰 원의 반지름에서 눈동자의 반지름을 뺀 값으로 제한해 눈동자가 절대 눈 밖으로 나가지 않게 한다. 두 눈은 각각 계산하므로 커서가 아주 가까우면 살짝 몰린 눈이 된다. 방향은 매 프레임 목표의 20%씩 부드럽게 따라간다. 커서가 화면 밖으로 나가면 모든 눈동자가 천천히 가운데(정면)로 돌아온다. 개체의 위치와 크기는 절대 바뀌지 않는다. 터치에서는 손가락이 닿은 곳을 바라본다. 깜빡임, 고개 기울이기, 소리 같은 추가 효과는 넣지 않는다."
  },
  related: [
    { label: "헷갈리는 개념", items: [{ id: "cursor-follow", text: "따라오기 (위치가 커서로 다가옴)" }, { id: "orbit", text: "궤도 회전 (시점이 대상 둘레를 돎)" }] },
    { label: "함께 쓰이는 것", items: [{ id: "proximity", text: "근접 반응" }, { id: "idle", text: "대기 상태 (가만히 두면 딴 데를 봄)" }, { id: "flee", text: "도망가기" }] }
  ],
  references: [
    { name: "Wikipedia — xeyes", url: "https://en.wikipedia.org/wiki/Xeyes", note: "커서를 눈으로 쫓는 X 윈도 시스템의 고전 프로그램이다." },
    { name: "MDN — Math.atan2()", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/atan2", note: "두 점 사이의 각도를 구하는 함수다. 바라보기 계산의 핵심이다." },
    { name: "My character avatar interaction (Rive Community)", url: "https://community.rive.app/c/showcase/my-character-avatar-interaction", note: "제자리에 있는 캐릭터의 얼굴과 눈이 커서를 따라 돌아간다." }
  ],
  reads: "커서의 위치. 개체마다 자기 중심에서 커서까지의 방향(각도)과 거리를 따로 계산한다.",
  readouts: [
    { key: "cursor", label: "커서 위치" },
    { key: "count", label: "바라보는 개체 수" },
    { key: "angle", label: "가장 가까운 개체의 각도 °" },
    { key: "dist", label: "가장 가까운 개체까지 px" }
  ],
  variations: [
    { name: "개체", desc: "눈 한 쌍, 방향을 가리키는 화살표, 고개를 돌리고 기울이는 얼굴 중에서 고른다.",
      control: { type: "seg", key: "kind", default: "eyes", options: [["eyes", "눈"], ["arrow", "화살표"], ["face", "얼굴"]] } },
    { name: "개수", desc: "바라보는 개체의 수다. 많을수록 커서 위치가 여러 각도로 드러난다.",
      control: { type: "range", key: "count", min: 1, max: 36, step: 1, default: 12, ends: ["1개", "36개"], unit: "개" } },
    { name: "부드럽게 돌기", desc: "목표 방향으로 돌아가는 빠르기다. 느리면 둔하고 졸린 느낌, 빠르면 날카롭고 긴장한 느낌이 된다.",
      control: { type: "range", key: "smooth", min: 0.03, max: 1, step: 0.01, default: 0.2, ends: ["느긋하게", "즉시"] } },
    { name: "움직임 한계", desc: "눈동자가 움직일 수 있는 범위, 화살표가 돌아갈 수 있는 각도, 고개를 돌리는 정도를 제한한다.",
      control: { type: "range", key: "limit", min: 0.15, max: 1, step: 0.01, default: 1, ends: ["조금만", "끝까지"] } },
    { name: "깜빡임", desc: "가끔 눈을 깜빡인다. 커서가 멈춰 있을 때도 개체가 움직인다.",
      control: { type: "toggle", key: "blink", default: true } },
    { name: "가이드선", desc: "가장 가까운 개체와 커서를 점선으로 잇고, 화살표가 돌 수 있는 범위를 부채꼴로 보여준다.",
      control: { type: "toggle", key: "guide", default: false } }
  ]
};
