'use strict';

const fs = require('node:fs');
const path = require('node:path');
const logger = require('./logger');

const DEFAULT_FILE = path.join(__dirname, '..', 'data', 'licitaciones_vistas.json');
const MAX_HISTORY = 500;
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Parsea la fecha de apertura en los formatos que usan los proveedores:
 * ISO ("2026-09-25", fixture) o "27/05/2026 10:00:00 a.m." (datosgobar).
 * Devuelve Date (medianoche) o null si no parsea.
 */
const parseApertura = value => {
  const s = String(value || '').trim();
  let m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  m = /(\d{2})\/(\d{2})\/(\d{4})/.exec(s);
  if (m) return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
  return null;
};

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * Historial de licitaciones ya despachadas, en un JSON plano.
 *
 * Corrige dos fallas de la versión anterior:
 *  1. escribía en `data/` sin crear el directorio, así que reventaba con ENOENT
 *     en cada ejecución (la carpeta no estaba en el repo);
 *  2. no distinguía "archivo ausente" de "archivo corrupto", y en ambos casos
 *     seguía en silencio.
 */
class SeenStore {
  constructor(file = DEFAULT_FILE) {
    this.file = file;
  }

  /** Ids ya vistos. Un archivo ausente o ilegible se trata como historial vacío. */
  load() {
    if (!fs.existsSync(this.file)) return [];
    try {
      const parsed = JSON.parse(fs.readFileSync(this.file, 'utf-8'));
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      logger.warn(`[store] historial ilegible (${err.message}); se arranca vacío.`);
      return [];
    }
  }

  /** Devuelve solo las licitaciones cuyo id no figure en el historial. */
  filterNew(tenders) {
    const seen = new Set(this.load().map(t => t.id));
    const out = [];
    const batch = new Set();
    for (const t of tenders) {
      // `batch` evita despachar dos veces la misma licitación si el proveedor
      // la devuelve repetida dentro de la misma corrida.
      if (seen.has(t.id) || batch.has(t.id)) continue;
      batch.add(t.id);
      out.push(t);
    }
    return out;
  }

  /** Agrega las nuevas al historial y lo persiste, creando `data/` si no existe. */
  commit(tenders) {
    if (tenders.length === 0) return;
    const merged = [...tenders, ...this.load()].slice(0, MAX_HISTORY);
    this.save(merged);
  }

  /** Persiste el historial completo, creando `data/` si no existe. */
  save(history) {
    fs.mkdirSync(path.dirname(this.file), { recursive: true });
    fs.writeFileSync(this.file, JSON.stringify(history, null, 2) + '\n', 'utf-8');
  }

  /**
   * Licitaciones ya notificadas cuya apertura cae dentro de los próximos
   * `days` días y aún no recibieron alerta de vencimiento. Cada una vuelve
   * con `diasRestantes` (0 = abre hoy). Vencidas o sin fecha válida se ignoran.
   */
  dueForExpiry(days) {
    const today = startOfToday().getTime();
    const out = [];
    for (const t of this.load()) {
      if (t.expiryAlertedAt) continue;
      const fecha = parseApertura(t.apertura);
      if (!fecha) continue;
      const diff = Math.round((fecha.getTime() - today) / DAY_MS);
      if (diff < 0 || diff > days) continue;
      out.push({ ...t, diasRestantes: diff });
    }
    return out;
  }

  /** Marca licitaciones como "alerta de vencimiento enviada" y persiste. */
  markExpiryAlerted(ids) {
    const set = new Set(ids);
    const history = this.load().map(t =>
      set.has(t.id) ? { ...t, expiryAlertedAt: new Date().toISOString() } : t
    );
    this.save(history);
  }
}

module.exports = { SeenStore, DEFAULT_FILE, MAX_HISTORY, parseApertura };
