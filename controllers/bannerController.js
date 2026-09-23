// backend/controllers/bannerController.js
import Banner from '../models/Banner.js';
import mongoose from 'mongoose';

// ==========================================
// 1. GET ALL BANNERS
// ==========================================
export const getBanners = async (req, res) => {
  try {
    const banners = await Banner.find()
      .populate('categoryId', 'name slug')
      .populate('productId', 'name slug image')
      .sort({ order: 1, createdAt: -1 });

    // ✅ Return with success wrapper (matches your admin panel expectations)
    res.json({ success: true, banners });
  } catch (err) {
    console.error('❌ Error fetching banners:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ==========================================
// 2. GET SINGLE BANNER
// ==========================================
export const getBannerById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'Invalid banner ID' });
    }

    const banner = await Banner.findById(id)
      .populate('categoryId', 'name slug')
      .populate('productId', 'name slug image');

    if (!banner) {
      return res.status(404).json({ success: false, error: 'Banner not found' });
    }

    res.json({ success: true, banner });
  } catch (err) {
    console.error('❌ Error fetching banner:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ==========================================
// 3. CREATE NEW BANNER
// ==========================================
export const createBanner = async (req, res) => {
  try {
    const bannerData = req.body;

    // ✅ Validate required fields
    if (!bannerData.title || !bannerData.image) {
      return res.status(400).json({
        success: false,
        error: 'Title and image are required',
      });
    }

    // ✅ Ensure button object has all defaults
    bannerData.button = {
      text: bannerData.button?.text || 'Shop Now',
      position: bannerData.button?.position || 'Center',
      size: bannerData.button?.size || 'Medium',
      style: bannerData.button?.style || 'Solid',
      bgColor: bannerData.button?.bgColor || '#0f5a2e',
      textColor: bannerData.button?.textColor || '#ffffff',
      hoverBgColor: bannerData.button?.hoverBgColor || '#0a4221',
      borderRadius: bannerData.button?.borderRadius || 'md',
      showArrow: bannerData.button?.showArrow !== false,
    };

    const banner = new Banner(bannerData);
    const savedBanner = await banner.save();

    const populated = await Banner.findById(savedBanner._id)
      .populate('categoryId', 'name slug')
      .populate('productId', 'name slug image');

    res.status(201).json({ success: true, banner: populated });
  } catch (err) {
    console.error('❌ Create Banner Error:', err);
    res.status(400).json({ success: false, error: err.message });
  }
};

// ==========================================
// 4. UPDATE BANNER
// ==========================================
export const updateBanner = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'Invalid banner ID' });
    }

    const existingBanner = await Banner.findById(id);
    if (!existingBanner) {
      return res.status(404).json({ success: false, error: 'Banner not found' });
    }

    // ✅ Build update object
    const updateData = { ...req.body };

    // ✅ Merge button object with existing (instead of replacing)
    if (req.body.button && typeof req.body.button === 'object') {
      updateData.button = {
        ...(existingBanner.button?.toObject?.() || existingBanner.button || {}),
        ...req.body.button,
      };
    }

    // ✅ Merge showOnPages (instead of replacing)
    if (req.body.showOnPages && typeof req.body.showOnPages === 'object') {
      updateData.showOnPages = {
        ...(existingBanner.showOnPages?.toObject?.() || existingBanner.showOnPages || {}),
        ...req.body.showOnPages,
      };
    }

    const banner = await Banner.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate('categoryId', 'name slug')
      .populate('productId', 'name slug image');

    res.json({ success: true, banner });
  } catch (err) {
    console.error('❌ Update Banner Error:', err);
    res.status(400).json({ success: false, error: err.message });
  }
};

// ==========================================
// 5. DELETE BANNER
// ==========================================
export const deleteBanner = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'Invalid banner ID' });
    }

    const banner = await Banner.findByIdAndDelete(id);
    if (!banner) {
      return res.status(404).json({ success: false, error: 'Banner not found' });
    }

    res.json({ success: true, message: 'Banner deleted successfully' });
  } catch (err) {
    console.error('❌ Delete Banner Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};