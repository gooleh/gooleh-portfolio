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

원작자(flo-bit)의 허락을 받아 개인 포트폴리오 사이트로 수정 중.

- **로컬 경로**: `C:\Users\landr\Gooleh\Gooleh_dev`
- **GitHub**: https://github.com/gooleh/gooleh-portfolio
- **라이브**: https://gooleh-portfolio.vercel.app
- **배포**: `npx vercel --prod` 또는 `git push` (Vercel 자동 배포 미연동 — CLI로 수동 배포 중)

### 기술 스택
- **Framework**: Astro 5 (output: static)
- **UI**: Svelte 5 컴포넌트 + Tailwind CSS
- **3D**: Three.js / Threlte (히어로 섹션 인터랙티브 행성)
- **콘텐츠**: Markdown / MDX (`src/content/`)
- **배포**: Vercel + `@astrojs/vercel` 어댑터
- **DB**: Notion API — `/api` 폴더가 Vercel Serverless Functions로 동작

### Notion API 구조 (`/api`)
| 파일 | 엔드포인트 | 설명 |
|---|---|---|
| `_notion.js` | — | Notion 클라이언트 공통 모듈 |
| `projects.js` | GET /api/projects | 개인 프로젝트 목록 |
| `team-projects.js` | GET /api/team-projects | 팀 프로젝트 목록 |
| `blog-posts.js` | GET /api/blog-posts | 블로그 포스트 목록 |
| `blog/[id].js` | GET /api/blog/[id] | 블로그 포스트 상세 |
| `blog/[id]/like.js` | POST /api/blog/[id]/like | 좋아요 |
| `blog/[id]/view.js` | POST /api/blog/[id]/view | 조회수 |
| `health.js` | GET /api/health | Notion 연결 상태 확인 |

- **주의**: `/api` 파일은 반드시 ES module (`import`/`export default`) 문법 사용. CommonJS (`require`/`module.exports`) 사용 시 `"type": "module"` 충돌로 500 에러 발생.
- **환경변수**: Vercel 대시보드에 등록됨 — `NOTION_API_KEY`, `NOTION_PROJECTS_DB_ID`, `NOTION_TEAM_PROJECTS_DB_ID`, `NOTION_BLOG_DB_ID`, `NOTION_PARENT_PAGE_ID`

### 핵심 파일 — 개인화 관련

| 파일 | 역할 | 상태 |
|---|---|---|
| `src/config.ts` | 사이트 URL, 파비콘, 테마 색상, 소셜 링크 | ✅ 완료 |
| `src/content/main/about.md` | About 섹션 본문 | ✅ 기본 교체 완료 (내용 보강 필요) |
| `src/components/BaseHead.astro` | SEO 메타태그, 기본 title/description | ✅ 완료 |
| `src/components/Footer.astro` | 푸터 크레딧 | ✅ 완료 |
| `src/components/About/Resume/Resume.astro` | 경력/학력 하드코딩 | ⬜ 미완료 — flo-bit 데이터 그대로 |
| `src/content/projects/*.mdx` | 프로젝트 페이지들 | ⬜ 미완료 — flo-bit 프로젝트 그대로 |
| `src/assets/about/me/me.webp` | 프로필 사진 | ⬜ 미완료 — flo-bit 사진 그대로 |
| `src/assets/about/me/me-depth.webp` | 프로필 depth 이미지 (3D 효과용) | ⬜ 미완료 |
| `src/content/config.ts` | Bluesky 로더 identifier | ⬜ 미완료 — Bluesky 계정 없으면 섹션 제거 필요 |

### 남은 작업
1. **프로필 사진 교체** — `src/assets/about/me/me.webp`, `me-depth.webp`
2. **경력/학력 교체** — `src/components/About/Resume/Resume.astro` 하드코딩된 데이터 수정
3. **프로젝트 교체** — `src/content/projects/*.mdx` + `src/assets/projects/` 썸네일
4. **Bluesky 섹션 처리** — 계정 없으므로 `src/content/config.ts`의 posts 컬렉션 및 관련 UI 제거
5. **About 텍스트 보강** — 실제 본인 스토리로 작성

### 경로 별칭 (vite alias)
```
$components  →  src/components/
$layouts     →  src/layouts/
$assets      →  src/assets/
$content     →  src/content/
```

### 개발 명령어
```bash
npm run dev      # 로컬 개발 서버 (localhost:4321)
npm run build    # 타입 체크 후 빌드
npx vercel --prod  # 프로덕션 배포
```

### 주의사항
- 색상 테마는 `src/config.ts`의 `BASE_COLOR` / `ACCENT_COLOR`로만 제어
- 프로젝트 썸네일: `src/assets/projects/<slug>/thumbnail.png` + `video-thumbnail.mp4`
- `public/lowpoly_nature/` — 3D 씬용 .glb 모델, 수정 금지
- `package.json`에 `"type": "module"` 있음 — `/api` 파일은 반드시 ES module 문법
