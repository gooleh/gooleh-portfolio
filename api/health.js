module.exports = async (req, res) => {
  try {
    const { notion } = require('./_notion');

    const result = {
      envVars: {
        NOTION_API_KEY: !!process.env.NOTION_API_KEY,
        NOTION_PROJECTS_DB_ID: !!process.env.NOTION_PROJECTS_DB_ID,
        NOTION_TEAM_PROJECTS_DB_ID: !!process.env.NOTION_TEAM_PROJECTS_DB_ID,
        NOTION_BLOG_DB_ID: !!process.env.NOTION_BLOG_DB_ID,
      },
    };

    await notion.databases.retrieve({ database_id: process.env.NOTION_PROJECTS_DB_ID });
    result.notionConnection = 'ok';

    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message, stack: e.stack });
  }
};
