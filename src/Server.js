import express from 'express';
import bodyParser from 'body-parser';
import axios from 'axios';

const app = express();
app.use(bodyParser.json());

// 🔹 Your verify token (must match what you enter in FB setup)
const VERIFY_TOKEN = "my_secret_token_123"; 

const slackWebhookUrl = "https://hooks.slack.com/services/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";

// ✅ Step 1: Facebook verification endpoint
app.get('/social-webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log("✅ Webhook verified by Facebook");
    res.status(200).send(challenge); // Respond with challenge token
  } else {
    console.log("❌ Verification failed");
    res.sendStatus(403);
  }
});

// ✅ Step 2: Handle incoming messages/events
app.post('/social-webhook', async (req, res) => {
  const body = req.body;

  if (body.object === 'page') {
    body.entry.forEach(async (entry) => {
      const event = entry.messaging[0];
      const senderId = event.sender?.id;
      const messageText = event.message?.text || "No message content";

      const payload = {
        text: `📩 *New FB Messenger Message!*\n*From ID:* ${senderId}\n*Message:* ${messageText}`
      };

      try {
        await axios.post(slackWebhookUrl, payload);
        console.log('Slack notification sent');
      } catch (error) {
        console.error('Error sending Slack message:', error);
      }
    });

    res.sendStatus(200);
  } else {
    res.sendStatus(404);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Webhook listener running on port ${PORT}`));
