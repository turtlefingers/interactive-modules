export default {
  name: "암호 입력", nameEn: "Passcode Entry",
  aliases: ["비밀번호 / 암호 입력", "PIN 입력", "PIN Entry", "Keypad Lock", "잠금 화면", "숫자 자물쇠"],
  input: "숫자 키 · 키패드",
  effect: "맞으면 열리고 틀리면 흔들림",
  definition: "정해진 숫자를 맞게 넣어 잠금을 여는 입력",
  hint: "숫자 키로 암호 넣기",
  description: [
    "숫자를 하나 누를 때마다 빈 점이 하나씩 채워지고, 자릿수가 다 차는 순간 바로 맞았는지 확인한다. 맞으면 자물쇠가 열리고, 틀리면 점들이 <strong>고개를 젓듯 좌우로 흔들리며</strong> 비워진다.",
    "입력한 숫자는 점으로 가려서 옆 사람이 볼 수 없게 한다. 순서만 맞추면 되는 치트 코드와 달리, 암호 입력의 핵심은 <strong>틀림과 맞음을 알려주는 피드백</strong>이다. 몇 자리를 넣었는지, 틀렸는지, 몇 번 더 시도할 수 있는지가 분명해야 한다."
  ],
  uses: [
    "아이폰, 안드로이드 잠금 화면의 4~6자리 암호",
    "은행 앱의 간편 비밀번호와 결제 PIN",
    "도어록, ATM, 금고의 숫자 키패드",
    "방탈출 게임과 어드벤처 게임의 숫자 자물쇠 퍼즐"
  ],
  designPoints: [
    "틀렸을 때 좌우로 흔드는 것은 사람이 고개를 젓는 몸짓을 빌린 것이라 설명 없이도 '아니다'로 읽힌다. 색만 바꾸면 덜 분명하고, 아무 반응이 없으면 사용자는 입력이 되었는지조차 모른다.",
    "자릿수가 정해져 있으면 확인 버튼 없이 마지막 숫자를 넣는 순간 바로 확인한다. 마지막 점이 채워진 것을 잠깐 보여준 뒤 결과를 알려야 입력이 씹힌 느낌이 없다.",
    "여러 번 틀리면 잠시 입력을 막는다(잠금 대기). 무작위로 맞히려는 시도를 늦추고, 남은 기회와 기다릴 시간을 숫자로 보여준다.",
    "숫자 키는 위 줄 숫자와 숫자패드를 모두 받는다(<code>Digit5</code>, <code>Numpad5</code>). 화면 키패드는 누른 키를 잠깐 칠해 키보드 입력도 눈으로 확인하게 한다."
  ],
  prompts: {
    simple: "암호 입력(Passcode Entry) 인터랙션을 만든다. 숫자 키나 화면 키패드로 네 자리 숫자를 넣으면 빈 점 네 개가 하나씩 채워지고, 네 번째 숫자를 넣는 순간 바로 확인해서 맞으면 자물쇠가 열리고 틀리면 점들이 좌우로 흔들리며 비워진다. 순서만 맞추면 되는 비밀 명령과 달리 틀림과 맞음의 피드백이 핵심이다.",
    detailed: "암호 입력(Passcode Entry) 인터랙션을 만든다. 화면 가운데에 자물쇠 아이콘, '암호 입력' 제목, 테두리만 있는 작은 원 네 개, 그 아래 3×4 원형 키패드(1~9, 취소, 0, 지우기)가 세로로 놓인다. 키패드 아래에 '힌트 · 정답은 2580'을 작게 적는다. 키보드의 숫자 키(위 줄과 숫자패드 모두)나 화면 키패드의 숫자를 누르면 왼쪽 원부터 하나씩 채워지고, 키보드로 눌러도 화면 키패드의 해당 버튼이 잠깐 칠해진다. Backspace나 지우기는 마지막 숫자 하나를, Esc나 취소는 전부를 지운다. 네 번째 숫자를 넣으면 채워진 모습을 0.2초 보여준 뒤 확인한다. 틀리면 원들이 강조 색으로 바뀌고 좌우로 네 번 줄어드는 폭으로 흔들린 뒤(약 0.45초) 모두 비워지며 제목이 잠깐 '틀렸다'로 바뀐다. 흔들리는 동안에는 입력을 받지 않는다. 맞으면 자물쇠 고리가 들리며 열리고, 키패드 대신 '열렸다'와 앱 아이콘 모양 여덟 개, '다시 잠그기' 버튼이 아래에서 떠오르며 나타난다. Enter나 이 버튼으로 다시 잠근다. 숫자 입력이 페이지의 다른 곳에 들어가지 않게 한다. 여섯 자리 모드, 시도 횟수 제한, 소리 같은 추가 기능은 넣지 않는다."
  },
  related: [
    { label: "헷갈리는 개념", items: [{ id: "cheat-code", text: "치트 코드 (순서만 맞으면 됨)" }] },
    { label: "함께 쓰이는 것", items: [{ id: "cooldown", text: "쿨다운 (잠금 대기)" }, { id: "swipe", text: "스와이프로 잠금 화면 열기" }] }
  ],
  references: [
    { name: "Personal identification number — Wikipedia", url: "https://en.wikipedia.org/wiki/Personal_identification_number", note: "PIN의 역사와 자릿수, 시도 제한 같은 보안 관례를 정리했다." },
    { name: "Vibration API — MDN", url: "https://developer.mozilla.org/en-US/docs/Web/API/Vibration_API", note: "틀렸을 때 휴대폰을 짧게 진동시키는 방법이다(지원하는 기기에서만)." }
  ],
  reads: "누른 숫자와 그 개수 — 숫자를 하나씩 쌓다가 정해진 자릿수가 되는 순간 정답과 비교한다. 제한을 켜면 틀린 횟수도 센다.",
  readouts: [
    { key: "entered", label: "넣은 자릿수" },
    { key: "last", label: "마지막 키" },
    { key: "wrong", label: "틀린 횟수" },
    { key: "lock", label: "잠금 상태" }
  ],
  variations: [
    { name: "자릿수", desc: "네 자리(정답 2580) 또는 여섯 자리(정답 147258)다.",
      control: { type: "seg", key: "length", default: "4", options: [["4", "4자리"], ["6", "6자리"]] } },
    { name: "틀렸을 때 반응", desc: "흔들기, 색만 바꾸기, 아무 반응 없음을 비교한다. 흔들기는 지원하는 휴대폰에서 짧게 진동도 한다.",
      control: { type: "seg", key: "feedback", default: "shake", options: [["shake", "흔들기"], ["color", "색만"], ["none", "없음"]] } },
    { name: "시도 횟수 제한", desc: "세 번 틀리면 정해진 시간 동안 입력을 막는다.",
      control: { type: "toggle", key: "attempts", default: false } },
    { name: "잠금 대기 시간", desc: "시도 횟수 제한을 켰을 때 입력을 막는 시간이다.",
      control: { type: "range", key: "cooldown", min: 5, max: 30, step: 1, default: 10, ends: ["5초", "30초"], unit: "초" } },
    { name: "마지막 숫자 잠깐 보기", desc: "방금 넣은 숫자를 0.7초 동안 보여준 뒤 점으로 가린다. 잘못 눌렀는지 확인할 수 있다.",
      control: { type: "toggle", key: "peek", default: false } },
    { name: "힌트 보이기", desc: "정답을 화면에 적어둔다.",
      control: { type: "toggle", key: "hint", default: true } }
  ]
};
