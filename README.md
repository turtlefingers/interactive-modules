# 인터랙티브 모듈들

마우스와 키보드로 만드는 웹 인터랙션 75가지를 **직접 만져 보며** 익히는 사전이다.
한국예술종합학교 컨버전스디자인 2 수업(5주차 · 인터랙티브 웹)을 위해 만들었다.

항목마다 왼쪽에는 바로 조작해 볼 수 있는 데모가, 오른쪽에는 설명이 있다.

- **이름과 뜻**: 공식 명칭(영문), 다른 이름, 입력 → 효과, 한 줄 정의
- **설명 · 쓰임 · 디자인 포인트**
- **AI 프롬프트**: 간단/상세 두 가지. 도구에 상관없이 쓸 수 있게 쓰였고 복사 버튼이 있다.
- **관련 항목 · 레퍼런스 · 태그**
- **변형**: 데모가 읽는 값과 바꿔 볼 수 있는 파라미터. 버튼을 누르면 이것만 보인다.

## 구성

입력 방식에 따라 17개 분류로 나눈다.

| 분류 | 항목 수 | 분류 | 항목 수 |
|---|---|---|---|
| 올리기 | 1 | 버튼 | 8 |
| 누르기 | 2 | 방향키 | 4 |
| 클릭 | 5 | 키 누르고 있기 · 연타 | 2 |
| 더블클릭 | 3 | 키 순서 · 조합 | 3 |
| 우클릭 | 1 | 타이핑 | 2 |
| 마우스 움직임 | 13 | 핀치 · 휠 | 2 |
| 가만히 있기 | 1 | 탭 · 창 | 3 |
| 누르고 움직이기 | 15 | 스크롤 | 2 |
| 드래그 앤 드롭 | 15 | | |

항목 주소는 `/<id>/` 꼴이다. 예: `/pan/`, `/drag-and-drop/`, `/mouse-parallax/`.

## 실행

Node 20 이상이 필요하다.

```bash
npm install
npm run dev       # 개발 서버 (http://localhost:5173)
npm run build     # dist/ 에 정적 사이트 생성
npm run preview   # 빌드 결과 미리보기
```

빌드 결과는 순수 정적 파일이라 어느 정적 호스팅에나 올릴 수 있다. 경로는 상대 경로(`base: "./"`)로 만들어서 하위 폴더에 올려도 동작한다.

## 배포 (GitHub Pages)

`.github/workflows/deploy.yml`이 `main` 브랜치에 푸시할 때마다 빌드해서 GitHub Pages에 올린다.

1. 이 폴더를 GitHub 저장소로 푸시한다.
2. 저장소 **Settings → Pages → Build and deployment → Source**를 **GitHub Actions**로 바꾼다.
3. `main`에 푸시하거나, Actions 탭에서 워크플로를 직접 실행한다.

## 폴더 구조

```
src/
  catalog.js          분류 · 항목 순서 · 태그
  items/<id>/         항목 하나 = 폴더 하나
    meta.js           글 (이름, 설명, 쓰임, 프롬프트, 관련 항목 …)
    demo.js           데모 (runtime API 사용)
  lib/
    runtime.js        데모 실행 환경 (이벤트, 프레임, 변형 파라미터, 읽는 값)
    figure.js         사람 그림 (Open Peeps)
    objects.js        사물 카탈로그 (동물 · 식물 · 소품 · 풍경)
    objects/          사물 그림 묶음, 확정 타입(picks.js), 색조(palette.js)
    draw.js           그리기 도구와 색 (ILLO, TONE)
  pages/              메인 · 항목 페이지
  styles/             스타일 (페이퍼 테마)
dev/                  검수 · 테스트용 페이지 (배포 제외)
vendor/open-peeps/    Open Peeps 원본 (CC0)
scripts/build-peeps.cjs  Open Peeps → src/illo/peeps-parts.js 변환
```

새 항목을 만들거나 고칠 때는 [AUTHORING.md](AUTHORING.md)를 먼저 읽는다. 글쓰기 규칙(~이다체), 데모 API, 그림 스타일이 정리되어 있다.

### 개발용 페이지 (`dev/`)

검수 · 테스트용 페이지는 `dev/`에 모여 있다. 개발 서버에서만 열리고 빌드(배포)에는 들어가지 않는다.

| 페이지 | 용도 |
|---|---|
| `/dev/qa.html` | 모든 항목을 차례로 띄워 오류가 없는지 확인 |
| `/dev/objects.html` | 사물 그림의 타입을 비교하고 고르는 검사 페이지 |
| `/dev/sheet.html?name=<사물>` | 사물 한 가지의 모든 타입을 한 장으로 렌더링 |
| `/dev/people.html` | 사람 그림(Open Peeps) 조합 확인 |
| `/dev/icons.html` | 메인 카드 아이콘 모아 보기 |

## 그림 스타일

- **사람**: [Open Peeps](https://www.openpeeps.com) (Pablo Stanley)의 부품을 조합한다.
- **사람 외의 모든 것**: 외곽선 없는 톤 실루엣에 가는(1.5px) 잉크 선을 더한다. 사물마다 여러 타입을 그린 뒤 검사 페이지에서 골라 확정했고, 채도 있는 색조는 `src/lib/objects/palette.js` 한 곳에서 입힌다.
- 한 장면의 강조색은 하나(주황)만 쓴다.

## 크레딧

- 사람 그림: **Open Peeps** by Pablo Stanley — [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/)
- 아이콘 일부: **Lucide** — [ISC License](https://lucide.dev/license)
- 글꼴: **Pretendard** — [SIL Open Font License 1.1](https://github.com/orioncactus/pretendard)
