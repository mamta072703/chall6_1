import { Router, type Request, type Response } from 'express';
import { createDefaultUserProfile } from '../../shared/profileConstants.ts';
import type { AssistantChatMessage, CommunityTip } from '../../shared/types.ts';
import {
  sanitizeAirQualitySnapshot,
  sanitizeUserProfile,
  validateLocationSelection,
} from '../../shared/validation.ts';
import { createRateLimiter, sanitizeUserText } from '../middleware/security.ts';
import type { CommunityRepository } from '../repositories/communityRepository.ts';
import { AiConfigurationError, type AiService } from '../services/aiService.ts';
import type { AirQualityService } from '../services/airQualityService.ts';

export interface ApiRouterDependencies {
  airQualityService: AirQualityService;
  aiService: AiService;
  communityRepo: CommunityRepository;
}

const ALLOWED_TIP_CATEGORIES: ReadonlySet<CommunityTip['category']> = new Set([
  'indoor_air',
  'clean_commute',
  'energy_saving',
  'waste_reduction',
]);

/**
 * Builds the Express API router with rate limiters, strict input sanitization, and uniform error forwarding.
 */
export function createApiRouter(deps: ApiRouterDependencies): Router {
  const router = Router();
  const { airQualityService, aiService, communityRepo } = deps;

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

  router.get('/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'airaware-ai',
      timestampIso: new Date().toISOString(),
      geminiConfigured:
        Boolean(process.env.GEMINI_API_KEY?.trim()) &&
        process.env.GEMINI_API_KEY?.trim() !== 'MY_GEMINI_API_KEY',
    });
  });

  router.get('/locations/search', async (req: Request, res: Response, next) => {
    try {
      const q = sanitizeUserText(req.query.q ?? '', 80);
      const result = await airQualityService.searchLocations(q);
      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  router.post('/air-quality/snapshot', async (req: Request, res: Response) => {
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

  router.post('/ai/routine', aiRateLimiter, async (req: Request, res: Response) => {
    try {
      const body = (req.body ?? {}) as Record<string, unknown>;
      const defaultProfile = createDefaultUserProfile();
      const profile = sanitizeUserProfile(body.profile, defaultProfile);
      const snapshot =
        sanitizeAirQualitySnapshot(body.snapshot, profile.location) ??
        (await airQualityService.getSnapshot({ location: profile.location, profile }));

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

  router.post('/ai/chat', aiRateLimiter, async (req: Request, res: Response) => {
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
        (await airQualityService.getSnapshot({ location: profile.location, profile }));

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

  router.get('/community', async (_req: Request, res: Response, next) => {
    try {
      const overview = await communityRepo.getOverview();
      res.json(overview);
    } catch (error) {
      next(error);
    }
  });

  router.post('/community/tips', communityWriteLimiter, async (req: Request, res: Response, next) => {
    try {
      const body = (req.body ?? {}) as Partial<CommunityTip>;
      const category = ALLOWED_TIP_CATEGORIES.has(body.category as CommunityTip['category'])
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
    } catch (error) {
      next(error);
    }
  });

  router.post('/community/tips/:id/helpful', communityWriteLimiter, async (req: Request, res: Response, next) => {
    try {
      const id = sanitizeUserText(req.params.id, 60);
      const updated = await communityRepo.markTipHelpful(id);
      if (!updated) {
        res.status(404).json({ error: 'Community tip not found.' });
        return;
      }
      res.json(updated);
    } catch (error) {
      next(error);
    }
  });

  router.post('/community/challenges/:id/action', communityWriteLimiter, async (req: Request, res: Response, next) => {
    try {
      const id = sanitizeUserText(req.params.id, 60);
      const joinedNow = Boolean((req.body as { joinedNow?: boolean })?.joinedNow);
      const updated = await communityRepo.recordChallengeAction(id, joinedNow);
      if (!updated) {
        res.status(404).json({ error: 'Community challenge not found.' });
        return;
      }
      res.json(updated);
    } catch (error) {
      next(error);
    }
  });

  router.use((_req: Request, res: Response) => {
    res.status(404).json({ error: 'API endpoint not found.' });
  });

  return router;
}
