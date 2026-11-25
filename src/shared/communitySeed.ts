import type {
  CommunityAggregateStats,
  CommunityCampaign,
  CommunityChallenge,
  CommunityTip,
} from './types.ts';

export interface CommunityStoreData {
  stats: CommunityAggregateStats;
  tips: CommunityTip[];
  challenges: CommunityChallenge[];
  campaigns: CommunityCampaign[];
}

export function createDefaultCommunityData(methodologySuffix = ''): CommunityStoreData {
  return {
    stats: {
      totalCleanCommuteDays: 1428,
      totalIndoorProtectionActions: 3190,
      totalEnergySavingActions: 2045,
      activeHouseholdsParticipating: 384,
      methodologyNote: `Aggregated anonymized counts across participating households. Individual locations, addresses, and identities are never published.${methodologySuffix}`,
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
}
