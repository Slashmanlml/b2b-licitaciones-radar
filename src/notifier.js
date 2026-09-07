class TelegramNotifier {
    static async dispatchTenderAlert(tender) {
        const token = process.env.TELEGRAM_BOT_TOKEN;
        const chatId = process.env.TELEGRAM_CHAT_ID;

        if (!token || !chatId) {
            console.log('⚠️ [Telegram] Sin credenciales configuradas, saltando despacho.');
            return;
        }

        const mensaje = 
`🏛️ *NUEVA LICITACIÓN PÚBLICA DETECTADA*\n\n` +
`📋 *Pliego:* ${tender.titulo}\n` +
`🏢 *Organismo:* ${tender.organismo}\n` +
`🏷️ *Rubro:* \`${tender.categoria}\`\n` +
`💰 *Monto Estimado:* ${tender.montoEstimado}\n` +
`⏳ *Fecha de Cierre:* ${tender.apertura}\n` +
`🆔 *ID:* \`${tender.id}\`\n\n` +
`🔗 [Ver Pliego y Bases Oficiales](${tender.enlace})\n\n` +
`🔔 _Alerta exclusiva B2B Radar • Suscripción Activa_`;

        try {
            const url = `https://api.telegram.org/bot${token}/sendMessage`;
            await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: chatId,
                    text: mensaje,
                    parse_mode: 'Markdown',
                    disable_web_page_preview: true
                })
            });
            console.log(`📱 [Telegram] Alerta despachada para licitación: ${tender.id}`);
        } catch (e) {
            console.error('❌ Error al despachar Telegram:', e.message);
        }
    }
}

module.exports = TelegramNotifier;
