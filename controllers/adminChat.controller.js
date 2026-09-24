// backend/controllers/adminChat.controller.js
import ChatMessage from '../models/ChatMessage.js';

const N8N_CHAT_WEBHOOK =
  process.env.N8N_CHAT_WEBHOOK || 'http://localhost:5678/webhook/admin-chat';

  // const AI_TIMEOUT_MS = 30000;
const AI_TIMEOUT_MS = 8000;


// ==========================================
// ✅ SEND MESSAGE → forwards to n8n
// ==========================================
export const sendMessage = async (req, res) => {
  const startTime = Date.now();
  try {
    const { message, sessionId } = req.body;
    const adminId = req.admin._id;

    // Validation
    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Message is required',
      });
    }
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Session ID is required',
      });
    }
    if (message.length > 2000) {
      return res.status(400).json({
        success: false,
        error: 'Message too long (max 2000 chars)',
      });
    }

    // 1️⃣ Save user message
    const userMessage = await ChatMessage.create({
      sessionId,
      adminId,
      role: 'user',
      content: message.trim(),
    });

    // 2️⃣ Fetch recent conversation for context
    const recentMessages = await ChatMessage.find({
      sessionId,
      adminId,
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    const history = recentMessages
      .reverse()
      .map((m) => ({ role: m.role, content: m.content }));

    // 3️⃣ Call n8n webhook
    let aiReply = '';
    let usedFallback = false;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

      const n8nRes = await fetch(N8N_CHAT_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: message.trim(),
          sessionId,
          adminId: String(adminId),
          adminName: req.admin.name || req.admin.email || 'Admin',
          history,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      // ✅ DEBUG LOGS (remove after fixing)
      console.log('📥 n8n status:', n8nRes.status);
      console.log('📥 n8n content-type:', n8nRes.headers.get('content-type'));

      // ✅ Read body ONCE as text
      const rawBody = await n8nRes.text();
      console.log('📥 n8n raw body (first 500):', rawBody.substring(0, 500));

      if (!n8nRes.ok) {
        throw new Error(
          `n8n responded with ${n8nRes.status}: ${rawBody.substring(0, 200)}`
        );
      }

      // ✅ Parse JSON safely
      let data;
      try {
        data = JSON.parse(rawBody);
      } catch (parseErr) {
        throw new Error(
          `n8n returned invalid JSON: "${rawBody.substring(0, 200)}"`
        );
      }

      aiReply =
        data.reply ||
        data.message ||
        data.output ||
        data.text ||
        "I'm not sure how to answer that.";
    } catch (n8nErr) {
      console.error('❌ n8n webhook error:', n8nErr.message);
      usedFallback = true;
      aiReply = getFallbackReply(message);
    }

    const responseTimeMs = Date.now() - startTime;

    // 4️⃣ Save assistant message
    const assistantMessage = await ChatMessage.create({
      sessionId,
      adminId,
      role: 'assistant',
      content: aiReply,
      responseTimeMs,
      model: usedFallback ? 'fallback' : 'groq-llama-3.3',
    });

    res.json({
      success: true,
      reply: aiReply,
      sessionId,
      userMessageId: userMessage._id,
      assistantMessageId: assistantMessage._id,
      responseTimeMs,
      usedFallback,
    });
  } catch (err) {
    console.error('❌ Chat error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ==========================================
// ✅ GET CHAT HISTORY
// ==========================================
export const getHistory = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const adminId = req.admin._id;
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);

    const messages = await ChatMessage.find({ sessionId, adminId })
      .sort({ createdAt: 1 })
      .limit(limit)
      .lean();

    res.json({
      success: true,
      count: messages.length,
      messages,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ==========================================
// ✅ LIST ALL SESSIONS
// ==========================================
export const listSessions = async (req, res) => {
  try {
    const adminId = req.admin._id;

    const sessions = await ChatMessage.aggregate([
      { $match: { adminId } },
      {
        $group: {
          _id: '$sessionId',
          lastMessage: { $last: '$content' },
          messageCount: { $sum: 1 },
          lastAt: { $max: '$createdAt' },
          firstAt: { $min: '$createdAt' },
        },
      },
      { $sort: { lastAt: -1 } },
      { $limit: 20 },
    ]);

    res.json({ success: true, sessions });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ==========================================
// ✅ CLEAR A SESSION
// ==========================================
export const clearSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const adminId = req.admin._id;

    const result = await ChatMessage.deleteMany({ sessionId, adminId });

    res.json({
      success: true,
      deletedCount: result.deletedCount,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ==========================================
// ✅ FALLBACK (when n8n is down)
// ==========================================
function getFallbackReply(message) {
  const lower = message.toLowerCase();

  if (lower.includes('order')) {
    return "I'm having trouble reaching the AI service right now. Please check the Orders page directly, or try again in a moment.";
  }
  if (lower.includes('stock') || lower.includes('inventory')) {
    return "AI is temporarily unavailable. Please check Products → filter by 'Low Stock'.";
  }
  if (lower.includes('product')) {
    return "AI is temporarily unavailable. Try the Products page for now.";
  }
  return "⚠️ I'm temporarily unavailable. Please try again in a moment, or check the admin panel directly.";
}