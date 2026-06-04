import { notion } from '../../_notion.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { id } = req.query;
  try {
    const page = await notion.pages.retrieve({ page_id: id });
    const currentLikes = page.properties.Likes?.number || 0;
    await notion.pages.update({
      page_id: id,
      properties: { Likes: { number: currentLikes + 1 } },
    });
    res.json({ likes: currentLikes + 1 });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
}
