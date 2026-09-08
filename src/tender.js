'use strict';

const crypto = require('node:crypto');

/**
 * Identidad estable de una licitación.
 *
 * Antes el id se generaba con `Math.random()` en cada corrida, así que nunca
 * coincidía con el histórico y el filtro de duplicados no filtraba nada: las
 * mismas licitaciones se volvían a despachar en cada ejecución.
 *
 * La identidad tiene que salir del CONTENIDO, no del azar. Con esto, dos
 * corridas que ven la misma licitación producen el mismo id.
 */
const buildId = ({ organismo, titulo, apertura }) => {
  const seed = [organismo, titulo, apertura].map(v => String(v ?? '').trim().toLowerCase()).join('|');
  return 'LIC-' + crypto.createHash('sha1').update(seed).digest('hex').slice(0, 12);
};

const REQUIRED = ['organismo', 'titulo', 'categoria', 'apertura', 'enlace'];

/**
 * Valida y normaliza una licitación cruda del proveedor.
 * Devuelve `null` si le falta algún campo obligatorio, para que un proveedor
 * con datos parciales no rompa el pipeline entero.
 */
const normalize = raw => {
  if (!raw || typeof raw !== 'object') return null;
  for (const field of REQUIRED) {
    if (!raw[field] || String(raw[field]).trim() === '') return null;
  }
  const tender = {
    organismo: String(raw.organismo).trim(),
    titulo: String(raw.titulo).trim(),
    categoria: String(raw.categoria).trim().toUpperCase(),
    montoEstimado: raw.montoEstimado ? String(raw.montoEstimado).trim() : null,
    apertura: String(raw.apertura).trim(),
    enlace: String(raw.enlace).trim(),
    detectadaEn: new Date().toISOString(),
  };
  tender.id = buildId(tender);
  return tender;
};

module.exports = { buildId, normalize, REQUIRED };
