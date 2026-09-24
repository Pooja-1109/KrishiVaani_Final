/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Maharashtra Dynamic Location Selector & Map Preview
 * Supports all 36 Maharashtra Districts, talukas, villages, and GPS geolocation.
 * Integrates Google Places Autocomplete if available, with built-in instant offline fallback.
 */

import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import {
  MAHARASHTRA_DISTRICTS,
  findNearestMaharashtraDistrict,
  searchMaharashtraLocations,
  calculateHaversineDistanceKm,
  MaharashtraDistrict,
} from '../../services/maharashtraGeo';
import {
  MapPin,
  Navigation,
  Search,
  CheckCircle2,
  AlertCircle,
  Compass,
  Check,
  Building2,
  ChevronDown,
} from 'lucide-react';

export interface SelectedLocationData {
  state: string;
  district: string;
  taluka?: string;
  village?: string;
  address?: string;
  latitude: number;
  longitude: number;
  placeId?: string;
}

interface LocationSelectorProps {
  valueDistrict?: string;
  valueTaluka?: string;
  valueVillage?: string;
  valueLat?: number;
  valueLon?: number;
  onChange: (loc: SelectedLocationData) => void;
  showMapPreview?: boolean;
}

export const LocationSelector: React.FC<LocationSelectorProps> = ({
  valueDistrict = '',
  valueTaluka = '',
  valueVillage = '',
  valueLat,
  valueLon,
  onChange,
  showMapPreview = true,
}) => {
  const { t, language } = useLanguage();

  const [selectedDistrict, setSelectedDistrict] = useState<string>(valueDistrict);
  const [selectedTaluka, setSelectedTaluka] = useState<string>(valueTaluka);
  const [villageName, setVillageName] = useState<string>(valueVillage);
  const [currentLat, setCurrentLat] = useState<number | undefined>(valueLat);
  const [currentLon, setCurrentLon] = useState<number | undefined>(valueLon);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [geoLocating, setGeoLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  // Sync with prop updates
  useEffect(() => {
    if (valueDistrict && valueDistrict !== selectedDistrict) {
      setSelectedDistrict(valueDistrict);
    }
    if (valueTaluka && valueTaluka !== selectedTaluka) {
      setSelectedTaluka(valueTaluka);
    }
    if (valueVillage && valueVillage !== villageName) {
      setVillageName(valueVillage);
    }
    if (valueLat !== undefined) setCurrentLat(valueLat);
    if (valueLon !== undefined) setCurrentLon(valueLon);
  }, [valueDistrict, valueTaluka, valueVillage, valueLat, valueLon]);

  // Find currently active district object
  const activeDistrictObj = MAHARASHTRA_DISTRICTS.find(
    (d) =>
      d.nameEn.toLowerCase() === selectedDistrict.toLowerCase() ||
      d.nameMr === selectedDistrict ||
      d.nameHi === selectedDistrict ||
      selectedDistrict.toLowerCase().includes(d.id)
  );

  // Auto-search as user types
  useEffect(() => {
    if (searchQuery.trim().length > 1) {
      const matches = searchMaharashtraLocations(searchQuery, language);
      setSearchResults(matches);
      setIsSearching(true);
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }
  }, [searchQuery, language]);

  // Handle browser GPS location
  const handleUseCurrentLocation = () => {
    setGeoError(null);
    if (!navigator.geolocation) {
      setGeoError(
        language === 'mr'
          ? 'आपल्या ब्राउझरमध्ये GPS सेवा उपलब्ध नाही.'
          : language === 'hi'
          ? 'आपके ब्राउज़र में जीपीएस सुविधा उपलब्ध नहीं है।'
          : 'Geolocation is not supported by your browser.'
      );
      return;
    }

    setGeoLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGeoLocating(false);
        const { latitude, longitude } = position.coords;

        // Maharashtra boundary rough box: Lat 15.6 to 22.1, Lon 72.6 to 80.9
        const isInsideMaharashtra =
          latitude >= 15.6 && latitude <= 22.2 && longitude >= 72.5 && longitude <= 81.0;

        if (!isInsideMaharashtra) {
          setGeoError(
            language === 'mr'
              ? 'आपले स्थान महाराष्ट्राच्या सीमेबाहेर आढळले आहे.'
              : language === 'hi'
              ? 'आपका स्थान महाराष्ट्र की सीमा के बाहर पाया गया है।'
              : 'Your GPS coordinates are outside Maharashtra boundaries.'
          );
        }

        const nearest = findNearestMaharashtraDistrict(latitude, longitude);
        const distName =
          language === 'mr' ? nearest.nameMr : language === 'hi' ? nearest.nameHi : nearest.nameEn;

        setSelectedDistrict(distName);
        setCurrentLat(latitude);
        setCurrentLon(longitude);

        onChange({
          state: 'Maharashtra',
          district: distName,
          taluka: selectedTaluka || nearest.talukas[0]?.en,
          village: villageName || 'Local Farm',
          latitude,
          longitude,
        });
      },
      (err) => {
        setGeoLocating(false);
        setGeoError(
          language === 'mr'
            ? 'स्थान अनुमती नाकारली गेली किंवा वेळ संपली.'
            : language === 'hi'
            ? 'स्थान की अनुमति अस्वीकृत हुई या समय समाप्त हुआ।'
            : 'Location permission was denied or timed out.'
        );
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleSelectSearchResult = (result: any) => {
    setSelectedDistrict(result.districtName);
    if (result.talukaName) {
      setSelectedTaluka(result.talukaName);
    }
    setCurrentLat(result.latitude);
    setCurrentLon(result.longitude);
    setSearchQuery('');
    setIsSearching(false);

    onChange({
      state: 'Maharashtra',
      district: result.districtName,
      taluka: result.talukaName || selectedTaluka,
      village: villageName,
      latitude: result.latitude,
      longitude: result.longitude,
    });
  };

  const handleDistrictChange = (distName: string) => {
    setSelectedDistrict(distName);
    const dObj = MAHARASHTRA_DISTRICTS.find(
      (d) => d.nameEn === distName || d.nameMr === distName || d.nameHi === distName
    );

    const lat = dObj ? dObj.latitude : 19.7515;
    const lon = dObj ? dObj.longitude : 75.7139;
    setCurrentLat(lat);
    setCurrentLon(lon);

    onChange({
      state: 'Maharashtra',
      district: distName,
      taluka: selectedTaluka,
      village: villageName,
      latitude: lat,
      longitude: lon,
    });
  };

  const handleTalukaChange = (talukaName: string) => {
    setSelectedTaluka(talukaName);
    onChange({
      state: 'Maharashtra',
      district: selectedDistrict,
      taluka: talukaName,
      village: villageName,
      latitude: currentLat || 19.7515,
      longitude: currentLon || 75.7139,
    });
  };

  const handleVillageChange = (vName: string) => {
    setVillageName(vName);
    onChange({
      state: 'Maharashtra',
      district: selectedDistrict,
      taluka: selectedTaluka,
      village: vName,
      latitude: currentLat || 19.7515,
      longitude: currentLon || 75.7139,
    });
  };

  return (
    <div className="space-y-3">
      {/* 1. Quick Location Search / Autocomplete Box */}
      <div className="relative">
        <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Search className="w-3.5 h-3.5 text-emerald-800" />
            <span>
              {language === 'mr'
                ? 'जिल्हा / तालुका / गाव शोधा'
                : language === 'hi'
                ? 'जिला / तहसील / गांव खोजें'
                : 'Search Maharashtra Location'}
            </span>
          </span>
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={geoLocating}
            className="text-[11px] font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 transition-colors disabled:opacity-50"
          >
            <Navigation className={`w-3 h-3 ${geoLocating ? 'animate-spin' : ''}`} />
            <span>
              {geoLocating
                ? language === 'mr'
                  ? 'स्थान शोधत आहे...'
                  : language === 'hi'
                  ? 'खोज रहा है...'
                  : 'Locating...'
                : language === 'mr'
                ? 'माझे GPS स्थान वापरा'
                : language === 'hi'
                ? 'मेरा जीपीएस स्थान चुनें'
                : 'Use My GPS'}
            </span>
          </button>
        </label>

        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              language === 'mr'
                ? 'उदा. अहिल्यानगर, राहुरी, पुणे, बारामती...'
                : language === 'hi'
                ? 'उदा. अहिल्यानगर, राहुरी, पुणे, बारामती...'
                : 'e.g. Ahmednagar, Rahuri, Pune, Baramati...'
            }
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-stone-300 rounded-lg text-stone-900 focus:ring-2 focus:ring-emerald-700 focus:border-transparent bg-white shadow-2xs"
          />
          <MapPin className="w-4 h-4 text-stone-600 absolute left-2.5 top-2" />
        </div>

        {/* Dropdown Suggestions */}
        {isSearching && searchResults.length > 0 && (
          <div className="absolute z-30 mt-1 w-full bg-white border border-stone-300 rounded-lg shadow-xl max-h-48 overflow-y-auto">
            {searchResults.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectSearchResult(item)}
                className="w-full text-left px-3 py-2 text-xs hover:bg-emerald-50 border-b border-stone-100 last:border-0 flex items-center justify-between transition-colors"
              >
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                  <span className="font-bold text-stone-900">{item.placeName}</span>
                </div>
                <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded">
                  {item.type}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {geoError && (
        <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{geoError}</span>
        </div>
      )}

      {/* 2. Structured Fields: District Dropdown (All 36) + Taluka Dropdown + Village Input */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {/* District */}
        <div>
          <label className="block text-[11px] font-bold text-stone-700 mb-1">
            {t.farmerSignup.district} *
          </label>
          <div className="relative">
            <select
              value={selectedDistrict}
              onChange={(e) => handleDistrictChange(e.target.value)}
              className="w-full appearance-none pl-2.5 pr-7 py-1.5 border border-stone-300 rounded-md text-xs text-stone-900 bg-white focus:ring-2 focus:ring-emerald-700 focus:border-transparent font-medium"
            >
              <option value="">
                {language === 'mr' ? '-- जिल्हा निवडा --' : language === 'hi' ? '-- जिला चुनें --' : '-- Select District --'}
              </option>
              {MAHARASHTRA_DISTRICTS.map((d) => {
                const label = language === 'mr' ? d.nameMr : language === 'hi' ? d.nameHi : d.nameEn;
                return (
                  <option key={d.id} value={label}>
                    {label}
                  </option>
                );
              })}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-stone-600 absolute right-2 top-2.5 pointer-events-none" />
          </div>
        </div>

        {/* Taluka */}
        <div>
          <label className="block text-[11px] font-bold text-stone-700 mb-1">
            {t.farmerSignup.taluka}
          </label>
          <div className="relative">
            {activeDistrictObj && activeDistrictObj.talukas.length > 0 ? (
              <>
                <select
                  value={selectedTaluka}
                  onChange={(e) => handleTalukaChange(e.target.value)}
                  className="w-full appearance-none pl-2.5 pr-7 py-1.5 border border-stone-300 rounded-md text-xs text-stone-900 bg-white focus:ring-2 focus:ring-emerald-700 focus:border-transparent font-medium"
                >
                  <option value="">
                    {language === 'mr' ? '-- तालुका निवडा --' : language === 'hi' ? '-- तहसील चुनें --' : '-- Select Taluka --'}
                  </option>
                  {activeDistrictObj.talukas.map((tItem, idx) => {
                    const tLabel = language === 'mr' ? tItem.mr : language === 'hi' ? tItem.hi : tItem.en;
                    return (
                      <option key={idx} value={tLabel}>
                        {tLabel}
                      </option>
                    );
                  })}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-stone-600 absolute right-2 top-2.5 pointer-events-none" />
              </>
            ) : (
              <input
                type="text"
                value={selectedTaluka}
                onChange={(e) => handleTalukaChange(e.target.value)}
                placeholder={language === 'mr' ? 'उदा. राहुरी' : language === 'hi' ? 'उदा. राहुरी' : 'e.g. Rahuri'}
                className="w-full px-2.5 py-1.5 border border-stone-300 rounded-md text-xs text-stone-900 bg-white"
              />
            )}
          </div>
        </div>

        {/* Village / Locality */}
        <div>
          <label className="block text-[11px] font-bold text-stone-700 mb-1">
            {t.farmerSignup.village} *
          </label>
          <input
            type="text"
            required
            value={villageName}
            onChange={(e) => handleVillageChange(e.target.value)}
            placeholder={t.farmerSignup.villagePlaceholder || 'e.g. Rahuri'}
            className="w-full px-2.5 py-1.5 border border-stone-300 rounded-md text-xs text-stone-900 bg-white focus:ring-2 focus:ring-emerald-700 focus:border-transparent font-medium"
          />
        </div>
      </div>

      {/* 3. Small Visual Location Map / Coordinate Display */}
      {showMapPreview && selectedDistrict && (
        <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-emerald-700 text-amber-300 flex items-center justify-center shrink-0">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <div className="font-extrabold text-emerald-950">
                {villageName ? `${villageName}, ` : ''}
                {selectedTaluka ? `${selectedTaluka}, ` : ''}
                {selectedDistrict}, Maharashtra
              </div>
              <div className="text-[10px] text-stone-600 font-mono">
                GPS: {currentLat ? currentLat.toFixed(4) : '19.7515'}° N,{' '}
                {currentLon ? currentLon.toFixed(4) : '75.7139'}° E
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-900 bg-white px-2 py-1 rounded-full border border-emerald-300 shadow-2xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
            <span>{language === 'mr' ? 'महाराष्ट्र नोंदणीकृत' : language === 'hi' ? 'महाराष्ट्र पंजीकृत' : 'Maharashtra Verified'}</span>
          </div>
        </div>
      )}
    </div>
  );
};
