// backend/routes/careers.js
import express from 'express';
import mongoose from 'mongoose';
import JobApplication from '../models/JobApplication.js';
import auth from '../middleware/adminAuth.js';

const router = express.Router();

// Inline admin check
const requireAdmin = (req, res, next) => {
  const user = req.user;
  if (!user) return res.status(401).json({ error: 'Authentication required' });

  const isAdmin =
    user.isAdmin === true ||
    user.role === 'admin' ||
    user.role === 'super_admin' ||
    user.role === 'superadmin';

  if (!isAdmin) return res.status(403).json({ error: 'Admin access required' });
  next();
};

// ==========================================
// ✅ PUBLIC: POST /api/careers/apply
// ==========================================
router.post('/apply', async (req, res) => {
  try {
    const {
      positionId,
      positionTitle,
      positionDepartment,
      fullName,
      email,
      phone,
      city,
      portfolioUrl,
      linkedinUrl,
      coverLetter,
      resumeUrl,
      resumeName,
    } = req.body;

    if (!positionId || !positionTitle || !fullName || !email || !phone || !coverLetter || !resumeUrl) {
      return res.status(400).json({ error: 'Missing required fields.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email address.' });
    }

    if (coverLetter.trim().length < 50) {
      return res.status(400).json({ error: 'Cover letter must be at least 50 characters.' });
    }

    // Prevent duplicates for same email + position
    const existing = await JobApplication.findOne({
      email: email.trim().toLowerCase(),
      positionId: Number(positionId),
    });

    if (existing) {
      return res.status(400).json({ error: 'You have already applied for this position.' });
    }

    const application = new JobApplication({
      positionId: Number(positionId),
      positionTitle: positionTitle.trim(),
      positionDepartment: positionDepartment?.trim() || '',
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      city: city?.trim() || '',
      portfolioUrl: portfolioUrl?.trim() || '',
      linkedinUrl: linkedinUrl?.trim() || '',
      coverLetter: coverLetter.trim(),
      resumeUrl: resumeUrl.trim(),
      resumeName: resumeName?.trim() || '',
      status: 'new',
    });

    await application.save();

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully!',
      applicationId: application._id,
    });
  } catch (err) {
    console.error('Job application error:', err);
    res.status(500).json({ error: 'Failed to submit application. Please try again.' });
  }
});

// ==========================================
// ✅ ADMIN: GET /api/careers/applications
// ==========================================
router.get('/applications', auth, requireAdmin, async (req, res) => {
  try {
    const {
      status = 'all',
      position = 'all',
      search = '',
      page = '1',
      limit = '20',
    } = req.query;

    const query = {};

    if (status && status !== 'all') query.status = status;
    if (position && position !== 'all') query.positionId = Number(position);

    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { positionTitle: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [applications, total, statusCounts] = await Promise.all([
      JobApplication.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      JobApplication.countDocuments(query),
      JobApplication.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    ]);

    const counts = statusCounts.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    res.json({
      success: true,
      applications,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
      counts: {
        new: counts.new || 0,
        reviewing: counts.reviewing || 0,
        shortlisted: counts.shortlisted || 0,
        interviewed: counts.interviewed || 0,
        rejected: counts.rejected || 0,
        hired: counts.hired || 0,
      },
    });
  } catch (err) {
    console.error('Get applications error:', err);
    res.status(500).json({ error: 'Failed to load applications.' });
  }
});

// ==========================================
// ✅ ADMIN: GET /api/careers/applications/:id
// ==========================================
router.get('/applications/:id', auth, requireAdmin, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid ID.' });
    }

    const application = await JobApplication.findById(req.params.id);

    if (!application) {
      return res.status(404).json({ error: 'Application not found.' });
    }

    res.json({ success: true, application });
  } catch (err) {
    console.error('Get application error:', err);
    res.status(500).json({ error: 'Failed to load application.' });
  }
});

// ==========================================
// ✅ ADMIN: PUT /api/careers/applications/:id/status
// ==========================================
router.put('/applications/:id/status', auth, requireAdmin, async (req, res) => {
  try {
    const { status, adminNotes } = req.body;

    const allowed = ['new', 'reviewing', 'shortlisted', 'interviewed', 'rejected', 'hired'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: 'Invalid status.' });
    }

    const update = {
      status,
      reviewedAt: new Date(),
      reviewedBy: req.user._id,
    };

    if (typeof adminNotes === 'string') update.adminNotes = adminNotes;

    const application = await JobApplication.findByIdAndUpdate(req.params.id, update, {
      new: true,
    });

    if (!application) {
      return res.status(404).json({ error: 'Application not found.' });
    }

    res.json({ success: true, application });
  } catch (err) {
    console.error('Update status error:', err);
    res.status(500).json({ error: 'Failed to update status.' });
  }
});

// ==========================================
// ✅ ADMIN: DELETE /api/careers/applications/:id
// ==========================================
router.delete('/applications/:id', auth, requireAdmin, async (req, res) => {
  try {
    const deleted = await JobApplication.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ error: 'Application not found.' });
    }

    res.json({ success: true, message: 'Application deleted.' });
  } catch (err) {
    console.error('Delete application error:', err);
    res.status(500).json({ error: 'Failed to delete application.' });
  }
});

// ==========================================
// ✅ ADMIN: GET /api/careers/stats
// ==========================================
router.get('/stats', auth, requireAdmin, async (req, res) => {
  try {
    const [newC, reviewing, shortlisted, interviewed, rejected, hired, total] =
      await Promise.all([
        JobApplication.countDocuments({ status: 'new' }),
        JobApplication.countDocuments({ status: 'reviewing' }),
        JobApplication.countDocuments({ status: 'shortlisted' }),
        JobApplication.countDocuments({ status: 'interviewed' }),
        JobApplication.countDocuments({ status: 'rejected' }),
        JobApplication.countDocuments({ status: 'hired' }),
        JobApplication.countDocuments({}),
      ]);

    res.json({
      success: true,
      stats: {
        new: newC,
        reviewing,
        shortlisted,
        interviewed,
        rejected,
        hired,
        total,
      },
    });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ error: 'Failed to load stats.' });
  }
});

export default router;