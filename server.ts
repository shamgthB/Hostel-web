import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

import authRouter from './server/routes/auth.js';
import dashboardRouter from './server/routes/dashboard.js';
import roomsRouter from './server/routes/rooms.js';
import residentsRouter from './server/routes/residents.js';
import feesRouter from './server/routes/fees.js';
import complaintsRouter from './server/routes/complaints.js';
import noticesRouter from './server/routes/notices.js';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for body parsing (allowing image attachments)
  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.use('/api/auth', authRouter);
  app.use('/api/dashboard', dashboardRouter);
  app.use('/api/rooms', roomsRouter);
  app.use('/api/residents', residentsRouter);
  app.use('/api/fees', feesRouter);
  app.use('/api/complaints', complaintsRouter);
  app.use('/api/notices', noticesRouter);

  // Vite middleware in development; Static dist in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Hostel Management Server running on port ${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
