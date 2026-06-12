function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

function timestamp(): string {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export const logger = {
  info(...args: unknown[]) {
    console.log(`[${timestamp()}]`, ...args);
  },
  warn(...args: unknown[]) {
    console.warn(`[${timestamp()}] WARN:`, ...args);
  },
  error(...args: unknown[]) {
    console.error(`[${timestamp()}] ERROR:`, ...args);
  },
};

export type Logger = typeof logger;
