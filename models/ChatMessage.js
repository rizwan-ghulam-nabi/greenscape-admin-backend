// backend/models/ChatMessage.js
import mongoose from 'mongoose';

const ChatMessageSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    index: true,
  },
  // ✅ Now references Admin model (not User)
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true,
    index: true,
  },
  role: {
    type: String,
    enum: ['user', 'assistant', 'system'],
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  tokensUsed: { type: Number, default: 0 },
  model: { type: String, default: 'gpt-4o-mini' },
  responseTimeMs: { type: Number, default: 0 },
  flagged: { type: Boolean, default: false },
}, { timestamps: true });

// Auto-delete after 90 days
ChatMessageSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export default mongoose.model('ChatMessage', ChatMessageSchema);