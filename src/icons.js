/* ============================================================
   항목 아이콘
   - 의미가 분명하게 읽히는 것은 Lucide(https://lucide.dev) 아이콘을 쓰고,
     그렇지 않은 것은 여기서 직접 그린다 (24px 격자, 선 1.75, 둥근 끝)
   - 공통 요소: 작은 채운 커서 cur(), 키캡 key(), 점선 DASH
   - INPUT_BADGES: 카테고리(입력 방식)를 나타내는 작은 배지
   ============================================================ */
import {
  ToggleRight, Flag, ZoomIn, Heart, PencilLine, Magnet, Orbit, CloudDrizzle, Hand,
  GitBranch, Dices, Undo2, GalleryHorizontal, Rotate3d, Command, KeyboardMusic, MessageCircleMore,
  MousePointer2, MouseLeft, MousePointerClick, MouseRight, Mouse, Timer, Pointer, HandGrab, MoveVertical, SquareMousePointer,
  Keyboard, Touchpad, AppWindowMac
} from "lucide";

/* ---------- 그리기 도구 ---------- */
const DASH = `stroke-dasharray="2 2.6"`;
/** 작은 채운 커서. (x, y)가 커서 끝이다 */
const cur = (x, y, s = 1) =>
  `<path transform="translate(${x} ${y}) scale(${s})" d="M0 0V9.2l2.6-2.3 1.8 3.7 1.7-.8-1.8-3.6h3.5z" fill="currentColor" stroke="currentColor" stroke-width="1" stroke-linejoin="round"/>`;
