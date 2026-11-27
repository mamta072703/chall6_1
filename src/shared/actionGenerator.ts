import type { ActionPlannerItem, UserProfile } from './types.ts';

/**
 * Generates personalized morning, afternoon, and evening household clean-air actions
 * calibrated to current US AQI, household budget tier, commute mode, and sensitive groups.
 */
export function buildPersonalizedActions(profile: UserProfile, aqi: number): ActionPlannerItem[] {
  const isHighSmog = aqi > 100;
  const isLowBudget = profile.budget === 'low';
  const hasSensitive =
    profile.sensitiveGroups.children ||
    profile.sensitiveGroups.elderly ||
    profile.sensitiveGroups.pregnant ||
    profile.sensitiveGroups.respiratoryOrCardiac;

  return [
    {
      id: 'act-morning-seal',
      title: isHighSmog
        ? `Keep ${profile.location.name} bedroom & living room windows sealed during early-morning inversion`
        : `Open cross-ventilation windows for 15 minutes while ${profile.location.name} outdoor AQI is low`,
      period: 'Morning',
      category: 'indoor_air',
      priority: isHighSmog || hasSensitive ? 'high' : 'medium',
      estimatedCost: 'Free',
      environmentalBenefit: isHighSmog
        ? 'Prevents outdoor PM2.5 spikes from infiltrating indoor breathing zones.'
        : 'Flushes indoor CO2 and cooking VOCs without energy penalty.',
      assumptionsNote:
        'Effectiveness depends on window frame sealing; indoor PM2.5 typically tracks outdoor levels within 30–90 minutes in leaky rooms.',
      completed: false,
      completedDates: [],
    },
    {
      id: 'act-morning-commute',
      title:
        profile.commuteMethod === 'private_car_petrol'
          ? 'Substitute today’s solo car commute with metro, bus, or carpool'
          : isHighSmog
            ? 'Wear a fitted N95/FFP2 respirator along busy traffic corridors'
            : 'Take low-traffic side streets away from arterial diesel corridors',
      period: 'Morning',
      category: 'commute',
      priority: 'high',
      estimatedCost:
        profile.commuteMethod === 'private_car_petrol' ? 'Saves ~$3–$6 fuel' : '$1–$2 mask reuse',
      environmentalBenefit:
        'Reduces cold-start tailpipe NO2/PM2.5 emissions and lowers personal inhaled traffic exhaust.',
      assumptionsNote:
        'Estimated 1.5–4.5 kg CO2e saved per replaced 15 km solo petrol round trip; varies by local transit occupancy.',
      completed: false,
      completedDates: [],
    },
    {
      id: 'act-afternoon-cook',
      title: 'Run kitchen exhaust hood (or open kitchen window briefly) while cooking and 10 min after',
      period: 'Afternoon',
      category: 'indoor_air',
      priority: 'high',
      estimatedCost: 'Free',
      environmentalBenefit:
        'Captures ultrafine cooking aerosols, NO2 from gas burners, and moisture before they spread to bedrooms.',
      assumptionsNote:
        'Back burners under an exterior-vented hood capture significantly more plume aerosols than front burners.',
      completed: false,
      completedDates: [],
    },
    {
      id: 'act-afternoon-dust',
      title: isLowBudget
        ? 'Wet-mop hard floors & wipe sills instead of dry sweeping; seal window gaps with folded cloth/foam'
        : 'Run true HEPA H13 purifier on Medium in primary living area and wet-dust surfaces',
      period: 'Afternoon',
      category: 'indoor_air',
      priority: isHighSmog ? 'high' : 'medium',
      estimatedCost: isLowBudget ? 'Free – $8 foam tape' : '$15–$40 filter upkeep/mo',
      environmentalBenefit:
        'Prevents settled PM10/PM2.5 dust resuspension without adding ozone or chemical sprays.',
      assumptionsNote:
        'Dry brooms re-aerosolize settled particulate matter; damp microfiber captures particles directly.',
      completed: false,
      completedDates: [],
    },
    {
      id: 'act-evening-energy',
      title: 'Avoid burning candles, incense, or outdoor waste; trim evening standby appliance load',
      period: 'Evening',
      category: 'energy_waste',
      priority: 'medium',
      estimatedCost: 'Free (lowers utility bill)',
      environmentalBenefit:
        'Eliminates direct indoor combustion PM2.5 and reduces winter peak grid demand.',
      assumptionsNote:
        'Even a single incense stick or scented candle can raise small-room PM2.5 substantially in sealed winter rooms.',
      completed: false,
      completedDates: [],
    },
    {
      id: 'act-evening-sleep',
      title: hasSensitive
        ? 'Designate one clean-air bedroom for children/seniors with closed door and filtered air'
        : 'Keep bedroom door shut at night and review tomorrow’s morning AQI window',
      period: 'Evening',
      category: 'outdoor_protection',
      priority: hasSensitive || isHighSmog ? 'high' : 'low',
      estimatedCost: 'Free',
      environmentalBenefit:
        'Protects 7–9 hours of overnight respiratory recovery when winter inversion peaks occur.',
      assumptionsNote:
        'Overnight boundary-layer inversions frequently trap residential heating and traffic particulates until mid-morning.',
      completed: false,
      completedDates: [],
    },
  ];
}

/**
 * Merges freshly generated AQI-calibrated actions with existing completion history and custom actions.
 */
export function mergeActionsWithCompletionState(
  existing: ActionPlannerItem[],
  regenerated: ActionPlannerItem[]
): ActionPlannerItem[] {
  const existingById = new Map(existing.map((item) => [item.id, item]));
  const customOnes = existing.filter((item) => item.isCustom);
  const synced = regenerated.map((item) => {
    const prev = existingById.get(item.id);
    if (!prev) return item;
    return {
      ...item,
      completed: prev.completed,
      completedDates: prev.completedDates,
    };
  });
  return [...customOnes, ...synced];
}
