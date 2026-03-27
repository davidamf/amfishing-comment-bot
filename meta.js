const axios = require("axios");

const PAGE_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const BASE = "https://graph.facebook.com/v19.0";

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Retry wrapper with backoff for Meta rate limits (error 368)
async function withRateLimit(fn, label) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const apiErr = err.response?.data?.error;
      if (apiErr?.code === 368 && attempt < 3) {
        const delay = attempt === 1 ? 30000 : 90000; // 30s then 90s
        console.warn(`[Meta] Rate limited on ${label} (attempt ${attempt}) — waiting ${delay / 1000}s`);
        await sleep(delay);
      } else {
        throw err;
      }
    }
  }
}

// Delete a Facebook comment
async function deleteComment(commentId) {
  try {
    await axios.delete(`${BASE}/${commentId}`, {
      params: { access_token: PAGE_TOKEN }
    });
    console.log(`[Meta] Deleted FB comment ${commentId}`);
    return true;
  } catch (err) {
    console.error(`[Meta] Failed to delete FB comment ${commentId}:`, err.response?.data || err.message);
    return false;
  }
}

// Delete an Instagram comment
async function deleteInstagramComment(commentId) {
  try {
    await axios.delete(`${BASE}/${commentId}`, {
      params: { access_token: PAGE_TOKEN }
    });
    console.log(`[Meta] Deleted IG comment ${commentId}`);
    return true;
  } catch (err) {
    console.error(`[Meta] Failed to delete IG comment ${commentId}:`, err.response?.data || err.message);
    return false;
  }
}

// Block a user from the Facebook Page
async function blockUser(userId, pageId) {
  if (!pageId) {
    pageId = process.env.PAGE_ID;
  }
  try {
    await axios.post(`${BASE}/${pageId}/blocked`, {
      user: userId,
      access_token: PAGE_TOKEN,
    });
    console.log(`[Meta] Blocked user ${userId} from page`);
    return true;
  } catch (err) {
    console.error(`[Meta] Failed to block user ${userId}:`, err.response?.data || err.message);
    return false;
  }
}

// Reply to a Facebook comment (with rate limit backoff)
async function replyToFacebookComment(commentId, message) {
  try {
    await withRateLimit(async () => {
      await axios.post(`${BASE}/${commentId}/comments`, {
        message,
        access_token: PAGE_TOKEN,
      });
    }, `FB reply ${commentId}`);
    console.log(`[Meta] Replied to FB comment ${commentId}`);
    return true;
  } catch (err) {
    console.error(`[Meta] Failed to reply to FB comment ${commentId}:`, err.response?.data || err.message);
    return false;
  }
}

// Reply to an Instagram comment (with rate limit backoff)
async function replyToInstagramComment(mediaId, commentId, message) {
  try {
    await withRateLimit(async () => {
      await axios.post(`${BASE}/${commentId}/replies`, {
        message,
        access_token: PAGE_TOKEN,
      });
    }, `IG reply ${commentId}`);
    console.log(`[Meta] Replied to IG comment ${commentId}`);
    return true;
  } catch (err) {
    console.error(`[Meta] Failed to reply to IG comment:`, err.response?.data || err.message);
    return false;
  }
}

module.exports = {
  deleteComment,
  deleteInstagramComment,
  blockUser,
  replyToFacebookComment,
  replyToInstagramComment,
};
