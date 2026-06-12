export const CONFIG = {
  PORT: parseInt(process.env.PORT || '3001'),
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || '*',
  TICK_INTERVAL_MS: 1000 / 20,
  SNAPSHOT_INTERVAL_MS: 1000 / 20,
};
