// Words that trigger DELETE + block (extremely damaging)
const BLOCK_KEYWORDS = [
  "scam", "fraud", "fake", "stolen", "steal", "ripped off", "rip off", "ripoff",
  "con artist", "con man", "thief", "thieves", "cheat", "cheater", "swindler",
  "do not buy", "dont buy", "don't buy", "stay away", "avoid this", "avoid them",
  "report", "reported", "file a claim", "dispute", "chargeback",
];

// Words that trigger DELETE only (negative, critical, or even slightly negative)
const DELETE_KEYWORDS = [
  // Strong negatives
  "garbage", "trash", "junk", "crap", "terrible", "horrible", "worst", "awful", "disgusting",
  "never again", "waste of money", "waste of time",
  // Mild negatives / complaints
  "disappointed", "disappointing", "not worth", "not good", "bad quality", "poor quality",
  "overpriced", "too expensive", "cheap", "broke", "breaks", "falling apart",
  "slow shipping", "late", "haven't received", "never got", "still waiting",
  "wrong", "missing", "damaged", "broken", "defective",
  "not happy", "unhappy", "frustrated", "annoyed", "upset",
  "expected better", "not what i expected", "not as advertised",
  "don't recommend", "dont recommend", "would not recommend", "wouldn't recommend",
  "waste", "regret", "regrets", "mistake",
  // Competitor mentions
  "googan", "6th sense", "kwigglers", "k wigglers", "xcite", "drave",
  // Profanity
  "fuck", "shit", "bitch", "bastard", "asshole", "wtf", "stfu", "dumb", "idiot", "stupid",
];

// Auto-reply templates keyed by comment intent
const AUTO_REPLIES = {
  whereToBuy: "You can grab them at amfishingtx.com — we ship fast and have the full lineup available online!",
  productQuestion: "Great question! Head over to amfishingtx.com or check our FAQ at amfishingtx.com/pages/frequently-asked-questions — lots of detail there on sizes, rigging, and techniques. If you still have questions shoot us an email at david@amfishingtx.com.",
  orderIssue: "Sorry to hear that! Shoot us an email at david@amfishingtx.com with your order number and we will get it sorted out right away.",
  positive: "Thanks so much — really appreciate the support! Tight lines!",
  generic: "Thanks for the comment! If you have any questions about our lures or need help with an order feel free to email us at david@amfishingtx.com.",
};

const ORDER_KEYWORDS = [
  "order", "shipping", "delivery", "package", "tracking", "refund", "return",
  "exchange", "not received",
];

const PRODUCT_KEYWORDS = [
  "color", "size", "weight", "hook", "rig", "rigging", "technique", "fish",
  "bass", "trout", "redfish", "flounder", "saltwater", "freshwater",
  "worm", "swimbait", "jighead", "jig", "texas rig", "carolina rig",
  "how to", "what size", "what color", "recommend", "suggestion",
];

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
