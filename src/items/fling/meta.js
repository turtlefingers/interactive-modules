export default {
  name: "던지기", nameEn: "Fling",
  aliases: ["잡고 던지기", "Throw", "Toss", "플링", "튕겨 보내기"],
  input: "잡고 움직이다 놓기",
  effect: "놓는 순간의 속도로 날아감",
  definition: "움직이던 속도 그대로 놓아 날리기",
  hint: "공을 잡고 휙 던지기",
  description: [
    "개체를 잡고 움직이다가 놓으면, <strong>놓기 직전에 움직이던 속도와 방향</strong> 그대로 개체가 날아간다. 날아간 개체는 마찰로 점점 느려지고 벽에 부딪히면 튕긴다. 손목을 빠르게 튕길수록 멀리 날아가서, 사용자는 실제 물건을 던지는 것 같은 손맛을 느낀다.",
    "당긴 거리로 힘을 정하는 <strong>새총</strong>과 다르다. 던지기는 얼마나 움직였는지가 아니라 <strong>마지막 순간에 얼마나 빨랐는지</strong>를 읽는다. 그래서 멀리 끌고 와도 멈췄다가 놓으면 제자리에 떨어진다."
  ],
  uses: [
    "안드로이드와 iOS에서 목록을 휙 밀어 빠르게 넘기는 플링 스크롤",
    "화상 통화 앱의 작은 내 화면(PIP)을 던지면 가까운 모서리로 날아가 붙는 동작",
    "카드를 옆으로 던져 넘기는 데이팅 앱과 퀴즈 앱",
    "종이 뭉치를 휴지통에 던져 넣는 캐주얼 게임과 인터랙티브 광고"
  ],
  designPoints: [
    "놓는 순간의 속도는 드래그 전체가 아니라 <strong>마지막 50~100ms</strong>의 움직임으로 계산한다. 그래야 손끝의 튕김이 그대로 전해진다.",
    "멈췄다가 놓으면 속도를 0으로 본다. 그래야 던지는 것과 조심스럽게 내려놓는 것을 구분할 수 있다.",
    "잡은 개체와 날아가는 개체만 강조색으로 바꿔서, 지금 힘을 받은 것이 무엇인지 알린다. 지나간 길을 옅은 점으로 남기면 속도가 줄어드는 모습이 보인다.",
    "속도에 상한을 둔다. 트랙패드나 빠른 마우스에서 순간 속도가 튀어 개체가 화면을 뚫고 사라지는 것을 막는다."
  ],
  prompts: {
    simple: "던지기(Fling) 인터랙션을 만든다. 개체를 잡고 움직이다 놓으면, 놓기 직전의 이동 속도와 방향 그대로 날아가 마찰로 느려지고 벽에서 튕긴다. 당긴 거리로 힘을 정하는 새총과 달리, 마지막 순간의 손 속도만으로 날아가는 힘이 정해진다.",
    detailed: "던지기(Fling) 인터랙션을 만든다. 벽으로 둘러싸인 판 위에 크기가 다른 공 다섯 개가 있다. 공 위를 누르면 그 공을 잡고, 누른 지점과 공 중심의 간격을 유지한 채 포인터를 1:1로 따라온다. 잡은 공은 맨 앞으로 오고 강조색으로 바뀐다. 잡고 있는 동안 최근 90ms의 포인터 위치 기록으로 현재 속도를 계산하고, 그 방향과 크기를 공 중심에서 뻗는 화살표로 보여준다. 손을 떼면 그 속도 × 속도 배율로 공이 날아간다. 마지막으로 움직인 지 80ms가 지났으면 속도를 0으로 보고 제자리에 놓는다. 속도는 최대 70px/frame으로 제한한다. 날아가는 공은 매 프레임 마찰 계수를 곱해 느려지고, 벽에 닿으면 탄성 계수만큼 속도를 잃으며 반대로 튕긴다. 공끼리도 크기에 비례한 무게로 부딪혀 튕긴다. 잡고 있는 공은 무한히 무거운 것으로 다뤄 다른 공을 밀어낸다. 공 안의 점 하나가 굴러가는 방향에 맞춰 돌고, 날아간 길은 옅은 점으로 잠시 남는다. 커서는 공 위에서 grab, 잡은 동안 grabbing이고, 마우스와 터치에서 같게 동작한다. 중력은 기본으로 끄고, 그림자, 광택, 스냅 위치, 목표 지점 같은 추가 효과는 넣지 않는다."
  },
  related: [
    { label: "헷갈리는 개념", items: [{ id: "slingshot", text: "새총 (당긴 거리로 날림)" }, { id: "swipe", text: "스와이프 (방향만 읽는 넘기기)" }] },
    { label: "입력만 다른 같은 효과", items: [{ id: "pan", text: "팬의 관성 (보이는 영역을 던짐)" }] },
    { label: "함께 쓰이는 것", items: [{ id: "drag-and-drop", text: "드래그 앤 드롭" }, { id: "drop-zone", text: "드롭 존 (던져 넣기)" }] }
  ],
  references: [
    { name: "Material Design — Gestures", url: "https://m2.material.io/design/interaction/gestures.html", note: "플링을 빠르게 튕겨 보내는 제스처로 정의한다." },
    { name: "Android GestureDetector.OnGestureListener", url: "https://developer.android.com/reference/android/view/GestureDetector.OnGestureListener", note: "onFling이 손을 떼는 순간의 x, y 속도를 넘겨준다." }
  ],
  reads: "놓기 직전의 속도 — 마지막 90ms 동안 움직인 거리와 방향. 잡고 끌어온 전체 거리는 읽지 않는다.",
  readouts: [
    { key: "release", label: "놓는 순간 속도 px/frame" },
    { key: "dir", label: "던진 방향" },
    { key: "now", label: "지금 속도 px/frame" },
    { key: "bounces", label: "부딪힌 횟수" }
  ],
  variations: [
    { name: "마찰", desc: "날아가는 동안 속도를 얼마나 잃는지 정한다. 얼음판과 카펫의 차이다.",
      control: { type: "range", key: "friction", min: 0.9, max: 0.998, step: 0.002, default: 0.985, ends: ["금방 멈춤", "오래 미끄러짐"] } },
    { name: "탄성", desc: "벽과 다른 공에 부딪힐 때 튕겨 나오는 정도다. 0이면 벽에 붙는다.",
      control: { type: "range", key: "bounce", min: 0, max: 1, step: 0.05, default: 0.7, ends: ["찰흙", "고무공"] } },
    { name: "중력", desc: "켜면 공이 바닥으로 떨어져서, 위로 던지면 포물선을 그린다.",
      control: { type: "toggle", key: "gravity", default: false } },
    { name: "속도 배율", desc: "손의 속도에 곱하는 값이다. 크면 살짝만 튕겨도 멀리 날아간다.",
      control: { type: "range", key: "mult", min: 0.3, max: 2.5, step: 0.05, default: 1, ends: ["묵직하게", "가볍게"], unit: "×" } },
    { name: "속도 화살표", desc: "잡고 있는 동안, 지금 놓으면 날아갈 방향과 세기를 화살표로 보여준다.",
      control: { type: "toggle", key: "arrow", default: true } }
  ]
};
