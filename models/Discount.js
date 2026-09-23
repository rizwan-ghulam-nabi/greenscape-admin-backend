// backend/models/Discount.js
import mongoose from 'mongoose';

const DiscountSchema = new mongoose.Schema(
  {
    // Basic Info
    name: { 
      type: String, 
      required: true, 
      trim: true 
    },
    description: { 
      type: String, 
      trim: true 
    },
    code: { 
      type: String, 
      required: true, 
      unique: true, 
      uppercase: true,
      trim: true 
    },
    
    // Discount Type
    type: { 
      type: String, 
      enum: ['percentage', 'fixed'], 
      required: true,
      default: 'percentage'
    },
    value: { 
      type: Number, 
      required: true,
      min: 0
    },
    
    // Applicable To
    appliesTo: {
      type: String,
      enum: ['all_products', 'specific_products', 'categories', 'new_arrivals'],
      default: 'all_products'
    },
    products: [{ 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Product' 
    }],
    categories: [{ 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Category' 
    }],
    
    // Restrictions
    minPurchase: { 
      type: Number, 
      default: 0 
    },
    maxUses: { 
      type: Number, 
      default: 0  // 0 = unlimited
    },
    usedCount: { 
      type: Number, 
      default: 0 
    },
    maxUsesPerCustomer: {
      type: Number,
      default: 1
    },
    
    // Date Range
    startDate: { 
      type: Date, 
      required: true 
    },
    endDate: { 
      type: Date, 
      required: true 
    },
    
    // Status
    isActive: { 
      type: Boolean, 
      default: true 
    },
    
    // Image
    image: {
      type: String,
      default: null
    },
    
    // Banner/Label
    badgeText: {
      type: String,
      default: null
    },
    
    // Metadata
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  { 
    timestamps: true 
  }
);

// ✅ Virtual: Get discount status
DiscountSchema.virtual('status').get(function () {
  const now = new Date();
  
  if (!this.isActive) return 'inactive';
  if (now < this.startDate) return 'scheduled';
  if (now > this.endDate) return 'expired';
  return 'active';
});

// ✅ Ensure virtuals are included in JSON
DiscountSchema.set('toJSON', { virtuals: true });
DiscountSchema.set('toObject', { virtuals: true });


const Discount = mongoose.model('Discount', DiscountSchema);
export default Discount;