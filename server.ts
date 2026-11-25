import dotenv from 'dotenv';
import express, { type Express, type Request, type Response } from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  createRateLimiter,
  jsonSyntaxErrorHandler,
  sanitizeUserText,
  securityHeaders,
} from './src/server/middleware/security.ts';
import { CommunityRepository } from './src/server/repositories/communityRepository.ts';
import { AiConfigurationError, AiService } from './src/server/services/aiService.ts';
import { AirQualityService } from './src/server/services/airQualityService.ts';
import { createDefaultUserProfile } from './src/shared/profileConstants.ts';
import type { AssistantChatMessage, CommunityTip } from './src/shared/types.ts';
import {
  sanitizeAirQualitySnapshot,
  sanitizeUserProfile,
  validateLocationSelection,
} from './src/shared/validation.ts';

dotenv.config();

export interface ServerDependencies {
  airQualityService?: AirQualityService;
  aiService?: AiService;
  communityRepo?: CommunityRepository;
}

export function createApp(deps: ServerDependencies = {}): Express {
  const app = express();
  const airQualityService = deps.airQualityService ?? new AirQualityService();
  const aiService = deps.aiService ?? new AiService();
  const communityRepo = deps.communityRepo ?? new CommunityRepository();

  app.use(securityHeaders);
  app.use(express.json({ limit: '256kb' }));
  app.use(jsonSyntaxErrorHandler);

  const aiRateLimiter = createRateLimiter({
    windowMs: 60_000,
    maxRequests: 25,
    keyPrefix: 'ai',
  });
  const communityWriteLimiter = createRateLimiter({
    windowMs: 60_000,
    maxRequests: 20,
    keyPrefix: 'community-write',
  });

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'airaware-ai',
      timestampIso: new Date().toISOString(),
      geminiConfigured:
        Boolean(process.env.GEMINI_API_KEY?.trim()) &&
        process.env.GEMINI_API_KEY?.trim() !== 'MY_GEMINI_API_KEY',
    });
  });

  app.get('/api/locations/search', async (req: Request, res: Response) => {
    const q = sanitizeUserText(req.query.q ?? '', 80);
    const result = await airQualityService.searchLocations(q);
    res.json(result);
  });

  app.post('/api/air-quality/snapshot', async (req: Request, res: Response) => {
    try {
      const body = (req.body ?? {}) as Record<string, unknown>;
      const location = validateLocationSelection(body.location);
      if (!location) {
        res.status(400).json({
          error: 'Valid location name, latitude (-90..90), and longitude (-180..180) are required.',
        });
        return;
      }

      const defaultProfile = createDefaultUserProfile();
      const profile = body.profile ? sanitizeUserProfile(body.profile, defaultProfile) : undefined;

      const snapshot = await airQualityService.getSnapshot({
        location,
        profile,
        forceRefresh: Boolean(body.forceRefresh),
      });
      res.json(snapshot);
    } catch (error) {
      console.error('Air quality snapshot error:', error);
      res.status(500).json({ error: 'Unable to retrieve air quality snapshot.' });
    }
  });

  app.post('/api/ai/routine', aiRateLimiter, async (req: Request, res: Response) => {
    try {
      const body = (req.body ?? {}) as Record<string, unknown>;
      const defaultProfile = createDefaultUserProfile();
      const profile = sanitizeUserProfile(body.profile, defaultProfile);

      const snapshot =
        sanitizeAirQualitySnapshot(body.snapshot, profile.location) ??
        (await airQualityService.getSnapshot({
          location: profile.location,
          profile,
        }));

      const plan = await aiService.generateDailyRoutine({ profile, snapshot });
      res.json(plan);
    } catch (error) {
      if (error instanceof AiConfigurationError) {
        res.status(503).json({ error: error.message, code: 'AI_KEY_MISSING' });
        return;
      }
      console.error('AI routine generation failed:', error);
      res.status(502).json({
        error:
          error instanceof Error
            ? error.message
            : 'Unable to generate AI routine right now. Please try again.',
      });
    }
  });

  app.post('/api/ai/chat', aiRateLimiter, async (req: Request, res: Response) => {
    try {
      const body = (req.body ?? {}) as Record<string, unknown>;
      const question = sanitizeUserText(body.question ?? '', 800);
      if (!question) {
        res.status(400).json({ error: 'Please enter a valid question for AirAware AI.' });
        return;
      }

      const defaultProfile = createDefaultUserProfile();
      const profile = sanitizeUserProfile(body.profile, defaultProfile);
      const snapshot =
        sanitizeAirQualitySnapshot(body.snapshot, profile.location) ??
        (await airQualityService.getSnapshot({
          location: profile.location,
          profile,
        }));

      const rawHistory = Array.isArray(body.history) ? body.history : [];
      const sanitizedHistory: AssistantChatMessage[] = rawHistory
        .slice(-6)
        .filter((m): m is AssistantChatMessage => Boolean(m && typeof m === 'object'))
        .map((m) => ({
          id: sanitizeUserText(m.id, 40) || 'msg',
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: sanitizeUserText(m.content, 500),
          timestampIso: sanitizeUserText(m.timestampIso, 40),
        }));

      const result = await aiService.askAssistant({
        question,
        history: sanitizedHistory,
        profile,
        snapshot,
      });

      res.json(result);
    } catch (error) {
      if (error instanceof AiConfigurationError) {
        res.status(503).json({ error: error.message, code: 'AI_KEY_MISSING' });
        return;
      }
      console.error('AI chat request failed:', error);
      res.status(502).json({
        error:
          error instanceof Error
            ? error.message
            : 'Unable to process AI assistant request right now.',
      });
    }
  });

  app.get('/api/community', async (_req: Request, res: Response) => {
    const overview = await communityRepo.getOverview();
    res.json(overview);
  });

  app.post('/api/community/tips', communityWriteLimiter, async (req: Request, res: Response) => {
    const body = (req.body ?? {}) as Partial<CommunityTip>;
    const allowedCategories: CommunityTip['category'][] = [
      'indoor_air',
      'clean_commute',
      'energy_saving',
      'waste_reduction',
    ];
    const category = allowedCategories.includes(body.category as CommunityTip['category'])
      ? (body.category as CommunityTip['category'])
      : null;
    const title = sanitizeUserText(body.title ?? '', 120);
    const tipBody = sanitizeUserText(body.body ?? '', 400);
    const estimatedCostLabel = sanitizeUserText(body.estimatedCostLabel ?? 'Free', 40) || 'Free';

    if (!category || title.length < 6 || tipBody.length < 12) {
      res.status(400).json({
        error: 'Please provide a valid category, title (min 6 chars), and description (min 12 chars).',
      });
      return;
    }

    const created = await communityRepo.addTip({
      category,
      title,
      body: tipBody,
      estimatedCostLabel,
    });
    res.status(201).json(created);
  });

  app.post('/api/community/tips/:id/helpful', communityWriteLimiter, async (req: Request, res: Response) => {
    const id = sanitizeUserText(req.params.id, 60);
    const updated = await communityRepo.markTipHelpful(id);
    if (!updated) {
      res.status(404).json({ error: 'Community tip not found.' });
      return;
    }
    res.json(updated);
  });

  app.post('/api/community/challenges/:id/action', communityWriteLimiter, async (req: Request, res: Response) => {
    const id = sanitizeUserText(req.params.id, 60);
    const joinedNow = Boolean((req.body as { joinedNow?: boolean })?.joinedNow);
    const updated = await communityRepo.recordChallengeAction(id, joinedNow);
    if (!updated) {
      res.status(404).json({ error: 'Community challenge not found.' });
      return;
    }
    res.json(updated);
  });

  app.use('/api', (_req: Request, res: Response) => {
    res.status(404).json({ error: 'API endpoint not found.' });
  });

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
