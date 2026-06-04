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
| `src/content/main/about.md` | About 섹션 본문 |
| `src/components/BaseHead.astro` | SEO 메타태그 |
| `src/components/Footer.astro` | 푸터 크레딧 |
| `src/components/About/Resume/Resume.astro` | 경력/학력 (코트야드 바이 메리어트 / 포시즌스 / 인하공업전문대학) |
| `src/assets/about/me/me.jpg` | 프로필 사진 |
| `src/assets/about/logos/marriott.svg` | 메리어트 로고 (SVG) |
| `src/assets/about/logos/fourseasons.svg` | 포시즌스 로고 (SVG) |
| `src/assets/about/logos/inha.svg` | 인하공업전문대학 로고 (SVG) |
| `src/lib/notion-projects.ts` | Notion DB 프로젝트 fetch |
| `src/content/config.ts` | Bluesky 제거 완료, blog 컬렉션만 유지 |

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
| `Image` | url | 썸네일 이미지 URL |
| `Technologies` | multi_select | 기술 스택 태그 |
| `Features` | rich_text | 기능 목록 (줄바꿈 구분) |
| `Challenges` | rich_text | 어려웠던 점 |
| `AdditionalImages` | rich_text | 추가 이미지 URL (쉼표 구분) |
| `RepoUrl` | url | GitHub 링크 |
| `ProjectUrl` | url | 배포 링크 |
| `Order` | number | 정렬 순서 (낮을수록 앞) |

**프로젝트 추가 방법**: Notion DB에 페이지 추가 → `npx vercel --prod` 재배포

### UX 업그레이드 완료 현황

| 기능 | 파일 | 비고 |
|---|---|---|
| Lenis smooth scroll | `src/layouts/BaseLayout.astro` | duration 1.2 |
| Astro View Transitions | `src/layouts/BaseLayout.astro` | `<ClientRouter />` |
| 스크롤 fade-up 애니메이션 | `src/layouts/BaseLayout.astro` (global CSS + IntersectionObserver) | `.section` 클래스 대상 |
| 커스텀 커서 (dot + ring) | `src/components/CustomCursor.svelte` | hover 기기에서만 활성, cyan `#22d3ee` |
| 한국어 slug 지원 | `src/lib/notion-projects.ts` | `toSlug()`에 `가-힣` 범위 추가 |
| Map 서울 좌표 | `src/pages/map/index.astro` | `[126.978, 37.5665]` |
| Learning 섹션 개인화 | `src/components/Learning/Learning.svelte` | 인하공업전문대학 커리큘럼 (2022–2025) |

### 알려진 이슈

- **Depth3D 프로필 사진** — `src/components/About/About.astro`에서 `depthMe = imageMe` (동일 파일)로 설정됨. 별도 depth map 이미지가 없어 3D 효과가 어색하게 보일 수 있음. 해결책: ① depth map 생성 후 교체, ② Depth3D 컴포넌트 제거하고 일반 `<Image>` 사용.

### 다음 작업 후보

1. **Depth3D 이슈 해결** — depth map 생성 또는 일반 이미지로 교체
2. **폰트 업그레이드** — Pretendard(한/영 최적화) 또는 Geist 적용
3. **프로젝트 카드 3D tilt** — 마우스 hover 시 카드가 3D로 기울어지는 효과

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

### 건드리지 말 것
- `public/lowpoly_nature/` — 3D 씬용 .glb 모델
- `package.json`의 `"type": "module"` — `/api` 파일은 반드시 ES module 문법 (`import`/`export default`)
