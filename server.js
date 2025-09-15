import express from 'express';
import bodyParser from 'body-parser';
import axios from 'axios';

const app = express();
app.use(bodyParser.json());

const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

// ✅ Facebook webhook verification endpoint
app.get('/social-webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token === VERIFY_TOKEN) {
    console.log("Webhook verified!");
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// ✅ Handle incoming messages
app.post('/social-webhook', async (req, res) => {
  const messageData = req.body;

  const senderName = messageData.sender?.name || 'Unknown';
  const platform = messageData.platform || 'Facebook/Instagram';
  const messageText = messageData.message || 'No message content';

  const payload = {
    text: `📩 *New Social Inbox Message!*\n*Platform:* ${platform}\n*From:* ${senderName}\n*Message:* ${messageText}`
  };

  try {
    await axios.post(slackWebhookUrl, payload);
    console.log('Slack notification sent');
    res.status(200).send('Received');
  } catch (error) {
    console.error('Error sending Slack message:', error);
    res.status(500).send('Error');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Webhook listener running on port ${PORT}`));
