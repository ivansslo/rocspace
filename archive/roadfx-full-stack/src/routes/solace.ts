import { Router } from 'express';

const router = Router();

router.get('/status', (req, res) => {
  res.json({
    status: 'connected',
    broker: process.env.SOLACE_URL?.replace('https://', '') || 'not configured',
    timestamp: new Date().toISOString()
  });
});

router.get('/queues', (req, res) => {
  res.json({
    queues: [
      { name: 'roadfx/agent/orchestrator', type: 'exclusive', purpose: 'Task routing' },
      { name: 'roadfx/agent/ai-chat', type: 'exclusive', purpose: 'AI chat' },
      { name: 'roadfx/agent/tools', type: 'exclusive', purpose: 'Tools' },
      { name: 'roadfx/agent/memory', type: 'exclusive', purpose: 'Memory' },
      { name: 'roadfx/events', type: 'non-exclusive', purpose: 'Events' }
    ],
    count: 5
  });
});

router.post('/publish', async (req, res) => {
  const { topic, message } = req.body;
  res.json({ success: true, topic, timestamp: new Date().toISOString() });
});

router.post('/task', async (req, res) => {
  const { task_type, payload } = req.body;
  res.json({
    status: 'queued',
    requestId: crypto.randomUUID(),
    task_type,
    timestamp: new Date().toISOString()
  });
});

export default router;
