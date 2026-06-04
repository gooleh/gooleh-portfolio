const { notion, getTextContent } = require('./_notion');

const parseBlogPost = (page) => {
  const p = page.properties;
  const seriesName = getTextContent(p.SeriesName?.rich_text);
  return {
    id: page.id,
    title: getTextContent(p.Title?.title),
    description: getTextContent(p.Description?.rich_text),
    image: p.Image?.url || '',
    category: p.Category?.select?.name || '',
    date: p.Date?.date?.start || null,
    readTime: p.ReadTime?.number || 0,
    views: p.Views?.number || 0,
    likes: p.Likes?.number || 0,
    tags: p.Tags?.multi_select?.map((s) => s.name) || [],
    series: seriesName ? { name: seriesName, order: p.SeriesOrder?.number || 0 } : null,
    thumbnailAlt: getTextContent(p.ThumbnailAlt?.rich_text),
    author: {
      name: getTextContent(p.AuthorName?.rich_text),
      avatar: p.AuthorAvatar?.url || '',
    },
  };
};

module.exports = async (req, res) => {
  if (req.method !== 'GET') return res.status(405).end();
  try {
    const { results } = await notion.databases.query({
      database_id: process.env.NOTION_BLOG_DB_ID,
      filter: { property: 'Published', checkbox: { equals: true } },
      sorts: [{ property: 'Date', direction: 'descending' }],
    });
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    res.json(results.map(parseBlogPost));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
};
