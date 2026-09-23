// // routes/orderRoutes.js - COMPLETE FIXED VERSION
// import express from 'express';
// import Order from '../models/Order.js';
// import Product from '../models/Product.js';
// import Payment from '../models/Payment.js'; // ✅ ADD THIS IMPORT
// import auth from '../middleware/adminAuth.js';

// const router = express.Router();

// // ==========================================
// // ADMIN MIDDLEWARE
// // ==========================================
// const isAdmin = (req, res, next) => {
//   if (!req.user || !req.user.isAdmin) {
//     return res.status(403).json({ 
//       success: false,
//       error: 'Access denied. Admin privileges required.' 
//     });
//   }
//   next();
// };

// // ==========================================
// // ✅ 1. GET ORDER HISTORY
// // ==========================================
// router.get('/orders/history', auth, isAdmin, async (req, res) => {
//   try {
//     const { 
//       page = 1, 
//       limit = 10, 
//       status, 
//       payment, 
//       search, 
//       sort, 
//       date 
//     } = req.query;

//     const pageNum = parseInt(page, 10) || 1;
//     const limitNum = parseInt(limit, 10) || 10;
//     const skip = (pageNum - 1) * limitNum;

//     let filter = {};

//     if (status && status !== 'all' && status !== 'undefined') {
//       filter.orderStatus = status.toLowerCase();
//     }

//     if (payment && payment !== 'all' && payment !== 'undefined') {
//       filter.paymentStatus = payment;
//     }

//     if (date && date !== 'all' && date !== 'undefined') {
//       const days = parseInt(date, 10);
//       if (!isNaN(days)) {
//         filter.createdAt = { $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) };
//       }
//     }

//     if (search && search.trim() !== '') {
//       filter.$or = [
//         { orderNumber: { $regex: search, $options: 'i' } },
//         { 'shippingAddress.email': { $regex: search, $options: 'i' } },
//         { 'user.email': { $regex: search, $options: 'i' } }
//       ];
//     }

//     let sortOption = { createdAt: -1 };
//     if (sort === 'oldest') sortOption = { createdAt: 1 };
//     if (sort === 'highest') sortOption = { totalAmount: -1 };
//     if (sort === 'lowest') sortOption = { totalAmount: 1 };

//     let totalOrders = 0;
//     let orders = [];

//     try {
//       totalOrders = await Order.countDocuments(filter);
//       orders = await Order.find(filter)
//         .populate('user', 'firstName lastName email')
//         .sort(sortOption)
//         .skip(skip)
//         .limit(limitNum)
//         .lean();
//     } catch (dbError) {
//       console.error("❌ DATABASE ERROR:", dbError.message);
//       return res.json({
//         success: true,
//         orders: [],
//         totalOrders: 0
//       });
//     }

//     res.json({
//       success: true,
//       orders,
//       totalOrders
//     });
//   } catch (err) {
//     console.error('❌ ORDER HISTORY ERROR:', err.message);
//     res.status(200).json({
//       success: true,
//       orders: [],
//       totalOrders: 0,
//       error: err.message
//     });
//   }
// });

// // ==========================================
// // ✅ 2. GET ALL ORDERS
// // ==========================================
// router.get('/orders', auth, isAdmin, async (req, res) => {
//   try {
//     const { 
//       status, 
//       paymentStatus, 
//       startDate, 
//       endDate, 
//       search, 
//       page = 1, 
//       limit = 20 
//     } = req.query;

//     let filter = {};

//     if (status && status !== 'all' && status !== 'undefined') {
//       filter.orderStatus = status.toLowerCase();
//     }

//     if (paymentStatus && paymentStatus !== 'all' && paymentStatus !== 'undefined') {
//       filter.paymentStatus = paymentStatus.toLowerCase();
//     }

//     if (startDate || endDate) {
//       filter.createdAt = {};
//       if (startDate) filter.createdAt.$gte = new Date(startDate);
//       if (endDate) filter.createdAt.$lte = new Date(endDate);
//     }

