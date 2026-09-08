'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { getProvider } = require('../src/providers');
const { normalize } = require('../src/tender');

test('el proveedor por defecto es el de ejemplo y se declara como no real', async () => {
  const p = getProvider(undefined);
  assert.equal(p.name, 'fixture');
  assert.equal(p.isReal, false);
});

test('el proveedor real falla explícitamente en vez de inventar datos', async () => {
  const p = getProvider('comprar');
  await assert.rejects(() => p.fetchTenders(), /no está implementado/);
});

test('un proveedor inexistente se rechaza con la lista de opciones', () => {
  assert.throws(() => getProvider('inventado'), /Disponibles/);
});

test('los datos de ejemplo pasan la normalización y usan enlaces example.org', async () => {
  const raw = await getProvider('fixture').fetchTenders();
  const tenders = raw.map(normalize);
  assert.equal(tenders.filter(Boolean).length, raw.length);
  for (const t of tenders) assert.match(t.enlace, /^https:\/\/example\.org\//);
});

test('dos corridas del fixture producen los mismos ids', async () => {
  const p = getProvider('fixture');
  const ids1 = (await p.fetchTenders()).map(normalize).map(t => t.id);
  const ids2 = (await p.fetchTenders()).map(normalize).map(t => t.id);
  assert.deepEqual(ids1, ids2);
});
