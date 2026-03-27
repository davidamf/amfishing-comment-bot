const axios = require("axios");

const PAGE_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const BASE = "https://graph.facebook.com/v19.0";

// Hide a Facebook/Instagram comment
async function hideComment(commentId, platform = "facebook") {
  try {
    const url = `${BASE}/${commentId}`;
    const params =
      platform === "instagram"
        ? { access_token: PAGE_TOKEN, hide: true }
        : { access_token: PAGE_TOKEN, is_hidden: true };

    await axios.post(url, params);
    console.log(`[Meta] Hidden comment ${commentId} on ${platform}`);
    return true;
  } catch (err) {
    console.error(`[Meta] Failed to hide comment ${commentId}:`, err.response?.data || err.message);
    return false;
  }
}

// Reply to a Facebook comment
async function replyToFacebookComment(commentId, message) {
  try {
    await axios.post(`${BASE}/${commentId}/comments`, {
      message,
      access_token: PAGE_TOKEN,
    });
    console.log(`[Meta] Replied to FB comment ${commentId}`);
    return true;
  } catch (err) {
    console.error(`[Meta] Failed to reply to FB comment ${commentId}:`, err.response?.data || err.message);
    return false;
  }
}

// Reply to an Instagram comment
async function replyToInstagramComment(mediaId, commentId, message) {
  try {
    await axios.post(`${BASE}/${mediaId}/replies`, {
      message,
      username: commentId, // IG uses username for replies in some API versions
      access_token: PAGE_TOKEN,
    });
    console.log(`[Meta] Replied to IG comment on media ${mediaId}`);
    return true;
  } catch (err) {
    // Fallback: try direct comment reply endpoint
    try {
      await axios.post(`${BASE}/${commentId}/replies`, {
        message,
        access_token: PAGE_TOKEN,
      });
      console.log(`[Meta] Replied to IG comment ${commentId} (fallback)`);
      return true;
    } catch (err2) {
      console.error(`[Meta] Failed to reply to IG comment:`, err2.response?.data || err2.message);
      return false;
    }
  }
}

module.exports = { hideComment, replyToFacebookComment, replyToInstagramComment };
