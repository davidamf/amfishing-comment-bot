const {
  deleteComment,
  deleteInstagramComment,
  blockUser,
  replyToFacebookComment,
  replyToInstagramComment,
} = require("./meta");
const { notifyMike } = require("./telegram");
const { generateProductReply, generatePositiveReply } = require("./aiReply");
const {
  BLOCK_KEYWORDS,
  DELETE_KEYWORDS,
  ORDER_KEYWORDS,
  PRODUCT_KEYWORDS,
  BUY_KEYWORDS,
} = require("./keywords");

function containsKeyword(text, keywords) {
  const lower = text.toLowerCase();
  return keywords.some((kw) => lower.includes(kw.toLowerCase()));
}

function sentenceCount(text) {
  // Split on . ! ? — rough but good enough
  return (text.match(/[.!?]+/g) || []).length;
}

// Returns: "block" | "delete" | "order" | "whereToBuy" | "productOrGeneral" | "positive" | "skip"
function classifyComment(text) {
  if (containsKeyword(text, BLOCK_KEYWORDS)) return "block";
  if (containsKeyword(text, DELETE_KEYWORDS)) return "delete";
  if (containsKeyword(text, ORDER_KEYWORDS)) return "order";
  if (containsKeyword(text, BUY_KEYWORDS)) return "whereToBuy";
  if (containsKeyword(text, PRODUCT_KEYWORDS)) return "productOrGeneral";

  const positiveWords = [
    "love", "great", "amazing", "awesome", "best", "excellent", "perfect",
    "thank", "thanks", "fire", "sick", "goat", "caught", "limit", "slam",
    "works", "working", "crushed", "killed it", "slaying", "on fire"
  ];
  if (containsKeyword(text, positiveWords)) {
    // Only reply if 3+ sentences (genuine longer testimonial)
    return sentenceCount(text) >= 3 ? "positive" : "skip";
  }

  // Any other comment with a question mark = treat as general question
  if (text.includes("?")) return "productOrGeneral";

  return "skip";
}

async function handleFacebookComment(comment) {
  const { id, message, from } = comment;
  const authorName = from?.name || "Unknown";
  const authorId = from?.id;

  if (!message) return;

  console.log(`[Handler] FB comment from ${authorName}: "${message}"`);
  const intent = classifyComment(message);
  console.log(`[Handler] Intent: ${intent}`);

  if (intent === "block") {
    await deleteComment(id);
    if (authorId) await blockUser(authorId);
    await notifyMike(`<b>Comment DELETED + user BLOCKED on Facebook</b>\n\nAuthor: ${authorName} (ID: ${authorId})\nComment: "${message}"\n\nReason: Extremely damaging keyword.`);
    return;
  }

  if (intent === "delete") {
    await deleteComment(id);
    await notifyMike(`<b>Comment DELETED on Facebook</b>\n\nAuthor: ${authorName}\nComment: "${message}"\n\nReason: Negative/disappointed keyword.`);
    return;
  }

  if (intent === "order") {
    await replyToFacebookComment(id, "Shoot us an email at david@amfishingtx.com with your order number and we will get it taken care of right away.");
    return;
  }

  if (intent === "whereToBuy") {
    await replyToFacebookComment(id, "You can grab them at amfishingtx.com — we ship fast and have the full lineup available!");
    return;
  }

  if (intent === "productOrGeneral") {
    const reply = await generateProductReply(message);
    await replyToFacebookComment(id, reply);
    return;
  }

  if (intent === "positive") {
    const reply = await generatePositiveReply(message);
    await replyToFacebookComment(id, reply);
    return;
  }

  // "skip" — no action
}

async function handleInstagramComment(commentData) {
  const { id, text, media_id, username } = commentData;
  const authorName = username || "Unknown";

  if (!text) return;

  console.log(`[Handler] IG comment from @${authorName}: "${text}"`);
  const intent = classifyComment(text);
  console.log(`[Handler] Intent: ${intent}`);

  if (intent === "block") {
    await deleteInstagramComment(id);
    await notifyMike(`<b>Comment DELETED on Instagram</b>\n\nAuthor: @${authorName}\nComment: "${text}"\n\n⚠️ Please block this user manually on Instagram.`);
    return;
  }

  if (intent === "delete") {
    await deleteInstagramComment(id);
    await notifyMike(`<b>Comment DELETED on Instagram</b>\n\nAuthor: @${authorName}\nComment: "${text}"\n\nReason: Negative/disappointed keyword.`);
    return;
  }

  if (intent === "order") {
    await replyToInstagramComment(media_id, id, "Shoot us an email at david@amfishingtx.com with your order number and we will get it taken care of right away.");
    return;
  }

  if (intent === "whereToBuy") {
    await replyToInstagramComment(media_id, id, "You can grab them at amfishingtx.com — we ship fast and have the full lineup available!");
    return;
  }

  if (intent === "productOrGeneral") {
    const reply = await generateProductReply(text);
    await replyToInstagramComment(media_id, id, reply);
    return;
  }

  if (intent === "positive") {
    const reply = await generatePositiveReply(text);
    await replyToInstagramComment(media_id, id, reply);
    return;
  }
}

module.exports = { handleFacebookComment, handleInstagramComment };
