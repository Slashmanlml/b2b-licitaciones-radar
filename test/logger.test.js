'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const logger = require('../src/logger');

describe('logger', () => {
    it('expone los cuatro niveles y no lanza', () => {
        for (const level of ['debug', 'info', 'warn', 'error']) {
            assert.equal(typeof logger[level], 'function');
        }
        assert.doesNotThrow(() => logger.info('hola'));
    });
});
