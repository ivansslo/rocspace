import { Router } from 'express';

const router = Router();

router.post('/zapier', (req, res) => {
  const { action, data, token } = req.body;
  res.json({
    success: true,
    action,
    result: 'Processed',
    timestamp: new Date().toISOString()
  });
});

router.post('/webhook', (req, res) => {
  const { event, payload } = req.body;
  res.json({
    received: true,
    event,
    timestamp: new Date().toISOString()
  });
});

export default router;
