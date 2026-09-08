'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { buildAlert, escapeMd } = require('../src/format');

const tender = {
  id: 'LIC-abc123',
  organismo: 'Ministerio X',
  titulo: 'Compra de servidores',
  categoria: 'TECNOLOGIA',
  montoEstimado: '$ 1.000',
  apertura: '2026-09-25',
  enlace: 'https://example.org/a',
};

test('el mensaje de ejemplo se anuncia como tal', () => {
  const msg = buildAlert(tender, { demo: true });
  assert.match(msg, /DATOS DE EJEMPLO/);
});

test('el mensaje real no lleva la advertencia', () => {
  assert.doesNotMatch(buildAlert(tender, { demo: false }), /DATOS DE EJEMPLO/);
});

test('escapa los caracteres que rompen el Markdown de Telegram', () => {
  assert.equal(escapeMd('Compra (2026) - lote_1'), 'Compra \\(2026\\) \\- lote\\_1');
});

test('omite el monto cuando no vino informado', () => {
  const msg = buildAlert({ ...tender, montoEstimado: null }, {});
  assert.doesNotMatch(msg, /Monto estimado/);
});
