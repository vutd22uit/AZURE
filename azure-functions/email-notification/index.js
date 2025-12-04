// Using SendGrid for email (or mock for testing)
const sendgrid = process.env.SENDGRID_API_KEY ? require('@sendgrid/mail') : null;

if (sendgrid && process.env.SENDGRID_API_KEY && process.env.SENDGRID_API_KEY !== 'mock-sendgrid-key') {
    sendgrid.setApiKey(process.env.SENDGRID_API_KEY);
}

module.exports = async function (context, req) {
    context.log('Email Notification function triggered');

    try {
        const { orderId, userId, amount, paymentId, customerEmail } = req.body;

        if (!orderId || !customerEmail) {
            context.res = {
                status: 400,
                body: { error: 'Missing required fields' }
            };
            return;
        }

        const fromEmail = process.env.FROM_EMAIL || 'noreply@ecommerce.com';

        const emailContent = {
            to: customerEmail,
            from: fromEmail,
            subject: `Order Confirmation - Order #${orderId}`,
            text: `
Dear Customer,

Thank you for your order!

Order Details:
- Order ID: ${orderId}
- Payment ID: ${paymentId}
- Amount: $${amount.toFixed(2)}
- Status: Confirmed

Your order is being processed and will be shipped soon.

Thank you for shopping with us!

Best regards,
E-Commerce Cloud Team
            `,
            html: `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9fafb; }
        .order-details { background-color: white; padding: 15px; margin: 20px 0; border-radius: 5px; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Order Confirmation</h1>
        </div>
        <div class="content">
            <p>Dear Customer,</p>
            <p>Thank you for your order! Your payment has been successfully processed.</p>

            <div class="order-details">
                <h3>Order Details</h3>
                <p><strong>Order ID:</strong> ${orderId}</p>
                <p><strong>Payment ID:</strong> ${paymentId}</p>
                <p><strong>Amount:</strong> $${amount.toFixed(2)}</p>
                <p><strong>Status:</strong> Confirmed</p>
            </div>

            <p>Your order is being processed and will be shipped soon. We'll send you another email with tracking information once your order ships.</p>

            <p>Thank you for shopping with us!</p>
        </div>
        <div class="footer">
            <p>© 2024 E-Commerce Cloud. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
            `
        };

        // Send email using SendGrid or mock
        if (sendgrid && process.env.SENDGRID_API_KEY !== 'mock-sendgrid-key') {
            await sendgrid.send(emailContent);
            context.log(`Email sent to ${customerEmail}`);
        } else {
            // Mock email sending for development/testing
            context.log('Mock email send (SendGrid not configured):');
            context.log(`To: ${customerEmail}`);
            context.log(`Subject: ${emailContent.subject}`);
            context.log('Email would be sent with real SendGrid API key');
        }

        context.res = {
            status: 200,
            body: {
                success: true,
                message: 'Email notification sent successfully',
                orderId,
                recipient: customerEmail
            }
        };

    } catch (error) {
        context.log.error('Email notification error:', error);

        context.res = {
            status: 500,
            body: {
                error: 'Failed to send email notification',
                message: error.message
            }
        };
    }
};
