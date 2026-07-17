import { Router } from 'express';

const router = Router();

router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    version: '1.0.0',
    name: 'ROADFX Full Stack',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      groq: !!process.env.GROQ_KEY,
      gemini: !!process.env.GEMINI_KEY,
      openrouter: !!process.env.OR_KEY,
      solace: !!process.env.SOLACE_URL
    }
  });
});

router.get('/status', (req, res) => {
  res.json({ server: 'healthy', timestamp: new Date().toISOString() });
});

export default router;
