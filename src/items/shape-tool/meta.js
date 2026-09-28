export default {
  name: "도형 도구", nameEn: "Shape Tool",
  aliases: ["도형 그리기", "Rectangle Tool", "Ellipse Tool", "Rubber-band Shape", "사각형 도구"],
  input: "누른 점에서 끌기",
  effect: "두 점으로 정한 크기의 도형 그리기",
  definition: "끈 거리만큼 사각형이나 원을 그리는 도구",
  hint: "누른 채 대각선으로 끌어 도형 그리기",
  description: [
    "누른 점과 지금 커서 위치, <strong>두 점이 도형의 크기를 정한다</strong>. 기본은 누른 점이 한 모서리가 되고 커서가 반대쪽 모서리가 되는 방식이다. 끄는 동안 도형이 고무줄처럼 늘었다 줄었다 하며 미리 보이고, 손을 떼면 그 크기로 확정된다.",
    "보조 키가 규칙을 바꾼다. <strong>Alt(⌥)</strong>를 누르면 누른 점이 도형의 중심이 되어 사방으로 퍼지고, <strong>Shift</strong>를 누르면 가로세로 비율이 1:1로 묶여 정사각형과 정원이 된다. 끄는 도중에 키를 누르고 떼도 바로 바뀐다."
  ],
  uses: [
    "피그마, 일러스트레이터, 포토샵의 사각형 · 타원 · 다각형 도구",
    "파워포인트와 키노트에서 도형 삽입하기",
    "파일 탐색기와 디자인 툴에서 여러 개를 한 번에 고르는 선택 영역(마키) 그리기",
    "화면 캡처 도구에서 캡처할 영역 지정하기, 전략게임에서 부대 여러 개를 끌어 선택하기"
  ],
  designPoints: [
    "모서리 기준과 중심 기준을 키 하나로 오가게 하되, 지금 어떤 기준인지(누른 점이 모서리인지 중심인지) 점이나 십자로 표시해준다.",
    "왼쪽 위로 끌어도 도형이 뒤집히지 않고 정상적으로 그려지게 한다. 크기는 항상 양수로, 시작점은 두 점 중 작은 쪽으로 정리한다.",
    "끄는 동안 <strong>가로 × 세로 치수</strong>를 커서 가까이에 보여주면 정확한 크기를 맞출 수 있다.",
    "비율 고정은 두 변 중 더 긴 쪽에 맞춘다. 짧은 쪽에 맞추면 커서가 도형 밖으로 삐져나와 어색하다."
  ],
  prompts: {
    simple: "도형 도구(Shape Tool) 인터랙션을 만든다. 누른 점을 한 모서리로, 현재 커서 위치를 반대쪽 모서리로 하는 사각형이나 타원이 끄는 동안 미리 보이고, 손을 떼면 그 크기로 확정된다. Alt를 누르면 누른 점이 도형의 중심이 되고, Shift를 누르면 가로세로 비율이 1:1로 고정된다.",
    detailed: "도형 도구(Shape Tool) 인터랙션을 만든다. 빈 종이 위에서 사용자가 누르면 그 지점이 시작점이 된다. 누른 채 움직이면 시작점과 현재 커서 위치를 마주 보는 두 모서리로 하는 사각형(또는 그 사각형에 꼭 맞게 들어가는 타원, 정다각형)이 강조색 선으로 미리 보이고, 손을 떼면 옅은 회색 면과 진한 테두리의 도형으로 확정된다. 왼쪽 위 방향으로 끌어도 도형이 뒤집히지 않도록 가로와 세로는 항상 양수로 계산한다. Alt(⌥) 키를 누르고 있는 동안은 시작점이 도형의 중심이 되어, 시작점에서 커서까지 거리의 두 배가 가로세로 크기가 된다. Shift 키를 누르고 있는 동안은 가로와 세로 중 더 긴 쪽에 맞춰 1:1 비율로 고정된다. 두 키는 끄는 도중에 누르거나 떼도 커서를 움직이지 않은 채 바로 반영된다. 미리보기 도형 옆에 가로 × 세로 크기(px)를 표시하고, 시작점을 작은 점으로(중심 기준일 때는 십자로) 보여준다. 3px 미만으로 끌고 떼면 도형을 만들지 않고, 백스페이스나 Ctrl+Z(⌘+Z)로 마지막 도형을 지운다. 커서는 십자 모양이고 마우스와 터치 모두에서 동작한다. 도형 선택, 이동, 크기 조절 손잡이, 색 선택 같은 추가 기능은 넣지 않는다."
  },
  related: [
    { label: "같은 방식의 도구", items: [{ id: "line-tool", text: "직선 도구 (두 점으로 선)" }] },
    { label: "헷갈리는 개념", items: [{ id: "text-selection", text: "텍스트 선택 (끌어서 고르기)" }, { id: "freehand", text: "자유 그리기 (경로가 남음)" }] },
    { label: "함께 쓰이는 것", items: [{ id: "shortcut", text: "단축키 (Shift, Alt 보조 키)" }, { id: "undo-redo", text: "실행 취소" }] }
  ],
  references: [
    { name: "Figma", url: "https://www.figma.com/", note: "R, O 키로 사각형과 타원 도구를 켜고 Shift와 Alt로 비율과 기준점을 바꾼다." },
    { name: "Sketchpad (Ivan Sutherland, 1963)", url: "https://en.wikipedia.org/wiki/Sketchpad", note: "두 점을 찍어 도형을 만드는 방식의 출발점이다." }
  ],
  tags: ["Mouse", "Drag", "Draw", "Scale"],
  reads: "누른 위치와 현재 커서 위치 두 점을 읽고, 두 점의 가로 · 세로 차이로 도형의 크기를 정한다. Shift와 Alt 키가 눌렸는지도 계속 읽는다.",
  readouts: [
    { key: "start", label: "시작점 x, y" },
    { key: "size", label: "크기 가로 × 세로" },
    { key: "origin", label: "시작점의 역할" },
    { key: "count", label: "그린 도형 수" }
  ],
  variations: [
    { name: "도형", desc: "같은 두 점으로 사각형, 타원, 정다각형을 그린다. 크기를 정하는 방식은 모두 같다.",
      control: { type: "seg", key: "shape", default: "rect", options: [["rect", "사각형"], ["ellipse", "타원"], ["polygon", "다각형"]] } },
    { name: "기준점", desc: "누른 점을 모서리로 쓸지 중심으로 쓸지 정한다. Alt(⌥)를 누르는 동안은 반대로 바뀐다.",
      control: { type: "seg", key: "origin", default: "corner", options: [["corner", "모서리에서"], ["center", "중심에서"]] } },
    { name: "비율 고정", desc: "항상 정사각형과 정원으로 그린다. 끈 상태에서는 Shift를 누르는 동안만 고정된다.",
      control: { type: "toggle", key: "square", default: false } },
    { name: "치수 표시", desc: "끄는 동안 가로 × 세로 크기와 기준 상자를 보여준다.",
      control: { type: "toggle", key: "dims", default: true } },
    { name: "다각형 변의 수", desc: "다각형을 고르면 쓰인다. 3이면 삼각형, 6이면 육각형이다.",
      control: { type: "range", key: "sides", min: 3, max: 10, step: 1, default: 6, ends: ["3", "10"] } }
  ]
};
