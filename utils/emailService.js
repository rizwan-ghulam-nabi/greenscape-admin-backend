import { Resend } from 'resend';
import {
  getOrderStatusEmailTemplate,
  getPaymentStatusEmailTemplate,
} from './emailTemplates.js';

const isDev = process.env.NODE_ENV !== 'production';
const log = (...args) => { if (isDev) console.log(...args); };
const logErr = (...args) => console.error(...args);

// ✅ Lazily init Resend
let resendClient = null;

const getResend = () => {
  if (resendClient) return resendClient;
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  resendClient = new Resend(key);
  return resendClient;
};

// ✅ Sender config
const getFromAddress = () => {
  // Free tier default; change after verifying your own domain
  return process.env.EMAIL_FROM || 'GreenScape <onboarding@resend.dev>';
};

// ==========================================
// GET CUSTOMER EMAIL
// ==========================================
const getCustomerEmail = (order) => {
  log('🔍 Looking for customer email in order:', order?.orderNumber);
  if (order?.user?.email) return order.user.email;
  if (order?.shippingAddress?.email) return order.shippingAddress.email;
  logErr('❌ No email found in order!');
  return null;
};

// ==========================================
// SEND ORDER STATUS EMAIL
// ==========================================
export const sendOrderStatusEmail = async (order, status) => {
  try {
    log('📧 sendOrderStatusEmail:', order?.orderNumber, '| Status:', status);

    const customerEmail = getCustomerEmail(order);
    if (!customerEmail) {
      return { success: false, error: 'No customer email found' };
    }

    const customerName =
      order?.user?.firstName ||
      order?.shippingAddress?.firstName ||
      'Customer';

    const plain = order.toObject ? order.toObject() : order;
    const orderWithName = {
      ...plain,
      user: {
        ...(plain.user || {}),
        firstName: customerName,
        email: customerEmail,
      },
    };

    const template = getOrderStatusEmailTemplate(orderWithName, status);
    return await sendEmail(customerEmail, template.subject, template.html);
  } catch (error) {
    logErr('❌ Error sending order status email:', error.message);
    return { success: false, error: error.message };
  }
};

// ==========================================
// SEND PAYMENT STATUS EMAIL
// ==========================================
export const sendPaymentStatusEmail = async (order, paymentStatus) => {
  try {
    log('📧 sendPaymentStatusEmail:', order?.orderNumber, '| Payment:', paymentStatus);

    const customerEmail = getCustomerEmail(order);
    if (!customerEmail) {
      return { success: false, error: 'No customer email found' };
    }

    const customerName =
      order?.user?.firstName ||
      order?.shippingAddress?.firstName ||
      'Customer';

    const plain = order.toObject ? order.toObject() : order;
    const orderWithName = {
      ...plain,
      user: {
        ...(plain.user || {}),
        firstName: customerName,
        email: customerEmail,
      },
    };

    const template = getPaymentStatusEmailTemplate(orderWithName, paymentStatus);
    return await sendEmail(customerEmail, template.subject, template.html);
  } catch (error) {
    logErr('❌ Error sending payment status email:', error.message);
    return { success: false, error: error.message };
  }
};

// ==========================================
// SEND EMAIL (core) — using Resend
// ==========================================
export const sendEmail = async (to, subject, html) => {
  try {
    const resend = getResend();
    if (!resend) {
      logErr('❌ Missing RESEND_API_KEY');
      return { success: false, error: 'Missing RESEND_API_KEY' };
    }

    if (!to || typeof to !== 'string' || !to.includes('@')) {
      logErr('❌ Invalid email address:', to);
      return { success: false, error: 'Invalid email address' };
    }

    const from = getFromAddress();

    console.log('📧 [Resend] Sending email:');
    console.log('   From:', from);
    console.log('   To:', to);
    console.log('   Subject:', subject);

    const { data, error } = await resend.emails.send({
      from,
      to: [to],
      subject,
      html,
    });

    if (error) {
      logErr('❌ [Resend] API error:', error);
      return { success: false, error: error.message || 'Resend send failed' };
    }

    console.log('✅ [Resend] Email sent. ID:', data?.id);
    return { success: true, messageId: data?.id };
  } catch (err) {
    logErr('❌ Email send error:', err.message);
    return { success: false, error: err.message };
  }
};

// ==========================================
// TEST EMAIL CONNECTION
// ==========================================
export const testEmailConnection = async () => {
  try {
    const resend = getResend();
    if (!resend) {
      throw new Error('Missing RESEND_API_KEY');
    }
    log('✅ Resend configured');
    return { success: true };
  } catch (err) {
    logErr('❌ Resend config error:', err.message);
    return { success: false, error: err.message };
  }
};