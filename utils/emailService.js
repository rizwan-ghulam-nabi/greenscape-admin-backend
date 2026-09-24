// // backend/utils/emailService.js - WITH DEBUG LOGGING

// import nodemailer from 'nodemailer';
// import dotenv from 'dotenv';
// import { getOrderStatusEmailTemplate, getPaymentStatusEmailTemplate } from './emailTemplates.js';

// dotenv.config();

// const emailUser = process.env.EMAIL_USER || '';
// const emailPassword = process.env.EMAIL_APP_PASSWORD || '';

// console.log('📧 Email Config Check:');
// console.log('  EMAIL_USER:', emailUser ? '✅ Set (' + emailUser + ')' : '❌ Missing');
// console.log('  EMAIL_APP_PASSWORD:', emailPassword ? '✅ Set (length: ' + emailPassword.length + ')' : '❌ Missing');

// const transporter = nodemailer.createTransport({
//   host: 'smtp.gmail.com',
//   port: 587,
//   secure: false,
//   auth: {
//     user: emailUser,
//     pass: emailPassword
//   },
//   tls: {
//     rejectUnauthorized: false,
//     ciphers: 'SSLv3'
//   },
//   connectionTimeout: 30000,
//   greetingTimeout: 30000,
//   socketTimeout: 30000
// });

// // ==========================================
// // ✅ GET CUSTOMER EMAIL - WITH DEBUG
// // ==========================================
// const getCustomerEmail = (order) => {
//   console.log('🔍 Looking for customer email in order:', order?.orderNumber);
//   console.log('  - order.user?.email:', order?.user?.email);
//   console.log('  - order.shippingAddress?.email:', order?.shippingAddress?.email);
//   console.log('  - order.user (raw):', order?.user);
  
//   // Try different sources for email
//   if (order?.user?.email) {
//     console.log('✅ Found email in user.email:', order.user.email);
//     return order.user.email;
//   }
//   if (order?.shippingAddress?.email) {
//     console.log('✅ Found email in shippingAddress.email:', order.shippingAddress.email);
//     return order.shippingAddress.email;
//   }
  
//   console.log('❌ No email found in order!');
//   return null;
// };

// // ==========================================
// // ✅ SEND ORDER STATUS EMAIL - WITH DEBUG
// // ==========================================
// export const sendOrderStatusEmail = async (order, status) => {
//   try {
//     console.log('📧 ===== sendOrderStatusEmail called =====');
//     console.log('📧 Order ID:', order?._id);
//     console.log('📧 Order Number:', order?.orderNumber);
//     console.log('📧 Status:', status);
    
//     // ✅ Get email
//     const customerEmail = getCustomerEmail(order);
    
//     if (!customerEmail) {
//       console.error('❌ No customer email found! Cannot send email.');
//       return { success: false, error: 'No customer email found' };
//     }

//     console.log('📧 Sending email to:', customerEmail);
    
//     // ✅ Get customer name
//     const customerName = order?.user?.firstName || order?.shippingAddress?.firstName || 'Customer';
    
//     // ✅ Add customer name to order for template
//     const orderWithName = {
//       ...(order.toObject ? order.toObject() : order),
//       user: {
//         ...(order.user || {}),
//         firstName: customerName,
//         email: customerEmail
//       }
//     };

//     const template = getOrderStatusEmailTemplate(orderWithName, status);
//     console.log('📧 Template generated:', template.subject);
    
//     const result = await sendEmail(customerEmail, template.subject, template.html);
//     console.log('📧 Email result:', result);
//     console.log('📧 ===== sendOrderStatusEmail completed =====');
    
//     return result;
//   } catch (error) {
//     console.error('❌ Error sending order status email:', error.message);
//     console.error('❌ Stack:', error.stack);
//     return { success: false, error: error.message };
//   }
// };

// // ==========================================
// // ✅ SEND PAYMENT STATUS EMAIL - WITH DEBUG
// // ==========================================
// export const sendPaymentStatusEmail = async (order, paymentStatus) => {
//   try {
//     console.log('📧 ===== sendPaymentStatusEmail called =====');
//     console.log('📧 Order ID:', order?._id);
//     console.log('📧 Order Number:', order?.orderNumber);
//     console.log('📧 Payment Status:', paymentStatus);
    
//     // ✅ Get email
//     const customerEmail = getCustomerEmail(order);
    
//     if (!customerEmail) {
//       console.error('❌ No customer email found! Cannot send email.');
//       return { success: false, error: 'No customer email found' };
//     }

//     console.log('📧 Sending payment email to:', customerEmail);
    
//     // ✅ Get customer name
//     const customerName = order?.user?.firstName || order?.shippingAddress?.firstName || 'Customer';
    
//     // ✅ Add customer name to order for template
//     const orderWithName = {
//       ...(order.toObject ? order.toObject() : order),
//       user: {
//         ...(order.user || {}),
//         firstName: customerName,
//         email: customerEmail
//       }
//     };

