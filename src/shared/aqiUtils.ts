import type {
  AqiClassification,
  CommuteMethod,
  HourlyTrendPoint,
  PollutantReadings,
  SafetyAlert,
  UserProfile,
  WeatherConditions,
} from './types.ts';

/**
 * Classifies a US EPA AQI value into standardized public-health bands.
 * Ensures severity is never communicated by color alone (explicit label, range, and directive).
 */
export function classifyUsAqi(aqi: number | null | undefined): AqiClassification {
  const safeAqi = typeof aqi === 'number' && Number.isFinite(aqi) ? Math.max(0, Math.round(aqi)) : 50;

  if (safeAqi <= 50) {
    return {
      key: 'good',
      label: 'Good',
      rangeLabel: '0–50 US AQI',
      shortAction: 'Normal outdoor activity; brief natural ventilation recommended.',
      outdoorGuidance:
        'Air quality poses minimal risk for most individuals. Standard outdoor routines are generally suitable.',
      sensitiveGroupGuidance:
        'People with severe respiratory sensitivities should still monitor personal symptoms.',
      ventilationDirective: 'open_cross_ventilate',
      severityRank: 1,
      badgeClasses: 'bg-emerald-50 text-emerald-900 border-emerald-200',
      textClass: 'text-emerald-800',
      bgTintClass: 'bg-emerald-50',
    };
  }

  if (safeAqi <= 100) {
    return {
      key: 'moderate',
      label: 'Moderate',
      rangeLabel: '51–100 US AQI',
      shortAction: 'Unusually sensitive individuals should pace prolonged outdoor exertion.',
      outdoorGuidance:
        'Acceptable for most residents; shift vigorous outdoor exercise away from rush-hour traffic corridors.',
      sensitiveGroupGuidance:
        'Children, older adults, and people with asthma should carry prescribed reliever medication outdoors.',
      ventilationDirective: 'brief_midday_only',
      severityRank: 2,
      badgeClasses: 'bg-teal-50 text-teal-900 border-teal-200',
      textClass: 'text-teal-800',
      bgTintClass: 'bg-teal-50',
    };
  }

  if (safeAqi <= 150) {
    return {
      key: 'usg',
      label: 'Unhealthy for Sensitive Groups',
      rangeLabel: '101–150 US AQI',
      shortAction: 'Sensitive groups should limit prolonged outdoor exertion; keep windows sealed during peaks.',
      outdoorGuidance:
        'Reduce prolonged or heavy outdoor exertion. Prefer midday windows if PM2.5 dips below rush-hour levels.',
      sensitiveGroupGuidance:
        'Children, elderly individuals, pregnant people, and those with asthma or heart disease should stay indoors during peak smog hours.',
      ventilationDirective: 'keep_closed_recirculate',
      severityRank: 3,
      badgeClasses: 'bg-amber-50 text-amber-900 border-amber-300',
      textClass: 'text-amber-900',
      bgTintClass: 'bg-amber-50',
    };
  }

  if (safeAqi <= 200) {
    return {
      key: 'unhealthy',
      label: 'Unhealthy',
      rangeLabel: '151–200 US AQI',
      shortAction: 'Avoid strenuous outdoor exercise; run HEPA filtration and seal drafts.',
      outdoorGuidance:
        'Everyone may begin to experience irritation or reduced lung function. Move workouts indoors and wear a well-fitted N95/FFP2 mask if commuting outdoors.',
      sensitiveGroupGuidance:
        'Children, older adults, pregnant individuals, and cardiac/respiratory patients should remain indoors in filtered spaces.',
      ventilationDirective: 'keep_closed_recirculate',
      severityRank: 4,
      badgeClasses: 'bg-orange-50 text-orange-950 border-orange-300',
      textClass: 'text-orange-900',
      bgTintClass: 'bg-orange-50',
    };
  }

  if (safeAqi <= 300) {
    return {
      key: 'very_unhealthy',
      label: 'Very Unhealthy',
      rangeLabel: '201–300 US AQI',
      shortAction: 'Health alert: avoid outdoor exertion; prioritize clean-room indoor air.',
      outdoorGuidance:
        'Avoid all non-essential outdoor activity. If travel is unavoidable, use a properly sealed N95/KN95 respirator and enclosed transit.',
      sensitiveGroupGuidance:
        'High-risk groups should stay strictly indoors with continuous mechanical HEPA filtration and consult healthcare providers if symptoms appear.',
      ventilationDirective: 'keep_closed_recirculate',
      severityRank: 5,
      badgeClasses: 'bg-rose-50 text-rose-950 border-rose-300',
      textClass: 'text-rose-900',
      bgTintClass: 'bg-rose-50',
    };
  }

  return {
    key: 'hazardous',
    label: 'Hazardous',
    rangeLabel: '301+ US AQI',
    shortAction: 'Severe smog episode: remain indoors, seal window gaps, run HEPA continuously.',
    outdoorGuidance:
      'Severe pollution conditions affect the entire population. Cancel outdoor recreation and outdoor school activities.',
    sensitiveGroupGuidance:
      'Vulnerable household members require continuous clean-air room protection. Seek immediate medical care for shortness of breath or chest discomfort.',
    ventilationDirective: 'keep_closed_recirculate',
    severityRank: 6,
    badgeClasses: 'bg-red-100 text-red-950 border-red-400',
    textClass: 'text-red-950',
    bgTintClass: 'bg-red-50',
  };
}

