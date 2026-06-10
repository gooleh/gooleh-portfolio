import { Client } from '@notionhq/client';
import { NotionToMarkdown } from 'notion-to-md';

export type NotionBlogPost = {
  id: string;
  slug: string;
  title: string;
  description: string;
  pubDate: Date;
  tags: string[];
  category: string;
  seriesName: string;
  seriesOrder: number;
  readTime: number;
  body: string; // markdown
};

function getTextContent(richText: any[]): string {
  return (richText || []).map((t: any) => t.plain_text).join('');
}

function toSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9가-힣-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

async function fetchPosts(): Promise<NotionBlogPost[]> {
  const apiKey = import.meta.env.NOTION_API_KEY;
  const dbId = import.meta.env.NOTION_BLOG_DB_ID;

  if (!apiKey || !dbId) {
    console.warn('Notion blog env vars not set — returning empty post list');
    return [];
  }

  try {
    const notion = new Client({ auth: apiKey });
    const n2m = new NotionToMarkdown({ notionClient: notion });

    const { results } = await notion.databases.query({
      database_id: dbId,
      filter: { property: 'Published', checkbox: { equals: true } },
      sorts: [{ property: 'Date', direction: 'descending' }],
    });

    const posts = await Promise.all(
      results.map(async (page: any) => {
        const p = page.properties;
        const title = getTextContent(p.Title?.title);
        const notionSlug = getTextContent(p.Slug?.rich_text);

        const mdBlocks = await n2m.pageToMarkdown(page.id);
        const body = n2m.toMarkdownString(mdBlocks).parent || '';

        return {
          id: page.id,
          slug: notionSlug || toSlug(title) || page.id,
          title,
          description: getTextContent(p.Description?.rich_text),
          pubDate: new Date(p.Date?.date?.start || Date.now()),
          tags: p.Tags?.multi_select?.map((t: any) => t.name) || [],
          category: p.Category?.select?.name || '',
          seriesName: getTextContent(p.SeriesName?.rich_text),
          seriesOrder: p.SeriesOrder?.number ?? 0,
          readTime: p.ReadTime?.number ?? 0,
          body,
        };
      })
    );

    // 같은 날짜의 글이 많아 시리즈/편 순서로 2차 정렬해 순서를 결정적으로 유지
    return posts.sort((a, b) => {
      const d = b.pubDate.getTime() - a.pubDate.getTime();
      if (d !== 0) return d;
      if (a.seriesName !== b.seriesName) return a.seriesName.localeCompare(b.seriesName);
      return a.seriesOrder - b.seriesOrder;
    });
  } catch (e) {
    console.error('Failed to fetch Notion blog posts:', e);
    return [];
  }
}

// 빌드 중 여러 페이지에서 호출되므로 한 번만 fetch
let cached: Promise<NotionBlogPost[]> | null = null;

export function getNotionBlogPosts(): Promise<NotionBlogPost[]> {
  if (!cached) cached = fetchPosts();
  return cached;
}