//     if (search && search.trim() !== '') {
//       filter.$or = [
//         { orderNumber: { $regex: search, $options: 'i' } },
//         { 'shippingAddress.email': { $regex: search, $options: 'i' } },
//         { 'user.email': { $regex: search, $options: 'i' } }
//       ];
//     }

//     const skip = (parseInt(page) - 1) * parseInt(limit);
//     const totalOrders = await Order.countDocuments(filter);

//     const orders = await Order.find(filter)
//       .populate('user', 'firstName lastName email')
//       .sort({ createdAt: -1 })
//       .skip(skip)
//       .limit(parseInt(limit));

//     const analytics = {
//       totalOrders,
//       totalRevenue: await Order.aggregate([
//         { $match: filter },
//         { $group: { _id: null, total: { $sum: '$totalAmount' } } }
//       ]).then(result => result[0]?.total || 0),
//       pendingOrders: await Order.countDocuments({ orderStatus: 'pending' }),
//       processingOrders: await Order.countDocuments({ orderStatus: 'processing' }),
//       shippedOrders: await Order.countDocuments({ orderStatus: 'shipped' }),
//       deliveredOrders: await Order.countDocuments({ orderStatus: 'delivered' }),
//       cancelledOrders: await Order.countDocuments({ orderStatus: 'cancelled' }),
//     };

//     res.json({
//       success: true,
//       orders,
//       analytics,
//       pagination: {
//         page: parseInt(page),
//         limit: parseInt(limit),
//         totalPages: Math.ceil(totalOrders / parseInt(limit)),
//         totalOrders
//       }
//     });
//   } catch (err) {
//     console.error('❌ Error fetching orders:', err.message);
//     res.status(500).json({ error: err.message, orders: [], success: false });
//   }
// });

// // ==========================================
// // ✅ 3. GET SINGLE ORDER
// // ==========================================
// router.get('/orders/:id', auth, isAdmin, async (req, res) => {
//   try {
//     const order = await Order.findById(req.params.id)
//       .populate('user', 'firstName lastName email phone')
//       .populate('items.product', 'name image category');

//     if (!order) {
//       return res.status(404).json({ error: 'Order not found' });
//     }

//     const history = order.getHistory ? order.getHistory() : order.statusHistory || [];

//     res.json({
//       order,
//       history
//     });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // ==========================================
// // ✅ 4. UPDATE ORDER STATUS
// // ==========================================
// router.put('/orders/:id/status', auth, isAdmin, async (req, res) => {
//   try {
//     const { status, note } = req.body;

//     if (!status) {
//       return res.status(400).json({ error: 'Status is required' });
//     }

//     const statusValue = String(status).trim().toLowerCase();

//     const order = await Order.findById(req.params.id);
//     if (!order) {
//       return res.status(404).json({ error: 'Order not found' });
//     }

//     // Use direct update to avoid validation issues
//     const updateData = {
//       orderStatus: statusValue,
//       $push: {
//         statusHistory: {
//           status: statusValue,
//           changedAt: new Date(),
//           note: note || `Status changed to ${statusValue}`
//         }
//       }
//     };

//     if (statusValue === 'delivered') {
//       updateData.deliveredAt = new Date();
//     }

//     if (statusValue === 'cancelled') {
//       updateData.cancelledAt = new Date();
//     }

//     const updatedOrder = await Order.findByIdAndUpdate(
//       req.params.id,
//       updateData,
//       { new: true, runValidators: false }
//     );

//     if (!updatedOrder) {
//       return res.status(404).json({ error: 'Order not found' });
//     }

//     if (statusValue === 'cancelled') {
//       for (const item of updatedOrder.items) {
//         const product = await Product.findById(item.product);
//         if (product) {
//           await product.restoreStock(item.quantity);
//         }
//       }
//     }

