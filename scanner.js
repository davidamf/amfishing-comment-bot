const axios = require("axios");
const { handleFacebookComment } = require("./commentHandler");

const PAGE_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const USER_TOKEN = process.env.USER_ACCESS_TOKEN; // long-lived user token with ads_read
const PAGE_ID = process.env.PAGE_ID;
const AD_ACCOUNT_ID = process.env.AD_ACCOUNT_ID;
const BASE = "https://graph.facebook.com/v19.0";

const processed = new Set();

async function getOrganicPostIds() {
  const since = Math.floor(Date.now() / 1000) - 86400;
  const res = await axios.get(`${BASE}/${PAGE_ID}/posts`, {
    params: { fields: "id,created_time", limit: 100, since, access_token: PAGE_TOKEN }
  });
  return (res.data.data || []).map(p => p.id);
}

async function getAdPostIds() {
  if (!AD_ACCOUNT_ID || !USER_TOKEN) {
    console.log("[Scanner] Skipping ad posts — AD_ACCOUNT_ID or USER_ACCESS_TOKEN not set");
    return [];
  }
  const adPostIds = new Set();
  try {
    const res = await axios.get(`${BASE}/${AD_ACCOUNT_ID}/ads`, {
      params: {
        fields: "id,creative{object_story_id,effective_object_story_id}",
        limit: 100,
        date_preset: "today",
        access_token: USER_TOKEN
      }
    });
    for (const ad of res.data.data || []) {
      const creative = ad.creative || {};
      const pid = creative.effective_object_story_id || creative.object_story_id;
      if (pid && pid.includes("_")) adPostIds.add(pid);
    }
    console.log(`[Scanner] Found ${adPostIds.size} ad post IDs`);
  } catch (err) {
    console.error("[Scanner] Ad posts fetch error:", err.response?.data?.error?.message || err.message);
  }
  return [...adPostIds];
}

async function scanPostComments(postId) {
  const summary = { scanned: 0, skipped: 0, errors: [] };
  try {
    const since24h = Math.floor(Date.now() / 1000) - 86400;
    const res = await axios.get(`${BASE}/${postId}/comments`, {
      params: { fields: "id,message,from,created_time", limit: 100, filter: "stream", since: since24h, access_token: PAGE_TOKEN }
    });
    const comments = res.data.data || [];
    for (const comment of comments) {
      if (comment.from?.id === PAGE_ID) continue;
      if (processed.has(comment.id)) { summary.skipped++; continue; }
      // Skip comments older than 24 hours
      const commentAge = Date.now() / 1000 - new Date(comment.created_time).getTime() / 1000;
      if (commentAge > 86400) { summary.skipped++; continue; }
      try {
        const repliesRes = await axios.get(`${BASE}/${comment.id}/comments`, {
          params: { fields: "id,from", limit: 10, access_token: PAGE_TOKEN }
        });
        const weReplied = (repliesRes.data.data || []).some(r => r.from?.id === PAGE_ID);
        if (weReplied) { processed.add(comment.id); summary.skipped++; continue; }
      } catch (e) {}
      processed.add(comment.id);
      summary.scanned++;
      await handleFacebookComment({ id: comment.id, message: comment.message, from: comment.from });
    }
  } catch (err) {
    const msg = err.response?.data?.error?.message || err.message;
    summary.errors.push(`Post ${postId}: ${msg}`);
  }
  return summary;
}

async function scanFacebookComments() {
  const summary = { organicPosts: 0, adPosts: 0, scanned: 0, skipped: 0, errors: [] };
  const [organicIds, adIds] = await Promise.all([
    getOrganicPostIds().catch(err => { summary.errors.push("Organic: " + err.message); return []; }),
    getAdPostIds().catch(err => { summary.errors.push("Ads: " + err.message); return []; })
  ]);
  const allIds = [...new Set([...organicIds, ...adIds])];
  summary.organicPosts = organicIds.length;
  summary.adPosts = adIds.length;
  console.log(`[Scanner] ${organicIds.length} organic + ${adIds.length} ad = ${allIds.length} unique posts`);
  for (const postId of allIds) {
    const r = await scanPostComments(postId);
    summary.scanned += r.scanned;
    summary.skipped += r.skipped;
    summary.errors.push(...r.errors);
  }
  return summary;
}

async function runFullScan() {
  console.log("[Scanner] Starting full scan...");
  const fb = await scanFacebookComments();
  const result = { facebook: fb, instagram: "webhooks only", timestamp: new Date().toISOString() };
  console.log("[Scanner] Done:", JSON.stringify(result));
  return result;
}

module.exports = { runFullScan };
