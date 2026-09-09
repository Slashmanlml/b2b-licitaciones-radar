#!/usr/bin/env node
'use strict';

const { getProvider } = require('./src/providers');
const { normalize } = require('./src/tender');
const { SeenStore } = require('./src/store');
const { buildAlert, buildExpiryAlert } = require('./src/format');
const { TelegramNotifier } = require('./src/notifier');
const { parseSubscribers, matchSubscribers } = require('./src/subscribers');
const logger = require('./src/logger');

const DISPATCH_DELAY_MS = 800;
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function main() {
  const provider = getProvider();
  const demo = !provider.isReal;

  logger.log(`[radar] proveedor: ${provider.name}${demo ? '  (DATOS DE EJEMPLO)' : ''}`);
  if (demo) {
    logger.log('[radar] ATENCIÓN: no se está consultando ningún portal real.');
  }

  const raw = await provider.fetchTenders();
  const tenders = raw.map(normalize).filter(Boolean);
  const descartadas = raw.length - tenders.length;
  if (descartadas > 0) {
    logger.warn(`[radar] ${descartadas} registro(s) descartado(s) por campos faltantes.`);
  }

  const store = new SeenStore();
  const nuevas = store.filterNew(tenders);
  logger.log(`[radar] recibidas: ${tenders.length} | nuevas: ${nuevas.length}`);

  const notifier = new TelegramNotifier();
  const subscribers = parseSubscribers();
  if (subscribers.length > 1) {
    logger.log(`[radar] ${subscribers.length} suscriptores con filtro de rubros.`);
  }
  let despachadas = 0;
  let envios = 0;

  for (const tender of nuevas) {
    const destinos = matchSubscribers(tender, subscribers);
    for (const chatId of destinos) {
      if (envios > 0) await sleep(DISPATCH_DELAY_MS);
      envios++;
      const ok = await notifier.send(buildAlert(tender, { demo }), chatId);
      if (ok) despachadas++;
    }
  }

  // El historial se actualiza aunque el despacho no esté configurado: lo que
  // registra es "esta licitación ya fue procesada", no "fue enviada".
  store.commit(nuevas);

  // Alertas de vencimiento: ya notificadas, abren dentro de EXPIRY_DAYS días
  // y aún no se avisó su vencimiento. Respetan el filtro de rubros.
  const expiryDays = Number(process.env.EXPIRY_DAYS) || 3;
  const porVencer = store.dueForExpiry(expiryDays);
  let vencimientos = 0;
  const avisadas = [];
  for (const tender of porVencer) {
    const destinos = matchSubscribers(tender, subscribers);
    let okAlguno = destinos.length === 0;
    for (const chatId of destinos) {
      if (envios > 0) await sleep(DISPATCH_DELAY_MS);
      envios++;
      const ok = await notifier.send(buildExpiryAlert(tender, { demo }), chatId);
      if (ok) { vencimientos++; okAlguno = true; }
    }
    // Se marca solo si se avisó (o no había a quién): si falló el envío se
    // reintenta en la próxima corrida en vez de perder la alerta.
    if (okAlguno) avisadas.push(tender.id);
  }
  if (avisadas.length > 0) store.markExpiryAlerted(avisadas);

  logger.log(`[radar] listo. nuevas: ${nuevas.length} | despachadas por Telegram: ${despachadas} | vencimientos: ${vencimientos}`);
  return { recibidas: tenders.length, nuevas: nuevas.length, despachadas, vencimientos };
}

if (require.main === module) {
  main().catch(err => {
    logger.error(`[radar] error: ${err.message}`);
    process.exit(1);
  });
}

module.exports = { main };
