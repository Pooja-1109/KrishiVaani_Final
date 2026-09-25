import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { FPOLot, FPOLotContribution, FarmerProduce, Crop } from '../../types';
import { useLanguage } from '../../i18n/LanguageContext';
import { Users, Plus, Truck, ArrowRight, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

interface Module3Props {
  onAnalyzeLotInNetCalculator?: (cropId: number) => void;
}

export const Module3FPOAggregation: React.FC<Module3Props> = ({ onAnalyzeLotInNetCalculator }) => {
  const { t, getCropName, language } = useLanguage();

  const [lots, setLots] = useState<FPOLot[]>([]);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [myProduce, setMyProduce] = useState<FarmerProduce[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Contribute Modal state
  const [contributeLot, setContributeLot] = useState<FPOLot | null>(null);
  const [selectedProduceId, setSelectedProduceId] = useState<number | null>(null);
  const [contributeQty, setContributeQty] = useState<number>(10);
  const [contributing, setContributing] = useState(false);

  // Create Lot Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newLotName, setNewLotName] = useState('');
  const [newLotCropId, setNewLotCropId] = useState<number>(1);
  const [newLotTarget, setNewLotTarget] = useState<number>(200);
  const [newLotCenter, setNewLotCenter] = useState('');
  const [creatingLot, setCreatingLot] = useState(false);

  // Lot contributors drawer state
  const [activeMembersLotId, setActiveMembersLotId] = useState<number | null>(null);
  const [lotMembers, setLotMembers] = useState<FPOLotContribution[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [lotsData, cropsData, produceData] = await Promise.all([
        api.getFpoLots(),
        api.getCrops(),
        api.getFarmerProduce().catch(() => []),
      ]);
      setLots(lotsData);
      setCrops(cropsData);
      setMyProduce(produceData);
      if (cropsData.length > 0) {
        setNewLotCropId(cropsData[0].id);
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

  const handleOpenContributeModal = (lot: FPOLot) => {
    setContributeLot(lot);
    // Find matching produce
    const match = myProduce.find((p) => p.crop_id === lot.crop_id && p.status === 'AVAILABLE');
    if (match) {
      setSelectedProduceId(match.id);
      setContributeQty(Math.min(match.quantity_qtl, 20));
    } else {
      setSelectedProduceId(null);
    }
  };

  const handleSubmitContribution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contributeLot || !selectedProduceId || contributeQty <= 0) return;

    setContributing(true);
    setError(null);
    try {
      await api.contributeToFpoLot(contributeLot.id, selectedProduceId, contributeQty);
      setContributeLot(null);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Contribution failed');
    } finally {
      setContributing(false);
    }
  };

  const handleCreateLot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLotName || !newLotCropId || newLotTarget <= 0 || !newLotCenter) return;

    setCreatingLot(true);
    setError(null);
    try {
      await api.createFpoLot({
        name: newLotName,
        crop_id: newLotCropId,
        target_quantity_qtl: newLotTarget,
        collection_center: newLotCenter,
      });
      setShowCreateModal(false);
      setNewLotName('');
      setNewLotCenter('');
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Lot creation failed');
    } finally {
      setCreatingLot(false);
    }
  };

  const handleViewMembers = async (lotId: number) => {
    setActiveMembersLotId(lotId);
    setLoadingMembers(true);
    try {
      const members = await api.getFpoMembers(lotId);
      setLotMembers(members);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoadingMembers(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-stone-200 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-stone-900 tracking-tight">
            {t.module3.title}
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 mt-1">
            {t.module3.subtitle}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>{t.module3.createLotButton}</span>
          </button>
          <button
            onClick={loadData}
            className="p-2 border border-stone-300 rounded-lg bg-white hover:bg-stone-50 text-stone-700"
            title={t.common.refresh}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Value Proposition Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
          <div className="p-2 bg-emerald-700 text-white rounded-lg">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-emerald-900 uppercase">
              {language === 'mr' ? '२८% वाहतूक खर्च बचत' : language === 'hi' ? '२८% परिवहन लागत में बचत' : '28% Freight Savings'}
            </div>
            <p className="text-xs text-emerald-800 mt-0.5">
              {language === 'mr'
                ? '१५०-३०० क्विंटल शेतमाल एकत्र करून मोठ्या ट्रकमधून पाठवल्यास प्रति क्विंटल ₹९० पर्यंत वाहतूक खर्चात बचत होते.'
                : language === 'hi'
                ? '१५०-३०० क्विंटल फसल बड़े ट्रक में सामूहिक परिवहन से भेजने पर प्रति क्विंटल ₹९० तक बचत होती है।'
                : 'By pooling 150-300 quintals into full 10-wheel truckloads, individual smallholders save up to ₹90/Qtl in transport costs.'}
            </p>
          </div>
        </div>

        <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 flex items-start gap-3">
          <div className="p-2 bg-stone-800 text-white rounded-lg">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-stone-900 uppercase">
              {language === 'mr' ? 'शेतकरी-केंद्रित साठा संकलन' : language === 'hi' ? 'किसान-केंद्रित सामूहिक लॉट' : 'Farmer-Centric Pooling'}
            </div>
            <p className="text-xs text-stone-700 mt-0.5">
              {language === 'mr'
                ? 'शेतकऱ्यांची स्वतःची स्वतंत्र मालकी कायम राहते आणि विक्रीनंतर त्यांच्या क्विंटलच्या प्रमाणात थेट नफा विभागला जातो.'
                : language === 'hi'
                ? 'किसान का अपनी उपज पर पूर्ण स्वामित्व रहता है और बिक्री के बाद योगदान की गई मात्रा के अनुपात में भुगतान मिलता है।'
                : 'Farmers retain individual ownership and share final auction profits proportional to their contributed quintals.'}
            </p>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <div className="p-2 bg-amber-700 text-white rounded-lg">
            <ArrowRight className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-amber-900 uppercase">
              {language === 'mr' ? 'मोठ्या खरेदीदारांना थेट पुरवठा' : language === 'hi' ? 'बड़े संस्थागत खरीदारों तक सीधी पहुंच' : 'Institutional Buyer Access'}
            </div>
            <p className="text-xs text-amber-800 mt-0.5">
              {language === 'mr'
                ? 'मोठ्या अन्न प्रक्रिया उद्योगांना किमान २०० क्विंटलचा लॉट लागतो. सामूहिक साठ्यामुळे लहान शेतकरीही थेट विक्री करू शकतात.'
                : language === 'hi'
                ? 'खाद्य प्रसंस्करण इकाइयों को न्यूनतम २०० क्विंटल की आवश्यकता होती है। सामूहिक लॉट से छोटे किसान भी सीधे आपूर्ति कर पाते हैं।'
                : 'Large food processors require min 200 Qtl batches. FPO aggregation enables direct supply.'}
            </p>
          </div>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Lots Grid */}
      {loading ? (
        <div className="py-12 text-center text-xs text-stone-500">{t.common.loading}</div>
      ) : lots.length === 0 ? (
        <div className="py-12 text-center bg-white rounded-xl border border-stone-200">
          <p className="text-sm font-semibold text-stone-700">{t.common.noData}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {lots.map((lot) => {
            const cropObj = {
              name_en: lot.crop_name_en,
              name_mr: lot.crop_name_mr,
              name_hi: lot.crop_name_hi,
            };
            const percentFilled = Math.min(
              100,
              Math.round((lot.current_quantity_qtl / lot.target_quantity_qtl) * 100)
            );

            return (
              <div
                key={lot.id ? `fpo-lot-${lot.id}` : `fpo-lot-${lot.name}`}
                className="bg-white border border-stone-200 rounded-xl p-5 shadow-2xs hover:border-emerald-500 transition-colors flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-sm text-stone-900">{lot.name}</h3>
                      <div className="text-xs text-emerald-800 font-semibold mt-0.5">
                        {getCropName(cropObj)}
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                        lot.status === 'READY_FOR_SALE'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {lot.status === 'READY_FOR_SALE' ? t.module3.lotStatusReady : t.module3.lotStatusOpen}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-4">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-stone-600 font-medium">
                        {t.module3.currentQuantity}:{' '}
                        <strong className="text-stone-900 tabular-nums">
                          {lot.current_quantity_qtl} {t.common.quintals}
                        </strong>
                      </span>
                      <span className="text-stone-600 font-medium">
                        {t.module3.targetQuantity}:{' '}
                        <strong className="text-stone-900 tabular-nums">
                          {lot.target_quantity_qtl} {t.common.quintals}
                        </strong>
                      </span>
                    </div>
                    <div className="w-full bg-stone-100 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-emerald-700 h-2.5 rounded-full transition-all duration-500"
                        style={{ width: `${percentFilled}%` }}
                      ></div>
                    </div>
                    <div className="text-right text-[10px] font-bold text-stone-700 mt-1">
                      {percentFilled}% aggregated ({lot.contributor_count || 0} farmers)
                    </div>
                  </div>

                  <div className="mt-3 text-xs text-stone-600 bg-stone-50 p-2 rounded-md">
                    <span className="font-semibold text-stone-700">Hub:</span>{' '}
                    {lot.collection_center}
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleViewMembers(lot.id)}
                    className="text-xs font-semibold text-stone-600 hover:text-stone-900 underline"
                  >
                    {t.module3.viewContributors} ({lot.contributor_count || 0})
                  </button>

                  <div className="flex items-center gap-2">
                    {onAnalyzeLotInNetCalculator && (
                      <button
                        onClick={() => onAnalyzeLotInNetCalculator(lot.crop_id)}
                        className="px-2.5 py-1 text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-md transition-colors"
                      >
                        Net Calc
                      </button>
                    )}

                    <button
                      onClick={() => handleOpenContributeModal(lot)}
                      className="px-3 py-1.5 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-md transition-colors shadow-2xs"
                    >
                      {t.module3.contributeButton}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CONTRIBUTE MODAL */}
      {contributeLot && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h3 className="text-sm font-bold text-stone-900">
                {t.module3.contributeButton}: {contributeLot.name}
              </h3>
              <button
                onClick={() => setContributeLot(null)}
                className="text-stone-400 hover:text-stone-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitContribution} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Select Your Harvested Produce Lot
                </label>
                {myProduce.filter((p) => p.crop_id === contributeLot.crop_id && p.status === 'AVAILABLE').length === 0 ? (
                  <div className="p-3 bg-amber-50 text-amber-900 text-xs rounded-md">
                    You do not have any available produce matching this crop. Please add produce in your Farmer Dashboard first.
                  </div>
                ) : (
                  <select
                    value={selectedProduceId || ''}
                    onChange={(e) => setSelectedProduceId(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-stone-300 rounded-md text-xs text-stone-900 bg-white"
                  >
                    {myProduce
                      .filter((p) => p.crop_id === contributeLot.crop_id && p.status === 'AVAILABLE')
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.variety} — Available: {p.quantity_qtl} Qtl (Harvested: {p.harvest_date})
                        </option>
                      ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Quantity to Pool ({t.common.quintals})
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={contributeQty}
                  onChange={(e) => setContributeQty(parseFloat(e.target.value) || 1)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-md text-xs text-stone-900 tabular-nums"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setContributeLot(null)}
                  className="px-3 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-md"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  disabled={contributing || !selectedProduceId}
                  className="px-4 py-2 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-md disabled:opacity-50"
                >
                  {contributing ? t.common.saving : 'Confirm Aggregation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE LOT MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h3 className="text-sm font-bold text-stone-900">{t.module3.createLotButton}</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-stone-400 hover:text-stone-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateLot} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">{t.module3.lotName} *</label>
                <input
                  type="text"
                  required
                  placeholder="Cluster Summer Produce Pool"
                  value={newLotName}
                  onChange={(e) => setNewLotName(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-md text-xs text-stone-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">{t.module2.crop} *</label>
                <select
                  value={newLotCropId}
                  onChange={(e) => setNewLotCropId(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-stone-300 rounded-md text-xs text-stone-900 bg-white"
                >
                  {crops.map((c) => (
                    <option key={c.id} value={c.id}>
                      {getCropName(c)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  {t.module3.targetQuantity} ({t.common.quintals}) *
                </label>
                <input
                  type="number"
                  min="50"
                  step="10"
                  required
                  value={newLotTarget}
                  onChange={(e) => setNewLotTarget(parseFloat(e.target.value) || 100)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-md text-xs text-stone-900 tabular-nums"
                />
                <span className="text-[10px] text-stone-700">
                  Recommended: 200+ Qtl
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  {t.module3.collectionCenter} *
                </label>
                <input
                  type="text"
                  required
                  placeholder="APMC Sub-Yard / Cluster Center"
                  value={newLotCenter}
                  onChange={(e) => setNewLotCenter(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-md text-xs text-stone-900"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-md"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  disabled={creatingLot}
                  className="px-4 py-2 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-md disabled:opacity-50"
                >
                  {creatingLot ? t.common.saving : t.module3.createLotButton}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LOT CONTRIBUTORS DRAWER */}
      {activeMembersLotId && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h3 className="text-sm font-bold text-stone-900">
                {t.module3.contributorsTitle}
              </h3>
              <button
                onClick={() => setActiveMembersLotId(null)}
                className="text-stone-400 hover:text-stone-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto flex-1 divide-y divide-stone-100 text-xs">
              {loadingMembers ? (
                <div className="py-8 text-center text-stone-500">{t.common.loading}</div>
              ) : lotMembers.length === 0 ? (
                <div className="py-8 text-center text-stone-500">No farmers have contributed yet.</div>
              ) : (
                lotMembers.map((m) => (
                  <div key={m.id ? `fpo-member-${m.id}` : `fpo-member-${m.farmer_id}-${m.quantity_qtl}`} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-stone-900">{m.farmer_name}</div>
                      <div className="text-[11px] text-stone-700">
                        {m.village} • {m.mobile}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-extrabold text-emerald-800 tabular-nums text-sm">
                        {m.quantity_qtl} Qtl
                      </span>
                      <span className="text-[10px] text-stone-700 block">
                        {new Date(m.contribution_date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 border-t border-stone-200 text-right">
              <button
                onClick={() => setActiveMembersLotId(null)}
                className="px-4 py-1.5 text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-md"
              >
                {t.common.close}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
