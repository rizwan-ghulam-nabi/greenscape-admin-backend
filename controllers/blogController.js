// backend/controllers/blogController.js
import Blog from '../models/Blog.js';

// ==========================================
// 1. GET ALL POSTS (With Filtering & Pagination)
// ==========================================
export const getAllPosts = async (req, res) => {
  try {
    const { 
      search, 
      category, 
      author, 
      status, 
      page = 1, 
      limit = 10,
      sort = 'newest'
    } = req.query;

    let filter = {};

    // Search filter
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { excerpt: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }

    // Category filter
    if (category && category !== 'all') {
      filter.category = category;
    }

    // Status filter
    if (status && status !== 'all') {
      filter.status = status;
    }

    // Author filter
    if (author && author !== 'all') {
      filter.author = author;
    }

    // Sort options
    let sortOption = { createdAt: -1 };
    if (sort === 'oldest') sortOption = { createdAt: 1 };
    if (sort === 'title') sortOption = { title: 1 };
    if (sort === 'views') sortOption = { views: -1 };

    // Pagination
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    // Execute queries
    const total = await Blog.countDocuments(filter);
    const posts = await Blog.find(filter)
      .populate('author', 'firstName lastName email avatar')
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum)
      .lean();

    res.status(200).json({
      success: true,
      posts,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
        hasNextPage: pageNum < Math.ceil(total / limitNum),
        hasPrevPage: pageNum > 1
      }
    });
  } catch (err) {
    console.error('❌ Error in getAllPosts:', err.message);
    res.status(500).json({
      success: false,
      error: err.message,
      posts: [],
      pagination: { total: 0, page: 1, limit: 10 }
    });
  }
};

