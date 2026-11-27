import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import {
  createDefaultCommunityData,
  type CommunityStoreData,
} from '../../shared/communitySeed.ts';
import type { CommunityChallenge, CommunityTip } from '../../shared/types.ts';

export class CommunityRepository {
  private readonly filePath: string;
  private cache: CommunityStoreData | null = null;

  constructor(dataDir = path.resolve(process.cwd(), '.data')) {
    this.filePath = path.join(dataDir, 'community.json');
  }

  private async load(): Promise<CommunityStoreData> {
    if (this.cache) return this.cache;
    try {
      const raw = await fs.readFile(this.filePath, 'utf-8');
      const parsed = JSON.parse(raw) as CommunityStoreData;
      this.cache = parsed;
      return parsed;
    } catch {
      this.cache = createDefaultCommunityData();
      await this.persist(this.cache);
      return this.cache;
    }
  }

  private async persist(data: CommunityStoreData): Promise<void> {
    try {
      await fs.mkdir(path.dirname(this.filePath), { recursive: true });
      await fs.writeFile(this.filePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to persist community store (continuing in-memory):', err);
    }
  }

  async getOverview(): Promise<CommunityStoreData> {
    return this.load();
  }

  async addTip(input: {
    category: CommunityTip['category'];
    title: string;
    body: string;
    estimatedCostLabel: string;
  }): Promise<CommunityTip> {
    const store = await this.load();
    const newTip: CommunityTip = {
      id: `tip-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
      category: input.category,
      title: input.title,
      body: input.body,
      estimatedCostLabel: input.estimatedCostLabel,
      helpfulCount: 1,
      createdAtIso: new Date().toISOString(),
    };
    store.tips = [newTip, ...store.tips].slice(0, 60);
    store.stats.totalIndoorProtectionActions += input.category === 'indoor_air' ? 1 : 0;
    store.stats.totalCleanCommuteDays += input.category === 'clean_commute' ? 1 : 0;
    store.stats.totalEnergySavingActions +=
      input.category === 'energy_saving' || input.category === 'waste_reduction' ? 1 : 0;
    await this.persist(store);
    return newTip;
  }

  async markTipHelpful(tipId: string): Promise<CommunityTip | null> {
    const store = await this.load();
    const target = store.tips.find((t) => t.id === tipId);
    if (!target) return null;
    target.helpfulCount += 1;
    await this.persist(store);
    return target;
  }

  async recordChallengeAction(
    challengeId: string,
    joinedNow: boolean
  ): Promise<CommunityChallenge | null> {
    const store = await this.load();
    const challenge = store.challenges.find((c) => c.id === challengeId);
    if (!challenge) return null;
    if (joinedNow) {
      challenge.participantsCount += 1;
      store.stats.activeHouseholdsParticipating += 1;
    } else {
      challenge.collectiveCompletions += 1;
      if (challengeId.includes('transit')) {
        store.stats.totalCleanCommuteDays += 1;
      } else if (challengeId.includes('bedroom')) {
        store.stats.totalIndoorProtectionActions += 1;
      } else {
        store.stats.totalEnergySavingActions += 1;
      }
    }
    await this.persist(store);
    return challenge;
  }
}
