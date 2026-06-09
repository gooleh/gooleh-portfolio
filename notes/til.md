# TIL

**[브라우저 영상 자동재생 정책]** — `autoplay`는 `muted`(+ iOS는 `playsinline`)가 있어야만 동작한다.
> 크롬·사파리 모두 소리 있는 영상의 자동재생을 차단한다. hover 재생 UI도 `video.play()`가 Promise를 반환하므로 `.catch()`로 거부(사용자 인터랙션 부족 등)를 처리해야 콘솔 에러가 안 난다.

**[prefers-reduced-motion]** — 모션 효과(스무스 스크롤, 패럴랙스, 자동재생)는 OS 접근성 설정을 존중해야 한다.
> `window.matchMedia('(prefers-reduced-motion: reduce)')`로 JS에서, `@media (prefers-reduced-motion: reduce)`로 CSS에서 분기. 멀미·전정 장애 사용자 배려이자 Lighthouse 접근성 권장 사항.

**[Notion API로 DB 스키마 변경]** — 컬럼 추가는 수동이 아니라 `databases.update`로 자동화할 수 있다.
> `notion.databases.update({ database_id, properties: { Video: { url: {} } } })` 한 줄이면 url 타입 프로퍼티가 생긴다. 스키마 마이그레이션을 스크립트로 남기면 팀 DB에도 동일하게 재적용 가능.

**[정적 사이트 SEO 기본 3종]** — sitemap, robots.txt, JSON-LD 구조화 데이터.
> Astro는 `@astrojs/sitemap` 통합으로 빌드 시 자동 생성(`site` 설정 필수). robots.txt에 sitemap 경로를 명시하고, 포트폴리오엔 schema.org `Person` 타입 JSON-LD를 넣으면 검색 결과에 인물 정보가 풍부하게 노출될 수 있다.
