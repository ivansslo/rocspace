import { Router } from 'express';
import { GroqService } from '../services/groq.js';

const router = Router();

router.get('/models', (req, res) => {
  res.json({
    groq: GroqService.getModels(),
    gemini: ['gemini-1.5-flash', 'gemini-1.5-pro'],
    openrouter: ['claude-3.5-sonnet', 'gpt-4o'],
    cfai: ['@cf/meta/llama-3-3-70b-instruct-fastsynth']
  });
});

router.post('/chat', async (req, res) => {
  try {
    const { model, messages, stream = false } = req.body;
    
    if (!model || !messages) {
      return res.status(400).json({ error: 'model and messages required' });
    }
    
    if (model.startsWith('groq/')) {
      const result = await GroqService.chat(model.replace('groq/', ''), messages);
      res.json(result);
    } else {
      res.status(400).json({ error: 'Unsupported model provider' });
    }
  } catch (error) {
    console.error('[AI Chat Error]', error);
    res.status(500).json({ error: 'AI request failed' });
  }
});

export default router;
