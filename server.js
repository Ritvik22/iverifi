require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const OpenAI = require('openai');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize OpenAI client
// Note: On Vercel, environment variables are automatically available
const openaiApiKey = process.env.OPENAI_API_KEY;
if (!openaiApiKey) {
  console.warn('WARNING: OPENAI_API_KEY not found in environment variables');
}

const openai = openaiApiKey ? new OpenAI({
  apiKey: openaiApiKey,
}) : null;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve index.html for root path (needed for Vercel SPA routing)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Safety Glasses Monitor API is running' });
});

// Safety glasses detection endpoint
app.post('/api/check-safety-glasses', async (req, res) => {
  const startTime = Date.now();
  console.log('Received safety glass check request');

  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'No image provided' });
    }

    if (!openai || !openaiApiKey) {
      console.error('OpenAI API key missing');
      return res.status(500).json({ 
        error: 'OpenAI API key not configured',
        message: 'Please set OPENAI_API_KEY in your Vercel environment variables'
      });
    }

    // Call OpenAI Vision API
    console.log('Sending request to OpenAI...');
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

    const duration = Date.now() - startTime;
    console.log(`OpenAI response received in ${duration}ms`);

    const result = response.choices[0].message.content.trim().toUpperCase();
    const isWearingGlasses = result === 'YES';

    res.json({
      success: true,
      wearingGlasses: isWearingGlasses,
      rawResponse: result,
      timestamp: new Date().toISOString(),
      duration: duration
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`Error checking safety glasses after ${duration}ms:`, error);
    res.status(500).json({
      error: 'Failed to check safety glasses',
      message: error.message,
    });
  }
});

// Error handling middleware (should be last)
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred'
  });
});

// Export the Express app for Vercel serverless functions
// @vercel/node will automatically wrap this as a serverless function
module.exports = app;

// Only start the server if running locally (not on Vercel)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Safety Glasses Monitor server running on http://localhost:${PORT}`);
    console.log('Make sure to set OPENAI_API_KEY in your .env file');
  });
}

