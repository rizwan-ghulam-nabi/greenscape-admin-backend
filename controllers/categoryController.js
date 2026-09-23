// // backend/controllers/categoryController.js
// import Category from "../models/Category.js";

// // ==========================================
// // 1. GET ALL CATEGORIES
// // ==========================================
// export const getCategories = async (req, res) => {
//   try {
//     const categories = await Category.find().sort({ createdAt: -1 });
//     res.json(categories);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };

// // ==========================================
// // 2. GET SINGLE CATEGORY
// // ==========================================
// export const getCategoryById = async (req, res) => {
//   try {
//     const category = await Category.findById(req.params.id);
//     if (!category) {
//       return res.status(404).json({ error: 'Category not found' });
//     }
//     res.json(category);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };

// // ==========================================
// // 3. CREATE NEW PRODUCT ✅ (UPDATES CATEGORY COUNT)
// // ==========================================
// export const createProduct = async (req, res) => {
//   try {
//     const productData = req.body;
    
//     // 1. Create and save the product
//     const product = new Product(productData);
//     await product.save();

//     // 2. ✅ CRITICAL: Increment the product count for the assigned category
//     // This finds the Category with the matching name and adds +1 to "products"
//     await Category.findOneAndUpdate(
//       { name: product.category },
//       { $inc: { products: 1 } }
//     );

//     res.status(201).json(product);
//   } catch (err) {
//     console.error('Create Product Error:', err);
//     res.status(400).json({ error: err.message });
//   }
// };
// // ==========================================
// // 3. CREATE NEW CATEGORY ✅
// // ==========================================
// export const createCategory = async (req, res) => {
//   try {
//     const { name, description, image, status } = req.body;

//     // Check if category already exists
//     const existing = await Category.findOne({ name });
//     if (existing) {
//       return res.status(400).json({ error: 'A category with this name already exists.' });
//     }

//     // ✅ GENERATE SLUG FROM NAME
//     const slug = name
//       .toLowerCase()
//       .replace(/[^a-z0-9]+/g, '-') // Replace spaces & special chars with -
//       .replace(/^-|-$/g, '');      // Remove leading/trailing hyphens

//     const category = new Category({
//       name,
//       slug,
//       description,
//       image: image || 'https://via.placeholder.com/100',
//       status: status || 'Active'
//     });

//     const savedCategory = await category.save();
//     res.status(201).json(savedCategory);
//   } catch (err) {
//     console.error('Create Category Error:', err);
//     res.status(400).json({ error: err.message });
//   }
// };

// // ==========================================
// // 4. UPDATE CATEGORY
// // ==========================================
// export const updateCategory = async (req, res) => {
//   try {
//     const { name, description, image, status } = req.body;

//     // If name is being changed, ensure it's not a duplicate
//     if (name) {
//       const existing = await Category.findOne({ 
//         name, 
//         _id: { $ne: req.params.id } 
//       });
//       if (existing) {
//         return res.status(400).json({ error: 'A category with this name already exists.' });
//       }
//     }

//     // ✅ GENERATE NEW SLUG IF NAME IS UPDATED
//     let slug;
//     if (name) {
//       slug = name
//         .toLowerCase()
//         .replace(/[^a-z0-9]+/g, '-')
//         .replace(/^-|-$/g, '');
//     }

//     const category = await Category.findByIdAndUpdate(
//       req.params.id,
//       { 
//         name, 
//         slug,
//         description, 
//         image, 
//         status 
//       },
//       { new: true, runValidators: true }
//     );

//     if (!category) {
//       return res.status(404).json({ error: 'Category not found' });
//     }

//     res.json(category);
//   } catch (err) {
//     res.status(400).json({ error: err.message });
//   }
// };

// // ==========================================
// // 5. DELETE CATEGORY
// // ==========================================
// export const deleteCategory = async (req, res) => {
//   try {
//     const category = await Category.findByIdAndDelete(req.params.id);
//     if (!category) {
//       return res.status(404).json({ error: 'Category not found' });
//     }
//     res.json({ message: 'Category deleted successfully' });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };











import Category from "../models/Category.js";
import Product from "../models/Product.js"; // ✅ ADD THIS IMPORT

// ==========================================
// 1. GET ALL CATEGORIES
// ==========================================
export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 });
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ==========================================
// 2. GET SINGLE CATEGORY
// ==========================================
export const getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.json(category);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ==========================================
// 3. CREATE NEW CATEGORY ✅
// ==========================================
export const createCategory = async (req, res) => {
  try {
    const { name, description, image, status } = req.body;

    // Check if category already exists
    const existing = await Category.findOne({ name });
    if (existing) {
      return res.status(400).json({ error: 'A category with this name already exists.' });
    }

    // ✅ GENERATE SLUG FROM NAME
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-') // Replace spaces & special chars with -
      .replace(/^-|-$/g, '');      // Remove leading/trailing hyphens

    const category = new Category({
      name,
      slug,
      description,
      image: image || 'https://via.placeholder.com/100',
      status: status || 'Active'
    });

    const savedCategory = await category.save();
    res.status(201).json(savedCategory);
  } catch (err) {
    console.error('Create Category Error:', err);
    res.status(400).json({ error: err.message });
  }
};

// ==========================================
// 4. UPDATE CATEGORY
// ==========================================
export const updateCategory = async (req, res) => {
  try {
    const { name, description, image, status } = req.body;

    // If name is being changed, ensure it's not a duplicate
    if (name) {
      const existing = await Category.findOne({ 
        name, 
        _id: { $ne: req.params.id } 
      });
      if (existing) {
        return res.status(400).json({ error: 'A category with this name already exists.' });
      }
    }

    // ✅ GENERATE NEW SLUG IF NAME IS UPDATED
    let slug;
    if (name) {
      slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
    }

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { 
        name, 
        slug,
        description, 
        image, 
        status 
      },
      { new: true, runValidators: true }
    );

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json(category);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ==========================================
// 5. DELETE CATEGORY
// ==========================================
export const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.json({ message: 'Category deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ==========================================
// 6. GET CATEGORY WITH PRODUCT COUNT
// ==========================================
export const getCategoryWithProductCount = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Get product count for this category
    const productCount = await Product.countDocuments({ 
      category: category.name,
      isActive: true 
    });

    res.json({
      ...category.toObject(),
      productCount
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};