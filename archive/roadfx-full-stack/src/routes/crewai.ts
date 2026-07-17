import { Router } from 'express';

const router = Router();

router.get('/agents', (req, res) => {
  res.json({ agents: [], count: 0 });
});

router.post('/agents', (req, res) => {
  const { id, role, goal, backstory } = req.body;
  res.json({ success: true, agent: { id, role, goal, backstory } });
});

router.post('/execute', (req, res) => {
  res.json({
    status: 'executed',
    result: { output: 'Crew execution completed' },
    timestamp: new Date().toISOString()
  });
});

export default router;
