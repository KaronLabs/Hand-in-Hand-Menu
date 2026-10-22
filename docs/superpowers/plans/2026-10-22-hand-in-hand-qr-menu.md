# Hand in Hand QR Menu Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 기존 메뉴판 6장의 출처와 가격을 보존하고 손님이 테이블 QR로 읽을 수 있는 공개 모바일 메뉴판을 제공합니다.

**Architecture:** 메뉴 데이터를 검증한 뒤 HTML을 사전 렌더링하고 분류·검색만 브라우저에서 처리하는 정적 사이트입니다. Node 빌드/테스트 도구와 가격·조회·렌더링·QR 모듈을 분리합니다. 원본 이미지 보기는 보조 수단이며 모든 텍스트 메뉴는 JavaScript 없이 읽힙니다.

**Tech Stack:** Node.js >=24, ES modules, node:test/node:assert, HTML/CSS/JavaScript, 테스트용 linkedom, QR 생성 qrcode, 독립 QR 검증용 jsqr/pngjs, Sites 정적 호스팅. 실제 의존성 버전은 실행 단계에서 지원되는 버전을 확인한 뒤 exact pin과 lockfile로 고정합니다.

**Spec:** `docs/superpowers/specs/2026-10-22-hand-in-hand-qr-menu-design.md`

**Status:** 사용자 요청에 따른 설계·실행계획 통합 검토 초안입니다. 설계와 계획의 최종 승인 및 실행 방식 선택 전에는 실행하지 않습니다. 아직 제품 코드·Site·실행 테스트는 없습니다.

## Global Constraints

- Node.js 24 이상. 환경에서 확인한 현재 런타임은 v24.19.0입니다.
- 원본 6분류 70행을 출처와 함께 보존합니다. Balvenie 12Y 중복은 사용자 확인 전 자동 병합하지 않습니다.
- 원문 위스키 단위는 사용자 확인 상태가 `verified`일 때만 원화로 변환합니다. 그 전에는 `직원 문의`입니다.
- Glenfiddich 21Y, Glenfarclas 105 CS, Glenfarclas 21Y의 빈 가격은 `null`/`missing`이며 `직원 문의`입니다.
- 한국어 안내·원문 이름 보존. 주문·결제·회원·예약·관리자·실시간 품절은 범위 밖입니다.
- 모든 메뉴를 사전 렌더링합니다. 화면 320/390/430/768/1280px, 본문 16px 이상, 조작 요소 44px 이상, 본문 대비 4.5:1 이상을 검사합니다.
- 고정 정식 메뉴 URL 하나를 QR에 담습니다. 인증 우회 토큰·임시 링크·외부 단축 서비스는 사용하지 않습니다.
- QR은 흰 바탕/검은 모듈/4모듈 이상 여백/오류 정정 M입니다. 최종 QR은 배포 성공 URL과 일치해야 합니다.
- core 모듈은 line/branch/function 각 100%, renderer와 client는 line/function 각 90% 이상을 목표로 강제합니다. CSS·데이터·이미지·의존성·Sites 내부는 분모에서 제외합니다.
- 매 동작은 RED → assertion 실패 확인 → 최소 GREEN → 필요 시 REFACTOR → 전체 회귀 순서입니다. import 오류나 설정 오류를 RED로 세지 않습니다.

## Review Focus

1. 빈/미확인 가격이 0원이나 추정 금액으로 노출되는 경우: Task 1 가격 경계 테스트.
2. 같은 이름 메뉴가 ID 또는 Map 키에 의해 사라지는 경우: Task 1 동명이름 출처 보존 테스트.
3. 긴 이름·유니코드·HTML 기호 때문에 검색이 실패하거나 마크업이 깨지는 경우: Task 2 조회/렌더러 테스트와 Task 3 실제 DOM 테스트.
4. 클라이언트 초기화 실패 또는 반복 초기화로 메뉴가 사라지거나 이벤트가 중복되는 경우: Task 3 progressively enhanced HTML/중복 초기화 테스트.
5. 브라우저에서는 열리지만 QR이 임시 URL 또는 로그인 경로를 담는 경우: Task 4 독립 디코딩, Task 5 비로그인 실제 경계 검사.

## 테스트 경계와 증거

자동 검사는 우리 코드가 외부에 약속하는 결과만 검증합니다. 외부 QR 라이브러리의 내부 알고리즘, DOM 라이브러리 자체, Sites 내부를 재시험하지 않습니다. QR 테스트는 우리 생성물의 바이트가 요구된 URL을 담는지 검증합니다. 예상값은 코드에서 재계산하지 않고 원본 대조 또는 손으로 계산한 리터럴을 사용합니다.

