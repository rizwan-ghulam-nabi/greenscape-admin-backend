// backend/routes/adminChat.route.js
import express from 'express';
import adminAuth from '../middleware/adminAuth.js';   // ✅ YOUR middleware
import { createRateLimit } from '../middleware/rateLimit.js';
import {
  sendMessage,
  getHistory,
  listSessions,
  clearSession,
} from '../controllers/adminChat.controller.js';

const router = express.Router();

// Rate limit: 30 messages per minute per admin
const chatLimiter = createRateLimit({
  windowMs: 60 * 1000,
  max: 30,
  keyPrefix: 'chat',
  message: 'Slow down! You can send 30 messages per minute.',
});

// ✅ All routes require admin auth
router.use(adminAuth);

// POST /api/admin/chat/message
router.post('/message', chatLimiter, sendMessage);

// GET /api/admin/chat/history/:sessionId
router.get('/history/:sessionId', getHistory);

// GET /api/admin/chat/sessions
router.get('/sessions', listSessions);

// DELETE /api/admin/chat/session/:sessionId
router.delete('/session/:sessionId', clearSession);

export default router;