//     res.json({
//       success: true,
//       message: `Order status updated to ${statusValue}`,
//       order: updatedOrder
//     });
//   } catch (err) {
//     res.status(400).json({ error: err.message });
//   }
// });

// // routes/orderRoutes.js - ULTIMATE FIX

// // ==========================================
// // ✅ 5. UPDATE PAYMENT STATUS - USING findByIdAndUpdate
// // ==========================================
// router.put('/orders/:id/payment', auth, isAdmin, async (req, res) => {
//   try {
//     const { paymentStatus } = req.body;
//     const { id } = req.params;

//     console.log('🔍 Payment update request:', { id, paymentStatus });

//     // ✅ Validate input
//     if (!paymentStatus) {
//       return res.status(400).json({ 
//         success: false,
//         error: 'Payment status is required' 
//       });
//     }

//     const validStatuses = ['pending', 'paid', 'failed', 'refunded'];
//     const statusValue = String(paymentStatus).trim().toLowerCase();

//     if (!validStatuses.includes(statusValue)) {
//       return res.status(400).json({ 
//         success: false,
//         error: `Invalid payment status. Must be one of: ${validStatuses.join(', ')}` 
//       });
//     }

//     // ✅ Check if order exists first
//     const orderExists = await Order.findById(id);
//     if (!orderExists) {
//       return res.status(404).json({ 
//         success: false,
//         error: 'Order not found' 
//       });
//     }

//     // ✅ Use findByIdAndUpdate - This bypasses ALL pre-save hooks
//     const updatedOrder = await Order.findByIdAndUpdate(
//       id,
//       {
//         $set: { 
//           paymentStatus: statusValue 
//         },
//         $push: {
//           statusHistory: {
//             status: statusValue,
//             changedAt: new Date(),
//             note: `Payment status updated to ${statusValue}`,
//             changedBy: req.user?._id
//           }
//         }
//       },
//       { 
//         new: true,           // Return updated document
//         runValidators: false, // Skip validation
//         lean: false          // Return mongoose document
//       }
//     );

//     console.log('✅ Payment status updated successfully');

//     return res.json({
//       success: true,
//       message: `Payment status updated to ${statusValue}`,
//       order: {
//         _id: updatedOrder._id,
//         orderNumber: updatedOrder.orderNumber,
//         paymentStatus: updatedOrder.paymentStatus,
//         orderStatus: updatedOrder.orderStatus
//       }
//     });

//   } catch (error) {
//     console.error('❌ Error updating payment status:', error.message);
//     console.error('Stack:', error.stack);
    
//     return res.status(500).json({ 
//       success: false,
//       error: error.message || 'Failed to update payment status'
//     });
//   }
// });


// // ==========================================
// // ✅ 6. DELETE ORDER
// // ==========================================
// router.delete('/orders/:id', auth, isAdmin, async (req, res) => {
//   try {
//     const order = await Order.findById(req.params.id);
//     if (!order) {
//       return res.status(404).json({ error: 'Order not found' });
//     }

//     if (order.orderStatus === 'cancelled' || order.orderStatus === 'pending') {
//       for (const item of order.items) {
//         const product = await Product.findById(item.product);
//         if (product) {
//           await product.restoreStock(item.quantity);
//         }
//       }
//     }

//     // ✅ Also delete associated payment
//     await Payment.findOneAndDelete({ order: req.params.id });

//     await Order.findByIdAndDelete(req.params.id);

//     res.json({ 
//       success: true,
//       message: 'Order deleted successfully' 
//     });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // ==========================================
// // ✅ 7. ADD ADMIN NOTE
// // ==========================================
// router.put('/orders/:id/note', auth, isAdmin, async (req, res) => {
//   try {
//     const { note } = req.body;

//     if (!note) {
//       return res.status(400).json({ error: 'Note is required' });
//     }

