import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Crop, FarmerProduce, NetRealisationCalculation } from '../../types';
import { useLanguage } from '../../i18n/LanguageContext';
import { Scale, CheckCircle2, TrendingUp, Info, RefreshCw, AlertCircle, MapPin } from 'lucide-react';
import { ExplainableRecommendationCard } from '../common/ExplainableRecommendationCard';
import { LocationSelector } from '../common/LocationSelector';

interface Module2Props {
  initialCropId?: number;
}

export const Module2NetRealisation: React.FC<Module2Props> = ({ initialCropId }) => {
  const { profile } = useAuth();
  const { t, getCropName, language } = useLanguage();

  const [crops, setCrops] = useState<Crop[]>([]);
  const [farmerProduce, setFarmerProduce] = useState<FarmerProduce[]>([]);
  const [selectedCropId, setSelectedCropId] = useState<number>(initialCropId || 1);
  const [quantityQtl, setQuantityQtl] = useState<number>(45);
  const [isFpoPooled, setIsFpoPooled] = useState<boolean>(false);
  const [originDistrict, setOriginDistrict] = useState<string>('');
  const [originTaluka, setOriginTaluka] = useState<string>('');
  const [originVillage, setOriginVillage] = useState<string>('');
  const [originLat, setOriginLat] = useState<number | undefined>(undefined);
  const [originLon, setOriginLon] = useState<number | undefined>(undefined);
  const [calculation, setCalculation] = useState<NetRealisationCalculation | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (profile && 'district' in profile) {
      if (profile.district) setOriginDistrict(profile.district);
      if ((profile as any).taluka) setOriginTaluka((profile as any).taluka);
      if ((profile as any).village) setOriginVillage((profile as any).village);
      if ((profile as any).latitude) setOriginLat((profile as any).latitude);
      if ((profile as any).longitude) setOriginLon((profile as any).longitude);
    }
  }, [profile]);

  useEffect(() => {
    async function init() {
      try {
        const [cList, pList] = await Promise.all([
          api.getCrops(),
          api.getFarmerProduce().catch(() => []),
        ]);
        setCrops(cList);
        setFarmerProduce(pList);
        if (initialCropId) {
          setSelectedCropId(initialCropId);
        } else if (cList.length > 0) {
          setSelectedCropId(cList[0].id);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setInitialLoading(false);
      }
    }
    init();
  }, [initialCropId]);

  const handleRunCalculation = async (dist?: string, lat?: number, lon?: number) => {
    if (!selectedCropId || !quantityQtl || quantityQtl <= 0) return;
    setLoading(true);
    setError(null);
    try {
      const targetDist = dist !== undefined ? dist : originDistrict;
      const targetLat = lat !== undefined ? lat : originLat;
      const targetLon = lon !== undefined ? lon : originLon;
      const data = await api.calculateNetRealisation(
        selectedCropId,
        quantityQtl,
        isFpoPooled,
        targetDist,
        targetLat,
        targetLon
      );
      setCalculation(data);
    } catch (err: any) {
      setError(err.message || t.common.error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCropId && !initialLoading) {
      handleRunCalculation();
    }
  }, [selectedCropId, isFpoPooled, initialLoading, originDistrict]);

  const handleSelectFarmerProduce = (p: FarmerProduce) => {
    setSelectedCropId(p.crop_id);
    setQuantityQtl(p.quantity_qtl);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-stone-200 pb-4">
        <h2 className="text-xl font-extrabold text-stone-900 tracking-tight">
          {t.module2.title}
        </h2>
        <p className="text-xs sm:text-sm text-stone-600 mt-1">
          {t.module2.subtitle}
        </p>
      </div>

      {/* Educational Callout */}
      <div className="bg-amber-50 border-l-4 border-amber-500 p-3.5 rounded-r-lg text-xs text-amber-900 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <p className="leading-relaxed">{t.module2.explanation}</p>
      </div>

      {/* Input Selection Box */}
      <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-2xs space-y-4">
        {/* Quick select from farmer's active produce */}
        {farmerProduce.length > 0 && (
          <div>
            <div className="text-xs font-bold text-stone-700 mb-2">
              {t.module2.selectProduceToAnalyze}:
            </div>
            <div className="flex flex-wrap gap-2">
              {farmerProduce.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelectFarmerProduce(p)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold border text-left transition-colors ${
                    selectedCropId === p.crop_id && quantityQtl === p.quantity_qtl
                      ? 'border-emerald-700 bg-emerald-50 text-emerald-900'
                      : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  <span className="font-bold">{p.variety}</span> ({p.quantity_qtl} {t.common.quintals})
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Origin Farm Location */}
        <div>
          <label className="block text-xs font-bold text-stone-700 mb-1.5 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-emerald-700" />
            <span>{t.module2.originVillage}:</span>
          </label>
          <LocationSelector
            valueDistrict={originDistrict}
            valueTaluka={originTaluka}
            valueVillage={originVillage}
            valueLat={originLat}
            valueLon={originLon}
            onChange={(loc) => {
              setOriginDistrict(loc.district);
              if (loc.taluka) setOriginTaluka(loc.taluka);
              if (loc.village) setOriginVillage(loc.village);
              setOriginLat(loc.latitude);
              setOriginLon(loc.longitude);
              handleRunCalculation(loc.district, loc.latitude, loc.longitude);
            }}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              {t.module2.crop}
            </label>
            <select
              value={selectedCropId}
              onChange={(e) => setSelectedCropId(Number(e.target.value))}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs text-stone-900 bg-white"
            >
              {crops.map((c) => (
                <option key={c.id} value={c.id}>
                  {getCropName(c)} ({c.category})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              {t.module2.quantity}
            </label>
            <input
              type="number"
              min="1"
              step="1"
              value={quantityQtl}
              onChange={(e) => setQuantityQtl(Math.max(1, parseFloat(e.target.value) || 1))}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs text-stone-900 tabular-nums"
            />
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-stone-800 select-none">
              <input
                type="checkbox"
                checked={isFpoPooled}
                onChange={(e) => setIsFpoPooled(e.target.checked)}
                className="w-4 h-4 text-emerald-700 rounded border-stone-300 focus:ring-emerald-700"
              />
              <span>{t.module3.transportDiscount} (FPO Pool -28%)</span>
            </label>
            <button
              onClick={() => handleRunCalculation()}
              disabled={loading}
              className="py-2 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg shadow-sm transition-colors flex items-center gap-1.5 ml-auto"
            >
              <Scale className="w-4 h-4" />
              <span>{loading ? t.common.loading : t.module2.runCalculator}</span>
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Calculation Results */}
      {calculation && calculation.rankings.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-stone-900">
              {t.module2.resultsTitle} ({calculation.quantityQtl} {t.common.quintals}{' '}
              {getCropName(calculation.crop)})
            </h3>
            {isFpoPooled && (
              <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                FPO Logistics Discount Applied (-28%)
              </span>
            )}
          </div>

          {/* Top Recommendation Summary Card */}
          {calculation.rankings[0] && (
            <div className="bg-emerald-800 text-white p-4 rounded-xl shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <div className="text-[11px] font-bold text-emerald-200 uppercase tracking-wider">
                  ★ {t.module2.bestNetBadge}
                </div>
                <div className="text-lg font-extrabold mt-0.5">
                  {calculation.rankings[0].marketName} ({calculation.rankings[0].district})
                </div>
                <p className="text-xs text-emerald-100 mt-1 max-w-2xl">
                  {language === 'mr'
                    ? calculation.rankings[0].recommendationNoteMr
                    : language === 'hi'
                    ? calculation.rankings[0].recommendationNoteHi
                    : calculation.rankings[0].recommendationNoteEn}
                </p>
              </div>
              <div className="text-right shrink-0 bg-emerald-900/60 p-3 rounded-lg border border-emerald-700">
                <div className="text-xs text-emerald-200 font-semibold">{t.module2.netRealisation}</div>
                <div className="text-2xl font-black tabular-nums">
                  ₹{calculation.rankings[0].netRealisationPerQtl.toLocaleString('en-IN')}
                  <span className="text-xs font-normal"> / Qtl</span>
                </div>
                <div className="text-[11px] text-emerald-300 font-medium mt-0.5">
                  Total: ₹{calculation.rankings[0].totalNetRevenue.toLocaleString('en-IN')}
                </div>
              </div>
            </div>
          )}

          {/* Detailed Itemized Deduction Table */}
          <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-stone-100 border-b border-stone-200 text-stone-700 font-bold">
                    <th className="py-3 px-3 text-center w-12">{t.module2.rank}</th>
                    <th className="py-3 px-3">{t.module1.mandiName}</th>
                    <th className="py-3 px-3 text-right">{t.module1.distance}</th>
                    <th className="py-3 px-3 text-right text-stone-900 font-extrabold">{t.module2.grossPrice}</th>
                    <th className="py-3 px-3 text-right text-rose-700 font-medium">(-) {t.module2.transportCost}</th>
                    <th className="py-3 px-3 text-right text-rose-700 font-medium">(-) {t.module2.loadingCost}</th>
                    <th className="py-3 px-3 text-right text-rose-700 font-medium">(-) {t.module2.cessCommission}</th>
                    <th className="py-3 px-3 text-right text-rose-700 font-medium">(-) {t.module2.transitLoss}</th>
                    <th className="py-3 px-4 text-right bg-emerald-50/70 text-emerald-950 font-black">{t.module2.netRealisation}</th>
                    <th className="py-3 px-3 text-right font-bold">{t.module2.totalNetEarning}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {calculation.rankings.map((r, idx) => (
                    <tr
                      key={r.marketId ? `ranking-mkt-${r.marketId}` : `ranking-idx-${idx}`}
                      className={`hover:bg-stone-50 transition-colors ${
                        r.isBestMarket ? 'bg-emerald-50/30 font-semibold' : ''
                      }`}
                    >
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-bold ${
                            idx === 0
                              ? 'bg-emerald-700 text-white'
                              : 'bg-stone-200 text-stone-700'
                          }`}
                        >
                          {idx + 1}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-stone-900 flex items-center gap-1.5">
                          <span>{r.marketName}</span>
                          {r.isBestMarket && (
                            <span className="text-[10px] text-emerald-800 bg-emerald-100 font-bold px-1.5 py-0.2 rounded">
                              {language === 'mr' ? '★ सर्वोत्तम' : language === 'hi' ? '★ सर्वश्रेष्ठ' : '★ BEST'}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-stone-700">{r.district}</div>
                      </td>
                      <td className="py-3 px-3 text-right tabular-nums text-stone-600">
                        {r.distanceKm} km
                      </td>
                      <td className="py-3 px-3 text-right tabular-nums font-bold text-stone-900">
                        ₹{r.grossPricePerQtl}
                      </td>
                      <td className="py-3 px-3 text-right tabular-nums text-rose-700">
                        ₹{r.transportCostPerQtl}
                      </td>
                      <td className="py-3 px-3 text-right tabular-nums text-rose-700">
                        ₹{r.loadingHandlingPerQtl}
                      </td>
                      <td className="py-3 px-3 text-right tabular-nums text-rose-700">
                        ₹{r.cessAndCommissionPerQtl}
                      </td>
                      <td className="py-3 px-3 text-right tabular-nums text-rose-700">
                        ₹{r.transitLossPerQtl}
                      </td>
                      <td className="py-3 px-4 text-right tabular-nums font-black text-sm bg-emerald-50/70 text-emerald-900">
                        ₹{r.netRealisationPerQtl.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3 text-right tabular-nums font-bold text-stone-900">
                        ₹{r.totalNetRevenue.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Explainable Recommendation Engine (Requirement 6 & 7) */}
          {calculation.explainable && (
            <div className="pt-2">
              <ExplainableRecommendationCard
                payload={calculation.explainable}
                language={language}
                defaultExpanded={false}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
