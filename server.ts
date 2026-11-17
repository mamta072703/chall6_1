import dotenv from 'dotenv';
import express, { type Express, type Request, type Response } from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  createRateLimiter,
  isValidCoordinate,
  sanitizeUserText,
  securityHeaders,
} from './src/server/middleware/security.ts';
import { CommunityRepository } from './src/server/repositories/communityRepository.ts';
import { AiConfigurationError, AiService } from './src/server/services/aiService.ts';
import { AirQualityService } from './src/server/services/airQualityService.ts';
import type {
  AirQualitySnapshot,
  AssistantChatMessage,
  CommunityTip,
  LocationSelection,
  UserProfile,
} from './src/shared/types.ts';

dotenv.config();

export interface ServerDependencies {
  airQualityService?: AirQualityService;
  aiService?: AiService;
  communityRepo?: CommunityRepository;
}

const DEFAULT_PROFILE: UserProfile = {
  id: 'local-household',
  location: {
    name: 'New Delhi',
    country: 'India',
    admin1: 'Delhi',
    latitude: 28.6139,
    longitude: 77.209,
  },
  commuteMethod: 'public_transit',
  householdSize: 3,
  lifestyle: 'family_with_children',
  outdoorActivity: 'moderate',
  budget: 'low',
  concerns: ['indoor_air', 'outdoor_smog'],
  sensitiveGroups: {
    children: true,
    elderly: false,
    pregnant: false,
    respiratoryOrCardiac: false,
  },
  onboardingCompleted: false,
  updatedAt: new Date().toISOString(),
};

export function createApp(deps: ServerDependencies = {}): Express {
  const app = express();
  const airQualityService = deps.airQualityService ?? new AirQualityService();
  const aiService = deps.aiService ?? new AiService();
  const communityRepo = deps.communityRepo ?? new CommunityRepository();

  app.use(securityHeaders);
  app.use(express.json({ limit: '256kb' }));

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

  // Health check endpoint for deployment readiness
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

  // Location search (Open-Meteo Geocoding + offline fallback directory)
  app.get('/api/locations/search', async (req: Request, res: Response) => {
    const q = sanitizeUserText(req.query.q ?? '', 80);
    const result = await airQualityService.searchLocations(q);
    res.json(result);
  });

  // Live air quality & weather snapshot
  app.post('/api/air-quality/snapshot', async (req: Request, res: Response) => {
    try {
      const body = req.body as {
        location?: Partial<LocationSelection>;
        profile?: UserProfile;
        forceRefresh?: boolean;
      };

      const lat = Number(body.location?.latitude);
      const lon = Number(body.location?.longitude);
      const name = sanitizeUserText(body.location?.name ?? '', 80);

      if (!name || !isValidCoordinate(lat, lon)) {
        res.status(400).json({
          error: 'Valid location name, latitude (-90..90), and longitude (-180..180) are required.',
        });
        return;
      }

      const location: LocationSelection = {
        name,
        country: sanitizeUserText(body.location?.country ?? '', 80) || undefined,
        admin1: sanitizeUserText(body.location?.admin1 ?? '', 80) || undefined,
        latitude: lat,
        longitude: lon,
        isManualEntry: Boolean(body.location?.isManualEntry),
      };

      const snapshot = await airQualityService.getSnapshot({
        location,
        profile: body.profile,
        forceRefresh: Boolean(body.forceRefresh),
      });
      res.json(snapshot);
    } catch (error) {
      console.error('Air quality snapshot error:', error);
      res.status(500).json({ error: 'Unable to retrieve air quality snapshot.' });
    }
  });

  // GenAI Daily Routine Generator
  app.post('/api/ai/routine', aiRateLimiter, async (req: Request, res: Response) => {
    try {
      const body = req.body as {
        profile?: UserProfile;
        snapshot?: AirQualitySnapshot;
      };

      const profile = body.profile ?? DEFAULT_PROFILE;
      const snapshot =
        body.snapshot ??
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

  // GenAI Conversational Assistant
  app.post('/api/ai/chat', aiRateLimiter, async (req: Request, res: Response) => {
    try {
      const body = req.body as {
        question?: string;
        history?: AssistantChatMessage[];
        profile?: UserProfile;
        snapshot?: AirQualitySnapshot;
      };

      const question = sanitizeUserText(body.question ?? '', 800);
      if (!question) {
        res.status(400).json({ error: 'Please enter a valid question for AirAware AI.' });
        return;
      }

      const profile = body.profile ?? DEFAULT_PROFILE;
      const snapshot =
        body.snapshot ??
        (await airQualityService.getSnapshot({
          location: profile.location,
          profile,
        }));

      const result = await aiService.askAssistant({
        question,
        history: Array.isArray(body.history) ? body.history : [],
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

  // Community privacy-preserving endpoints
  app.get('/api/community', async (_req: Request, res: Response) => {
    const overview = await communityRepo.getOverview();
    res.json(overview);
  });

  app.post('/api/community/tips', communityWriteLimiter, async (req: Request, res: Response) => {
    const body = req.body as Partial<CommunityTip>;
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

  return app;
}

async function startServer(): Promise<void> {
  const app = createApp();
  const port = Number(process.env.PORT) || 3000;
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`AirAware AI server running on http://0.0.0.0:${port}`);
  });
}

// Start HTTP server only when executed directly (allows supertest imports without binding port 3000)
const isDirectEntry =
  process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isDirectEntry) {
  startServer().catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}
