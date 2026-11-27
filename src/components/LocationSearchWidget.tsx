import { MapPin, Search } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { searchLocationsApi } from '../services/apiClient.ts';
import type { LocationSelection } from '../shared/types.ts';

interface LocationSearchWidgetProps {
  currentLocation: LocationSelection;
  onSelectLocation: (loc: LocationSelection) => void;
  allowManualEntry?: boolean;
}

export const LocationSearchWidget: React.FC<LocationSearchWidgetProps> = ({
  currentLocation,
  onSelectLocation,
  allowManualEntry = true,
}) => {
  const [query, setQuery] = useState(currentLocation.name);
  const [results, setResults] = useState<LocationSelection[]>([]);
  const [sourceNote, setSourceNote] = useState<string>('');
  const [searching, setSearching] = useState(false);
  const [showManual, setShowManual] = useState(false);

  const [manualName, setManualName] = useState(currentLocation.name);
  const [manualLat, setManualLat] = useState(String(currentLocation.latitude));
  const [manualLon, setManualLon] = useState(String(currentLocation.longitude));
  const [manualError, setManualError] = useState<string | null>(null);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await searchLocationsApi(trimmed);
        setResults(res.results);
        setSourceNote(
          res.source === 'offline_directory_fallback'
            ? 'Offline city directory fallback'
            : 'Open-Meteo Geocoding'
        );
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 320);

    return () => clearTimeout(timer);
  }, [query]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setManualError(null);
    const trimmedLat = manualLat.trim();
    const trimmedLon = manualLon.trim();
    const lat = Number(trimmedLat);
    const lon = Number(trimmedLon);
    const name = manualName.trim();
    if (!name) {
      setManualError('Enter a city or neighborhood name.');
      return;
    }
    if (!trimmedLat || !Number.isFinite(lat) || lat < -90 || lat > 90) {
      setManualError('Latitude must be between -90 and 90.');
      return;
    }
    if (!trimmedLon || !Number.isFinite(lon) || lon < -180 || lon > 180) {
      setManualError('Longitude must be between -180 and 180.');
      return;
    }
    onSelectLocation({
      name,
      latitude: Number(lat.toFixed(4)),
      longitude: Number(lon.toFixed(4)),
      isManualEntry: true,
    });
    setShowManual(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <label htmlFor="location-search-input" className="sr-only">
            Search city or region
          </label>
          <Search
            className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          <input
            id="location-search-input"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search city (e.g., Delhi, Lahore, Milan, London)..."
            className="w-full pl-9 pr-3 py-2.5 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none"
          />
        </div>
        {allowManualEntry && (
          <button
            type="button"
            onClick={() => setShowManual((prev) => !prev)}
            className="px-3.5 py-2.5 text-xs font-medium border border-slate-200 bg-white text-slate-700 rounded-lg hover:bg-slate-50 whitespace-nowrap shrink-0 min-h-[40px]"
          >
            {showManual ? 'Hide Manual Coordinates' : 'Enter Coordinates Manually'}
          </button>
        )}
      </div>

      {searching && (
        <p className="text-xs text-slate-500" aria-live="polite">
          Searching locations...
        </p>
      )}

      {results.length > 0 && (
        <div className="border border-slate-200 rounded-lg bg-white divide-y divide-slate-100 overflow-hidden">
          <div className="px-3 py-1.5 bg-slate-50 text-[11px] font-medium text-slate-500 flex items-center justify-between">
            <span>Matching Locations</span>
            <span>{sourceNote}</span>
          </div>
          <ul className="max-h-52 overflow-y-auto divide-y divide-slate-100">
            {results.map((loc) => (
              <li key={`${loc.name}-${loc.latitude}-${loc.longitude}`}>
                <button
                  type="button"
                  onClick={() => {
                    onSelectLocation(loc);
                    setQuery(loc.name);
                    setResults([]);
                  }}
                  className="w-full text-left px-3 py-2.5 hover:bg-teal-50/60 transition-colors flex items-center justify-between gap-3"
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <MapPin className="w-4 h-4 text-teal-700 shrink-0" aria-hidden="true" />
                    <span className="text-sm font-medium text-slate-900 truncate">
                      {loc.name}
                      {loc.admin1 ? `, ${loc.admin1}` : ''}
                      {loc.country ? ` · ${loc.country}` : ''}
                    </span>
                  </span>
                  <span className="text-xs text-slate-500 font-mono tabular-nums shrink-0">
                    {loc.latitude.toFixed(2)}, {loc.longitude.toFixed(2)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {showManual && (
        <div
          role="region"
          aria-label="Manual Location Entry"
          className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3"
        >
          <p className="text-xs font-medium text-slate-700">
            Manual Location Entry (Privacy-Preserving Local Coordinates)
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label htmlFor="manual-city-name" className="block text-xs text-slate-600 mb-1">
                Location Label
              </label>
              <input
                id="manual-city-name"
                type="text"
                value={manualName}
                onChange={(e) => setManualName(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-md"
                placeholder="e.g., East District"
              />
            </div>
            <div>
              <label htmlFor="manual-lat" className="block text-xs text-slate-600 mb-1">
                Latitude
              </label>
              <input
                id="manual-lat"
                type="number"
                step="0.0001"
                value={manualLat}
                onChange={(e) => setManualLat(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-md font-mono tabular-nums"
              />
            </div>
            <div>
              <label htmlFor="manual-lon" className="block text-xs text-slate-600 mb-1">
                Longitude
              </label>
              <input
                id="manual-lon"
                type="number"
                step="0.0001"
                value={manualLon}
                onChange={(e) => setManualLon(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-md font-mono tabular-nums"
              />
            </div>
          </div>
          {manualError && (
            <p className="text-xs text-red-700" role="alert">
              {manualError}
            </p>
          )}
          <button
            type="button"
            onClick={handleManualSubmit}
            className="px-4 py-2 text-xs font-medium bg-teal-700 text-white rounded-lg hover:bg-teal-800 min-h-[36px]"
          >
            Apply Manual Location
          </button>
        </div>
      )}
    </div>
  );
};
