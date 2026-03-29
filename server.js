require("dotenv").config();
const express = require("express");
const rateLimit = require("express-rate-limit");
const { handleFacebookComment, handleInstagramComment } = require("./commentHandler");

const app = express();
app.use(express.json({ limit: "10kb" }));

const VERIFY_TOKEN = process.env.WEBHOOK_VERIFY_TOKEN || "amfishing_webhook_secret_2024";
const PAGE_ID = process.env.PAGE_ID;
const INSTAGRAM_ACCOUNT_ID = process.env.INSTAGRAM_ACCOUNT_ID;
const PORT = process.env.PORT || 3000;

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

  if (!body || typeof body !== "object") return;

  if (body.object === "page") {
    for (const entry of body.entry || []) {
      for (const change of entry.changes || []) {
        if (
          change.field === "feed" &&
          change.value?.item === "comment" &&
          change.value?.verb === "add"
        ) {
          // Skip comments posted by our own Page (prevents reply loops)
          if (change.value.from?.id === PAGE_ID) {
            console.log("[Webhook] Skipping — comment from our own Page");
            continue;
          }

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
          // Skip comments posted by our own Instagram account (prevents reply loops)
          if (change.value.from?.id === INSTAGRAM_ACCOUNT_ID) {
            console.log("[Webhook] Skipping — comment from our own IG account");
            continue;
          }

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

// Manual scan trigger
const { runFullScan } = require("./scanner");
app.post("/scan", async (req, res) => {
  const token = req.headers["x-scan-token"];
  if (token !== VERIFY_TOKEN) return res.sendStatus(403);
  res.sendStatus(200);
  try {
    const result = await runFullScan();
    console.log("[Scan] Complete:", JSON.stringify(result));
  } catch (err) {
    console.error("[Scan] Error:", err.message);
  }
});

app.listen(PORT, () => {
  console.log(`[Server] Listening on port ${PORT}`);
});
