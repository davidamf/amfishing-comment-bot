require("dotenv").config();
const express = require("express");
const rateLimit = require("express-rate-limit");
const { handleFacebookComment, handleInstagramComment } = require("./commentHandler");

const app = express();
app.use(express.json({ limit: "10kb" })); // #3 sanitize: reject oversized payloads

const VERIFY_TOKEN = process.env.WEBHOOK_VERIFY_TOKEN || "amfishing_webhook_secret_2024";
const PORT = process.env.PORT || 3000;

// #2 Rate limiting: max 60 requests per minute per IP
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests" },
});
app.use(limiter);

// Webhook verification (GET)
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  // #3 Sanitize: validate token is a plain string, no injection
  if (
    mode === "subscribe" &&
    typeof token === "string" &&
    token === VERIFY_TOKEN
  ) {
    console.log("[Webhook] Verified");
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// Webhook event receiver (POST)
app.post("/webhook", async (req, res) => {
  const body = req.body;
  res.sendStatus(200); // Acknowledge immediately

  // #3 Sanitize: basic structure check before processing
  if (!body || typeof body !== "object") return;

  if (body.object === "page") {
    for (const entry of body.entry || []) {
      for (const change of entry.changes || []) {
        if (
          change.field === "feed" &&
          change.value?.item === "comment" &&
          change.value?.verb === "add"
        ) {
          // #3 Sanitize: truncate comment text to 2000 chars max
          const message = typeof change.value.message === "string"
            ? change.value.message.slice(0, 2000)
            : "";

          await handleFacebookComment({
            id: change.value.comment_id,
            message,
            from: {
              name: change.value.from?.name,
              id: change.value.from?.id,
            },
          }).catch((err) => console.error("[Webhook] FB handler error:", err));
        }
      }
    }
  } else if (body.object === "instagram") {
    for (const entry of body.entry || []) {
      for (const change of entry.changes || []) {
        if (change.field === "comments") {
          // #3 Sanitize: truncate comment text
          const text = typeof change.value.text === "string"
            ? change.value.text.slice(0, 2000)
            : "";

          await handleInstagramComment({
            id: change.value.id,
            text,
            media_id: change.value.media?.id,
            username: change.value.from?.username,
          }).catch((err) => console.error("[Webhook] IG handler error:", err));
        }
      }
    }
  }
});

// Health check
app.get("/", (req, res) => res.send("A.M. Fishing comment bot is running"));

app.listen(PORT, () => {
  console.log(`[Server] Listening on port ${PORT}`);
});
