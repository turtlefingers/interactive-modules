export default {
  name: "순서 바꾸기", nameEn: "Drag to Reorder",
  aliases: ["목록 순서 바꾸기", "Sortable List", "정렬 가능한 목록", "리스트 재정렬"],
  input: "목록 항목을 끌어 옮기기",
  effect: "다른 항목이 비켜나며 순서 변경",
  definition: "목록 항목을 끌어 원하는 순서로 바꾸기",
  hint: "항목을 끌면 → 다른 항목이 비켜나 순서가 바뀐다",
  description: [
    "목록의 한 항목을 잡아 위아래로 끌면, 지나가는 자리의 다른 항목들이 0.25초 동안 미끄러져 비켜나며 들어갈 틈을 만들어준다. 사용자가 놓으면 끌던 항목이 비어 있는 틈에 들어가고 새 순서가 확정된다. 사용자는 항목을 직접 끌어 목록의 순서를 정하고, 놓기 전에 바뀔 순서를 미리 본다.",
    "개체를 아무 데나 옮기는 <strong>드래그 앤 드롭</strong>과 달리, 순서 바꾸기는 위치가 아니라 <strong>순서(몇 번째인지)</strong>만 바뀐다. 놓은 항목은 정확한 좌표가 아니라 가장 가까운 칸으로 들어가고, 나머지 항목들은 한 칸씩 밀려 빈자리를 채운다."
  ],
  uses: [
    "iOS와 안드로이드 설정에서 알림, 위젯, 제어 센터 항목 순서 바꾸기",
    "Spotify, 멜론 같은 음악 앱에서 재생 목록 곡 순서 바꾸기",
    "Trello, Notion에서 할 일 카드와 블록 순서 바꾸기",
    "홈 화면에서 앱 아이콘을 끌어 격자 배치를 바꾸기"
  ],
  designPoints: [
    "다른 항목이 <strong>미리 비켜나야</strong> 놓을 곳이 보인다. 다른 항목이 순간이동하지 않고 짧게(데모에서는 0.25초) 미끄러지면, 사용자가 어떤 항목이 어디로 갔는지 눈으로 따라갈 수 있다(FLIP 애니메이션).",
    "목록이 스크롤되는 곳에서는 사용자가 손잡이를 눌렀을 때만 항목이 끌리게 해야, 같은 끌기 동작이 스크롤인지 항목 옮기기인지 섞이지 않는다. 손잡이(⋮⋮)는 잡을 수 있다는 신호이기도 하다.",
    "목록이 화면보다 길면, 사용자가 항목을 목록 위아래 가장자리 64px 안으로 끌었을 때 목록이 <strong>자동 스크롤</strong>된다. 가장자리에 가까울수록 빠르게(최대 14px/frame) 스크롤된다.",
    "자리 표시는 비워두기, 점선 테두리, 흐린 복제본 중에서 목록의 밀도에 맞게 고른다."
  ],
  prompts: {
    simple: "순서 바꾸기(Drag to Reorder) 인터랙션을 만든다. 목록 항목을 잡고 끌면 다른 항목들이 부드럽게 비켜나 들어갈 자리를 만들고, 놓으면 끌던 항목이 비어 있는 자리에 들어가 순서가 바뀐다. 개체를 자유로운 좌표에 놓는 드래그 앤 드롭과 달리, 놓은 항목이 가장 가까운 칸으로 들어가 순서만 바뀐다.",
    detailed: "순서 바꾸기(Drag to Reorder) 인터랙션을 만든다. 화면 가운데에 세로로 스크롤되는 목록이 있고, 각 항목은 왼쪽의 손잡이(점 여섯 개), 원래 번호, 제목으로 이루어진 같은 높이의 카드다. 항목은 목록 높이보다 많다. 항목을 누르면 테두리가 강조색으로 바뀌고 살짝 커지며 그림자가 생겨 떠오른다. 누른 채 움직이면 누른 지점과 항목의 간격을 유지하며 세로로만 따라온다. 끌고 있는 항목의 위치에서 가장 가까운 칸 번호를 계산해, 그 칸이 바뀔 때마다 나머지 항목들이 0.25초 동안 부드럽게 미끄러져 새 자리로 비켜나고, 비어 있는 칸에는 점선 테두리의 자리 표시가 나타난다. 놓으면 항목이 그 칸으로 미끄러져 내려앉고 순서가 확정된다. 끄는 동안 포인터가 목록의 위나 아래 가장자리 64px 안으로 들어가면, 가장자리에 가까울수록 빠르게(최대 14px/frame) 자동 스크롤하고, 스크롤되는 동안에도 칸 계산을 계속한다. 격자 배치에서는 가로와 세로로 모두 움직이며 가장 가까운 칸으로 들어간다. 손잡이만으로 잡기를 켜면 손잡이를 눌렀을 때만 끌고, 나머지 부분은 목록 스크롤에 쓴다. 커서는 grab과 grabbing이고, 마우스와 터치에서 같게 동작한다. 삭제, 여러 개 선택, 다른 목록으로 옮기기 같은 추가 기능은 넣지 않는다."
  },
  related: [
    { label: "헷갈리는 개념", items: [{ id: "drag-and-drop", text: "드래그 앤 드롭 (자유로운 위치에 놓음)" }] },
    { label: "함께 쓰이는 것", items: [{ id: "carousel", text: "캐러셀" }, { id: "filter-chips", text: "필터 칩" }, { id: "undo-redo", text: "되돌리기 (순서를 원래대로)" }] }
  ],
  references: [
    { name: "Apple HIG — Lists and tables", url: "https://developer.apple.com/design/human-interface-guidelines/lists-and-tables", note: "목록 항목의 순서 바꾸기와 손잡이 표시를 다룬다." },
    { name: "SortableJS", url: "https://sortablejs.github.io/Sortable/", note: "순서 바꾸기 목록과 격자의 여러 변주를 직접 끌어볼 수 있는 예제 모음이다." },
    { name: "FLIP Your Animations (Paul Lewis)", url: "https://aerotwist.com/blog/flip-your-animations/", note: "다른 항목이 비켜나는 움직임을 부드럽게 만드는 FLIP 기법의 원문이다." }
  ],
  reads: "끄는 항목의 위치 — 가장 가까운 칸이 몇 번째인지. 포인터에서 목록 가장자리까지의 거리도 읽어 자동 스크롤 속도를 정한다.",
  readouts: [
    { key: "from", label: "잡은 항목" },
    { key: "to", label: "놓일 자리" },
    { key: "shift", label: "옮기는 칸 수" },
    { key: "scroll", label: "자동 스크롤 px/frame" }
  ],
  variations: [
    { name: "배치", desc: "세로 목록 또는 격자(홈 화면 아이콘 같은)로 바꾼다. 격자에서는 가로세로로 움직인다.",
      control: { type: "seg", key: "layout", default: "list", options: [["list", "목록"], ["grid", "격자"]] } },
    { name: "손잡이로만 잡기", desc: "사용자가 손잡이(⋮⋮)를 눌렀을 때만 항목이 끌린다. 항목의 나머지 부분은 스크롤이나 클릭에 쓸 수 있다.",
      control: { type: "toggle", key: "handleOnly", default: false } },
    { name: "자리 표시", desc: "들어갈 자리를 비워두거나, 점선 테두리 또는 흐린 복제본으로 보여준다.",
      control: { type: "seg", key: "placeholder", default: "outline", options: [["gap", "빈칸"], ["outline", "점선"], ["ghost", "흐린 복제"]] } },
    { name: "자동 스크롤", desc: "항목을 목록 가장자리로 끌면 목록이 저절로 스크롤된다. 끄면 보이는 범위 밖으로는 항목을 옮길 수 없다.",
      control: { type: "toggle", key: "autoScroll", default: true } },
    { name: "비켜나기 애니메이션", desc: "다른 항목이 미끄러지며 비켜난다. 끄면 다른 항목이 순간이동해서, 사용자가 어떤 항목이 움직였는지 놓치기 쉽다.",
      control: { type: "toggle", key: "animate", default: true } }
  ]
};
