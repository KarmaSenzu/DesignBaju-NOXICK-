/**
 * Fonnte WhatsApp API Integration
 * Sends automated WhatsApp messages to manager/admin for order notifications
 */

const FONNTE_TOKEN = process.env.FONNTE_TOKEN;
const MANAGER_WA_NUMBER = process.env.MANAGER_WA_NUMBER;

/**
 * Send a WhatsApp message via Fonnte API
 */
export async function sendWhatsApp(target, message) {
    if (!FONNTE_TOKEN || FONNTE_TOKEN === 'your_fonnte_api_token') {
        console.warn('[Fonnte] Token not configured, skipping WhatsApp notification');
        return { success: false, reason: 'Token not configured' };
    }

    try {
        const res = await fetch('https://api.fonnte.com/send', {
            method: 'POST',
            headers: {
                'Authorization': FONNTE_TOKEN,
            },
            body: new URLSearchParams({
                target: target,
                message: message,
            }),
        });
        const data = await res.json();
        console.log('[Fonnte] Message sent:', data);
        return { success: true, data };
    } catch (error) {
        console.error('[Fonnte] Error sending message:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Send order notification to manager via WhatsApp
 */
export async function notifyManagerNewOrder(order) {
    const itemsList = order.items.map(item => {
        let line = `- ${item.title}`;
        if (item.selected_color) line += ` (${item.selected_color}`;
        if (item.selected_size) line += `, Size ${item.selected_size}`;
        if (item.selected_color) line += ')';
        line += ` x1`;
        return line;
    }).join('\n');

    const message = `📥 *ORDER BARU MASUK*

🧾 Order ID: #${order.id}
👤 Nama: ${order.user_name}
📦 Produk:
${itemsList}

💰 Total: Rp ${Number(order.total_price).toLocaleString('id-ID')}
${order.notes ? `📝 Catatan: ${order.notes}` : ''}

Silakan cek dashboard untuk detail lengkap.`;

    return sendWhatsApp(MANAGER_WA_NUMBER, message);
}

/**
 * Send custom order DP notification to manager via WhatsApp
 */
export async function notifyManagerCustomOrderDP(customOrder) {
    const message = `📥 *CUSTOM ORDER BARU + DP*

🧾 Order ID: #${customOrder.id}
👤 Nama: ${customOrder.user_name}
📦 Produk: ${customOrder.product_type}
💰 DP Dibayar: Rp ${Number(customOrder.dp_amount).toLocaleString('id-ID')}
📝 Detail: ${customOrder.description || '-'}
📱 Telepon: ${customOrder.phone || '-'}
${customOrder.deadline ? `📅 Deadline: ${customOrder.deadline}` : ''}

User akan menghubungi via WhatsApp untuk diskusi desain dan negosiasi harga.`;

    return sendWhatsApp(MANAGER_WA_NUMBER, message);
}

/**
 * Generate encoded WhatsApp redirect URL for user to contact manager
 */
export function generateWhatsAppRedirectURL(customOrder) {
    const message = `Halo admin, saya sudah bayar DP untuk custom order.

🧾 Order ID: #${customOrder.id}
📦 Jenis Produk: ${customOrder.product_type}
💰 DP Dibayar: Rp ${Number(customOrder.dp_amount).toLocaleString('id-ID')}
📝 Deskripsi Desain: ${customOrder.description || '-'}
${customOrder.deadline ? `📅 Deadline: ${customOrder.deadline}` : ''}

Mohon diproses ya, terima kasih 🙏`;

    return `https://wa.me/${MANAGER_WA_NUMBER}?text=${encodeURIComponent(message)}`;
}
