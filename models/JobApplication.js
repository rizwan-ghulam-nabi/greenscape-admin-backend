// backend/models/JobApplication.js
import mongoose from 'mongoose';

const JobApplicationSchema = new mongoose.Schema(
  {
    // Position snapshot
    positionId: { type: Number, required: true, index: true },
    positionTitle: { type: String, required: true, trim: true },
    positionDepartment: { type: String, trim: true, default: '' },

    // Applicant info
    fullName: { type: String, required: true, trim: true, maxlength: 100 },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    phone: { type: String, required: true, trim: true },

    city: { type: String, trim: true, default: '' },
    portfolioUrl: { type: String, trim: true, default: '' },
    linkedinUrl: { type: String, trim: true, default: '' },

    coverLetter: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },

    // Resume
    resumeUrl: { type: String, required: true, trim: true },
    resumeName: { type: String, default: '', trim: true },

    // Admin workflow
    status: {
      type: String,
      enum: ['new', 'reviewing', 'shortlisted', 'interviewed', 'rejected', 'hired'],
      default: 'new',
      index: true,
    },
    adminNotes: { type: String, default: '' },
    reviewedAt: { type: Date, default: null },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

JobApplicationSchema.index({ status: 1, createdAt: -1 });
JobApplicationSchema.index({ positionId: 1, createdAt: -1 });
JobApplicationSchema.index({ email: 1 });

export default mongoose.model('JobApplication', JobApplicationSchema);