`npm test`는 unit/render/DOM/QR 전체 로컬 suite이며, `npm run test:coverage`는 core→render→client 범위를 별도 측정합니다. `npm run build`는 데이터 검증 후 `dist/`를 생성합니다. 가격 검증 원문 대조, 모바일 레이아웃, 비로그인 실접속, 실물 스캔은 각각 별도 기록하며 DOM 테스트로 대체했다고 주장하지 않습니다.

RED/GREEN 로그는 `/workspace/scratch/1f0324b1cee2/qa/hand-in-hand/`에 기록하고 최종 요약은 `docs/verification/release.md`에 작성합니다. 문서에는 실행한 명령·종료코드·핵심 assertion과 미검증 항목을 남깁니다. 계획 단계에는 테스트 통과 주장이 없습니다.

## 예정 파일 구조

| 파일 | 책임 |
| --- | --- |
| `data/menu.json` | 고객용 메뉴와 확인 상태·출처 참조 |
| `data/source-transcription.json`, `data/review-decisions.json` | 원본 70행과 소유자 확인 기록; 공개물에 복사하지 않음 |
| `assets/source-menu/` | 변경하지 않은 원본 6장 |
| `src/core/menu.mjs` | 스키마/출처 검증, 가격 해석·표시, 조회·필터 |
| `src/core/menu-url.mjs` | QR 대상 정식 URL 검증 |
| `src/render/menu-page.mjs` | 이스케이프와 HTML 사전 렌더링 |
| `src/client/menu-ui.mjs` | 검색·분류·초기화·결과 안내 |
| `src/styles/menu.css` | 반응형 레이아웃·가독성·포커스 |
| `scripts/build.mjs` | 검증→HTML/정적 자산 생성 |
| `scripts/create-qr.mjs` | 검증된 URL로 PNG/SVG 생성 |
| `tests/unit/`, `tests/render/`, `tests/dom/`, `tests/qr/` | 책임별 소비자 동작 테스트 |
| `tests/fixtures/` | 원문을 사람이 확인한 독립 기대값과 오류 입력 |
| `.openai/hosting.json` | 반환받은 Site ID와 정적 배포 디렉터리 |
| `docs/verification/release.md` | 가격 확인·테스트·커밋·배포·QR 결과 |

`dist/`는 생성물입니다. 메뉴 데이터 및 원본 전사 파일을 외부 URL에서 직접 제공할 필요는 없습니다. 고객 화면에 필요한 데이터만 사전 렌더링합니다. original 이미지의 metadata/해상도/내용을 확인한 후 웹 제공용 복사본을 만들고 원본은 변경하지 않습니다.

## Task 1: 출처와 가격을 검증하는 메뉴 데이터 경계

**Files:** Create `package.json`, `package-lock.json`, `data/menu.json`, `data/source-transcription.json`, `data/review-decisions.json`, `src/core/menu.mjs`, `tests/unit/menu-data.test.mjs`, `tests/unit/pricing.test.mjs`, `tests/fixtures/menu-reference.json`.

**Interfaces:**
- Consumes: 확인한 원본 6장, 연구 전사 기록, 사용자 가격/중복 확인 답변.
- Produces: `validateMenu(menu): ValidationIssue[]`; `parseWhiskyPrice(raw, unitStatus): Price`; `formatPrice(price): string`.
- `Price = {amountKrw: number|null, status: 'verified'|'unverified'|'missing', raw: string|null}`.
- `Menu = {categories: Category[], items: MenuItem[], whiskyUnitStatus: 'verified'|'unverified', sourceRowCount:70}`. `Category`, `MenuItem`, 단품/위스키 price의 구조는 설계안 3.2절과 동일합니다. `ValidationIssue = {code: string, itemId: string|null, message: string}`. 잘못된 가격 원문은 `parseWhiskyPrice`가 code=`invalid_price`인 RangeError를 던지고, `validateMenu`는 해당 데이터의 검증 오류를 ValidationIssue로 보고합니다.

