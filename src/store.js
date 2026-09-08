'use strict';

const fs = require('node:fs');
const path = require('node:path');

const DEFAULT_FILE = path.join(__dirname, '..', 'data', 'licitaciones_vistas.json');
const MAX_HISTORY = 500;

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
      console.warn(`[store] historial ilegible (${err.message}); se arranca vacío.`);
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
    fs.mkdirSync(path.dirname(this.file), { recursive: true });
    const merged = [...tenders, ...this.load()].slice(0, MAX_HISTORY);
    fs.writeFileSync(this.file, JSON.stringify(merged, null, 2) + '\n', 'utf-8');
  }
}

module.exports = { SeenStore, DEFAULT_FILE, MAX_HISTORY };
