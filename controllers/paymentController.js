// backend/controllers/paymentController.js
import Payment from '../models/Payment.js';
import Order from '../models/Order.js';

// ==========================================
// ✅ GET ALL PAYMENTS (Admin)
// ==========================================
export const getAllPayments = async (req, res) => {
  try {
    const { status, paymentMethod, search, page = 1, limit = 20 } = req.query;
    
    let filter = {};
    
    if (status && status !== 'all') {
      filter.paymentStatus = status;
    }
    
    if (paymentMethod && paymentMethod !== 'all') {
      filter.paymentMethod = paymentMethod;
    }
    
    if (search && search.trim() !== '') {
      filter.$or = [
        { transactionId: { $regex: search, $options: 'i' } },
        { 'order.orderNumber': { $regex: search, $options: 'i' } }
      ];
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const totalPayments = await Payment.countDocuments(filter);
    
    const payments = await Payment.find(filter)
      .populate('order', 'orderNumber totalAmount')
      .populate('user', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const analytics = {
      totalPayments,
      totalRevenue: await Payment.aggregate([
        { $match: { paymentStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]).then(result => result[0]?.total || 0),
      pendingPayments: await Payment.countDocuments({ paymentStatus: 'pending' }),
      paidPayments: await Payment.countDocuments({ paymentStatus: 'paid' }),
      failedPayments: await Payment.countDocuments({ paymentStatus: 'failed' }),
      refundedPayments: await Payment.countDocuments({ paymentStatus: 'refunded' })
    };
    
    res.json({
      success: true,
      payments,
      analytics,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(totalPayments / parseInt(limit)),
        totalPayments
      }
    });
  } catch (err) {
    console.error('Error fetching payments:', err);
    res.status(500).json({ error: err.message });
  }
};

// ==========================================
// ✅ GET SINGLE PAYMENT
// ==========================================
export const getPaymentById = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('order', 'orderNumber totalAmount shippingAddress')
      .populate('user', 'firstName lastName email phone');
    
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    
    res.json({
      success: true,
      payment,
      history: payment.getPaymentHistory()
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ==========================================
// ✅ CREATE PAYMENT FOR ORDER
// ==========================================
export const createPayment = async (req, res) => {
  try {
    const { orderId, amount, paymentMethod, paymentStatus = 'pending' } = req.body;
    
    // Find order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    // Create payment from order
    const payment = await Payment.createFromOrder(order);
    
    // Update payment status if provided
    if (paymentStatus && paymentStatus !== 'pending') {
      await payment.updatePaymentStatus(paymentStatus, 'Payment created with status', req.user._id);
    }
    
    res.status(201).json({
      success: true,
      message: 'Payment created successfully',
      payment
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ==========================================
// ✅ UPDATE PAYMENT STATUS (Admin)
// ==========================================
export const updatePaymentStatus = async (req, res) => {
  try {
    const { paymentStatus, note } = req.body;
    
    if (!paymentStatus) {
      return res.status(400).json({ error: 'Payment status is required' });
    }
    
    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    
    // Update payment status using model method
    await payment.updatePaymentStatus(paymentStatus, note, req.user._id);
    
    res.json({
      success: true,
      message: `Payment status updated to ${paymentStatus}`,
      payment
    });
  } catch (err) {
    console.error('Error updating payment status:', err);
    res.status(400).json({ error: err.message });
  }
};

// ==========================================
// ✅ DELETE PAYMENT
// ==========================================
export const deletePayment = async (req, res) => {
  try {
    const payment = await Payment.findByIdAndDelete(req.params.id);
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    
    res.json({ message: 'Payment deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ==========================================
// ✅ GET PAYMENT STATISTICS
// ==========================================
export const getPaymentStats = async (req, res) => {
  try {
    const [totalPayments, totalRevenue, todayPayments, pendingPayments] = await Promise.all([
      Payment.countDocuments(),
      Payment.aggregate([
        { $match: { paymentStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Payment.countDocuments({
        paymentStatus: 'paid',
        paymentDate: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
      }),
      Payment.countDocuments({ paymentStatus: 'pending' })
    ]);
    
    res.json({
      totalPayments,
      totalRevenue: totalRevenue[0]?.total || 0,
      todayPayments,
      pendingPayments
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};