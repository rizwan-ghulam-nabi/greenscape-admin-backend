// backend/controllers/adminActions.controller.js
import AdminLog from '../models/AdminLog.js';

const N8N_ADMIN_WEBHOOK =
  process.env.N8N_ADMIN_WEBHOOK || 'http://localhost:5678/webhook/greenscape-admin';

// ==========================================
// ✅ DISPATCH ADMIN ACTION
// ==========================================
export const dispatchAdminAction = async (req, res) => {
  try {
    const { eventType, payload } = req.body;
    const adminId = req.admin._id;

    if (!eventType || !payload) {
      return res.status(400).json({
        success: false,
        error: 'eventType and payload are required',
      });
    }

    const allowed = ['product', 'order', 'customer', 'inventory', 'discount', 'review'];
    if (!allowed.includes(eventType)) {
      return res.status(400).json({
        success: false,
        error: `Invalid eventType. Must be one of: ${allowed.join(', ')}`,
      });
    }

    const requestId = 'REQ-' + Date.now() + '-' + Math.floor(Math.random() * 1000);

    // 1️⃣ Local audit log
    const log = await AdminLog.create({
      adminId,
      adminName: req.admin.name || '',
      adminEmail: req.admin.email || '',
      action: `${eventType}_action`,
      eventType,
      requestId,
      payload,
      status: 'pending',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] || '',
    });

    // 2️⃣ Forward to n8n
    let n8nResult = null;
    let n8nSuccess = false;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      const n8nRes = await fetch(N8N_ADMIN_WEBHOOK, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Request-ID': requestId,
          'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN,
        },
        body: JSON.stringify({
          eventType,
          payload,
          adminId: String(adminId),
          adminName: req.admin.name || '',
          adminEmail: req.admin.email || '',
          requestId,
          timestamp: new Date().toISOString(),
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      // ✅ DEBUG LOGS
      console.log('📥 n8n admin status:', n8nRes.status);
      console.log('📥 n8n admin content-type:', n8nRes.headers.get('content-type'));

      // ✅ Read body ONCE as text (safe pattern — same as chat controller)
      const rawBody = await n8nRes.text();
      console.log('📥 n8n admin raw body (first 300):', rawBody.substring(0, 300));

      if (n8nRes.ok) {
        try {
          n8nResult = JSON.parse(rawBody);
          n8nSuccess = true;
        } catch (parseErr) {
          console.warn('⚠️ n8n returned invalid JSON:', parseErr.message);
          // HTTP 200 = success even if body is odd
          n8nSuccess = true;
          n8nResult = { rawBody: rawBody.substring(0, 200) };
        }
      } else {
        console.error('❌ n8n responded non-OK:', n8nRes.status, rawBody);
      }
    } catch (n8nErr) {
      console.error('❌ n8n dispatch error:', n8nErr.message);
    }

    // 3️⃣ Update log
    log.status = n8nSuccess ? 'success' : 'failed';
    if (!n8nSuccess) log.errorMessage = 'n8n webhook failed or timed out';
    await log.save();

    if (!n8nSuccess) {
      return res.status(502).json({
        success: false,
        error: 'Automation service unavailable',
        requestId,
      });
    }

    res.json({
      success: true,
      requestId,
      message: 'Admin action processed successfully',
      n8n: n8nResult,
    });
  } catch (err) {
    console.error('❌ Dispatch error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ==========================================
// ✅ GET AUDIT LOGS
// ==========================================
export const getAuditLogs = async (req, res) => {
  try {
    const { eventType, status, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (eventType) filter.eventType = eventType;
    if (status) filter.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [logs, total] = await Promise.all([
      AdminLog.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('adminId', 'name email')
        .lean(),
      AdminLog.countDocuments(filter),
    ]);

    res.json({
      success: true,
      logs,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ==========================================
// ✅ GET SINGLE LOG
// ==========================================
export const getAuditLog = async (req, res) => {
  try {
    const log = await AdminLog.findById(req.params.id)
      .populate('adminId', 'name email')
      .lean();

    if (!log) {
      return res.status(404).json({ success: false, error: 'Log not found' });
    }
    res.json({ success: true, log });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};