/**
 * Generates contextual, medically responsible safety alerts from current readings.
 */
export function generateSafetyAlerts(params: {
  aqi: number;
  pollutants: PollutantReadings;
  weather: WeatherConditions;
  hourlyTrend: HourlyTrendPoint[];
  dataStatus: 'live' | 'cached' | 'sample_fallback';
  profile?: UserProfile;
}): SafetyAlert[] {
  const alerts: SafetyAlert[] = [];
  const { aqi, pollutants, weather, hourlyTrend, dataStatus, profile } = params;

  if (dataStatus === 'sample_fallback') {
    alerts.push({
      id: 'data-fallback-notice',
      severity: 'info',
      title: 'Offline Sample Snapshot Active (Not Live Sensor Data)',
      description:
        'Live upstream air quality feeds could not be reached. Displaying clearly labeled illustrative winter smog baseline data so planning tools remain usable.',
      guidanceType: 'data_notice',
      recommendedAction: 'Retry live refresh when network connectivity stabilizes.',
    });
  }

  if (aqi >= 201) {
    alerts.push({
      id: 'severe-aqi-alert',
      severity: 'critical',
      title: `Severe Air Pollution Alert (${aqi} US AQI — ${classifyUsAqi(aqi).label})`,
      description:
        'Ambient particulate concentration is elevated across the airshed. Outdoor exertion substantially increases inhaled particulate dose.',
      guidanceType: 'precaution',
      recommendedAction:
        'Keep exterior doors and windows closed, run HEPA filtration on medium/high in occupied bedrooms, and wear a well-fitted N95/FFP2 mask for essential outdoor trips.',
    });
  } else if (aqi >= 101) {
    alerts.push({
      id: 'elevated-aqi-alert',
      severity: 'warning',
      title: `Elevated Pollution Advisory (${aqi} US AQI — ${classifyUsAqi(aqi).label})`,
      description:
        profile?.sensitiveGroups.children ||
        profile?.sensitiveGroups.elderly ||
        profile?.sensitiveGroups.respiratoryOrCardiac ||
        profile?.sensitiveGroups.pregnant
          ? 'Your household profile includes sensitive groups who experience stronger particulate effects at this level.'
          : 'Sensitive individuals, children, and older adults may experience respiratory irritation outdoors.',
      guidanceType: 'precaution',
      recommendedAction:
        'Avoid strenuous outdoor exercise near roadways and shift errands to midday if wind dispersion improves.',
    });
  }

  if (pollutants.pm25 !== null && pollutants.pm25 >= 35.5) {
    alerts.push({
      id: 'high-pm25',
      severity: pollutants.pm25 >= 55.5 ? 'critical' : 'warning',
      title: `Elevated Fine Particulate Matter (PM2.5: ${pollutants.pm25.toFixed(1)} µg/m³)`,
      description:
        'Fine particles (<= 2.5 µm) penetrate deep into lungs and infiltrate leaky window frames indoors. WHO 24-hour guideline is 15 µg/m³.',
      guidanceType: 'general_guidance',
      recommendedAction:
        'Avoid indoor combustion (incense, candles, dry frying without exhaust) and seal window frame gaps with weatherstripping.',
    });
  }

  if (weather.inversionRisk === 'high') {
    alerts.push({
      id: 'winter-inversion',
      severity: 'warning',
      title: 'Thermal Inversion & Low Wind Dispersion Conditions',
      description: `Low wind (${weather.windSpeedKmh ?? 'N/A'} km/h) and cool surface air can trap heating and vehicle exhaust near ground level overnight and early morning.`,
      guidanceType: 'general_guidance',
      recommendedAction:
        'Postpone early-morning outdoor walks until mid-afternoon dispersion checks show lower PM2.5.',
    });
  }

  // Detect sudden pollution spike (>35 AQI jump across recent hours)
  const validPoints = hourlyTrend.filter((p) => typeof p.usAqi === 'number') as Array<
    HourlyTrendPoint & { usAqi: number }
  >;
  if (validPoints.length >= 4) {
    const recent = validPoints.slice(-4);
    const minVal = Math.min(...recent.map((r) => r.usAqi));
    const maxVal = Math.max(...recent.map((r) => r.usAqi));
    if (maxVal - minVal >= 35) {
      alerts.push({
        id: 'aqi-swing',
        severity: 'info',
        title: `Rapid AQI Fluctuation Observed (${minVal} to ${maxVal} US AQI)`,
        description:
          'Hourly measurements show sharp swings across the last few hours, typical of winter boundary-layer buildup and rush-hour peaks.',
        guidanceType: 'general_guidance',
        recommendedAction:
          'Check hourly PM2.5 trends in Air Quality Explorer before opening windows for brief midday airing.',
      });
    }
  }

  return alerts;
}

