import { AlertCircle, Check, Info } from 'lucide-react';
import React, { useState } from 'react';
import { AppShell } from '../components/AppShell.tsx';
import { ResilientImage } from '../components/ResilientImage.tsx';
import { useAirAware } from '../context/AirAwareContext.tsx';
import { calculateRecommendedCadr } from '../shared/aqiUtils.ts';

type RoomKey = 'bedroom' | 'living_room' | 'kitchen' | 'entryway';

const ROOM_GUIDANCE: Record<
  RoomKey,
  {
    name: string;
    primaryRisk: string;
    lowCostSteps: string[];
    upgradeSteps: string[];
  }
> = {
  bedroom: {
    name: 'Sleeping Bedroom (Clean-Air Sanctuary)',
    primaryRisk: 'Overnight thermal inversion PM2.5 infiltration during 7–9 hours of sleep.',
    lowCostSteps: [
      'Apply foam weatherstripping or rolled damp cloth along bottom door and sliding window gaps.',
      'Wet-wipe nightstands and floors weekly; wash bedding in warm water without fragranced dryer sheets.',
      'Keep bedroom door shut when cooking or when outdoor AQI exceeds 100.',
    ],
    upgradeSteps: [
      'Position a true HEPA H13 purifier sized to >= 4.8 air changes/hour at least 30 cm from walls.',
      'Run on continuous medium/quiet mode overnight rather than intermittent bursts.',
    ],
  },
  living_room: {
    name: 'Living & Study Area',
    primaryRisk: 'Resuspended settled dust, candles/incense, and leaky balcony doors.',
    lowCostSteps: [
      'Eliminate indoor candles, incense, and aerosol air fresheners entirely.',
      'Use damp microfiber cloths instead of dry feather dusters or dry brooms.',
      'Cross-ventilate only during verified < 75 US AQI midday windows.',
    ],
    upgradeSteps: [
      'Pair a high-CADR HEPA unit with a MERV-13 box-fan DIY Corsi-Rosenthal filter if commercial units exceed budget.',
    ],
  },
  kitchen: {
    name: 'Kitchen & Cooking Zone',
    primaryRisk: 'Ultrafine cooking aerosols, NO2 from gas stoves, and high-heat oil smoke.',
    lowCostSteps: [
      'Cook on rear burners and cover pots with lids to cut steam and aerosol spread.',
      'Run exterior-vented exhaust hood before lighting burners and leave on 10 minutes after cooking.',
      'If no vented hood exists, crack only the kitchen window while keeping bedroom doors closed.',
    ],
    upgradeSteps: [
      'Transition high-frequency boiling/heating tasks to an electric kettle or single induction cooktop.',
    ],
  },
  entryway: {
    name: 'Entryway & Balcony Threshold',
    primaryRisk: 'Tracked-in roadside heavy metals, soil dust, and damp coat particulates.',
    lowCostSteps: [
      'Keep outdoor shoes strictly at the threshold mat; switch to washable indoor slippers.',
      'Shake or brush outer winter coats outside before hanging them near living spaces.',
    ],
    upgradeSteps: [
      'Install rubber door sweeps and double-seal sliding balcony track channels.',
    ],
  },
};

