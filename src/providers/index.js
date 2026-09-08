'use strict';

const fixture = require('./fixture');
const comprar = require('./comprar');

const PROVIDERS = { fixture, comprar };

/**
 * Elige el proveedor de datos según la variable de entorno PROVIDER.
 * Por defecto usa `fixture`, que son datos de ejemplo y no consulta ningún portal.
 */
const getProvider = (nameFromEnv = process.env.PROVIDER) => {
  const key = (nameFromEnv || 'fixture').trim().toLowerCase();
  const provider = PROVIDERS[key];
  if (!provider) {
    throw new Error(
      `Proveedor desconocido: "${key}". Disponibles: ${Object.keys(PROVIDERS).join(', ')}.`
    );
  }
  return provider;
};

module.exports = { getProvider, PROVIDERS };