- [ ] **Step 1: 가격/출처 계약의 실패 테스트 작성.** `unknown_unit_does_not_invent_price`는 `parseWhiskyPrice('2,4','unverified').amountKrw === null`; `missing_price_is_staff_inquiry`는 null/빈 공백 입력의 표시가 `직원 문의`; `verified_unit_converts_integer_won`은 `2,4→24000`, `36→360000`, `130→1300000`; 0·음수·잘못된 구분자·문자 혼합·safe integer 초과는 `invalid_price` 예외입니다. `same_named_source_rows_are_preserved`는 발베니 두 행의 서로 다른 ID와 두 sourceRefs를 확인합니다.

  대표 assertion은 아래와 같습니다. 각 이름의 test를 한 동작씩 추가하고 RED/GREEN을 반복합니다.

  ```js
  test('verified_unit_converts_integer_won', () => {
    assert.equal(parseWhiskyPrice('2,4', 'verified').amountKrw, 24000);
    assert.equal(parseWhiskyPrice('130', 'verified').amountKrw, 1300000);
  });
  test('unknown_unit_does_not_invent_price', () => {
    assert.equal(parseWhiskyPrice('2,4', 'unverified').amountKrw, null);
  });
  test('missing_price_is_staff_inquiry', () => {
    assert.equal(formatPrice(parseWhiskyPrice(null, 'verified')), '직원 문의');
  });
  ```
- [ ] **Step 2: RED 확인.** `node --test tests/unit/pricing.test.mjs tests/unit/menu-data.test.mjs`. 최소 실행 가능 export가 있는 상태에서 소비자 assertion 실패를 관찰합니다. 파일 없음/import 오류는 먼저 테스트 환경을 고칩니다.
- [ ] **Step 3: 최소 구현.** 위 인터페이스만 구현하고 가격/출처 schema를 고정합니다. 데이터 전사는 모든 행을 사람이 이미지와 대조합니다. 부동소수점 곱셈 대신 확인된 만원 단위의 정수 문자열 계산을 사용합니다.
- [ ] **Step 4: GREEN/경계 확인.** unit 전체 통과. 누락 ID·출처 덮어쓰기·음수·NaN·양쪽 잔/병 가격·단위 미확인 경로를 테스트합니다. 원본 분류별 행 수는 `11/7/8/7/8/29`이고 확인 전 총 70행이어야 합니다. 사용자 승인한 병합이 생기면 원본70과 고객용 행 수를 구분한 승인 fixture를 사용합니다.
- [ ] **Step 5: REFACTOR/커밋.** 중복 검증 코드만 정리하고 전체 로컬 suite를 통과시킨 후 `feat: validate source-linked menu and prices`로 커밋합니다. 사용자 확인 없는 값 변경은 금지합니다.

## Task 2: 읽을 수 있는 정적 메뉴와 검색 계약

**Files:** Modify `src/core/menu.mjs`; Create `src/render/menu-page.mjs`, `src/styles/menu.css`, `scripts/build.mjs`, `tests/unit/menu-query.test.mjs`, `tests/render/menu-page.test.mjs`.

**Interfaces:**
- Consumes: Task 1의 `Menu`, `validateMenu`, `formatPrice`.
- Produces: `normalizeSearch(value:string):string`; `searchText(item:MenuItem):string`; `selectItems(items, {categoryId: string|'all', query: string}): MenuItem[]`; `renderMenuPage(menu): string`; `buildSite({menuPath, outDir}): Promise<{itemCount: number}>`.
- `searchText`는 한글/원문 이름과 한글/원문 재료만 결합해 `normalizeSearch`한 값입니다. `selectItems`와 렌더러가 이를 공유합니다. 렌더링된 각 메뉴는 `data-menu-item`, `data-item-id`, `data-category`, `data-search` 속성을 갖고 data-search 값은 searchText 결과입니다. 분류 버튼은 `data-category-filter`; 검색은 `data-menu-search`; 결과 안내는 `data-menu-status`; 초기화는 `data-menu-clear`입니다. 이것은 클라이언트와 HTML 사이의 내부 계약입니다.

- [ ] **Step 1: 조회/HTML 실패 테스트.** 한국어 `네그로니`, 영어 `  neGrOnI  `, 재료 `Campari` 검색, 분류와 검색 AND, 공백 검색, Unicode NFKC 정규화, 결과 없음·원문 순서 보존을 literal ID 결과와 대조합니다. HTML은 카쵸 에 페페의 `22,000원`, 잔/병 제목, 옵션, `직원 문의`, 아란치니 `6개`를 파싱한 텍스트로 검사합니다. `<img src=x onerror=alert(1)>` 이름은 텍스트로 보여야 하며 실행 가능한 img가 생성되지 않아야 합니다.

  ```js
  test('query_is_case_insensitive_and_trimmed', () => {
    const found = selectItems(menu.items, {categoryId:'all', query:'  neGrOnI  '});
    assert.deepEqual(found.map(item => item.id), ['campari-005']);
  });
  test('category_is_combined_with_query', () => {
    assert.deepEqual(selectItems(menu.items, {categoryId:'food', query:'negroni'}), []);
  });
  ```
