/**
 * Midtrans Snap API Integration
 * Handles payment gateway transactions for orders and custom order DPs
 */
import Midtrans from 'midtrans-client';

const snap = new Midtrans.Snap({
    isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
    serverKey: process.env.MIDTRANS_SERVER_KEY,
    clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY,
});

/**
 * Create a Midtrans Snap transaction and return the token
 */
export async function createTransaction({ orderId, grossAmount, items, customer }) {
    const parameter = {
        transaction_details: {
            order_id: orderId,
            gross_amount: grossAmount,
        },
        item_details: items.map(item => ({
            id: String(item.id || item.design_id),
            name: item.title.substring(0, 50), // Midtrans max 50 chars
            price: item.price,
            quantity: item.quantity || 1,
        })),
        customer_details: {
            first_name: customer?.name || 'Customer',
            email: customer?.email || '',
        },
    };

    try {
        const transaction = await snap.createTransaction(parameter);
        return {
            success: true,
            token: transaction.token,
            redirect_url: transaction.redirect_url,
        };
    } catch (error) {
        console.error('[Midtrans] Create transaction error:', error);
        return {
            success: false,
            error: error.message,
        };
    }
}

/**
 * Verify Midtrans webhook notification signature
 */
export async function verifyNotification(notificationBody) {
    try {
        const statusResponse = await snap.transaction.notification(notificationBody);
        return {
            success: true,
            orderId: statusResponse.order_id,
            transactionStatus: statusResponse.transaction_status,
            fraudStatus: statusResponse.fraud_status,
            grossAmount: statusResponse.gross_amount,
            paymentType: statusResponse.payment_type,
        };
    } catch (error) {
        console.error('[Midtrans] Verify notification error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Check if a transaction status means "paid"
 */
export function isTransactionPaid(status) {
    return ['capture', 'settlement'].includes(status);
}
