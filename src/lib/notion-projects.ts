import { Client } from '@notionhq/client';

export type NotionProject = {
  id: string;
  slug: string;
  name: string;
  description: string;
  details: string;
  thumbnail: string;
  video: string;
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

function parsePages(results: any[]): NotionProject[] {
  return results
    .filter((page: any) => {
      // Published 컬럼이 없으면 전체 표시, 있으면 체크된 것만 표시
      const published = page.properties.Published?.checkbox;
      return published === undefined || published === true;
    })
    .map((page: any) => {
      const p = page.properties;
      const name = getTextContent(p.Name?.title);
      const notionSlug = getTextContent(p.Slug?.rich_text);
      return {
        id: page.id,
        slug: notionSlug || toSlug(name) || page.id,
        name,
        description: getTextContent(p.Description?.rich_text),
        details: getTextContent(p.Details?.rich_text),
        // Image1~Image7 (새 스키마) 우선, 없으면 기존 Image + AdditionalImages 폴백
        thumbnail: p['Image1']?.url
          || p.Image?.url
          || getTextContent(p.Image?.rich_text)
          || p.Image?.files?.[0]?.external?.url
          || p.Image?.files?.[0]?.file?.url
          || '',
        video: p.Video?.url || '',
        technologies: p.Technologies?.multi_select?.map((s: any) => s.name) || [],
        features: getTextContent(p.Features?.rich_text)
          .split('\n')
          .map((s: string) => s.trim())
          .filter(Boolean),
        challenges: getTextContent(p.Challenges?.rich_text),
        additionalImages: p['Image2']?.url
          ? ['Image2','Image3','Image4','Image5','Image6','Image7']
              .map((k) => p[k]?.url as string)
              .filter(Boolean)
          : getTextContent(p.AdditionalImages?.rich_text)
              .split(',')
              .map((s: string) => s.trim())
              .filter(Boolean),
        projectUrl: p.ProjectUrl?.url || '',
        repoUrl: p.RepoUrl?.url || '',
        order: p.Order?.number ?? 999,
      };
    });
}

export async function getNotionProjects(): Promise<NotionProject[]> {
  const apiKey = import.meta.env.NOTION_API_KEY;
  const dbId = import.meta.env.NOTION_PROJECTS_DB_ID;
  const teamDbId = import.meta.env.NOTION_TEAM_PROJECTS_DB_ID;

  if (!apiKey || !dbId) {
    console.warn('Notion env vars not set — returning empty project list');
    return [];
  }

  try {
    const notion = new Client({ auth: apiKey });

    const [personalRes, teamRes] = await Promise.all([
      notion.databases.query({
        database_id: dbId,
        sorts: [{ property: 'Order', direction: 'ascending' }],
      }),
      teamDbId
        ? notion.databases.query({
            database_id: teamDbId,
            sorts: [{ property: 'Order', direction: 'ascending' }],
          })
        : Promise.resolve({ results: [] }),
    ]);

    return [...parsePages(personalRes.results), ...parsePages(teamRes.results)]
      .sort((a, b) => a.order - b.order);
  } catch (e) {
    console.error('Failed to fetch Notion projects:', e);
    return [];
  }
}
