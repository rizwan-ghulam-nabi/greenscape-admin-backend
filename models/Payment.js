// backend/models/Payment.js
import mongoose from 'mongoose';

const PaymentHistorySchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    required: true
  },
  changedAt: {
    type: Date,
    default: Date.now
  },
  note: {
    type: String
  },
  changedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
});

const PaymentSchema = new mongoose.Schema({
  // ✅ Reference to Order
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
    unique: true // One payment per order
  },
  
  // ✅ Reference to User (customer)
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // ✅ Payment Information
  amount: {
    type: Number,
    required: true
  },
  
  paymentMethod: {
    type: String,
    enum: ['jazzcash', 'cod', 'credit', 'paypal', 'apple_pay', 'card', 'visa', 'mastercard', 'easypaisa'],
    required: true
  },
  
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  
  // ✅ Transaction Details
  transactionId: {
    type: String,
    default: null
  },
  
  paymentDate: {
    type: Date,
    default: null
  },
  
  refundDate: {
    type: Date,
    default: null
  },
  
  // ✅ JazzCash Specific
  jazzcashDetails: {
    txnRef: { type: String },
    txnDate: { type: String },
    merchantId: { type: String }
  },
  
  // ✅ Payment History
  paymentHistory: [PaymentHistorySchema],
  
  // ✅ Audit Fields
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }

}, { timestamps: true });

// ==========================================
// ✅ METHOD: Update Payment Status
// ==========================================
PaymentSchema.methods.updatePaymentStatus = async function (newStatus, note = '', changedBy = null) {
  try {
    // Validate status
    const validStatuses = ['pending', 'paid', 'failed', 'refunded'];
    const status = String(newStatus || '').trim().toLowerCase();
    
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid payment status: "${newStatus}". Must be one of: ${validStatuses.join(', ')}`);
    }
    
    // Update payment status
    this.paymentStatus = status;
    
    // Add to history
    this.paymentHistory.push({
      status: status,
      changedAt: new Date(),
      note: note || `Payment status changed to ${status}`,
      changedBy: changedBy
    });
    
    // Auto-set dates
    if (status === 'paid') {
      this.paymentDate = new Date();
    }
    
    if (status === 'refunded') {
      this.refundDate = new Date();
    }
    
    // Save payment
    await this.save();
    
    // ✅ Update related Order
    const Order = mongoose.model('Order');
    await Order.findByIdAndUpdate(
      this.order,
      { 
        $set: { paymentStatus: status },
        $push: {
          statusHistory: {
            status: this.orderStatus,
            changedAt: new Date(),
            note: `Payment status updated to ${status}`
          }
        }
      },
      { new: true }
    );
    
    return this;
  } catch (error) {
    console.error('❌ Error in updatePaymentStatus:', error.message);
    throw error;
  }
};

// ==========================================
// ✅ METHOD: Get Payment History
// ==========================================
PaymentSchema.methods.getPaymentHistory = function () {
  return this.paymentHistory.sort((a, b) => b.changedAt - a.changedAt);
};

// ==========================================
// ✅ STATIC: Create Payment from Order
// ==========================================
PaymentSchema.statics.createFromOrder = async function (order) {
  try {
    // Check if payment already exists
    const existingPayment = await this.findOne({ order: order._id });
    if (existingPayment) {
      return existingPayment;
    }
    
    // Create new payment
    const payment = new this({
      order: order._id,
      user: order.user,
      amount: order.totalAmount,
      paymentMethod: order.paymentMethod || 'cod',
      paymentStatus: order.paymentStatus || 'pending',
      paymentHistory: [{
        status: order.paymentStatus || 'pending',
        changedAt: new Date(),
        note: 'Payment created from order'
      }]
    });
    
    await payment.save();
    
    return payment;
  } catch (error) {
    console.error('❌ Error creating payment from order:', error.message);
    throw error;
  }
};

const Payment = mongoose.model('Payment', PaymentSchema);
export default Payment;