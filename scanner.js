const axios = require("axios");
const { handleFacebookComment, handleInstagramComment } = require("./commentHandler");

const PAGE_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const PAGE_ID = process.env.PAGE_ID;
const BASE = "https://graph.facebook.com/v19.0";

// Track processed comment IDs in memory to avoid double-processing
const processed = new Set();

async function scanFacebookComments() {
  const summary = { posts: 0, scanned: 0, errors: [] };
  try {
    // Get recent posts (last 48h)
    const since = Math.floor(Date.now() / 1000) - 86400; // 24 hours
    const postsRes = await axios.get(`${BASE}/${PAGE_ID}/posts`, {
      params: { fields: "id,created_time,message", limit: 25, since, access_token: PAGE_TOKEN }
    });
    const posts = postsRes.data.data || [];
    summary.posts = posts.length;
    console.log(`[Scanner] FB: ${posts.length} posts in last 48h`);

    for (const post of posts) {
      try {
        const commentsRes = await axios.get(`${BASE}/${post.id}/comments`, {
          params: {
            fields: "id,message,from,created_time",
            limit: 100,
            filter: "stream",
            access_token: PAGE_TOKEN
          }
        });
        const comments = commentsRes.data.data || [];
        for (const comment of comments) {
          if (processed.has(comment.id)) continue;
          processed.add(comment.id);
          summary.scanned++;
          await handleFacebookComment({
            id: comment.id,
            message: comment.message,
            from: comment.from
          });
        }
      } catch (err) {
        const msg = err.response?.data?.error?.message || err.message;
        summary.errors.push(`Post ${post.id}: ${msg}`);
        console.error(`[Scanner] Error on post ${post.id}:`, msg);
      }
    }
  } catch (err) {
    const msg = err.response?.data?.error?.message || err.message;
    summary.errors.push(`FB posts fetch: ${msg}`);
    console.error("[Scanner] FB fetch error:", msg);
  }
  return summary;
}

// Note: Instagram comment scanning via proactive polling requires instagram_basic
// permission which needs App Review. Instagram is handled purely via webhooks.
// The webhook fires in real-time when comments are posted.

async function runFullScan() {
  console.log("[Scanner] Starting full scan...");
  const fb = await scanFacebookComments();
  const result = {
    facebook: fb,
    instagram: "handled via webhooks (real-time)",
    timestamp: new Date().toISOString()
  };
  console.log("[Scanner] Done:", JSON.stringify(result));
  return result;
}

module.exports = { runFullScan };
