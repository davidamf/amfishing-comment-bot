const axios = require("axios");
const { handleFacebookComment, handleInstagramComment } = require("./commentHandler");

const PAGE_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const PAGE_ID = process.env.PAGE_ID;
const IG_ID = process.env.INSTAGRAM_ACCOUNT_ID;
const BASE = "https://graph.facebook.com/v19.0";

// Track processed comment IDs in memory to avoid double-processing
// (resets on restart, but that's fine — worst case a comment gets re-checked)
const processed = new Set();

async function scanFacebookComments() {
  const summary = { scanned: 0, actioned: 0, errors: [] };
  try {
    // Get recent posts (last 24h)
    const since = Math.floor(Date.now() / 1000) - 86400;
    const postsRes = await axios.get(`${BASE}/${PAGE_ID}/posts`, {
      params: { fields: "id,created_time", limit: 20, since, access_token: PAGE_TOKEN }
    });
    const posts = postsRes.data.data || [];
    console.log(`[Scanner] FB: found ${posts.length} recent posts`);

    for (const post of posts) {
      try {
        const commentsRes = await axios.get(`${BASE}/${post.id}/comments`, {
          params: {
            fields: "id,message,from,created_time",
            limit: 50,
            filter: "stream",
            access_token: PAGE_TOKEN
          }
        });
        const comments = commentsRes.data.data || [];
        for (const comment of comments) {
          if (processed.has(comment.id)) continue;
          processed.add(comment.id);
          summary.scanned++;
          const before = summary.actioned;
          await handleFacebookComment({
            id: comment.id,
            message: comment.message,
            from: comment.from
          });
          // If handleFacebookComment did something, actioned count goes up
          // We can't easily detect this without refactoring, so just count scanned
        }
      } catch (err) {
        summary.errors.push(`Post ${post.id}: ${err.response?.data?.error?.message || err.message}`);
      }
    }
  } catch (err) {
    summary.errors.push(`FB posts fetch: ${err.response?.data?.error?.message || err.message}`);
  }
  return summary;
}

async function scanInstagramComments() {
  const summary = { scanned: 0, errors: [] };
  try {
    // Get recent IG media (last 24h)
    const since = Math.floor(Date.now() / 1000) - 86400;
    const mediaRes = await axios.get(`${BASE}/${IG_ID}/media`, {
      params: { fields: "id,timestamp", limit: 20, access_token: PAGE_TOKEN }
    });
    const media = (mediaRes.data.data || []).filter(m => {
      const ts = Math.floor(new Date(m.timestamp).getTime() / 1000);
      return ts > since;
    });
    console.log(`[Scanner] IG: found ${media.length} recent posts`);

    for (const item of media) {
      try {
        const commentsRes = await axios.get(`${BASE}/${item.id}/comments`, {
          params: { fields: "id,text,username,timestamp", limit: 50, access_token: PAGE_TOKEN }
        });
        const comments = commentsRes.data.data || [];
        for (const comment of comments) {
          if (processed.has(comment.id)) continue;
          processed.add(comment.id);
          summary.scanned++;
          await handleInstagramComment({
            id: comment.id,
            text: comment.text,
            media_id: item.id,
            username: comment.username
          });
        }
      } catch (err) {
        summary.errors.push(`IG media ${item.id}: ${err.response?.data?.error?.message || err.message}`);
      }
    }
  } catch (err) {
    summary.errors.push(`IG media fetch: ${err.response?.data?.error?.message || err.message}`);
  }
  return summary;
}

async function runFullScan() {
  console.log("[Scanner] Starting full scan...");
  const fb = await scanFacebookComments();
  const ig = await scanInstagramComments();
  const result = {
    facebook: fb,
    instagram: ig,
    timestamp: new Date().toISOString()
  };
  console.log("[Scanner] Done:", JSON.stringify(result));
  return result;
}

module.exports = { runFullScan };
