const {
  deleteComment,
  deleteInstagramComment,
  blockUser,
  replyToFacebookComment,
  replyToInstagramComment,
} = require("./meta");
const { notifyMike, notifyComments } = require("./telegram");
const { generateProductReply } = require("./aiReply");
const { sanitizeText, sanitizeName } = require("./sanitize");
const {
  BLOCK_KEYWORDS,
  DELETE_KEYWORDS,
} = require("./keywords");

// REPLY RULE: only reply to comments that contain a question mark
// Delete/block always active regardless

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

function isUserToUserConvo(text) {
  return /^@\S+/.test(text.trim()) || /^[A-Z][a-z]+ [A-Z][a-z]+[,\s]/.test(text.trim());
}

function isQuestion(text) {
  return text.includes("?");
}

async function handleFacebookComment(comment) {
  const { id, message, from } = comment;

  const safeMessage = sanitizeText(message);
  const authorName = sanitizeName(from?.name);
  const authorId = from?.id;

  if (!safeMessage) return;

  console.log(`[Handler] FB comment from ${authorName}: "${safeMessage}"`);

  if (containsKeyword(safeMessage, BLOCK_KEYWORDS)) {
    await deleteComment(id);
    if (authorId) await blockUser(authorId);
    await notifyComments(`<b>Comment DELETED + user BLOCKED on Facebook</b>\n\nAuthor: ${authorName} (ID: ${authorId})\nComment: "${safeMessage}"\n\nReason: Extremely damaging keyword.`);
    return;
  }

  if (containsKeyword(safeMessage, DELETE_KEYWORDS)) {
    await deleteComment(id);
    await notifyComments(`<b>Comment DELETED on Facebook</b>\n\nAuthor: ${authorName}\nComment: "${safeMessage}"\n\nReason: Negative/disappointed keyword.`);
    return;
  }

  // Only reply if comment contains a question
  if (isQuestion(safeMessage) && !isUserToUserConvo(safeMessage)) {
    const reply = await generateProductReply(safeMessage);
    await replyToFacebookComment(id, reply);
    return;
  }
}

async function handleInstagramComment(commentData) {
  const { id, text, media_id, username } = commentData;

  const safeText = sanitizeText(text);
  const authorName = sanitizeName(username);

  if (!safeText) return;

  console.log(`[Handler] IG comment from @${authorName}: "${safeText}"`);

  if (containsKeyword(safeText, BLOCK_KEYWORDS)) {
    await deleteInstagramComment(id);
    await notifyComments(`<b>Comment DELETED on Instagram</b>\n\nAuthor: @${authorName}\nComment: "${safeText}"\n\n⚠️ Please block this user manually on Instagram.`);
    return;
  }

  if (containsKeyword(safeText, DELETE_KEYWORDS)) {
    await deleteInstagramComment(id);
    await notifyComments(`<b>Comment DELETED on Instagram</b>\n\nAuthor: @${authorName}\nComment: "${safeText}"\n\nReason: Negative/disappointed keyword.`);
    return;
  }

  // Only reply if comment contains a question
  if (isQuestion(safeText) && !isUserToUserConvo(safeText)) {
    const reply = await generateProductReply(safeText);
    await replyToInstagramComment(media_id, id, reply);
    return;
  }
}

module.exports = { handleFacebookComment, handleInstagramComment };
