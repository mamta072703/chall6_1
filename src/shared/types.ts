export type CommuteMethod =
  | 'public_transit'
  | 'walking'
  | 'cycling'
  | 'carpool'
  | 'private_car_petrol'
  | 'electric_vehicle'
  | 'work_from_home';

export type LifestyleType =
  | 'family_with_children'
  | 'working_professional'
  | 'student'
  | 'senior_household'
  | 'mixed_multigenerational';

export type OutdoorActivityLevel = 'low' | 'moderate' | 'high';

export type BudgetTier = 'low' | 'medium' | 'high';

export type MainConcern =
  | 'indoor_air'
  | 'outdoor_smog'
  | 'commuting'
  | 'sustainability';

export interface SensitiveGroupFlags {
  children: boolean;
  elderly: boolean;
  pregnant: boolean;
  respiratoryOrCardiac: boolean;
}

export interface LocationSelection {
  name: string;
  country?: string;
  admin1?: string;
  latitude: number;
  longitude: number;
  isManualEntry?: boolean;
}

export interface UserProfile {
  id: string;
  location: LocationSelection;
  commuteMethod: CommuteMethod;
  householdSize: number;
  lifestyle: LifestyleType;
  outdoorActivity: OutdoorActivityLevel;
  budget: BudgetTier;
  concerns: MainConcern[];
  sensitiveGroups: SensitiveGroupFlags;
  onboardingCompleted: boolean;
  updatedAt: string;
}

export type DataStatus = 'live' | 'cached' | 'sample_fallback';

export type AqiCategoryKey =
  | 'good'
  | 'moderate'
  | 'usg'
  | 'unhealthy'
  | 'very_unhealthy'
  | 'hazardous';

export interface AqiClassification {
  key: AqiCategoryKey;
  label: string;
  rangeLabel: string;
  shortAction: string;
  outdoorGuidance: string;
  sensitiveGroupGuidance: string;
  ventilationDirective: 'open_cross_ventilate' | 'brief_midday_only' | 'keep_closed_recirculate';
  severityRank: number;
  badgeClasses: string;
  textClass: string;
  bgTintClass: string;
}

export interface PollutantReadings {
  pm25: number | null;
  pm10: number | null;
  no2: number | null;
  so2: number | null;
  co: number | null;
  o3: number | null;
}

export interface WeatherConditions {
  temperatureC: number | null;
  humidityPercent: number | null;
  windSpeedKmh: number | null;
  surfacePressureHpa: number | null;
  weatherSummary: string;
  inversionRisk: 'low' | 'moderate' | 'high' | 'unknown';
}

export interface HourlyTrendPoint {
  timeIso: string;
  label: string;
  usAqi: number | null;
  pm25: number | null;
  pm10: number | null;
}

export interface SafetyAlert {
  id: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  guidanceType: 'general_guidance' | 'data_notice' | 'precaution';
  recommendedAction: string;
}

export interface AirQualitySnapshot {
  location: LocationSelection;
  currentAqi: number;
  europeanAqi: number | null;
  classification: AqiClassification;
  pollutants: PollutantReadings;
  weather: WeatherConditions;
  hourlyTrend: HourlyTrendPoint[];
  dailySummary: string;
  alerts: SafetyAlert[];
  dataStatus: DataStatus;
  dataSource: string;
  lastUpdatedIso: string;
  notice?: string;
}

export interface EnvironmentalImpactDetail {
  actionTitle: string;
  whyItMatters: string;
  pollutionSourceAddressed: string;
  potentialEnvironmentalBenefit: string;
  estimatedImpactRange: string;
  assumptionsAndUncertainty: string;
  difficulty: 'Easy' | 'Moderate' | 'Effort-intensive';
  estimatedCost: string;
}

export interface RoutineTimeBlock {
  period: 'Morning' | 'Afternoon' | 'Evening';
  recommendedWindow: string;
  summary: string;
  outdoorSafety: string;
  indoorAction: string;
  commuteOrEnergyTip: string;
}

export interface DailyRoutinePlan {
  generatedAtIso: string;
  headline: string;
  isSafeOutsideSummary: string;
  sensitiveGroupPrecautions: string;
  blocks: RoutineTimeBlock[];
  impactBreakdowns: EnvironmentalImpactDetail[];
  disclaimer: string;
}

export interface AssistantChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestampIso: string;
  impactCard?: EnvironmentalImpactDetail;
  followUpSuggestions?: string[];
}

export interface ActionPlannerItem {
  id: string;
  title: string;
  period: 'Morning' | 'Afternoon' | 'Evening';
  category: 'indoor_air' | 'outdoor_protection' | 'commute' | 'energy_waste';
  priority: 'high' | 'medium' | 'low';
  estimatedCost: string;
  environmentalBenefit: string;
  assumptionsNote: string;
  completed: boolean;
  completedDates: string[];
  isCustom?: boolean;
}

export interface CommunityTip {
  id: string;
  category: 'indoor_air' | 'clean_commute' | 'energy_saving' | 'waste_reduction';
  title: string;
  body: string;
  estimatedCostLabel: string;
  helpfulCount: number;
  createdAtIso: string;
}

export interface CommunityChallenge {
  id: string;
  title: string;
  description: string;
  targetActions: number;
  participantsCount: number;
  collectiveCompletions: number;
  durationLabel: string;
}

export interface CommunityCampaign {
  id: string;
  title: string;
  focusArea: string;
  summary: string;
  actionSteps: string[];
}

export interface CommunityAggregateStats {
  totalCleanCommuteDays: number;
  totalIndoorProtectionActions: number;
  totalEnergySavingActions: number;
  activeHouseholdsParticipating: number;
  methodologyNote: string;
}
