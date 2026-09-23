// backend/utils/emailTemplates.js - COMPLETE MODERN DESIGN

// ==========================================
// MODERN PAYMENT STATUS EMAIL TEMPLATES
// ==========================================
export const getPaymentStatusEmailTemplate = (order, paymentStatus) => {
  const getStatusColor = (status) => {
    const colors = {
      paid: '#10B981',
      failed: '#EF4444', 
      refunded: '#F59E0B',
      pending: '#6B7280'
    };
    return colors[status] || '#6B7280';
  };

  const getStatusIcon = (status) => {
    const icons = {
      paid: '✅',
      failed: '❌',
      refunded: '💳',
      pending: '⏳'
    };
    return icons[status] || '💳';
  };

  const getStatusTitle = (status) => {
    const titles = {
      paid: 'Payment Confirmed! 💰',
      failed: 'Payment Failed ❌',
      refunded: 'Refund Processed 💳',
      pending: 'Payment Pending ⏳'
    };
    return titles[status] || 'Payment Update';
  };

  const getStatusMessage = (status) => {
    const messages = {
      paid: 'Your payment has been successfully processed and confirmed.',
      failed: 'We couldn\'t process your payment. Please try again or use a different payment method.',
      refunded: 'Your refund has been processed successfully. It will appear in your account within 5-7 business days.',
      pending: 'Your payment is currently pending. We\'ll notify you once it\'s confirmed.'
    };
    return messages[status] || 'Your payment status has been updated.';
  };

  const color = getStatusColor(paymentStatus);

  return {
    subject: `${getStatusIcon(paymentStatus)} Payment ${paymentStatus.charAt(0).toUpperCase() + paymentStatus.slice(1)} - Order #${order.orderNumber}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment ${paymentStatus} - Order #${order.orderNumber}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          * { margin: 0; padding: 0; box-sizing: border-box; }
        </style>
      </head>
      <body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #f0f4f8; margin: 0; padding: 40px 20px; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;">
        
        <!-- Main Container -->
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.08);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1a472a 0%, #2B7A4B 50%, #3a9d62 100%); padding: 40px 30px 35px; text-align: center;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="text-align: center;">
                    <div style="font-size: 42px; margin-bottom: 8px;">🌿</div>
                    <h1 style="color: #ffffff; font-size: 28px; font-weight: 700; margin: 0; letter-spacing: -0.5px;">GreenScape</h1>
                    <p style="color: rgba(167, 243, 208, 0.9); font-size: 14px; margin: 6px 0 0; font-weight: 400;">Grow. Nurture. Thrive.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px 30px;">
              <!-- Status Icon & Title -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="text-align: center; padding-bottom: 24px;">
                    <div style="font-size: 56px; margin-bottom: 8px;">${getStatusIcon(paymentStatus)}</div>
                    <h2 style="color: ${color}; font-size: 24px; font-weight: 700; margin: 0; letter-spacing: -0.3px;">${getStatusTitle(paymentStatus)}</h2>
                    <p style="color: #64748b; font-size: 15px; margin: 8px 0 0; line-height: 1.6; max-width: 420px; margin-left: auto; margin-right: auto;">${getStatusMessage(paymentStatus)}</p>
                  </td>
                </tr>
              </table>

              <!-- Order Badge -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="text-align: center; padding-bottom: 24px;">
                    <span style="display: inline-block; background: ${color}15; color: ${color}; padding: 8px 20px; border-radius: 50px; font-size: 13px; font-weight: 600; border: 1px solid ${color}30;">
                      Order #${order.orderNumber}
                    </span>
                  </td>
                </tr>
              </table>

              <!-- Order Details Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 20px 24px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding-bottom: 12px;">
                          <p style="color: #94a3b8; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin: 0;">Order Details</p>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="padding-bottom: 12px;">
                                <table width="100%" cellpadding="0" cellspacing="0">
                                  <tr>
                                    <td style="width: 50%;">
                                      <p style="color: #94a3b8; font-size: 11px; margin: 0 0 4px; font-weight: 500;">Order Number</p>
                                      <p style="color: #1e293b; font-size: 15px; font-weight: 600; margin: 0;">${order.orderNumber}</p>
                                    </td>
                                    <td style="width: 50%; text-align: right;">
                                      <p style="color: #94a3b8; font-size: 11px; margin: 0 0 4px; font-weight: 500;">Total Amount</p>
                                      <p style="color: ${color}; font-size: 22px; font-weight: 700; margin: 0;">Rs. ${order.totalAmount?.toFixed(2)}</p>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding-top: 12px; border-top: 1px solid #e2e8f0;">
                                <table width="100%" cellpadding="0" cellspacing="0">
                                  <tr>
                                    <td style="width: 50%;">
                                      <p style="color: #94a3b8; font-size: 11px; margin: 0 0 4px; font-weight: 500;">Payment Method</p>
                                      <p style="color: #1e293b; font-size: 14px; font-weight: 500; margin: 0; text-transform: capitalize;">${order.paymentMethod || 'N/A'}</p>
                                    </td>
                                    <td style="width: 50%; text-align: right;">
                                      <p style="color: #94a3b8; font-size: 11px; margin: 0 0 4px; font-weight: 500;">Status</p>
                                      <p style="color: ${color}; font-size: 14px; font-weight: 600; margin: 0; text-transform: uppercase;">${paymentStatus}</p>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Order Items -->
              ${order.items?.length > 0 ? `
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                <tr>
                  <td>
                    <h3 style="color: #1e293b; font-size: 15px; font-weight: 600; margin: 0 0 12px;">🛍️ Items Ordered</h3>
                    <table width="100%" cellpadding="0" cellspacing="0" style="background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden;">
                      <thead>
                        <tr style="background: #f8fafc;">
                          <th style="padding: 12px 16px; text-align: left; color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.3px;">Product</th>
                          <th style="padding: 12px 16px; text-align: center; color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.3px;">Qty</th>
                          <th style="padding: 12px 16px; text-align: right; color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.3px;">Price</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${order.items.map(item => `
                          <tr style="border-top: 1px solid #f1f5f9;">
                            <td style="padding: 12px 16px; color: #1e293b; font-size: 14px; font-weight: 500;">${item.name}</td>
                            <td style="padding: 12px 16px; text-align: center; color: #1e293b; font-size: 14px;">${item.quantity}</td>
                            <td style="padding: 12px 16px; text-align: right; color: #1e293b; font-size: 14px; font-weight: 500;">Rs. ${(item.price * item.quantity).toFixed(2)}</td>
                          </tr>
                        `).join('')}
                        <tr style="background: #fafbfc; border-top: 2px solid #e2e8f0;">
                          <td colspan="2" style="padding: 14px 16px; text-align: right; color: #1e293b; font-size: 15px; font-weight: 600;">Total:</td>
                          <td style="padding: 14px 16px; text-align: right; color: ${color}; font-size: 18px; font-weight: 700;">Rs. ${order.totalAmount?.toFixed(2)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
              </table>
              ` : ''}

              <!-- Action Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="text-align: center; padding: 8px 0 16px;">
                    <a href="https://yourdomain.com/orders/${order._id}" style="display: inline-block; background: ${color}; color: #ffffff; padding: 14px 48px; border-radius: 50px; text-decoration: none; font-size: 15px; font-weight: 600; box-shadow: 0 4px 14px ${color}40; transition: all 0.3s;">
                      View Order Details →
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Contact Support -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="text-align: center; padding-top: 8px;">
                    <p style="color: #94a3b8; font-size: 14px; margin: 0;">
                      Have questions? <a href="mailto:support@greenscape.com" style="color: #2B7A4B; text-decoration: none; font-weight: 600;">Contact Support</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background: #fafbfc; padding: 24px 30px; text-align: center; border-top: 1px solid #e2e8f0;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <p style="color: #94a3b8; font-size: 12px; margin: 0 0 4px;">
                      © ${new Date().getFullYear()} GreenScape. All rights reserved.
                    </p>
                    <p style="color: #cbd5e1; font-size: 11px; margin: 0;">
                      This email was sent regarding your order #${order.orderNumber}
                    </p>
                    <p style="color: #cbd5e1; font-size: 11px; margin: 4px 0 0;">
                      <a href="https://yourdomain.com/unsubscribe" style="color: #94a3b8; text-decoration: none;">Unsubscribe</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </body>
      </html>
    `
  };
};

// ==========================================
// MODERN ORDER STATUS EMAIL TEMPLATES
// ==========================================
export const getOrderStatusEmailTemplate = (order, status) => {
  const getStatusColor = (status) => {
    const colors = {
      pending: '#F59E0B',
      processing: '#3B82F6',
      shipped: '#8B5CF6',
      delivered: '#10B981',
      cancelled: '#EF4444'
    };
    return colors[status] || '#6B7280';
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: '📋',
      processing: '⚙️',
      shipped: '🚚',
      delivered: '✅',
      cancelled: '❌'
    };
    return icons[status] || '📦';
  };

  const getStatusTitle = (status) => {
    const titles = {
      pending: 'Order Received! 🎉',
      processing: 'Order Processing ⚙️',
      shipped: 'Order Shipped! 🚚',
      delivered: 'Order Delivered! 🎉',
      cancelled: 'Order Cancelled ❌'
    };
    return titles[status] || 'Order Update';
  };

  const getStatusMessage = (status) => {
    const messages = {
      pending: 'Thank you for your order! We\'re preparing it for processing. You\'ll receive updates as your order progresses.',
      processing: 'Your order is being carefully prepared by our team. We\'ll notify you when it ships.',
      shipped: 'Your order is on its way! Track your package for real-time delivery updates.',
      delivered: 'Your order has been successfully delivered. We hope you love your new plants! 🌿',
      cancelled: 'Your order has been cancelled as requested. A refund will be processed shortly.'
    };
    return messages[status] || 'Your order status has been updated.';
  };

  const color = getStatusColor(status);

  return {
    subject: `${getStatusIcon(status)} ${status.charAt(0).toUpperCase() + status.slice(1)} - Order #${order.orderNumber}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${status.charAt(0).toUpperCase() + status.slice(1)} - Order #${order.orderNumber}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          * { margin: 0; padding: 0; box-sizing: border-box; }
        </style>
      </head>
      <body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #f0f4f8; margin: 0; padding: 40px 20px; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;">
        
        <!-- Main Container -->
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.08);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1a472a 0%, #2B7A4B 50%, #3a9d62 100%); padding: 40px 30px 35px; text-align: center;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="text-align: center;">
                    <div style="font-size: 42px; margin-bottom: 8px;">🌿</div>
                    <h1 style="color: #ffffff; font-size: 28px; font-weight: 700; margin: 0; letter-spacing: -0.5px;">GreenScape</h1>
                    <p style="color: rgba(167, 243, 208, 0.9); font-size: 14px; margin: 6px 0 0; font-weight: 400;">Grow. Nurture. Thrive.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px 30px;">
              <!-- Status Progress Indicator -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                <tr>
                  <td>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="text-align: center;">
                          ${['pending', 'processing', 'shipped', 'delivered'].map((s, index) => {
                            const isActive = ['pending', 'processing', 'shipped', 'delivered'].indexOf(status) >= index;
                            const isCurrent = s === status;
                            const dotColor = isActive ? (isCurrent ? color : '#2B7A4B') : '#e2e8f0';
                            return `
                              <span style="display: inline-block; width: 12px; height: 12px; border-radius: 50%; background: ${dotColor}; margin: 0 4px; ${isCurrent ? 'box-shadow: 0 0 0 4px ' + color + '30;' : ''}"></span>
                              ${index < 3 ? `<span style="display: inline-block; width: 40px; height: 2px; background: ${isActive ? '#2B7A4B' : '#e2e8f0'}; margin: 0 2px;"></span>` : ''}
                            `;
                          }).join('')}
                        </td>
                      </tr>
                      <tr>
                        <td style="text-align: center; padding-top: 8px;">
                          <span style="font-size: 11px; color: ${color}; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">${status}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Status Icon & Title -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="text-align: center; padding-bottom: 24px;">
                    <div style="font-size: 56px; margin-bottom: 8px;">${getStatusIcon(status)}</div>
                    <h2 style="color: ${color}; font-size: 24px; font-weight: 700; margin: 0; letter-spacing: -0.3px;">${getStatusTitle(status)}</h2>
                    <p style="color: #64748b; font-size: 15px; margin: 8px 0 0; line-height: 1.6; max-width: 420px; margin-left: auto; margin-right: auto;">${getStatusMessage(status)}</p>
                  </td>
                </tr>
              </table>

              <!-- Order Badge -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="text-align: center; padding-bottom: 24px;">
                    <span style="display: inline-block; background: ${color}15; color: ${color}; padding: 8px 20px; border-radius: 50px; font-size: 13px; font-weight: 600; border: 1px solid ${color}30;">
                      Order #${order.orderNumber}
                    </span>
                  </td>
                </tr>
              </table>

              <!-- Order Details Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 20px 24px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding-bottom: 12px;">
                          <p style="color: #94a3b8; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin: 0;">Order Details</p>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="padding-bottom: 12px;">
                                <table width="100%" cellpadding="0" cellspacing="0">
                                  <tr>
                                    <td style="width: 50%;">
                                      <p style="color: #94a3b8; font-size: 11px; margin: 0 0 4px; font-weight: 500;">Order Number</p>
                                      <p style="color: #1e293b; font-size: 15px; font-weight: 600; margin: 0;">${order.orderNumber}</p>
                                    </td>
                                    <td style="width: 50%; text-align: right;">
                                      <p style="color: #94a3b8; font-size: 11px; margin: 0 0 4px; font-weight: 500;">Total</p>
                                      <p style="color: ${color}; font-size: 22px; font-weight: 700; margin: 0;">Rs. ${order.totalAmount?.toFixed(2)}</p>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding-top: 12px; border-top: 1px solid #e2e8f0;">
                                <table width="100%" cellpadding="0" cellspacing="0">
                                  <tr>
                                    <td style="width: 50%;">
                                      <p style="color: #94a3b8; font-size: 11px; margin: 0 0 4px; font-weight: 500;">Payment Method</p>
                                      <p style="color: #1e293b; font-size: 14px; font-weight: 500; margin: 0; text-transform: capitalize;">${order.paymentMethod || 'N/A'}</p>
                                    </td>
                                    <td style="width: 50%; text-align: right;">
                                      <p style="color: #94a3b8; font-size: 11px; margin: 0 0 4px; font-weight: 500;">Status</p>
                                      <p style="color: ${color}; font-size: 14px; font-weight: 600; margin: 0; text-transform: uppercase;">${status}</p>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                            ${status === 'delivered' && order.deliveredAt ? `
                            <tr>
                              <td style="padding-top: 12px; border-top: 1px solid #e2e8f0;">
                                <table width="100%" cellpadding="0" cellspacing="0">
                                  <tr>
                                    <td style="width: 100%; text-align: center;">
                                      <p style="color: #94a3b8; font-size: 11px; margin: 0 0 4px; font-weight: 500;">Delivered On</p>
                                      <p style="color: #10B981; font-size: 14px; font-weight: 600; margin: 0;">${new Date(order.deliveredAt).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                            ` : ''}
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Order Items -->
              ${order.items?.length > 0 ? `
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                <tr>
                  <td>
                    <h3 style="color: #1e293b; font-size: 15px; font-weight: 600; margin: 0 0 12px;">🛍️ Items Ordered</h3>
                    <table width="100%" cellpadding="0" cellspacing="0" style="background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden;">
                      <thead>
                        <tr style="background: #f8fafc;">
                          <th style="padding: 12px 16px; text-align: left; color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.3px;">Product</th>
                          <th style="padding: 12px 16px; text-align: center; color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.3px;">Qty</th>
                          <th style="padding: 12px 16px; text-align: right; color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.3px;">Price</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${order.items.map(item => `
                          <tr style="border-top: 1px solid #f1f5f9;">
                            <td style="padding: 12px 16px; color: #1e293b; font-size: 14px; font-weight: 500;">${item.name}</td>
                            <td style="padding: 12px 16px; text-align: center; color: #1e293b; font-size: 14px;">${item.quantity}</td>
                            <td style="padding: 12px 16px; text-align: right; color: #1e293b; font-size: 14px; font-weight: 500;">Rs. ${(item.price * item.quantity).toFixed(2)}</td>
                          </tr>
                        `).join('')}
                        <tr style="background: #fafbfc; border-top: 2px solid #e2e8f0;">
                          <td colspan="2" style="padding: 14px 16px; text-align: right; color: #1e293b; font-size: 15px; font-weight: 600;">Total:</td>
                          <td style="padding: 14px 16px; text-align: right; color: ${color}; font-size: 18px; font-weight: 700;">Rs. ${order.totalAmount?.toFixed(2)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
              </table>
              ` : ''}

              <!-- Shipping Address -->
              ${order.shippingAddress ? `
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                <tr>
                  <td style="background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; padding: 16px 20px;">
                    <p style="color: #94a3b8; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 8px;">📍 Shipping Address</p>
                    <p style="color: #1e293b; font-size: 14px; margin: 0; line-height: 1.6;">
                      ${order.shippingAddress.firstName || ''} ${order.shippingAddress.lastName || ''}<br>
                      ${order.shippingAddress.address || ''}<br>
                      ${order.shippingAddress.city || ''}${order.shippingAddress.state ? ', ' + order.shippingAddress.state : ''} ${order.shippingAddress.zip || ''}<br>
                      ${order.shippingAddress.country || ''}
                    </p>
                  </td>
                </tr>
              </table>
              ` : ''}

              <!-- Action Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="text-align: center; padding: 8px 0 16px;">
                    <a href="https://yourdomain.com/orders/${order._id}" style="display: inline-block; background: ${color}; color: #ffffff; padding: 14px 48px; border-radius: 50px; text-decoration: none; font-size: 15px; font-weight: 600; box-shadow: 0 4px 14px ${color}40; transition: all 0.3s;">
                      ${status === 'shipped' ? 'Track Your Order →' : status === 'delivered' ? 'Leave a Review →' : 'View Order Details →'}
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Contact Support -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="text-align: center; padding-top: 8px;">
                    <p style="color: #94a3b8; font-size: 14px; margin: 0;">
                      Have questions? <a href="mailto:support@greenscape.com" style="color: #2B7A4B; text-decoration: none; font-weight: 600;">Contact Support</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background: #fafbfc; padding: 24px 30px; text-align: center; border-top: 1px solid #e2e8f0;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <p style="color: #94a3b8; font-size: 12px; margin: 0 0 4px;">
                      © ${new Date().getFullYear()} GreenScape. All rights reserved.
                    </p>
                    <p style="color: #cbd5e1; font-size: 11px; margin: 0;">
                      This email was sent regarding your order #${order.orderNumber}
                    </p>
                    <p style="color: #cbd5e1; font-size: 11px; margin: 4px 0 0;">
                      <a href="https://yourdomain.com/unsubscribe" style="color: #94a3b8; text-decoration: none;">Unsubscribe</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </body>
      </html>
    `
  };
};