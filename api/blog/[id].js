const { notion, getTextContent } = require('../_notion');
const { NotionToMarkdown } = require('notion-to-md');

const n2m = new NotionToMarkdown({ notionClient: notion });

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
  const { id } = req.query;
  try {
    const [page, mdBlocks] = await Promise.all([
      notion.pages.retrieve({ page_id: id }),
      n2m.pageToMarkdown(id),
    ]);

    const post = parseBlogPost(page);
    post.content = n2m.toMarkdownString(mdBlocks).parent;

    const fetchPromises = [];

    if (post.series?.name) {
      fetchPromises.push(
        notion.databases
          .query({
            database_id: process.env.NOTION_BLOG_DB_ID,
            filter: {
              and: [
                { property: 'SeriesName', rich_text: { equals: post.series.name } },
                { property: 'Published', checkbox: { equals: true } },
              ],
            },
            sorts: [{ property: 'SeriesOrder', direction: 'ascending' }],
          })
          .then(({ results }) => {
            post.seriesPosts = results.map(parseBlogPost);
          })
      );
    }

    if (post.tags?.length > 0) {
      fetchPromises.push(
        notion.databases
          .query({
            database_id: process.env.NOTION_BLOG_DB_ID,
            filter: {
              and: [
                { property: 'Tags', multi_select: { contains: post.tags[0] } },
                { property: 'Published', checkbox: { equals: true } },
              ],
            },
            sorts: [{ property: 'Views', direction: 'descending' }],
            page_size: 5,
          })
          .then(({ results }) => {
            post.relatedPosts = results
              .filter((p) => p.id !== id)
              .slice(0, 3)
              .map(parseBlogPost);
          })
      );
    }

    await Promise.all(fetchPromises);

    res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=300');
    res.json(post);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
};
