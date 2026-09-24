/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage, SupportedLanguage } from '../../i18n/LanguageContext';
import { api } from '../../services/api';
import { FarmerProduce, BuyerBid, FPOLot, MarketPrice, Crop, BuyerRequirement, WeatherData } from '../../types';
import { VoiceAssistantModal } from '../common/VoiceAssistantModal';
import { LocationSelector } from '../common/LocationSelector';
import { ExtractedProduce, ExtractedFarmProfile } from '../../services/voiceAssistant';
import {
  TrendingUp,
  Scale,
  Users,
  Clock,
  Handshake,
  ShieldAlert,
  ArrowRight,
  PlusCircle,
  MapPin,
  Mic,
  Languages,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
  X,
  CloudRain,
  Sun,
  Droplets,
  Package,
  Activity,
  ChevronRight,
} from 'lucide-react';

interface FarmerDashboardProps {
  onNavigate: (tab: string, extra?: any) => void;
  onOpenVoiceSetup?: () => void;
}

export const FarmerDashboard: React.FC<FarmerDashboardProps> = ({ onNavigate }) => {
  const { profile, refreshMe } = useAuth();
  const { t, getCropName, language, setLanguage } = useLanguage();

  const [produce, setProduce] = useState<FarmerProduce[]>([]);
  const [bids, setBids] = useState<BuyerBid[]>([]);
  const [fpoLots, setFpoLots] = useState<FPOLot[]>([]);
  const [marketPrices, setMarketPrices] = useState<MarketPrice[]>([]);
  const [buyerReqs, setBuyerReqs] = useState<BuyerRequirement[]>([]);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showAddProduceModal, setShowAddProduceModal] = useState(false);
  const [showVoiceAssistant, setShowVoiceAssistant] = useState(false);
  const [voiceAssistantMode, setVoiceAssistantMode] = useState<'FARM_PROFILE' | 'PRODUCE'>('PRODUCE');

  // Add Produce Form State
  const [newProduceCropId, setNewProduceCropId] = useState<number>(1);
  const [newProduceVariety, setNewProduceVariety] = useState<string>('Local High-Yield');
  const [newProduceQty, setNewProduceQty] = useState<string>('');
  const [newProduceGrade, setNewProduceGrade] = useState<string>('Grade A');
  const [newProducePrice, setNewProducePrice] = useState<string>('');
  const [newProduceVillage, setNewProduceVillage] = useState<string>('');
  const [newProduceTaluka, setNewProduceTaluka] = useState<string>('');
  const [newProduceDistrict, setNewProduceDistrict] = useState<string>('');
  const [newProduceLat, setNewProduceLat] = useState<number | undefined>(undefined);
  const [newProduceLon, setNewProduceLon] = useState<number | undefined>(undefined);
  const [submittingProduce, setSubmittingProduce] = useState(false);

  // Extract farmer location details
  const farmerLat = profile && 'latitude' in profile ? (profile as any).latitude : undefined;
  const farmerLon = profile && 'longitude' in profile ? (profile as any).longitude : undefined;
  const farmerDist = profile && 'district' in profile ? profile.district : undefined;
  const farmerVillage = profile && 'village' in profile && profile.village ? profile.village : '';
  const farmerDistrict = profile && 'district' in profile && profile.district ? profile.district : 'Maharashtra';
  const farmerName = profile && 'full_name' in profile ? profile.full_name : 'Farmer Partner';
  const primaryCropName = profile && 'primary_crop' in profile && profile.primary_crop ? profile.primary_crop : '';

  const loadDashboardData = async () => {
    try {
      const [p, b, l, m, reqs, crps, w] = await Promise.all([
        api.getFarmerProduce().catch(() => []),
        api.getBids().catch(() => []),
        api.getFpoLots().catch(() => []),
        api.getMarketPrices({ lat: farmerLat, lon: farmerLon, district: farmerDist, radius: 150 }).catch(() => []),
        api.getBuyerRequirements().catch(() => []),
        api.getCrops().catch(() => []),
        api.getWeather(farmerDist, farmerLat, farmerLon).catch(() => null),
      ]);
      setProduce(p);
      setBids(b);
      setFpoLots(l);
      setMarketPrices(m.slice(0, 6));
      setBuyerReqs(reqs);
      setCrops(crps);
      setWeather(w);

      if (crps.length > 0) {
        setNewProduceCropId(crps[0].id);
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [farmerLat, farmerLon, farmerDist]);

  useEffect(() => {
    if (profile && 'village' in profile) {
      if (profile.village) setNewProduceVillage(profile.village);
      if (profile.district) setNewProduceDistrict(profile.district);
      if ((profile as any).taluka) setNewProduceTaluka((profile as any).taluka);
      if ((profile as any).latitude) setNewProduceLat((profile as any).latitude);
      if ((profile as any).longitude) setNewProduceLon((profile as any).longitude);
    }
  }, [profile]);

  const handleLanguageChange = async (lang: SupportedLanguage) => {
    setLanguage(lang);
    try {
      await api.updateLanguage(lang);
    } catch (_) {}
  };

  const handleVoiceProduceApplied = (extracted: ExtractedProduce) => {
    if (extracted.cropId) {
      setNewProduceCropId(extracted.cropId);
    } else if (extracted.cropName) {
      const match = crops.find(
        (c) =>
          c.name_en.toLowerCase() === extracted.cropName?.toLowerCase() ||
          c.name_mr === extracted.cropName ||
          c.name_hi === extracted.cropName
      );
      if (match) setNewProduceCropId(match.id);
    }
    if (extracted.quantityQtl) setNewProduceQty(extracted.quantityQtl.toString());
    if (extracted.qualityGrade) setNewProduceGrade(extracted.qualityGrade);
    if (extracted.expectedPrice) setNewProducePrice(extracted.expectedPrice.toString());
    setShowAddProduceModal(true);
  };

  const handleVoiceProfileApplied = async (extracted: ExtractedFarmProfile) => {
    try {
      await api.updateFarmerProfile({
        village: extracted.village || (profile && 'village' in profile ? profile.village : ''),
        taluka: extracted.taluka || ((profile as any)?.taluka || ''),
        district: extracted.district || (profile && 'district' in profile ? profile.district : 'Maharashtra'),
        primary_crop: extracted.primaryCrop || (profile && 'primary_crop' in profile ? profile.primary_crop : ''),
        land_area: extracted.landArea || (profile && 'land_area' in profile ? String(profile.land_area) : ''),
      });
      await refreshMe();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateProduceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseFloat(newProduceQty);
    if (!qty || qty <= 0) return;

    setSubmittingProduce(true);
    try {
      await api.createFarmerProduce({
        crop_id: Number(newProduceCropId),
        variety: newProduceVariety || 'Local High-Yield',
        quantity_qtl: qty,
        harvest_date: new Date().toISOString().split('T')[0],
        quality_grade: newProduceGrade || 'Grade A',
        storage_location_district: newProduceDistrict || farmerDistrict,
        storage_location_village: newProduceVillage || farmerVillage || 'Local Farm',
        expected_price_per_qtl: parseFloat(newProducePrice) || 2000,
        latitude: newProduceLat || farmerLat,
        longitude: newProduceLon || farmerLon,
      });

      const updated = await api.getFarmerProduce();
      setProduce(updated);
      setShowAddProduceModal(false);
      setNewProduceQty('');
      setNewProducePrice('');
    } catch (err) {
      console.error('Failed to create produce:', err);
    } finally {
      setSubmittingProduce(false);
    }
  };

  const pendingBids = bids.filter((b) => b.status === 'PENDING');
  const availableProduceQty = produce
    .filter((p) => p.status === 'AVAILABLE')
    .reduce((sum, p) => sum + p.quantity_qtl, 0);

  const relevantPrice = marketPrices.find(
    (mp) =>
      mp.crop_name_en?.toLowerCase() === primaryCropName.toLowerCase() ||
      mp.crop_name_mr === primaryCropName ||
      mp.crop_name_hi === primaryCropName
  ) || marketPrices[0];

  const matchingBuyers = buyerReqs.filter(
    (req) =>
      !primaryCropName ||
      req.crop_name_en?.toLowerCase() === primaryCropName.toLowerCase() ||
      req.crop_name_mr === primaryCropName ||
      req.crop_name_hi === primaryCropName
  );

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) {
      return language === 'mr' ? 'शुभ सकाळ' : language === 'hi' ? 'शुभ प्रभात' : 'Good morning';
    } else if (hour < 17) {
      return language === 'mr' ? 'शुभ दुपार' : language === 'hi' ? 'शुभ दोपहर' : 'Good afternoon';
    } else {
      return language === 'mr' ? 'शुभ संध्याकाळ' : language === 'hi' ? 'शुभ संध्या' : 'Good evening';
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="w-10 h-10 border-3 border-[#173D32] border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-xs font-bold text-stone-600 mt-3">{t.common.loading}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* 1. WELCOME HEADER AREA WITH WEATHER INTEGRATION */}
      <div className="bg-[#173D32] text-white p-6 sm:p-8 rounded-3xl shadow-lg border border-[#173D32]/80 relative overflow-hidden">
        {/* Subtle background grain / organic gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/60 via-[#173D32] to-[#0F2821] pointer-events-none" />
        <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-[#D6A844]/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-[#F6F1E5] font-medium flex items-center gap-1.5 bg-black/30 backdrop-blur-xs px-3 py-1 rounded-full border border-white/15">
                <MapPin className="w-3.5 h-3.5 text-[#D6A844]" />
                <span className="font-bold text-[#D6A844]">{t.farmerDashboard.locationLabel}:</span>{' '}
                {farmerVillage ? `${farmerVillage}, ${farmerDistrict}` : farmerDistrict}
              </span>

              {weather && (
                <span className="text-xs text-[#F6F1E5] font-medium flex items-center gap-1.5 bg-emerald-900/60 backdrop-blur-xs px-3 py-1 rounded-full border border-emerald-500/30">
                  {weather.rainRisk === 'HIGH' || weather.rainRisk === 'SEVERE' ? (
                    <CloudRain className="w-3.5 h-3.5 text-cyan-300" />
                  ) : (
                    <Sun className="w-3.5 h-3.5 text-[#D6A844]" />
                  )}
                  <span>{Math.round(weather.currentTemp)}°C</span>
                  <span className="text-stone-300">•</span>
                  <span>{weather.currentHumidity}% {language === 'mr' ? 'आर्द्रता' : language === 'hi' ? 'नमी' : 'Humidity'}</span>
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white font-serif">
              {getGreeting()}, {farmerName}
            </h1>

            <p className="text-xs sm:text-sm text-stone-200/90 font-medium max-w-2xl">
              {primaryCropName ? (
                <>
                  <span className="text-[#D6A844] font-bold">{primaryCropName}</span>
                  {' — '}
                  {availableProduceQty > 0
                    ? `${availableProduceQty} ${t.common.quintal} ${t.common.available}`
                    : t.farmerDashboard.noProduceYet}
                </>
              ) : (
                farmerVillage ? `${farmerVillage}, ${farmerDistrict}` : farmerDistrict
              )}
            </p>
          </div>

          {/* Quick Voice Assistant + Language Selector */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                setVoiceAssistantMode('FARM_PROFILE');
                setShowVoiceAssistant(true);
              }}
              className="px-4 py-2.5 bg-[#D6A844] hover:bg-[#c2963b] active:scale-95 text-[#0F2821] font-extrabold text-xs rounded-xl shadow-md flex items-center gap-2 transition-all cursor-pointer"
            >
              <Mic className="w-4 h-4 text-[#173D32] animate-pulse" />
              <span>{t.farmerDashboard.speakWithAssistant}</span>
            </button>

            <button
              onClick={() => setShowAddProduceModal(true)}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center gap-2 transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-white" />
              <span>{t.farmerDashboard.addNewProduce}</span>
            </button>

            <div className="flex items-center gap-1 bg-black/40 backdrop-blur-xs p-1 rounded-xl border border-white/15">
              <Languages className="w-3.5 h-3.5 text-[#D6A844] ml-1.5 shrink-0" />
              {(['mr', 'hi', 'en'] as SupportedLanguage[]).map((lang) => (
                <button
                  key={lang}
                  onClick={() => handleLanguageChange(lang)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    language === lang
                      ? 'bg-[#D6A844] text-[#0F2821] shadow-xs'
                      : 'text-stone-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {lang === 'mr' ? 'मराठी' : lang === 'hi' ? 'हिंदी' : 'EN'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 2. MAIN PERSONALIZED PRODUCE AREA */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-stone-200 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-[#173D32]" />
            <h2 className="font-extrabold text-base text-stone-900">
              {t.farmerDashboard.myProduceLots}
            </h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-[#173D32]">
              {produce.length}
            </span>
          </div>

          <button
            onClick={() => setShowAddProduceModal(true)}
            className="px-3.5 py-1.5 bg-[#173D32] hover:bg-[#0F2821] text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5 text-[#D6A844]" />
            <span>{t.farmerDashboard.addNewProduce}</span>
          </button>
        </div>

        {produce.length === 0 ? (
          <div className="py-10 px-4 text-center border-2 border-dashed border-stone-200 rounded-2xl bg-[#FBF9F5]">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-[#173D32] flex items-center justify-center mx-auto mb-3">
              <Package className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-stone-900">
              {language === 'mr' ? 'अद्याप कोणताही शेतमाल जोडलेला नाही' : language === 'hi' ? 'अभी कोई फसल नहीं जोड़ी गई है' : 'No produce added yet.'}
            </h3>
            <p className="text-xs text-stone-600 max-w-md mx-auto mt-1">
              {t.farmerDashboard.noActiveProduce}
            </p>
            <button
              onClick={() => setShowAddProduceModal(true)}
              className="mt-4 px-5 py-2.5 bg-[#173D32] hover:bg-[#0F2821] text-white font-extrabold text-xs rounded-xl shadow-sm inline-flex items-center gap-2 transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-[#D6A844]" />
              <span>{t.farmerDashboard.addProduceButton}</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {produce.map((lot) => (
              <div
                key={lot.id}
                className="p-4 rounded-2xl border border-stone-200 bg-[#FBF9F5] hover:bg-white hover:border-[#173D32] hover:shadow-md transition-all flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-base text-stone-900">
                      {getCropName({
                        name_en: lot.crop_name_en,
                        name_mr: lot.crop_name_mr,
                        name_hi: lot.crop_name_hi,
                      })}
                    </span>
                    <span className="px-2.5 py-0.5 bg-emerald-100 text-[#173D32] text-[11px] font-bold rounded-full">
                      {lot.quality_grade || 'Grade A'}
                    </span>
                  </div>

                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-2xl font-black text-stone-900 tabular-nums">
                      {lot.quantity_qtl}
                    </span>
                    <span className="text-xs text-stone-600 font-medium">{t.common.quintal}</span>
                    <span className="text-xs text-stone-400">•</span>
                    <span className="text-xs font-bold text-[#173D32] tabular-nums">
                      ₹{lot.expected_price_per_qtl} / {t.common.quintal}
                    </span>
                  </div>

                  <div className="mt-2 text-[11px] text-stone-600 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                    <span className="truncate">
                      {lot.village || (lot as any).storage_location_village || farmerVillage || 'Farm'},{' '}
                      {lot.district || (lot as any).storage_location_district || farmerDistrict}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-stone-200 flex items-center justify-between text-xs font-bold">
                  <button
                    onClick={() => onNavigate('module2', lot.crop_id)}
                    className="text-[#173D32] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>{t.farmerDashboard.cardNetRealisationBtn}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onNavigate('module5')}
                    className="text-stone-600 hover:text-stone-900 font-semibold cursor-pointer"
                  >
                    {t.farmerDashboard.cardBiddingBtn}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. CORE EARNINGS & STRATEGIC INSIGHTS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Mandi Price (Computed from nearby market) */}
        <div
          onClick={() => onNavigate('module1')}
          className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs hover:border-[#173D32] hover:shadow-md cursor-pointer transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-stone-600 uppercase tracking-wide">
                {t.farmerDashboard.whatIsMyCropWorth}
              </span>
              <span className="w-8 h-8 rounded-xl bg-emerald-50 text-[#173D32] flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-stone-900 tabular-nums">
                ₹{relevantPrice ? relevantPrice.modal_price : '2,150'}
                <span className="text-xs font-normal text-stone-600"> / {t.common.quintal}</span>
              </div>
              <div className="text-xs text-[#173D32] font-bold mt-1 truncate">
                {relevantPrice ? relevantPrice.market_name : 'Nearby Mandi'}
              </div>
              {relevantPrice?.distance_km !== undefined && (
                <div className="text-[11px] text-stone-500 mt-0.5">
                  {Math.round(relevantPrice.distance_km * 10) / 10} km {language === 'mr' ? 'अंतरावर' : language === 'hi' ? 'दूरी पर' : 'distance'}
                </div>
              )}
            </div>
          </div>
          <div className="pt-3 border-t border-stone-100 mt-3 flex items-center justify-between text-xs font-bold text-[#173D32]">
            <span>{t.farmerDashboard.cardMandiBtn}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Card 2: Dominant Expected Net Realisation */}
        <div
          onClick={() => onNavigate('module2')}
          className="bg-gradient-to-br from-[#F6F1E5] to-white p-5 rounded-2xl border-2 border-[#173D32] shadow-sm hover:shadow-md cursor-pointer transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold text-[#173D32] uppercase tracking-wide">
                {t.farmerDashboard.whatCouldIReceive}
              </span>
              <span className="w-8 h-8 rounded-xl bg-[#173D32] text-white flex items-center justify-center">
                <Scale className="w-4 h-4 text-[#D6A844]" />
              </span>
            </div>
            <div className="mt-3">
              <div className="text-3xl font-black text-[#173D32] tabular-nums">
                ₹{relevantPrice ? Math.round(relevantPrice.modal_price * 0.915) : '1,967'}
                <span className="text-xs font-normal text-stone-600"> / {t.common.quintal}</span>
              </div>
              <div className="text-xs text-[#5A8F62] font-bold mt-1 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#5A8F62]"></span>
                <span>{t.farmerDashboard.expectedNetPerQtl}</span>
              </div>
              <p className="text-[11px] text-stone-600 mt-1 line-clamp-2">
                {language === 'mr'
                  ? 'वाहतूक व खर्च वजा जाता हातात मिळणारा निव्वळ दर'
                  : language === 'hi'
                  ? 'परिवहन व मंडी खर्च काटकर हाथ में मिलने वाली शुद्ध आय'
                  : 'Net in-hand revenue calculated for your location'}
              </p>
            </div>
          </div>
          <div className="pt-3 border-t border-stone-200 mt-3 flex items-center justify-between text-xs font-extrabold text-[#173D32]">
            <span>{t.farmerDashboard.cardNetRealisationBtn}</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>

        {/* Card 3: Sell or Wait Decision */}
        <div
          onClick={() => onNavigate('module4')}
          className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs hover:border-[#173D32] hover:shadow-md cursor-pointer transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-stone-600 uppercase tracking-wide">
                {t.farmerDashboard.shouldISellNow}
              </span>
              <span className="w-8 h-8 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-100 text-[#173D32] font-black text-sm">
                <CheckCircle2 className="w-4 h-4 text-[#173D32]" />
                <span>
                  {language === 'mr' ? 'आत्ताच विका' : language === 'hi' ? 'अभी बेचें' : 'SELL NOW'}
                </span>
              </div>
              <div className="text-xs text-stone-700 font-semibold mt-1.5">
                {weather?.rainRisk === 'HIGH'
                  ? (language === 'mr' ? 'पावसाची शक्यता असल्याने साठवणूक जोखीम' : 'High rain moisture risk')
                  : (language === 'mr' ? 'हवामान अनुकूल, योग्य बाजारभाव' : 'Optimal liquidation timing')}
              </div>
            </div>
          </div>
          <div className="pt-3 border-t border-stone-100 mt-3 flex items-center justify-between text-xs font-bold text-[#173D32]">
            <span>{t.farmerDashboard.cardSellWaitBtn}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Card 4: Buyer Matches & Pending Bids */}
        <div
          onClick={() => onNavigate('module5')}
          className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs hover:border-[#173D32] hover:shadow-md cursor-pointer transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-stone-600 uppercase tracking-wide">
                {t.farmerDashboard.areBuyersInterested}
              </span>
              <span className="w-8 h-8 rounded-xl bg-blue-50 text-blue-800 flex items-center justify-center">
                <Handshake className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-stone-900 tabular-nums">
                {matchingBuyers.length}{' '}
                <span className="text-xs font-normal text-stone-600">
                  {language === 'mr' ? 'खरेदी मागण्या' : language === 'hi' ? 'खरीद मांग' : 'buyers active'}
                </span>
              </div>
              <div className="text-xs text-amber-700 font-bold mt-1">
                {pendingBids.length > 0
                  ? `${pendingBids.length} ${language === 'mr' ? 'थेट बोली प्राप्त' : language === 'hi' ? 'सीधी बोलियां प्राप्त' : 'direct bids waiting'}`
                  : t.farmerDashboard.noBidsYet}
              </div>
            </div>
          </div>
          <div className="pt-3 border-t border-stone-100 mt-3 flex items-center justify-between text-xs font-bold text-[#173D32]">
            <span>{t.farmerDashboard.cardBiddingBtn}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* 4. NEARBY MARKET SNAPSHOT (REAL HAVERSINE DISTANCE) */}
      <div className="bg-white border border-stone-200 rounded-2xl p-5 sm:p-6 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-extrabold text-stone-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#173D32]" />
              <span>{t.farmerDashboard.liveMandiUpdate}</span>
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              {language === 'mr'
                ? `तुमच्या स्थानापासून (${farmerDistrict}) जवळच्या कृषी उत्पन्न बाजार समित्यांचे थेट भाव`
                : language === 'hi'
                ? `आपके स्थान (${farmerDistrict}) से निकटतम मंडियों के वास्तविक भाव`
                : `Nearby APMC market rates calculated from your saved location (${farmerDistrict})`}
            </p>
          </div>

          <button
            onClick={() => onNavigate('module1')}
            className="text-xs font-bold text-[#173D32] hover:underline flex items-center gap-1 cursor-pointer shrink-0"
          >
            <span>{language === 'mr' ? 'सर्व बाजारभाव पाहा' : language === 'hi' ? 'सभी मंडी भाव देखें' : 'View All Mandis'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {marketPrices.length === 0 ? (
          <div className="py-8 text-center text-xs text-stone-500">
            {language === 'mr' ? 'या परिसरासाठी बाजारभाव उपलब्ध नाहीत.' : 'No nearby market information is available for your selected location.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {marketPrices.map((mp) => (
              <div
                key={mp.id}
                onClick={() => onNavigate('module1')}
                className="bg-[#FBF9F5] p-3.5 rounded-xl border border-stone-200 hover:border-[#173D32] hover:bg-white transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="text-xs font-extrabold text-stone-900 truncate" title={mp.market_name}>
                    {mp.market_name}
                  </div>
                  <div className="text-[11px] text-stone-600 font-semibold mt-0.5">
                    {getCropName({ name_en: mp.crop_name_en, name_mr: mp.crop_name_mr, name_hi: mp.crop_name_hi })}
                  </div>
                  <div className="text-lg font-black text-[#173D32] mt-1.5 tabular-nums">
                    ₹{mp.modal_price}
                    <span className="text-[10px] font-normal text-stone-600"> / {t.common.quintal}</span>
                  </div>
                </div>
                <div className="text-[10px] font-bold text-stone-500 mt-2 pt-2 border-t border-stone-200/60 flex items-center justify-between">
                  <span>{t.module1.distance}:</span>
                  <span className="text-stone-800">{Math.round((mp.distance_km || 0) * 10) / 10} {t.common.km}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. RECENT ACTIVITY & PENDING BIDS */}
      {bids.length > 0 && (
        <div className="bg-white border border-stone-200 rounded-2xl p-5 sm:p-6 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-extrabold text-stone-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#173D32]" />
              <span>{language === 'mr' ? 'थेट खरेदीदार बोल्या व व्यवहार' : language === 'hi' ? 'सीधी बोलियां व सौदे' : 'Active Buyer Bids & Activity'}</span>
            </h3>

            <button
              onClick={() => onNavigate('module5')}
              className="text-xs font-bold text-[#173D32] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>{language === 'mr' ? 'सर्व बोल्या पाहा' : language === 'hi' ? 'सभी बोलियां देखें' : 'View All Bids'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {bids.slice(0, 3).map((b) => (
              <div
                key={b.id}
                className="p-3.5 rounded-xl border border-stone-200 bg-[#FBF9F5] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-stone-900">
                      {b.business_name || b.contact_person || 'Verified Buyer'}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      b.status === 'ACCEPTED' ? 'bg-emerald-100 text-emerald-800' :
                      b.status === 'PENDING' ? 'bg-amber-100 text-amber-800' : 'bg-stone-200 text-stone-700'
                    }`}>
                      {b.status}
                    </span>
                  </div>
                  <div className="text-xs text-stone-600 mt-1">
                    {b.quantity_qtl} {t.common.quintal} @ <span className="font-bold text-[#173D32]">₹{b.bid_price_per_qtl} / {t.common.quintal}</span>
                  </div>
                </div>

                <button
                  onClick={() => onNavigate('module5')}
                  className="px-3 py-1.5 bg-[#173D32] text-white text-xs font-bold rounded-lg hover:bg-[#0F2821] transition-colors cursor-pointer self-start sm:self-auto"
                >
                  {language === 'mr' ? 'तपशील पाहा' : language === 'hi' ? 'विवरण देखें' : 'View Offer'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ADD PRODUCE MODAL */}
      {showAddProduceModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[92vh]">
            <div className="p-4 bg-[#173D32] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-[#D6A844]" />
                <h3 className="font-extrabold text-sm sm:text-base">
                  {t.farmerDashboard.addProduceModalTitle}
                </h3>
              </div>
              <button
                onClick={() => setShowAddProduceModal(false)}
                className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-stone-300 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4">
              {/* Voice Input Banner for Produce */}
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#173D32] text-[#D6A844] flex items-center justify-center shrink-0">
                    <Mic className="w-4 h-4 animate-pulse" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-emerald-950">
                      {t.voice.speakProduceDetails}
                    </div>
                    <div className="text-[10px] text-stone-600">
                      {t.voice.produceExamplePrompt}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setVoiceAssistantMode('PRODUCE');
                    setShowVoiceAssistant(true);
                  }}
                  className="shrink-0 px-3 py-1.5 bg-[#173D32] hover:bg-[#0F2821] text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Mic className="w-3.5 h-3.5 text-[#D6A844]" />
                  <span>{t.voice.tapToSpeak}</span>
                </button>
              </div>

              <form onSubmit={handleCreateProduceSubmit} className="space-y-3.5">
                {/* Crop */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    {t.farmerDashboard.cropSelect} *
                  </label>
                  <select
                    value={newProduceCropId}
                    onChange={(e) => setNewProduceCropId(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:bg-white focus:ring-2 focus:ring-[#173D32]"
                  >
                    {crops.map((c) => (
                      <option key={c.id} value={c.id}>
                        {language === 'mr' ? c.name_mr : language === 'hi' ? c.name_hi : c.name_en}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Variety & Grade */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      {t.farmerDashboard.variety}
                    </label>
                    <input
                      type="text"
                      value={newProduceVariety}
                      onChange={(e) => setNewProduceVariety(e.target.value)}
                      placeholder="e.g. Gavran / PKV-Tara"
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:bg-white focus:ring-2 focus:ring-[#173D32]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      {t.farmerDashboard.qualityGrade} *
                    </label>
                    <select
                      value={newProduceGrade}
                      onChange={(e) => setNewProduceGrade(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:bg-white focus:ring-2 focus:ring-[#173D32]"
                    >
                      <option value="Grade A">Grade A (Premium)</option>
                      <option value="Grade B">Grade B (Standard)</option>
                      <option value="Grade C">Grade C (Processing)</option>
                    </select>
                  </div>
                </div>

                {/* Quantity & Expected Price */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      {t.farmerDashboard.quantityQtl} *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={newProduceQty}
                      onChange={(e) => setNewProduceQty(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:bg-white focus:ring-2 focus:ring-[#173D32] tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      {t.farmerDashboard.expectedPrice}
                    </label>
                    <input
                      type="number"
                      value={newProducePrice}
                      onChange={(e) => setNewProducePrice(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:bg-white focus:ring-2 focus:ring-[#173D32] tabular-nums"
                    />
                  </div>
                </div>

                {/* Storage Location */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1.5">
                    {t.profile.village} / {t.profile.district} *
                  </label>
                  <LocationSelector
                    valueDistrict={newProduceDistrict}
                    valueTaluka={newProduceTaluka}
                    valueVillage={newProduceVillage}
                    valueLat={newProduceLat}
                    valueLon={newProduceLon}
                    onChange={(loc) => {
                      setNewProduceDistrict(loc.district);
                      if (loc.taluka) setNewProduceTaluka(loc.taluka);
                      if (loc.village) setNewProduceVillage(loc.village);
                      setNewProduceLat(loc.latitude);
                      setNewProduceLon(loc.longitude);
                    }}
                  />
                </div>

                <div className="pt-3 border-t border-stone-200 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowAddProduceModal(false)}
                    className="px-4 py-2 border border-stone-300 text-stone-700 font-bold text-xs rounded-xl hover:bg-stone-50 cursor-pointer"
                  >
                    {t.common.cancel}
                  </button>
                  <button
                    type="submit"
                    disabled={submittingProduce}
                    className="px-5 py-2 bg-[#173D32] hover:bg-[#0F2821] text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4 text-[#D6A844]" />
                    <span>{submittingProduce ? t.common.saving : t.farmerDashboard.addProduceButton}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* VOICE ASSISTANT MODAL */}
      {showVoiceAssistant && (
        <VoiceAssistantModal
          mode={voiceAssistantMode}
          onClose={() => setShowVoiceAssistant(false)}
          onApplyProduce={handleVoiceProduceApplied}
          onApplyProfile={handleVoiceProfileApplied}
        />
      )}
    </div>
  );
};