- [ ] **Step 2: RED 확인.** `node --test tests/unit/menu-query.test.mjs tests/render/menu-page.test.mjs`. 빈 결과·가격 누락·이스케이프 오류가 해당 assertion에서 실패하는지 기록합니다.
- [ ] **Step 3: 최소 구현.** 정규화 조회, HTML 이스케이프와 사전 렌더링을 구현합니다. 6개 원본 보기에는 기본 `details`/링크를 사용합니다. 메뉴를 정적으로 제공하므로 브라우저 fetch 실패로 전체 메뉴가 사라지는 경로를 만들지 않습니다.
- [ ] **Step 4: GREEN/빌드.** `npm test`, `npm run build` 통과. 생성 HTML을 실제로 파싱해 원본70행이 출처 규칙대로 표시되고, JavaScript 실행 없이도 메뉴와 가격이 모두 들어 있는지 검사합니다. 원본 이미지 경로 6개가 배포물 내부 파일로 해석되는지 검사합니다.
- [ ] **Step 5: REFACTOR/커밋.** 렌더/조회 책임이 섞인 부분만 정리하고 suite 유지 후 `feat: render accessible static menu`로 커밋합니다.

## Task 3: 모바일 분류·검색·복구 동작

**Files:** Create `src/client/menu-ui.mjs`, `tests/dom/menu-ui.test.mjs`; Modify `src/render/menu-page.mjs`, `src/styles/menu.css`, `scripts/build.mjs`.

**Interfaces:**
- Consumes: Task 2의 HTML data 속성 계약과 `normalizeSearch`. data-search는 이미 정규화된 문자열이므로 정규화한 검색어의 포함 여부와 data-category 일치만 검사합니다. 클라이언트에서 화면 전체 텍스트나 가격을 검색 대상으로 재구성하지 않습니다. 브라우저에서 가져올 공통 core 모듈은 Node 전용 import 없이 배포물에 복사합니다.
- Produces: `initMenuUI(document): {reset(): void}`. 초기화는 같은 문서에 여러 번 호출해도 이벤트가 중복되지 않습니다. 렌더된 메뉴 요소를 가려서 필터하고 이름/재료를 새 HTML로 주입하지 않습니다.

- [ ] **Step 1: 실제 DOM 통합 실패 테스트.** 실제 `renderMenuPage()` 결과를 linkedom에 로드합니다. 분류 버튼 click→일치 메뉴만 visible, 검색 input→일치 행/개수, 빈 검색 결과 안내, reset→all, 두 번 초기화→동일한 상태 변화, 사용자 입력 `<script>`→스크립트 요소 미생성, 클라이언트 실행 전→전체 메뉴 readable를 검사합니다. 라이브러리 mock의 존재 여부를 검사하지 않습니다.

  ```js
  test('typing_filters_the_rendered_menu', () => {
    const {document, window} = parseHTML(renderMenuPage(menu));
    initMenuUI(document);
    const input = document.querySelector('[data-menu-search]');
    input.value = 'NEGRONI';
    input.dispatchEvent(new window.Event('input', {bubbles:true}));
    const visible = [...document.querySelectorAll('[data-menu-item]')]
      .filter(element => !element.hidden).map(element => element.dataset.itemId);
    assert.deepEqual(visible, ['campari-005']);
  });
  ```
