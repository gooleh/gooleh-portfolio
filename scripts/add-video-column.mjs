#!/usr/bin/env node
/**
 * 개인/팀 프로젝트 Notion DB에 Video(url) 프로퍼티를 추가하는 1회성 스크립트.
 * 이미 존재하면 건너뜀.
 *
 * Usage: node scripts/add-video-column.mjs
 */

import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { Client } from '@notionhq/client';

const PORTFOLIO_ROOT = resolve(import.meta.dirname, '..');

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

async function ensureVideoColumn(notion, dbId, label) {
  const db = await notion.databases.retrieve({ database_id: dbId });
  if (db.properties.Video) {
    console.log(`✅ ${label}: Video 컬럼이 이미 있습니다.`);
    return;
  }
  await notion.databases.update({
    database_id: dbId,
    properties: { Video: { url: {} } },
  });
  console.log(`✅ ${label}: Video(url) 컬럼을 추가했습니다.`);
}

loadEnv();
const notion = new Client({ auth: process.env.NOTION_API_KEY });

await ensureVideoColumn(notion, process.env.NOTION_PROJECTS_DB_ID, '개인 프로젝트 DB');
if (process.env.NOTION_TEAM_PROJECTS_DB_ID) {
  await ensureVideoColumn(notion, process.env.NOTION_TEAM_PROJECTS_DB_ID, '팀 프로젝트 DB');
}
