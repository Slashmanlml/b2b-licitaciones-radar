'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { SeenStore, parseApertura } = require('../src/store');
const { buildExpiryAlert } = require('../src/format');

const tmpFile = () =>
    path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'radar-exp-')), 'vistas.json');

const fmtISO = d => d.toISOString().slice(0, 10);
const fmtAR = d =>
    `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()} 10:00:00 a.m.`;
const plusDays = n => {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return d;
};

describe('vencimientos: parseo de apertura', () => {
    it('acepta ISO (fixture)', () => {
        const d = parseApertura('2026-09-25');
        assert.equal(d.getFullYear(), 2026);
        assert.equal(d.getMonth(), 8);
        assert.equal(d.getDate(), 25);
    });

    it('acepta DD/MM/YYYY (datosgobar)', () => {
        const d = parseApertura('27/05/2026 10:00:00 a.m.');
        assert.equal(d.getFullYear(), 2026);
        assert.equal(d.getMonth(), 4);
        assert.equal(d.getDate(), 27);
    });

    it('devuelve null si no hay fecha válida', () => {
        assert.equal(parseApertura(''), null);
        assert.equal(parseApertura('próximamente'), null);
        assert.equal(parseApertura(null), null);
    });
});

describe('vencimientos: dueForExpiry', () => {
    const seed = () => [
        { id: 'LIC-hoy', apertura: fmtISO(new Date()) },
        { id: 'LIC-manana', apertura: fmtAR(plusDays(1)) },
        { id: 'LIC-lejos', apertura: fmtISO(plusDays(30)) },
        { id: 'LIC-vencida', apertura: fmtISO(plusDays(-5)) },
        { id: 'LIC-sin-fecha', apertura: 'a definir' },
        { id: 'LIC-avisada', apertura: fmtISO(plusDays(1)), expiryAlertedAt: '2026-01-01T00:00:00.000Z' },
    ];

    it('devuelve solo las que abren en ventana y no avisadas, con diasRestantes', () => {
        const file = tmpFile();
        const store = new SeenStore(file);
        store.commit(seed());
        const due = store.dueForExpiry(3);
        assert.deepEqual(due.map(t => t.id).sort(), ['LIC-hoy', 'LIC-manana']);
        assert.equal(due.find(t => t.id === 'LIC-hoy').diasRestantes, 0);
        assert.equal(due.find(t => t.id === 'LIC-manana').diasRestantes, 1);
    });

    it('markExpiryAlerted las excluye en la próxima corrida y persiste', () => {
        const file = tmpFile();
        const store = new SeenStore(file);
        store.commit(seed());
        store.markExpiryAlerted(['LIC-hoy']);
        const due = store.dueForExpiry(3);
        assert.deepEqual(due.map(t => t.id), ['LIC-manana']);
        const saved = new SeenStore(file).load();
        assert.ok(saved.find(t => t.id === 'LIC-hoy').expiryAlertedAt);
    });
});

describe('vencimientos: mensaje', () => {
    it('dice HOY cuando abre hoy y escapa el título', () => {
        const msg = buildExpiryAlert({
            titulo: 'Compra [urgente]_ya',
            organismo: 'Ministerio',
            categoria: 'SALUD',
            apertura: 'hoy',
            id: 'LIC-1',
            enlace: 'https://x.test',
            diasRestantes: 0,
        });
        assert.ok(msg.includes('HOY'));
        assert.ok(msg.includes('Compra \\[urgente\\]\\_ya'));
    });

    it('dice los días restantes y marca demo', () => {
        const msg = buildExpiryAlert({
            titulo: 'T', organismo: 'O', categoria: 'C',
            apertura: 'x', id: 'LIC-2', enlace: 'https://x.test',
            diasRestantes: 2,
        }, { demo: true });
        assert.ok(msg.includes('2 día(s)'));
        assert.ok(msg.includes('DATOS DE EJEMPLO'));
    });
});
