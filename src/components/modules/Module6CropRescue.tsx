import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { RescueOption, RescuePlan, FarmerProduce, ExplainablePayload } from '../../types';
import { useLanguage } from '../../i18n/LanguageContext';
import { ShieldAlert, Phone, Clock, Warehouse, AlertCircle, RefreshCw, CheckCircle2, SplitSquareVertical, ArrowRight } from 'lucide-react';
import { ExplainableRecommendationCard } from '../common/ExplainableRecommendationCard';

export const Module6CropRescue: React.FC = () => {
  const { t, language } = useLanguage();

  const [options, setOptions] = useState<RescueOption[]>([]);
  const [plans, setPlans] = useState<RescuePlan[]>([]);
  const [myProduce, setMyProduce] = useState<FarmerProduce[]>([]);
  const [recommendationPlan, setRecommendationPlan] = useState<ExplainablePayload | null>(null);
  const [planProduce, setPlanProduce] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Request Rescue Modal
  const [selectedOption, setSelectedOption] = useState<RescueOption | null>(null);
  const [selectedProduceId, setSelectedProduceId] = useState<number | null>(null);
  const [rescueReason, setRescueReason] = useState<string>('Unseasonal rainfall / spoilage risk');
  const [rescueQty, setRescueQty] = useState<number>(25);
  const [submitting, setSubmitting] = useState(false);

  const loadData = async (targetProduceId?: number) => {
    setLoading(true);
    setError(null);
    try {
      const [opts, reqPlans, prod, planRes] = await Promise.all([
        api.getRescueOptions(),
        api.getRescueRequests().catch(() => []),
        api.getFarmerProduce().catch(() => []),
        api.getRescueRecommendationPlan(targetProduceId).catch(() => null),
      ]);
      setOptions(opts);
      setPlans(reqPlans);
      setMyProduce(prod);
      if (planRes) {
        setRecommendationPlan(planRes.explainable);
        setPlanProduce(planRes.produce);
        if (!selectedProduceId && planRes.produce?.id) {
          setSelectedProduceId(planRes.produce.id);
        }
      }
    } catch (err: any) {
      setError(err.message || t.common.error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenRescueModal = (opt: RescueOption) => {
    setSelectedOption(opt);
    const avail = myProduce.find((p) => p.status === 'AVAILABLE') || myProduce[0];
    if (avail) {
      setSelectedProduceId(avail.id);
      setRescueQty(avail.quantity_qtl);
    } else {
      setSelectedProduceId(null);
    }
  };

  const handleRescueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOption || !selectedProduceId || rescueQty <= 0) return;

    setSubmitting(true);
    setError(null);
    try {
      await api.createRescueRequest({
        produce_id: selectedProduceId,
        rescue_option_id: selectedOption.id,
        reason: rescueReason,
        quantity_qtl: rescueQty,
      });
      setSelectedOption(null);
      await loadData(selectedProduceId);
    } catch (err: any) {
      setError(err.message || 'Failed to submit rescue request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-stone-200 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-stone-900 tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-700" />
            <span>{t.module6.title}</span>
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 mt-1">
            {t.module6.subtitle}
          </p>
        </div>

        <button
          onClick={() => loadData()}
          className="p-2 border border-stone-300 rounded-lg bg-white hover:bg-stone-50 text-stone-700 self-start sm:self-auto"
          title={t.common.refresh}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Emergency Notice */}
      <div className="bg-rose-50 border-l-4 border-rose-600 p-4 rounded-r-xl text-xs text-rose-950 space-y-1">
        <div className="font-bold flex items-center gap-1.5 text-rose-900">
          <ShieldAlert className="w-4 h-4 text-rose-700" />
          <span>
            {language === 'mr'
              ? 'आपत्कालीन खरेदी आणि शीतगृह संरक्षण'
              : language === 'hi'
              ? 'आपातकालीन उठान और शीत भंडारण सुरक्षा'
              : 'Emergency Liquidation & Cold Chain Safeguard'}
          </span>
        </div>
        <p className="leading-relaxed text-rose-800">
          {language === 'mr'
            ? 'अवेळी मुसळधार पाऊस किंवा बाजारात भाव कोसळल्यामुळे मोठे नुकसान होण्याचा धोका असल्यास, KrishiVaani तुम्हाला थेट स्थानिक टोमॅटो प्युरी, निर्जलीकरण केंद्रे आणि २४ तासांत हमीभाव खरेदी देणाऱ्या शीतगृहांशी जोडते.'
            : language === 'hi'
            ? 'अचानक बारिश या भारी आवक से मंडी भाव गिरने पर नुकसान से बचने के लिए, KrishiVaani आपको सीधे स्थानीय प्यूरी फैक्ट्रियों, डिहाइड्रेशन इकाइयों और २४ घंटे में न्यूनतम खरीद दर देने वाले कोल्ड स्टोरेज से जोड़ती है।'
            : 'When severe storms or market gluts threaten total harvest loss, KrishiVaani connects you directly to verified local tomato puree factories, dehydration centers, and emergency cold storages offering guaranteed minimum rescue floor rates with 24h pickup.'}
        </p>
      </div>

      {/* Explain-Before-Recommend Crop Rescue Plan */}
      {recommendationPlan && (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <SplitSquareVertical className="w-4 h-4 text-rose-700" />
              <h3 className="text-sm font-bold text-stone-900">
                {language === 'mr'
                  ? 'डेटा-आधारित पीक बचाव आणि साठवणूक धोरण'
                  : language === 'hi'
                  ? 'डेटा-संचालित फसल बचाव एवं भंडारण रणनीति'
                  : 'Data-Driven Rescue & Preservation Strategy'}
              </h3>
            </div>
            {myProduce.length > 0 && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-stone-500 font-medium">
                  {language === 'mr' ? 'शेतमाल निवडा:' : language === 'hi' ? 'फसल चुनें:' : 'Evaluate Produce:'}
                </span>
                <select
                  value={selectedProduceId || ''}
                  onChange={(e) => {
                    const pid = Number(e.target.value);
                    setSelectedProduceId(pid);
                    loadData(pid);
                  }}
                  className="text-xs px-2.5 py-1 border border-stone-300 rounded bg-white font-semibold text-stone-800"
                >
                  {myProduce.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.variety} ({p.quantity_qtl} Qtl)
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <ExplainableRecommendationCard
            payload={recommendationPlan}
            language={language}
            defaultExpanded={true}
          />
        </div>
      )}

      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Available Verified Facilities */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-stone-900">
          {t.module6.availableFacilities}
        </h3>

        {loading ? (
          <div className="py-12 text-center text-xs text-stone-500">{t.common.loading}</div>
        ) : options.length === 0 ? (
          <div className="py-8 text-center bg-white border border-stone-200 rounded-xl text-xs text-stone-500">
            No rescue facilities available at this moment.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {options.map((opt) => (
              <div
                key={opt.id ? `rescue-opt-${opt.id}` : `rescue-opt-${opt.facility_name}`}
                className="bg-white border border-stone-200 rounded-xl p-4 shadow-2xs space-y-3 hover:border-rose-400 transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-extrabold text-sm text-stone-900">
                        {opt.facility_name}
                      </h4>
                      <div className="text-[11px] text-stone-700 font-semibold">
                        {opt.facility_type.replace('_', ' ')} • {opt.district}
                      </div>
                    </div>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      {opt.status}
                    </span>
                  </div>

                  <div className="mt-3 space-y-1.5 text-xs text-stone-700 bg-stone-50 p-2.5 rounded-lg">
                    <div className="flex justify-between">
                      <span className="text-stone-700">Guaranteed Floor Rate:</span>
                      <strong className="text-emerald-800 tabular-nums">
                        ₹{opt.price_offered_per_qtl} / Qtl
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-700">Available Capacity:</span>
                      <strong className="text-stone-900 tabular-nums">
                        {opt.capacity_qtl} Qtl
                      </strong>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-stone-700">Emergency Pickup:</span>
                      <span className="font-semibold text-rose-700 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Within {opt.turnaround_hours} Hours
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-1 border-t border-stone-200">
                      <span className="text-stone-700">Helpline:</span>
                      <span className="font-bold text-stone-900 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-emerald-700" />
                        {opt.contact_phone}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleOpenRescueModal(opt)}
                  className="w-full py-2 px-3 bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs rounded-lg transition-colors shadow-2xs flex items-center justify-center gap-1.5"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>{t.module6.initiateRescue}</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* History of Farmer's Rescue Requests */}
      <div className="space-y-3 pt-4">
        <h3 className="text-sm font-bold text-stone-900">
          Active Emergency Rescue Dispatch Plans
        </h3>

        {plans.length === 0 ? (
          <div className="py-8 text-center bg-white border border-stone-200 rounded-xl text-xs text-stone-500">
            No emergency rescue requests initiated.
          </div>
        ) : (
          <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-2xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-stone-100 border-b border-stone-200 text-stone-700 font-bold">
                  <th className="py-3 px-4">Produce Variety</th>
                  <th className="py-3 px-4">Rescue Facility</th>
                  <th className="py-3 px-4">Reason</th>
                  <th className="py-3 px-4 text-right">Quantity</th>
                  <th className="py-3 px-4 text-right">Agreed Floor Rate</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {plans.map((p) => (
                  <tr key={p.id ? `rescue-plan-${p.id}` : `rescue-plan-${p.produce_id}-${p.rescue_option_id}`} className="hover:bg-stone-50">
                    <td className="py-3 px-4 font-bold text-stone-900">{p.variety || 'Tomato'}</td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-stone-900">{p.facility_name}</div>
                      <div className="text-[10px] text-stone-700">{p.contact_phone}</div>
                    </td>
                    <td className="py-3 px-4 text-stone-700">{p.reason}</td>
                    <td className="py-3 px-4 text-right tabular-nums font-bold text-stone-900">
                      {p.quantity_qtl} Qtl
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums font-bold text-emerald-800">
                      ₹{p.agreed_price_per_qtl} / Qtl
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* RESCUE SUBMIT MODAL */}
      {selectedOption && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h3 className="text-sm font-bold text-stone-900">
                Initiate Emergency Dispatch: {selectedOption.facility_name}
              </h3>
              <button
                onClick={() => setSelectedOption(null)}
                className="text-stone-400 hover:text-stone-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRescueSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Select Distressed Harvest Produce Lot *
                </label>
                {myProduce.length === 0 ? (
                  <div className="p-3 bg-rose-50 text-rose-900 text-xs rounded-md">
                    No active harvested produce available. Please add produce in Farmer Dashboard first.
                  </div>
                ) : (
                  <select
                    value={selectedProduceId || ''}
                    onChange={(e) => setSelectedProduceId(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-stone-300 rounded-md text-xs text-stone-900 bg-white"
                  >
                    {myProduce.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.variety} — {p.quantity_qtl} Qtl (Harvested: {p.harvest_date})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Distress Emergency Reason *
                </label>
                <select
                  value={rescueReason}
                  onChange={(e) => setRescueReason(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-md text-xs text-stone-900 bg-white"
                >
                  <option value="Unseasonal rainfall / spoilage risk">
                    Unseasonal rainfall / acute spoilage risk
                  </option>
                  <option value="Hailstorm physical crop damage">
                    Hailstorm physical crop damage
                  </option>
                  <option value="APMC market crash below harvesting cost">
                    APMC market crash below harvesting cost
                  </option>
                  <option value="Transport strike or Mandi closure">
                    Transport strike or Mandi closure
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Quantity for Emergency Processing (Quintals) *
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  required
                  value={rescueQty}
                  onChange={(e) => setRescueQty(parseFloat(e.target.value) || 1)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-md text-xs text-stone-900 tabular-nums"
                />
              </div>

              <div className="bg-stone-50 p-3 rounded-lg text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-stone-700">Floor Rate Offered:</span>
                  <span className="font-bold text-stone-900">
                    ₹{selectedOption.price_offered_per_qtl} / Qtl
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-700">Guaranteed Pickup:</span>
                  <span className="font-bold text-stone-900">
                    Within {selectedOption.turnaround_hours} Hours
                  </span>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedOption(null)}
                  className="px-3 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-md"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  disabled={submitting || !selectedProduceId}
                  className="px-4 py-2 text-xs font-bold bg-rose-700 hover:bg-rose-800 text-white rounded-md disabled:opacity-50"
                >
                  {submitting ? t.common.saving : 'Dispatch Rescue Vehicle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
