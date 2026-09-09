'use strict';

const logger = require('../logger');

/**
 * Proveedor REAL contra el dataset abierto "Sistema de Contrataciones
 * Electrónicas" de datos.gob.ar (COMPR.AR, bienes y servicios, 2016-2026).
 *
 * Fuente: https://datos.gob.ar/dataset/sistema-de-contrataciones-electronicas
 * Recurso: "Convocatorias 2016 - 2026" (CSV, formato EDCA/OCDS, sin auth).
 *
 * El portal comprar.gob.ar NO expone API pública, por eso se usa el CSV abierto.
 * El archivo completo pesa ~55 MB, así que NO se descarga entero: se pide solo
 * la cola con un `Range: bytes=-N` (el archivo agrega filas en orden
 * cronológico) y se filtra por ventana de publicación.
 *
 * Limitaciones honestas:
 *  - El dataset se actualiza por tandas (puede ir semanas atrás del portal).
 *  - El CSV no trae enlace por fila: `enlace` apunta a la página del dataset y
 *    el N° de proceso va en el título para ubicarlo en el portal.
 *  - Primera corrida con este proveedor: despacha hasta MAX_ROWS (lo más nuevo
 *    primero); después la deduplicación deja solo lo no visto.
 */

const DATASET_PAGE = 'https://datos.gob.ar/dataset/sistema-de-contrataciones-electronicas';
const DEFAULT_CSV_URL = 'https://infra.datos.gob.ar/catalog/jgm/dataset/4/distribution/4.21/download/Convocatorias.csv';

const name = 'datosgobar';
const isReal = true;

/** Índices de las columnas que nos interesan (según el header del CSV). */
const COLS = {
    numero: 'Numero_Proceso',
    organismo: 'Descripcion_SAF',
    tipo: 'Tipo_de_Procedimiento',
    publicacion: 'Fecha_de_Publicacion',
    apertura: 'Fecha_de_Apertura',
    nombre: 'Nombre_del_Proceso',
    monto: 'Monto_Estimado',
};

/** Parser CSV mínimo (comillas + comas) sin dependencias. */
const parseCsv = text => {
    const rows = [];
    let row = [];
    let field = '';
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
        const c = text[i];
        if (inQuotes) {
            if (c === '"') {
                if (text[i + 1] === '"') { field += '"'; i++; } // comilla escapada
                else inQuotes = false;
            } else field += c;
        } else if (c === '"') inQuotes = true;
        else if (c === ',') { row.push(field); field = ''; }
        else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
        else if (c !== '\r') field += c;
    }
    if (field !== '' || row.length > 0) { row.push(field); rows.push(row); }
    return rows;
};

/** "27/05/2026 10:00:00 a.m." -> Date (solo fecha) o null si no parsea. */
const parseFechaPub = value => {
    const m = /(\d{2})\/(\d{2})\/(\d{4})/.exec(String(value || ''));
    if (!m) return null;
    const d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
    return Number.isNaN(d.getTime()) ? null : d;
};

const daysAgo = n => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - n);
    return d;
};

/**
 * Mapea filas del CSV al shape que espera `src/tender.js`.
 * Descarta filas con columnas incompletas o fecha fuera de ventana.
 */
const mapRows = (rows, { windowDays }) => {
    if (rows.length === 0) return [];
    const header = rows[0];
    const idx = {};
    for (const [key, col] of Object.entries(COLS)) {
        idx[key] = header.indexOf(col);
        if (idx[key] === -1) throw new Error(`El CSV no trae la columna esperada: ${col}`);
    }
    const since = daysAgo(windowDays);
    const out = [];
    let descartadas = 0;
    for (const row of rows.slice(1)) {
        if (row.length !== header.length) { descartadas++; continue; }
        const fecha = parseFechaPub(row[idx.publicacion]);
        if (!fecha || fecha < since) { descartadas++; continue; }
        out.push({
            _fecha: fecha,
            organismo: row[idx.organismo].trim(),
            titulo: `${row[idx.nombre].trim()} (${row[idx.numero].trim()})`,
            categoria: row[idx.tipo].trim(),
            montoEstimado: row[idx.monto].trim() ? `$ ${row[idx.monto].trim()}` : null,
            apertura: row[idx.apertura].trim(),
            enlace: DATASET_PAGE,
        });
    }
    return { tenders: out, descartadas };
};

const fetchTenders = async ({
    csvUrl = process.env.DATOSGOBAR_CSV_URL || DEFAULT_CSV_URL,
    tailBytes = Number(process.env.DATOSGOBAR_TAIL_BYTES) || 3000000,
    windowDays = Number(process.env.DATOSGOBAR_WINDOW_DAYS) || 120,
    maxRows = Number(process.env.DATOSGOBAR_MAX_ROWS) || 25,
    fetchFn = fetch,
} = {}) => {
    logger.info(`[datosgobar] descargando header + cola del CSV (${tailBytes} bytes)...`);
    const headRes = await fetchFn(csvUrl, { headers: { Range: 'bytes=0-3000' } });
    if (!headRes.ok && headRes.status !== 206) {
        throw new Error(`No se pudo leer el header del CSV (HTTP ${headRes.status}) desde ${csvUrl}`);
    }
    const headText = Buffer.from(await headRes.arrayBuffer()).toString('utf8').replace(/^\uFEFF/, '');
    const header = parseCsv(headText)[0];
    if (!header) throw new Error('El CSV vino vacío.');

    const res = await fetchFn(csvUrl, { headers: { Range: `bytes=-${tailBytes}` } });
    if (!res.ok && res.status !== 206) {
        throw new Error(`No se pudo descargar el CSV (HTTP ${res.status}) desde ${csvUrl}`);
    }
    const buf = Buffer.from(await res.arrayBuffer());
    let text = buf.toString('utf8');
    // La primera línea viene cortada (empezamos a mitad de fila): se descarta.
    // El header se pidió aparte porque vive al inicio del archivo.
    text = text.slice(text.indexOf('\n') + 1);

    const rows = [header, ...parseCsv(text)];
    const { tenders, descartadas } = mapRows(rows, { windowDays });
    if (descartadas > 0) logger.info(`[datosgobar] ${descartadas} fila(s) fuera de ventana o incompletas.`);
    tenders.sort((a, b) => b._fecha - a._fecha);
    const top = tenders.slice(0, maxRows).map(({ _fecha, ...t }) => t);
    logger.info(`[datosgobar] convocatorias en ventana: ${tenders.length} | se devuelven: ${top.length}`);
    return top;
};

module.exports = { name, isReal, fetchTenders, parseCsv, parseFechaPub, mapRows, DATASET_PAGE, DEFAULT_CSV_URL };
