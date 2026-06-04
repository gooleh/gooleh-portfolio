import { notion, getTextContent } from './_notion.js';

const parseProject = (page) => {
  const p = page.properties;
  return {
    id: page.id,
    title: getTextContent(p.Name?.title),
    description: getTextContent(p.Description?.rich_text),
    details: getTextContent(p.Details?.rich_text),
    image: p.Image?.url || '',
    role: getTextContent(p.Role?.rich_text),
    technologies: p.Technologies?.multi_select?.map((s) => s.name) || [],
    features: getTextContent(p.Features?.rich_text).split('\n').filter(Boolean),
    challenges: getTextContent(p.Challenges?.rich_text),
    additionalImages: getTextContent(p.AdditionalImages?.rich_text)
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
    repoUrl: p.RepoUrl?.url || '',
    projectUrl: p.ProjectUrl?.url || '',
  };
};

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();
  try {
    const { results } = await notion.databases.query({
      database_id: process.env.NOTION_PROJECTS_DB_ID,
      sorts: [{ property: 'Order', direction: 'ascending' }],
    });
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    res.json(results.map(parseProject));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
}
