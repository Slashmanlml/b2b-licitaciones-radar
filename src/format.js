'use strict';

/** Escapa los caracteres que rompen el parseo Markdown de Telegram. */
const escapeMd = (text = '') => String(text).replace(/([_*[\]()~`>#+\-=|{}.!])/g, '\\$1');

/**
 * Arma el mensaje de alerta.
 *
 * `demo` agrega una advertencia bien visible. Sin eso, un mensaje con datos de
 * ejemplo es indistinguible de uno real, que es exactamente el problema que
 * tenía la versión anterior.
 */
const buildAlert = (tender, { demo = false } = {}) => {
  const lines = [];
  if (demo) lines.push('⚠️ *DATOS DE EJEMPLO — no es una licitación real*', '');
  lines.push(
    '🏛️ *Nueva licitación detectada*',
    '',
    `📋 *Pliego:* ${escapeMd(tender.titulo)}`,
    `🏢 *Organismo:* ${escapeMd(tender.organismo)}`,
    `🏷️ *Rubro:* ${escapeMd(tender.categoria)}`
  );
  if (tender.montoEstimado) lines.push(`💰 *Monto estimado:* ${escapeMd(tender.montoEstimado)}`);
  lines.push(
    `⏳ *Apertura:* ${escapeMd(tender.apertura)}`,
    `🆔 *ID:* ${escapeMd(tender.id)}`,
    '',
    `🔗 ${escapeMd(tender.enlace)}`
  );
  return lines.join('\n');
};

/**
 * Arma el mensaje de vencimiento próximo para una licitación ya notificada.
 * `diasRestantes` 0 = abre hoy.
 */
const buildExpiryAlert = (tender, { demo = false } = {}) => {
  const cuando = tender.diasRestantes === 0
    ? 'abre *HOY*'
    : `vence en *${tender.diasRestantes} día(s)*`;
  const lines = [];
  if (demo) lines.push('⚠️ *DATOS DE EJEMPLO — no es una licitación real*', '');
  lines.push(
    `⏳ *¡El pliego ${cuando}!*`,
    '',
    `📋 *Pliego:* ${escapeMd(tender.titulo)}`,
    `🏢 *Organismo:* ${escapeMd(tender.organismo)}`,
    `🏷️ *Rubro:* ${escapeMd(tender.categoria)}`
  );
  if (tender.montoEstimado) lines.push(`💰 *Monto estimado:* ${escapeMd(tender.montoEstimado)}`);
  lines.push(
    `⏳ *Apertura:* ${escapeMd(tender.apertura)}`,
    `🆔 *ID:* ${escapeMd(tender.id)}`,
    '',
    `🔗 ${escapeMd(tender.enlace)}`
  );
  return lines.join('\n');
};

module.exports = { buildAlert, buildExpiryAlert, escapeMd };
