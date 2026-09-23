// backend/routes/emailRoutes.js
import express from 'express';
import { sendEmail } from '../utils/emailService.js';
import Order from '../models/Order.js';

const router = express.Router();

// ==========================================
// ✅ SEND TEST EMAIL
// ==========================================
router.post('/test', async (req, res) => {
  try {
    const { to, subject, message } = req.body;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2B7A4B;">GreenScape Test Email</h2>
        <p>${message || 'This is a test email from GreenScape.'}</p>
      </div>
    `;
    
    const result = await sendEmail(to || process.env.EMAIL_USER, subject || 'Test Email', html);
    
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// ✅ SEND ORDER STATUS EMAIL (Manual Trigger)
// ==========================================
router.post('/order-status/:orderId', async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId)
      .populate('user', 'firstName lastName email');
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    const { getOrderStatusEmailTemplate } = await import('../utils/emailTemplates.js');
    const template = getOrderStatusEmailTemplate(order, order.orderStatus);
    
    const result = await sendEmail(
      order.user.email,
      template.subject,
      template.html
    );
    
    res.json({
      success: result.success,
      message: result.success ? 'Email sent successfully' : 'Email failed'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;