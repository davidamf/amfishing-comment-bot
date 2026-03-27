const axios = require("axios");

const PAGE_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const BASE = "https://graph.facebook.com/v19.0";

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
    await axios.post(`${BASE}/${commentId}/replies`, {
      message,
      access_token: PAGE_TOKEN,
    });
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
