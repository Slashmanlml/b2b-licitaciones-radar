'use strict';

/**
 * Proveedor de datos de EJEMPLO.
 *
 * No consulta ningún portal: devuelve un conjunto fijo de licitaciones ficticias
 * con el mismo shape que devolvería el proveedor real. Existe para poder
 * desarrollar y testear el pipeline (normalización, deduplicación, formato y
 * despacho) sin depender de la red ni del formato del portal.
 *
 * Los enlaces son `https://example.org/...` a propósito: así queda claro, para
 * cualquiera que lea la salida, que estos datos NO son reales.
 */

const SAMPLE = [
  {
    organismo: 'Ministerio de Salud (organismo de ejemplo)',
    titulo: 'Adquisición de equipamiento informático y servidores',
    categoria: 'TECNOLOGIA',
    montoEstimado: '$ 45.000.000 ARS',
    apertura: '2026-09-25',
    enlace: 'https://example.org/licitaciones/demo-tecnologia',
  },
  {
    organismo: 'Hospital Regional (organismo de ejemplo)',
    titulo: 'Provisión de insumos descartables y reactivos de laboratorio',
    categoria: 'SALUD',
    montoEstimado: '$ 28.500.000 ARS',
    apertura: '2026-09-19',
    enlace: 'https://example.org/licitaciones/demo-salud',
  },
  {
    organismo: 'Agencia de Recaudación (organismo de ejemplo)',
    titulo: 'Contratación de servicios de auditoría de ciberseguridad',
    categoria: 'TECNOLOGIA',
    montoEstimado: '$ 18.200.000 ARS',
    apertura: '2026-09-28',
    enlace: 'https://example.org/licitaciones/demo-seguridad',
  },
];

const name = 'fixture';

/** Marca que estos datos no salen de ningún portal real. */
const isReal = false;

const fetchTenders = async () => SAMPLE.map(t => ({ ...t }));

module.exports = { name, isReal, fetchTenders, SAMPLE };
