#!/usr/bin/env node
/**
 * Usage:
 *   node scripts/add-project.mjs [path-to-project]   # 개인 프로젝트 DB
 *   node scripts/add-project.mjs [path] --team        # 팀 프로젝트 DB
 *
 * path 생략 시 현재 디렉토리 사용
 *
 * 썸네일: 로컬 이미지 경로 입력 시 public/thumbnails/ 에 자동 복사
 *         URL 입력 시 그대로 사용
 */

import { readFileSync, existsSync, copyFileSync, mkdirSync } from 'fs';
import { resolve, basename, extname } from 'path';
import { createInterface } from 'readline';
import { execSync } from 'child_process';
import { Client } from '@notionhq/client';

const PORTFOLIO_ROOT = resolve(import.meta.dirname, '..');
const THUMBNAILS_DIR = resolve(PORTFOLIO_ROOT, 'public', 'thumbnails');
const SITE_URL = 'https://gooleh-portfolio.vercel.app';

// .env.local 로드
function loadEnv() {
  const envPath = resolve(PORTFOLIO_ROOT, '.env.local');
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, 'utf-8').split('\n')) {
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    const val = line.slice(eq + 1).trim();
    if (key && !process.env[key]) process.env[key] = val;
  }
}

function toSlug(s) {
  return s.toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9가-힣-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function ask(rl, q) {
  return new Promise(r => rl.question(q, r));
}

/**
 * 입력값이 로컬 파일이면 public/thumbnails/<slug><ext> 로 복사하고 Vercel URL 반환
 * URL이면 그대로 반환
 */
function resolveImage(input, slug) {
  if (!input) return '';

  // URL이면 그대로
  if (input.startsWith('http://') || input.startsWith('https://')) return input;

  // 로컬 경로
  const srcPath = resolve(input);
  if (!existsSync(srcPath)) {
    console.warn(`⚠️  파일을 찾을 수 없습니다: ${srcPath}`);
    return '';
  }

  mkdirSync(THUMBNAILS_DIR, { recursive: true });
  const ext = extname(srcPath) || '.png';
  const destName = `${slug}${ext}`;
  const destPath = resolve(THUMBNAILS_DIR, destName);
  copyFileSync(srcPath, destPath);
  console.log(`🖼  썸네일 복사: public/thumbnails/${destName}`);
  return `${SITE_URL}/thumbnails/${destName}`;
}

const TECH_MAP = {
  react: 'React', 'react-dom': 'React',
  next: 'Next.js',
  astro: 'Astro',
  svelte: 'Svelte',
  vue: 'Vue', nuxt: 'Nuxt',
  typescript: 'TypeScript',
  tailwindcss: 'Tailwind CSS',
  three: 'Three.js',
  '@threlte/core': 'Threlte',
  express: 'Express', fastify: 'Fastify', hono: 'Hono',
  prisma: 'Prisma', 'drizzle-orm': 'Drizzle',
  '@supabase/supabase-js': 'Supabase',
  firebase: 'Firebase',
  '@notionhq/client': 'Notion API',
  vite: 'Vite',
  python: 'Python',
  flask: 'Flask', django: 'Django', fastapi: 'FastAPI',
  'socket.io': 'Socket.io',
  redux: 'Redux', zustand: 'Zustand',
  graphql: 'GraphQL',
  '@trpc/server': 'tRPC',
  'framer-motion': 'Framer Motion',
  gsap: 'GSAP',
  lenis: 'Lenis',
};

function detectTechs(pkg) {
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  const seen = new Set();
  return Object.entries(TECH_MAP)
    .filter(([k]) => deps[k])
    .map(([, v]) => v)
    .filter(v => !seen.has(v) && seen.add(v));
}

async function getNextOrder(notion, dbId) {
  const { results } = await notion.databases.query({
    database_id: dbId,
    sorts: [{ property: 'Order', direction: 'descending' }],
    page_size: 1,
  });
  return (results[0]?.properties?.Order?.number ?? 0) + 1;
}

function urlProp(val) {
  return { url: val || null };
}

async function main() {
  loadEnv();

  const args = process.argv.slice(2);
  const isTeam = args.includes('--team');
  const pathArg = args.find(a => !a.startsWith('--'));
  const projectPath = resolve(pathArg || process.cwd());

  console.log(`\n📁 프로젝트 경로: ${projectPath}`);
  console.log(`📦 대상 DB: ${isTeam ? '팀 프로젝트' : '개인 프로젝트'}\n`);

  // package.json 읽기
  let pkg = {};
  const pkgPath = resolve(projectPath, 'package.json');
  if (existsSync(pkgPath)) pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));

  // README 첫 줄 (설명 힌트)
  let readme = '';
  for (const name of ['README.md', 'readme.md']) {
    const p = resolve(projectPath, name);
    if (existsSync(p)) {
      readme = readFileSync(p, 'utf-8')
        .replace(/^#+\s+/gm, '').replace(/[*`_]/g, '')
        .split('\n').filter(Boolean).slice(0, 3).join(' ').slice(0, 120);
      break;
    }
  }

  // git remote → repo URL
  let repoUrl = '';
  try {
    repoUrl = execSync('git remote get-url origin', { cwd: projectPath, stdio: 'pipe' })
      .toString().trim()
      .replace(/^git@github\.com:/, 'https://github.com/')
      .replace(/\.git$/, '');
  } catch {}

  const detectedTechs = detectTechs(pkg);
  const defaultName = pkg.name || basename(projectPath);
  const defaultDesc = pkg.description || readme;

  const rl = createInterface({ input: process.stdin, output: process.stdout });

  const name         = (await ask(rl, `이름       [${defaultName}]: `)).trim() || defaultName;
  const slug         = (await ask(rl, `Slug       [${toSlug(name)}]: `)).trim() || toSlug(name);
  const description  = (await ask(rl, `설명       [${defaultDesc}]: `)).trim() || defaultDesc;
  const techRaw      = (await ask(rl, `기술스택   [${detectedTechs.join(', ')}]: `)).trim();
  const technologies = techRaw ? techRaw.split(',').map(s => s.trim()) : detectedTechs;
  const imageInput   = (await ask(rl, `Image1 (대표이미지) [로컬 경로 또는 URL, 없으면 Enter]: `)).trim();
  const videoInput   = (await ask(rl, `Video (hover 재생용 mp4/webm) [로컬 경로 또는 URL, 없으면 Enter]: `)).trim();
  const image2       = (await ask(rl, `Image2              [로컬 경로 또는 URL, 없으면 Enter]: `)).trim();
  const image3       = (await ask(rl, `Image3              [로컬 경로 또는 URL, 없으면 Enter]: `)).trim();
  const image4       = (await ask(rl, `Image4              [로컬 경로 또는 URL, 없으면 Enter]: `)).trim();
  const image5       = (await ask(rl, `Image5              [로컬 경로 또는 URL, 없으면 Enter]: `)).trim();
  const image6       = (await ask(rl, `Image6              [로컬 경로 또는 URL, 없으면 Enter]: `)).trim();
  const image7       = (await ask(rl, `Image7              [로컬 경로 또는 URL, 없으면 Enter]: `)).trim();
  const projectUrl   = (await ask(rl, `라이브 URL          [없으면 Enter]: `)).trim();
  const repoInput    = (await ask(rl, `Repo URL   [${repoUrl}]: `)).trim();
  const details      = (await ask(rl, `상세 설명  [없으면 Enter]: `)).trim();
  const orderInput   = (await ask(rl, `Order      [자동]: `)).trim();

  rl.close();

  const thumbnailUrl = resolveImage(imageInput, `${slug}-1`);
  const videoUrl = resolveImage(videoInput, `${slug}-video`);
  const extraImages = [image2, image3, image4, image5, image6, image7]
    .map((input, i) => resolveImage(input, `${slug}-${i + 2}`));

  const notion = new Client({ auth: process.env.NOTION_API_KEY });
  const dbId = isTeam
    ? process.env.NOTION_TEAM_PROJECTS_DB_ID
    : process.env.NOTION_PROJECTS_DB_ID;

  if (!dbId) {
    console.error(`\n❌ 환경변수 ${isTeam ? 'NOTION_TEAM_PROJECTS_DB_ID' : 'NOTION_PROJECTS_DB_ID'} 가 없습니다.`);
    process.exit(1);
  }

  const order = orderInput ? parseInt(orderInput, 10) : await getNextOrder(notion, dbId);

  await notion.pages.create({
    parent: { database_id: dbId },
    properties: {
      Name:         { title: [{ text: { content: name } }] },
      Slug:         { rich_text: [{ text: { content: slug } }] },
      Description:  { rich_text: [{ text: { content: description } }] },
      Details:      { rich_text: [{ text: { content: details } }] },
      Image1:       urlProp(thumbnailUrl),
      Video:        urlProp(videoUrl),
      Image2:       urlProp(extraImages[0]),
      Image3:       urlProp(extraImages[1]),
      Image4:       urlProp(extraImages[2]),
      Image5:       urlProp(extraImages[3]),
      Image6:       urlProp(extraImages[4]),
      Image7:       urlProp(extraImages[5]),
      Technologies: { multi_select: technologies.map(t => ({ name: t })) },
      RepoUrl:      urlProp(repoInput || repoUrl),
      ProjectUrl:   urlProp(projectUrl),
      Order:        { number: order },
      Published:    { checkbox: true },
    },
  });

  console.log(`\n✅ "${name}" 을 Notion DB에 추가했습니다. (Order: ${order})`);
  if (thumbnailUrl.includes('/thumbnails/')) {
    console.log('📸 썸네일이 public/thumbnails/ 에 저장됐습니다.');
    console.log('   git add public/thumbnails/ 후 커밋하세요.');
  }
  console.log('👉 npx vercel --prod 로 재배포하면 사이트에 반영됩니다.\n');
}

main().catch(e => {
  console.error('\n❌ 오류:', e.message);
  process.exit(1);
});
