const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.status(200).send('Katto Rating Proxy Service is online.');
});

app.post('/api/rating', async (req, res) => {
  const { post, rating, comment } = req.body;

  // Input validation
  if (!post || typeof rating !== 'number' || rating < 1 || rating > 5) {
    return res.status(400).json({
      error: 'Invalid payload. "post" (string) and "rating" (number between 1 and 5) are required.'
    });
  }

  if (!DISCORD_WEBHOOK_URL) {
    console.error('Error: DISCORD_WEBHOOK_URL environment variable is not defined.');
    return res.status(500).json({ error: 'Server misconfiguration.' });
  }

  const starVisual = '★'.repeat(rating) + '☆'.repeat(5 - rating);

  const discordPayload = {
    embeds: [
      {
        title: `★ New Rating for: ${post}`,
        color: 0x5865F2,
        fields: [
          {
            name: 'Score',
            value: `${starVisual} (${rating}/5)`,
            inline: true
          },
          {
            name: 'Comment',
            value: comment && comment.trim().length > 0 ? comment.trim() : '_No comment provided._'
          }
        ],
        footer: {
          text: 'Katto dot online • Stories Rating System'
        },
        timestamp: new Date().toISOString()
      }
    ]
  };

  try {
    const discordResponse = await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(discordPayload)
    });

    if (!discordResponse.ok) {
      const errorDetail = await discordResponse.text();
      console.error('Discord Webhook error status:', discordResponse.status, errorDetail);
      return res.status(500).json({ error: 'Failed to dispatch payload to Discord.' });
    }

    return res.status(200).json({ success: true, message: 'Rating dispatched successfully.' });
  } catch (error) {
    console.error('Internal server exception:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

app.listen(PORT, () => {
  console.log(`Rating proxy service is running on port ${PORT}`);
});
