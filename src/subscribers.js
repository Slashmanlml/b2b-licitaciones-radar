'use strict';

const logger = require('./logger');

/**
 * Suscriptores con filtro de rubros.
 *
 * Cada suscriptor elige qué categorías recibir. Lista vacía o "*" = todo.
 * Las categorías se comparan en mayúsculas (normalize() ya las deja así).
 *
 * Configuración por variable de entorno (JSON), para no commitear chat IDs:
 *
 *   SUBSCRIBERS_JSON='[{"chatId":"123","categorias":["TECNOLOGIA","SALUD"]}]'
 *
 * Sin esa variable se usa el comportamiento histórico: un único destino
 * (TELEGRAM_CHAT_ID) que recibe todo.
 */

/** Normaliza la lista de categorías: mayúsculas, sin vacías ni duplicadas. */
const cleanCategorias = (list = []) => {
    const seen = new Set();
    for (const c of Array.isArray(list) ? list : []) {
        const v = String(c || '').trim().toUpperCase();
        if (v !== '' && !seen.has(v)) seen.add(v);
    }
    return [...seen];
};

/**
 * Parsea suscriptores desde env. Nunca lanza: ante JSON inválido avisa y
 * vuelve al destino único (fail-safe: mejor mandar de más que silenciar).
 */
const parseSubscribers = ({
    json = process.env.SUBSCRIBERS_JSON,
    defaultChatId = process.env.TELEGRAM_CHAT_ID,
} = {}) => {
    const fallback = defaultChatId ? [{ chatId: String(defaultChatId), categorias: [] }] : [];
    if (!json || String(json).trim() === '') return fallback;
    try {
        const parsed = JSON.parse(json);
        if (!Array.isArray(parsed)) throw new Error('debe ser un array');
        const out = [];
        for (const s of parsed) {
            if (!s || s.chatId === undefined || s.chatId === null || String(s.chatId).trim() === '') {
                logger.warn('[suscriptores] entrada sin chatId, se ignora.');
                continue;
            }
            out.push({ chatId: String(s.chatId), categorias: cleanCategorias(s.categorias) });
        }
        return out.length > 0 ? out : fallback;
    } catch (err) {
        logger.warn(`[suscriptores] SUBSCRIBERS_JSON inválido (${err.message}): se usa destino único.`);
        return fallback;
    }
};

/** Chat IDs destino para una licitación según su categoría. */
const matchSubscribers = (tender, subscribers) => {
    const cat = String(tender.categoria || '').trim().toUpperCase();
    return subscribers
        .filter(s => s.categorias.length === 0 || s.categorias.includes('*') || s.categorias.includes(cat))
        .map(s => s.chatId);
};

module.exports = { parseSubscribers, matchSubscribers, cleanCategorias };
