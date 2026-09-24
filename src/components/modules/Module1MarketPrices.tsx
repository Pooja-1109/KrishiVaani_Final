import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Crop, MarketPrice, MLPipelineResult } from '../../types';
import { useLanguage } from '../../i18n/LanguageContext';
import {
  Search,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  Database,
  Radio,
  Calendar,
  Clock,
  ExternalLink,
  Brain,
  MapPin,
  Filter,
} from 'lucide-react';
import { MLPredictionExplainerCard } from '../common/MLPredictionExplainerCard';

interface Module1Props {
  onNavigateToNetCalculator?: (cropId: number) => void;
}

export const Module1MarketPrices: React.FC<Module1Props> = ({ onNavigateToNetCalculator }) => {
  const { profile } = useAuth();
  const { t, language, getCropName } = useLanguage();

  const [crops, setCrops] = useState<Crop[]>([]);
  const [selectedCropId, setSelectedCropId] = useState<number | undefined>(undefined);
  const [selectedRadius, setSelectedRadius] = useState<number | undefined>(undefined);
  const [prices, setPrices] = useState<MarketPrice[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Farmer location details
  const farmerLat = profile && 'latitude' in profile ? (profile as any).latitude : undefined;
  const farmerLon = profile && 'longitude' in profile ? (profile as any).longitude : undefined;
  const farmerDist = profile && 'district' in profile ? profile.district : undefined;
  const farmerVillage = profile && 'village' in profile ? profile.village : '';

  // ML Price Prediction Pipeline State
  const [mlResult, setMlResult] = useState<MLPipelineResult | null>(null);
  const [mlLoading, setMlLoading] = useState(false);

  const loadData = async (cropId?: number, radius?: number) => {
    setLoading(true);
    setError(null);
    try {
      const [cropsData, pricesData] = await Promise.all([
        api.getCrops(),
        api.getMarketPrices({
          cropId,
          lat: farmerLat,
          lon: farmerLon,
          district: farmerDist,
          radius,
        }),
      ]);
      setCrops(cropsData);
      setPrices(pricesData);

      const targetCropId = cropId || (cropsData.length > 0 ? cropsData[0].id : undefined);
      if (targetCropId) {
        loadMLPipeline(targetCropId);
      }
    } catch (err: any) {
      setError(err.message || t.common.error);
    } finally {
      setLoading(false);
    }
  };

  const loadMLPipeline = async (cropId: number) => {
    setMlLoading(true);
    try {
      const res = await fetch(`/api/price-prediction/${cropId}`);
      if (res.ok) {
        const data: MLPipelineResult = await res.json();
        setMlResult(data);
      }
    } catch (e) {
      console.warn('Failed to load ML pipeline data:', e);
    } finally {
      setMlLoading(false);
    }
  };

  useEffect(() => {
    loadData(selectedCropId, selectedRadius);
  }, [selectedCropId, selectedRadius, farmerLat, farmerLon, farmerDist]);

  const filteredPrices = prices.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (p.market_name && p.market_name.toLowerCase().includes(q)) ||
      (p.district && p.district.toLowerCase().includes(q)) ||
      (p.crop_name_en && p.crop_name_en.toLowerCase().includes(q)) ||
      (p.crop_name_mr && p.crop_name_mr.toLowerCase().includes(q))
    );
  });

  const selectedCrop = crops.find((c) => c.id === selectedCropId) || crops[0];

  const localizedLabels = {
    en: {
      dateHeader: 'Price Date',
      sourceHeader: 'Source / Provenance',
      lastUpdatedHeader: 'Last Updated',
      datasetBadge: 'Historical APMC Dataset',
      liveBadge: 'Live APMC Feed',
      historicalNotice: 'Data Integrity Notice: Records are authenticated historical mandi transactions from Maharashtra APMC registries (MSAMB/Agmarknet). Live auctions are explicitly labeled when telemetry is active.',
      radiusLabel: 'Search Radius',
      radiusAll: 'All Maharashtra',
      locationOrigin: 'Origin',
    },
    mr: {
      dateHeader: 'नोंद तारीख',
      sourceHeader: 'माहिती स्त्रोत',
      lastUpdatedHeader: 'शेवटचे अद्यतन',
      datasetBadge: 'ऐतिहासिक कृषी बाजार डेटासेट',
      liveBadge: 'थेट चालू लिलाव',
      historicalNotice: 'माहिती पारदर्शकता: हे दर महाराष्ट्र कृषी पणन मंडळ (MSAMB/Agmarknet) च्या अधिकृत ऐतिहासिक नोंदींवर आधारित आहेत. चालू लिलाव उपलब्ध असल्यास स्वतंत्रपणे दर्शविले जातात.',
      radiusLabel: 'अंतर मर्यादा',
      radiusAll: 'संपूर्ण महाराष्ट्र',
      locationOrigin: 'शेतकऱ्याचे ठिकाण',
    },
    hi: {
      dateHeader: 'मूल्य तिथि',
      sourceHeader: 'डेटा स्रोत',
      lastUpdatedHeader: 'अंतिम अद्यतन',
      datasetBadge: 'ऐतिहासिक मंडी डेटासेट',
      liveBadge: 'लाइव मंडी दर',
      historicalNotice: 'डेटा पारदर्शिता सूचना: ये भाव महाराष्ट्र कृषि विपणन बोर्ड (MSAMB/Agmarknet) के प्रामाणिक ऐतिहासिक रिकॉर्ड हैं। लाइव नीलामी सक्रिय होने पर स्पष्ट रूप से चिह्नित की जाती है।',
      radiusLabel: 'खोज दायरा',
      radiusAll: 'संपूर्ण महाराष्ट्र',
      locationOrigin: 'किसान का स्थान',
    },
  }[language];

  return (
    <div className="space-y-6">
      {/* Module Header */}
      <div className="border-b border-stone-200 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-extrabold text-stone-900 tracking-tight">
              {t.module1.title}
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 mt-1">
              {t.module1.subtitle}
            </p>
          </div>

          {farmerDist && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-[#173D32] font-semibold self-start sm:self-auto">
              <MapPin className="w-3.5 h-3.5 text-[#D6A844]" />
              <span>{localizedLabels.locationOrigin}: <strong>{farmerVillage ? `${farmerVillage}, ${farmerDist}` : farmerDist}</strong></span>
            </div>
          )}
        </div>

        {/* Data Integrity Banner */}
        <div className="mt-3 p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-700 flex items-center gap-2.5">
          <Database className="w-4 h-4 text-[#173D32] shrink-0" />
          <span>{localizedLabels.historicalNotice}</span>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="space-y-3">
        {/* Crop Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setSelectedCropId(undefined)}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
              selectedCropId === undefined
                ? 'bg-[#173D32] text-white shadow-xs'
                : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-100'
            }`}
          >
            {t.module1.allCrops}
          </button>
          {crops.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCropId(c.id)}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                selectedCropId === c.id
                  ? 'bg-[#173D32] text-white shadow-xs'
                  : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-100'
              }`}
            >
              {getCropName(c)}
            </button>
          ))}
        </div>

        {/* Search, Radius Filter & Refresh */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-stone-600 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" />
              <span>{localizedLabels.radiusLabel}:</span>
            </span>
            <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl border border-stone-200 text-xs">
              {[
                { label: '25 km', value: 25 },
                { label: '50 km', value: 50 },
                { label: '100 km', value: 100 },
                { label: localizedLabels.radiusAll, value: undefined },
              ].map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedRadius(opt.value)}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    selectedRadius === opt.value
                      ? 'bg-white text-[#173D32] shadow-2xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.module1.searchMarket}
                className="w-full pl-9 pr-3.5 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:bg-white focus:ring-2 focus:ring-[#173D32]"
              />
            </div>
            <button
              onClick={() => loadData(selectedCropId, selectedRadius)}
              className="p-2 border border-stone-300 rounded-xl bg-white hover:bg-stone-50 text-stone-700 cursor-pointer shadow-2xs"
              title={t.common.refresh}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#173D32]' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="py-16 text-center text-xs text-stone-500 font-medium">
          <div className="w-8 h-8 border-3 border-[#173D32] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          {t.common.loading}
        </div>
      ) : filteredPrices.length === 0 ? (
        /* Empty state */
        <div className="py-12 px-4 text-center bg-white rounded-2xl border border-stone-200">
          <p className="text-sm font-bold text-stone-700">
            {language === 'mr' ? 'या अंतरामध्ये बाजारभाव उपलब्ध नाहीत.' : 'No nearby market information is available for this location/radius.'}
          </p>
          <p className="text-xs text-stone-500 mt-1">
            {language === 'mr' ? 'कृपया शोध मर्यादा वाढवून संपूर्ण महाराष्ट्र निवडा.' : 'Try expanding your search radius to view broader regional mandis.'}
          </p>
          <button
            onClick={() => setSelectedRadius(undefined)}
            className="mt-3 px-4 py-1.5 bg-[#173D32] text-white text-xs font-bold rounded-xl cursor-pointer"
          >
            {localizedLabels.radiusAll}
          </button>
        </div>
      ) : (
        /* Market Prices Data Grid with Dynamic Distance */
        <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-stone-100/80 border-b border-stone-200 text-stone-700 font-bold">
                  <th className="py-3.5 px-4">{t.module1.mandiName}</th>
                  <th className="py-3.5 px-4">{t.farmerDashboard.cropSelect}</th>
                  <th className="py-3.5 px-4 text-right">{t.module1.distance}</th>
                  <th className="py-3.5 px-4 text-right">{t.module1.modalPrice}</th>
                  <th className="py-3.5 px-4 text-right">{t.module1.minMaxPrice}</th>
                  <th className="py-3.5 px-4 text-right">{t.module1.arrivals}</th>
                  <th className="py-3.5 px-4 text-center">{localizedLabels.dateHeader}</th>
                  <th className="py-3.5 px-4">{localizedLabels.sourceHeader}</th>
                  <th className="py-3.5 px-4 text-right">{t.common.action}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredPrices.map((p) => {
                  const cropObj = {
                    name_en: p.crop_name_en,
                    name_mr: p.crop_name_mr,
                    name_hi: p.crop_name_hi,
                  };
                  const isLive = Boolean(p.is_live);
                  const sourceText = p.data_source || 'Agmarknet APMC Historical Dataset';
                  const formattedDate = p.price_date;
                  const lastUpdated = p.last_updated
                    ? new Date(p.last_updated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : 'Recorded';

                  return (
                    <tr key={p.id} className="hover:bg-stone-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-extrabold text-stone-900">{p.market_name}</div>
                        <div className="text-[11px] text-stone-500">
                          {p.district}, {p.taluka}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-stone-800">{getCropName(cropObj)}</span>
                        <span className="text-[11px] text-stone-500 block">{p.category}</span>
                      </td>
                      <td className="py-3.5 px-4 text-right tabular-nums font-bold text-stone-700">
                        {Math.round((p.distance_km || 0) * 10) / 10} {t.common.km}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span className="text-sm font-black text-[#173D32] tabular-nums">
                          ₹{p.modal_price.toLocaleString('en-IN')}
                        </span>
                        <span className="text-[10px] text-stone-500 block">/ {t.common.quintal}</span>
                      </td>
                      <td className="py-3.5 px-4 text-right tabular-nums text-stone-600">
                        ₹{p.min_price} - ₹{p.max_price}
                      </td>
                      <td className="py-3.5 px-4 text-right tabular-nums font-medium text-stone-800">
                        {p.arrivals_qtl.toLocaleString('en-IN')} {t.common.quintals}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="font-mono text-stone-700 text-xs font-semibold block">
                          {formattedDate}
                        </span>
                        <span className="text-[10px] text-stone-500 block">
                          {lastUpdated}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isLive
                                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                : 'bg-emerald-100 text-[#173D32] border border-emerald-200'
                            }`}
                          >
                            <Database className="w-3 h-3" />
                            {isLive ? localizedLabels.liveBadge : localizedLabels.datasetBadge}
                          </span>
                        </div>
                        <span className="text-[10px] text-stone-500 block mt-0.5 max-w-[180px] truncate" title={sourceText}>
                          {sourceText}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {onNavigateToNetCalculator && (
                          <button
                            onClick={() => onNavigateToNetCalculator(p.crop_id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-extrabold bg-[#173D32] text-white hover:bg-[#0F2821] rounded-xl transition-all cursor-pointer shadow-2xs"
                          >
                            <span>{t.module1.calculateNet}</span>
                            <ArrowRight className="w-3 h-3 text-[#D6A844]" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Embedded Explainable ML Price Prediction Pipeline */}
      {selectedCrop && (
        <div className="pt-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-stone-700 flex items-center gap-2">
              <Brain className="w-4 h-4 text-[#173D32]" />
              <span>
                {language === 'mr'
                  ? `मशीन लर्निंग भाव अंदाज: ${getCropName(selectedCrop)}`
                  : language === 'hi'
                  ? `मशीन लर्निंग मूल्य पूर्वानुमान: ${getCropName(selectedCrop)}`
                  : `Empirical Price Prediction Pipeline: ${getCropName(selectedCrop)}`}
              </span>
            </h3>
            {crops.length > 0 && (
              <span className="text-xs text-stone-700">
                {language === 'mr' ? 'पीक बदला' : language === 'hi' ? 'फसल बदलें' : 'Select Crop'}:{' '}
                <select
                  value={selectedCrop.id}
                  onChange={(e) => {
                    const cid = Number(e.target.value);
                    setSelectedCropId(cid);
                    loadMLPipeline(cid);
                  }}
                  className="ml-1 border border-stone-300 rounded-lg px-2.5 py-1 text-xs bg-white text-stone-800 font-medium"
                >
                  {crops.map((c) => (
                    <option key={c.id} value={c.id}>
                      {getCropName(c)}
                    </option>
                  ))}
                </select>
              </span>
            )}
          </div>

          <MLPredictionExplainerCard
            mlResult={mlResult}
            loading={mlLoading}
            language={language}
            cropName={getCropName(selectedCrop)}
          />
        </div>
      )}
    </div>
  );
};
