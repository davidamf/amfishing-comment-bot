const axios = require("axios");

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

async function notifyMike(message) {
  if (!BOT_TOKEN || !CHAT_ID) {
    console.warn("[Telegram] Bot token or chat ID not set — skipping alert");
    return;
  }
  try {
    await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      chat_id: CHAT_ID,
      text: message,
      parse_mode: "HTML",
    });
    console.log("[Telegram] Alert sent to Mike");
  } catch (err) {
    console.error("[Telegram] Failed to send alert:", err.response?.data || err.message);
  }
}

module.exports = { notifyMike };
