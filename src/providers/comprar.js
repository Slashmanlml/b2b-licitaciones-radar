'use strict';

/**
 * Proveedor REAL contra el portal de compras públicas. TODAVÍA NO IMPLEMENTADO.
 *
 * Este archivo existe para dejar explícito qué falta y por dónde entra, en vez
 * de simular la conexión. El resto del pipeline ya está listo para recibirlo:
 * solo tiene que devolver objetos con el shape que espera `src/tender.js`
 * (`organismo`, `titulo`, `categoria`, `montoEstimado`, `apertura`, `enlace`).
 *
 * Pendiente de resolver antes de implementarlo:
 *
 *  1. Fuente. COMPR.AR publica los llamados vigentes por interfaz web; hay que
 *     verificar si expone un endpoint JSON estable o si hay que parsear HTML.
 *     Chequear también si existe un feed abierto en datos.gob.ar, que sería
 *     preferible por estabilidad y por licencia de uso.
 *  2. Términos de uso y robots.txt del portal antes de automatizar nada.
 *  3. Paginación y ventana temporal: traer solo los llamados publicados desde
 *     la última corrida, no el catálogo completo.
 *  4. Ritmo de requests y reintentos con backoff, para no golpear el portal.
 *  5. Mapeo de rubros del portal a las categorías internas.
 *
 * Mientras tanto falla de forma explícita: es preferible que el proceso corte
 * con un mensaje claro antes que devolver datos inventados que parezcan reales.
 */

const name = 'comprar';
const isReal = true;

const fetchTenders = async () => {
  throw new Error(
    'El proveedor "comprar" todavía no está implementado. ' +
      'Usá PROVIDER=fixture para correr el pipeline con datos de ejemplo.'
  );
};

module.exports = { name, isReal, fetchTenders };
