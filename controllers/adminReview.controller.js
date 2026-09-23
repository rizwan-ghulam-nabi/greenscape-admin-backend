// backend/controllers/adminReview.controller.js
import Review from '../models/Review.js';
import Product from '../models/Product.js';

// ==========================================
// ✅ GET ALL REVIEWS (with filters + stats)
// ==========================================
export const getAllReviews = async (req, res) => {
  try {
    const {
      status,
      productId,
      rating,
      search,
      page = 1,
      limit = 50,
    } = req.query;

    const filter = {};
    if (status && status !== 'all') filter.status = status.toLowerCase();
    if (productId) filter.product = productId;
    if (rating) filter.rating = Number(rating);
    if (search) {
      filter.$or = [
        { comment: { $regex: search, $options: 'i' } },
        { title: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [reviews, total, statusAgg, avgAgg] = await Promise.all([
      Review.find(filter)
        .populate('product', 'name image category')
        .populate('user', 'firstName lastName email profileImage')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),

      Review.countDocuments(filter),

      Review.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),

      Review.aggregate([
        { $match: { status: 'approved' } },
        {
          $group: {
            _id: null,
            avgRating: { $avg: '$rating' },
            total: { $sum: 1 },
          },
        },
      ]),
    ]);

    // Build status counts
    const counts = { approved: 0, pending: 0, rejected: 0 };
    statusAgg.forEach((s) => {
      if (s._id) counts[s._id] = s.count;
    });

    const totalReviews = counts.approved + counts.pending + counts.rejected;

    res.json({
      success: true,
      reviews,
      totalReviews,
      averageRating: Number((avgAgg[0]?.avgRating || 0).toFixed(1)),
      approvedCount: counts.approved,
      pendingCount: counts.pending,
      rejectedCount: counts.rejected,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
        total,
      },
    });
  } catch (err) {
    console.error('❌ Error fetching reviews:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ==========================================
// ✅ GET SINGLE REVIEW
// ==========================================
export const getReviewById = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id)
      .populate('product', 'name image category price')
      .populate('user', 'firstName lastName email profileImage')
      .lean();

    if (!review) {
      return res.status(404).json({ success: false, error: 'Review not found' });
    }

    res.json({ success: true, review });
  } catch (err) {
    console.error('❌ Error fetching review:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ==========================================
// ✅ APPROVE REVIEW
// ==========================================
export const approveReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ success: false, error: 'Review not found' });
    }

    review.status = 'approved';
    review.rejectionReason = '';
    review.moderatedAt = new Date();
    review.moderatedBy = req.admin?._id || null;
    await review.save();

    await updateProductRating(review.product);

    res.json({ success: true, review });
  } catch (err) {
    console.error('❌ Error approving review:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ==========================================
// ✅ REJECT REVIEW
// ==========================================
export const rejectReview = async (req, res) => {
  try {
    const { reason } = req.body;
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ success: false, error: 'Review not found' });
    }

    review.status = 'rejected';
    review.rejectionReason = reason || 'Violates guidelines';
    review.moderatedAt = new Date();
    review.moderatedBy = req.admin?._id || null;
    await review.save();

    await updateProductRating(review.product);

    res.json({ success: true, review });
  } catch (err) {
    console.error('❌ Error rejecting review:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ==========================================
// ✅ UPDATE REVIEW
// ==========================================
export const updateReview = async (req, res) => {
  try {
    const { title, comment, rating, status } = req.body;

    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ success: false, error: 'Review not found' });
    }

    if (title !== undefined) review.title = title;
    if (comment !== undefined) review.comment = comment;
    if (rating !== undefined) review.rating = Number(rating);
    if (status !== undefined) review.status = status;

    await review.save();
    await updateProductRating(review.product);

    res.json({ success: true, review });
  } catch (err) {
    console.error('❌ Error updating review:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ==========================================
// ✅ DELETE REVIEW
// ==========================================
export const deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ success: false, error: 'Review not found' });
    }

    const productId = review.product;
    await review.deleteOne();
    await updateProductRating(productId);

    res.json({ success: true, message: 'Review deleted' });
  } catch (err) {
    console.error('❌ Error deleting review:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ==========================================
// ✅ BULK APPROVE
// ==========================================
export const bulkApprove = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, error: 'No IDs provided' });
    }

    const reviews = await Review.find({ _id: { $in: ids } });
    const productIds = [...new Set(reviews.map((r) => String(r.product)))];

    await Review.updateMany(
      { _id: { $in: ids } },
      {
        $set: {
          status: 'approved',
          moderatedAt: new Date(),
          moderatedBy: req.admin?._id || null,
        },
      }
    );

    for (const pid of productIds) {
      await updateProductRating(pid);
    }

    res.json({ success: true, updated: ids.length });
  } catch (err) {
    console.error('❌ Error bulk approving:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ==========================================
// ✅ BULK DELETE
// ==========================================
export const bulkDelete = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, error: 'No IDs provided' });
    }

    const reviews = await Review.find({ _id: { $in: ids } });
    const productIds = [...new Set(reviews.map((r) => String(r.product)))];

    await Review.deleteMany({ _id: { $in: ids } });

    for (const pid of productIds) {
      await updateProductRating(pid);
    }

    res.json({ success: true, deleted: ids.length });
  } catch (err) {
    console.error('❌ Error bulk deleting:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ==========================================
// ✅ ADD ADMIN REPLY (renamed from addAdminResponse)
// ==========================================
export const addAdminResponse = async (req, res) => {
  try {
    const { reply } = req.body;
    if (!reply || !reply.trim()) {
      return res.status(400).json({ success: false, error: 'Reply text required' });
    }

    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ success: false, error: 'Review not found' });
    }

    review.adminReply = reply.trim();
    review.adminRepliedAt = new Date();
    review.adminRepliedBy = req.admin?._id || null;

    await review.save();

    const populated = await Review.findById(review._id)
      .populate('product', 'name image')
      .populate('user', 'firstName lastName email')
      .lean();

    res.json({ success: true, review: populated });
  } catch (err) {
    console.error('❌ Error adding admin reply:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ==========================================
// ✅ CREATE ADMIN REVIEW (new)
// ==========================================
export const createAdminReview = async (req, res) => {
  try {
    const { productId, rating, title, comment, userName, email } = req.body;

    if (!productId || !rating || !comment) {
      return res.status(400).json({
        success: false,
        error: 'productId, rating, and comment are required',
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    const review = await Review.create({
      product: productId,
      user: null,
      name: userName || req.admin?.name || 'Admin',
      email: email || req.admin?.email || '',
      rating: Number(rating),
      title: title || '',
      comment: comment.trim(),
      status: 'approved',
      isAdminCreated: true,
      isVerifiedPurchase: false,
      helpful: 0,
    });

    await updateProductRating(productId);

    const populated = await Review.findById(review._id)
      .populate('product', 'name image category')
      .lean();

    res.status(201).json({ success: true, review: populated });
  } catch (err) {
    console.error('❌ Error creating admin review:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ==========================================
// ✅ HELPER: Recalculate product rating
// ==========================================
async function updateProductRating(productId) {
  try {
    const reviews = await Review.find({
      product: productId,
      status: 'approved',
    }).lean();

    const numReviews = reviews.length;
    const avgRating = numReviews > 0
      ? Number((reviews.reduce((s, r) => s + (r.rating || 0), 0) / numReviews).toFixed(1))
      : 0;

    await Product.findByIdAndUpdate(productId, {
      rating: avgRating,
      numReviews,
    });
  } catch (err) {
    console.error('Error updating product rating:', err);
  }
}