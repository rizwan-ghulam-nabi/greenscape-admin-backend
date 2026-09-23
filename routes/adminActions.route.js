// backend/routes/adminActions.route.js
import express from 'express';
import adminAuth from '../middleware/adminAuth.js';   // ✅ YOUR middleware
import { createRateLimit } from '../middleware/rateLimit.js';
import {
  dispatchAdminAction,
  getAuditLogs,
  getAuditLog,
} from '../controllers/adminActions.controller.js';

const router = express.Router();

// Rate limit: 100 actions per minute per admin
const actionLimiter = createRateLimit({
  windowMs: 60 * 1000,
  max: 100,
  keyPrefix: 'action',
});

router.use(adminAuth);

// POST /api/admin/actions/dispatch
router.post('/dispatch', actionLimiter, dispatchAdminAction);

// GET /api/admin/actions/logs
router.get('/logs', getAuditLogs);

// GET /api/admin/actions/logs/:id
router.get('/logs/:id', getAuditLog);

export default router;