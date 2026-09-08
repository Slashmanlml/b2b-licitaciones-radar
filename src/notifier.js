'use strict';

const TELEGRAM_API = 'https://api.telegram.org';

/**
 * Despacho por Telegram.
 *
 * A diferencia de la versión anterior, verifica la respuesta de la API: antes
 * se hacía `await fetch(...)` sin mirar el resultado y se imprimía "alerta
 * despachada" aunque Telegram hubiera rechazado el mensaje.
 */
class TelegramNotifier {
  constructor({ token = process.env.TELEGRAM_BOT_TOKEN, chatId = process.env.TELEGRAM_CHAT_ID } = {}) {
    this.token = token;
    this.chatId = chatId;
  }

  get configured() {
    return Boolean(this.token && this.chatId);
  }

  /** Devuelve true si Telegram confirmó el envío. Nunca lanza: informa y sigue. */
  async send(text) {
    if (!this.configured) {
      console.log('[telegram] TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID sin configurar: no se despacha.');
      return false;
    }
    try {
      const res = await fetch(`${TELEGRAM_API}/bot${this.token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: this.chatId,
          text,
          parse_mode: 'MarkdownV2',
          disable_web_page_preview: true,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        console.error(`[telegram] rechazado (HTTP ${res.status}): ${data.description || 'sin detalle'}`);
        return false;
      }
      return true;
    } catch (err) {
      console.error(`[telegram] error de red: ${err.message}`);
      return false;
    }
  }
}

module.exports = { TelegramNotifier };