/**
 * Estimates weekly CO2e & local exhaust savings with transparent assumptions & uncertainty bands.
 * Never presents exact precision—always returns an interval + explicit methodology.
 */
export function estimateCommuteImpact(
  currentMethod: CommuteMethod,
  targetMethod: CommuteMethod,
  roundTripKmPerDay = 14,
  commuteDaysPerWeek = 5
): {
  estimatedKgCo2eSavedRange: string;
  assumptions: string;
  pmExhaustReductionNote: string;
} {
  // Approximate lifecycle tailpipe + grid factors (kg CO2e per passenger-km)
  const emissionFactorKgPerKm: Record<CommuteMethod, number> = {
    private_car_petrol: 0.19,
    carpool: 0.085,
    electric_vehicle: 0.065,
    public_transit: 0.055,
    cycling: 0.005,
    walking: 0,
    work_from_home: 0,
  };

  const weeklyKm = roundTripKmPerDay * commuteDaysPerWeek;
  const currentKg = weeklyKm * emissionFactorKgPerKm[currentMethod];
  const targetKg = weeklyKm * emissionFactorKgPerKm[targetMethod];
  const delta = Math.max(0, currentKg - targetKg);

  if (delta <= 0.2) {
    return {
      estimatedKgCo2eSavedRange: '0–0.5 kg CO2e / week (already low-emission baseline)',
      assumptions: `Assumes ${roundTripKmPerDay} km/day over ${commuteDaysPerWeek} days. Your current mode is already among the lowest-emission options.`,
      pmExhaustReductionNote:
        'Maintaining zero/low tailpipe travel avoids direct roadside NO2 and brake/tire particulate contributions.',
    };
  }

  const low = Math.max(0.5, Math.round(delta * 0.75 * 10) / 10);
  const high = Math.round(delta * 1.25 * 10) / 10;

  return {
    estimatedKgCo2eSavedRange: `${low}–${high} kg CO2e / week (±25% range)`,
    assumptions: `Assumes ~${roundTripKmPerDay} km/day (${commuteDaysPerWeek} days/week) using typical urban passenger emission factors (petrol car ~0.19 vs transit ~0.055 kg/km). Actual savings vary with vehicle fuel economy, transit occupancy, and local grid mix.`,
    pmExhaustReductionNote:
      'Replacing cold-start winter petrol trips also reduces local NOx, CO, and urban roadside PM2.5.',
  };
}

/**
 * Calculates recommended minimum HEPA CADR (Clean Air Delivery Rate) for room area.
 * Based on 4.8 air changes per hour (ACH) for smoke/smog control with 2.4m ceiling height.
 */
export function calculateRecommendedCadr(roomAreaSqMeters: number): {
  cadrM3PerHour: number;
  cadrCfm: number;
  guidance: string;
} {
  const safeArea = Math.max(5, Math.min(200, roomAreaSqMeters));
  const ceilingHeightM = 2.45;
  const targetAch = 4.8; // AHAM 2/3 rule equivalent for wildfire/severe smog particulate control
  const cadrM3PerHour = Math.round(safeArea * ceilingHeightM * targetAch);
  const cadrCfm = Math.round(cadrM3PerHour / 1.699);

  return {
    cadrM3PerHour,
    cadrCfm,
    guidance: `Targets ~4.8 air changes/hour for a ${safeArea} m² room (2.45 m ceiling). Verify true HEPA H13/H14 or MERV-13+ media and avoid ionizers/ozone generators.`,
  };
}

export function interpretWeatherCode(code: number | null | undefined): string {
  if (code === null || code === undefined) return 'Conditions unavailable';
  if (code === 0) return 'Clear sky';
  if (code <= 3) return 'Partly cloudy / hazy';
  if (code === 45 || code === 48) return 'Winter fog / mist';
  if (code >= 51 && code <= 67) return 'Light drizzle or rain';
  if (code >= 71 && code <= 77) return 'Snowfall';
  if (code >= 80 && code <= 82) return 'Rain showers';
  if (code >= 95) return 'Thunderstorm';
  return 'Overcast / calm';
}

export function assessInversionRisk(
  windSpeedKmh: number | null,
  temperatureC: number | null
): 'low' | 'moderate' | 'high' | 'unknown' {
  if (windSpeedKmh === null) return 'unknown';
  if (windSpeedKmh <= 6 && (temperatureC === null || temperatureC <= 14)) return 'high';
  if (windSpeedKmh <= 12) return 'moderate';
  return 'low';
}
