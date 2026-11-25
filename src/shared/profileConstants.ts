import type {
  BudgetTier,
  CommuteMethod,
  LifestyleType,
  MainConcern,
  OutdoorActivityLevel,
  UserProfile,
} from './types.ts';

export const COMMUTE_OPTIONS: ReadonlyArray<{ value: CommuteMethod; label: string }> = [
  { value: 'public_transit', label: 'Public Transit (Metro / Bus)' },
  { value: 'walking', label: 'Walking' },
  { value: 'cycling', label: 'Cycling' },
  { value: 'carpool', label: 'Carpool / Shared Ride' },
  { value: 'private_car_petrol', label: 'Private Car (Petrol / Diesel)' },
  { value: 'electric_vehicle', label: 'Electric Vehicle' },
  { value: 'work_from_home', label: 'Work / Study from Home' },
];

export const COMMUTE_LABELS: Record<CommuteMethod, string> = {
  private_car_petrol: 'Solo Petrol/Diesel Car',
  carpool: 'Carpool (2–3 riders)',
  electric_vehicle: 'Electric Vehicle',
  public_transit: 'Public Transit (Metro / Bus)',
  cycling: 'Cycling',
  walking: 'Walking',
  work_from_home: 'Remote / Study from Home',
};

export const LIFESTYLE_OPTIONS: ReadonlyArray<{ value: LifestyleType; label: string }> = [
  { value: 'family_with_children', label: 'Family with Children' },
  { value: 'working_professional', label: 'Working Professional' },
  { value: 'student', label: 'Student' },
  { value: 'senior_household', label: 'Senior Household' },
  { value: 'mixed_multigenerational', label: 'Multigenerational Household' },
];

export const OUTDOOR_OPTIONS: ReadonlyArray<{ value: OutdoorActivityLevel; label: string }> = [
  { value: 'low', label: 'Low (mostly indoors, short errands)' },
  { value: 'moderate', label: 'Moderate (daily commute + 30–60 min outside)' },
  { value: 'high', label: 'High (outdoor work, sports, or long walks)' },
];

export const BUDGET_OPTIONS: ReadonlyArray<{ value: BudgetTier; title: string; desc: string }> = [
  { value: 'low', title: 'Low Budget', desc: 'Free & DIY fixes first ($0–$20)' },
  { value: 'medium', title: 'Medium Budget', desc: 'Selective HEPA & sealing ($25–$150)' },
  { value: 'high', title: 'Flexible Budget', desc: 'Multi-room HEPA & clean upgrades' },
];

export const CONCERN_OPTIONS: ReadonlyArray<{ value: MainConcern; label: string }> = [
  { value: 'indoor_air', label: 'Indoor Air Quality' },
  { value: 'outdoor_smog', label: 'Winter Smog & Outdoor Exposure' },
  { value: 'commuting', label: 'Cleaner Commuting' },
  { value: 'sustainability', label: 'Household Energy & Sustainability' },
];

export const SENSITIVE_GROUP_OPTIONS: ReadonlyArray<{
  key: keyof UserProfile['sensitiveGroups'];
  label: string;
}> = [
  { key: 'children', label: 'Children under 12' },
  { key: 'elderly', label: 'Adults aged 65+' },
  { key: 'pregnant', label: 'Pregnant household member' },
  { key: 'respiratoryOrCardiac', label: 'Asthma, COPD, or cardiac sensitivity' },
];

export function createDefaultUserProfile(): UserProfile {
  return {
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
}
