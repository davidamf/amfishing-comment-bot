const axios = require("axios");

const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
const MODEL = "claude-haiku-4-5"; // fast + cheap for comment replies

// Writing style extracted from A.M. Fishing blog
const STYLE_GUIDE = `
You write in the voice of A.M. Fishing — a small Texas-based fishing lure brand run by a hands-on fisherman.

Writing rules (STRICT):
- Conversational, plain, direct — like you're talking to a buddy at a tackle shop
- Short sentences. No fluff.
- No em dashes, no hyphens used as dashes
- No emojis
- No commas in the body except after an opening greeting if one is used
- Don't start with "Hey" or any greeting — just answer the question directly
- Max 3 sentences total
- Sound genuine not corporate
- If recommending lures mention garlic scent or UV/glow only if relevant to the question
- Never make up specs or facts — only use what you know from the website
`;

// Scraped FAQ + blog knowledge (static snapshot — good enough for replies)
const PRODUCT_KNOWLEDGE = `
A.M. Fishing lures are soft plastic lures made in Texas.
Sizes: 3 inch, 4 inch, 5.5 inch, 7 inch.
All lures are infused with potent garlic scent that lasts the life of the lure — it covers up human scents like sunscreen and bug spray and makes fish hold on longer after striking.
UV/glow colors: the fluorescent colorants reflect UV light which fish can see underwater even in murky or deep water. This makes the lures visible when other colors aren't.
Colors work differently underwater — UV light penetrates deeper than visible light so UV/glow colors give you an edge especially in stained water or deeper depths.
For bass in freshwater: Texas rig or Carolina rig work great. Jighead works well for finesse situations.
For saltwater inshore species (redfish, flounder, trout): jighead is the most common setup. 3/8 oz for shallow, heavier for current or depth.
Rigging options: Texas rig (weedless), Carolina rig (bottom), jighead (direct), wacky rig (for finesse bass).
Recommended hook size depends on lure size — use a 3/0 for the 4 inch, 4/0 or 5/0 for the 5.5 inch.
Free shipping on US orders over $69.
Contact: david@amfishingtx.com
Website: amfishingtx.com
FAQ: amfishingtx.com/pages/frequently-asked-questions
`;

async function generateProductReply(comment) {
  if (!ANTHROPIC_KEY) {
    return "Great question! You can find all the details on our lures at amfishingtx.com or email us at david@amfishingtx.com and we will get you sorted out.";
  }

  try {
    const response = await axios.post(
      "https://api.anthropic.com/v1/messages",
      {
        model: MODEL,
        max_tokens: 120,
        messages: [
          {
            role: "user",
            content: `${STYLE_GUIDE}\n\nProduct/brand knowledge:\n${PRODUCT_KNOWLEDGE}\n\nSomeone left this comment on one of our Facebook/Instagram posts:\n"${comment}"\n\nWrite a short genuine reply using ONLY the product knowledge above. If the question can't be answered from the knowledge provided just point them to the website or email. Do not make anything up.`
          }
        ]
      },
      {
        headers: {
          "x-api-key": ANTHROPIC_KEY,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json"
        }
      }
    );
    return response.data.content[0].text.trim();
  } catch (err) {
    console.error("[AI] Reply generation failed:", err.response?.data || err.message);
    return "Great question! Head over to amfishingtx.com or shoot us an email at david@amfishingtx.com and we will get you the details.";
  }
}

async function generatePositiveReply(comment) {
  if (!ANTHROPIC_KEY) {
    return "Thanks so much — really appreciate you sharing that. Tight lines!";
  }

  try {
    const response = await axios.post(
      "https://api.anthropic.com/v1/messages",
      {
        model: MODEL,
        max_tokens: 80,
        messages: [
          {
            role: "user",
            content: `${STYLE_GUIDE}\n\nSomeone left this positive comment on one of our Facebook/Instagram posts:\n"${comment}"\n\nWrite a warm but short genuine reply. Acknowledge what they said specifically if possible. Sound like a real person not a brand. Max 2 sentences. No greeting.`
          }
        ]
      },
      {
        headers: {
          "x-api-key": ANTHROPIC_KEY,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json"
        }
      }
    );
    return response.data.content[0].text.trim();
  } catch (err) {
    console.error("[AI] Positive reply failed:", err.response?.data || err.message);
    return "That means a lot — really appreciate you sharing that. Tight lines!";
  }
}

module.exports = { generateProductReply, generatePositiveReply };
