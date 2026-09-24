import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { BuyerRequirement, BuyerBid, FarmerProduce, Transaction } from '../../types';
import {
  Building2,
  Plus,
  Scale,
  Handshake,
  Receipt,
  Sparkles,
  ArrowRight,
  Truck,
  CheckCircle2,
  MapPin,
  Package,
  Layers,
} from 'lucide-react';

interface BuyerDashboardProps {
  onNavigate: (tab: string, extra?: any) => void;
}

export const BuyerDashboard: React.FC<BuyerDashboardProps> = ({ onNavigate }) => {
  const { profile } = useAuth();
  const { t, getCropName, language } = useLanguage();

  const [reqs, setReqs] = useState<BuyerRequirement[]>([]);
  const [bids, setBids] = useState<BuyerBid[]>([]);
  const [matchedProduce, setMatchedProduce] = useState<FarmerProduce[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [r, b, m, tx] = await Promise.all([
          api.getBuyerRequirements({ my_requirements: true }).catch(() => []),
          api.getBids().catch(() => []),
          api.getMatchedProduceForBuyer().catch(() => []),
          api.getTransactions().catch(() => []),
        ]);
        setReqs(r);
        setBids(b);
        setMatchedProduce(m);
        setTransactions(tx);
      } catch (err) {
        console.error('Error loading buyer dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const totalVolumeProcured = transactions.reduce((sum, t) => sum + t.quantity_qtl, 0);

  const buyerBusiness = profile && 'business_name' in profile ? profile.business_name : 'Procurement Desk';
  const buyerLocation = profile && 'delivery_location' in profile ? profile.delivery_location : 'Maharashtra';
  const buyerType = profile && 'buyer_type' in profile ? profile.buyer_type : 'Institutional Buyer';

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
      {/* 1. BUYER HEADER HERO */}
      <div className="bg-[#173D32] text-white p-6 sm:p-8 rounded-3xl shadow-lg border border-[#173D32]/80 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/60 via-[#173D32] to-[#0F2821] pointer-events-none" />
        <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-[#D6A844]/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-[#F6F1E5] font-medium flex items-center gap-1.5 bg-black/30 backdrop-blur-xs px-3 py-1 rounded-full border border-white/15">
                <Building2 className="w-3.5 h-3.5 text-[#D6A844]" />
                <span className="font-bold text-[#D6A844]">{buyerType}</span>
              </span>
              <span className="text-xs text-stone-300 font-medium flex items-center gap-1.5 bg-emerald-900/60 backdrop-blur-xs px-3 py-1 rounded-full border border-emerald-500/30">
                <MapPin className="w-3.5 h-3.5 text-[#D6A844]" />
                <span>{buyerLocation}</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white font-serif">
              {getGreeting()}, {buyerBusiness}
            </h1>

            <p className="text-xs sm:text-sm text-stone-200/90 font-medium">
              {language === 'mr'
                ? 'शेतकऱ्यांकडून थेट दर्जेदार शेतमाल खरेदी आणि पारदर्शक व्यवहार व्यवस्थापन'
                : language === 'hi'
                ? 'किसानों से सीधी गुणवत्तापूर्ण फसल खरीद और पारदर्शी सौदा प्रबंधन'
                : 'Direct farm-gate sourcing, weighted lot matching & settlement desk'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('module5')}
              className="px-5 py-2.5 bg-[#D6A844] hover:bg-[#c2963b] active:scale-95 text-[#0F2821] font-extrabold text-xs rounded-xl shadow-md flex items-center gap-2 transition-all cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4 text-[#173D32]" />
              <span>{t.buyerDashboard.postRequirementButton}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. KPI STATS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => onNavigate('module5')}
          className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs hover:border-[#173D32] hover:shadow-md cursor-pointer transition-all flex flex-col justify-between"
        >
          <div className="text-[11px] font-bold text-stone-600 uppercase tracking-wider">
            {t.buyerDashboard.activeRequirements}
          </div>
          <div className="text-2xl sm:text-3xl font-black text-stone-900 mt-2 tabular-nums">
            {reqs.length}
          </div>
          <div className="text-[11px] text-[#173D32] font-bold mt-1">
            {language === 'mr' ? 'खरेदीची सक्रिय मागणी' : language === 'hi' ? 'सक्रिय खरीद मांग' : 'Open purchase mandates'}
          </div>
        </div>

        <div
          onClick={() => onNavigate('module5')}
          className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs hover:border-[#173D32] hover:shadow-md cursor-pointer transition-all flex flex-col justify-between"
        >
          <div className="text-[11px] font-bold text-stone-600 uppercase tracking-wider">
            {t.buyerDashboard.matchedProduceTitle}
          </div>
          <div className="text-2xl sm:text-3xl font-black text-stone-900 mt-2 tabular-nums">
            {matchedProduce.length} <span className="text-xs font-normal text-stone-500">{language === 'mr' || language === 'hi' ? 'लॉट' : 'Lots'}</span>
          </div>
          <div className="text-[11px] text-[#5A8F62] font-bold mt-1">
            {language === 'mr' ? 'उपलब्ध शेतमाल सूची' : language === 'hi' ? 'उपलब्ध फसल सूची' : 'Direct farmer listings ready'}
          </div>
        </div>

        <div
          onClick={() => onNavigate('module5')}
          className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs hover:border-[#173D32] hover:shadow-md cursor-pointer transition-all flex flex-col justify-between"
        >
          <div className="text-[11px] font-bold text-stone-600 uppercase tracking-wider">
            {t.buyerDashboard.myBidsTitle}
          </div>
          <div className="text-2xl sm:text-3xl font-black text-stone-900 mt-2 tabular-nums">
            {bids.length}
          </div>
          <div className="text-[11px] text-amber-700 font-bold mt-1">
            {bids.filter((b) => b.status === 'PENDING').length} {language === 'mr' ? 'प्रतीक्षेत' : language === 'hi' ? 'प्रतीक्षारत' : 'pending response'}
          </div>
        </div>

        <div
          onClick={() => onNavigate('transactions')}
          className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs hover:border-[#173D32] hover:shadow-md cursor-pointer transition-all flex flex-col justify-between"
        >
          <div className="text-[11px] font-bold text-stone-600 uppercase tracking-wider">
            {language === 'mr' ? 'एकूण खरेदी प्रमाण' : language === 'hi' ? 'कुल खरीद मात्रा' : 'Procured Volume'}
          </div>
          <div className="text-2xl sm:text-3xl font-black text-stone-900 mt-2 tabular-nums">
            {totalVolumeProcured} <span className="text-xs font-normal text-stone-500">{t.common.quintals}</span>
          </div>
          <div className="text-[11px] text-[#173D32] font-bold mt-1">
            {transactions.length} {language === 'mr' ? 'यशस्वी व्यवहार' : language === 'hi' ? 'सफल सौदे' : 'settled deals'}
          </div>
        </div>
      </div>

      {/* 3. MATCHING FARMER PRODUCE */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-stone-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-stone-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#173D32]" />
            <span>{t.buyerDashboard.matchedProduceTitle}</span>
          </h2>
          <button
            onClick={() => onNavigate('module5')}
            className="text-xs font-bold text-[#173D32] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>{language === 'mr' ? 'सर्व पाहा आणि बोली लावा' : language === 'hi' ? 'सभी देखें और बोली लगाएं' : 'View All & Place Bids'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {matchedProduce.length === 0 ? (
          <div className="py-10 text-center bg-[#FBF9F5] border border-stone-200 rounded-2xl text-xs text-stone-500">
            {language === 'mr' ? 'सध्या कोणतीही सक्रिय शेतमाल नोंदणी उपलब्ध नाही.' : language === 'hi' ? 'वर्तमान में कोई सक्रिय फसल सूची उपलब्ध नहीं है।' : 'No active farmer harvest listings right now.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {matchedProduce.slice(0, 3).map((p) => {
              const cropObj = {
                name_en: p.crop_name_en,
                name_mr: p.crop_name_mr,
                name_hi: p.crop_name_hi,
              };
              return (
                <div
                  key={p.id}
                  className="bg-[#FBF9F5] border border-stone-200 rounded-2xl p-4 space-y-3 hover:border-[#173D32] hover:bg-white hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-extrabold text-base text-stone-900">{p.variety}</div>
                        <div className="text-xs text-[#173D32] font-bold">
                          {getCropName(cropObj)}
                        </div>
                      </div>
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-[#173D32]">
                        {p.quality_grade}
                      </span>
                    </div>

                    <div className="mt-3 space-y-1.5 text-xs text-stone-600">
                      <div className="flex justify-between">
                        <span>{language === 'mr' ? 'प्रमाण:' : language === 'hi' ? 'मात्रा:' : 'Quantity:'}</span>
                        <strong className="text-stone-900 tabular-nums">
                          {p.quantity_qtl} {t.common.quintals}
                        </strong>
                      </div>
                      <div className="flex justify-between">
                        <span>{language === 'mr' ? 'अपेक्षित:' : language === 'hi' ? 'अपेक्षित:' : 'Expected:'}</span>
                        <strong className="text-[#173D32] font-black tabular-nums">
                          ₹{p.expected_price_per_qtl} / Qtl
                        </strong>
                      </div>
                      <div className="flex justify-between">
                        <span>{language === 'mr' ? 'पत्ता:' : language === 'hi' ? 'स्थान:' : 'Farm:'}</span>
                        <span className="text-stone-700 truncate max-w-[140px]">
                          {p.village}, {p.district}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => onNavigate('module5')}
                    className="w-full py-2 px-3 bg-[#173D32] hover:bg-[#0F2821] text-white font-extrabold text-xs rounded-xl transition-all shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Handshake className="w-3.5 h-3.5 text-[#D6A844]" />
                    <span>{language === 'mr' ? 'बोली लावा' : language === 'hi' ? 'बोली लगाएं' : 'Bid On Produce'}</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. ACTIVE PURCHASE REQUIREMENTS */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-stone-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-stone-900 flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#173D32]" />
            <span>{language === 'mr' ? 'तुमच्या सक्रिय खरेदी मागण्या' : language === 'hi' ? 'आपकी सक्रिय खरीद आवश्यकताएं' : 'Your Active Requirements'}</span>
          </h2>

          <button
            onClick={() => onNavigate('module5')}
            className="text-xs font-bold text-[#173D32] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>{language === 'mr' ? 'मागणी व्यवस्थापित करा' : 'Manage Requirements'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {reqs.length === 0 ? (
          <div className="py-10 text-center bg-[#FBF9F5] border border-stone-200 rounded-2xl text-xs text-stone-500">
            {language === 'mr' ? 'तुम्ही अजून कोणतीही मागणी नोंदवली नाही. वर "मागणी नोंदवा" वर क्लिक करा.' : language === 'hi' ? 'आपने अभी तक कोई मांग दर्ज नहीं की है। ऊपर "मांग दर्ज करें" पर क्लिक करें।' : "You haven't posted any requirements yet. Click \"Post Requirement\" above."}
          </div>
        ) : (
          <div className="border border-stone-200 rounded-2xl overflow-hidden shadow-2xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-stone-100/80 border-b border-stone-200 text-stone-700 font-bold">
                  <th className="py-3.5 px-4">{language === 'mr' ? 'पीक व जात' : language === 'hi' ? 'फसल व किस्म' : 'Crop & Variety'}</th>
                  <th className="py-3.5 px-4 text-right">{language === 'mr' ? 'किमान प्रमाण' : language === 'hi' ? 'न्यूनतम मात्रा' : 'Min Quantity'}</th>
                  <th className="py-3.5 px-4 text-right">{language === 'mr' ? 'कमाल खरेदी दर' : language === 'hi' ? 'अधिकतम खरीद दर' : 'Max Ceiling Rate'}</th>
                  <th className="py-3.5 px-4">{language === 'mr' ? 'वितरण पत्ता' : language === 'hi' ? 'वितरण स्थान' : 'Delivery Location'}</th>
                  <th className="py-3.5 px-4 text-center">{t.transactions.status}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {reqs.map((r) => (
                  <tr key={r.id} className="hover:bg-stone-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-extrabold text-stone-900">{r.crop_name_en}</div>
                      <div className="text-[11px] text-stone-500">{r.variety || 'Any Grade'}</div>
                    </td>
                    <td className="py-3.5 px-4 text-right tabular-nums font-bold text-stone-900">
                      {r.min_quantity_qtl} Qtl
                    </td>
                    <td className="py-3.5 px-4 text-right tabular-nums text-[#173D32] font-black">
                      ₹{r.max_price_per_qtl} / Qtl
                    </td>
                    <td className="py-3.5 px-4 text-stone-700">{r.delivery_location}</td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-[#173D32]">
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
