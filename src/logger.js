'use strict';

/**
 * Logger mínimo sin dependencias, compartido por los bots del radar.
 * Nivel por variable de entorno LOG_LEVEL (debug|info|warn|error, default info).
 */
const LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };

const levelName = String(process.env.LOG_LEVEL || 'info').toLowerCase();
const current = LEVELS[levelName] ?? LEVELS.info;

const log = (level, ...args) => {
    if (LEVELS[level] < current) return;
    const prefix = `[${new Date().toISOString()}] [${level}]`;
    if (level === 'error') console.error(prefix, ...args);
    else if (level === 'warn') console.warn(prefix, ...args);
    else console.log(prefix, ...args);
};

module.exports = {
    debug: (...args) => log('debug', ...args),
    info: (...args) => log('info', ...args),
    log: (...args) => log('info', ...args), // alias de info, paridad con console.log
    warn: (...args) => log('warn', ...args),
    error: (...args) => log('error', ...args),
};
