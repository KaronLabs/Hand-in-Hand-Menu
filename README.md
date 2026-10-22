# hand in hand · QR 메뉴판

테이블 QR을 스캔해 휴대폰에서 읽는 Hand in Hand 메뉴판입니다. 메뉴 분류·검색·원본 메뉴판 보기를 지원하는 정적 사이트이며, 메뉴 본문은 JavaScript 없이도 표시됩니다.

- 현재 공개 메뉴판: https://hand-in-hand-aperitivo-menu.hi-karonlabs.chatgpt.site/
- 인계 기준: 2026-10-23. 상단 소개 문구의 모바일 24px·PC 48px 여백 수정까지 포함합니다.
- 원본 메뉴판 6장, 6개 분류, 70개 행을 보존합니다. 위스키 29개 행은 가격 단위 확인 전까지 `직원 문의`로 표시합니다.

## 시작하기

Node.js 24 이상이 필요합니다. 저장소를 복제한 폴더에서 실행합니다.

```bash
npm ci
npm test
npm run build
```

`dist/`에 배포할 HTML·CSS·JavaScript·이미지가 생성됩니다. `dist/`와 `node_modules/`는 Git에 포함하지 않으며, 수정은 원본 소스에서 합니다.

로컬 미리보기는 빌드 후 사용 가능한 정적 HTTP 서버로 `dist/`를 열면 됩니다. Python 3가 있는 환경에서는 다음 명령을 사용할 수 있습니다.

```bash
python3 -m http.server 4173 --directory dist
```

브라우저에서 http://localhost:4173/ 을 엽니다.

## 수정할 파일

| 작업 | 파일 |
| --- | --- |
| 메뉴명·재료·가격 | `data/menu.json` |
| 기존 메뉴판 전사·검토 근거 | `data/source-transcription.json`, `data/review-decisions.json` |
| 색상·여백·글자 크기·반응형 화면 | `src/styles/menu.css` |
| 화면 구조·안내 문구 | `src/render/menu-page.mjs` |
| 분류·검색 동작 | `src/client/menu-ui.mjs` |
| 데이터·가격 검증 규칙 | `src/core/menu.mjs` |
| 장식 이미지·원본 메뉴판 | `assets/` |
| 테이블 카드 PDF·QR PNG/SVG | `qr/` |

자세한 수정·포크·배포 절차는 [유지보수 안내](docs/maintenance.md)를, Codex 작업 규칙은 [AGENTS.md](AGENTS.md)를 먼저 읽어 주세요.

## QR 카드

- [A6 인쇄용 카드 PDF](qr/hand-in-hand-table-card-A6.pdf)
- [QR 코드 PNG](qr/hand-in-hand-table-qr.png)
- [QR 코드 SVG](qr/hand-in-hand-table-qr.svg)

이 파일들은 위에 기재한 현재 공개 메뉴판 주소를 담고 있습니다. 같은 주소에 메뉴를 수정·배포하면 계속 사용할 수 있습니다. 사장님 계정의 새 주소로 배포할 때는 최종 주소로 QR과 인쇄용 카드도 다시 만들어야 합니다.

## 배포와 운영 계정

이 GitHub 저장소에 코드를 올리거나 포크하는 작업만으로 현재 Sites 사이트가 배포되거나 운영 권한이 이전되지는 않습니다. GitHub 자동 배포 작업도 아직 설정되어 있지 않습니다.

`.openai/hosting.json`은 현재 Sites 프로젝트의 연결 정보입니다. 사장님 계정에서 별도 Sites 사이트를 만들 때는 Sites가 반환한 새 프로젝트 ID와 배포 주소를 사용해야 합니다. 기존 ID를 사장님 소유의 프로젝트로 취급하지 마세요.

일반 정적 호스팅을 사용할 경우 `npm ci` → `npm test` → `npm run build`를 실행하고 `dist/`를 게시합니다. 소스의 정적 파일 주소는 상대 경로를 사용합니다.

## 검증 기록과 범위

초기 인계 시 테스트 141개와 빌드를 확인했습니다. 이후 수정 시 다시 실행해 주세요. 검토 근거는 `docs/verification/`에 있습니다. 기존 기록은 작성 당시의 검증 결과이며, 이후 수정 사항에 대한 검증을 대신하지 않습니다.

실물 인쇄 QR의 휴대폰 카메라 스캔, iOS·Android 실기기 확인은 별도 점검 항목입니다. 생성된 장식 그림은 실제 매장·음식 사진이 아닙니다.
