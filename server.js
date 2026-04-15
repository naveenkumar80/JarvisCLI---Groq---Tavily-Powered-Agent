// server.js
import express from 'express';
import cors from 'cors';
import { getJarvisReply } from './app.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());           // allow frontend to call this API
app.use(express.json());   // parse JSON bodies

// Simple GET route to confirm server is running
app.get('/', (req, res) => {
  res.send('Jarvis backend is running. Use POST /chat');
});

// Main chat endpoint
app.post('/chat', async (req, res) => {
  const { message, history = [] } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    const reply = await getJarvisReply(message, history);
    res.json({ reply });
  } catch (error) {
    console.error('Error in /chat:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});