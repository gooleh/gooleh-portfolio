import { Client } from '@notionhq/client';

export type NotionProject = {
  id: string;
  slug: string;
  name: string;
  description: string;
  details: string;
  thumbnail: string;
  technologies: string[];
  features: string[];
  challenges: string;
  additionalImages: string[];
  projectUrl: string;
  repoUrl: string;
  order: number;
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

export async function getNotionProjects(): Promise<NotionProject[]> {
  const apiKey = import.meta.env.NOTION_API_KEY;
  const dbId = import.meta.env.NOTION_PROJECTS_DB_ID;

  if (!apiKey || !dbId) {
    console.warn('Notion env vars not set — returning empty project list');
    return [];
  }

  try {
    const notion = new Client({ auth: apiKey });
    const { results } = await notion.databases.query({
      database_id: dbId,
      sorts: [{ property: 'Order', direction: 'ascending' }],
    });

    return results.map((page: any) => {
      const p = page.properties;
      const name = getTextContent(p.Name?.title);
      // Slug property in Notion takes precedence, then title-derived slug, then UUID
      const notionSlug = getTextContent(p.Slug?.rich_text);
      return {
        id: page.id,
        slug: notionSlug || toSlug(name) || page.id,
        name,
        description: getTextContent(p.Description?.rich_text),
        details: getTextContent(p.Details?.rich_text),
        thumbnail: p.Image?.url
          || getTextContent(p.Image?.rich_text)
          || p.Image?.files?.[0]?.external?.url
          || p.Image?.files?.[0]?.file?.url
          || '',
        technologies: p.Technologies?.multi_select?.map((s: any) => s.name) || [],
        features: getTextContent(p.Features?.rich_text)
          .split('\n')
          .map((s: string) => s.trim())
          .filter(Boolean),
        challenges: getTextContent(p.Challenges?.rich_text),
        additionalImages: getTextContent(p.AdditionalImages?.rich_text)
          .split(',')
          .map((s: string) => s.trim())
          .filter(Boolean),
        projectUrl: p.ProjectUrl?.url || '',
        repoUrl: p.RepoUrl?.url || '',
        order: p.Order?.number ?? 999,
      };
    });
  } catch (e) {
    console.error('Failed to fetch Notion projects:', e);
    return [];
  }
}
