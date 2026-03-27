// Words that trigger DELETE + block (extremely damaging)
const BLOCK_KEYWORDS = [
  "scam", "fraud", "fake", "stolen", "steal", "ripped off", "rip off", "ripoff",
  "con artist", "con man", "thief", "thieves", "cheat", "cheater", "swindler",
  "do not buy", "dont buy", "don't buy", "stay away", "avoid this", "avoid them",
  "report", "reported", "file a claim", "dispute", "chargeback",
];

// Words that trigger DELETE (negative, critical, or even slightly negative/disappointed)
const DELETE_KEYWORDS = [
  // Strong negatives
  "garbage", "trash", "junk", "crap ", "terrible", "horrible", "worst", "awful", "disgusting",
  "never again", "waste of money", "waste of time",
  // Mild negatives and disappointment
  "disappointed", "disappointing", "not worth", "not good", "bad quality", "poor quality",
  "overpriced", "too expensive", "cheap", "broke", "breaks", "falling apart",
  "slow shipping", "late", "haven't received", "never got", "still waiting",
  "wrong", "missing", "damaged", "broken", "defective",
  "not happy", "unhappy", "frustrated", "annoyed", "upset",
  "expected better", "not what i expected", "not as advertised",
  "don't recommend", "dont recommend", "would not recommend", "wouldn't recommend",
  "waste", "regret", "regrets", "mistake",
  "not impressed", "unimpressed", "fell short", "let down", "letdown",
  "meh", "mediocre", "average", "nothing special", "not great",
  "kinda bad", "pretty bad", "not the best", "could be better",
  "didn't work", "doesn't work", "not working", "stopped working",
  "fell off", "came apart", "poor", "subpar",
  // Competitor mentions
  "googan", "6th sense", "kwigglers", "k wigglers", "xcite", "drave",
  // Profanity
  "fuck", "shit", "bitch", "bastard", "asshole", "wtf", "stfu", "dumb", "idiot", "stupid",
];

const ORDER_KEYWORDS = [
  "order", "shipping", "delivery", "package", "tracking", "refund", "return",
  "exchange", "not received",
];

const PRODUCT_KEYWORDS = [
  "color", "colour", "size", "weight", "hook", "rig", "rigging", "technique",
  "bass", "trout", "redfish", "flounder", "saltwater", "freshwater", "inshore",
  "worm", "swimbait", "jighead", "jig", "texas rig", "carolina rig",
  "how to", "what size", "what color", "recommend", "suggestion", "which one",
  "difference between", "work well", "good for", "use for", "try with",
];

const BUY_KEYWORDS = [
  "where can i buy", "where to buy", "how to order", "can i get", "purchase",
  "available", "in stock", "website", "link", "shop", "find these",
];

module.exports = { BLOCK_KEYWORDS, DELETE_KEYWORDS, ORDER_KEYWORDS, PRODUCT_KEYWORDS, BUY_KEYWORDS };
