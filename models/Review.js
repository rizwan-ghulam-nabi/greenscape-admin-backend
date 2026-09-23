// backend/models/Review.js
import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    // ==========================================
    // REFERENCES
    // ==========================================
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },

    // ==========================================
    // REVIEWER INFO
    // ==========================================
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      default: '',
      trim: true,
      lowercase: true,
    },

    // ==========================================
    // REVIEW CONTENT
    // ==========================================
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    title: {
      type: String,
      default: '',
      trim: true,
      maxlength: 150,
    },
    comment: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },

    // ==========================================
    // MODERATION STATUS
    // ==========================================
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    rejectionReason: {
      type: String,
      default: '',
    },
    moderatedAt: {
      type: Date,
      default: null,
    },
    moderatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      default: null,
    },

    // ==========================================
    // ADMIN REPLY
    // ==========================================
    adminReply: {
      type: String,
      default: '',
      trim: true,
      maxlength: 1000,
    },
    adminRepliedAt: {
      type: Date,
      default: null,
    },
    adminRepliedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      default: null,
    },

    // ==========================================
    // ADMIN-CREATED FLAG
    // ==========================================
    isAdminCreated: {
      type: Boolean,
      default: false,
    },

    // ==========================================
    // BADGES & METADATA
    // ==========================================
    isVerifiedPurchase: {
      type: Boolean,
      default: false,
    },
    helpful: {
      type: Number,
      default: 0,
      min: 0,
    },
    helpfulBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    images: [
      {
        type: String,
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ==========================================
// INDEXES
// ==========================================
reviewSchema.index({ product: 1, user: 1 }, { unique: true, sparse: true });
reviewSchema.index({ product: 1, status: 1, createdAt: -1 });
reviewSchema.index({ status: 1, createdAt: -1 });

// ==========================================
// VIRTUALS
// ==========================================
reviewSchema.virtual('starString').get(function () {
  const filled = '★'.repeat(this.rating || 0);
  const empty = '☆'.repeat(5 - (this.rating || 0));
  return filled + empty;
});

reviewSchema.virtual('hasAdminReply').get(function () {
  return !!(this.adminReply && this.adminReply.trim().length > 0);
});

// ==========================================
// ✅ MIDDLEWARE — WITHOUT next() callback
// Use async/sync function directly (Mongoose 7+)
// ==========================================
reviewSchema.pre('save', function () {
  // Auto-set moderatedAt
  if (this.isModified('status') && this.status !== 'pending') {
    if (!this.moderatedAt) this.moderatedAt = new Date();
  }

  // Auto-set adminRepliedAt
  if (this.isModified('adminReply') && this.adminReply) {
    if (!this.adminRepliedAt) this.adminRepliedAt = new Date();
  }
  // No next() — just return
});

// ==========================================
// METHODS
// ==========================================
reviewSchema.methods.approve = async function (adminId) {
  this.status = 'approved';
  this.rejectionReason = '';
  this.moderatedAt = new Date();
  this.moderatedBy = adminId || null;
  return this.save();
};

reviewSchema.methods.reject = async function (reason, adminId) {
  this.status = 'rejected';
  this.rejectionReason = reason || 'Violates guidelines';
  this.moderatedAt = new Date();
  this.moderatedBy = adminId || null;
  return this.save();
};

reviewSchema.methods.addAdminReply = async function (replyText, adminId) {
  this.adminReply = replyText.trim();
  this.adminRepliedAt = new Date();
  this.adminRepliedBy = adminId || null;
  return this.save();
};

// ==========================================
// STATICS
// ==========================================
reviewSchema.statics.getStatusCounts = async function () {
  const agg = await this.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  const counts = { approved: 0, pending: 0, rejected: 0, total: 0 };
  agg.forEach((s) => {
    if (s._id) counts[s._id] = s.count;
    counts.total += s.count;
  });
  return counts;
};

reviewSchema.statics.getAverageRating = async function () {
  const agg = await this.aggregate([
    { $match: { status: 'approved' } },
    { $group: { _id: null, avg: { $avg: '$rating' } } },
  ]);
  return Number((agg[0]?.avg || 0).toFixed(1));
};

reviewSchema.statics.getApprovedForProduct = async function (productId) {
  return this.find({ product: productId, status: 'approved' })
    .populate('user', 'firstName lastName profileImage')
    .sort({ createdAt: -1 })
    .lean();
};

export default mongoose.model('Review', reviewSchema); 