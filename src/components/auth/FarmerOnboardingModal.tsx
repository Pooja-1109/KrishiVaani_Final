/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage, SupportedLanguage } from '../../i18n/LanguageContext';
import { api } from '../../services/api';
import { Crop } from '../../types';
import { VoiceAssistantModal } from '../common/VoiceAssistantModal';
import { ExtractedFarmProfile } from '../../services/voiceAssistant';
import { LocationSelector } from '../common/LocationSelector';
import {
  Sprout,
  Mic,
  Languages,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  MapPin,
  Scale,
  X,
} from 'lucide-react';

interface FarmerOnboardingModalProps {
  onComplete: () => void;
}

export const FarmerOnboardingModal: React.FC<FarmerOnboardingModalProps> = ({ onComplete }) => {
  const { profile, refreshMe } = useAuth();
  const { t, language, setLanguage } = useLanguage();

  const [crops, setCrops] = useState<Crop[]>([]);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form state
  const [selectedCrop, setSelectedCrop] = useState<string>('Onion');
  const [produceQty, setProduceQty] = useState<string>('');
  const [village, setVillage] = useState<string>('');
  const [taluka, setTaluka] = useState<string>('');
  const [district, setDistrict] = useState<string>('');
  const [latitude, setLatitude] = useState<number | undefined>(undefined);
  const [longitude, setLongitude] = useState<number | undefined>(undefined);
  const [landArea, setLandArea] = useState<string>('');
  const [voiceDetected, setVoiceDetected] = useState(false);

  useEffect(() => {
    api.getCrops().then(setCrops).catch(() => []);
    if (profile && 'village' in profile) {
      if (profile.village) setVillage(profile.village);
      if (profile.district) setDistrict(profile.district);
      if ((profile as any).taluka) setTaluka((profile as any).taluka);
      if (profile.primary_crop) setSelectedCrop(profile.primary_crop);
      if (profile.land_area) setLandArea(String(profile.land_area));
      if ((profile as any).latitude) setLatitude((profile as any).latitude);
      if ((profile as any).longitude) setLongitude((profile as any).longitude);
    }
  }, [profile]);

  const handleLanguageChange = async (lang: SupportedLanguage) => {
    setLanguage(lang);
    try {
      await api.updateLanguage(lang);
    } catch (_) {}
  };

  const handleVoiceProfileApplied = (extracted: ExtractedFarmProfile) => {
    if (extracted.village) setVillage(extracted.village);
    if (extracted.taluka) setTaluka(extracted.taluka);
    if (extracted.district) setDistrict(extracted.district);
    if (extracted.landArea) setLandArea(extracted.landArea);
    if (extracted.primaryCrop) setSelectedCrop(extracted.primaryCrop);
    setVoiceDetected(true);
  };

  const handleSaveAndContinue = async () => {
    setLoading(true);
    try {
      // 1. Update farmer profile
      await api.updateFarmerProfile({
        village: village || 'My Village',
        taluka: taluka || '',
        district: district || 'Maharashtra',
        primary_crop: selectedCrop,
        land_area: landArea || '2 Acres',
        latitude,
        longitude,
      });

      // 2. If produce quantity was entered, create produce lot in database
      const qty = parseFloat(produceQty);
      if (qty > 0) {
        const matchedCrop = crops.find(
          (c) =>
            c.name_en.toLowerCase() === selectedCrop.toLowerCase() ||
            c.name_mr === selectedCrop ||
            c.name_hi === selectedCrop
        );
        const cropId = matchedCrop ? matchedCrop.id : (crops[0]?.id || 1);

        await api.createFarmerProduce({
          crop_id: cropId,
          variety: 'Local High-Yield',
          quantity_qtl: qty,
          harvest_date: new Date().toISOString().split('T')[0],
          quality_grade: 'Grade A',
          storage_location_district: district || 'Maharashtra',
          storage_location_village: village || 'Local Farm',
          expected_price_per_qtl: 2100,
        });
      }

      await refreshMe();
      onComplete();
    } catch (err) {
      console.error('Failed to save onboarding details:', err);
      onComplete();
    } finally {
      setLoading(false);
    }
  };

  const farmerName = profile && 'full_name' in profile ? profile.full_name : 'Farmer Partner';

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[95vh]">
        {/* Top Header */}
        <div className="p-6 bg-gradient-to-r from-emerald-800 to-emerald-950 text-white relative">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-emerald-700/60 border border-emerald-500/50 rounded-full text-[11px] font-bold text-emerald-200 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>{t.onboarding.farmSetupHeader}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black">
            {t.onboarding.welcomeTitle.replace('{name}', farmerName)}
          </h2>
          <p className="text-xs text-emerald-100 mt-1 font-medium">
            {t.onboarding.welcomeSubtitle}
          </p>

          {/* Language Selector in Header */}
          <div className="mt-4 flex items-center gap-2 bg-emerald-900/80 p-1.5 rounded-lg border border-emerald-700/60 w-fit">
            <Languages className="w-3.5 h-3.5 text-emerald-300 ml-1.5" />
            <span className="text-[11px] text-emerald-200 font-semibold mr-1">
              {t.nav.changeLang}:
            </span>
            {(['mr', 'hi', 'en'] as SupportedLanguage[]).map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => handleLanguageChange(lang)}
                className={`px-2.5 py-1 rounded text-xs font-bold transition-colors ${
                  language === lang
                    ? 'bg-amber-400 text-stone-950 shadow-xs'
                    : 'text-white hover:bg-emerald-800'
                }`}
              >
                {lang === 'mr' ? 'मराठी' : lang === 'hi' ? 'हिंदी' : 'English'}
              </button>
            ))}
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-stone-800">
          {/* Prominent Voice Assistant Call-to-Action Card */}
          <div className="p-4 bg-gradient-to-br from-emerald-50 to-amber-50/50 border-2 border-emerald-600/60 rounded-xl relative shadow-2xs">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900 mb-1">
                  <Mic className="w-4 h-4 text-emerald-700" />
                  <span>{t.onboarding.voicePrompt}</span>
                </div>
                <p className="text-xs text-stone-600">
                  {t.onboarding.tapMicToStart}
                </p>
                {voiceDetected && (
                  <div className="mt-2 text-[11px] font-bold text-emerald-800 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{t.voice.detectedInfo}</span>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => setShowVoiceModal(true)}
                className="shrink-0 px-4 py-3 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center gap-2 transition-all"
              >
                <Mic className="w-4 h-4 text-amber-300 animate-pulse" />
                <span>{t.onboarding.voiceButton}</span>
              </button>
            </div>
          </div>

          <div className="text-center relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-stone-200"></div>
            </div>
            <span className="relative px-3 bg-white text-[11px] font-bold text-stone-600 uppercase tracking-wider">
              {t.onboarding.orManual}
            </span>
          </div>

          {/* Simple Onboarding Questions */}
          <div className="space-y-4">
            {/* Question 1: Crop */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                {t.onboarding.cropQuestion}
              </label>
              <select
                value={selectedCrop}
                onChange={(e) => setSelectedCrop(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm text-stone-900 focus:ring-2 focus:ring-emerald-600"
              >
                {crops.length > 0 ? (
                  crops.map((c) => (
                    <option key={c.id} value={c.name_en}>
                      {language === 'mr' ? c.name_mr : language === 'hi' ? c.name_hi : c.name_en}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="Onion">Onion / कांदा / प्याज</option>
                    <option value="Tomato">Tomato / टोमॅटो / टमाटर</option>
                    <option value="Soybean">Soybean / सोयाबीन</option>
                    <option value="Cotton">Cotton / कापूस / कपास</option>
                    <option value="Pomegranate">Pomegranate / डाळिंब / अनार</option>
                    <option value="Grapes">Grapes / द्राक्षे / अंगूर</option>
                  </>
                )}
              </select>
            </div>

            {/* Question 2: Harvested Quantity */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                {t.onboarding.produceQuestion} ({t.common.optional})
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  value={produceQty}
                  onChange={(e) => setProduceQty(e.target.value)}
                  placeholder="e.g. 25"
                  className="w-full pl-3 pr-16 py-2 border border-stone-300 rounded-lg text-sm text-stone-900 focus:ring-2 focus:ring-emerald-600 tabular-nums"
                />
                <span className="absolute right-3 top-2 text-xs font-bold text-stone-600">
                  {t.common.quintal}
                </span>
              </div>
            </div>

            {/* Question 3: Dynamic Maharashtra Location Selector */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                {language === 'mr'
                  ? 'आपले शेत स्थान (महाराष्ट्र)'
                  : language === 'hi'
                  ? 'आपका खेत स्थान (महाराष्ट्र)'
                  : 'Your Farm Location (Maharashtra)'} *
              </label>
              <LocationSelector
                valueDistrict={district}
                valueTaluka={taluka}
                valueVillage={village}
                valueLat={latitude}
                valueLon={longitude}
                onChange={(loc) => {
                  setDistrict(loc.district);
                  if (loc.taluka) setTaluka(loc.taluka);
                  if (loc.village) setVillage(loc.village);
                  setLatitude(loc.latitude);
                  setLongitude(loc.longitude);
                }}
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 bg-stone-50 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={onComplete}
            className="text-xs font-semibold text-stone-600 hover:text-stone-900 order-2 sm:order-1"
          >
            {t.onboarding.skipForNow}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={handleSaveAndContinue}
            className="w-full sm:w-auto px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2 order-1 sm:order-2 disabled:opacity-50"
          >
            {loading ? t.common.saving : t.onboarding.completeProfile}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Voice Assistant Modal */}
      {showVoiceModal && (
        <VoiceAssistantModal
          mode="FARM_PROFILE"
          onClose={() => setShowVoiceModal(false)}
          onApplyProfile={handleVoiceProfileApplied}
        />
      )}
    </div>
  );
};