//     const template = getPaymentStatusEmailTemplate(orderWithName, paymentStatus);
//     console.log('📧 Template generated:', template.subject);
    
//     const result = await sendEmail(customerEmail, template.subject, template.html);
//     console.log('📧 Email result:', result);
//     console.log('📧 ===== sendPaymentStatusEmail completed =====');
    
//     return result;
//   } catch (error) {
//     console.error('❌ Error sending payment status email:', error.message);
//     console.error('❌ Stack:', error.stack);
//     return { success: false, error: error.message };
//   }
// };

// // ==========================================
// // ✅ SEND EMAIL
// // ==========================================
// export const sendEmail = async (to, subject, html) => {
//   try {
//     // console.log(`📤 Sending email to: ${to}`);
//     // console.log(`📤 Subject: ${subject}`);
    
//     if (!emailUser || !emailPassword) {
//       console.error('❌ Missing email credentials!');
//       return { success: false, error: 'Missing email credentials' };
//     }

//     if (!to || !to.includes('@')) {
//       console.error('❌ Invalid email address:', to);
//       return { success: false, error: 'Invalid email address' };
//     }

//     const mailOptions = {
//       from: `"GreenScape" <${emailUser}>`,
//       to: to,
//       subject: subject,
//       html: html,
//     };

//     const info = await transporter.sendMail(mailOptions);
//     // console.log(`✅ Email sent successfully to ${to}`);
//     // console.log(`✅ Message ID: ${info.messageId}`);
    
//     return { success: true, messageId: info.messageId };
//   } catch (err) {
//     console.error('❌ Email send error:', err.message);
//     console.error('❌ Error code:', err.code);
//     return { 
//       success: false, 
//       error: err.message,
//       code: err.code 
//     };
//   }
// };

// // ==========================================
// // ✅ TEST EMAIL CONNECTION
// // ==========================================
// export const testEmailConnection = async () => {
//   try {
//     console.log('🔍 Testing email connection...');
//     console.log('  User:', emailUser);
//     console.log('  Password length:', emailPassword.length);
    
//     if (!emailUser || !emailPassword) {
//       throw new Error('Missing email credentials. Check .env file');
//     }
    
//     await transporter.verify();
//     console.log('✅ Email transporter is ready');
    
//     // const result = await sendEmail(
//     //   emailUser,
//     //   '✅ GreenScape Email Test',
//     //   `
//     //     <h1>Email Test Successful!</h1>
//     //     <p>Your GreenScape email service is working properly.</p>
//     //     <p>Time: ${new Date().toLocaleString()}</p>
//     //   `
//     // );
    
//     return { success: true };
//   } catch (err) {
//     console.error('❌ Email transporter error:', err.message);
//     return { success: false, error: err.message };
//   }
// };






// new version 24/09/2026

// backend/utils/emailService.js - PRODUCTION (lazy env reads)

import nodemailer from 'nodemailer';
import {
  getOrderStatusEmailTemplate,
  getPaymentStatusEmailTemplate,
} from './emailTemplates.js';

const isDev = process.env.NODE_ENV !== 'production';
const log = (...args) => { if (isDev) console.log(...args); };
const logErr = (...args) => console.error(...args);

// ✅ Read env LAZILY — safe no matter when dotenv runs
const getEmailUser = () => process.env.EMAIL_USER || '';
const getEmailPassword = () => process.env.EMAIL_APP_PASSWORD || '';

// ✅ Build transporter on first use
let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;

  const user = getEmailUser();
  const pass = getEmailPassword();
  if (!user || !pass) return null;

  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
    pool: true,
    maxConnections: 3,
    maxMessages: 100,
    connectionTimeout: 30000,
    greetingTimeout: 30000,
    socketTimeout: 30000,
  });

  return transporter;
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
// SEND EMAIL (core)
// ==========================================
export const sendEmail = async (to, subject, html) => {
  try {
    const t = getTransporter();
    if (!t) {
      logErr('❌ Missing email credentials (EMAIL_USER / EMAIL_APP_PASSWORD)');
      return { success: false, error: 'Missing email credentials' };
    }

    if (!to || typeof to !== 'string' || !to.includes('@')) {
      logErr('❌ Invalid email address:', to);
      return { success: false, error: 'Invalid email address' };
    }

    const info = await t.sendMail({
      from: `"GreenScape" <${getEmailUser()}>`,
      to,
      subject,
      html,
    });

    log(`✅ Email sent to ${to} | id=${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    logErr('❌ Email send error:', err.message, '| code:', err.code);
    return { success: false, error: err.message, code: err.code };
  }
};

// ==========================================
// TEST EMAIL CONNECTION
// ==========================================
export const testEmailConnection = async () => {
  try {
    const t = getTransporter();
    if (!t) {
      throw new Error('Missing email credentials. Check .env.local');
    }
    await t.verify();
    log('✅ Email transporter is ready');
    return { success: true };
  } catch (err) {
    logErr('❌ Email transporter error:', err.message);
    return { success: false, error: err.message };
  }
};