//     const order = await Order.findById(req.params.id);
//     if (!order) {
//       return res.status(404).json({ error: 'Order not found' });
//     }

//     order.adminNotes = note;
//     await order.save();

//     res.json({
//       success: true,
//       message: 'Admin note added successfully',
//       order
//     });
//   } catch (err) {
//     res.status(400).json({ error: err.message });
//   }
// });

// export default router;












// routes/orderRoutes.js - COMPLETE WITH EMAIL NOTIFICATIONS
import express from 'express';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Payment from '../models/Payment.js';
import auth from '../middleware/adminAuth.js';
import { sendOrderStatusEmail, sendPaymentStatusEmail } from '../utils/emailService.js';

const router = express.Router();

// ==========================================
// ADMIN MIDDLEWARE
// ==========================================
const isAdmin = (req, res, next) => {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ 
      success: false,
      error: 'Access denied. Admin privileges required.' 
    });
  }
  next();
};

// ==========================================
// ✅ 1. GET ORDER HISTORY
// ==========================================
router.get('/orders/history', auth, isAdmin, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      payment, 
      search, 
      sort, 
      date 
    } = req.query;

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    let filter = {};

    if (status && status !== 'all' && status !== 'undefined') {
      filter.orderStatus = status.toLowerCase();
    }

    if (payment && payment !== 'all' && payment !== 'undefined') {
      filter.paymentStatus = payment;
    }

    if (date && date !== 'all' && date !== 'undefined') {
      const days = parseInt(date, 10);
      if (!isNaN(days)) {
        filter.createdAt = { $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) };
      }
    }

    if (search && search.trim() !== '') {
      filter.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { 'shippingAddress.email': { $regex: search, $options: 'i' } },
        { 'user.email': { $regex: search, $options: 'i' } }
      ];
    }

    let sortOption = { createdAt: -1 };
    if (sort === 'oldest') sortOption = { createdAt: 1 };
    if (sort === 'highest') sortOption = { totalAmount: -1 };
    if (sort === 'lowest') sortOption = { totalAmount: 1 };

    let totalOrders = 0;
    let orders = [];

    try {
      totalOrders = await Order.countDocuments(filter);
      orders = await Order.find(filter)
        .populate('user', 'firstName lastName email')
        .sort(sortOption)
        .skip(skip)
        .limit(limitNum)
        .lean();
    } catch (dbError) {
      console.error("❌ DATABASE ERROR:", dbError.message);
      return res.json({
        success: true,
        orders: [],
        totalOrders: 0
      });
    }

    res.json({
      success: true,
      orders,
      totalOrders
    });
  } catch (err) {
    console.error('❌ ORDER HISTORY ERROR:', err.message);
    res.status(200).json({
      success: true,
      orders: [],
      totalOrders: 0,
      error: err.message
    });
  }
});

