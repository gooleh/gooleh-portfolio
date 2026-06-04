const { Client } = require('@notionhq/client');

const notion = new Client({ auth: process.env.NOTION_API_KEY });

const getTextContent = (richText) =>
  (richText || []).map((t) => t.plain_text).join('');

module.exports = { notion, getTextContent };