// ==========================================
// 2. GET SINGLE POST BY ID
// ==========================================
export const getPostById = async (req, res) => {
  try {
    const post = await Blog.findById(req.params.id)
      .populate('author', 'firstName lastName email avatar');

    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      });
    }

    res.status(200).json({
      success: true,
      post
    });
  } catch (err) {
    console.error('❌ Error in getPostById:', err.message);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// ==========================================
// 3. GET POST BY SLUG
// ==========================================
export const getPostBySlug = async (req, res) => {
  try {
    const post = await Blog.findOne({ slug: req.params.slug })
      .populate('author', 'firstName lastName email avatar');

    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      });
    }

    // Increment views
    post.views += 1;
    await post.save();

    res.status(200).json({
      success: true,
      post
    });
  } catch (err) {
    console.error('❌ Error in getPostBySlug:', err.message);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// ==========================================
// 4. CREATE NEW POST
// ==========================================
// backend/controllers/blogController.js - UPDATED createPost
export const createPost = async (req, res) => {
  try {
    console.log('📝 CREATE POST REQUEST RECEIVED');
    console.log('Body:', JSON.stringify(req.body, null, 2));
    console.log('User ID:', req.user?._id);
    console.log('User Email:', req.user?.email);

    const { title, slug, excerpt, content, image, category, status, tags } = req.body;

    // Validate required fields
    const requiredFields = ['title', 'excerpt', 'content', 'category'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      console.log('❌ Missing fields:', missingFields);
      return res.status(400).json({
        success: false,
        error: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    // Generate slug if not provided
    const generatedSlug = slug || title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    console.log('Generated slug:', generatedSlug);

    // Check if slug already exists
    const existingPost = await Blog.findOne({ slug: generatedSlug });
    if (existingPost) {
      console.log('❌ Slug already exists:', generatedSlug);
      return res.status(400).json({
        success: false,
        error: 'A post with this slug already exists'
      });
    }

    // Create new post - Use req.user._id directly
    const newPost = new Blog({
      title,
      slug: generatedSlug,
      excerpt,
      content,
      image: image || '',
      category,
      status: status || 'Draft',
      tags: tags || [],
      author: req.user._id,  // Directly use req.user._id
      views: 0
    });

    await newPost.save();
    console.log('✅ Post created successfully:', newPost._id);

    // Populate author for response
    await newPost.populate('author', 'firstName lastName email');

    res.status(201).json({
      success: true,
      message: 'Blog post created successfully',
      post: newPost
    });

  } catch (err) {
    console.error('❌ Error in createPost:');
    console.error('Error name:', err.name);
    console.error('Error message:', err.message);
    console.error('Error code:', err.code);
    console.error('Full error:', err);
    
    res.status(400).json({
      success: false,
      error: err.message || 'Failed to create blog post',
      details: {
        name: err.name,
        code: err.code,
        message: err.message
      }
    });
  }
};
// ==========================================
// 5. UPDATE POST
// ==========================================
export const updatePost = async (req, res) => {
  try {
    const { title, slug, excerpt, content, image, category, status, tags } = req.body;

    // Find existing post
    const post = await Blog.findById(req.params.id);
    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      });
    }

    // Update fields
    if (title) post.title = title;
    if (excerpt) post.excerpt = excerpt;
    if (content) post.content = content;
    if (image !== undefined) post.image = image;
    if (category) post.category = category;
    if (status) post.status = status;
    if (tags) post.tags = tags;

    // Update slug if title changed and no explicit slug
    if (title && !slug) {
      post.slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    } else if (slug) {
      post.slug = slug;
    }

    await post.save();

    // Populate author for response
    await post.populate('author', 'firstName lastName email');

    res.status(200).json({
      success: true,
      message: 'Blog post updated successfully',
      post
    });
  } catch (err) {
    console.error('❌ Error in updatePost:', err.message);
    res.status(400).json({
      success: false,
      error: err.message || 'Failed to update blog post'
    });
  }
};

// ==========================================
// 6. DELETE POST
// ==========================================
export const deletePost = async (req, res) => {
  try {
    const post = await Blog.findByIdAndDelete(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Blog post deleted successfully',
      deletedPost: post
    });
  } catch (err) {
    console.error('❌ Error in deletePost:', err.message);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// ==========================================
// 7. GET BLOG STATS
// ==========================================
export const getBlogStats = async (req, res) => {
  try {
    const [total, published, drafts, trash] = await Promise.all([
      Blog.countDocuments(),
      Blog.countDocuments({ status: 'Published' }),
      Blog.countDocuments({ status: 'Draft' }),
      Blog.countDocuments({ status: 'Trash' })
    ]);

    // Get recent posts count (last 7 days)
    const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentPosts = await Blog.countDocuments({ createdAt: { $gte: last7Days } });

    // Get total views
    const viewsResult = await Blog.aggregate([
      { $group: { _id: null, totalViews: { $sum: '$views' } } }
    ]);
    const totalViews = viewsResult[0]?.totalViews || 0;

    res.status(200).json({
      success: true,
      stats: {
        total,
        published,
        drafts,
        trash,
        recentPosts,
        totalViews
      }
    });
  } catch (err) {
    console.error('❌ Error in getBlogStats:', err.message);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// ==========================================
// 8. TOGGLE POST STATUS
// ==========================================
export const togglePostStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Status is required'
      });
    }

    const validStatuses = ['Published', 'Draft', 'Trash'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const post = await Blog.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      });
    }

    res.status(200).json({
      success: true,
      message: `Post status updated to ${status}`,
      post
    });
  } catch (err) {
    console.error('❌ Error in togglePostStatus:', err.message);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// ==========================================
// 9. GET RELATED POSTS
// ==========================================
export const getRelatedPosts = async (req, res) => {
  try {
    const post = await Blog.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      });
    }

    const relatedPosts = await Blog.find({
      _id: { $ne: post._id },
      category: post.category,
      status: 'Published'
    })
      .select('title slug excerpt image views createdAt')
      .limit(5)
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      posts: relatedPosts
    });
  } catch (err) {
    console.error('❌ Error in getRelatedPosts:', err.message);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// ==========================================
// 10. SEARCH POSTS
// ==========================================
export const searchPosts = async (req, res) => {
  try {
    const { q, page = 1, limit = 10 } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    const searchRegex = new RegExp(q, 'i');

    const filter = {
      $or: [
        { title: searchRegex },
        { excerpt: searchRegex },
        { content: searchRegex },
        { category: searchRegex },
        { tags: searchRegex }
      ],
      status: 'Published'
    };

    const total = await Blog.countDocuments(filter);
    const posts = await Blog.find(filter)
      .select('title slug excerpt image category views createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      posts,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (err) {
    console.error('❌ Error in searchPosts:', err.message);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// ==========================================
// 11. GET POPULAR POSTS (By Views)
// ==========================================
export const getPopularPosts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 5;

    const posts = await Blog.find({ status: 'Published' })
      .select('title slug excerpt image views createdAt')
      .sort({ views: -1, createdAt: -1 })
      .limit(limit);

    res.status(200).json({
      success: true,
      posts
    });
  } catch (err) {
    console.error('❌ Error in getPopularPosts:', err.message);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};