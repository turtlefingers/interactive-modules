export default {
  name: "타겟 지정", nameEn: "Click to Target",
  aliases: ["타겟팅", "Click to Move", "Seek & Arrive", "Rally Point", "집결 지점"],
  input: "클릭",
  effect: "클릭한 곳에 목표가 생기고 개체들이 그리로 모여듦",
  definition: "클릭으로 목표를 찍어 개체를 부르기",
  hint: "빈 곳을 클릭해 깃발 꽂기",
  description: [
    "빈 곳을 클릭하면 그 자리에 깃발(목표)이 꽂히고, 화면 위의 개체들이 스스로 방향을 틀어 그리로 몰려간다. 가까워질수록 속도를 줄여 깃발 주위에 부드럽게 멈춘다. 사용자는 개체를 직접 옮기지 않고 <strong>어디로 가라고 지시만 한다</strong>. 지휘하는 감각을 준다.",
    "개체를 집어서 옮기는 드래그 앤 드롭과 다르다. 타겟 지정은 <strong>목표만 정하고, 가는 길과 속도는 개체가 스스로 정한다</strong>. 개체들이 서로 부딪히지 않게 거리를 두며 몰려가는 움직임은 보이드(Boids)의 추적·도착(Seek & Arrive) 규칙에서 온다."
  ],
  uses: [
    "스타크래프트 같은 전략 게임에서 유닛을 선택하고 땅을 클릭해 이동시키기, 건물의 집결 지점 정하기",
    "디아블로, 리그 오브 레전드처럼 클릭한 곳으로 캐릭터가 걸어가는 조작",
    "물고기나 새 떼가 클릭한 곳으로 모여드는 인터랙티브 작업",
    "지도에서 목적지를 찍으면 경로를 따라 표시가 움직이는 화면"
  ],
  designPoints: [
    "클릭한 순간 목표 표시(깃발, 퍼지는 원)가 바로 나타나야 한다. 개체가 출발하기 전에 명령이 접수되었다는 것을 먼저 보여준다.",
    "도착 반경 안에서 속도를 줄이지 않으면 개체가 목표를 지나쳤다 돌아오기를 반복한다. 도착 감속 변주를 꺼서 비교해 본다.",
    "무리일 때는 모두 한 점에 겹치지 않도록 서로 밀어내는 힘을 준다. 그래야 깃발 주위에 모여 선 모양이 된다.",
    "목표를 여러 개 찍을 수 있다면 순서 번호와 잇는 선으로 경로를 보여준다."
  ],
  prompts: {
    simple: "타겟 지정(Click to Target) 인터랙션을 만든다. 빈 곳을 클릭하면 그 자리에 작은 깃발이 꽂히고, 화면 위의 작은 삼각형 개체 40개가 서로 부딪히지 않게 거리를 두며 깃발 쪽으로 몰려가 가까워질수록 느려지며 주위에 멈춘다. 개체를 직접 집어 옮기는 드래그와 달리 목표만 정하고 움직임은 개체가 스스로 정한다.",
    detailed: "타겟 지정(Click to Target) 인터랙션을 만든다. 화면에 진행 방향을 가리키는 작은 검은 삼각형 개체 40개가 있고, 목표가 없을 때는 느린 속도로 제각각 방향을 조금씩 바꾸며 돌아다니다가 화면 가장자리에 닿으면 안쪽으로 되돌아온다. 화면 아무 곳이나 클릭하면 그 자리에 가는 깃대와 주황 삼각 깃발이 솟아오르고, 그 자리에서 얇은 원이 0.6초 동안 퍼지며 사라진다. 개체들은 매 순간 깃발 방향으로 최고 속도로 가려는 힘을 받되, 한 번에 방향을 바꾸는 힘에는 한계가 있어 곡선을 그리며 방향을 튼다. 깃발에서 120px 안에 들어오면 거리에 비례해 속도를 줄여 깃발 주위에 멈춘다. 개체끼리 22px보다 가까워지면 서로 밀어내서 한 점에 겹치지 않고 깃발 둘레에 둥글게 모인다. 다시 클릭하면 기존 깃발은 흐려지며 사라지고 새 자리에 깃발이 꽂혀 개체들이 그리로 다시 방향을 튼다. 깃발은 개체가 도착해도 그대로 남는다. 개체를 끌어 옮기기, 장애물, 길 찾기, 소리는 넣지 않는다."
  },
  related: [
    { label: "헷갈리는 개념", items: [{ id: "drag-and-drop", text: "드래그 앤 드롭 (개체를 직접 옮김)" }, { id: "cursor-follow", text: "따라오기 (커서를 계속 따라옴)" }] },
    { label: "입력만 다른 같은 효과", items: [{ id: "magnet", text: "자석 (커서 쪽으로 끌림)" }, { id: "directional-move", text: "방향키로 움직이기" }] },
    { label: "함께 쓰이는 것", items: [{ id: "flee", text: "도망가기" }, { id: "single-shot", text: "단발" }] }
  ],
  references: [
    { name: "Steering Behaviors For Autonomous Characters · Craig Reynolds", url: "https://www.red3d.com/cwr/steer/", note: "추적(Seek), 도착(Arrival) 같은 조종 규칙의 원전이다. 각 규칙을 움직이는 예제로 보여준다." },
    { name: "Boids · Craig Reynolds", url: "https://www.red3d.com/cwr/boids/", note: "무리 지어 움직이는 개체들의 세 가지 규칙(분리, 정렬, 응집)을 설명한다." },
    { name: "The Nature of Code", url: "https://natureofcode.com/", note: "자율 에이전트와 무리 움직임을 차근차근 만들어 보는 책이다. 온라인으로 무료로 읽을 수 있다." }
  ],
  tags: ["Mouse", "Click", "Attract", "Follow", "Spawn"],
  reads: "클릭한 위치 — 클릭한 좌표가 목표점이 되고, 개체마다 목표까지의 거리와 방향을 매 순간 계산한다.",
  readouts: [
    { key: "target", label: "목표 위치" },
    { key: "dist", label: "목표까지 평균 거리" },
    { key: "speed", label: "평균 속도 px/frame" },
    { key: "arrived", label: "도착한 개체" }
  ],
  variations: [
    { name: "개체 수", desc: "개체 하나가 목표로 걸어가거나, 무리가 서로 거리를 두며 몰려간다.",
      control: { type: "seg", key: "agents", default: "swarm", options: [["one", "하나"], ["swarm", "무리"]] } },
    { name: "도착 감속", desc: "목표 반경(옅은 원) 안에서 속도를 줄여 부드럽게 멈춘다. 끄면 목표를 지나쳤다 돌아오기를 반복한다.",
      control: { type: "toggle", key: "arrive", default: true } },
    { name: "깃발", desc: "깃발이 계속 남거나, 도착하면 사라지거나, 클릭할 때마다 경유지로 쌓여 순서대로 들른다.",
      control: { type: "seg", key: "persist", default: "keep", options: [["keep", "유지"], ["vanish", "도착하면 사라짐"], ["queue", "경유지 쌓기"]] } },
    { name: "속도", desc: "개체의 최고 속도다. 방향을 트는 힘도 함께 커진다.",
      control: { type: "range", key: "speed", min: 1, max: 8, step: 0.1, default: 3.5, ends: ["느리게", "빠르게"] } }
  ]
};