/** 키캡 */
const key = (x, y, w = 6, h = 6) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="1.6"/>`;
const dot = (x, y, r = 1.3) => `<circle cx="${x}" cy="${y}" r="${r}" fill="currentColor" stroke="none"/>`;
const arrowHead = (x, y, dir) => ({
  r: `<path d="M${x - 2.2} ${y - 2.2}L${x} ${y}l-2.2 2.2"/>`,
  l: `<path d="M${x + 2.2} ${y - 2.2}L${x} ${y}l2.2 2.2"/>`,
  u: `<path d="M${x - 2.2} ${y + 2.2}L${x} ${y}l2.2 2.2"/>`,
  d: `<path d="M${x - 2.2} ${y - 2.2}L${x} ${y}l2.2-2.2"/>`
}[dir]);

/* ---------- 직접 그린 아이콘 (SVG 안쪽 마크업) ---------- */
const CUSTOM = {
  // 커서를 감싼 틀이 원에서 사각형으로 바뀌는 중
  "cursor-morph": `<path d="M12 3.5h5a2.5 2.5 0 0 1 2.5 2.5v10a2.5 2.5 0 0 1-2.5 2.5h-5a7.5 7.5 0 0 1 0-15z"/>${cur(10, 7.5)}`,
  // 누르는 동안 부푸는 풍선
  "press-and-hold": `<circle cx="11" cy="10" r="4.2"/><circle cx="11" cy="10" r="7.8" ${DASH}/>${cur(13.5, 12.5)}`,
  // 발사대에서 탄이 줄지어 나간다
  "auto-fire": `<rect x="2.5" y="8.5" width="5" height="7" rx="1.6"/>${dot(11.5, 12, 1.5)}${dot(16, 12, 1.5)}${dot(20.5, 12, 1.5)}`,
  // 한 발과 속도선
  "single-shot": `<rect x="2.5" y="8.5" width="5" height="7" rx="1.6"/><path d="M10 9.5h3M9.5 14.5h3"/>${dot(18.5, 12, 2.3)}`,
  // 클릭할 때마다 +1
  "click-counter": `<path d="M3.5 6.5h5M6 4v5"/><path d="M13 5.2 15 4v6"/>${cur(8.5, 12.5)}<path d="M18 13.5l2-1M18.5 17h2.2"/>`,
  // 버튼 위를 도는 쿨다운 부채꼴
  "cooldown": `<rect x="3.5" y="3.5" width="17" height="17" rx="4"/><path d="M12 12V6.5A5.5 5.5 0 0 1 16.8 14.7z" fill="currentColor" fill-opacity=".25"/><path d="M12 12V6.5"/>`,
  // 우클릭 자리에 뜬 메뉴
  "context-menu": `${cur(3.5, 3)}<rect x="10" y="9" width="11" height="12" rx="2"/><path d="M13 13h5M13 16.5h3.5"/>`,
  // 커서를 느리게 따라오는 원
  "cursor-follow": `<circle cx="6" cy="6" r="2.8"/>${dot(10, 10, .9)}${dot(12.3, 12.3, .9)}${cur(14.5, 14.5)}`,
  // 지나간 자리에 남은 점선 궤적
  "cursor-trail": `<path d="M3 19c2.5-5 5.5 1.5 8-3.5s3-4 3-4" ${DASH}/>${cur(14, 9)}`,
  // 눈동자가 커서 쪽을 본다
  "look-at": `<circle cx="7" cy="9" r="4"/><circle cx="16.5" cy="9" r="4"/>${dot(8.6, 10.6, 1.5)}${dot(18.1, 10.6, 1.5)}${cur(16, 15)}`,
  // 커서가 가장자리로 가면 시야가 그쪽으로 이동
  "mouse-look": `<rect x="2.5" y="4.5" width="14" height="15" rx="2"/><path d="M19 12h3"/>${arrowHead(22, 12, "r")}${cur(11, 9)}`,
  // 겹겹의 산이 서로 다르게 밀린다
  "mouse-parallax": `<path d="M2 15l5-5.5 4 4"/><path d="M8 20l6-7 7.5 7"/><path d="M2 20h7"/>${cur(15, 3.5, .85)}`,
  // 흔들면 풀린다
  "shake-to-cancel": `<path d="M3 7.5l2.5-3 2.5 3 2.5-3 2.5 3"/>${cur(8, 11)}<path d="M17 15l4 4M21 15l-4 4"/>`,
  // 커서에 가까운 점일수록 크다
  "proximity": `${dot(4.5, 4.5, .9)}${dot(10, 4.5, 1.2)}${dot(15.5, 4.5, 1.5)}${dot(4.5, 10, 1.2)}${dot(10, 10, 2)}${dot(4.5, 15.5, 1.5)}${cur(14, 13)}`,
  // 커서 주변에서 바깥으로 달아난다
  "flee": `${cur(10, 9)}<path d="M5 6.5 2.5 4M18.5 5l2.5-2M4.5 17.5 2 20M19.5 18l2.5 2.5"/><path d="M2.5 6.2V4h2.2M19 3h2v2M2 17.8V20h2.2M19.8 20.5H22v-2.2"/>`,
  // 커서에서 입자가 뿜어져 나온다
  "cursor-emitter": `${cur(3.5, 3)}${dot(14, 12, 1.3)}${dot(18.5, 9.5, 1)}${dot(17, 16.5, 1.5)}${dot(21, 14, .9)}${dot(12.5, 18.5, 1)}${dot(21.5, 20, 1.1)}`,
  // 가운데 손잡이로 전후를 나눠 본다
  "before-after": `<rect x="3" y="4.5" width="18" height="15" rx="2"/><path d="M12 2.5v19"/><path d="M4.5 13 9 8.5M4.5 18 10 12.5" stroke-width="1.2"/><circle cx="12" cy="12" r="2.2" fill="var(--panel, #fff)"/>`,
  // 차트 위를 가로세로로 가르는 십자선
  "crosshair": `<path d="M3 3v18h18"/><path d="M5.5 16l4-5 3.5 3 5.5-7"/><path d="M13 3.5v14.5M3.5 14h17" ${DASH} stroke-width="1.3"/>${dot(13, 14, 1.6)}`,
  // 가만히 두면 잠든다
  "idle": `${cur(4, 10)}<path d="M13 4h4.5L13 9h4.5"/><path d="M18.5 12.5h3l-3 3.5h3"/>`,
  // 긁은 자리가 드러나는 스크래치 카드
  "scratch-off": `<rect x="2.5" y="5" width="19" height="14" rx="2"/><path d="M5.5 14.5l3-5 2 4 3-5.5 2.5 4.5" stroke-width="2.4"/>${dot(18.5, 9, .9)}${dot(17.5, 16, .9)}`,
  // 같은 자리를 오가며 문지른다
  "rub": `<circle cx="12" cy="15" r="5.5"/><path d="M4.5 6.5h15"/>${arrowHead(4.5, 6.5, "l")}${arrowHead(19.5, 6.5, "r")}`,
  // 박힌 못을 당겨 뽑는다
  "pull-out": `<path d="M3 19h18"/><path d="M12 22v-8"/><path d="M8.5 14h7"/><path d="M12 11V3"/>${arrowHead(12, 3, "u")}<path d="M8 9.5l-2-1M16 9.5l2-1" stroke-width="1.3"/>`,
  // 손이 지나간 대로 남는 선
  "freehand": `<path d="M3 16c2-6 4.5-6 5.5-2s3 5 5-1 3.5-6 5.5-4"/>${cur(18, 9, .9)}`,
  // 경로를 따라 같은 모양이 찍힌다
  "stamp-brush": `<path d="M3 18c4-9 10-12 18-10" ${DASH} stroke-width="1.2"/><rect x="2.5" y="14.5" width="4" height="4" rx="1"/><rect x="8.5" y="8.5" width="4" height="4" rx="1"/><rect x="15" y="5.5" width="4" height="4" rx="1"/>`,
  // 글줄 위를 끌어 형광펜처럼 고른다
  "text-selection": `<path d="M3 5.5h18M3 18.5h12"/><rect x="3" y="9.5" width="12" height="5" rx="1" fill="currentColor" fill-opacity=".25" stroke="none"/><path d="M3 12h12"/><path d="M17 9v6.5M15.8 9h2.4M15.8 15.5h2.4"/>`,
  // 한 점으로 두 값을 정하는 면
  "xy-pad": `<rect x="3.5" y="3.5" width="17" height="17" rx="2"/><path d="M14.5 5.5v13M5.5 9.5h13" ${DASH} stroke-width="1.2"/><circle cx="14.5" cy="9.5" r="2.3" fill="currentColor"/>`,
  // 바깥 원 안에서 안쪽 손잡이가 기운다
  "virtual-joystick": `<circle cx="12" cy="12" r="8.5"/><circle cx="15" cy="9" r="3.5" fill="currentColor" fill-opacity=".25"/><path d="M12 12l1.5-1.5" ${DASH}/>`,
  // 위에서 본 당구대: 공을 뒤로 당기면 반대쪽으로 나간다
  "slingshot": `<rect x="2.5" y="4.5" width="19" height="15" rx="2"/><circle cx="10" cy="12" r="2.2"/><path d="M8.3 13.6 5.5 16.5"/><path d="M12 10.3 17.5 6.5" ${DASH}/>${arrowHead(17.5, 6.5, "r")}`,
  // 놓는 순간의 속도로 날아간다
  "fling": `${cur(2.5, 13, .85)}<path d="M8.5 12.5c3-4 6-6 9-6.5"/><path d="M8 5h3M6.5 8h3" stroke-width="1.3"/><circle cx="19" cy="6" r="2.6"/>`,
  // 원래 자리(점선)에서 새 자리로 옮긴다
  "drag-and-drop": `<rect x="2.5" y="2.5" width="9" height="9" rx="2" ${DASH}/><rect x="11" y="10" width="10" height="10" rx="2"/>${cur(15, 14, .9)}`,
  // 전체에서 한 조각을 떼어낸다
  "break-apart": `<path d="M3 5.5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2V13h-8v7.5H5a2 2 0 0 1-2-2z"/><path d="M9 3.5V13M3 9h10" stroke-width="1.2"/><rect x="15.5" y="15.5" width="6" height="6" rx="1.4"/>`,
  // 작은 둘이 합쳐 큰 하나가 된다
  "merge": `<circle cx="5" cy="6" r="2.5"/><circle cx="5" cy="18" r="2.5"/><path d="M7.5 7.5 11 11M7.5 16.5 11 13"/><circle cx="16.5" cy="12" r="5"/>`,
  // 정해진 영역에 놓아야 반응한다
  "drop-zone": `<rect x="3" y="11" width="18" height="10" rx="2" ${DASH}/><path d="M12 2.5v11"/>${arrowHead(12, 13.5, "d")}`,
  // 목록 한 줄을 들어 올려 옮긴다
  "reorder": `<rect x="3" y="3.5" width="12" height="4" rx="1.4"/><rect x="6" y="10" width="12" height="4" rx="1.4" fill="currentColor" fill-opacity=".2"/><rect x="3" y="16.5" width="12" height="4" rx="1.4"/><path d="M21 7.5v9"/>${arrowHead(21, 7.5, "u")}${arrowHead(21, 16.5, "d")}`,
  // 한 점을 당기면 격자가 휜다
  "mesh-warp": `<rect x="3" y="3" width="18" height="18" rx="1.5"/><path d="M3 12Q14 3 21 12"/><path d="M12 3Q20 9 12 21"/>${dot(15.3, 8.4, 1.7)}`,
  // 단자와 단자를 케이블로 잇는다
  "node-wiring": `<rect x="2" y="4" width="7" height="6" rx="1.5"/><rect x="15" y="14" width="7" height="6" rx="1.5"/><path d="M9 7c5 0 1 10 6 10"/>${dot(9, 7, 1.4)}${dot(15, 17, 1.4)}`,
  // 누른 점에서 커서까지 직선
  "line-tool": `${dot(4, 19, 1.8)}<path d="M4 19 15 8"/>${cur(15, 8)}`,
  // 끌어서 사각형을 만든다
  "shape-tool": `<rect x="3" y="3" width="13" height="11" rx="1" ${DASH}/>${dot(3, 3, 1.6)}${cur(16, 14)}`,
  // 각도로 돌리는 노브
  "rotary-knob": `<circle cx="12" cy="13" r="6"/><path d="M12 13 15.5 9.5"/><path d="M4.5 18.5a9 9 0 0 1 0-11M19.5 7.5a9 9 0 0 1 0 11" ${DASH} stroke-width="1.2"/>${arrowHead(19.5, 18.5, "d")}`,
  // 한 방향으로 밀어 넘긴다
  "swipe": `<rect x="2.5" y="7.5" width="19" height="9" rx="4.5"/><circle cx="7" cy="12" r="2.6" fill="currentColor"/><path d="M12.5 10l2 2-2 2M16.5 10l2 2-2 2"/>`,
  // 스크롤한 만큼 진행된다
  "scroll-driven": `<rect x="3" y="3" width="13" height="18" rx="2"/><path d="M6 8h7M6 12h5"/><path d="M20 3v18" stroke-width="1.2"/><rect x="18.5" y="9" width="3" height="6" rx="1.5" fill="currentColor"/>`,
  // 스크롤 막대의 위치가 곧 필름의 재생 위치다
  "scroll-scrub": `<rect x="2.5" y="5" width="14" height="14" rx="2"/><path d="M2.5 8.5h14M2.5 15.5h14"/><path d="M8 10.3v3.4l3-1.7z" fill="currentColor" stroke-width="1.2"/><path d="M20.5 3v18" stroke-width="1.2"/>${dot(20.5, 12, 1.9)}`,
  // 켜진 칸을 재생선이 지나간다
  "step-sequencer": `<rect x="3" y="4" width="4" height="4" rx="1" fill="currentColor"/><rect x="10" y="4" width="4" height="4" rx="1"/><rect x="17" y="4" width="4" height="4" rx="1" fill="currentColor"/><rect x="3" y="11" width="4" height="4" rx="1"/><rect x="10" y="11" width="4" height="4" rx="1" fill="currentColor"/><rect x="17" y="11" width="4" height="4" rx="1"/><path d="M12 2v19" stroke-width="1.3"/>`,
  // 왼쪽 옵션을 고르면 오른쪽 결과가 바뀐다
  "configurator": `<circle cx="4.5" cy="6" r="1.8" fill="currentColor"/><circle cx="4.5" cy="12" r="1.8"/><circle cx="4.5" cy="18" r="1.8"/><path d="M8.5 12h2.5"/>${arrowHead(11, 12, "r")}<circle cx="17" cy="11" r="4"/><path d="M13 20c0-2.5 2-4 4-4s4 1.5 4 4"/><path d="M13.5 7.5h7"/>`,
  // 칩을 켜면 아래 결과가 걸러진다
  "filter-chips": `<rect x="2.5" y="3" width="8" height="5" rx="2.5" fill="currentColor" fill-opacity=".25"/><rect x="13" y="3" width="8.5" height="5" rx="2.5"/><rect x="3" y="12" width="5" height="5" rx="1"/><rect x="10" y="12" width="5" height="5" rx="1" ${DASH}/><rect x="17" y="12" width="5" height="5" rx="1"/>`,
  // 탭을 눌러 아래 판을 바꾼다
  "tabs-accordion": `<path d="M3 20V6a1.5 1.5 0 0 1 1.5-1.5h5A1.5 1.5 0 0 1 11 6v3h8.5A1.5 1.5 0 0 1 21 10.5V20z"/><path d="M11 9h-8"/><path d="M13 4.5h6" stroke-width="1.3"/><path d="M6.5 13.5h11M6.5 16.5h7"/>`,
  // 재료 둘을 섞어 새것을 만든다
  "crafting": `<circle cx="5" cy="6.5" r="2.8"/><rect x="2.5" y="14.5" width="5.5" height="5.5" rx="1.2"/><path d="M11 12h2.5"/>${arrowHead(13.5, 12, "r")}<path d="M18.5 7.5l1.3 2.8 3 .3-2.3 2 .7 3-2.7-1.6-2.7 1.6.7-3-2.3-2 3-.3z"/>`,
  // 방향키 네 개
  "directional-move": `${key(9, 3.5)}${key(2.5, 12)}${key(9, 12)}${key(15.5, 12)}<path d="M12 5.5v2M11 6.5l1-1 1 1" stroke-width="1.3"/>`,
  // 뛰어오르는 사각형과 포물선
  "jump-crouch": `<path d="M3 21h18"/><rect x="3.5" y="16" width="5" height="5" rx="1.2"/><path d="M7 13c2-8 8-9 11-2" ${DASH}/><rect x="15.5" y="4" width="5" height="5.5" rx="1.2"/>`,
  // 모을수록 커지는 한 발
  "charge-shot": `${dot(4.5, 12, 1.4)}<circle cx="10" cy="12" r="2.3"/><circle cx="17.5" cy="12" r="4"/><path d="M17.5 4.5v2M17.5 17.5v2M22 12h-1" stroke-width="1.3"/>`,
  // 한 키를 마구 두드린다
  "button-mash": `${key(7, 9, 10, 9)}<path d="M12 2.5v3M5 5l2 2M19 5l-2 2M2.5 11h2.5M21.5 11H19"/>`,
  // 정해진 순서의 방향 입력
  "cheat-code": `<path d="M4.5 19V5"/>${arrowHead(4.5, 5, "u")}<path d="M9.5 19V5"/>${arrowHead(9.5, 5, "u")}<path d="M14.5 5v14"/>${arrowHead(14.5, 19, "d")}<path d="M19.5 5v14"/>${arrowHead(19.5, 19, "d")}`,
  // 채워지는 비밀번호 점
  "passcode": `<rect x="2.5" y="7" width="19" height="10" rx="3"/>${dot(7, 12, 1.5)}${dot(11, 12, 1.5)}<circle cx="15" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5" stroke-width="1.2"/>`,
  // 커서를 중심으로 확대된다
  "zoom": `<rect x="8.5" y="8.5" width="7" height="7" rx="1"/><rect x="3" y="3" width="18" height="18" rx="2" ${DASH}/><path d="M5.5 5.5 8 8M18.5 5.5 16 8M5.5 18.5 8 16M18.5 18.5 16 16"/>`,
  // 판을 돌려 본다
  "rotate-view": `<rect x="6" y="6" width="12" height="12" rx="1.5" transform="rotate(20 12 12)"/><path d="M3.5 9A9 9 0 0 1 14 3.2"/>${arrowHead(14, 3.2, "r")}`,
  // 다른 탭에 갔다 돌아온다
  "page-visibility": `<path d="M2.5 20V8a1.5 1.5 0 0 1 1.5-1.5h17.5V20z"/><path d="M2.5 6.5 4 3.5h5l1.5 3"/><path d="M12 6.5 13.5 3.5h5l1.5 3" ${DASH}/><path d="M17 16.5c0-3-2-5-5-5H8"/>${arrowHead(8, 11.5, "l")}`,
  // 창 크기에 따라 안의 개체가 눌린다
  "viewport-resize": `<rect x="2.5" y="3.5" width="19" height="17" rx="2"/><ellipse cx="11" cy="13" rx="5.5" ry="3.5"/><path d="M17 20.5l4.5-4.5M19.5 20.5l2-2"/>`,
  // 여러 창이 서로 이어진다
  "multi-window": `<rect x="2" y="3" width="10" height="8" rx="1.5"/><rect x="12" y="13" width="10" height="8" rx="1.5"/><path d="M7 8.5 17 16.5" ${DASH}/>${dot(7, 8, 1.5)}${dot(17, 17, 1.5)}`
};

