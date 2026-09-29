export default {
  name: "더블클릭 확대", nameEn: "Double-click to Zoom",
  aliases: ["Double-tap to Zoom", "두 번 눌러 확대", "더블탭 줌", "특정 개체로 확대 · 축소"],
  input: "더블클릭",
  effect: "누른 지점이나 개체로 확대 · 다시 누르면 축소",
  definition: "두 번 눌러 그 자리로 다가가기",
  hint: "카드를 빠르게 두 번 클릭",
  description: [
    "화면의 한 지점이나 개체를 빠르게 두 번 누르면 그곳을 향해 부드럽게 확대된다. 확대된 상태에서 다시 두 번 누르면 원래 크기로 물러난다. 사용자는 멀리서 보다가 <strong>한 걸음 다가가서 들여다보는</strong> 감각을 느낀다.",
    "핵심은 <strong>한 번 클릭과 두 번 클릭을 구분하는 것</strong>이다. 첫 클릭만으로는 아직 한 번인지 두 번인지 알 수 없으므로, 짧은 시간 동안 두 번째 클릭을 기다린 뒤에야 한 번 클릭 동작(선택)을 실행한다. 휠이나 핀치로 원하는 만큼 확대하는 줌과 달리, 정해진 배율로 한 번에 뛰어든다."
  ],
  uses: [
    "아이폰 사진 앱과 사파리에서 두 번 탭해 그 부분 확대하기",
    "Google 지도에서 더블클릭한 지점으로 한 단계 확대하기",
    "PDF 뷰어와 전자책에서 문단 하나를 화면 폭에 맞춰 키우기",
    "전시 지도, 인포그래픽에서 작은 글씨가 있는 영역으로 다가가기"
  ],
  designPoints: [
    "한 번 클릭에도 다른 동작(선택)이 있다면, 두 번째 클릭을 기다리는 동안 한 번 클릭 동작을 미뤄야 한다. 이 대기 시간만큼 한 번 클릭의 반응이 늦어지는 것이 대가다.",
    "두 클릭 사이 간격 기준은 보통 300~500ms다. 너무 짧으면 더블클릭이 잘 안 되고, 너무 길면 한 번 클릭이 굼뜨게 느껴진다. 두 클릭 위치가 멀리 떨어져 있으면 더블클릭으로 보지 않는다.",
    "누른 지점을 기준점으로 확대하면(그 점이 손가락 아래에 그대로 남는다) 방향을 잃지 않는다. 개체 중심으로 확대하면 개체가 화면 가운데로 모인다.",
    "커서를 <code>zoom-in</code> / <code>zoom-out</code>으로 바꿔 지금 두 번 누르면 무슨 일이 일어날지 미리 알린다."
  ],
  prompts: {
    simple: "더블클릭 확대(Double-click to Zoom) 인터랙션을 만든다. 보드 위의 한 지점이나 카드를 빠르게 두 번 누르면 그곳을 향해 정해진 배율로 부드럽게 확대되고, 확대된 상태에서 다시 두 번 누르면 원래 크기로 돌아온다. 한 번 클릭은 카드 선택이므로, 두 번째 클릭을 잠깐 기다렸다가 오지 않을 때만 선택으로 처리해 한 번 클릭과 확실히 구분한다.",
    detailed: "더블클릭 확대(Double-click to Zoom) 인터랙션을 만든다. 화면에 맞게 줄여 놓은 보드 위에 여러 장의 카드가 흩어져 있고, 각 카드에는 멀리서는 읽기 어려운 작은 글씨가 적혀 있다. 사용자가 같은 자리(두 클릭 사이 거리 24px 이내)를 350ms 안에 두 번 누르면 더블클릭으로 판정하고, 누른 지점이 손가락 아래에 그대로 머무는 채로 보드 전체가 2.5배로 0.4초 동안 부드럽게(처음엔 빠르고 끝에서 느려지게) 확대된다. 확대된 상태에서 다시 두 번 누르면 같은 방식으로 원래 크기와 위치로 돌아온다. 한 번 클릭은 카드를 선택하는 동작이므로, 첫 클릭 후 350ms 동안 두 번째 클릭을 기다리고, 그 안에 오지 않을 때만 선택으로 처리한다. 기다리는 동안에는 누른 자리에 줄어드는 작은 원을 보여 대기 중임을 알린다. 두 클릭이 멀리 떨어져 있거나 간격이 기준보다 길면 각각 한 번 클릭으로 처리한다. 커서는 확대 전에는 돋보기 더하기(zoom-in), 확대 후에는 돋보기 빼기(zoom-out) 모양으로 둔다. 마우스와 터치에서 같은 방식으로 동작한다. 끌어서 이동, 휠 확대, 단계별 연속 확대 같은 추가 기능은 넣지 않는다."
  },
  related: [
    { label: "입력만 다른 같은 효과", items: [{ id: "zoom", text: "핀치 · 휠 → 확대" }, { id: "click-to-target", text: "클릭 → 그 지점으로" }] },
    { label: "헷갈리는 개념", items: [{ id: "double-tap-like", text: "더블탭 좋아요 (같은 입력, 다른 결과)" }, { id: "zoom", text: "줌 (원하는 만큼 연속 확대)" }] },
    { label: "함께 쓰이는 것", items: [{ id: "pan", text: "팬 (확대 후 둘러보기)" }] }
  ],
  references: [
    { name: "Google Maps", url: "https://www.google.com/maps", note: "더블클릭한 지점을 기준으로 한 단계 확대된다." },
    { name: "Apple HIG · Gestures", url: "https://developer.apple.com/design/human-interface-guidelines/gestures", note: "두 번 탭하기를 확대 · 축소의 표준 제스처로 정리한다." },
    { name: "MDN · dblclick 이벤트", url: "https://developer.mozilla.org/en-US/docs/Web/API/Element/dblclick_event", note: "브라우저가 판정하는 더블클릭 이벤트다. 간격 기준은 운영체제 설정을 따른다." }
  ],
  reads: "두 클릭 사이 시간 간격과 거리, 그리고 누른 위치. 간격이 기준보다 짧고 거리가 가까우면 더블클릭이다.",
  readouts: [
    { key: "gap", label: "두 클릭 간격 ms" },
    { key: "judge", label: "판정" },
    { key: "level", label: "현재 배율" },
    { key: "center", label: "확대 중심 (보드 좌표)" }
  ],
  variations: [
    { name: "확대 배율", desc: "두 번 눌렀을 때 몇 배로 다가갈지 정한다.",
      control: { type: "range", key: "level", min: 1.5, max: 5, step: 0.1, default: 2.5, ends: ["1.5×", "5×"], unit: "×" } },
    { name: "애니메이션 시간", desc: "0이면 순간 이동처럼 바로 바뀐다. 너무 길면 답답하고, 없으면 어디로 왔는지 놓친다.",
      control: { type: "range", key: "dur", min: 0, max: 1200, step: 50, default: 400, ends: ["즉시", "느리게"], unit: "ms" } },
    { name: "확대 중심", desc: "누른 지점을 그 자리에 둔 채 확대하거나, 누른 카드를 화면 가운데로 가져오며 확대한다.",
      control: { type: "seg", key: "center", default: "point", options: [["point", "누른 지점"], ["object", "개체 중심"]] } },
    { name: "더블클릭 간격 기준", desc: "두 클릭 사이가 이 시간 안이어야 더블클릭이다. 길게 두면 한 번 클릭의 반응도 그만큼 늦어진다.",
      control: { type: "range", key: "interval", min: 150, max: 800, step: 10, default: 350, ends: ["빡빡하게", "느슨하게"], unit: "ms" } },
    { name: "한 번 클릭 미루기", desc: "켜면 두 번째 클릭을 기다린 뒤에 선택한다. 끄면 첫 클릭에 바로 선택되고, 더블클릭할 때도 선택이 함께 일어나 두 동작이 겹친다.",
      control: { type: "toggle", key: "wait", default: true } }
  ]
};
