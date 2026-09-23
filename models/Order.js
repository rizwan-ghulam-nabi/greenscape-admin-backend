// // models/Order.js - FIXED
// import mongoose from 'mongoose';

// const OrderItemSchema = new mongoose.Schema({
//   product: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Product',
//     required: true
//   },
//   name: { type: String, required: true },
//   price: { type: Number, required: true },
//   quantity: { type: Number, required: true },
//   image: { type: String }
// });

// const OrderSchema = new mongoose.Schema({
//   user: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',
//     required: true
//   },
//   orderNumber: {
//     type: String,
//     required: true,
//     unique: true
//   },
//   items: [OrderItemSchema],
  
//   shippingAddress: {
//     firstName: { type: String, required: true },
//     lastName: { type: String, required: true },
//     email: { type: String, required: true },
//     phone: { type: String, required: true },
//     address: { type: String, required: true },
//     city: { type: String, required: true },
//     state: { type: String, required: true },
//     zip: { type: String, required: true },
//     country: { type: String, required: true }
//   },

//   // ✅ FIXED: Include ALL valid payment methods (old + new)
//   paymentMethod: {
//     type: String,
//     enum: ['jazzcash', 'cod', 'credit', 'paypal', 'apple_pay', 'card', 'visa', 'mastercard', 'easypaisa'],
//     default: 'cod'
//   },

//   paymentStatus: {
//     type: String,
//     enum: ['pending', 'paid', 'failed', 'refunded'],
//     default: 'pending'
//   },

//   orderStatus: {
//     type: String,
//     enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
//     default: 'pending'
//   },

//   totalAmount: { type: Number, required: true },

//   statusHistory: [{
//     status: {
//       type: String,
//       enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled']
//     },
//     changedAt: { type: Date, default: Date.now },
//     note: { type: String }
//   }],

//   trackingNumber: { type: String },
//   estimatedDelivery: { type: Date },
//   deliveredAt: { type: Date },

//   cancelledAt: { type: Date },
//   cancellationReason: { type: String },
//   refundedAt: { type: Date },

//   adminNotes: { type: String }

// }, { timestamps: true });

// // ✅ FIXED: Auto-generate Order Number before saving
// OrderSchema.pre('save', async function (next) {
//   try {
//     if (!this.orderNumber) {
//       const date = new Date();
//       const year = date.getFullYear().toString().slice(-2);
//       const month = (date.getMonth() + 1).toString().padStart(2, '0');
//       const day = date.getDate().toString().padStart(2, '0');
      
//       const random = Math.floor(1000 + Math.random() * 9000);
      
//       this.orderNumber = `GS-${year}${month}${day}-${random}`;
//     }
//     next();
//   } catch (error) {
//     next(error);
//   }
// });

// // ✅ FIXED: Update Order Status Method
// OrderSchema.methods.updateStatus = async function (newStatus, note = '') {
//   try {
//     // Trim and convert to lowercase
//     const status = String(newStatus || '').trim().toLowerCase();
    
//     // Validate status
//     const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
//     if (!validStatuses.includes(status)) {
//       throw new Error(`Invalid status: "${newStatus}". Must be one of: ${validStatuses.join(', ')}`);
//     }

//     // Update status
//     this.orderStatus = status;
    
//     // Add to history
//     this.statusHistory.push({
//       status: status,
//       changedAt: new Date(),
//       note: note || `Status changed to ${status}`
//     });

//     // Handle additional fields
//     if (status === 'delivered') {
//       this.deliveredAt = new Date();
//     }

//     if (status === 'cancelled') {
//       this.cancelledAt = new Date();
//     }

//     // ✅ FIXED: Use updateOne to bypass full validation
//     // This allows updating status without re-validating other fields
//     await Order.updateOne(
//       { _id: this._id },
//       { 
//         $set: { 
//           orderStatus: status,
//           statusHistory: this.statusHistory,
//           ...(status === 'delivered' ? { deliveredAt: new Date() } : {}),
//           ...(status === 'cancelled' ? { cancelledAt: new Date() } : {})
//         }
//       }
//     );

//     return this;
//   } catch (error) {
//     console.error('❌ Error in updateStatus:', error.message);
//     throw error;
//   }
// };

// OrderSchema.methods.getHistory = function () {
//   return this.statusHistory.sort((a, b) => b.changedAt - a.changedAt);
// };

// const Order = mongoose.model('Order', OrderSchema);
// export default Order;






















// models/Order.js - COMPLETE FIXED VERSION

import mongoose from 'mongoose';

const OrderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
  image: { type: String }
});

const OrderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  orderNumber: {
    type: String,
    required: true,
    unique: true
  },
  items: [OrderItemSchema],
  
  shippingAddress: {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zip: { type: String, required: true },
    country: { type: String, required: true }
  },

  paymentMethod: {
    type: String,
    enum: ['jazzcash', 'cod', 'credit', 'paypal', 'apple_pay', 'card', 'visa', 'mastercard', 'easypaisa'],
    default: 'cod'
  },

  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },

  orderStatus: {
    type: String,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },

  totalAmount: { type: Number, required: true },

  statusHistory: [{
    status: {
      type: String,
      enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled']
    },
    changedAt: { type: Date, default: Date.now },
    note: { type: String }
  }],

  trackingNumber: { type: String },
  estimatedDelivery: { type: Date },
  deliveredAt: { type: Date },

  cancelledAt: { type: Date },
  cancellationReason: { type: String },
  refundedAt: { type: Date },

  adminNotes: { type: String }

}, { timestamps: true });

// ==========================================
// ✅ FIXED: Auto-generate Order Number before saving
// ==========================================
OrderSchema.pre('save', function(next) {
  try {
    if (!this.orderNumber) {
      const date = new Date();
      const year = date.getFullYear().toString().slice(-2);
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      
      const random = Math.floor(1000 + Math.random() * 9000);
      
      this.orderNumber = `GS-${year}${month}${day}-${random}`;
    }
    next();
  } catch (error) {
    next(error);
  }
});

// ✅ FIXED: Update Order Status Method
OrderSchema.methods.updateStatus = async function (newStatus, note = '') {
  try {
    const status = String(newStatus || '').trim().toLowerCase();
    
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status: "${newStatus}". Must be one of: ${validStatuses.join(', ')}`);
    }

    this.orderStatus = status;
    
    this.statusHistory.push({
      status: status,
      changedAt: new Date(),
      note: note || `Status changed to ${status}`
    });

    if (status === 'delivered') {
      this.deliveredAt = new Date();
    }

    if (status === 'cancelled') {
      this.cancelledAt = new Date();
    }

    await this.save();
    return this;
  } catch (error) {
    console.error('❌ Error in updateStatus:', error.message);
    throw error;
  }
};

OrderSchema.methods.getHistory = function () {
  return this.statusHistory.sort((a, b) => b.changedAt - a.changedAt);
};

const Order = mongoose.model('Order', OrderSchema);
export default Order;