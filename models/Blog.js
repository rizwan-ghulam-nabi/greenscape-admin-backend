// backend/models/Blog.js - FIXED (No pre-save hook)
import mongoose from 'mongoose';

const BlogSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  slug: { type: String, unique: true, trim: true },
  excerpt: { type: String, required: true, trim: true },
  content: { type: String, required: true },
  image: { type: String, default: '' },
  category: { type: String, required: true, trim: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { 
    type: String, 
    enum: ['Published', 'Draft', 'Trash'], 
    default: 'Draft' 
  },
  tags: [{ type: String, trim: true }],
  views: { type: Number, default: 0 },
}, { 
  timestamps: true 
});

// No pre-save hook - slug is generated in the controller

export default mongoose.model('Blog', BlogSchema);