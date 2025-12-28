require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const OpenAI = require('openai');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Safety Glasses Monitor API is running' });
});

// Safety glasses detection endpoint
app.post('/api/check-safety-glasses', async (req, res) => {
  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'No image provided' });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: 'OpenAI API key not configured' });
    }

    // Call OpenAI Vision API
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Look at this image carefully. Check EVERY person visible in the frame. Respond with ONLY "YES" if EVERY SINGLE person in the image is clearly wearing safety glasses or protective eyewear. Respond with "NO" if even one person is not wearing safety glasses, or if you cannot clearly see safety glasses on any person\'s face. Be very strict - if there are multiple people, ALL of them must be wearing safety glasses for you to respond YES.',
            },
            {
              type: 'image_url',
              image_url: {
                url: image,
              },
            },
          ],
        },
      ],
      max_tokens: 10,
    });

    const result = response.choices[0].message.content.trim().toUpperCase();
    const isWearingGlasses = result === 'YES';

    res.json({
      success: true,
      wearingGlasses: isWearingGlasses,
      rawResponse: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error checking safety glasses:', error);
    res.status(500).json({
      error: 'Failed to check safety glasses',
      message: error.message,
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Safety Glasses Monitor server running on http://localhost:${PORT}`);
  console.log('Make sure to set OPENAI_API_KEY in your .env file');
});

