export default {
  name: "스와이프", nameEn: "Swipe",
  aliases: ["잠금해제 / 스와이프", "Slide to Unlock", "밀어서 잠금 해제", "Swipe to Delete", "스와이프 카드"],
  input: "한 방향으로 밀기",
  effect: "기준을 넘기면 실행, 못 넘기면 되돌아감",
  definition: "한 방향으로 밀어 넘겨서 실행하기",
  hint: "옆으로 밀어서 넘기기",
  description: [
    "대상을 잡고 한 방향으로 민다. 미는 동안 대상은 손을 따라 움직이기만 하고, <strong>정해진 거리(기준선)를 넘긴 채 손을 떼야</strong> 동작이 실행된다. 기준을 못 넘기고 놓으면 제자리로 튕겨 돌아간다. 빠르게 휙 튕기면 거리가 짧아도 속도로 인정해 주기도 한다.",
    "버튼 클릭과 달리 실행 직전까지 <strong>마음을 바꿀 수 있는</strong> 입력이다. 밀어서 잠금 해제, 목록 항목을 밀어 삭제하기, 카드를 좌우로 넘겨 고르기가 모두 같은 원리다. 위치를 옮기는 드래그 앤 드롭과 달리 어디에 놓는지가 아니라 어느 방향으로 얼마나 밀었는지가 중요하다."
  ],
  uses: [
    "초기 아이폰의 '밀어서 잠금 해제', 결제 앱의 '밀어서 송금 확인'",
    "메일 앱(iOS 메일, Gmail)에서 항목을 밀어 삭제 · 보관하기",
    "틴더, 범블 같은 데이팅 앱에서 카드를 좌우로 넘겨 고르기",
    "알림 센터에서 알림을 밀어 치우기, 사진 앱에서 넘겨 다음 사진 보기"
  ],
  designPoints: [
    "기준은 <strong>거리와 속도 두 가지</strong>로 둔다. 멀리 밀었거나, 짧아도 빠르게 튕겼으면 실행한다. 둘 다 아니면 되돌린다.",
    "기준을 넘는 순간 색, 아이콘, 글자 같은 피드백을 바꿔서 '지금 놓으면 실행된다'는 것을 알린다.",
    "되돌아갈 때는 스프링처럼 튕겨 돌아가게 해서, 취소되었다는 것을 몸으로 느끼게 한다.",
    "삭제처럼 되돌릴 수 없는 동작은 기준을 멀게 잡고, 실행 뒤에 되돌리기(실행 취소)를 잠깐 보여준다."
  ],
  prompts: {
    simple: "스와이프(Swipe) 인터랙션을 만든다. 대상을 잡고 가로로 밀면 손을 따라 움직이고, 정해진 기준 거리를 넘긴 채 놓거나 빠르게 튕기면 동작이 실행되며, 기준을 못 넘기면 스프링처럼 제자리로 돌아간다. 어디에 놓는지가 중요한 드래그 앤 드롭과 달리, 어느 방향으로 얼마나 밀었는지만 판단한다.",
    detailed: "스와이프(Swipe) 인터랙션을 만든다. 예시로 메일 목록 다섯 줄을 두고, 각 줄을 누른 채 가로로 밀면 줄이 손가락을 따라 가로로만 움직이며 그 뒤에 숨어 있던 동작 영역이 드러난다(왼쪽으로 밀면 빨간 '삭제', 오른쪽으로 밀면 회색 '보관'). 줄 너비의 50%를 기준 거리로 하여 그 지점에 옅은 점선을 보여주고, 기준을 넘으면 동작 글자가 줄 끝을 따라붙어 지금 놓으면 실행된다는 것을 알린다. 손을 뗄 때 밀린 거리가 기준 이상이거나, 거리가 짧아도 떼는 순간의 속도가 0.5px/ms 이상이고 방향이 같으면 줄이 그 방향으로 화면 밖까지 밀려나고 높이가 줄어들며 사라진다. 둘 다 아니면 줄이 살짝 튕기듯 0.35초 동안 원래 자리로 돌아온다. 누른 뒤 세로로 더 많이 움직였다면 스와이프로 보지 않는다. 마우스와 터치에서 똑같이 동작하고, 누른 채 줄 밖으로 나가도 끊기지 않는다. 줄을 반쯤 열어두는 버튼 메뉴, 되돌리기, 소리 같은 추가 기능은 넣지 않는다."
  },
  related: [
    { label: "헷갈리는 개념", items: [{ id: "drag-and-drop", text: "드래그 앤 드롭 (놓는 위치가 중요)" }, { id: "fling", text: "던지기 (속도로 날려 보냄)" }] },
    { label: "비슷한 구조", items: [{ id: "pull-out", text: "뽑기 (버티다 기준을 넘으면 빠짐)" }, { id: "carousel", text: "캐러셀 (넘겨 보기)" }] },
    { label: "함께 쓰이는 것", items: [{ id: "undo-redo", text: "실행 취소" }] }
  ],
  references: [
    { name: "Apple HIG — Gestures", url: "https://developer.apple.com/design/human-interface-guidelines/gestures", note: "스와이프를 표준 제스처로 정의하고 쓰임을 정리해 두었다." },
    { name: "Material Design — Gestures", url: "https://m2.material.io/design/interaction/gestures.html", note: "스와이프로 치우기(swipe to dismiss)와 기준 거리 피드백을 다룬다." },
    { name: "Tinder", url: "https://tinder.com/", note: "카드를 좌우로 넘겨 고르는 스와이프를 서비스의 상징으로 만들었다." }
  ],
  reads: "누른 뒤 한 방향으로 움직인 거리(Δx)와 손을 떼는 순간의 속도를 읽는다. 둘 중 하나라도 기준을 넘으면 실행한다.",
  readouts: [
    { key: "dx", label: "Δx 민 거리" },
    { key: "progress", label: "기준까지 %" },
    { key: "speed", label: "속도 px/ms" },
    { key: "result", label: "판정" }
  ],
  variations: [
    { name: "쓰임", desc: "같은 스와이프를 세 가지로 쓴다. 잠금 해제 막대, 목록 줄 밀어 삭제 · 보관, 카드 좌우로 넘기기.",
      control: { type: "seg", key: "use", default: "list", options: [["unlock", "잠금 해제"], ["list", "목록"], ["card", "카드"]] } },
    { name: "기준 거리", desc: "막대 · 줄 · 카드 너비의 몇 %를 밀어야 실행되는지 정한다. 멀수록 실수로 실행되기 어렵다.",
      control: { type: "range", key: "threshold", min: 20, max: 90, step: 5, default: 50, ends: ["짧게", "길게"], unit: "%" } },
    { name: "빠르게 튕기기", desc: "거리가 모자라도 빠르게 휙 밀면 실행한다. 끄면 거리만 본다.",
      control: { type: "toggle", key: "flick", default: true } },
    { name: "기준선 보기", desc: "실행되는 거리를 점선으로 보여준다.",
      control: { type: "toggle", key: "guide", default: true } }
  ]
};
