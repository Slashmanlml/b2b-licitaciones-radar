'use strict';

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');

const { callTelegramApi } = require('../src/telegram');

const okRes = (extra = {}) => ({ ok: true, status: 200, json: async () => ({ ok: true, ...extra }) });
const failRes = (status, description = 'error') => ({ ok: false, status, json: async () => ({ ok: false, description }) });

describe('telegram: reintentos con backoff', () => {
    let realFetch;
    beforeEach(() => { realFetch = global.fetch; });
    afterEach(() => { global.fetch = realFetch; });

    it('éxito al primer intento', async () => {
        let calls = 0;
        global.fetch = async () => { calls++; return okRes({ result: {} }); };
        const r = await callTelegramApi('tok', 'sendMessage', {}, { baseDelayMs: 1 });
        assert.equal(r.ok, true);
        assert.equal(r.attempts, 1);
        assert.equal(calls, 1);
    });

    it('reintenta errores de red y luego tiene éxito', async () => {
        let calls = 0;
        global.fetch = async () => { calls++; if (calls < 3) throw new Error('boom'); return okRes(); };
        const r = await callTelegramApi('tok', 'sendMessage', {}, { baseDelayMs: 1 });
        assert.equal(r.ok, true);
        assert.equal(r.attempts, 3);
    });

    it('un 400 no se reintenta', async () => {
        let calls = 0;
        global.fetch = async () => { calls++; return failRes(400, 'Bad Request'); };
        const r = await callTelegramApi('tok', 'sendMessage', {}, { baseDelayMs: 1 });
        assert.equal(r.ok, false);
        assert.equal(r.attempts, 1);
        assert.equal(calls, 1);
    });

    it('un 500 se reintenta hasta agotar los intentos', async () => {
        let calls = 0;
        global.fetch = async () => { calls++; return failRes(500); };
        const r = await callTelegramApi('tok', 'sendMessage', {}, { retries: 3, baseDelayMs: 1 });
        assert.equal(r.ok, false);
        assert.equal(r.attempts, 3);
        assert.equal(calls, 3);
    });
});