// ==========================================
// ✅ 2. GET ALL ORDERS
// ==========================================
router.get('/orders', auth, isAdmin, async (req, res) => {
  try {
    const { 
      status, 
      paymentStatus, 
      startDate, 
      endDate, 
      search, 
      page = 1, 
      limit = 20 
    } = req.query;

    let filter = {};

    if (status && status !== 'all' && status !== 'undefined') {
      filter.orderStatus = status.toLowerCase();
    }

    if (paymentStatus && paymentStatus !== 'all' && paymentStatus !== 'undefined') {
      filter.paymentStatus = paymentStatus.toLowerCase();
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    if (search && search.trim() !== '') {
      filter.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { 'shippingAddress.email': { $regex: search, $options: 'i' } },
        { 'user.email': { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const totalOrders = await Order.countDocuments(filter);

    const orders = await Order.find(filter)
      .populate('user', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const analytics = {
      totalOrders,
      totalRevenue: await Order.aggregate([
        { $match: filter },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]).then(result => result[0]?.total || 0),
      pendingOrders: await Order.countDocuments({ orderStatus: 'pending' }),
      processingOrders: await Order.countDocuments({ orderStatus: 'processing' }),
      shippedOrders: await Order.countDocuments({ orderStatus: 'shipped' }),
      deliveredOrders: await Order.countDocuments({ orderStatus: 'delivered' }),
      cancelledOrders: await Order.countDocuments({ orderStatus: 'cancelled' }),
    };

    res.json({
      success: true,
      orders,
      analytics,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(totalOrders / parseInt(limit)),
        totalOrders
      }
    });
  } catch (err) {
    console.error('❌ Error fetching orders:', err.message);
    res.status(500).json({ error: err.message, orders: [], success: false });
  }
});

// ==========================================
// ✅ 3. GET SINGLE ORDER
// ==========================================
router.get('/orders/:id', auth, isAdmin, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'firstName lastName email phone')
      .populate('items.product', 'name image category');

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const history = order.getHistory ? order.getHistory() : order.statusHistory || [];

    res.json({
      order,
      history
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// ✅ 4. UPDATE ORDER STATUS - WITH EMAIL
// ==========================================
router.put('/orders/:id/status', auth, isAdmin, async (req, res) => {
  try {
    const { status, note } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const statusValue = String(status).trim().toLowerCase();

    // ✅ Find order with user populated
    const order = await Order.findById(req.params.id).populate('user', 'email firstName lastName');
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Use direct update to avoid validation issues
    const updateData = {
      orderStatus: statusValue,
      $push: {
        statusHistory: {
          status: statusValue,
          changedAt: new Date(),
          note: note || `Status changed to ${statusValue}`,
          changedBy: req.user?._id
        }
      }
    };

    if (statusValue === 'delivered') {
      updateData.deliveredAt = new Date();
    }

    if (statusValue === 'cancelled') {
      updateData.cancelledAt = new Date();
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: false }
    );

    if (!updatedOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (statusValue === 'cancelled') {
      for (const item of updatedOrder.items) {
        const product = await Product.findById(item.product);
        if (product) {
          await product.restoreStock(item.quantity);
        }
      }
    }

    // ✅ SEND EMAIL NOTIFICATION
    let emailSent = false;
    try {
      const emailResult = await sendOrderStatusEmail(updatedOrder, statusValue);
      emailSent = emailResult.success;
      if (emailSent) {
        console.log(`📧 Order status email sent to ${order.user?.email}`);
      } else {
        console.log(`⚠️ Failed to send order status email: ${emailResult.error}`);
      }
    } catch (emailError) {
      console.error('❌ Email error:', emailError.message);
    }

    res.json({
      success: true,
      message: `Order status updated to ${statusValue}`,
      emailSent,
      order: updatedOrder
    });
  } catch (err) {
    console.error('❌ Error updating order status:', err.message);
    res.status(400).json({ error: err.message });
  }
});

// ==========================================
// ✅ 5. UPDATE PAYMENT STATUS - WITH EMAIL
// ==========================================
router.put('/orders/:id/payment', auth, isAdmin, async (req, res) => {
  try {
    const { paymentStatus } = req.body;
    const { id } = req.params;

    console.log('🔍 Payment update request:', { id, paymentStatus });

    // ✅ Validate input
    if (!paymentStatus) {
      return res.status(400).json({ 
        success: false,
        error: 'Payment status is required' 
      });
    }

    const validStatuses = ['pending', 'paid', 'failed', 'refunded'];
    const statusValue = String(paymentStatus).trim().toLowerCase();

    if (!validStatuses.includes(statusValue)) {
      return res.status(400).json({ 
        success: false,
        error: `Invalid payment status. Must be one of: ${validStatuses.join(', ')}` 
      });
    }

    // ✅ Find order with user populated
    const order = await Order.findById(id).populate('user', 'email firstName lastName');
    if (!order) {
      return res.status(404).json({ 
        success: false,
        error: 'Order not found' 
      });
    }

    // ✅ Use findByIdAndUpdate - This bypasses ALL pre-save hooks
    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      {
        $set: { 
          paymentStatus: statusValue 
        },
        $push: {
          statusHistory: {
            status: statusValue,
            changedAt: new Date(),
            note: `Payment status updated to ${statusValue}`,
            changedBy: req.user?._id
          }
        }
      },
      { 
        new: true,           // Return updated document
        runValidators: false, // Skip validation
        lean: false          // Return mongoose document
      }
    );

    // ✅ Update or create Payment model
    try {
      let payment = await Payment.findOne({ order: id });
      
      if (payment) {
        payment.paymentStatus = statusValue;
        if (!payment.paymentHistory) {
          payment.paymentHistory = [];
        }
        payment.paymentHistory.push({
          status: statusValue,
          changedAt: new Date(),
          note: `Payment status updated to ${statusValue}`,
          changedBy: req.user?._id
        });
        
        if (statusValue === 'paid') {
          payment.paymentDate = new Date();
        }
        if (statusValue === 'refunded') {
          payment.refundDate = new Date();
        }
        
        await payment.save();
      } else {
        payment = new Payment({
          order: order._id,
          user: order.user,
          amount: order.totalAmount,
          paymentMethod: order.paymentMethod || 'cod',
          paymentStatus: statusValue,
          paymentHistory: [{
            status: statusValue,
            changedAt: new Date(),
            note: 'Payment created from order update',
            changedBy: req.user?._id
          }]
        });
        await payment.save();
      }
    } catch (paymentError) {
      console.error('❌ Payment model error (non-critical):', paymentError.message);
      // Don't fail the request - just log the error
    }

    // ✅ SEND EMAIL NOTIFICATION (only for paid, failed, refunded)
    let emailSent = false;
    if (['paid', 'failed', 'refunded'].includes(statusValue)) {
      try {
        const emailResult = await sendPaymentStatusEmail(updatedOrder, statusValue);
        emailSent = emailResult.success;
        if (emailSent) {
          console.log(`📧 Payment status email sent to ${order.user?.email}`);
        } else {
          console.log(`⚠️ Failed to send payment status email: ${emailResult.error}`);
        }
      } catch (emailError) {
        console.error('❌ Email error:', emailError.message);
      }
    }

    console.log('✅ Payment status updated successfully');

    return res.json({
      success: true,
      message: `Payment status updated to ${statusValue}`,
      emailSent,
      order: {
        _id: updatedOrder._id,
        orderNumber: updatedOrder.orderNumber,
        paymentStatus: updatedOrder.paymentStatus,
        orderStatus: updatedOrder.orderStatus
      }
    });

  } catch (error) {
    console.error('❌ Error updating payment status:', error.message);
    console.error('Stack:', error.stack);
    
    return res.status(500).json({ 
      success: false,
      error: error.message || 'Failed to update payment status'
    });
  }
});

// ==========================================
// ✅ 6. DELETE ORDER
// ==========================================
router.delete('/orders/:id', auth, isAdmin, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.orderStatus === 'cancelled' || order.orderStatus === 'pending') {
      for (const item of order.items) {
        const product = await Product.findById(item.product);
        if (product) {
          await product.restoreStock(item.quantity);
        }
      }
    }

    // ✅ Also delete associated payment
    await Payment.findOneAndDelete({ order: req.params.id });

    await Order.findByIdAndDelete(req.params.id);

    res.json({ 
      success: true,
      message: 'Order deleted successfully' 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// ✅ 7. ADD ADMIN NOTE
// ==========================================
router.put('/orders/:id/note', auth, isAdmin, async (req, res) => {
  try {
    const { note } = req.body;

    if (!note) {
      return res.status(400).json({ error: 'Note is required' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    order.adminNotes = note;
    await order.save();

    res.json({
      success: true,
      message: 'Admin note added successfully',
      order
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;