- [ ] **Step 2: RED 확인.** `node --test tests/dom/menu-ui.test.mjs`. 클릭해도 상태가 변하지 않거나 wrong visibility가 발생하는 소비자 assertion 실패를 기록합니다.
- [ ] **Step 3: 최소 구현.** `hidden`, `aria-pressed`, 검색 입력, 결과 `aria-live`를 갱신합니다. 초기화가 완료됐을 때 검색·분류 향상 UI를 노출합니다. 원본 보기는 필터 후에도 해당 메뉴 출처로 접근할 수 있게 합니다.
- [ ] **Step 4: GREEN 및 실제 화면 QA.** `npm test`, `npm run test:coverage`, `npm run build` 통과. Sites managed-preview 지침을 읽은 후 지원되는 CUA 브라우저만 사용해 320/390/430/768/1280px 화면·키보드·원본 보기·긴 위스키 이름·7자리 가격을 확인합니다. CUA가 없으면 임의의 브라우저를 설치하지 않고 화면 QA를 미검증으로 기록합니다. DOM 모사는 CSS 레이아웃 증거가 아닙니다.
- [ ] **Step 5: REFACTOR/커밋.** 이벤트 중복/검색 정규화 중복을 정리하고 전체 suite 유지 후 `feat: add mobile menu filtering`으로 커밋합니다.

## Task 4: 정식 URL과 QR 산출물의 결합

**Files:** Create `src/core/menu-url.mjs`, `scripts/create-qr.mjs`, `tests/unit/menu-url.test.mjs`, `tests/qr/qr-output.test.mjs`; Modify package scripts.

**Interfaces:**
- Consumes: Sites가 반환한 실제 expected URL, 이후 최종 배포 성공 URL. 둘은 각각 초안/최종 단계의 신뢰된 기준입니다.
- Produces: `validateMenuUrl(candidate:string, canonicalUrl:string):string`; `createQrFiles({url:string, canonicalUrl:string, outDir:string}):Promise<{pngPath:string, svgPath:string}>`.
- candidate는 HTTPS이며 URL 표준으로 정규화한 canonicalUrl과 전체 URL이 같아야 합니다. userinfo·query·fragment와 다른 origin/경로를 거부합니다. 플랫폼이 반환한 경로를 유지하고 `/`를 임의로 가정하지 않습니다. 실제 Site 주소를 발명하지 않습니다. 단위 테스트용 canonicalUrl은 `https://menu.example.test/`입니다.

- [ ] **Step 1: URL/QR 실패 테스트.** `validateMenuUrl('https://menu.example.test/', 'https://menu.example.test/')`는 동일 문자열; HTTP·다른 origin·사용자정보·인증토큰 query·fragment·미리보기 경로는 throw입니다. canonicalUrl이 `https://menu.example.test/sites/menu/`이면 그 경로는 그대로 통과하고 루트 URL은 거부해야 합니다. 테스트 fixture URL의 PNG를 생성한 뒤 pngjs+jsqr로 읽은 결과는 리터럴 `https://menu.example.test/`여야 합니다. SVG도 같은 URL 입력에서 정상 생성되는지 파싱하고 크기/여백 옵션을 생성 경계에서 검사합니다.

  ```js
  test('qr_png_decodes_to_the_exact_target', async () => {
    const files = await createQrFiles({url:'https://menu.example.test/',
      canonicalUrl:'https://menu.example.test/', outDir:temporaryDirectory});
    const png = PNG.sync.read(await readFile(files.pngPath));
    const decoded = jsQR(new Uint8ClampedArray(png.data), png.width, png.height);
    assert.equal(decoded?.data, 'https://menu.example.test/');
  });
  ```
- [ ] **Step 2: RED 확인.** `node --test tests/unit/menu-url.test.mjs tests/qr/qr-output.test.mjs`. URL 거부 또는 생성 결과/독립 디코딩의 assertion 실패를 관찰합니다. QR 라이브러리 import 실패는 RED가 아닙니다.
- [ ] **Step 3: 최소 구현.** qrcode로 PNG/SVG를 생성합니다. 검은색·흰색·여백4·오류정정M을 명시합니다. QR 파일의 생성은 최종 URL 인수 없이는 실패해야 합니다.
- [ ] **Step 4: GREEN/경계 확인.** `npm test`, `npm run test:coverage`. 최종 URL을 받으면 테스트 fixture 결과와 별개로 실제 QR PNG를 디코딩해 동일성을 기록합니다. 임시 등록 origin으로 만든 초안 QR은 최종본 이름을 사용하지 않습니다.
- [ ] **Step 5: REFACTOR/커밋.** 경로/URL 검증 중복만 정리하고 전체 suite 통과 후 `feat: generate verified menu qr assets`로 커밋합니다.

## Task 5: 배포 무결성·공개 접속·최종 검증

**Files:** Create `.openai/hosting.json`, `docs/verification/release.md`; Generate `dist/`, 최종 QR PNG/SVG.

