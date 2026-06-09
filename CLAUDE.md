# CLAUDE.md
Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding
**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First
**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes
**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution
**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:

1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

## 5. Learning Capture
**Don't let practical knowledge slip away during vibe coding.**

While working, if any of the following comes up:
- Concepts frequently discussed in industry or dev communities (e.g. CORS, env variable management, API design patterns)
- Decisions where "why this approach" matters — not just implementation, but real tradeoffs
- Things beginners commonly get wrong or overlook

→ Separate from the implementation, log it in `notes/til.md` as a one-liner + brief explanation.

Format:
**[Topic]** — [One-line summary]
> [2–3 sentences max. Why it matters, how it's used in practice.]

Keep entries short. The goal is a scannable reference, not a tutorial.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

---

## Project: 이태규(TaeGyue) 포트폴리오 사이트

원작자(flo-bit)의 허락을 받아 개인 포트폴리오 사이트로 수정.

- **로컬 경로**: `C:\Users\landr\Gooleh\Gooleh_dev`
- **GitHub**: https://github.com/gooleh/gooleh-portfolio
- **라이브**: https://gooleh-portfolio.vercel.app
- **배포**: `npx vercel --prod` (Vercel 자동 배포 미연동 — CLI로 수동 배포)

### 기술 스택
- **Framework**: Astro 5 (output: static)
- **UI**: Svelte 5 컴포넌트 + Tailwind CSS v3
- **3D**: Three.js / Threlte (히어로 섹션 인터랙티브 행성)
- **콘텐츠**: Markdown (`src/content/main/`)
- **배포**: Vercel + `@astrojs/vercel` 어댑터
- **프로젝트 데이터**: Notion API — 빌드 시 fetch (`src/lib/notion-projects.ts`)

### 개인화 완료 현황 (모두 ✅)

| 파일 | 역할 |
|---|---|
| `src/config.ts` | 사이트 URL, 파비콘, 테마 색상, 소셜 링크 |
| `src/content/main/about.md` | About 섹션 본문 (`i'm tae-gyue`) |
| `src/components/BaseHead.astro` | SEO 메타태그 + Pretendard 폰트 CDN |
| `src/components/Footer.astro` | 푸터 크레딧 |
| `src/components/About/About.astro` | Depth3D 제거 → 일반 `<Image>` 교체 완료 |
| `src/components/About/Resume/Resume.astro` | 경력: 포시즌스(2025~현재) / 코트야드(2022~2025) / 인하공전(2022~2025) |
| `src/assets/about/me/me.jpg` | 프로필 사진 |
| `src/assets/about/logos/marriott.svg` | 메리어트 로고 (SVG) |
| `src/assets/about/logos/fourseasons.svg` | 포시즌스 로고 (SVG) |
| `src/assets/about/logos/inha.svg` | 인하공업전문대학 로고 (SVG) |
| `src/lib/notion-projects.ts` | Notion DB 프로젝트 fetch (개인 + 팀 DB 병렬 fetch, Published 필터) |
| `src/content/config.ts` | Bluesky 제거 완료, blog 컬렉션만 유지 |
| `src/layouts/BaseLayout.astro` | Pretendard 폰트 전역 적용 |
| `src/components/Learning/Learning.svelte` | 인하공전 커리큘럼 (2022–2025) + 2025-08 vibe coding 항목 |
| `src/components/Projects/Projects.astro` | 2열 그리드, aspect-[16/10], 프로젝트 카드 3D tilt |
| `public/thumbnails/` | 프로젝트 썸네일 이미지 저장 디렉토리 |
| `scripts/add-project.mjs` | 신규 프로젝트 Notion DB 추가 스크립트 |

### 프로젝트 시스템 (Notion 연동)

프로젝트는 MDX 파일 없이 **Notion DB에서 빌드 시 fetch**합니다.

- **fetch 로직**: `src/lib/notion-projects.ts` → `src/utils.ts`의 `getProjects()` / `getFeaturedProjects()`
- **표시**: `src/components/Projects/Projects.astro` (홈), `src/pages/projects/index.astro` (전체 목록), `src/pages/projects/[...slug].astro` (상세)

**Notion DB 스키마**:
| 프로퍼티 | 타입 | 설명 |
|---|---|---|
| `Name` | title | 프로젝트 이름 |
| `Slug` | rich_text | URL slug — **한국어 제목이면 반드시 입력** (예: `my-project`) |
| `Description` | rich_text | 짧은 설명 |
| `Details` | rich_text | 상세 설명 |
| `Image` | url | 썸네일 (구 스키마 — 기존 프로젝트) |
| `AdditionalImages` | rich_text | 추가 이미지 URL 쉼표 구분 (구 스키마) |
| `Image1` | url | 대표 썸네일 (신 스키마 — 신규 프로젝트) |
| `Image2`~`Image7` | url | 상세 페이지 이미지 (신 스키마) |
| `Technologies` | multi_select | 기술 스택 태그 |
| `Features` | rich_text | 기능 목록 (줄바꿈 구분) |
| `Challenges` | rich_text | 어려웠던 점 |
| `RepoUrl` | url | GitHub 링크 |
| `ProjectUrl` | url | 배포 링크 |
| `Order` | number | 정렬 순서 (낮을수록 앞) |
| `Video` | url | hover 재생용 영상 (mp4/webm) — 있으면 카드·상세에서 영상, 없으면 이미지 폴백 |

**프로젝트 추가 방법**: `node scripts/add-project.mjs [경로]` 실행 → `npx vercel --prod` 재배포
- 숨기고 싶은 프로젝트: Notion에서 `Published` 체크박스 해제 (DB에 컬럼 1회 추가 필요)

### UX 업그레이드 완료 현황

| 기능 | 파일 | 비고 |
|---|---|---|
| Lenis smooth scroll | `src/layouts/BaseLayout.astro` | duration 1.2 |
| Astro View Transitions | `src/layouts/BaseLayout.astro` | `<ClientRouter />` |
| 스크롤 fade-up 애니메이션 | `src/layouts/BaseLayout.astro` | `.section` 클래스 대상 |
| 커스텀 커서 (dot + ring) | `src/components/CustomCursor.svelte` | hover 기기에서만 활성, cyan `#22d3ee` |
| 한국어 slug 지원 | `src/lib/notion-projects.ts` | `toSlug()`에 `가-힣` 범위 추가 |
| Map 서울 좌표 | `src/pages/map/index.astro` | `[126.978, 37.5665]` |
| Learning show more → 스크롤 자동 접힘 | `src/components/Learning/Learning.svelte` | 섹션 하단 지나치면 자동 collapse |
| Pretendard 폰트 | `src/components/BaseHead.astro` + `src/layouts/BaseLayout.astro` | CDN dynamic subset |
| 프로젝트 카드 3D tilt | `src/components/Projects/Projects.astro` | mousemove 14° + scale 1.03 |
| 프로젝트 카드 2열 레이아웃 | `src/components/Projects/Projects.astro` | aspect-[16/10] |
| 프로젝트 카드 영상 썸네일 | `src/components/Projects/Projects.astro` + `src/pages/projects/[...slug].astro` | Notion `Video` url — hover 시 재생, 떠나면 정지·리셋. 카드는 poster=Image1 |
| prefers-reduced-motion 지원 | `BaseLayout.astro` / `CustomCursor.svelte` / `Projects.astro` | Lenis·tilt·fade-up·커서·영상 자동재생 모두 비활성화 |
| SEO: sitemap + robots.txt | `astro.config.mjs` (`@astrojs/sitemap`) + `public/robots.txt` | `/sitemap-index.xml` |
| SEO: Person JSON-LD | `src/components/BaseHead.astro` | schema.org Person 구조화 데이터 |

### 다음 작업

- (없음 — 신규 프로젝트에 영상 썸네일을 적용하려면 Notion `Video` 컬럼에 mp4/webm URL 입력 또는 `add-project.mjs` 프롬프트 사용)

### Tailwind 주의사항
- `@tailwindcss/aspect-ratio` 플러그인 **제거됨** — 네이티브 `aspect-ratio` 유틸리티(`aspect-square` 등)와 충돌해서 제거. `aspect-w-*` / `aspect-h-*` 클래스 사용 불가.
- 색상 테마는 `src/config.ts`의 `BASE_COLOR` / `ACCENT_COLOR`로만 제어

### 환경변수 (`.env.local` + Vercel 대시보드)
```
NOTION_API_KEY
NOTION_PROJECTS_DB_ID
NOTION_TEAM_PROJECTS_DB_ID
NOTION_BLOG_DB_ID
NOTION_PARENT_PAGE_ID
```

### 경로 별칭 (vite alias)
```
$components  →  src/components/
$layouts     →  src/layouts/
$assets      →  src/assets/
$content     →  src/content/
```

### 개발 명령어
```bash
npm run dev        # 로컬 개발 서버 (localhost:4321)
npm run build      # 타입 체크 후 정적 빌드
npx vercel --prod  # 프로덕션 배포
```

### 프로젝트 추가 스크립트

```bash
# 개인 프로젝트 DB에 추가
node scripts/add-project.mjs /path/to/project

# 팀 프로젝트 DB에 추가
node scripts/add-project.mjs /path/to/project --team

# 현재 디렉토리 기준
node scripts/add-project.mjs
```

- `package.json`에서 이름·설명·기술스택 자동 감지
- `git remote`에서 repo URL 자동 감지
- 프롬프트로 확인·수정 후 Notion DB에 등록
- `Published: true`로 기본 설정 (사이트에 바로 노출)
- 썸네일: **로컬 파일 경로 입력 시** `public/thumbnails/<slug>.<ext>` 로 자동 복사 + Vercel URL 자동 설정
- 추가 후 `git add public/thumbnails/` → `npx vercel --prod` 재배포 필요

### 건드리지 말 것
- `public/lowpoly_nature/` — 3D 씬용 .glb 모델
- `package.json`의 `"type": "module"` — `/api` 파일은 반드시 ES module 문법 (`import`/`export default`)
