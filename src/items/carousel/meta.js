export default {
  name: "캐러셀", nameEn: "Carousel",
  aliases: ["목록 넘김", "슬라이더", "Slider", "페이저", "Pager", "이미지 슬라이드", "커버플로"],
  input: "← → 방향키 · 버튼",
  effect: "항목이 옆으로 넘어감",
  definition: "여러 항목을 한 장씩 옆으로 넘겨 보기",
  hint: "← → 로 넘기기",
  description: [
    "여러 장의 카드가 한 줄로 늘어서 있고, ←나 →를 누를 때마다 한 칸씩 옆으로 밀려 다음 항목이 가운데에 온다. 회전목마(carousel)처럼 항목들이 차례로 돌아 들어온다는 뜻이다.",
    "한 화면에 다 보여줄 수 없는 것을 <strong>같은 자리에서 차례로</strong> 보여준다. 스크롤처럼 연속된 양이 아니라 한 장, 한 장 끊어지는 단위로 넘어가기 때문에 '지금 몇 번째인지'가 늘 분명해야 한다."
  ],
  uses: [
    "쇼핑몰과 포털 첫 화면의 배너 슬라이드",
    "넷플릭스, 왓챠의 가로 작품 목록",
    "앱 첫 실행 때 보여주는 온보딩 화면",
    "사진 앱과 인스타그램 여러 장 게시물의 사진 넘기기",
    "아이튠즈와 옛 맥 파인더의 커버플로"
  ],
  designPoints: [
    "지금 위치를 점(인디케이터)이나 '3 / 8'로 알려준다. 점을 누르면 그 항목으로 바로 간다.",
    "양옆 항목을 살짝 보이게 두면 옆에 더 있다는 것을 말없이 알려준다.",
    "끝에서 멈출 때는 버튼을 흐리게 하고 살짝 튕기는 반응을 줘서 '더 없음'을 알린다. 무한 반복일 때는 마지막 다음에 첫 항목이 자연스럽게 이어진다.",
    "자동 넘김은 사용자가 내용을 읽는 중일 수 있으므로 마우스를 올리거나 키를 누르는 동안 멈춘다. 진행 막대로 다음 넘김까지 남은 시간을 보여준다."
  ],
  prompts: {
    simple: "캐러셀(Carousel) 인터랙션을 만든다. 카드 여러 장이 가로로 한 줄로 놓여 있고, 오른쪽 방향키나 다음 버튼을 누르면 한 칸씩 부드럽게 밀려 다음 카드가 가운데로 온다. 연속으로 흐르는 스크롤과 달리 한 장 단위로 끊어서 넘어가고, 지금 몇 번째 카드인지 점으로 표시한다.",
    detailed: "캐러셀(Carousel) 인터랙션을 만든다. 화면 가운데에 세로로 조금 긴 카드 8장이 가로 한 줄로 놓이고, 현재 카드가 가운데에 온다. 카드에는 번호(예: 03 / 08), 제목, 한 줄 설명이 있다. 오른쪽 방향키나 오른쪽 화살표 버튼을 누르면 모든 카드가 카드 한 장 너비만큼 왼쪽으로 부드럽게(약 0.3초, 끝에서 느려지게) 밀려 다음 카드가 가운데에 오고, 왼쪽 방향키나 왼쪽 버튼은 반대로 움직인다. Home 키는 첫 카드, End 키는 마지막 카드로 간다. 넘기는 도중에 또 누르면 목표가 한 칸 더 늘어나고 끊김 없이 이어서 움직인다. 첫 카드와 마지막 카드에서는 더 넘어가지 않고, 해당 방향 버튼을 흐리게 하며 누르면 살짝 밀렸다 돌아오는 반응만 준다. 화면 아래 가운데에 카드 수만큼 점을 두고 현재 카드의 점을 길게 표시하며, 점을 누르면 그 카드로 바로 간다. 옆에 보이는 카드를 눌러도 그 카드로 간다. 방향키를 누르는 동안 해당 화살표 버튼을 강조해서 어떤 키가 눌렸는지 보여준다. 방향키로 페이지가 스크롤되지 않게 한다. 자동 넘김, 3D 회전, 확대 같은 추가 효과는 넣지 않는다."
  },
  related: [
    { label: "입력만 다른 같은 효과", items: [{ id: "swipe", text: "스와이프로 넘기기" }, { id: "scroll-driven", text: "스크롤로 넘기기" }] },
    { label: "헷갈리는 개념", items: [{ id: "pan", text: "팬 (연속으로 둘러보기)" }, { id: "tabs-accordion", text: "탭 (제목을 골라 바꾸기)" }] },
    { label: "함께 쓰이는 것", items: [{ id: "filter-chips", text: "필터 칩" }] }
  ],
  references: [
    { name: "Carousel — Material Design 3", url: "https://m3.material.io/components/carousel/overview", note: "보이는 개수와 크기가 다른 여러 캐러셀 배치를 정리했다." },
    { name: "Carousels — Nielsen Norman Group", url: "https://www.nngroup.com/articles/designing-effective-carousels/", note: "자동 넘김과 인디케이터 설계에서 주의할 점을 다룬다." },
    { name: "Carousels Tutorial — W3C WAI", url: "https://www.w3.org/WAI/tutorials/carousels/", note: "키보드 조작과 자동 넘김 멈춤 같은 접근성 기준이다." }
  ],
  tags: ["Keyboard", "Press", "Translate", "Snap", "UI"],
  reads: "← →를 누른 순간 — 누를 때마다 목표 번호를 하나 늘리거나 줄이고, 화면은 그 번호를 향해 부드럽게 따라간다.",
  readouts: [
    { key: "index", label: "지금 항목" },
    { key: "key", label: "마지막 입력" },
    { key: "pos", label: "움직이는 위치 (소수 = 넘어가는 중)" },
    { key: "auto", label: "자동 넘김" }
  ],
  variations: [
    { name: "무한 반복", desc: "마지막 다음에 다시 첫 항목이 온다. 끄면 양 끝에서 멈추고 살짝 튕긴다.",
      control: { type: "toggle", key: "loop", default: false } },
    { name: "배치", desc: "평평하게 옆으로 밀거나, 옆 카드가 비스듬히 돌아가 있는 3D 커버플로로 보여준다.",
      control: { type: "seg", key: "layout", default: "flat", options: [["flat", "평면 슬라이드"], ["coverflow", "커버플로"]] } },
    { name: "보이는 개수", desc: "평면 슬라이드에서 한 화면에 보이는 카드 수다.",
      control: { type: "range", key: "visible", min: 1, max: 5, step: 1, default: 1, ends: ["1장", "5장"], unit: "장" } },
    { name: "자동 넘김", desc: "일정 시간마다 저절로 넘어간다. 마우스를 올리거나 키를 누르고 있으면 멈춘다.",
      control: { type: "toggle", key: "auto", default: false } },
    { name: "자동 넘김 간격", desc: "자동 넘김을 켰을 때 다음으로 넘어가기까지의 시간이다.",
      control: { type: "range", key: "interval", min: 1.5, max: 6, step: 0.5, default: 3, ends: ["빠르게", "천천히"], unit: "초" } }
  ]
};