export const IndoorToolkitPage: React.FC = () => {
  const { snapshot } = useAirAware();
  const [selectedRoom, setSelectedRoom] = useState<RoomKey>('bedroom');
  const [roomAreaSqM, setRoomAreaSqM] = useState<number>(18);

  const cadrResult = calculateRecommendedCadr(roomAreaSqM);
  const currentAqi = snapshot?.currentAqi ?? 140;
  const ventilationDirective =
    currentAqi <= 50
      ? 'Open windows for 15–20 minutes of cross-ventilation.'
      : currentAqi <= 100
        ? 'Limit natural ventilation to brief 10-minute midday windows away from rush-hour traffic.'
        : 'Keep exterior windows closed; rely on sealed rooms, exhaust hoods during cooking, and HEPA recirculation.';

  const room = ROOM_GUIDANCE[selectedRoom];

  return (
    <AppShell
      title="Indoor Air Quality Toolkit"
      subtitle="Scientifically grounded room protection, HEPA sizing, ventilation rules, and myth clarification"
    >
      <div className="space-y-6">
        {/* Ventilation Decision Banner */}
        <section className="bg-white border border-slate-200 rounded-xl p-5 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-7 space-y-2.5">
            <p className="text-xs font-medium text-teal-800">
              Outdoor-Linked Ventilation Strategy ({currentAqi} US AQI)
            </p>
            <h2 className="text-lg font-display font-semibold text-slate-900">
              {ventilationDirective}
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Opening windows during severe smog (&gt; 100 AQI) rapidly equilibrates indoor PM2.5 with outdoor smog. Reserve natural airing for brief low-AQI midday hours, and always vent kitchen smoke directly outdoors when cooking.
            </p>
          </div>
          <div className="lg:col-span-5 h-44 rounded-lg overflow-hidden border border-slate-200">
            <ResilientImage
              src="/src/assets/images/indoor_clean_living_1794898228133.jpg"
              alt="Clean modern living room with HEPA purifier and sealed windows"
              fallbackTitle="Indoor Air Sanctuary"
              className="w-full h-full object-cover"
            />
          </div>
        </section>

        {/* Room-Wise Guidance */}
        <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-base font-display font-semibold text-slate-900">
              Room-by-Room Protection Checklist
            </h2>
            <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100 rounded-lg">
              {(
                [
                  { key: 'bedroom', label: 'Bedroom' },
                  { key: 'living_room', label: 'Living Room' },
                  { key: 'kitchen', label: 'Kitchen' },
                  { key: 'entryway', label: 'Entryway' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setSelectedRoom(tab.key)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                    selectedRoom === tab.key
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">{room.name}</h3>
              <p className="text-xs text-slate-600 mt-0.5">Primary source: {room.primaryRisk}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2.5">
                <p className="text-xs font-semibold text-slate-900">
                  Free &amp; Low-Cost Actions
                </p>
                <ul className="space-y-2 text-xs text-slate-700">
                  {room.lowCostSteps.map((step) => (
                    <li key={step} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" aria-hidden="true" />
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2.5">
                <p className="text-xs font-semibold text-slate-900">
                  Filtration &amp; Equipment Upgrades
                </p>
                <ul className="space-y-2 text-xs text-slate-700">
                  {room.upgradeSteps.map((step) => (
                    <li key={step} className="flex items-start gap-2">
                      <Info className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" aria-hidden="true" />
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* HEPA CADR Sizing Calculator & Limitations */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <section className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <h2 className="text-base font-display font-semibold text-slate-900">
              HEPA Purifier Sizing Calculator (CADR)
            </h2>
            <div>
              <label htmlFor="room-area-range" className="block text-xs font-medium text-slate-700 mb-1">
                Room Floor Area: <span className="font-mono tabular-nums">{roomAreaSqM} m²</span> (
                <span className="font-mono tabular-nums">{Math.round(roomAreaSqM * 10.764)} sq ft</span>)
              </label>
              <input
                id="room-area-range"
                type="range"
                min={8}
                max={75}
                value={roomAreaSqM}
                onChange={(e) => setRoomAreaSqM(Number(e.target.value))}
                className="w-full accent-teal-700"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                <p className="text-xs text-slate-500">Recommended CADR (Metric)</p>
                <p className="mt-1 text-xl font-mono font-semibold text-slate-900 tabular-nums">
                  {cadrResult.cadrM3PerHour} m³/h
                </p>
              </div>
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                <p className="text-xs text-slate-500">Recommended CADR (CFM)</p>
                <p className="mt-1 text-xl font-mono font-semibold text-slate-900 tabular-nums">
                  {cadrResult.cadrCfm} CFM
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">{cadrResult.guidance}</p>
            <p className="text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
              <strong>HEPA Limitations:</strong> True HEPA filters capture fine particulates (PM2.5/PM10) effectively but do <em>not</em> remove CO₂ or all gaseous VOCs unless paired with a substantial activated carbon bed. Avoid units with unverified ionizers/UV-C ozone emitters.
            </p>
          </section>

          {/* Scientific Myth Clarification: Houseplants */}
          <section className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <h2 className="text-base font-display font-semibold text-slate-900">
                  Scientific Clarification: Houseplants Cannot Replace Filtration
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Evidence review of indoor air phytoremediation vs. real-world ventilation
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-700 leading-relaxed">
              <p>
                <strong>The common myth:</strong> Placing 2–3 potted plants (such as snake plant or peace lily) in a bedroom cleans PM2.5 smog or household VOCs.
              </p>
              <p>
                <strong>What environmental engineering shows:</strong> Controlled 1989 NASA experiments used small, airtight sealed chambers—not ventilated apartments. Independent peer-reviewed syntheses (e.g., Cummings &amp; Waring, 2020) show that matching natural air exchange or a modest HEPA purifier would require hundreds of plants per square meter.
              </p>
              <p>
                <strong>Practical takeaway:</strong> Enjoy houseplants for visual calm, but never rely on plants to remove winter PM2.5 smog. Use source control, window sealing, kitchen exhaust, and mechanical HEPA/MERV-13 filtration instead.
              </p>
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  );
};
