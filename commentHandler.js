const { hideComment, replyToFacebookComment, replyToInstagramComment } = require("./meta");
const { notifyMike } = require("./telegram");
const {
  NEGATIVE_KEYWORDS,
  AUTO_REPLIES,
  ORDER_KEYWORDS,
  PRODUCT_KEYWORDS,
  BUY_KEYWORDS,
} = require("./keywords");

function containsKeyword(text, keywords) {
  const lower = text.toLowerCase();
  return keywords.some((kw) => lower.includes(kw.toLowerCase()));
}

function classifyComment(text) {
  if (containsKeyword(text, NEGATIVE_KEYWORDS)) return "negative";
  if (containsKeyword(text, ORDER_KEYWORDS)) return "order";
  if (containsKeyword(text, BUY_KEYWORDS)) return "whereToBuy";
  if (containsKeyword(text, PRODUCT_KEYWORDS)) return "productQuestion";
  // Check for positive signals
  const positiveWords = ["love", "great", "amazing", "awesome", "best", "excellent", "perfect", "thank", "thanks", "fire"];
  if (containsKeyword(text, positiveWords)) return "positive";
  return "generic";
}

async function handleFacebookComment(comment) {
  const { id, message, from } = comment;
  const authorName = from?.name || "Unknown";

  if (!message) {
    console.log(`[Handler] FB comment ${id} has no text — skipping`);
    return;
  }

  console.log(`[Handler] FB comment from ${authorName}: "${message}"`);

  const intent = classifyComment(message);
  console.log(`[Handler] Classified as: ${intent}`);

  if (intent === "negative") {
    // Hide the comment and alert Mike
    await hideComment(id, "facebook");
    await notifyMike(
      `<b>Negative comment hidden on Facebook</b>\n\nAuthor: ${authorName}\nComment: "${message}"\nComment ID: ${id}\n\nPlease review and decide if further action is needed.`
    );
    console.log(`[Handler] Negative comment hidden and Mike alerted`);
    return;
  }

  if (intent === "order") {
    await replyToFacebookComment(id, AUTO_REPLIES.orderIssue);
    return;
  }

  if (intent === "whereToBuy") {
    await replyToFacebookComment(id, AUTO_REPLIES.whereToBuy);
    return;
  }

  if (intent === "productQuestion") {
    await replyToFacebookComment(id, AUTO_REPLIES.productQuestion);
    return;
  }

  if (intent === "positive") {
    await replyToFacebookComment(id, AUTO_REPLIES.positive);
    return;
  }

  // Generic — reply with default
  await replyToFacebookComment(id, AUTO_REPLIES.generic);
}

async function handleInstagramComment(commentData) {
  const { id, text, media_id, username } = commentData;
  const authorName = username || "Unknown";

  if (!text) {
    console.log(`[Handler] IG comment ${id} has no text — skipping`);
    return;
  }

  console.log(`[Handler] IG comment from @${authorName}: "${text}"`);

  const intent = classifyComment(text);
  console.log(`[Handler] Classified as: ${intent}`);

  if (intent === "negative") {
    await hideComment(id, "instagram");
    await notifyMike(
      `<b>Negative comment hidden on Instagram</b>\n\nAuthor: @${authorName}\nComment: "${text}"\nComment ID: ${id}\n\nPlease review and decide if further action is needed.`
    );
    console.log(`[Handler] Negative IG comment hidden and Mike alerted`);
    return;
  }

  if (intent === "order") {
    await replyToInstagramComment(media_id, id, AUTO_REPLIES.orderIssue);
    return;
  }

  if (intent === "whereToBuy") {
    await replyToInstagramComment(media_id, id, AUTO_REPLIES.whereToBuy);
    return;
  }

  if (intent === "productQuestion") {
    await replyToInstagramComment(media_id, id, AUTO_REPLIES.productQuestion);
    return;
  }

  if (intent === "positive") {
    await replyToInstagramComment(media_id, id, AUTO_REPLIES.positive);
    return;
  }

  await replyToInstagramComment(media_id, id, AUTO_REPLIES.generic);
}

module.exports = { handleFacebookComment, handleInstagramComment };
