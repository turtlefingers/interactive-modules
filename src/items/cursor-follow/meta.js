export default {
  name: "따라오기", nameEn: "Cursor Follow",
  aliases: ["커서 따라오기", "Easing Follow", "Lerp", "Mouse Follower", "뒤따라오는 커서"],
  input: "마우스 움직임",
  effect: "개체가 커서를 뒤쫓아 이동",
  definition: "커서를 한 박자 늦게 뒤쫓는 개체",
  hint: "커서를 움직여보기",
  description: [
    "커서를 움직이면 화면 속 개체가 커서를 향해 다가온다. 한 번에 붙지 않고 매 순간 <strong>남은 거리의 일부만큼</strong> 좁혀 오기 때문에, 커서보다 조금 늦게 부드럽게 따라온다. 개체에 무게와 의지가 있는 것처럼 느껴진다.",
    "커서 자체의 모양이 바뀌는 커서 모핑이 아니라, 커서와 <strong>따로 존재하는 개체</strong>가 뒤쫓는 것이다. 커서와 개체 사이에 생기는 늦음(지연)이 이 인터랙션의 핵심이다."
  ],
  uses: [
    "포트폴리오 사이트에서 진짜 커서 뒤를 늦게 따라다니는 원형 커서",
    "커서를 졸졸 따라다니는 마스코트나 반려 캐릭터",
    "머리를 따라 몸통이 줄지어 따라오는 뱀 게임(Slither.io)",
    "링크 목록 위에서 커서를 따라다니는 미리보기 이미지"
  ],
  designPoints: [
    "따라오는 정도는 매 프레임 <code>남은 거리 × 비율</code>만큼 다가가는 방식(lerp)으로 정한다. 비율이 작을수록 느리고 무겁게 느껴진다.",
    "스프링 방식은 목표를 지나쳤다가 되돌아오며 출렁인다. 장난스러운 캐릭터에는 어울리지만 정밀한 UI에는 과하다.",
    "여러 개를 이으면 각자가 바로 앞의 것을 따라가 꼬리나 뱀이 된다. 서로 간격을 지키게 해야 멈췄을 때 한 점으로 뭉치지 않는다.",
    "진짜 커서는 숨기지 않는 편이 안전하다. 따라오는 개체는 늘 늦기 때문에 그것만으로는 정확히 가리킬 수 없다."
  ],
  prompts: {
    simple: "따라오기(Cursor Follow) 인터랙션을 만든다. 화면 위의 동그란 개체가 커서를 향해 매 순간 남은 거리의 일부만큼 다가가서, 커서보다 조금 늦게 부드럽게 따라온다. 커서 모양을 바꾸는 것이 아니라 커서와 별개인 개체가 뒤쫓는 것이며, 진짜 커서는 그대로 보인다.",
    detailed: "따라오기(Cursor Follow) 인터랙션을 만든다. 크림색 화면 가운데에 지름 약 56px의 동그란 개체가 하나 있다. 사용자가 누르지 않고 커서를 움직이면, 개체는 매 프레임 자기 위치와 커서 위치 사이의 남은 거리에 일정 비율(기본 10%)을 곱한 만큼만 커서 쪽으로 이동한다. 그래서 커서가 멀리 있을 때는 빠르게, 가까워질수록 느려지며 결국 커서 위치에 멈춘다. 이 비율은 화면 주사율이 달라도 같은 속도가 되도록 프레임 간 시간으로 보정한다. 진짜 커서는 숨기지 않고 십자(crosshair) 모양으로 둔다. 커서가 화면 밖으로 나가면 개체는 마지막 커서 위치까지 와서 멈춘다. 터치에서는 손가락이 닿아 있는 위치를 목표로 삼는다. 스프링 출렁임, 여러 개가 줄지어 따라오기, 회전, 잔상, 안내선 같은 추가 효과는 넣지 않는다."
  },
  related: [
    { label: "입력만 다른 같은 효과", items: [{ id: "click-to-target", text: "클릭한 곳으로 다가가기" }] },
    { label: "헷갈리는 개념", items: [{ id: "cursor-morph", text: "커서 모핑 (커서 자체가 바뀜)" }, { id: "look-at", text: "바라보기 (자리는 그대로, 방향만 돌림)" }, { id: "magnet", text: "자석 (가까우면 끌려와 붙음)" }] },
    { label: "함께 쓰이는 것", items: [{ id: "cursor-trail", text: "커서 궤적" }, { id: "flee", text: "도망가기 (반대로 멀어짐)" }] }
  ],
  references: [
    { name: "MDN — Element: mousemove event", url: "https://developer.mozilla.org/en-US/docs/Web/API/Element/mousemove_event", note: "커서 위치를 읽는 기본 이벤트다." },
    { name: "Wikipedia — Linear interpolation", url: "https://en.wikipedia.org/wiki/Linear_interpolation", note: "남은 거리의 일부씩 다가가는 lerp의 원리다." }
  ],
  tags: ["Mouse", "Move", "Follow", "Translate"],
  reads: "커서의 현재 위치(x, y). 개체는 매 프레임 자기 위치와 커서 사이의 남은 거리를 계산해 그 일부만큼 다가간다.",
  readouts: [
    { key: "cursor", label: "커서 위치" },
    { key: "lag", label: "지연 거리 px" },
    { key: "speed", label: "개체 속도 px/frame" },
    { key: "angle", label: "진행 방향 °" }
  ],
  variations: [
    { name: "따라오는 정도", desc: "매 프레임 남은 거리의 몇 %를 좁힐지 정한다. 작을수록 느리고 무겁다.",
      control: { type: "range", key: "strength", min: 0.02, max: 0.5, step: 0.01, default: 0.1, ends: ["느리고 무겁게", "빠르고 가볍게"] } },
    { name: "움직임 방식", desc: "감속은 다가갈수록 느려지며 멈춘다. 스프링은 목표를 지나쳤다가 되돌아오며 출렁인다.",
      control: { type: "seg", key: "motion", default: "ease", options: [["ease", "감속"], ["spring", "스프링"]] } },
    { name: "줄지어 따라오기", desc: "개체 여러 개가 각자 바로 앞의 개체를 따라가 뱀처럼 이어진다.",
      control: { type: "range", key: "count", min: 1, max: 16, step: 1, default: 1, ends: ["1개", "16개"], unit: "개" } },
    { name: "진행 방향으로 회전", desc: "개체가 움직이는 방향을 향해 뾰족하게 머리를 돌린다.",
      control: { type: "toggle", key: "rotate", default: false } },
    { name: "거리 두기", desc: "커서에 딱 붙지 않고 이 거리만큼 떨어져서 멈춘다.",
      control: { type: "range", key: "gap", min: 0, max: 150, step: 1, default: 0, ends: ["딱 붙음", "멀찍이"], unit: "px" } },
    { name: "가이드선", desc: "커서 위치에 작은 원을, 커서와 개체 사이에 점선을 그어 둘 사이의 지연 거리를 보여준다. 거리 두기를 쓰면 그 반경도 보인다.",
      control: { type: "toggle", key: "guide", default: false } }
  ]
};
