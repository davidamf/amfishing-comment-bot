const {
  deleteComment,
  deleteInstagramComment,
  blockUser,
  replyToFacebookComment,
  replyToInstagramComment,
} = require("./meta");
const { notifyMike, notifyComments } = require("./telegram");
const { generateProductReply, generatePositiveReply } = require("./aiReply");
const { sanitizeText, sanitizeName } = require("./sanitize");
const {
  BLOCK_KEYWORDS,
  DELETE_KEYWORDS,
  ORDER_KEYWORDS,
  PRODUCT_KEYWORDS,
  BUY_KEYWORDS,
} = require("./keywords");

// REPLIES PAUSED — delete/block still active

function containsKeyword(text, keywords) {
  const lower = text.toLowerCase();
  return keywords.some((kw) => {
    const kwLower = kw.toLowerCase();
    const idx = lower.indexOf(kwLower);
    if (idx === -1) return false;
    const before = idx === 0 || /\W/.test(lower[idx - 1]);
    const after = idx + kwLower.length >= lower.length || /\W/.test(lower[idx + kwLower.length]);
    return before && after;
  });
}

function sentenceCount(text) {
  return (text.match(/[.!?]+/g) || []).length;
}

function isUserToUserConvo(text) {
  return /^@\S+/.test(text.trim()) || /^[A-Z][a-z]+ [A-Z][a-z]+[,\s]/.test(text.trim());
}

function classifyComment(text) {
  if (containsKeyword(text, BLOCK_KEYWORDS)) return "block";
  if (containsKeyword(text, DELETE_KEYWORDS)) return "delete";
  if (isUserToUserConvo(text)) return "skip";
  if (containsKeyword(text, ORDER_KEYWORDS)) return "order";
  if (containsKeyword(text, BUY_KEYWORDS)) return "whereToBuy";
  if (containsKeyword(text, PRODUCT_KEYWORDS)) return "productOrGeneral";

  const positiveWords = [
    "love", "great", "amazing", "awesome", "best", "excellent", "perfect",
    "thank", "thanks", "fire", "sick", "goat", "caught", "limit", "slam",
    "works", "working", "crushed", "killed it", "slaying", "on fire",
  ];
  if (containsKeyword(text, positiveWords)) {
    return sentenceCount(text) >= 3 ? "positive" : "skip";
  }

  if (text.includes("?")) return "productOrGeneral";
  return "skip";
}

async function handleFacebookComment(comment) {
  const { id, message, from } = comment;

  const safeMessage = sanitizeText(message);
  const authorName = sanitizeName(from?.name);
  const authorId = from?.id;

  if (!safeMessage) return;

  console.log(`[Handler] FB comment from ${authorName}: "${safeMessage}"`);
  const intent = classifyComment(safeMessage);
  console.log(`[Handler] Intent: ${intent}`);

  if (intent === "block") {
    await deleteComment(id);
    if (authorId) await blockUser(authorId);
    await notifyComments(`<b>Comment DELETED + user BLOCKED on Facebook</b>\n\nAuthor: ${authorName} (ID: ${authorId})\nComment: "${safeMessage}"\n\nReason: Extremely damaging keyword.`);
    return;
  }

  if (intent === "delete") {
    await deleteComment(id);
    await notifyComments(`<b>Comment DELETED on Facebook</b>\n\nAuthor: ${authorName}\nComment: "${safeMessage}"\n\nReason: Negative/disappointed keyword.`);
    return;
  }

  // REPLIES PAUSED — order, whereToBuy, productOrGeneral, positive all skipped
  // if (intent === "order") { ... }
  // if (intent === "whereToBuy") { ... }
  // if (intent === "productOrGeneral") { ... }
  // if (intent === "positive") { ... }
}

async function handleInstagramComment(commentData) {
  const { id, text, media_id, username } = commentData;

  const safeText = sanitizeText(text);
  const authorName = sanitizeName(username);

  if (!safeText) return;

  console.log(`[Handler] IG comment from @${authorName}: "${safeText}"`);
  const intent = classifyComment(safeText);
  console.log(`[Handler] Intent: ${intent}`);

  if (intent === "block") {
    await deleteInstagramComment(id);
    await notifyComments(`<b>Comment DELETED on Instagram</b>\n\nAuthor: @${authorName}\nComment: "${safeText}"\n\n⚠️ Please block this user manually on Instagram.`);
    return;
  }

  if (intent === "delete") {
    await deleteInstagramComment(id);
    await notifyComments(`<b>Comment DELETED on Instagram</b>\n\nAuthor: @${authorName}\nComment: "${safeText}"\n\nReason: Negative/disappointed keyword.`);
    return;
  }

  // REPLIES PAUSED — order, whereToBuy, productOrGeneral, positive all skipped
  // if (intent === "order") { ... }
  // if (intent === "whereToBuy") { ... }
  // if (intent === "productOrGeneral") { ... }
  // if (intent === "positive") { ... }
}

module.exports = { handleFacebookComment, handleInstagramComment };
