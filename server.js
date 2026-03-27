require("dotenv").config();
const express = require("express");
const { handleFacebookComment, handleInstagramComment } = require("./commentHandler");

const app = express();
app.use(express.json());

const VERIFY_TOKEN = process.env.WEBHOOK_VERIFY_TOKEN || "amfishing_webhook_secret_2024";
const PORT = process.env.PORT || 3000;

// Webhook verification (GET) — Meta calls this when you register the webhook
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("[Webhook] Verified successfully");
    res.status(200).send(challenge);
  } else {
    console.warn("[Webhook] Verification failed — token mismatch");
    res.sendStatus(403);
  }
});

// Webhook event receiver (POST) — Meta sends comment events here
app.post("/webhook", async (req, res) => {
  const body = req.body;

  // Acknowledge immediately — Meta requires a 200 within 5 seconds
  res.sendStatus(200);

  if (body.object === "page") {
    // Facebook Page events
    for (const entry of body.entry || []) {
      for (const change of entry.changes || []) {
        if (change.field === "feed") {
          const value = change.value;

          // New comment on a post
          if (value.item === "comment" && value.verb === "add") {
            console.log("[Webhook] New FB comment received");
            await handleFacebookComment({
              id: value.comment_id,
              message: value.message,
              from: { name: value.from?.name, id: value.from?.id },
            }).catch((err) => console.error("[Webhook] FB handler error:", err));
          }
        }
      }
    }
  } else if (body.object === "instagram") {
    // Instagram events
    for (const entry of body.entry || []) {
      // Comments via webhook
      for (const change of entry.changes || []) {
        if (change.field === "comments") {
          const value = change.value;
          console.log("[Webhook] New IG comment received");
          await handleInstagramComment({
            id: value.id,
            text: value.text,
            media_id: value.media?.id,
            username: value.from?.username,
          }).catch((err) => console.error("[Webhook] IG handler error:", err));
        }

        if (change.field === "mentions") {
          const value = change.value;
          console.log("[Webhook] IG mention received — media_id:", value.media_id);
          // Mentions require a separate API call to get comment text
          // For now just log — can expand later
        }
      }
    }
  }
});

// Health check
app.get("/", (req, res) => res.send("A.M. Fishing comment bot is running"));

app.listen(PORT, () => {
  console.log(`[Server] Listening on port ${PORT}`);
  console.log(`[Server] Webhook endpoint: /webhook`);
});
