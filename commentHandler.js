const {
  deleteComment,
  deleteInstagramComment,
  blockUser,
  replyToFacebookComment,
  replyToInstagramComment,
} = require("./meta");
const { notifyMike } = require("./telegram");
const {
  BLOCK_KEYWORDS,
  DELETE_KEYWORDS,
  AUTO_REPLIES,
  ORDER_KEYWORDS,
  PRODUCT_KEYWORDS,
  BUY_KEYWORDS,
} = require("./keywords");

function containsKeyword(text, keywords) {
  const lower = text.toLowerCase();
  return keywords.some((kw) => lower.includes(kw.toLowerCase()));
}

// Returns: "block" | "delete" | "order" | "whereToBuy" | "productQuestion" | "positive" | "generic"
function classifyComment(text) {
  if (containsKeyword(text, BLOCK_KEYWORDS)) return "block";
  if (containsKeyword(text, DELETE_KEYWORDS)) return "delete";
  if (containsKeyword(text, ORDER_KEYWORDS)) return "order";
  if (containsKeyword(text, BUY_KEYWORDS)) return "whereToBuy";
  if (containsKeyword(text, PRODUCT_KEYWORDS)) return "productQuestion";
  const positiveWords = ["love", "great", "amazing", "awesome", "best", "excellent", "perfect", "thank", "thanks", "fire", "sick", "goat"];
  if (containsKeyword(text, positiveWords)) return "positive";
  return "generic";
}

async function handleFacebookComment(comment) {
  const { id, message, from } = comment;
  const authorName = from?.name || "Unknown";
  const authorId = from?.id;

  if (!message) return;

  console.log(`[Handler] FB comment from ${authorName}: "${message}"`);
  const intent = classifyComment(message);
  console.log(`[Handler] Classified as: ${intent}`);

  if (intent === "block") {
    await deleteComment(id);
    if (authorId) await blockUser(authorId);
    await notifyMike(
      `<b>Comment DELETED + user BLOCKED on Facebook</b>\n\nAuthor: ${authorName} (ID: ${authorId})\nComment: "${message}"\n\nReason: Extremely damaging keyword detected.`
    );
    return;
  }

  if (intent === "delete") {
    await deleteComment(id);
    await notifyMike(
      `<b>Comment DELETED on Facebook</b>\n\nAuthor: ${authorName}\nComment: "${message}"\n\nReason: Negative keyword detected.`
    );
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

  await replyToFacebookComment(id, AUTO_REPLIES.generic);
}

async function handleInstagramComment(commentData) {
  const { id, text, media_id, username, userId } = commentData;
  const authorName = username || "Unknown";

  if (!text) return;

  console.log(`[Handler] IG comment from @${authorName}: "${text}"`);
  const intent = classifyComment(text);
  console.log(`[Handler] Classified as: ${intent}`);

  if (intent === "block") {
    await deleteInstagramComment(id);
    // Instagram doesn't have a block endpoint via Graph API — alert Mike to block manually
    await notifyMike(
      `<b>Comment DELETED on Instagram</b>\n\nAuthor: @${authorName}\nComment: "${text}"\n\n⚠️ Please block this user manually on Instagram — the API does not support automated blocking.`
    );
    return;
  }

  if (intent === "delete") {
    await deleteInstagramComment(id);
    await notifyMike(
      `<b>Comment DELETED on Instagram</b>\n\nAuthor: @${authorName}\nComment: "${text}"\n\nReason: Negative keyword detected.`
    );
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
