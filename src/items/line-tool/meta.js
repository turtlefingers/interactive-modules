export default {
  name: "직선 도구", nameEn: "Line Tool",
  aliases: ["선그리기 (직선)", "Rubber-band Line", "러버밴드", "Line Segment Tool", "선 도구"],
  input: "누른 점에서 끌기",
  effect: "두 점을 잇는 직선 그리기",
  definition: "누른 점에서 커서까지 직선을 긋는 도구",
  hint: "누른 채 끌어서 직선 긋기",
  description: [
    "누른 지점이 선의 시작점으로 고정되고, 끄는 동안 시작점에서 커서까지 <strong>고무줄처럼 늘어나는 미리보기 선</strong>이 따라다닌다. 손을 떼는 순간 그 자리에 선이 확정된다. 지나간 경로는 상관없고 두 점(누른 곳과 뗀 곳)만 중요하다.",
    "손이 지나간 대로 남는 자유 그리기(프리핸드)와 다르다. 중간에 아무리 구불구불 움직여도 결과는 항상 곧은 선이다. Shift를 누르면 0°, 45°, 90° 방향으로 딱 맞춰져서 손으로는 긋기 어려운 수평선과 수직선을 정확히 그을 수 있다."
  ],
  uses: [
    "피그마, 일러스트레이터, 포토샵의 선 도구와 Shift로 수평 · 수직선 긋기",
    "캐드(AutoCAD)와 스케치업에서 치수를 보며 벽선 긋기",
    "그림판과 화이트보드 앱(Miro, FigJam)의 화살표 연결선",
    "퍼즐 게임에서 점과 점을 잇는 한붓 그리기, 지도 앱의 거리 재기 도구"
  ],
  designPoints: [
    "끄는 동안의 미리보기 선은 확정된 선과 색이나 굵기를 달리해서 <strong>아직 확정되지 않았다</strong>는 것을 알린다.",
    "길이와 각도를 커서 옆에 바로 보여주면 치수를 맞춰 그릴 수 있다. 각도 스냅이 걸렸을 때는 기준선을 함께 그려서 '딱 맞았다'는 것을 확인시킨다.",
    "너무 짧은 선(몇 px 이하)은 실수로 클릭한 것으로 보고 만들지 않는다.",
    "커서는 <code>crosshair</code>(십자)로 두어 점을 정확히 찍는 도구임을 알린다."
  ],
  prompts: {
    simple: "직선 도구(Line Tool) 인터랙션을 만든다. 누른 지점이 시작점으로 고정되고, 끄는 동안 시작점에서 커서까지 곧은 미리보기 선이 고무줄처럼 늘어나며, 손을 떼면 그 선이 확정된다. 지나간 경로를 따라 그려지는 자유 그리기와 달리 누른 점과 뗀 점만 이어지며, Shift를 누르면 45° 단위로 각도가 맞춰진다.",
    detailed: "직선 도구(Line Tool) 인터랙션을 만든다. 모눈이 옅게 깔린 빈 종이 위에서 사용자가 누르면 그 지점이 시작점으로 고정되고 작은 점으로 표시된다. 누른 채 움직이는 동안 시작점에서 현재 커서 위치까지 곧은 미리보기 선을 강조색으로 그리며, 중간 경로는 무시하고 항상 두 점만 잇는다. 선 끝 옆에 길이(px)와 각도(오른쪽 수평을 0°로 하고 반시계 방향으로 커지는 0~360°)를 표시하고, 시작점에 수평 기준선과 각도를 나타내는 작은 호를 그린다. Shift를 누르고 있으면 각도가 0°, 45°, 90°처럼 45° 단위 중 가장 가까운 방향으로 맞춰지고 길이는 유지되며, 맞춰진 동안 그 방향의 점선 안내선을 길게 그린다. 손을 떼면 미리보기 선이 진한 색의 확정된 선으로 바뀌어 남고, 시작점에서 4px 미만으로 움직였다면 선을 만들지 않는다. 백스페이스나 Ctrl+Z(⌘+Z)를 누르면 마지막 선이 지워진다. 커서는 십자 모양이고, 마우스와 터치에서 똑같이 동작하며, 누른 채 화면 밖으로 나가도 끊기지 않는다. 선 선택, 이동, 곡선, 색 바꾸기 같은 추가 기능은 넣지 않는다."
  },
  related: [
    { label: "헷갈리는 개념", items: [{ id: "freehand", text: "자유 그리기 (지나간 경로가 그대로 남음)" }, { id: "slingshot", text: "새총 (끈 선의 반대 방향으로 날림)" }] },
    { label: "같은 방식의 도구", items: [{ id: "shape-tool", text: "도형 도구 (두 점으로 사각형 · 원)" }] },
    { label: "함께 쓰이는 것", items: [{ id: "undo-redo", text: "실행 취소" }, { id: "shortcut", text: "단축키 (Shift로 각도 고정)" }] }
  ],
  references: [
    { name: "Sketchpad (Ivan Sutherland, 1963)", url: "https://en.wikipedia.org/wiki/Sketchpad", note: "라이트 펜으로 두 점을 찍어 직선을 긋던 최초의 그래픽 편집기다." },
    { name: "Figma", url: "https://www.figma.com/", note: "L 키로 선 도구를 켜고 Shift로 45° 단위로 고정한다." }
  ],
  reads: "누른 위치(시작점)와 현재 커서 위치 두 점을 읽는다. 두 점 사이의 거리가 길이, atan2로 구한 방향이 각도가 된다. Shift 키가 눌렸는지도 읽는다.",
  readouts: [
    { key: "start", label: "시작점 x, y" },
    { key: "len", label: "길이 px" },
    { key: "ang", label: "각도 °" },
    { key: "count", label: "그은 선 수" }
  ],
  variations: [
    { name: "각도 스냅", desc: "45° 단위(0°, 45°, 90°…)로 방향을 맞춘다. Shift를 누를 때만, 항상, 또는 끔 중에 고른다.",
      control: { type: "seg", key: "snap", default: "shift", options: [["shift", "Shift 누를 때"], ["always", "항상"], ["off", "끔"]] } },
    { name: "길이 · 각도 표시", desc: "끄는 동안 커서 옆에 길이와 각도를, 시작점에 각도 호를 보여준다.",
      control: { type: "toggle", key: "label", default: true } },
    { name: "화살촉", desc: "선 끝에 화살촉을 붙인다. 방향이 있는 연결선이 된다.",
      control: { type: "seg", key: "arrow", default: "none", options: [["none", "없음"], ["end", "끝"], ["both", "양쪽"]] } },
    { name: "이어 긋기", desc: "선을 놓으면 그 끝에서 다음 선이 이어진다(꺾은선). 더블클릭이나 Esc, Enter로 끝낸다.",
      control: { type: "toggle", key: "poly", default: false } },
    { name: "선 굵기", desc: "확정된 선의 굵기다. 이미 그은 선에도 바로 적용된다.",
      control: { type: "range", key: "width", min: 1, max: 12, step: 1, default: 3, ends: ["얇게", "굵게"], unit: "px" } }
  ]
};
