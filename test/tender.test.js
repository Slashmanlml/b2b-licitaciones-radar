'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { buildId, normalize } = require('../src/tender');

test('el id se deriva del contenido, no del azar', () => {
  const base = { organismo: 'Ministerio X', titulo: 'Compra de servidores', apertura: '2026-09-25' };
  // Dos corridas distintas sobre la misma licitación tienen que dar el mismo id.
  assert.equal(buildId(base), buildId({ ...base }));
});

test('licitaciones distintas producen ids distintos', () => {
  const a = { organismo: 'Ministerio X', titulo: 'Compra de servidores', apertura: '2026-09-25' };
  const b = { organismo: 'Ministerio X', titulo: 'Compra de notebooks', apertura: '2026-09-25' };
  assert.notEqual(buildId(a), buildId(b));
});

test('el id ignora mayúsculas y espacios sobrantes', () => {
  const a = { organismo: 'Ministerio X', titulo: 'Compra', apertura: '2026-09-25' };
  const b = { organismo: '  ministerio x ', titulo: ' COMPRA', apertura: '2026-09-25' };
  assert.equal(buildId(a), buildId(b));
});

test('normalize descarta registros sin campos obligatorios', () => {
  assert.equal(normalize({ organismo: 'X' }), null);
  assert.equal(normalize(null), null);
  assert.equal(normalize({ organismo: 'X', titulo: '', categoria: 'A', apertura: 'B', enlace: 'C' }), null);
});

test('normalize completa id, categoría en mayúsculas y fecha de detección', () => {
  const t = normalize({
    organismo: 'Ministerio X',
    titulo: 'Compra de servidores',
    categoria: 'tecnologia',
    apertura: '2026-09-25',
    enlace: 'https://example.org/a',
  });
  assert.ok(t.id.startsWith('LIC-'));
  assert.equal(t.categoria, 'TECNOLOGIA');
  assert.equal(t.montoEstimado, null);
  assert.ok(!Number.isNaN(Date.parse(t.detectadaEn)));
});
