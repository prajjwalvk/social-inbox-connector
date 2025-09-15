import express from 'express';
import bodyParser from 'body-parser';
import axios from 'axios';

const app = express();
app.use(bodyParser.json());

const VERIFY_TOKEN = process.env.VERIFY_TOKEN || 'my_secret_token_social123';
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL || 'https://hooks.slack.com/services/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';
const PORT = process.env.PORT || 3000;

// Simple GET route
app.get('/', (req, res) => {
  res.send('Webhook server is running!');
});

// Facebook webhook verification
app.get('/social-webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token === VERIFY_TOKEN) {
    console.log('Webhook verified!');
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// Handle incoming messages
app.post('/social-webhook', async (req, res) => {
  const body = req.body;

  if (body.object === 'page') {
    body.entry.forEach(async entry => {
      if (entry.messaging) {
        entry.messaging.forEach(async event => {
          if (event.message && !event.message.is_echo) {
            const userMessage = event.message.text || '[Non-text message]';
            console.log('📩 New message from user:', userMessage);

            // Send to Slack
            try {
              const slackRes = await axios.post(SLACK_WEBHOOK_URL, { text: `New FB message: ${userMessage}` });
              console.log('✅ Message sent to Slack:', slackRes.data);
            } catch (err) {
              console.error('❌ Error sending to Slack:', err.response ? err.response.data : err.message);
            }
          }
        });
      }
    });

    res.status(200).send('EVENT_RECEIVED');
  } else {
    res.sendStatus(404);
  }
});

app.listen(PORT, () => console.log(`Webhook listener running on port ${PORT}`));
