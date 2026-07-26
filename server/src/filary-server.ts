import { createApp } from './app.js';

const PORT = Number(process.env.PORT) || 7002;
const app = createApp();

// Keep the Server reference so Bun does not exit after listen()
const server = app.listen(PORT, () => {
  console.log(`Filary API on http://localhost:${PORT}/api`);
  console.log(`  POST /api/generate ← fields + locale + emailDomains`);
  console.log(`  GET  /api/health`);
  console.log(`  GET  /api/profile  (debug)`);
});

server.on('error', (error: NodeJS.ErrnoException) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Stop the other process or set PORT=…`);
    process.exit(1);
  }
  console.error(error);
  process.exit(1);
});

process.on('SIGINT', () => {
  server.close(() => process.exit(0));
});
process.on('SIGTERM', () => {
  server.close(() => process.exit(0));
});
