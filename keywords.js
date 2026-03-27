// Negative keywords — comments containing these get hidden and escalated to Mike
const NEGATIVE_KEYWORDS = [
  // Complaints / scam accusations
  "scam", "fraud", "fake", "rip off", "ripoff", "ripped off", "stolen", "steal",
  "garbage", "trash", "junk", "crap", "terrible", "horrible", "worst",
  "never again", "waste of money", "waste of time", "don't buy", "dont buy",
  "do not buy", "stay away", "avoid", "awful", "disgusting",
  // Shipping/order complaints
  "never arrived", "didn't arrive", "still waiting", "where is my order",
  "lost my package", "wrong order", "wrong item", "broken", "damaged",
  // Competitor attacks
  "googan", "6th sense", "kwigglers", "k wigglers", "xcite", "drave",
  // Profanity (basic)
  "fuck", "shit", "damn", "ass", "bitch", "bastard", "wtf",
];

// Auto-reply templates keyed by comment intent
// These are fallback replies — most comments get a short friendly reply
const AUTO_REPLIES = {
  // Someone asks where to buy
  whereToBuy: "You can grab them at amfishingtx.com — we ship fast and have the full lineup available online!",

  // Product question (generic)
  productQuestion: "Great question! Head over to amfishingtx.com or check our FAQ at amfishingtx.com/pages/frequently-asked-questions — lots of detail there on sizes, rigging, and techniques. If you still have questions shoot us an email at david@amfishingtx.com.",

  // Order issue — redirect to support
  orderIssue: "Sorry to hear that! Shoot us an email at david@amfishingtx.com with your order number and we will get it sorted out right away.",

  // Positive comment / compliment — short and genuine
  positive: "Thanks so much — really appreciate the support! Tight lines!",

  // Generic / unknown
  generic: "Thanks for the comment! If you have any questions about our lures or need help with an order feel free to email us at david@amfishingtx.com.",
};

// Keywords that signal an order issue (redirect to email)
const ORDER_KEYWORDS = [
  "order", "shipping", "delivery", "package", "tracking", "refund", "return",
  "exchange", "wrong", "missing", "damaged", "broken", "not received",
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
  NEGATIVE_KEYWORDS,
  AUTO_REPLIES,
  ORDER_KEYWORDS,
  PRODUCT_KEYWORDS,
  BUY_KEYWORDS,
};
