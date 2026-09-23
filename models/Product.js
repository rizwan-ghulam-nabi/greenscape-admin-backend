import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, unique: true, lowercase: true },
  desc: { type: String, required: true },
  shortDesc: { type: String },
  price: { type: Number, required: true, min: 0 }, // ✅ PKR (Rs.)
  oldPrice: { type: Number, min: 0 }, // ✅ PKR (Rs.)
  costPrice: { type: Number, min: 0 }, // ✅ PKR (Rs.)
  category: { type: String, required: true, index: true },
  subCategory: { type: String, index: true },
  tags: [{ type: String, index: true }],
  stock: { type: Number, default: 0, min: 0 },
  sku: { type: String, unique: true, index: true },
  lowStockAlert: { type: Number, default: 5 },
  image: { type: String, required: true },
  gallery: [{ type: String }],
  thumbnail: { type: String },
  isActive: { type: Boolean, default: true, index: true },
  isFeatured: { type: Boolean, default: false, index: true },
  isBestSeller: { type: Boolean, default: false, index: true },
  isNewArrival: { type: Boolean, default: false },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  numReviews: { type: Number, default: 0 },
  reviewIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Review' }],
  saleStartDate: { type: Date },
  saleEndDate: { type: Date },
  searchKeywords: [{ type: String }],
  metaTitle: { type: String, maxlength: 60 },
  metaDescription: { type: String, maxlength: 160 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notes: { type: String },
  weight: { type: Number, min: 0 },
  dimensions: {
    length: { type: Number, min: 0 },
    width: { type: Number, min: 0 },
    height: { type: Number, min: 0 }
  },
  hasVariations: { type: Boolean, default: false },
  variations: [{
    sku: { type: String, required: true },
    price: { type: Number, required: true }, // ✅ PKR (Rs.)
    stock: { type: Number, default: 0 },
    attributes: { type: Map, of: String },
    image: String
  }]
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ✅ Virtuals (computed fields - no need for pre('save'))
ProductSchema.virtual('discountPercentage').get(function () {
  if (!this.oldPrice || this.oldPrice <= this.price) return 0;
  return Math.round(((this.oldPrice - this.price) / this.oldPrice) * 100);
});

ProductSchema.virtual('isOnSale').get(function () {
  const now = new Date();
  if (this.saleStartDate && this.saleEndDate) {
    return now >= this.saleStartDate && now <= this.saleEndDate;
  }
  return this.oldPrice && this.oldPrice > this.price;
});

ProductSchema.virtual('isLowStock').get(function () {
  return this.stock > 0 && this.stock <= this.lowStockAlert;
});

ProductSchema.virtual('profitMargin').get(function () {
  if (!this.costPrice || this.costPrice === 0) return 0;
  return Math.round(((this.price - this.costPrice) / this.price) * 100);
});

// ✅ Methods (no pre('save') needed)
ProductSchema.methods.reduceStock = async function (quantity) {
  if (this.stock < quantity) {
    throw new Error(`Insufficient stock for ${this.name}. Available: ${this.stock}`);
  }
  this.stock -= quantity;
  await this.save();
  return this;
};

ProductSchema.methods.restoreStock = async function (quantity) {
  this.stock += quantity;
  await this.save();
  return this;
};

const Product = mongoose.model('Product', ProductSchema);
export default Product;