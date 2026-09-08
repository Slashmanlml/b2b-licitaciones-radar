#!/usr/bin/env node
'use strict';

const { getProvider } = require('./src/providers');
const { normalize } = require('./src/tender');
const { SeenStore } = require('./src/store');
const { buildAlert } = require('./src/format');
const { TelegramNotifier } = require('./src/notifier');

const DISPATCH_DELAY_MS = 800;
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function main() {
  const provider = getProvider();
  const demo = !provider.isReal;

  console.log(`[radar] proveedor: ${provider.name}${demo ? '  (DATOS DE EJEMPLO)' : ''}`);
  if (demo) {
    console.log('[radar] ATENCIÓN: no se está consultando ningún portal real.');
  }

  const raw = await provider.fetchTenders();
  const tenders = raw.map(normalize).filter(Boolean);
  const descartadas = raw.length - tenders.length;
  if (descartadas > 0) {
    console.warn(`[radar] ${descartadas} registro(s) descartado(s) por campos faltantes.`);
  }

  const store = new SeenStore();
  const nuevas = store.filterNew(tenders);
  console.log(`[radar] recibidas: ${tenders.length} | nuevas: ${nuevas.length}`);

  const notifier = new TelegramNotifier();
  let despachadas = 0;

  for (const tender of nuevas) {
    const ok = await notifier.send(buildAlert(tender, { demo }));
    if (ok) despachadas++;
    if (nuevas.length > 1) await sleep(DISPATCH_DELAY_MS);
  }

  // El historial se actualiza aunque el despacho no esté configurado: lo que
  // registra es "esta licitación ya fue procesada", no "fue enviada".
  store.commit(nuevas);

  console.log(`[radar] listo. nuevas: ${nuevas.length} | despachadas por Telegram: ${despachadas}`);
  return { recibidas: tenders.length, nuevas: nuevas.length, despachadas };
}

if (require.main === module) {
  main().catch(err => {
    console.error(`[radar] error: ${err.message}`);
    process.exit(1);
  });
}

module.exports = { main };
