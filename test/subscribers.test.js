'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const { parseSubscribers, matchSubscribers, cleanCategorias } = require('../src/subscribers');

describe('suscriptores: parseo', () => {
    it('sin SUBSCRIBERS_JSON usa el destino único', () => {
        const subs = parseSubscribers({ json: '', defaultChatId: '999' });
        assert.deepEqual(subs, [{ chatId: '999', categorias: [] }]);
    });

    it('sin nada configurado devuelve lista vacía', () => {
        assert.deepEqual(parseSubscribers({ json: '', defaultChatId: '' }), []);
    });

    it('parsea chatIds y normaliza categorías', () => {
        const subs = parseSubscribers({
            json: '[{"chatId":123,"categorias":["tecnologia"," SALUD ","TECNOLOGIA"]}]',
            defaultChatId: '999',
        });
        assert.deepEqual(subs, [{ chatId: '123', categorias: ['TECNOLOGIA', 'SALUD'] }]);
    });

    it('ante JSON inválido vuelve al destino único (fail-safe)', () => {
        const subs = parseSubscribers({ json: 'no-json', defaultChatId: '999' });
        assert.deepEqual(subs, [{ chatId: '999', categorias: [] }]);
    });

    it('ignora entradas sin chatId', () => {
        const subs = parseSubscribers({
            json: '[{"categorias":["X"]}]',
            defaultChatId: '999',
        });
        assert.deepEqual(subs, [{ chatId: '999', categorias: [] }]);
    });
});

describe('suscriptores: matching por rubro', () => {
    const subs = [
        { chatId: 'A', categorias: [] },
        { chatId: 'B', categorias: ['TECNOLOGIA'] },
        { chatId: 'C', categorias: ['*'] },
    ];

    it('lista vacía o * reciben todo', () => {
        const to = matchSubscribers({ categoria: 'SALUD' }, subs);
        assert.deepEqual(to, ['A', 'C']);
    });

    it('categoría exacta recibe (insensible a mayúsculas)', () => {
        const to = matchSubscribers({ categoria: 'tecnologia' }, subs);
        assert.deepEqual(to, ['A', 'B', 'C']);
    });

    it('sin suscriptores no hay destinos', () => {
        assert.deepEqual(matchSubscribers({ categoria: 'X' }, []), []);
    });
});

describe('suscriptores: limpieza', () => {
    it('tolera no-array', () => {
        assert.deepEqual(cleanCategorias('X'), []);
        assert.deepEqual(cleanCategorias(null), []);
    });
});
