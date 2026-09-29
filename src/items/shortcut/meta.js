export default {
  name: "단축키", nameEn: "Keyboard Shortcut",
  aliases: ["단축키 조합", "핫키", "Hotkey", "키 코드", "Key Chord", "키보드 명령"],
  input: "여러 키 동시에 누르기",
  effect: "명령 바로 실행",
  definition: "여러 키를 함께 눌러 명령을 바로 실행하기",
  hint: "도형을 고르고 ⌘/Ctrl + D",
  description: [
    "⌘(또는 Ctrl)를 누른 채 D를 누르면 복제, G를 누르면 그룹이 된다. 메뉴를 찾아 들어가지 않고 <strong>손가락 모양 하나로</strong> 명령을 바로 실행한다. 익숙해질수록 손이 먼저 움직이는, 숙련자를 위한 지름길이다.",
    "보조 키(⌘, Ctrl, ⇧, ⌥)를 먼저 누르고 있다가 글자 키를 누르는 <strong>동시 누름(chord)</strong>이 핵심이다. 화음(chord)처럼 여러 키가 함께 울린다는 뜻이다. 순서대로 누르는 치트 코드와 다르다."
  ],
  uses: [
    "문서 편집의 ⌘C, ⌘V, ⌘Z (복사, 붙여넣기, 되돌리기)",
    "피그마, 포토샵의 ⌘D 복제, ⌘G 그룹, ⇧+방향키 크게 옮기기",
    "지메일, 깃허브, 노션의 한 글자 단축키와 ? 로 여는 단축키 목록",
    "게임의 퀵슬롯(1~9)과 ⇧+클릭 같은 조합 입력"
  ],
  designPoints: [
    "단축키는 보이지 않는 기능이다. 메뉴나 툴팁 옆에 단축키를 적어두고, <code>?</code>로 목록을 여는 관례를 따른다.",
    "브라우저와 운영체제가 쓰는 단축키(⌘W 탭 닫기, ⌘T 새 탭, ⌘R 새로고침, ⌘Q 종료)는 빼앗지 않는다. 처리하는 조합에만 <code>preventDefault</code>를 한다.",
    "맥은 ⌘, 윈도우는 Ctrl이 주 보조 키다. 표시는 플랫폼에 맞추고, 입력은 둘 다 받아주면 편하다. 맥에서는 ⌘를 누른 채 다른 키를 떼도 <code>keyup</code>이 오지 않으므로 ⌘를 뗄 때 함께 정리한다.",
    "한 번에 여러 번 누른 방향키 이동은 되돌리기 한 번으로 묶는다. 되돌리기 단위가 곧 사용자가 생각하는 동작 단위다."
  ],
  prompts: {
    simple: "단축키(Keyboard Shortcut) 인터랙션을 만든다. 작은 편집 화면에서 도형을 고른 뒤 ⌘(윈도우는 Ctrl)를 누른 채 D를 누르면 복제, G를 누르면 그룹, Z를 누르면 되돌리기가 바로 실행된다. 키를 순서대로가 아니라 동시에 누르는 조합을 읽으며, 브라우저가 쓰는 탭 닫기나 새로고침 같은 단축키는 빼앗지 않는다.",
    detailed: "단축키(Keyboard Shortcut) 인터랙션을 만든다. 모눈 배경의 편집 화면에 사각형과 원 대여섯 개가 있다. 도형을 클릭하면 선택되어 강조 색 윤곽이 생기고, ⇧를 누른 채 클릭하면 여러 개를 고르며, 빈 곳을 클릭하면 선택이 풀린다. 선택한 도형은 끌어서 옮길 수 있다. 맥에서는 ⌘, 윈도우에서는 Ctrl을 주 보조 키로 표시하되 입력은 둘 다 받는다. 주 보조 키+A는 모두 선택, +D는 선택한 도형을 오른쪽 아래로 24px 비켜 복제하고 복제본을 선택, +G는 선택한 도형들을 그룹으로 묶어 점선 테두리로 감싸고(그룹 안 하나를 클릭하면 그룹 전체가 선택된다), +⇧+G는 그룹 해제, +Z는 되돌리기, +⇧+Z는 다시 하기다. Delete나 Backspace는 삭제, Esc는 선택 해제, 방향키는 2px, ⇧+방향키는 20px 이동이며 연속으로 누른 이동은 되돌리기 한 번으로 묶는다. 이 조합들만 브라우저 기본 동작을 막고, ⌘W, ⌘T, ⌘R 같은 나머지 조합은 그대로 브라우저에 넘긴다. 화면 오른쪽 위에 단축키 목록을 두고, 실행된 명령의 줄을 잠깐 강조하며, 지금 실행할 수 없는 명령은 흐리게 표시한다. 목록의 줄을 클릭해도 같은 명령이 실행되고, ? 키로 목록을 열고 닫는다. 화면 아래 가운데에 지금 누르고 있는 키들을 '⌘ + D'처럼 키 모양으로 보여주고 실행된 명령 이름을 옆에 적는다. 정렬, 복사·붙여넣기, 크기 조절 같은 추가 기능은 넣지 않는다."
  },
  related: [
    { label: "헷갈리는 개념", items: [{ id: "cheat-code", text: "치트 코드 (순서대로 누름)" }] },
    { label: "함께 쓰이는 것", items: [{ id: "undo-redo", text: "되돌리기 · 다시 하기" }, { id: "context-menu", text: "우클릭 메뉴 (단축키를 옆에 적어둔다)" }, { id: "drag-and-drop", text: "드래그 앤 드롭" }] }
  ],
  references: [
    { name: "Keyboard shortcuts — Apple Human Interface Guidelines", url: "https://developer.apple.com/design/human-interface-guidelines/keyboards", note: "맥의 표준 단축키와 보조 키 순서(⌃⌥⇧⌘) 규칙이다." },
    { name: "Mac keyboard shortcuts — Apple Support", url: "https://support.apple.com/en-us/102650", note: "사용자가 이미 몸으로 익힌 단축키 목록이다. 이것과 겹치지 않게 설계한다." },
    { name: "Figma", url: "https://www.figma.com/", note: "⌘D, ⌘G, ⇧+방향키 같은 편집 단축키와 단축키 목록 패널의 좋은 예다." }
  ],
  reads: "동시에 눌린 키 조합 — 글자 키가 눌린 순간 보조 키(⌘/Ctrl, ⇧, ⌥)가 함께 눌려 있는지를 보고 명령을 고른다.",
  readouts: [
    { key: "keys", label: "누르고 있는 키" },
    { key: "mods", label: "보조 키" },
    { key: "cmd", label: "마지막 명령" },
    { key: "sel", label: "선택 / 전체 도형" }
  ],
  variations: [
    { name: "단축키 목록", desc: "화면에 단축키 목록을 띄워둔다. 끄면 ? 키나 오른쪽 아래 ? 버튼으로만 연다.",
      control: { type: "toggle", key: "sheet", default: true } },
    { name: "누른 키 표시", desc: "지금 누르고 있는 키 조합과 실행된 명령을 화면 아래에 보여준다. 발표나 튜토리얼 영상에서 쓰는 방식이다.",
      control: { type: "toggle", key: "chord", default: true } },
    { name: "표시 방식", desc: "맥은 ⌘ ⇧ ⌥ 기호로, 윈도우는 Ctrl Shift Alt 글자로 적는다. 입력은 어느 쪽이든 ⌘와 Ctrl을 모두 받는다.",
      control: { type: "seg", key: "platform", default: "auto", options: [["auto", "자동"], ["mac", "맥"], ["win", "윈도우"]] } }
  ]
};
