'use strict';

const logger = require('./logger');
const { callTelegramApi } = require('./telegram');

/**
 * Despacho por Telegram, con reintentos y backoff exponencial.
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
  async send(text, chatId = this.chatId) {
    if (!this.token || !chatId) {
      logger.warn('[telegram] sin token o chat destino: no se despacha.');
      return false;
    }
    const res = await callTelegramApi(this.token, 'sendMessage', {
      chat_id: chatId,
      text,
      parse_mode: 'MarkdownV2',
      disable_web_page_preview: true,
    });
    if (!res.ok) {
      logger.error(`[telegram] no se pudo despachar tras ${res.attempts} intento(s): ${res.error.message}`);
      return false;
    }
    return true;
  }
}

module.exports = { TelegramNotifier };
