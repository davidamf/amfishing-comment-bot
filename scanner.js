const axios = require("axios");
const { handleFacebookComment } = require("./commentHandler");

const PAGE_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const PAGE_ID = process.env.PAGE_ID;
const AD_ACCOUNT_ID = process.env.AD_ACCOUNT_ID; // e.g. "act_XXXXXXXXXX"
const BASE = "https://graph.facebook.com/v19.0";

// Track processed comment IDs in memory (resets on restart — fine for hourly scans)
const processed = new Set();

// Fetch organic page posts from the last 24h
async function getOrganicPostIds() {
  const since = Math.floor(Date.now() / 1000) - 86400;
  const res = await axios.get(`${BASE}/${PAGE_ID}/posts`, {
    params: { fields: "id,created_time", limit: 100, since, access_token: PAGE_TOKEN }
  });
  return (res.data.data || []).map(p => p.id);
}

// Fetch ad post IDs from active/recent ads (last 7 days)
async function getAdPostIds() {
  if (!AD_ACCOUNT_ID) {
    console.log("[Scanner] No AD_ACCOUNT_ID set — skipping ad posts");
    return [];
  }

  const adPostIds = new Set();

  try {
    // Get ads that have been active in the last 7 days
    const since = Math.floor(Date.now() / 1000) - 7 * 86400;
    const adsRes = await axios.get(`${BASE}/${AD_ACCOUNT_ID}/ads`, {
      params: {
        fields: "id,creative{object_story_id,effective_object_story_id}",
        limit: 100,
        date_preset: "last_7d",
        access_token: PAGE_TOKEN
      }
    });

    for (const ad of adsRes.data.data || []) {
      const creative = ad.creative || {};
      const postId = creative.effective_object_story_id || creative.object_story_id;
      if (postId && postId.includes("_")) {
        adPostIds.add(postId);
      }
    }

    console.log(`[Scanner] Found ${adPostIds.size} unique ad post IDs`);
  } catch (err) {
    const msg = err.response?.data?.error?.message || err.message;
    console.error("[Scanner] Ad posts fetch error:", msg);
  }

  return [...adPostIds];
}

// Scan comments on a single post
async function scanPostComments(postId) {
  const summary = { scanned: 0, skipped: 0, errors: [] };

  try {
    const commentsRes = await axios.get(`${BASE}/${postId}/comments`, {
      params: {
        fields: "id,message,from,created_time",
        limit: 100,
        filter: "stream",
        access_token: PAGE_TOKEN
      }
    });
    const comments = commentsRes.data.data || [];

    for (const comment of comments) {
      // Skip our own comments
      if (comment.from?.id === PAGE_ID) continue;

      // Skip already processed
      if (processed.has(comment.id)) { summary.skipped++; continue; }

      // Check if we already replied
      try {
        const repliesRes = await axios.get(`${BASE}/${comment.id}/comments`, {
          params: { fields: "id,from", limit: 10, access_token: PAGE_TOKEN }
        });
        const weReplied = (repliesRes.data.data || []).some(r => r.from?.id === PAGE_ID);
        if (weReplied) { processed.add(comment.id); summary.skipped++; continue; }
      } catch (e) { /* proceed anyway */ }

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
    summary.errors.push(`Post ${postId}: ${msg}`);
    console.error(`[Scanner] Error on post ${postId}:`, msg);
  }

  return summary;
}

async function scanFacebookComments() {
  const summary = { organicPosts: 0, adPosts: 0, scanned: 0, skipped: 0, errors: [] };

  // Fetch organic + ad post IDs in parallel
  const [organicIds, adIds] = await Promise.all([
    getOrganicPostIds().catch(err => {
      summary.errors.push("Organic posts: " + (err.response?.data?.error?.message || err.message));
      return [];
    }),
    getAdPostIds().catch(err => {
      summary.errors.push("Ad posts: " + (err.response?.data?.error?.message || err.message));
      return [];
    })
  ]);

  // Deduplicate — an organic post can also be a boosted post
  const allIds = [...new Set([...organicIds, ...adIds])];
  summary.organicPosts = organicIds.length;
  summary.adPosts = adIds.length;

  console.log(`[Scanner] FB: ${organicIds.length} organic + ${adIds.length} ad posts = ${allIds.length} unique posts`);

  for (const postId of allIds) {
    const result = await scanPostComments(postId);
    summary.scanned += result.scanned;
    summary.skipped += result.skipped;
    summary.errors.push(...result.errors);
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
