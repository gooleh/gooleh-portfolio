const { notion } = require('../../_notion');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();
  const { id } = req.query;
  try {
    const page = await notion.pages.retrieve({ page_id: id });
    const currentViews = page.properties.Views?.number || 0;
    await notion.pages.update({
      page_id: id,
      properties: { Views: { number: currentViews + 1 } },
    });
    res.json({ views: currentViews + 1 });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
};
