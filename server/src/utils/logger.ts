type LogMeta = Record<string, unknown>;

function log(level: string, message: string, meta?: LogMeta) {
  const entry = { level, message, time: new Date().toISOString(), ...meta };
  const line = JSON.stringify(entry);
  if (level === 'error') {
    console.error(line);
  } else {
    console.log(line);
  }
}

export const logger = {
  info: (message: string, meta?: LogMeta) => log('info', message, meta),
  error: (message: string, meta?: LogMeta) => log('error', message, meta),
  warn: (message: string, meta?: LogMeta) => log('warn', message, meta),
};