/* ---------- 의미가 분명한 Lucide 아이콘 ---------- */
const LUCIDE = {
  "toggle": ToggleRight, "click-to-target": Flag, "double-click-zoom": ZoomIn, "double-tap-like": Heart,
  "inline-edit": PencilLine, "magnet": Magnet, "orbit": Orbit, "squeeze": CloudDrizzle,
  "pan": Hand, "branching-choice": GitBranch, "randomizer": Dices, "undo-redo": Undo2, "carousel": GalleryHorizontal,
  "keyboard-orbit": Rotate3d, "shortcut": Command, "keyboard-instrument": KeyboardMusic, "chat": MessageCircleMore
};

/* 카테고리별 입력 배지. mark는 아이콘 옆에 붙는 작은 글자다 */
export const INPUT_BADGES = {
  hover: { icon: MousePointer2 },
  press: { icon: MouseLeft },
  click: { icon: MousePointerClick },
  dblclick: { icon: MousePointerClick, mark: "2" },
  rightclick: { icon: MouseRight },
  move: { icon: Mouse },
  idle: { icon: Timer },
  pressmove: { icon: Pointer },
  drag: { icon: HandGrab },
  scroll: { icon: MoveVertical },
  button: { icon: SquareMousePointer },
  arrow: { icon: Keyboard },
  keyhold: { icon: Keyboard },
  keycombo: { icon: Keyboard },
  typing: { icon: Keyboard },
  pinch: { icon: Touchpad },
  window: { icon: AppWindowMac }
};

const lucideInner = node => node.map(([tag, attrs]) =>
  `<${tag} ${Object.entries(attrs).map(([k, v]) => `${k}="${v}"`).join(" ")}/>`).join("");
const wrap = (inner, size, stroke, cls) =>
  `<svg class="${cls}" xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;

/** 항목 id의 주 아이콘 SVG */
export function mainIcon(id, { size = 26, stroke = 1.75, cls = "ico-main" } = {}) {
  const inner = CUSTOM[id] || (LUCIDE[id] ? lucideInner(LUCIDE[id]) : "");
  return wrap(inner, size, stroke, cls);
}
export const hasIcon = id => !!(CUSTOM[id] || LUCIDE[id]);

/** 카드에 쓰는 조합 아이콘: 주 아이콘 + 입력 배지 */
export function itemIcon(id, catId) {
  const badge = INPUT_BADGES[catId];
  return `<span class="ico">
    ${mainIcon(id)}
    ${badge ? `<span class="ico-badge">${wrap(lucideInner(badge.icon), 13, 2, "")}${badge.mark ? `<b>${badge.mark}</b>` : ""}</span>` : ""}
  </span>`;
}
