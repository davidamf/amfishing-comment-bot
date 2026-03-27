require("dotenv").config();
const express = require("express");
const { handleFacebookComment, handleInstagramComment } = require("./commentHandler");
const { runFullScan } = require("./scanner");

const app = express();
app.use(express.json());

const VERIFY_TOKEN = process.env.WEBHOOK_VERIFY_TOKEN || "amfishing_webhook_secret_2024";
const PORT = process.env.PORT || 3000;

// Webhook verification (GET)
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];
  if (mode === "subscribe" && token === VERIFY_TOKEN) {
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

  if (body.object === "page") {
    for (const entry of body.entry || []) {
      for (const change of entry.changes || []) {
        if (change.field === "feed" && change.value?.item === "comment" && change.value?.verb === "add") {
          await handleFacebookComment({
            id: change.value.comment_id,
            message: change.value.message,
            from: { name: change.value.from?.name, id: change.value.from?.id }
          }).catch(err => console.error("[Webhook] FB handler error:", err));
        }
      }
    }
  } else if (body.object === "instagram") {
    for (const entry of body.entry || []) {
      for (const change of entry.changes || []) {
        if (change.field === "comments") {
          await handleInstagramComment({
            id: change.value.id,
            text: change.value.text,
            media_id: change.value.media?.id,
            username: change.value.from?.username
          }).catch(err => console.error("[Webhook] IG handler error:", err));
        }
      }
    }
  }
});

// Manual scan endpoint — called by heartbeat
app.post("/scan", async (req, res) => {
  // Simple auth check
  const auth = req.headers["x-scan-token"];
  if (auth !== process.env.WEBHOOK_VERIFY_TOKEN) {
    return res.sendStatus(401);
  }
  res.sendStatus(200); // Respond immediately, scan runs async
  runFullScan().catch(err => console.error("[Scan] Error:", err));
});

// Health check
app.get("/", (req, res) => res.send("A.M. Fishing comment bot is running"));

app.listen(PORT, () => {
  console.log(`[Server] Listening on port ${PORT}`);
});
