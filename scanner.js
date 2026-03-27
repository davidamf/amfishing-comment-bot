const axios = require("axios");
const { handleFacebookComment } = require("./commentHandler");

const PAGE_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const PAGE_ID = process.env.PAGE_ID;
const BASE = "https://graph.facebook.com/v19.0";

// Track processed comment IDs in memory (resets on restart — fine for hourly scans)
const processed = new Set();

async function scanFacebookComments() {
  const summary = { posts: 0, scanned: 0, skipped: 0, errors: [] };
  try {
    const since = Math.floor(Date.now() / 1000) - 86400; // 24 hours
    const postsRes = await axios.get(`${BASE}/${PAGE_ID}/posts`, {
      params: { fields: "id,created_time,message", limit: 100, since, access_token: PAGE_TOKEN }
    });
    const posts = postsRes.data.data || [];
    summary.posts = posts.length;
    console.log(`[Scanner] FB: ${posts.length} posts in last 24h`);

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

        // Build a set of comment IDs that A.M. Fishing has already replied to
        // by checking which parent comments have a child from PAGE_ID
        const alreadyReplied = new Set();
        for (const comment of comments) {
          if (comment.from?.id === PAGE_ID) {
            // This is our own reply — mark the parent as already handled
            // Top-level comments from us don't need a reply either
            alreadyReplied.add(comment.id);
          }
        }

        for (const comment of comments) {
          // Skip our own comments
          if (comment.from?.id === PAGE_ID) continue;

          // Skip if we already processed this comment ID
          if (processed.has(comment.id)) { summary.skipped++; continue; }

          // Skip if we already replied to this comment (check its replies)
          try {
            const repliesRes = await axios.get(`${BASE}/${comment.id}/comments`, {
              params: { fields: "id,from", limit: 10, access_token: PAGE_TOKEN }
            });
            const replies = repliesRes.data.data || [];
            const weReplied = replies.some(r => r.from?.id === PAGE_ID);
            if (weReplied) {
              processed.add(comment.id);
              summary.skipped++;
              continue;
            }
          } catch (e) {
            // If we can't check replies, proceed anyway
          }

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
