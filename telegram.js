const axios = require("axios");

// CS bot — for email CS notifications (refunds, address changes, etc.)
const CS_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CS_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

// Comments bot — for FB/IG comment moderation notifications only
const COMMENTS_BOT_TOKEN = process.env.TELEGRAM_COMMENTS_BOT_TOKEN || CS_BOT_TOKEN;
const COMMENTS_CHAT_ID = process.env.TELEGRAM_COMMENTS_CHAT_ID || CS_CHAT_ID;

async function sendTelegram(botToken, chatId, message) {
  if (!botToken || !chatId) {
    console.warn("[Telegram] Token or chat ID not set — skipping");
    return;
  }
  try {
    await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      chat_id: chatId,
      text: message,
      parse_mode: "HTML",
    });
    console.log("[Telegram] Alert sent");
  } catch (err) {
    console.error("[Telegram] Failed:", err.response?.data || err.message);
  }
}

// For CS notifications (refunds, address changes, escalations)
async function notifyMike(message) {
  return sendTelegram(CS_BOT_TOKEN, CS_CHAT_ID, message);
}

// For comment moderation notifications (FB/IG deleted comments)
async function notifyComments(message) {
  return sendTelegram(COMMENTS_BOT_TOKEN, COMMENTS_CHAT_ID, message);
}

module.exports = { notifyMike, notifyComments };
