import Product from '../models/Product.js';
import Category from '../models/Category.js';
import mongoose from 'mongoose';

// ==========================================
// 1. GET ALL PRODUCTS (Enhanced with pagination & filtering)
// ==========================================
export const getAllProducts = async (req, res) => {
  try {
    console.log('📊 [getAllProducts] Request received with query:', req.query);
    
    const { 
      category, 
      tag, 
      isFeatured, 
      isBestSeller, 
      isOnSale,
      isActive,
      search,
      page = 1,
      limit = 10,
      sort = '-createdAt',
      minPrice,
      maxPrice,
      inStock,
      subCategory
    } = req.query;

    let filter = {};

    // Basic filters
    if (category) {
      filter.category = category;
      console.log(`🔍 Filtering by category: ${category}`);
    }
    
    if (subCategory) {
      filter.subCategory = subCategory;
      console.log(`🔍 Filtering by subCategory: ${subCategory}`);
    }
    
    if (tag) {
      filter.tags = tag;
      console.log(`🔍 Filtering by tag: ${tag}`);
    }
    
    if (isFeatured === 'true') {
      filter.isFeatured = true;
      console.log('⭐ Filtering by featured products');
    }
    
    if (isBestSeller === 'true') {
      filter.isBestSeller = true;
      console.log('🏆 Filtering by bestseller products');
    }
    
    if (isActive === 'true') {
      filter.isActive = true;
      console.log('✅ Filtering by active products');
    }
    if (isActive === 'false') {
      filter.isActive = false;
      console.log('❌ Filtering by inactive products');
    }
    
    // Stock filter
    if (inStock === 'true') {
      filter.stock = { $gt: 0 };
      console.log('📦 Filtering by in-stock products');
    }
    if (inStock === 'false') {
      filter.stock = 0;
      console.log('📦 Filtering by out-of-stock products');
    }

    // Price range (PKR)
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) {
        filter.price.$gte = parseFloat(minPrice);
        console.log(`💰 Min price (PKR): ${minPrice}`);
      }
      if (maxPrice) {
        filter.price.$lte = parseFloat(maxPrice);
        console.log(`💰 Max price (PKR): ${maxPrice}`);
      }
    }

    // Sale filter - using virtual isOnSale
    if (isOnSale === 'true') {
      const now = new Date();
      filter.$or = [
        { saleStartDate: { $lte: now }, saleEndDate: { $gte: now } },
        { oldPrice: { $gt: '$price' } }
      ];
      console.log('🏷️ Filtering by on-sale products');
    }

    // Search filter - using text index
    if (search) {
      filter.$text = { $search: search };
      console.log(`🔎 Searching for: "${search}"`);
    }

    console.log('📋 Final filter object:', JSON.stringify(filter, null, 2));

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    console.log(`📄 Pagination: page ${page}, limit ${limit}, skip ${skip}`);

    // Execute query with debugging
    console.log('🔄 Executing Product.find()...');
    const queryStart = Date.now();
    
    const products = await Product.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .lean();

    const queryTime = Date.now() - queryStart;
    console.log(`✅ Query completed in ${queryTime}ms, found ${products.length} products`);

    // Get total count for pagination
    console.log('📊 Counting total products...');
    const total = await Product.countDocuments(filter);
    console.log(`📊 Total products matching filter: ${total}`);

    // Add computed fields for admin panel
    const enhancedProducts = products.map(product => {
      // Calculate isLowStock using the model's logic
      const isLowStock = product.stock > 0 && product.stock <= (product.lowStockAlert || 5);
      
      // Calculate profit margin (PKR)
      const profitMargin = product.costPrice ? 
        Math.round(((product.price - product.costPrice) / product.price) * 100) : 0;
      
      // Determine if on sale using model's logic
      const now = new Date();
      let isOnSale = false;
      if (product.saleStartDate && product.saleEndDate) {
        isOnSale = now >= product.saleStartDate && now <= product.saleEndDate;
      } else if (product.oldPrice && product.oldPrice > product.price) {
        isOnSale = true;
      }

      // Calculate discount percentage
      let discountPercentage = 0;
      if (product.oldPrice && product.oldPrice > product.price) {
        discountPercentage = Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100);
      }

      return {
        ...product,
        isLowStock,
        profitMargin,
        status: product.isActive ? 'Active' : 'Inactive',
        isOnSale,
        discountPercentage
      };
    });

    console.log(`✅ Enhanced ${enhancedProducts.length} products with computed fields`);

    res.json({
      success: true,
      data: enhancedProducts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
        hasNext: parseInt(page) < Math.ceil(total / limit),
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (err) {
    console.error('❌ ERROR in getAllProducts:', err);
    console.error('Stack trace:', err.stack);
    res.status(500).json({ 
      success: false, 
      error: err.message,
      message: 'Failed to fetch products'
    });
  }
};

// ==========================================
// 2. GET SINGLE PRODUCT (Enhanced)
// ==========================================
export const getSingleProduct = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🔍 [getSingleProduct] Fetching product with ID: ${id}`);

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.error('❌ Invalid product ID format:', id);
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid product ID format' 
      });
    }

    console.log('🔄 Executing Product.findById()...');
    const product = await Product.findById(id)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .populate('reviewIds');

    if (!product) {
      console.log('❌ Product not found with ID:', id);
      return res.status(404).json({ 
        success: false, 
        error: 'Product not found' 
      });
    }

    console.log(`✅ Product found: ${product.name}`);

    // Add computed fields
    const enhancedProduct = {
      ...product.toObject(),
      isLowStock: product.stock > 0 && product.stock <= (product.lowStockAlert || 5),
      profitMargin: product.costPrice ? 
        Math.round(((product.price - product.costPrice) / product.price) * 100) : 0,
      isOnSale: product.isOnSale,
      discountPercentage: product.discountPercentage
    };

    console.log('✅ Product enhanced with computed fields');

    res.json({
      success: true,
      data: enhancedProduct
    });
  } catch (err) {
    console.error('❌ ERROR in getSingleProduct:', err);
    console.error('Stack trace:', err.stack);
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
};

// ==========================================
// 3. CREATE NEW PRODUCT (Enhanced with full validation)
// ==========================================
export const createProduct = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    console.log('🚀 [createProduct] Creating new product');
    console.log('Request body:', JSON.stringify(req.body, null, 2));

    const productData = req.body;
    
    // ===== LOG ALL INCOMING DATA =====
    console.log('📝 Product data received:', {
      name: productData.name,
      desc: productData.desc,
      price: productData.price,
      category: productData.category,
      image: productData.image,
      sku: productData.sku,
      slug: productData.slug
    });

    // ===== VALIDATE REQUIRED FIELDS =====
    const requiredFields = ['name', 'desc', 'price', 'category', 'image'];
    const missingFields = requiredFields.filter(field => {
      const value = productData[field];
      return !value && value !== 0 && value !== false;
    });
    
    if (missingFields.length > 0) {
      console.error(`❌ Missing required fields: ${missingFields.join(', ')}`);
      console.error('📋 Available fields:', Object.keys(productData));
      return res.status(400).json({
        success: false,
        error: `Missing required fields: ${missingFields.join(', ')}`
      });
    }
    
    // ===== VALIDATE DATA TYPES =====
    console.log('🔍 Validating data types...');
    
    // Validate name
    if (typeof productData.name !== 'string' || productData.name.trim() === '') {
      console.error('❌ Invalid name:', productData.name, 'Type:', typeof productData.name);
      return res.status(400).json({
        success: false,
        error: 'Name must be a non-empty string'
      });
    }
    console.log(`✅ Name validated: "${productData.name}"`);
    
    // Validate desc - clean up newlines
    if (typeof productData.desc !== 'string' || productData.desc.trim() === '') {
      console.error('❌ Invalid desc:', productData.desc, 'Type:', typeof productData.desc);
      return res.status(400).json({
        success: false,
        error: 'Description must be a non-empty string'
      });
    }
    
    // Clean up desc - replace newlines with spaces
    productData.desc = productData.desc.replace(/\n/g, ' ').trim();
    
    // Check description length
    if (productData.desc.length < 10) {
      console.error(`❌ Description too short: ${productData.desc.length} characters`);
      return res.status(400).json({
        success: false,
        error: 'Description must be at least 10 characters long'
      });
    }
    console.log(`✅ Desc validated: "${productData.desc}" (${productData.desc.length} chars)`);
    
    // Validate price (PKR)
    if (typeof productData.price !== 'number' || productData.price <= 0) {
      console.error('❌ Invalid price:', productData.price, 'Type:', typeof productData.price);
      return res.status(400).json({
        success: false,
        error: 'Price must be a valid number greater than 0 (PKR)'
      });
    }
    console.log(`✅ Price validated (PKR): ${productData.price}`);
    
    // Validate category
    if (typeof productData.category !== 'string' || productData.category.trim() === '') {
      console.error('❌ Invalid category:', productData.category, 'Type:', typeof productData.category);
      return res.status(400).json({
        success: false,
        error: 'Category must be a non-empty string'
      });
    }
    console.log(`✅ Category validated: "${productData.category}"`);
    
    // Validate image
    if (typeof productData.image !== 'string' || productData.image.trim() === '') {
      console.error('❌ Invalid image:', productData.image, 'Type:', typeof productData.image);
      return res.status(400).json({
        success: false,
        error: 'Image must be a valid URL'
      });
    }
    console.log(`✅ Image validated: "${productData.image}"`);

    // ===== VALIDATE CATEGORY EXISTS =====
    console.log(`🔍 Checking if category "${productData.category}" exists...`);
    const category = await Category.findOne({ name: productData.category });
    if (!category) {
      console.error(`❌ Category "${productData.category}" does not exist`);
      console.log('📋 Available categories:', await Category.find().distinct('name'));
      return res.status(400).json({
        success: false,
        error: `Category "${productData.category}" does not exist. Available categories: ${await Category.find().distinct('name').then(cats => cats.join(', '))}`
      });
    }
    console.log(`✅ Category found: ${category.name} (ID: ${category._id})`);

    // ===== CHECK FOR DUPLICATES =====
    console.log('🔍 Checking for duplicates...');
    
    if (productData.sku) {
      const existingProduct = await Product.findOne({ sku: productData.sku });
      if (existingProduct) {
        console.error(`❌ Duplicate SKU: ${productData.sku} already exists on product: ${existingProduct.name}`);
        return res.status(400).json({
          success: false,
          error: `Product with SKU "${productData.sku}" already exists`
        });
      }
      console.log(`✅ SKU "${productData.sku}" is unique`);
    }

    if (productData.slug) {
      const existingSlug = await Product.findOne({ slug: productData.slug });
      if (existingSlug) {
        console.error(`❌ Duplicate slug: ${productData.slug} already exists on product: ${existingSlug.name}`);
        return res.status(400).json({
          success: false,
          error: `Product with slug "${productData.slug}" already exists`
        });
      }
      console.log(`✅ Slug "${productData.slug}" is unique`);
    }

    // ===== ADD ADMIN TRACKING =====
    if (req.user) {
      productData.createdBy = req.user.id;
      productData.updatedBy = req.user.id;
      console.log(`👤 Admin user: ${req.user.id} (${req.user.email || 'No email'})`);
    } else {
      console.warn('⚠️ No user found in request');
    }

    // ===== AUTO-GENERATE FIELDS =====
    console.log('🔄 Auto-generating missing fields...');
    
    // Generate slug if not provided
    if (!productData.slug) {
      productData.slug = productData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      console.log(`✅ Generated slug: ${productData.slug}`);
    }

    // Generate SKU if not provided
    if (!productData.sku) {
      const prefix = productData.category.substring(0, 3).toUpperCase();
      const timestamp = Date.now().toString().slice(-6);
      const random = Math.floor(1000 + Math.random() * 9000);
      productData.sku = `${prefix}-${timestamp}-${random}`;
      console.log(`✅ Generated SKU: ${productData.sku}`);
    }

    // Auto-generate search keywords if not provided
    if (!productData.searchKeywords || productData.searchKeywords.length === 0) {
      const keywords = new Set();
      productData.name.toLowerCase().split(' ').forEach(word => {
        if (word.length > 2) keywords.add(word);
      });
      if (productData.category) keywords.add(productData.category.toLowerCase());
      if (productData.tags) productData.tags.forEach(tag => keywords.add(tag.toLowerCase()));
      productData.searchKeywords = Array.from(keywords);
      console.log(`✅ Generated search keywords: ${productData.searchKeywords.join(', ')}`);
    }

    // Auto-generate meta data if not provided
    if (!productData.metaTitle) {
      productData.metaTitle = productData.name.substring(0, 60);
      console.log(`✅ Generated meta title: ${productData.metaTitle}`);
    }
    if (!productData.metaDescription) {
      productData.metaDescription = productData.shortDesc || productData.desc.substring(0, 160);
      console.log(`✅ Generated meta description: ${productData.metaDescription}`);
    }

    // ===== HANDLE IMAGE UPLOAD =====
    if (req.files) {
      console.log('📸 Processing uploaded files...');
      console.log('📸 Files:', Object.keys(req.files));
      
      if (req.files.image) {
        productData.image = req.files.image[0].path;
        console.log(`📸 Main image updated: ${productData.image}`);
      }
      if (req.files.gallery) {
        productData.gallery = req.files.gallery.map(file => file.path);
        console.log(`📸 Gallery images: ${productData.gallery.length} files`);
      }
      if (req.files.thumbnail) {
        productData.thumbnail = req.files.thumbnail[0].path;
        console.log(`📸 Thumbnail: ${productData.thumbnail}`);
      }
    } else {
      console.log('📸 No files uploaded');
    }

    // ===== CREATE AND SAVE PRODUCT =====
    console.log('🔄 Creating product instance...');
    console.log('📝 Final product data:', JSON.stringify(productData, null, 2));
    
    const product = new Product(productData);
    
    console.log('🔄 Validating product before save...');
    const validationError = product.validateSync();
    if (validationError) {
      console.error('❌ Validation error:', validationError);
      const errors = Object.values(validationError.errors).map(e => e.message);
      return res.status(400).json({
        success: false,
        error: errors.join('. ')
      });
    }
    console.log('✅ Product validation passed');
    
    console.log('🔄 Saving product to database...');
    const savedProduct = await product.save({ session });
    console.log(`✅ Product saved successfully! ID: ${savedProduct._id}`);
    console.log(`📋 Product details: Name: ${savedProduct.name}, SKU: ${savedProduct.sku}, Slug: ${savedProduct.slug}`);

    // ===== UPDATE CATEGORY COUNT =====
    console.log(`📈 Incrementing product count for category: ${savedProduct.category}`);
    const categoryUpdate = await Category.findOneAndUpdate(
      { name: savedProduct.category },
      { $inc: { products: 1 } },
      { session }
    );

    if (!categoryUpdate) {
      console.warn(`⚠️ Category "${savedProduct.category}" not found for increment`);
    } else {
      console.log(`✅ Category product count incremented to: ${categoryUpdate.products}`);
    }

    await session.commitTransaction();
    console.log('✅ Transaction committed successfully');

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: savedProduct
    });
  } catch (err) {
    console.error('❌ ERROR in createProduct (500):', err);
    console.error('Stack trace:', err.stack);
    
    // Abort transaction
    try {
      await session.abortTransaction();
      console.log('✅ Transaction aborted');
    } catch (abortErr) {
      console.error('❌ Error aborting transaction:', abortErr);
    }
    
    // Handle duplicate key errors
    if (err.code === 11000) {
      const duplicateField = Object.keys(err.keyPattern)[0];
      console.error(`❌ Duplicate key error on field: ${duplicateField}`);
      console.error('📋 Duplicate value:', err.keyValue);
      return res.status(400).json({
        success: false,
        error: `Product with this ${duplicateField} already exists: ${err.keyValue[duplicateField]}`
      });
    }
    
    // Handle validation errors
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      console.error('❌ Validation errors:', errors);
      return res.status(400).json({
        success: false,
        error: errors.join('. ')
      });
    }
    
    // Handle CastError (invalid ObjectId)
    if (err.name === 'CastError') {
      console.error('❌ Cast error:', err);
      return res.status(400).json({
        success: false,
        error: 'Invalid ID format'
      });
    }
    
    // Handle connection errors
    if (err.name === 'MongooseError' || err.name === 'MongoError') {
      console.error('❌ MongoDB error:', err);
      return res.status(500).json({
        success: false,
        error: 'Database error. Please try again later.'
      });
    }
    
    // Handle other errors
    console.error('❌ Unhandled error:', err);
    res.status(500).json({ 
      success: false, 
      error: err.message || 'Failed to create product due to internal server error'
    });
  } finally {
    session.endSession();
    console.log('🔒 Session ended');
  }
};

// ==========================================
// 4. UPDATE PRODUCT (Enhanced with full validation)
// ==========================================
export const updateProduct = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    console.log(`🔄 [updateProduct] Updating product with ID: ${id}`);
    console.log('Update data:', JSON.stringify(req.body, null, 2));

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.error('❌ Invalid product ID format:', id);
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid product ID format' 
      });
    }

    // Find existing product
    console.log('🔍 Finding product...');
    const product = await Product.findById(id);
    if (!product) {
      console.error(`❌ Product not found with ID: ${id}`);
      return res.status(404).json({ 
        success: false, 
        error: 'Product not found' 
      });
    }
    console.log(`✅ Product found: ${product.name}`);

    // Handle image updates
    if (req.files) {
      console.log('📸 Processing uploaded files...');
      if (req.files.image && req.body.image !== 'keep') {
        req.body.image = req.files.image[0].path;
        console.log(`📸 New main image: ${req.body.image}`);
      }
      if (req.files.gallery) {
        req.body.gallery = req.files.gallery.map(file => file.path);
        console.log(`📸 New gallery images: ${req.body.gallery.length} files`);
      }
      if (req.files.thumbnail) {
        req.body.thumbnail = req.files.thumbnail[0].path;
        console.log(`📸 New thumbnail: ${req.body.thumbnail}`);
      }
    }

    // If category changed, update both old and new category counts
    if (req.body.category && req.body.category !== product.category) {
      console.log(`🔄 Category changed from "${product.category}" to "${req.body.category}"`);
      
      // Decrement old category
      console.log(`📉 Decrementing product count for old category: ${product.category}`);
      const oldCategoryUpdate = await Category.findOneAndUpdate(
        { name: product.category },
        { $inc: { products: -1 } },
        { session }
      );
      
      if (!oldCategoryUpdate) {
        console.warn(`⚠️ Old category "${product.category}" not found for decrement`);
      } else {
        console.log(`✅ Old category count decremented to: ${oldCategoryUpdate.products}`);
      }

      // Increment new category
      console.log(`📈 Incrementing product count for new category: ${req.body.category}`);
      const newCategoryUpdate = await Category.findOneAndUpdate(
        { name: req.body.category },
        { $inc: { products: 1 } },
        { session }
      );
      
      if (!newCategoryUpdate) {
        console.warn(`⚠️ New category "${req.body.category}" not found for increment`);
        return res.status(400).json({
          success: false,
          error: `Category "${req.body.category}" does not exist`
        });
      } else {
        console.log(`✅ New category count incremented to: ${newCategoryUpdate.products}`);
      }
    }

    // Add admin tracking
    if (req.user) {
      req.body.updatedBy = req.user.id;
      console.log(`👤 Updated by admin: ${req.user.id}`);
    }

    // Update the product
    console.log('🔄 Updating product...');
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      req.body,
      { 
        new: true, 
        runValidators: true,
        session 
      }
    );

    if (!updatedProduct) {
      console.error(`❌ Product not found after update with ID: ${id}`);
      return res.status(404).json({ 
        success: false, 
        error: 'Product not found' 
      });
    }

    await session.commitTransaction();
    console.log(`✅ Product updated successfully: ${updatedProduct.name}`);
    console.log('✅ Transaction committed successfully');

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: updatedProduct
    });
  } catch (err) {
    await session.abortTransaction();
    console.error('❌ ERROR in updateProduct:', err);
    console.error('Stack trace:', err.stack);
    
    if (err.code === 11000) {
      const duplicateField = Object.keys(err.keyPattern)[0];
      console.error(`❌ Duplicate key error on field: ${duplicateField}`);
      return res.status(400).json({
        success: false,
        error: `Product with this ${duplicateField} already exists`
      });
    }
    
    res.status(400).json({ 
      success: false, 
      error: err.message 
    });
  } finally {
    session.endSession();
    console.log('🔒 Session ended');
  }
};

// ==========================================
// 5. DELETE PRODUCT (Enhanced)
// ==========================================
export const deleteProduct = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    console.log(`🗑️ [deleteProduct] Deleting product with ID: ${id}`);

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.error('❌ Invalid product ID format:', id);
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid product ID format' 
      });
    }

    // Find product
    console.log('🔍 Finding product...');
    const product = await Product.findById(id);
    if (!product) {
      console.error(`❌ Product not found with ID: ${id}`);
      return res.status(404).json({ 
        success: false, 
        error: 'Product not found' 
      });
    }
    console.log(`✅ Product found: ${product.name}`);

    // Decrement category product count
    console.log(`📉 Decrementing product count for category: ${product.category}`);
    const categoryUpdate = await Category.findOneAndUpdate(
      { name: product.category },
      { $inc: { products: -1 } },
      { session }
    );

    if (!categoryUpdate) {
      console.warn(`⚠️ Category "${product.category}" not found for decrement`);
    } else {
      console.log(`✅ Category product count decremented to: ${categoryUpdate.products}`);
    }

    // Delete the product
    console.log('🔄 Deleting product...');
    await Product.findByIdAndDelete(id, { session });
    console.log(`✅ Product deleted successfully: ${product.name}`);

    await session.commitTransaction();
    console.log('✅ Transaction committed successfully');

    res.json({ 
      success: true, 
      message: 'Product deleted successfully',
      deletedProduct: product
    });
  } catch (err) {
    await session.abortTransaction();
    console.error('❌ ERROR in deleteProduct:', err);
    console.error('Stack trace:', err.stack);
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  } finally {
    session.endSession();
    console.log('🔒 Session ended');
  }
};

// ==========================================
// 6. BULK UPDATE PRODUCTS (Enhanced)
// ==========================================
export const bulkUpdateProducts = async (req, res) => {
  try {
    const { ids, updateData } = req.body;
    console.log('📦 [bulkUpdateProducts] Request received');
    console.log(`📋 Product IDs: ${ids}`);
    console.log('🔄 Update data:', updateData);

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      console.error('❌ Invalid or empty product IDs array');
      return res.status(400).json({ 
        success: false, 
        error: 'Please provide an array of product IDs' 
      });
    }

    // Validate IDs
    const validIds = ids.filter(id => mongoose.Types.ObjectId.isValid(id));
    if (validIds.length === 0) {
      console.error('❌ No valid product IDs provided');
      return res.status(400).json({ 
        success: false, 
        error: 'No valid product IDs provided' 
      });
    }

    // Add admin tracking
    if (req.user) {
      updateData.updatedBy = req.user.id;
      console.log(`👤 Updated by admin: ${req.user.id}`);
    }

    console.log(`🔄 Updating ${validIds.length} products...`);
    const result = await Product.updateMany(
      { _id: { $in: validIds } },
      updateData,
      { runValidators: true }
    );

    console.log(`✅ Updated ${result.modifiedCount} products successfully`);
    console.log(`📊 Matched: ${result.matchedCount}, Modified: ${result.modifiedCount}`);

    res.json({
      success: true,
      message: `Updated ${result.modifiedCount} products successfully`,
      modifiedCount: result.modifiedCount,
      matchedCount: result.matchedCount
    });
  } catch (err) {
    console.error('❌ ERROR in bulkUpdateProducts:', err);
    console.error('Stack trace:', err.stack);
    res.status(400).json({ 
      success: false, 
      error: err.message 
    });
  }
};

// ==========================================
// 7. BULK UPDATE STOCK (Enhanced)
// ==========================================
export const bulkUpdateStock = async (req, res) => {
  try {
    const { updates } = req.body;
    console.log('📦 [bulkUpdateStock] Request received');
    console.log(`📋 Updates: ${JSON.stringify(updates, null, 2)}`);

    if (!updates || !Array.isArray(updates) || updates.length === 0) {
      console.error('❌ Invalid or empty updates array');
      return res.status(400).json({ 
        success: false, 
        error: 'Please provide an array of stock updates' 
      });
    }

    // Validate updates
    const validUpdates = updates.filter(update => 
      update.id && 
      mongoose.Types.ObjectId.isValid(update.id) && 
      typeof update.stock === 'number' &&
      update.stock >= 0
    );

    if (validUpdates.length === 0) {
      console.error('❌ No valid stock updates provided');
      return res.status(400).json({ 
        success: false, 
        error: 'No valid stock updates provided' 
      });
    }

    console.log(`🔄 Processing ${validUpdates.length} stock updates...`);
    
    const operations = validUpdates.map(({ id, stock }) => ({
      updateOne: {
        filter: { _id: id },
        update: { 
          $set: { 
            stock,
            updatedBy: req.user ? req.user.id : null
          } 
        }
      }
    }));

    const result = await Product.bulkWrite(operations);
    console.log(`✅ Updated stock for ${result.modifiedCount} products`);
    console.log(`📊 Matched: ${result.matchedCount}, Modified: ${result.modifiedCount}`);

    res.json({
      success: true,
      message: `Updated stock for ${result.modifiedCount} products`,
      modifiedCount: result.modifiedCount,
      matchedCount: result.matchedCount
    });
  } catch (err) {
    console.error('❌ ERROR in bulkUpdateStock:', err);
    console.error('Stack trace:', err.stack);
    res.status(400).json({ 
      success: false, 
      error: err.message 
    });
  }
};

// ==========================================
// 8. GET DASHBOARD STATS (Enhanced)
// ==========================================
export const getDashboardStats = async (req, res) => {
  try {
    console.log('📊 [getDashboardStats] Fetching dashboard stats...');

    // Get product stats using the model's static method
    console.log('🔄 Fetching product stats...');
    const stats = await Product.getDashboardStats();
    console.log('✅ Product stats fetched successfully');

    // Get additional stats
    console.log('🔄 Fetching additional stats...');
    
    // Recent products
    const recentProducts = await Product.find()
      .sort('-createdAt')
      .limit(5)
      .populate('createdBy', 'name email')
      .lean();
    console.log(`✅ Found ${recentProducts.length} recent products`);

    // Top selling products (by numReviews)
    const topSelling = await Product.find({ isActive: true })
      .sort('-numReviews')
      .limit(5)
      .lean();
    console.log(`✅ Found ${topSelling.length} top selling products`);

    // Category distribution
    const categoryDistribution = await Product.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    console.log(`✅ Category distribution: ${categoryDistribution.length} categories`);

    // Stock summary
    const stockSummary = await Product.aggregate([
      {
        $group: {
          _id: null,
          totalStock: { $sum: '$stock' },
          outOfStock: { $sum: { $cond: [{ $eq: ['$stock', 0] }, 1, 0] } },
          lowStock: { 
            $sum: { 
              $cond: [
                { $and: [
                  { $gt: ['$stock', 0] },
                  { $lte: ['$stock', '$lowStockAlert'] }
                ]},
                1,
                0
              ]
            }
          }
        }
      }
    ]);
    console.log('✅ Stock summary fetched');

    // Price statistics (PKR)
    const priceStats = await Product.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          avgPrice: { $avg: '$price' },
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' }
        }
      }
    ]);
    console.log('✅ Price statistics fetched');

    const response = {
      success: true,
      data: {
        ...stats,
        recentProducts,
        topSelling,
        categoryDistribution,
        stockSummary: stockSummary[0] || { totalStock: 0, outOfStock: 0, lowStock: 0 },
        priceStats: priceStats[0] || { avgPrice: 0, minPrice: 0, maxPrice: 0 }
      }
    };

    console.log('✅ Dashboard stats prepared successfully');
    res.json(response);
  } catch (err) {
    console.error('❌ ERROR in getDashboardStats:', err);
    console.error('Stack trace:', err.stack);
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
};

// ==========================================
// 9. GET PRODUCT VARIANTS (New)
// ==========================================
export const getProductVariants = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🔍 [getProductVariants] Fetching variants for product: ${id}`);

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ 
        success: false, 
        error: 'Product not found' 
      });
    }

    res.json({
      success: true,
      data: {
        hasVariations: product.hasVariations,
        variations: product.variations || []
      }
    });
  } catch (err) {
    console.error('❌ ERROR in getProductVariants:', err);
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
};

// ==========================================
// 10. TOGGLE PRODUCT STATUS (New)
// ==========================================
export const toggleProductStatus = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🔄 [toggleProductStatus] Toggling status for product: ${id}`);

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ 
        success: false, 
        error: 'Product not found' 
      });
    }

    product.isActive = !product.isActive;
    if (req.user) {
      product.updatedBy = req.user.id;
    }
    
    await product.save();
    
    console.log(`✅ Product status toggled to: ${product.isActive ? 'Active' : 'Inactive'}`);

    res.json({
      success: true,
      message: `Product ${product.isActive ? 'activated' : 'deactivated'} successfully`,
      data: product
    });
  } catch (err) {
    console.error('❌ ERROR in toggleProductStatus:', err);
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
};