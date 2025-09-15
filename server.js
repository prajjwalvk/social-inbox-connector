import express from 'express';
import bodyParser from 'body-parser';
import axios from 'axios';

const app = express();
app.use(bodyParser.json());

const VERIFY_TOKEN = process.env.VERIFY_TOKEN || 'my_secret_token_social123';
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL || 'https://hooks.slack.com/services/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';
const PORT = process.env.PORT || 3000;

// Enhanced logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Simple GET route
app.get('/', (req, res) => {
  res.send('Webhook server is running!');
});

// Facebook webhook verification
app.get('/social-webhook', (req, res) => {
  console.log('Verification request received:', req.query);
  
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token === VERIFY_TOKEN) {
    console.log('Webhook verified successfully!');
    res.status(200).send(challenge);
  } else {
    console.log('Verification failed. Mode:', mode, 'Token match:', token === VERIFY_TOKEN);
    res.sendStatus(403);
  }
});

// Handle incoming messages
app.post('/social-webhook', async (req, res) => {
  console.log('Webhook payload received:', JSON.stringify(req.body, null, 2));
  
  const body = req.body;

  if (body.object === 'page') {
    // Immediately respond to Facebook to avoid retries
    res.status(200).send('EVENT_RECEIVED');
    
    // Process entries asynchronously
    for (const entry of body.entry) {
      if (entry.messaging) {
        for (const event of entry.messaging) {
          if (event.message && !event.message.is_echo) {
            const senderId = event.sender.id;
            const userMessage = event.message.text || '[Non-text message]';
            console.log('📩 New message from user:', userMessage, 'Sender ID:', senderId);

            // Send to Slack
            try {
              const slackRes = await axios.post(SLACK_WEBHOOK_URL, { 
                text: `New FB message from ${senderId}: ${userMessage}` 
              });
              console.log('✅ Message sent to Slack:', slackRes.status);
            } catch (err) {
              console.error('❌ Error sending to Slack:', err.response ? err.response.data : err.message);
            }
          }
        }
      }
    }
  } else {
    res.sendStatus(404);
  }
});

app.listen(PORT, () => console.log(`Webhook listener running on port ${PORT}`));