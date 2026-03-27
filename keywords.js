// Words that trigger DELETE + block (extremely damaging to the business)
const BLOCK_KEYWORDS = [
  "scam", "fraud", "fake", "stolen", "steal", "ripped off", "rip off", "ripoff",
  "con artist", "con man", "thief", "thieves", "cheat", "cheater", "swindler",
  "do not buy", "dont buy", "don't buy", "stay away", "avoid this",
];

// Words that trigger DELETE only (no block)
const DELETE_KEYWORDS = [
  "garbage", "trash", "junk", "crap", "terrible", "horrible", "worst",
  "never again", "waste of money", "waste of time", "awful", "disgusting",
  "fucking", "fuck", "shit", "bitch", "bastard", "asshole", "wtf",
  "lost my package", "wrong order", "wrong item", "broken", "damaged",
  "never arrived", "didn't arrive", "still waiting",
  "googan", "6th sense", "kwigglers", "k wigglers", "xcite", "drave",
];

// Auto-reply templates keyed by comment intent
const AUTO_REPLIES = {
  whereToBuy: "You can grab them at amfishingtx.com — we ship fast and have the full lineup available online!",
  productQuestion: "Great question! Head over to amfishingtx.com or check our FAQ at amfishingtx.com/pages/frequently-asked-questions — lots of detail there on sizes, rigging, and techniques. If you still have questions shoot us an email at david@amfishingtx.com.",
  orderIssue: "Sorry to hear that! Shoot us an email at david@amfishingtx.com with your order number and we will get it sorted out right away.",
  positive: "Thanks so much — really appreciate the support! Tight lines!",
  generic: "Thanks for the comment! If you have any questions about our lures or need help with an order feel free to email us at david@amfishingtx.com.",
};

// Keywords that signal an order issue
const ORDER_KEYWORDS = [
  "order", "shipping", "delivery", "package", "tracking", "refund", "return",
  "exchange", "wrong", "missing", "not received",
];

// Keywords that signal a product/fishing question
const PRODUCT_KEYWORDS = [
  "color", "size", "weight", "hook", "rig", "rigging", "technique", "fish",
  "bass", "trout", "redfish", "flounder", "saltwater", "freshwater",
  "worm", "swimbait", "jighead", "jig", "texas rig", "carolina rig",
  "how to", "what size", "what color", "recommend", "suggestion",
];

// Keywords that signal purchase intent
const BUY_KEYWORDS = [
  "where can i buy", "where to buy", "how to order", "can i get", "purchase",
  "available", "in stock", "website", "link", "shop",
];

module.exports = {
  BLOCK_KEYWORDS,
  DELETE_KEYWORDS,
  AUTO_REPLIES,
  ORDER_KEYWORDS,
  PRODUCT_KEYWORDS,
  BUY_KEYWORDS,
};
