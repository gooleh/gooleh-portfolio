# gooleh portfolio

personal portfolio site built with astro, svelte, threlte, threejs and tailwind.

## live

[gooleh-portfolio.vercel.app](https://gooleh-portfolio.vercel.app)

## tech stack

- astro 5 (static output)
- svelte 5 components
- threlte / three.js (interactive 3d planet on hero section)
- tailwind css v3
- notion api (project data fetched at build time)
- vercel

## development

```bash
git clone https://github.com/gooleh/gooleh-portfolio.git
cd gooleh-portfolio
npm install
npm run dev
```

## environment variables

create `.env.local` in the root:

```
NOTION_API_KEY=
NOTION_PROJECTS_DB_ID=
NOTION_TEAM_PROJECTS_DB_ID=
NOTION_BLOG_DB_ID=
NOTION_PARENT_PAGE_ID=
```

## deployment

```bash
npx vercel --prod
```

## credits

hero 3d scene inspired by [flo-bit.dev](https://flo-bit.dev), built with threlte and three.js.