**Interfaces:**
- Consumes: 승인된 데이터 정책, Task 1~4의 suite/빌드, Sites 등록 응답의 opaque project ID와 source credential.
- Produces: 배포 성공 URL/버전/commit SHA, 공개 접근 확인 결과, 실제 URL을 담은 QR PNG/SVG, 수작업·자동화·미검증을 구분한 릴리스 기록.

- [ ] **Step 1: 실행 전 검토.** superpowers:using-git-worktrees를 적용해 checkout 상태와 격리를 확인합니다. 손님용 공개 접근 요청을 유지하고 Site ID를 한 번만 생성·즉시 기록합니다. 기존 manifest ID가 있으면 재사용합니다. 원본 70행과 값 확인 목록을 최종 대조합니다.
- [ ] **Step 2: 전체 로컬 gate.** `npm test`, `npm run test:coverage`, `npm run build`의 실제 exit 0을 확인합니다. core: `node --test --experimental-test-coverage --test-coverage-include='src/core/**' --test-coverage-lines=100 --test-coverage-branches=100 --test-coverage-functions=100 tests/unit/*.test.mjs`. render/client는 각 경로 include와 90% line/function, 해당 render/DOM tests로 별도 실행합니다. 한 파일만 green인 것을 전체 통과라고 보고하지 않습니다.
- [ ] **Step 3: 소스와 배포물 결합.** Sites source helper로 같은 커밋을 push하고 `dist` 배포물을 패키징합니다. 반환된 commit SHA/project ID/archive를 그대로 native save/deploy에 전달합니다. 외부 공개 접근 설정이 지원되는지 확인하고, 거절되면 로그인용 QR로 대체하지 않습니다. QR은 최종 URL 확인 후 별도 산출물로 생성해 Site를 QR 생성만을 위해 불필요하게 재배포하지 않습니다.
- [ ] **Step 4: 배포 경계 검사.** native 결과가 pending/building/publishing이면 terminal까지 상태를 확인합니다. 성공 URL을 QR에 넣고 PNG를 독립 디코딩합니다. 기존 로그인 세션으로 공개 여부를 판정하지 않습니다. 지원되는 비로그인 세션이 있으면 실제 접속을 확인하고, 없으면 권한설정 public과 비로그인 실접속 미검증을 구분해 기록합니다.
- [ ] **Step 5: 릴리스 검토와 전달.** superpowers:verification-before-completion과 requesting-code-review를 적용합니다. 선택한 실행 방식의 리뷰 절차를 수행하고 문제를 고친 경우 관련 RED/GREEN와 전체 suite를 다시 확인합니다. 최종 URL·QR·확인된 결과·직원 문의 품목 수·실물 미검증을 전달합니다. 외부 git에 동기화된 Site 소스는 별도 파일 저장소에 중복 업로드하지 않습니다. QR 전달물만 사용자용 파일로 저장합니다.

## 실행 방식 선택과 다음 질문

추천은 **Native: 이 세션에서 직접 순차 구현**입니다. 같은 메뉴 데이터와 검증 계약을 다섯 작업이 공유하고 첫 버전의 범위가 작아, 작업별 새 구현자보다 일관성을 유지하기 쉽습니다. 이 방식을 선택하면 executing-plans를 사용하고 마지막에 독립 리뷰를 둡니다. 다른 선택은 작업별 구현자/리뷰어를 사용하는 subagent-driven-development입니다. 어느 방식도 지금 시작하지 않습니다.

계획 검토 후 사용자에게 가장 먼저 확인할 데이터 질문은 위스키 표기 `2,4 = 24,000원`, `36 = 360,000원` 여부입니다. 답변 전의 제품 동작은 설계안대로 `직원 문의`이며 추정 변환은 하지 않습니다. 발베니 중복과 빈 가격 3종도 확인 기록에 이어서 반영합니다.

## 자체 검토 결과

- 목적/출처/가격/조회/원본/반응형/QR/공개접속/배포/복구의 설계 요구는 Task 1~5에 연결했습니다.
- 타입·속성·data selector 계약을 작업 사이에 명시했습니다. `Price`, `Menu`, 메뉴 ID 규칙은 공통입니다.
- Review Focus 5개의 소비자 실패 조건을 각 담당 작업의 RED 테스트 또는 실제 경계 검사에 연결했습니다.
- 상세 기능 코드나 설치는 수행하지 않았습니다. 테스트 항목은 계획이며 실행 증거가 아닙니다.
- 데이터 확인, 문서 승인, 실행 방식 선택을 구현 시작 조건으로 유지합니다.
