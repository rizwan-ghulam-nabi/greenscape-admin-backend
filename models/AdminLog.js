// backend/models/AdminLog.js
import mongoose from 'mongoose';

const AdminLogSchema = new mongoose.Schema({
  // ✅ References Admin model
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true,
    index: true,
  },
  adminName: { type: String, default: '' },
  adminEmail: { type: String, default: '' },
  action: { type: String, required: true },
  eventType: {
    type: String,
    enum: ['product', 'order', 'customer', 'inventory', 'discount', 'review', 'system'],
    required: true,
    index: true,
  },
  requestId: {
    type: String,
    unique: true,
    sparse: true,
  },
  payload: { type: mongoose.Schema.Types.Mixed, default: {} },
  status: {
    type: String,
    enum: ['success', 'failed', 'pending'],
    default: 'success',
  },
  errorMessage: { type: String },
  ipAddress: { type: String },
  userAgent: { type: String },
}, { timestamps: true });

export default mongoose.model('AdminLog', AdminLogSchema);