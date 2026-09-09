'use strict';

const logger = require('./logger');

const TELEGRAM_API = 'https://api.telegram.org';
const sleep = ms => new Promise(r => setTimeout(r, ms));

const isRetryableStatus = status => status === 429 || status >= 500;

/**
 * Llama a la Bot API de Telegram con reintentos y backoff exponencial.
 *
 * - Reintenta errores de red y HTTP 429/5xx (hasta `retries` intentos).
 * - Los 4xx (ej. token inválido) no se reintentan: fallan rápido.
 * - Nunca lanza: devuelve { ok, data?, error?, attempts }.
 */
async function callTelegramApi(token, method, payload, { retries = 3, baseDelayMs = 1000 } = {}) {
    let lastError = new Error('sin intentos');
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const res = await fetch(`${TELEGRAM_API}/bot${token}/${method}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const data = await res.json().catch(() => ({}));
            if (res.ok && data.ok === true) return { ok: true, data, attempts: attempt };
            if (!isRetryableStatus(res.status)) {
                return {
                    ok: false,
                    error: new Error(`Telegram rechazó (HTTP ${res.status}): ${data.description || 'sin detalle'}`),
                    attempts: attempt,
                };
            }
            lastError = new Error(`Telegram respondió HTTP ${res.status} (intento ${attempt}/${retries})`);
            logger.warn(`[telegram] ${lastError.message}: reintentando...`);
        } catch (err) {
            lastError = err;
            logger.warn(`[telegram] error de red (intento ${attempt}/${retries}): ${err.message}`);
        }
        if (attempt < retries) await sleep(baseDelayMs * 2 ** (attempt - 1));
    }
    return { ok: false, error: lastError, attempts: retries };
}

module.exports = { callTelegramApi, TELEGRAM_API };
