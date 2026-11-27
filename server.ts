import dotenv from 'dotenv';
import express, { type Express } from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  globalErrorHandler,
  jsonSyntaxErrorHandler,
  securityHeaders,
} from './src/server/middleware/security.ts';
import { CommunityRepository } from './src/server/repositories/communityRepository.ts';
import { createApiRouter } from './src/server/routes/apiRoutes.ts';
import { AiService } from './src/server/services/aiService.ts';
import { AirQualityService } from './src/server/services/airQualityService.ts';

dotenv.config();

export interface ServerDependencies {
  airQualityService?: AirQualityService;
  aiService?: AiService;
  communityRepo?: CommunityRepository;
}

/**
 * Builds the configured Express application with security middleware and mounted API routes.
 */
export function createApp(deps: ServerDependencies = {}): Express {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  const airQualityService = deps.airQualityService ?? new AirQualityService();
  const aiService = deps.aiService ?? new AiService();
  const communityRepo = deps.communityRepo ?? new CommunityRepository();

  app.use(securityHeaders);
  app.use(express.json({ limit: '256kb' }));
  app.use(jsonSyntaxErrorHandler);

  app.use(
    '/api',
    createApiRouter({
      airQualityService,
      aiService,
      communityRepo,
    })
  );

  app.use(globalErrorHandler);

  return app;
}

async function startServer(): Promise<void> {
  const app = createApp();
  const port = Number(process.env.PORT) || 3000;
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const distPath = path.join(__dirname, 'dist');
  const isProd =
    process.env.NODE_ENV === 'production' ||
    process.env.npm_lifecycle_event === 'start';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`AirAware AI server running on http://0.0.0.0:${port}`);
  });
}

let isDirectEntry = false;
if (process.argv[1]) {
  try {
    const fs = await import('node:fs');
    isDirectEntry =
      fs.realpathSync(process.argv[1]) === fs.realpathSync(fileURLToPath(import.meta.url));
  } catch {
    isDirectEntry =
      path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
  }
}

if (isDirectEntry) {
  startServer().catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}
