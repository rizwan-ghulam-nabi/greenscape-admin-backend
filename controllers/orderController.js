// controllers/orderController.js - FIXED

import { sendEmail } from '../utils/emailService.js';
import { getOrderStatusEmailTemplate } from '../utils/emailTemplates.js';


import Order from '../models/Order.js';
import Product from '../models/Product.js';

// ==========================================
// 1. GET ALL ORDERS (With Filters & Analytics)
// ==========================================
export const getAllOrders = async (req, res) => {
  try {
    const { status, paymentStatus, startDate, endDate, search, page = 1, limit = 20 } = req.query;
    let filter = {};

    if (status) filter.orderStatus = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }
    if (search) {
      filter.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { 'shippingAddress.email': { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    const totalOrders = await Order.countDocuments(filter);

    const orders = await Order.find(filter)
      .populate('user', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    // const analytics = {
    //   totalOrders,
    //   totalRevenue: await Order.aggregate([
    //     { $match: filter },
    //     { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    //   ]).then(result => result[0]?.total || 0),
    //   pendingOrders: await Order.countDocuments({ orderStatus: 'pending' }),
    //   processingOrders: await Order.countDocuments({ orderStatus: 'processing' }),
    //   shippedOrders: await Order.countDocuments({ orderStatus: 'shipped' }),
    //   deliveredOrders: await Order.countDocuments({ orderStatus: 'delivered' }),
    //   cancelledOrders: await Order.countDocuments({ orderStatus: 'cancelled' }),
    // };

    // new version 24/09/2026

    const [totalRevenueRes, pending, processing, shipped, delivered, cancelled] =
  await Promise.all([
    Order.aggregate([{ $match: filter }, { $group: { _id: null, total: { $sum: '$totalAmount' } } }]),
    Order.countDocuments({ orderStatus: 'pending' }),
    Order.countDocuments({ orderStatus: 'processing' }),
    Order.countDocuments({ orderStatus: 'shipped' }),
    Order.countDocuments({ orderStatus: 'delivered' }),
    Order.countDocuments({ orderStatus: 'cancelled' }),
  ]);

const analytics = {
  totalOrders,
  totalRevenue: totalRevenueRes[0]?.total || 0,
  pendingOrders: pending,
  processingOrders: processing,
  shippedOrders: shipped,
  deliveredOrders: delivered,
  cancelledOrders: cancelled,
};


    res.json({
      orders,
      analytics,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(totalOrders / limit),
        totalOrders
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ==========================================
// 2. GET SINGLE ORDER (With History)
// ==========================================
export const getSingleOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'firstName lastName email phone')
      .populate('items.product', 'name image category');

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({
      order,
      history: order.getHistory()
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// export const updateOrderStatus = async (req, res) => {
//   try {
//     const { status, note } = req.body;
    
//     if (!status) {
//       return res.status(400).json({ error: 'Status is required' });
//     }
    
//     const order = await Order.findById(req.params.id)
//       .populate('user', 'firstName lastName email phone');
    
//     if (!order) {
//       return res.status(404).json({ error: 'Order not found' });
//     }
    
//     // Update order status
//     order.orderStatus = status;
    
//     order.statusHistory.push({
//       status: status,
//       changedAt: new Date(),
//       note: note || `Status changed to ${status}`
//     });
    
//     // Set special dates
//     if (status === 'delivered') {
//       order.deliveredAt = new Date();
//     }
    
//     if (status === 'cancelled') {
//       order.cancelledAt = new Date();
//     }
    
//     await order.save();
    
//     // ✅ SEND EMAIL TO CUSTOMER
//     if (order.user?.email) {
//       const template = getOrderStatusEmailTemplate(order, status);
      
//       await sendEmail(
//         order.user.email,
//         template.subject,
//         template.html
//       );
      
//       console.log(`📧 Email sent to ${order.user.email} for order ${order.orderNumber}`);
//     }
    
//     res.json({
//       success: true,
//       message: `Order status updated to ${status}`,
//       emailSent: true,
//       order
//     });
//   } catch (err) {
//     console.error('Error updating order status:', err);
//     res.status(400).json({ error: err.message });
//   }
// };


// new version 24/09/2026
export const updateOrderStatus = async (req, res) => {
  try {
    const { status, note } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const order = await Order.findById(req.params.id)
      .populate('user', 'firstName lastName email phone');

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Update order status
    order.orderStatus = status;

    order.statusHistory.push({
      status: status,
      changedAt: new Date(),
      note: note || `Status changed to ${status}`,
    });

    if (status === 'delivered') {
      order.deliveredAt = new Date();
    }

    if (status === 'cancelled') {
      order.cancelledAt = new Date();
    }

    await order.save();

    // ✅ Fire-and-forget the email — response returns immediately
    if (order.user?.email) {
      const template = getOrderStatusEmailTemplate(order, status);

      waitUntil(
        sendEmail(order.user.email, template.subject, template.html)
          .then((r) =>
            console.log(
              `📧 ${order.orderNumber}:`,
              r.success ? 'sent' : `failed: ${r.error}`
            )
          )
          .catch((e) => console.error('📧 send failed:', e.message))
      );
    }

    res.json({
      success: true,
      message: `Order status updated to ${status}`,
      emailQueued: !!order.user?.email,
      order,
    });
  } catch (err) {
    console.error('Error updating order status:', err);
    res.status(400).json({ error: err.message });
  }
};

// ==========================================
// 4. UPDATE PAYMENT STATUS
// ==========================================
export const updatePaymentStatus = async (req, res) => {
  try {
    const { paymentStatus } = req.body;
    if (!paymentStatus) {
      return res.status(400).json({ error: 'Payment status is required' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    order.paymentStatus = paymentStatus;
    order.statusHistory.push({
      status: order.orderStatus,
      changedAt: new Date(),
      note: `Payment status updated to ${paymentStatus}`
    });

    await order.save();

    res.json({
      message: `Payment status updated to ${paymentStatus}`,
      order
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ==========================================
// 5. DELETE ORDER (Admin Only)
// ==========================================
export const deleteOrder = async (req, res) => {
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

    await Order.findByIdAndDelete(req.params.id);
    res.json({ message: 'Order deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ==========================================
// 6. GET ORDER STATISTICS (Dashboard Overview)
// ==========================================
export const getOrderStats = async (req, res) => {
  try {
    const now = new Date();
    const startOfDay = new Date(now.setHours(0, 0, 0, 0));
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    const startOfMonth = new Date(now.setDate(1));

    const [totalOrders, totalRevenue, todayOrders, weekOrders, monthOrders] = await Promise.all([
      Order.countDocuments(),
      Order.aggregate([{ $group: { _id: null, total: { $sum: '$totalAmount' } } }]),
      Order.countDocuments({ createdAt: { $gte: startOfDay } }),
      Order.countDocuments({ createdAt: { $gte: startOfWeek } }),
      Order.countDocuments({ createdAt: { $gte: startOfMonth } })
    ]);

    res.json({
      totalOrders,
      totalRevenue: totalRevenue[0]?.total || 0,
      today: todayOrders,
      thisWeek: weekOrders,
      thisMonth: monthOrders
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ==========================================
// 7. ADD ADMIN NOTE TO ORDER
// ==========================================
export const addAdminNote = async (req, res) => {
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
      message: 'Admin note added successfully',
      order
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};




