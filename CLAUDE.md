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

## Project: Portfolio Site

원작자(flo-bit)의 허락을 받아 개인 포트폴리오 사이트로 수정 중.

### 기술 스택
- **Framework**: Astro 5 (SSG)
- **UI**: Svelte 5 컴포넌트 + Tailwind CSS
- **3D**: Three.js / Threlte (히어로 섹션의 인터랙티브 행성)
- **콘텐츠**: Markdown / MDX (`src/content/`)
- **배포**: Vercel (Serverless Functions — `/api` 폴더)
- **DB**: Notion API (`@notionhq/client`, `notion-to-md`)

### 핵심 파일 — 개인화할 때 수정하는 곳

| 파일 | 역할 |
|---|---|
| `src/config.ts` | 사이트 URL, 파비콘, 테마 색상, 소셜 링크 |
| `src/content/main/about.md` | About 섹션 본문 |
| `src/content/data/work-education.json` | 경력 / 학력 데이터 |
| `src/content/data/learnings.json` | Learning 섹션 데이터 |
| `src/content/projects/*.mdx` | 프로젝트 개별 페이지 |
| `src/assets/about/me/` | 프로필 이미지 (me.webp, me-depth.webp) |

### 경로 별칭 (vite alias)
```
$components  →  src/components/
$layouts     →  src/layouts/
$assets      →  src/assets/
$content     →  src/content/
```

### 개발 명령어
```bash
npm run dev      # 로컬 개발 서버
npm run build    # 타입 체크 후 빌드
npm run preview  # 빌드 결과물 미리보기
```

### 주의사항
- 색상 테마는 `src/config.ts`의 `BASE_COLOR` / `ACCENT_COLOR`로만 제어 (Tailwind 클래스 직접 수정 X)
- 프로젝트 썸네일은 `src/assets/projects/<slug>/` 폴더에 위치
- `public/lowpoly_nature/` — 3D 씬용 .glb 모델 파일, 건드리지 말 것
