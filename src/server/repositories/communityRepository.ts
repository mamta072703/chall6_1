import fs from 'node:fs/promises';
import path from 'node:path';
import type {
  CommunityAggregateStats,
  CommunityCampaign,
  CommunityChallenge,
  CommunityTip,
} from '../../shared/types.ts';

interface CommunityStoreData {
  stats: CommunityAggregateStats;
  tips: CommunityTip[];
  challenges: CommunityChallenge[];
  campaigns: CommunityCampaign[];
}

const DEFAULT_COMMUNITY_DATA: CommunityStoreData = {
  stats: {
    totalCleanCommuteDays: 1428,
    totalIndoorProtectionActions: 3190,
    totalEnergySavingActions: 2045,
    activeHouseholdsParticipating: 384,
    methodologyNote:
      'Aggregated anonymized counts across participating households. Individual locations, addresses, and identities are never published.',
  },
  tips: [
    {
      id: 'tip-1',
      category: 'indoor_air',
      title: 'Seal bedroom window frames with foam weatherstripping before winter peaks',
      body: 'Adding adhesive EPDM foam tape around sliding window tracks visibly cuts cold drafts and fine particulate infiltration overnight for under $10.',
      estimatedCostLabel: 'Low cost ($5–$12)',
      helpfulCount: 42,
      createdAtIso: '2026-11-10T08:30:00.000Z',
    },
    {
      id: 'tip-2',
      category: 'clean_commute',
      title: 'Switch morning school drop-offs under 2 km to walking groups or metro feeder',
      body: 'Short cold-start petrol trips generate disproportionate exhaust near school gates. Coordinating a 4-family walking bus removes 3–4 cold starts daily.',
      estimatedCostLabel: 'Free',
      helpfulCount: 37,
      createdAtIso: '2026-11-12T14:15:00.000Z',
    },
    {
      id: 'tip-3',
      category: 'energy_saving',
      title: 'Replace winter wood/trash burning with electric kettle and induction heating where available',
      body: 'Avoid burning garden leaves or solid waste during winter thermal inversions; municipal green-waste composting prevents dense local PM2.5 spikes.',
      estimatedCostLabel: 'Free',
      helpfulCount: 29,
      createdAtIso: '2026-11-14T11:00:00.000Z',
    },
    {
      id: 'tip-4',
      category: 'indoor_air',
      title: 'Run kitchen exhaust hood 10 minutes past cooking completion',
      body: 'High-heat frying and gas burners emit ultrafine particles and NO2 that linger after turning off the stove. Using back burners under the hood improves capture.',
      estimatedCostLabel: 'Free',
      helpfulCount: 51,
      createdAtIso: '2026-11-15T18:20:00.000Z',
    },
  ],
  challenges: [
    {
      id: 'challenge-transit-week',
      title: '5-Day Low-Emission Commute Shift',
      description:
        'Replace solo petrol/diesel commutes with metro, bus, carpooling, cycling (when AQI < 100), or remote work for five workdays.',
      targetActions: 5,
      participantsCount: 164,
      collectiveCompletions: 612,
      durationLabel: 'Weekly Sprint',
    },
    {
      id: 'challenge-clean-bedroom',
      title: 'Clean-Air Bedroom Setup',
      description:
        'Wet-mop floors, seal window drafts, eliminate indoor incense/candles, and designate one filtered sleeping space for family members.',
      targetActions: 4,
      participantsCount: 218,
      collectiveCompletions: 790,
      durationLabel: '7-Day Habit',
    },
    {
      id: 'challenge-zero-burn',
      title: 'Zero Open-Burn & Energy Trim',
      description:
        'Commit to zero outdoor leaf/waste burning, lower standby appliance load, and shift high-heat frying under vented hoods.',
      targetActions: 3,
      participantsCount: 129,
      collectiveCompletions: 348,
      durationLabel: 'Ongoing Winter Pledge',
    },
  ],
  campaigns: [
    {
      id: 'campaign-school-idle',
      title: 'Clean School Gate Zones',
      focusArea: 'Local Transport & Child Exposure',
      summary:
        'Encouraging caregivers and bus operators to turn off idling engines during morning and afternoon school pickup windows.',
      actionSteps: [
        'Park 200 meters away from school gates when feasible',
        'Switch off engine immediately if waiting over 30 seconds',
        'Check morning AQI before outdoor recess schedules',
      ],
    },
    {
      id: 'campaign-winter-inversion',
      title: 'Winter Inversion Preparedness',
      focusArea: 'Residential Heating & Smog Alerts',
      summary:
        'Community-wide coordination to reduce wood/biomass combustion and shift non-essential trips during stagnant winter atmospheric inversions.',
      actionSteps: [
        'Use cleaner electric or gas heating instead of solid fuels where accessible',
        'Keep neighborhood green waste out of burn piles via composting',
        'Check vulnerable elderly neighbors during multi-day >200 AQI episodes',
      ],
    },
  ],
};

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
      this.cache = structuredClone(DEFAULT_COMMUNITY_DATA);
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
      id: `tip-${Date.now()}`,
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

  async recordChallengeAction(challengeId: string, joinedNow: boolean): Promise<CommunityChallenge | null> {
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
