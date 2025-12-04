const { CosmosClient } = require('@azure/cosmos');
const axios = require('axios');

const endpoint = process.env.COSMOS_DB_ENDPOINT;
const key = process.env.COSMOS_DB_KEY;
const databaseId = process.env.COSMOS_DB_DATABASE;
const containerId = process.env.COSMOS_DB_CONTAINER;
const emailFunctionUrl = process.env.EMAIL_FUNCTION_URL;

const client = new CosmosClient({ endpoint, key });

module.exports = async function (context, req) {
    context.log('Payment Processor function triggered');

    try {
        const { orderId, userId, amount, paymentMethod } = req.body;

        if (!orderId || !userId || !amount) {
            context.res = {
                status: 400,
                body: { error: 'Missing required fields' }
            };
            return;
        }

        // Simulate payment processing (90% success rate)
        const paymentSuccess = Math.random() < 0.9;

        // Get order from Cosmos DB
        const database = client.database(databaseId);
        const container = database.container(containerId);

        let order;
        try {
            const { resource } = await container.item(orderId, userId).read();
            order = resource;
        } catch (err) {
            context.log.error('Order not found:', err);
            context.res = {
                status: 404,
                body: { error: 'Order not found' }
            };
            return;
        }

        // Update order status based on payment result
        const paymentId = `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        order.payment = {
            paymentId,
            method: paymentMethod,
            amount,
            status: paymentSuccess ? 'completed' : 'failed',
            processedAt: new Date().toISOString()
        };

        order.status = paymentSuccess ? 'processing' : 'payment_failed';
        order.updatedAt = new Date().toISOString();

        // Update order in Cosmos DB
        await container.item(orderId, userId).replace(order);

        context.log(`Payment ${paymentSuccess ? 'successful' : 'failed'} for order ${orderId}`);

        // If payment successful, send confirmation email
        if (paymentSuccess && emailFunctionUrl) {
            try {
                await axios.post(emailFunctionUrl, {
                    orderId,
                    userId,
                    amount,
                    paymentId,
                    customerEmail: order.customerEmail || 'customer@example.com'
                }, { timeout: 10000 });

                context.log('Email notification sent successfully');
            } catch (emailErr) {
                context.log.error('Failed to send email notification:', emailErr.message);
                // Don't fail the payment if email fails
            }
        }

        context.res = {
            status: 200,
            body: {
                success: paymentSuccess,
                orderId,
                paymentId,
                status: order.status,
                message: paymentSuccess
                    ? 'Payment processed successfully'
                    : 'Payment failed, please try again'
            }
        };

    } catch (error) {
        context.log.error('Payment processing error:', error);

        context.res = {
            status: 500,
            body: {
                error: 'Payment processing failed',
                message: error.message
            }
        };
    }
};
