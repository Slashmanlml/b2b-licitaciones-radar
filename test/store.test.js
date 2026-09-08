'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { SeenStore } = require('../src/store');

const tmpFile = () =>
  path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'radar-')), 'sub', 'vistas.json');

test('crea el directorio de datos si no existe (antes reventaba con ENOENT)', () => {
  const file = tmpFile();
  const store = new SeenStore(file);
  store.commit([{ id: 'LIC-1' }]);
  assert.ok(fs.existsSync(file));
});

test('no vuelve a despachar una licitación ya registrada', () => {
  const store = new SeenStore(tmpFile());
  const t = { id: 'LIC-abc' };
  assert.equal(store.filterNew([t]).length, 1);
  store.commit([t]);
  assert.equal(store.filterNew([t]).length, 0);
});

test('deduplica repetidos dentro de la misma corrida', () => {
  const store = new SeenStore(tmpFile());
  const nuevas = store.filterNew([{ id: 'LIC-x' }, { id: 'LIC-x' }, { id: 'LIC-y' }]);
  assert.deepEqual(nuevas.map(t => t.id), ['LIC-x', 'LIC-y']);
});

test('un historial corrupto no rompe la corrida', () => {
  const file = tmpFile();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, '{ esto no es json valido');
  const store = new SeenStore(file);
  assert.deepEqual(store.load(), []);
  assert.equal(store.filterNew([{ id: 'LIC-z' }]).length, 1);
});

test('commit sin novedades no toca el disco', () => {
  const file = tmpFile();
  new SeenStore(file).commit([]);
  assert.equal(fs.existsSync(file), false);
});
