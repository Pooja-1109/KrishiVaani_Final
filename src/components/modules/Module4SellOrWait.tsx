import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Crop, SellOrWaitEvaluation, WeatherData } from '../../types';
import { useLanguage } from '../../i18n/LanguageContext';
import {
  Clock,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  CloudRain,
  ShieldCheck,
  Thermometer,
  Droplets,
  RefreshCw,
  Scale,
  DollarSign,
  ArrowRight,
  Database,
  SlidersHorizontal,
} from 'lucide-react';
import { ExplainableRecommendationCard } from '../common/ExplainableRecommendationCard';
import { MLPredictionExplainerCard } from '../common/MLPredictionExplainerCard';
import { OpenMeteoWeatherCard } from '../common/OpenMeteoWeatherCard';

export const Module4SellOrWait: React.FC = () => {
  const { profile } = useAuth();
  const { t, getCropName, language } = useLanguage();

  const [crops, setCrops] = useState<Crop[]>([]);
  const [selectedCropId, setSelectedCropId] = useState<number>(1);
  const [evaluation, setEvaluation] = useState<SellOrWaitEvaluation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const farmerLat = profile && 'latitude' in profile ? (profile as any).latitude : undefined;
  const farmerLon = profile && 'longitude' in profile ? (profile as any).longitude : undefined;
  const farmerDist = profile && 'district' in profile ? profile.district : undefined;

  useEffect(() => {
    async function loadCrops() {
      try {
        const list = await api.getCrops();
        setCrops(list);
        if (list.length > 0) setSelectedCropId(list[0].id);
      } catch (err: any) {
        setError(err.message);
      }
    }
    loadCrops();
  }, []);

  const loadEvaluation = async (cropId: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.evaluateSellOrWait(cropId, {
        lat: farmerLat,
        lon: farmerLon,
        district: farmerDist,
      });
      setEvaluation(data);
    } catch (err: any) {
      setError(err.message || t.common.error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCropId) {
      loadEvaluation(selectedCropId);
    }
  }, [selectedCropId, farmerLat, farmerLon, farmerDist]);

  const getRationaleText = () => {
    if (!evaluation) return '';
    const rec = evaluation.recommendation;
    if (language === 'mr') return rec.rationaleMr;
    if (language === 'hi') return rec.rationaleHi;
    return rec.rationaleEn;
  };

  const ui = {
    en: {
      decisionHeader: 'Harvest Advisory: Sell Now vs Wait Intelligence',
      subtitle: 'Multi-factor decision support integrating APMC prices, Open-Meteo atmospheric risk, storage cost, and perishability decay. Final choice remains with the farmer.',
      sellNowValueLabel: 'Expected Sell-Now Value',
      waitValueLabel: 'Expected Wait Value (Net of Storage & Wastage)',
      netAdvantage: 'Net Variance',
      currentMandiValue: 'Current Modal Mandi Rate',
      futureGrossProjection: 'Projected Gross Mandi Rate',
      storageCostTotal: 'Storage Holding Cost',
      wastageDeduction: 'Estimated Spoilage / Decay Markdown',
      holdingHorizon: 'Holding Horizon',
      decisionSupportDisclaimer: 'Decision Support Advisory: KrishiVaani provides data-driven evidence and probabilistic holding models. Market volatility and local spot negotiations vary; the final transaction decision belongs entirely to the farmer.',
      whyHeader: 'Contributing Factor Synthesis (Why?)',
      weatherAdvisory: 'Atmospheric Risk Assessment',
    },
    mr: {
      decisionHeader: 'शेतमाल विक्री सल्ला: त्वरित विक्री की साठवणूक?',
      subtitle: 'बाजारभाव अंदाज, हवामान जोखीम, साठवणूक खर्च व नासाडीचा एकत्रित अभ्यास. अंतिम निर्णय नेहमी शेतकऱ्याचाच.',
      sellNowValueLabel: 'आत्ता विकल्यास मिळणारे अपेक्षित मूल्य',
      waitValueLabel: 'थांबल्यास अपेक्षित निव्वळ मूल्य (खर्च व नासाडी वजा जाता)',
      netAdvantage: 'निव्वळ नफा/तोटा फरक',
      currentMandiValue: 'आजचा चालू बाजारभाव',
      futureGrossProjection: 'भविष्यातील अंदाजित ढोबळ भाव',
      storageCostTotal: 'एकूण साठवणूक खर्च',
      wastageDeduction: 'संभाव्य नासाडी व वजनातील घट',
      holdingHorizon: 'शिफारस केलेला साठवणूक काळ',
      decisionSupportDisclaimer: 'निर्णय साहाय्य सूचना: ही प्रणाली केवळ उपलब्ध डेटा आणि गणितीय अंदाजांच्या आधारे माहिती देते. स्थानिक बाजारातील परिस्थितीनुसार अंतिम निर्णय घेण्याचा अधिकार पूर्णपणे शेतकऱ्याचा आहे.',
      whyHeader: 'कारणीभूत घटकांचे विश्लेषण (हेच का?)',
      weatherAdvisory: 'हवामान व ओलावा जोखीम',
    },
    hi: {
      decisionHeader: 'फसल बिक्री परामर्श: तुरंत बेचें या रोकें?',
      subtitle: 'मंडी भाव पूर्वानुमान, वायुमंडलीय नमी, भंडारण लागत और सड़न दर का समग्र विश्लेषण। अंतिम निर्णय किसान का ही रहेगा।',
      sellNowValueLabel: 'अभी बेचने पर अनुमानित मूल्य',
      waitValueLabel: 'रुकने पर अनुमानित शुद्ध मूल्य (लागत व खराबी घटाकर)',
      netAdvantage: 'शुद्ध अंतर (लाभ/हानि)',
      currentMandiValue: 'आज का प्रचलित मंडी भाव',
      futureGrossProjection: 'भविष्य का अनुमानित सकल भाव',
      storageCostTotal: 'कुल भंडारण लागत',
      wastageDeduction: 'अनुमानित सड़न व वजन में कमी',
      holdingHorizon: 'अनुशंसित भंडारण अवधि',
      decisionSupportDisclaimer: 'निर्णय समर्थन सूचना: यह प्रणाली केवल डेटा और गणितीय अनुमानों के आधार पर सुझाव देती है। स्थानीय परिस्थितियों के अनुसार अंतिम फैसला लेने का अधिकार पूरी तरह किसान का है।',
      whyHeader: 'प्रभावशाली कारकों का विश्लेषण (यह क्यों?)',
      weatherAdvisory: 'मौसम व नमी जोखिम विश्लेषण',
    },
  }[language];

  const rec = evaluation?.recommendation;
  const isWait = rec?.decision === 'WAIT';
  const sellNowVal = rec?.expectedSellNowValuePerQtl || evaluation?.currentPrice || 2000;
  const waitVal = rec?.expectedWaitValuePerQtl || sellNowVal;
  const netDiff = rec?.netGainLossPerQtl || (waitVal - sellNowVal);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-stone-200 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-stone-900 tracking-tight">
            {ui.decisionHeader}
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 mt-1 max-w-3xl">
            {ui.subtitle}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedCropId}
            onChange={(e) => setSelectedCropId(Number(e.target.value))}
            className="px-3 py-1.5 border border-stone-300 rounded-lg text-xs font-semibold text-stone-900 bg-white"
          >
            {crops.map((c) => (
              <option key={c.id} value={c.id}>
                {getCropName(c)} ({c.category})
              </option>
            ))}
          </select>
          <button
            onClick={() => loadEvaluation(selectedCropId)}
            className="p-1.5 border border-stone-300 rounded-lg bg-white hover:bg-stone-50 text-stone-700 cursor-pointer"
            title={t.common.refresh}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-xs text-stone-500 font-medium">
          {t.common.loading}
        </div>
      ) : error ? (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg">
          {error}
        </div>
      ) : evaluation && rec ? (
        <div className="space-y-6">
          {/* 1. Value Synthesis: Sell-Now Value vs Wait Value Hero Card */}
          <div
            className={`p-6 rounded-2xl border ${
              isWait
                ? 'bg-emerald-50/60 border-emerald-300 text-emerald-950'
                : 'bg-rose-50/60 border-rose-300 text-rose-950'
            }`}
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-3">
                {/* Decision Badge */}
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider ${
                      isWait ? 'bg-emerald-700 text-white' : 'bg-rose-600 text-white'
                    }`}
                  >
                    {isWait ? <ShieldCheck className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                    {isWait ? t.module4.decisionWait : t.module4.decisionSellNow}
                  </span>

                  <span className="text-xs font-mono font-semibold text-stone-600 bg-white/80 px-2 py-0.5 rounded border border-stone-200">
                    Confidence: {rec.confidenceScore}%
                  </span>

                  <span className="text-xs font-mono font-semibold text-stone-600 bg-white/80 px-2 py-0.5 rounded border border-stone-200">
                    Risk: {rec.riskScore}/100
                  </span>
                </div>

                {/* Main Heading */}
                <h3 className="text-xl sm:text-2xl font-black text-stone-900">
                  {isWait
                    ? `${t.module4.decisionWait}: Hold ${getCropName(evaluation.crop)} for ${rec.recommendedHoldingDays} days`
                    : `${t.module4.decisionSellNow}: Liquidate ${getCropName(evaluation.crop)} in current cycle`}
                </h3>

                {/* Substantive Rationale Text */}
                <p className="text-xs sm:text-sm text-stone-700 leading-relaxed max-w-3xl">
                  {getRationaleText()}
                </p>
              </div>

              {/* Numerical Comparison Grid */}
              <div className="shrink-0 grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-4 rounded-xl border border-stone-200 shadow-sm min-w-[280px]">
                {/* Sell Now Box */}
                <div className="p-3 bg-stone-50 rounded-lg border border-stone-200">
                  <span className="text-[11px] font-semibold text-stone-700 block mb-0.5">
                    {ui.sellNowValueLabel}
                  </span>
                  <div className="text-xl font-black font-mono text-stone-900">
                    ₹{Math.round(sellNowVal).toLocaleString('en-IN')}
                    <span className="text-xs font-normal text-stone-700"> / Qtl</span>
                  </div>
                  <span className="text-[10px] text-stone-700 block mt-1">
                    {ui.currentMandiValue}
                  </span>
                </div>

                {/* Wait Value Box */}
                <div
                  className={`p-3 rounded-lg border ${
                    isWait
                      ? 'bg-emerald-50/60 border-emerald-300 text-emerald-950'
                      : 'bg-stone-50 border-stone-200 text-stone-800'
                  }`}
                >
                  <span className="text-[11px] font-semibold block mb-0.5">
                    {ui.waitValueLabel}
                  </span>
                  <div className="text-xl font-black font-mono">
                    ₹{Math.round(waitVal).toLocaleString('en-IN')}
                    <span className="text-xs font-normal text-stone-700"> / Qtl</span>
                  </div>
                  <span className="text-[10px] text-stone-700 block mt-1">
                    Net variance:{' '}
                    <strong className={netDiff >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
                      {netDiff >= 0 ? `+₹${Math.round(netDiff)}` : `-₹${Math.round(Math.abs(netDiff))}`}
                    </strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Holding Cost Breakdown Bar */}
            <div className="mt-4 pt-3 border-t border-stone-200/60 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div>
                <span className="text-stone-700 block text-[11px]">{ui.holdingHorizon}:</span>
                <span className="font-bold text-stone-900 font-mono">
                  {rec.recommendedHoldingDays} {t.common.days}
                </span>
              </div>
              <div>
                <span className="text-stone-700 block text-[11px]">{ui.futureGrossProjection}:</span>
                <span className="font-bold text-stone-900 font-mono">
                  ₹{Math.round(rec.predictedFuturePricePerQtl || sellNowVal)}/Qtl
                </span>
              </div>
              <div>
                <span className="text-stone-700 block text-[11px]">{ui.storageCostTotal}:</span>
                <span className="font-bold text-stone-900 font-mono">
                  ₹{Math.round(rec.totalStorageCostPerQtl || 0)}/Qtl
                </span>
              </div>
              <div>
                <span className="text-stone-700 block text-[11px]">{ui.wastageDeduction}:</span>
                <span className="font-bold text-rose-700 font-mono">
                  -₹{Math.round(rec.totalWastageLossPerQtl || 0)}/Qtl ({rec.holdingDecayRiskPercent || 0}%)
                </span>
              </div>
            </div>
          </div>

          {/* 2. Open-Meteo Weather Card (Requirement 2 & 9) */}
          {evaluation.weather && (
            <div>
              <OpenMeteoWeatherCard
                weather={typeof evaluation.weather === 'object' && 'currentTemp' in evaluation.weather ? (evaluation.weather as WeatherData) : undefined}
                language={language}
                district={profile && 'district' in profile ? profile.district : 'Maharashtra'}
                latitude={(profile as any)?.latitude}
                longitude={(profile as any)?.longitude}
              />
            </div>
          )}

          {/* 3. Reusable Explain-Before-Recommend Engine Card (Requirement 7) */}
          {evaluation.explainable && (
            <div>
              <ExplainableRecommendationCard
                payload={evaluation.explainable}
                language={language}
                defaultExpanded={true}
              />
            </div>
          )}

          {/* 4. Practical Machine Learning Commodity Pipeline Card (Requirement 3 & 10) */}
          {evaluation.mlPipeline && (
            <div>
              <MLPredictionExplainerCard
                mlResult={evaluation.mlPipeline}
                language={language}
                cropName={getCropName(evaluation.crop)}
              />
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};
