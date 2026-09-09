'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const { parseCsv, parseFechaPub, mapRows, fetchTenders } = require('../src/providers/datosgobar');

const fmt = d => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()} 10:00:00 a.m.`;
const daysAgoStr = n => {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return fmt(d);
};

const SAMPLE_CSV = [
    'Numero_Proceso,Descripcion_SAF,Tipo_de_Procedimiento,Fecha_de_Publicacion,Fecha_de_Apertura,Nombre_del_Proceso,Monto_Estimado',
    `47-0030-CDI26,607 - INIDEP,Contratación Directa,${daysAgoStr(2)},07/04/2026 10:00:00 a.m.,Cajones de pescado,"3,075,000.00"`,
    '23-0001-LPR17,301 - Secretaría General,Licitacion Privada,03/03/2017 08:00:00 p.m.,16/03/2017 02:00:00 p.m.,Servicio de café,"1,735,400.00"',
    'FILA,MALA,SIN,COLUMNAS',
].join('\n');

describe('datosgobar: parser CSV', () => {
    it('respeta comillas con comas adentro', () => {
        const rows = parseCsv('a,"b,c",d\n');
        assert.deepEqual(rows, [['a', 'b,c', 'd']]);
    });

    it('parsea fecha de publicación DD/MM/YYYY', () => {
        const d = parseFechaPub('27/05/2026 10:00:00 a.m.');
        assert.equal(d.getFullYear(), 2026);
        assert.equal(d.getMonth(), 4);
        assert.equal(d.getDate(), 27);
    });

    it('devuelve null con fecha inválida', () => {
        assert.equal(parseFechaPub('sin fecha'), null);
        assert.equal(parseFechaPub(''), null);
    });
});

describe('datosgobar: mapeo y ventana', () => {
    it('mapea al shape del pipeline y filtra por ventana', () => {
        const rows = parseCsv(SAMPLE_CSV);
        const { tenders, descartadas } = mapRows(rows, { windowDays: 30 });
        assert.equal(tenders.length, 1);
        assert.equal(descartadas, 2); // 2017 fuera de ventana + fila malformada
        const [t] = tenders;
        assert.equal(t.organismo, '607 - INIDEP');
        assert.ok(t.titulo.includes('47-0030-CDI26'));
        assert.equal(t.montoEstimado, '$ 3,075,000.00');
        assert.ok(t.enlace.startsWith('https://'));
    });

    it('falla claro si el CSV cambia de columnas', () => {
        assert.throws(() => mapRows([['Otra', 'Cabecera']], { windowDays: 30 }), /columna esperada/);
    });
});

describe('datosgobar: fetch con Range', () => {
    it('pide la cola del archivo y descarta la primera línea cortada', async () => {
        let seenRange = null;
        let calls = 0;
        const fetchFn = async (url, { headers }) => {
            calls++;
            // 1ª llamada: header limpio. 2ª: cola que empieza a mitad de fila.
            const body = calls === 1 ? SAMPLE_CSV : 'RTADA,607 - INIDEP\n' + SAMPLE_CSV;
            if (calls === 2) seenRange = headers.Range;
            return { ok: true, status: 206, arrayBuffer: async () => Buffer.from(body, 'utf8') };
        };
        const tenders = await fetchTenders({ fetchFn, windowDays: 30, maxRows: 10 });
        assert.match(seenRange, /^bytes=-\d+$/);
        assert.equal(tenders.length, 1);
        assert.ok(tenders[0].titulo.includes('Cajones de pescado'));
    });

    it('lanza si la descarga falla', async () => {
        const fetchFn = async () => ({ ok: false, status: 500, arrayBuffer: async () => Buffer.from('') });
        await assert.rejects(fetchTenders({ fetchFn }), /HTTP 500/);
    });
});
