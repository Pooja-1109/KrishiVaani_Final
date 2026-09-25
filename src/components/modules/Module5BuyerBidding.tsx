import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import {
  FarmerProduce,
  BuyerBid,
  BuyerRequirement,
  Crop,
  FPOLot,
  Transaction,
} from '../../types';
import {
  Handshake,
  Plus,
  CheckCircle,
  XCircle,
  Truck,
  RefreshCw,
  AlertCircle,
  Calendar,
  MapPin,
  Sparkles,
  Search,
  Scale,
  ArrowRight,
  TrendingUp,
  FileCheck2,
  Lock,
  Edit2,
  Clock,
  ShieldCheck,
  Tag,
  Package,
  Layers,
  ChevronRight,
  Check,
  Info,
  SlidersHorizontal,
} from 'lucide-react';

interface Module5Props {
  initialView?: 'requirements' | 'produce' | 'bids' | 'matching';
  onNavigate?: (tab: string, extra?: any) => void;
}

export const Module5BuyerBidding: React.FC<Module5Props> = ({ initialView, onNavigate }) => {
  const { user, profile } = useAuth();
  const { t, getCropName, language } = useLanguage();

  const matchingLabels = {
    en: {
      weightedScoringModel: 'Transparent Weighted Scoring Model',
      hideWeights: 'Hide Weight Controls',
      configureWeights: 'Configure Weights (Transparent Contribution)',
      cropCompatibility: 'Crop Compatibility',
      quantityFit: 'Quantity Fit',
      qualityFit: 'Quality Grade Fit',
      priceCompatibility: 'Price Compatibility',
      distanceLocation: 'Distance & Location',
      deliveryDateWindow: 'Delivery Date Window',
      weightedContribution: 'Weighted Score Contribution',
      formulaNote: 'Formula: Σ (Raw Score × Weight)',
      activeContext: 'Active Matching Context',
      switchMandate: 'Switch mandate:',
      withinBudget: 'Within Budget',
      aboveTarget: 'Above Target',
      feasible: 'Feasible',
      pts: 'pts',
      totalFound: 'Compatible Produce & FPO Lots Found',
      matchingScoreNote: 'Matching Score = sum of weighted contributions',
    },
    mr: {
      weightedScoringModel: 'पारदर्शक गुणांकन पद्धती',
      hideWeights: 'गुणांकन नियंत्रण लपवा',
      configureWeights: 'गुणांकन टक्केवारी बदला (पारदर्शक पद्धत)',
      cropCompatibility: 'पीक जुळणी',
      quantityFit: 'प्रमाण पूर्तता',
      qualityFit: 'दर्जा व प्रतवारी',
      priceCompatibility: 'दर सुसंगतता',
      distanceLocation: 'अंतर व वाहतूक',
      deliveryDateWindow: 'वितरण कालावधी',
      weightedContribution: 'गुणांकनानुसार घटकांचे योगदान',
      formulaNote: 'सूत्र: Σ (प्राप्त गुण × टक्केवारी)',
      activeContext: 'सध्याची जुळणी मागणी',
      switchMandate: 'मागणी बदला:',
      withinBudget: 'अपेक्षित दरात',
      aboveTarget: 'दरापेक्षा जास्त',
      feasible: 'व्यवहार्य',
      pts: 'गुण',
      totalFound: 'सुसंगत शेतमाल व एफपीओ लॉट सापडले',
      matchingScoreNote: 'जुळणी गुण = सर्व घटकांच्या गुणांची बेरीज',
    },
    hi: {
      weightedScoringModel: 'पारदर्शी वेटेज स्कोरिंग मॉडल',
      hideWeights: 'वेटेज नियंत्रण छिपाएं',
      configureWeights: 'वेटेज प्रतिशत बदलें (पारदर्शी व्यवस्था)',
      cropCompatibility: 'फसल मिलान',
      quantityFit: 'मात्रा पूर्ति',
      qualityFit: 'गुणवत्ता ग्रेड',
      priceCompatibility: 'मूल्य अनुकूलता',
      distanceLocation: 'दूरी व स्थान',
      deliveryDateWindow: 'वितरण अवधि',
      weightedContribution: 'वेटेज अनुसार घटकों का योगदान',
      formulaNote: 'सूत्र: Σ (प्राप्त स्कोर × वेटेज)',
      activeContext: 'सक्रिय मिलान मांग',
      switchMandate: 'मांग बदलें:',
      withinBudget: 'बजट के भीतर',
      aboveTarget: 'लक्ष्य से अधिक',
      feasible: 'व्यावहारिक',
      pts: 'अंक',
      totalFound: 'अनुकूल फसल एवं एफपीओ लॉट मिले',
      matchingScoreNote: 'मिलान स्कोर = सभी घटकों के अंकों का योग',
    },
  }[language];

  const isFarmer = user?.role === 'FARMER';
  const isBuyer = user?.role === 'BUYER';
  const isAdmin = user?.role === 'ADMIN';

  // Navigation tab within Module 5
  const [activeTab, setActiveTab] = useState<'requirements' | 'matching' | 'bids' | 'farmerProduce'>(
    isFarmer ? 'bids' : initialView === 'produce' ? 'matching' : initialView === 'bids' ? 'bids' : 'requirements'
  );

  const [crops, setCrops] = useState<Crop[]>([]);
  const [bids, setBids] = useState<BuyerBid[]>([]);
  const [farmerProduce, setFarmerProduce] = useState<FarmerProduce[]>([]);
  const [buyerReqs, setBuyerReqs] = useState<BuyerRequirement[]>([]);
  const [farmerMatchedReqs, setFarmerMatchedReqs] = useState<any[]>([]);

  // Selected Requirement for Matching inspection
  const [selectedReqForMatching, setSelectedReqForMatching] = useState<BuyerRequirement | null>(null);
  const [produceMatches, setProduceMatches] = useState<any[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(false);

  // Configurable transparent scoring weights (Requirement 5)
  const [matchingWeights, setMatchingWeights] = useState({
    cropWeight: 25,
    quantityWeight: 20,
    qualityWeight: 15,
    priceWeight: 15,
    locationWeight: 15,
    deliveryDateWeight: 10,
  });
  const [showWeightConfig, setShowWeightConfig] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Post Buyer Requirement Modal
  const [showAddReq, setShowAddReq] = useState(false);
  const [reqCropId, setReqCropId] = useState<number>(1);
  const [reqVariety, setReqVariety] = useState('');
  const [reqQty, setReqQty] = useState<number>(50);
  const [reqQuality, setReqQuality] = useState('Grade A');
  const [reqLocation, setReqLocation] = useState(
    profile && 'delivery_location' in profile ? profile.delivery_location : 'Distribution Hub'
  );
  const [reqDeliveryDate, setReqDeliveryDate] = useState(
    new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0]
  );
  const [reqPrice, setReqPrice] = useState<number>(3200);
  const [reqPaymentTerms, setReqPaymentTerms] = useState(
    '100% on Quality Verification & Delivery Acceptance'
  );
  const [reqBuyerType, setReqBuyerType] = useState(
    profile && 'buyer_type' in profile ? profile.buyer_type : 'Wholesaler / Trader'
  );
  const [reqPackaging, setReqPackaging] = useState('50kg Jute Gunny Bags');
  const [reqNotes, setReqNotes] = useState('');
  const [reqLogistics, setReqLogistics] = useState<'BUYER_PICKUP' | 'FARMER_DELIVERY'>('BUYER_PICKUP');
  const [formValidationErrors, setFormValidationErrors] = useState<{ [key: string]: string }>({});
  const [submittingReq, setSubmittingReq] = useState(false);

  // Submit Bid Modal (for Buyer)
  const [showBidModal, setShowBidModal] = useState(false);
  const [targetProduceForBid, setTargetProduceForBid] = useState<any | null>(null);
  const [bidPrice, setBidPrice] = useState<number>(3200);
  const [bidQty, setBidQty] = useState<number>(40);
  const [bidPickupDate, setBidPickupDate] = useState(
    new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0]
  );
  const [bidPaymentTerms, setBidPaymentTerms] = useState('Immediate RTGS post Quality Inspection');
  const [bidValidity, setBidValidity] = useState(
    new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0]
  );
  const [bidNotes, setBidNotes] = useState('');
  const [editingBidId, setEditingBidId] = useState<number | null>(null);
  const [submittingBid, setSubmittingBid] = useState(false);

  // Add Farmer Produce Modal
  const [showAddProduce, setShowAddProduce] = useState(false);
  const [prodCropId, setProdCropId] = useState<number>(1);
  const [prodVariety, setProdVariety] = useState('');
  const [prodQty, setProdQty] = useState<number>(45);
  const [prodHarvest, setProdHarvest] = useState(new Date().toISOString().split('T')[0]);
  const [prodGrade, setProdGrade] = useState('Grade A');
  const [prodPrice, setProdPrice] = useState<number>(3100);
  const [prodVillage, setProdVillage] = useState(
    profile && 'village' in profile ? profile.village : ''
  );
  const [submittingProduce, setSubmittingProduce] = useState(false);

  // Counter Bid Modal (for Farmer)
  const [counterBid, setCounterBid] = useState<BuyerBid | null>(null);
  const [counterPrice, setCounterPrice] = useState<number>(0);
  const [submittingCounter, setSubmittingCounter] = useState(false);

  // Module 2 Evaluation Modal
  const [evaluatingBid, setEvaluatingBid] = useState<any | null>(null);
  const [module2Result, setModule2Result] = useState<any | null>(null);
  const [loadingModule2, setLoadingModule2] = useState(false);

  const loadAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [cropsList, bidsList] = await Promise.all([
        api.getCrops(),
        api.getBids().catch(() => []),
      ]);
      setCrops(cropsList);
      setBids(bidsList);

      if (isFarmer) {
        const [prod, matchedReqs] = await Promise.all([
          api.getFarmerProduce().catch(() => []),
          api.getFarmerMatchedRequirements().catch(() => []),
        ]);
        setFarmerProduce(prod);
        setFarmerMatchedReqs(matchedReqs);
      } else if (isBuyer) {
        const reqs = await api.getBuyerRequirements().catch(() => []);
        setBuyerReqs(reqs);

        // Auto-select first requirement if available and none selected
        if (reqs.length > 0 && !selectedReqForMatching) {
          setSelectedReqForMatching(reqs[0]);
          loadMatchesForRequirement(reqs[0].id);
        }
      }
    } catch (err: any) {
      setError(err.message || t.common.error);
    } finally {
      setLoading(false);
    }
  };

  const loadMatchesForRequirement = async (reqId: number, weightsToUse = matchingWeights) => {
    setLoadingMatches(true);
    try {
      const matches = await api.getProduceForRequirement(reqId, weightsToUse);
      setProduceMatches(matches);
    } catch (err: any) {
      console.error('Failed to load matches:', err);
    } finally {
      setLoadingMatches(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [user]);

  // Validation function for Buyer Requirement Form
  const validateRequirementForm = () => {
    const errs: { [key: string]: string } = {};
    if (!reqCropId) errs.crop = 'Please select a crop.';
    if (!reqQty || reqQty <= 0) errs.qty = 'Quantity must be greater than 0 Quintals.';
    if (!reqQuality.trim()) errs.quality = 'Quality grade is required.';
    if (!reqLocation.trim()) errs.location = 'Delivery location / warehouse destination is required.';
    if (!reqDeliveryDate) errs.deliveryDate = 'Required delivery date is mandatory.';
    if (!reqPrice || reqPrice <= 0) errs.price = 'Target price must be greater than 0 ₹/Qtl.';
    if (!reqPaymentTerms.trim()) errs.paymentTerms = 'Payment terms must be specified.';
    if (!reqBuyerType.trim()) errs.buyerType = 'Buyer type is required.';

    setFormValidationErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCreateRequirementSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateRequirementForm()) return;

    setSubmittingReq(true);
    setError(null);
    try {
      const newReq = await api.createBuyerRequirement({
        crop_id: reqCropId,
        variety: reqVariety.trim() || undefined,
        min_quantity_qtl: Number(reqQty),
        max_price_per_qtl: Number(reqPrice),
        quality_grade: reqQuality,
        delivery_location: reqLocation.trim(),
        delivery_date: reqDeliveryDate,
        payment_terms: reqPaymentTerms.trim(),
        buyer_type: reqBuyerType.trim(),
        packaging_preference: reqPackaging,
        additional_notes: reqNotes.trim() || undefined,
        pickup_delivery_preference: reqLogistics,
      });

      setShowAddReq(false);
      setSuccessMsg('Buyer purchase requirement posted and indexed for matching!');
      setTimeout(() => setSuccessMsg(null), 4000);

      // Refresh and switch to matching
      await loadAllData();
      setSelectedReqForMatching(newReq);
      setActiveTab('matching');
      await loadMatchesForRequirement(newReq.id);
    } catch (err: any) {
      setError(err.message || 'Failed to create requirement');
    } finally {
      setSubmittingReq(false);
    }
  };

  const openBidSubmissionModal = (produceOrLot: any, isEditBid: boolean = false, existingBid?: BuyerBid) => {
    setTargetProduceForBid(produceOrLot);
    if (isEditBid && existingBid) {
      setEditingBidId(existingBid.id);
      setBidPrice(existingBid.bid_price_per_qtl);
      setBidQty(existingBid.quantity_qtl);
      setBidPickupDate(existingBid.proposed_pickup_date);
      setBidPaymentTerms(existingBid.payment_terms || 'Immediate RTGS post Quality Inspection');
      setBidValidity(existingBid.validity_date || new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0]);
      setBidNotes(existingBid.notes || '');
    } else {
      setEditingBidId(null);
      setBidPrice(produceOrLot.expected_price_per_qtl || 3200);
      setBidQty(produceOrLot.quantity_qtl || 40);
      setBidPickupDate(new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0]);
      setBidPaymentTerms('Immediate RTGS post Quality Inspection');
      setBidValidity(new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0]);
      setBidNotes('');
    }
    setShowBidModal(true);
  };

  const handleBidSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetProduceForBid && !editingBidId) return;
    setSubmittingBid(true);
    setError(null);

    try {
      if (editingBidId) {
        await api.updateBid(editingBidId, {
          bid_price_per_qtl: bidPrice,
          quantity_qtl: bidQty,
          proposed_pickup_date: bidPickupDate,
          payment_terms: bidPaymentTerms,
          validity_date: bidValidity,
          notes: bidNotes,
        });
        setSuccessMsg('Bid updated successfully!');
      } else {
        await api.createBid({
          requirement_id: selectedReqForMatching?.id || undefined,
          produce_id: targetProduceForBid?.produce_id || targetProduceForBid?.id || undefined,
          lot_id: targetProduceForBid?.lot_id || undefined,
          bid_price_per_qtl: bidPrice,
          quantity_qtl: bidQty,
          proposed_pickup_date: bidPickupDate,
          payment_terms: bidPaymentTerms,
          validity_date: bidValidity,
          notes: bidNotes,
        });
        setSuccessMsg('Direct bid submitted to farmer! Persisted in database.');
      }

      setShowBidModal(false);
      setEditingBidId(null);
      setTimeout(() => setSuccessMsg(null), 4000);
      await loadAllData();
      setActiveTab('bids');
    } catch (err: any) {
      setError(err.message || 'Failed to submit bid');
    } finally {
      setSubmittingBid(false);
    }
  };

  const handleCloseBidding = async (bidId: number) => {
    try {
      await api.closeBid(bidId);
      setSuccessMsg('Bidding closed. Final offer locked for contract evaluation!');
      setTimeout(() => setSuccessMsg(null), 4000);
      await loadAllData();
    } catch (err: any) {
      setError(err.message || 'Failed to close bidding');
    }
  };

  const handleEvaluateModule2 = async (bid: BuyerBid) => {
    setEvaluatingBid(bid);
    setLoadingModule2(true);
    try {
      const evaluation = await api.sendBidToModule2(bid.id);
      setModule2Result(evaluation);
    } catch (err: any) {
      setError(err.message || 'Failed to evaluate bid in Net Realisation Calculator');
    } finally {
      setLoadingModule2(false);
    }
  };

  const handleAcceptBidAndCreateTx = async (bidId: number) => {
    try {
      const tx = await api.createTransactionFromBid(bidId);
      setSuccessMsg(`Offer accepted! Order created with Ref: ${tx.transaction_ref}. Moving to Transactions...`);
      setTimeout(() => {
        setSuccessMsg(null);
        if (onNavigate) onNavigate('transactions');
      }, 1500);
      await loadAllData();
    } catch (err: any) {
      setError(err.message || 'Failed to accept bid');
    }
  };

  const handleFarmerAddProduceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingProduce(true);
    setError(null);
    try {
      await api.createFarmerProduce({
        crop_id: prodCropId,
        variety: prodVariety.trim() || undefined,
        quantity_qtl: prodQty,
        harvest_date: prodHarvest,
        quality_grade: prodGrade,
        expected_price_per_qtl: prodPrice,
        village: prodVillage.trim() || (profile && 'village' in profile ? profile.village : 'Local Farm'),
        district: profile && 'district' in profile ? profile.district : 'Maharashtra',
      });
      setShowAddProduce(false);
      setSuccessMsg('Produce lot listed successfully!');
      setTimeout(() => setSuccessMsg(null), 4000);
      await loadAllData();
    } catch (err: any) {
      setError(err.message || 'Failed to add produce');
    } finally {
      setSubmittingProduce(false);
    }
  };

  const handleCounterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!counterBid || counterPrice <= 0) return;
    setSubmittingCounter(true);
    try {
      await api.respondToBid(counterBid.id, 'COUNTER', counterPrice);
      setCounterBid(null);
      setSuccessMsg(`Counter offer of ₹${counterPrice}/Qtl transmitted to buyer!`);
      setTimeout(() => setSuccessMsg(null), 4000);
      await loadAllData();
    } catch (err: any) {
      setError(err.message || 'Failed to send counter offer');
    } finally {
      setSubmittingCounter(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="border-b border-stone-200 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-stone-900 tracking-tight flex items-center gap-2">
            <Handshake className="w-5 h-5 text-emerald-700" />
            <span>{t.module5.title}</span>
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 mt-1">
            {t.module5.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isBuyer && (
            <button
              onClick={() => setShowAddReq(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>{t.module5.postRequirement}</span>
            </button>
          )}

          {isFarmer && (
            <button
              onClick={() => setShowAddProduce(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>{t.farmerDashboard.addProduceButton}</span>
            </button>
          )}

          <button
            onClick={loadAllData}
            className="p-2 border border-stone-300 rounded-lg bg-white hover:bg-stone-50 text-stone-700"
            title={t.common.refresh}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs rounded-lg flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-700 shrink-0" />
          <span className="font-semibold">{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-900 text-xs rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-stone-200 text-xs font-bold gap-2">
        {isBuyer && (
          <>
            <button
              onClick={() => setActiveTab('requirements')}
              className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === 'requirements'
                  ? 'border-emerald-700 text-emerald-900 font-black'
                  : 'border-transparent text-stone-600 hover:text-stone-900'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>{t.module5.myRequirements} ({buyerReqs.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('matching')}
              className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === 'matching'
                  ? 'border-emerald-700 text-emerald-900 font-black'
                  : 'border-transparent text-stone-600 hover:text-stone-900'
              }`}
            >
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>{t.module5.matchingTab}</span>
            </button>

            <button
              onClick={() => setActiveTab('bids')}
              className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === 'bids'
                  ? 'border-emerald-700 text-emerald-900 font-black'
                  : 'border-transparent text-stone-600 hover:text-stone-900'
              }`}
            >
              <Tag className="w-4 h-4" />
              <span>{t.module5.biddingDesk} ({bids.length})</span>
            </button>
          </>
        )}

        {isFarmer && (
          <>
            <button
              onClick={() => setActiveTab('bids')}
              className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === 'bids'
                  ? 'border-emerald-700 text-emerald-900 font-black'
                  : 'border-transparent text-stone-600 hover:text-stone-900'
              }`}
            >
              <Tag className="w-4 h-4" />
              <span>{t.module5.bidsReceived} ({bids.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('matching')}
              className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === 'matching'
                  ? 'border-emerald-700 text-emerald-900 font-black'
                  : 'border-transparent text-stone-600 hover:text-stone-900'
              }`}
            >
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>{t.module5.farmerMatchingTab} ({farmerMatchedReqs.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('farmerProduce')}
              className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === 'farmerProduce'
                  ? 'border-emerald-700 text-emerald-900 font-black'
                  : 'border-transparent text-stone-600 hover:text-stone-900'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>My Listed Produce ({farmerProduce.length})</span>
            </button>
          </>
        )}
      </div>

      {/* -------------------- TAB 1: BUYER PURCHASE MANDATES -------------------- */}
      {isBuyer && activeTab === 'requirements' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-stone-900">
              Active Procurement Requirements
            </h3>
            <span className="text-xs text-stone-500">
              Select a requirement to compute transparent compatible farmer lots
            </span>
          </div>

          {buyerReqs.length === 0 ? (
            <div className="py-12 text-center bg-white border border-stone-200 rounded-xl p-6 space-y-3">
              <Package className="w-8 h-8 text-stone-400 mx-auto" />
              <div className="font-bold text-stone-800">No active purchase requirements yet.</div>
              <p className="max-w-md mx-auto text-xs text-stone-500">
                Post your procurement requirements specifying crop, required volume, grade, price, and delivery location to find matching farmer harvests.
              </p>
              <button
                onClick={() => setShowAddReq(true)}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg shadow-sm transition-colors"
              >
                Post First Requirement
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {buyerReqs.map((req) => {
                const isSelected = selectedReqForMatching?.id === req.id;
                return (
                  <div
                    key={req.id}
                    className={`bg-white border rounded-xl p-4 shadow-2xs space-y-3 transition-all ${
                      isSelected ? 'border-emerald-600 ring-2 ring-emerald-500/20' : 'border-stone-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm text-stone-900">
                            {req.crop_name_en} {req.variety ? `(${req.variety})` : ''}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-900">
                            {req.quality_grade || 'Grade A'}
                          </span>
                        </div>
                        <div className="text-xs text-stone-500 mt-0.5 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-stone-400" />
                          <span>{req.delivery_location}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] font-bold text-stone-500 uppercase">Target Ceiling</span>
                        <div className="text-sm font-black text-emerald-800 tabular-nums">
                          ₹{req.max_price_per_qtl} / Qtl
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs bg-stone-50 p-2.5 rounded-lg border border-stone-200">
                      <div>
                        <span className="text-[10px] text-stone-500 uppercase font-bold">Required Volume</span>
                        <div className="font-bold text-stone-900 tabular-nums">
                          {req.min_quantity_qtl} {t.common.quintals}
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] text-stone-500 uppercase font-bold">Target Date</span>
                        <div className="font-bold text-stone-900">
                          {req.delivery_date ? new Date(req.delivery_date).toLocaleDateString() : 'Immediate'}
                        </div>
                      </div>
                      <div className="col-span-2">
                        <span className="text-[10px] text-stone-500 uppercase font-bold">Payment & Logistics</span>
                        <div className="text-[11px] text-stone-700">
                          {req.payment_terms || 'Immediate on Inspection'} • {req.pickup_delivery_preference || 'Buyer Pickup'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-stone-100">
                      <span className="text-[10px] text-stone-500">
                        Posted on {req.created_at ? new Date(req.created_at).toLocaleDateString() : 'Active'}
                      </span>

                      <button
                        onClick={() => {
                          setSelectedReqForMatching(req);
                          setActiveTab('matching');
                          loadMatchesForRequirement(req.id);
                        }}
                        className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg shadow-sm transition-colors flex items-center gap-1"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Find Matching Harvests</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* -------------------- TAB 2: TRANSPARENT MATCHING ENGINE (BUYER VIEW) -------------------- */}
      {isBuyer && activeTab === 'matching' && (
        <div className="space-y-4">
          {/* Requirement Selector / Switcher */}
          <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                  Active Matching Context
                </span>
                <div className="font-extrabold text-sm text-stone-900 mt-0.5">
                  {selectedReqForMatching ? (
                    <>
                      {selectedReqForMatching.crop_name_en} • Required: {selectedReqForMatching.min_quantity_qtl} Qtl @ ₹{selectedReqForMatching.max_price_per_qtl}/Qtl (Dest: {selectedReqForMatching.delivery_location})
                    </>
                  ) : (
                    'No Requirement Selected'
                  )}
                </div>
              </div>

              {buyerReqs.length > 1 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-stone-500">Switch mandate:</span>
                  <select
                    value={selectedReqForMatching?.id || ''}
                    onChange={(e) => {
                      const found = buyerReqs.find((r) => r.id === Number(e.target.value));
                      if (found) {
                        setSelectedReqForMatching(found);
                        loadMatchesForRequirement(found.id);
                      }
                    }}
                    className="text-xs px-2.5 py-1.5 border border-stone-300 rounded-lg bg-white font-medium"
                  >
                    {buyerReqs.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.crop_name_en} ({r.min_quantity_qtl} Qtl)
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Configurable Transparent Weighted Scoring Panel (Requirement 5) */}
          <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-emerald-700" />
                <span className="text-xs font-bold uppercase tracking-wider text-stone-700">
                  {matchingLabels.weightedScoringModel}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowWeightConfig(!showWeightConfig)}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 cursor-pointer"
              >
                {showWeightConfig ? matchingLabels.hideWeights : matchingLabels.configureWeights}
              </button>
            </div>

            {/* Configurable Weight Sliders */}
            {showWeightConfig ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-3 rounded-lg border border-stone-200">
                <div>
                  <div className="flex justify-between text-[11px] font-semibold text-stone-700 mb-1">
                    <span>{matchingLabels.cropCompatibility}</span>
                    <span className="font-mono">{matchingWeights.cropWeight}%</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="50"
                    value={matchingWeights.cropWeight}
                    onChange={(e) => {
                      const next = { ...matchingWeights, cropWeight: Number(e.target.value) };
                      setMatchingWeights(next);
                      if (selectedReqForMatching) loadMatchesForRequirement(selectedReqForMatching.id, next);
                    }}
                    className="w-full accent-emerald-600 h-1.5 bg-stone-200 rounded-lg cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] font-semibold text-stone-700 mb-1">
                    <span>{matchingLabels.quantityFit}</span>
                    <span className="font-mono">{matchingWeights.quantityWeight}%</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="50"
                    value={matchingWeights.quantityWeight}
                    onChange={(e) => {
                      const next = { ...matchingWeights, quantityWeight: Number(e.target.value) };
                      setMatchingWeights(next);
                      if (selectedReqForMatching) loadMatchesForRequirement(selectedReqForMatching.id, next);
                    }}
                    className="w-full accent-emerald-600 h-1.5 bg-stone-200 rounded-lg cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] font-semibold text-stone-700 mb-1">
                    <span>{matchingLabels.qualityFit}</span>
                    <span className="font-mono">{matchingWeights.qualityWeight}%</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="40"
                    value={matchingWeights.qualityWeight}
                    onChange={(e) => {
                      const next = { ...matchingWeights, qualityWeight: Number(e.target.value) };
                      setMatchingWeights(next);
                      if (selectedReqForMatching) loadMatchesForRequirement(selectedReqForMatching.id, next);
                    }}
                    className="w-full accent-emerald-600 h-1.5 bg-stone-200 rounded-lg cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] font-semibold text-stone-700 mb-1">
                    <span>{matchingLabels.priceCompatibility}</span>
                    <span className="font-mono">{matchingWeights.priceWeight}%</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="40"
                    value={matchingWeights.priceWeight}
                    onChange={(e) => {
                      const next = { ...matchingWeights, priceWeight: Number(e.target.value) };
                      setMatchingWeights(next);
                      if (selectedReqForMatching) loadMatchesForRequirement(selectedReqForMatching.id, next);
                    }}
                    className="w-full accent-emerald-600 h-1.5 bg-stone-200 rounded-lg cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] font-semibold text-stone-700 mb-1">
                    <span>{matchingLabels.distanceLocation}</span>
                    <span className="font-mono">{matchingWeights.locationWeight}%</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="40"
                    value={matchingWeights.locationWeight}
                    onChange={(e) => {
                      const next = { ...matchingWeights, locationWeight: Number(e.target.value) };
                      setMatchingWeights(next);
                      if (selectedReqForMatching) loadMatchesForRequirement(selectedReqForMatching.id, next);
                    }}
                    className="w-full accent-emerald-600 h-1.5 bg-stone-200 rounded-lg cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] font-semibold text-stone-700 mb-1">
                    <span>{matchingLabels.deliveryDateWindow}</span>
                    <span className="font-mono">{matchingWeights.deliveryDateWeight}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="30"
                    value={matchingWeights.deliveryDateWeight}
                    onChange={(e) => {
                      const next = { ...matchingWeights, deliveryDateWeight: Number(e.target.value) };
                      setMatchingWeights(next);
                      if (selectedReqForMatching) loadMatchesForRequirement(selectedReqForMatching.id, next);
                    }}
                    className="w-full accent-emerald-600 h-1.5 bg-stone-200 rounded-lg cursor-pointer"
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2 text-[11px] text-stone-600">
                <span className="bg-white px-2 py-1 rounded border border-stone-200 font-medium">
                  {matchingLabels.cropCompatibility}: <strong>{matchingWeights.cropWeight}%</strong>
                </span>
                <span className="bg-white px-2 py-1 rounded border border-stone-200 font-medium">
                  {matchingLabels.quantityFit}: <strong>{matchingWeights.quantityWeight}%</strong>
                </span>
                <span className="bg-white px-2 py-1 rounded border border-stone-200 font-medium">
                  {matchingLabels.qualityFit}: <strong>{matchingWeights.qualityWeight}%</strong>
                </span>
                <span className="bg-white px-2 py-1 rounded border border-stone-200 font-medium">
                  {matchingLabels.priceCompatibility}: <strong>{matchingWeights.priceWeight}%</strong>
                </span>
                <span className="bg-white px-2 py-1 rounded border border-stone-200 font-medium">
                  {matchingLabels.distanceLocation}: <strong>{matchingWeights.locationWeight}%</strong>
                </span>
                <span className="bg-white px-2 py-1 rounded border border-stone-200 font-medium">
                  {matchingLabels.deliveryDateWindow}: <strong>{matchingWeights.deliveryDateWeight}%</strong>
                </span>
              </div>
            )}
          </div>

          {/* Matches List */}
          {loadingMatches ? (
            <div className="py-12 text-center text-xs text-stone-500">{t.common.loading}</div>
          ) : produceMatches.length === 0 ? (
            <div className="py-12 text-center bg-white border border-stone-200 rounded-xl p-6 space-y-3">
              <Sparkles className="w-8 h-8 text-stone-400 mx-auto" />
              <div className="font-bold text-stone-800">No matching produce lots found currently.</div>
              <p className="max-w-md mx-auto text-xs text-stone-500">
                Our matching algorithm scans registered farmer harvests and FPO aggregation lots. You will receive an instant notification when a farmer adds a compatible lot.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-xs font-bold text-stone-700 flex items-center justify-between">
                <span>{produceMatches.length} {matchingLabels.totalFound}</span>
                <span className="text-[10px] text-stone-500">{matchingLabels.matchingScoreNote}</span>
              </div>

              {produceMatches.map((m: any, idx: number) => {
                const isFpo = m.type === 'FPO_LOT' || !!m.lot_id || m.itemType === 'FPO_LOT';
                const score = m.matchScore || m.score || 85;
                const pItem = m.produce || m.lot || m;
                const weightsUsed = m.weightsUsed || matchingWeights;
                const explainable = m.explainable;
                const reasons = m.reasons || [
                  `Exact Crop Match: ${pItem.crop_name_en}`,
                  `Quantity: ${pItem.quantity_qtl || pItem.current_quantity_qtl} Qtl compatible with requested ${selectedReqForMatching?.min_quantity_qtl || 50} Qtl`,
                  `Quality: ${pItem.quality_grade || 'Grade A'} matches required standard`,
                  `Feasible logistics: Farmgate pickup in ${pItem.village || pItem.collection_center || pItem.district || 'Maharashtra'}`,
                ];

                return (
                  <div
                    key={m.id ? `prod-match-${m.id}` : pItem.id ? `prod-item-${isFpo ? 'fpo' : 'farmer'}-${pItem.id}` : `prod-match-${idx}`}
                    className="bg-white border border-stone-200 rounded-xl p-4 sm:p-5 shadow-2xs space-y-4 hover:border-emerald-500 transition-colors"
                  >
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-extrabold text-stone-900">
                            {isFpo ? `FPO Aggregation: ${pItem.lot_name || pItem.name || 'FPO Lot'}` : `Farmer Lot: ${pItem.farmer_name || 'Verified Farmer'}`}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              isFpo ? 'bg-purple-100 text-purple-900' : 'bg-emerald-100 text-emerald-900'
                            }`}
                          >
                            {isFpo ? 'FPO Collective Pool' : 'Individual Farmer'}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-stone-100 text-stone-800">
                            {pItem.quality_grade || 'Grade A'}
                          </span>
                        </div>
                        <div className="text-xs text-stone-500 mt-1 flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-stone-400" />
                          <span>
                            {pItem.village || pItem.collection_center || pItem.district || 'Maharashtra'} • Harvest Date:{' '}
                            {pItem.harvest_date ? new Date(pItem.harvest_date).toLocaleDateString() : 'Fresh Harvest'}
                          </span>
                        </div>
                      </div>

                      {/* Score Badge */}
                      <div className="flex items-center gap-3 self-end sm:self-auto">
                        <div className="text-right">
                          <span className="text-[10px] font-bold text-stone-500 uppercase">{t.module5.matchScore}</span>
                          <div className="text-xl font-black text-emerald-800 tabular-nums">
                            {score}%
                          </div>
                        </div>
                        <div className="w-12 h-12 rounded-full border-4 border-emerald-500 flex items-center justify-center font-black text-xs text-emerald-900 bg-emerald-50">
                          {score}
                        </div>
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-stone-50 p-3 rounded-lg border border-stone-200">
                      <div>
                        <span className="text-[10px] text-stone-500 font-bold uppercase">Available Volume</span>
                        <div className="font-extrabold text-stone-900 tabular-nums mt-0.5">
                          {pItem.quantity_qtl || pItem.current_quantity_qtl} Qtl
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] text-stone-500 font-bold uppercase">Expected Price</span>
                        <div className="font-extrabold text-emerald-800 tabular-nums mt-0.5">
                          ₹{pItem.expected_price_per_qtl || 3100} / Qtl
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] text-stone-500 font-bold uppercase">Ceiling Comparison</span>
                        <div className="font-bold text-stone-900 mt-0.5">
                          {selectedReqForMatching && pItem.expected_price_per_qtl
                            ? pItem.expected_price_per_qtl <= selectedReqForMatching.max_price_per_qtl
                              ? 'Within Budget'
                              : 'Above Target'
                            : 'Feasible'}
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] text-stone-500 font-bold uppercase">Transport Status</span>
                        <div className="font-bold text-stone-900 mt-0.5">
                          {isFpo ? 'Bulk Aggregated Hub' : 'Farmgate Ready'}
                        </div>
                      </div>
                    </div>

                    {/* Factor Contribution Breakdown (Requirement 5) */}
                    <div className="bg-stone-50 border border-stone-200 rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-stone-800">
                        <span className="flex items-center gap-1.5">
                          <Scale className="w-3.5 h-3.5 text-blue-600" />
                          <span>{matchingLabels.weightedContribution} ({t.common.all}: {score}%)</span>
                        </span>
                        <span className="text-[10px] font-mono text-stone-500">{matchingLabels.formulaNote}</span>
                      </div>

                      {explainable?.calculation?.steps ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                          {explainable.calculation.steps.map((step: any, sIdx: number) => (
                            <div key={step.stepNumber !== undefined ? `exp-step-${step.stepNumber}` : `exp-step-${sIdx}`} className="bg-white p-2 rounded border border-stone-200 flex items-center justify-between">
                              <span className="text-[11px] text-stone-600 truncate mr-1">
                                {language === 'mr' ? step.labelMr : language === 'hi' ? step.labelHi : step.labelEn}
                              </span>
                              <span className="font-mono font-bold text-emerald-700 shrink-0">
                                +{step.value} {matchingLabels.pts}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                          <div className="bg-white p-2 rounded border border-stone-200 flex items-center justify-between">
                            <span className="text-[11px] text-stone-600">{matchingLabels.cropCompatibility}</span>
                            <span className="font-mono font-bold text-emerald-700">+{weightsUsed.cropWeight} {matchingLabels.pts}</span>
                          </div>
                          <div className="bg-white p-2 rounded border border-stone-200 flex items-center justify-between">
                            <span className="text-[11px] text-stone-600">{matchingLabels.quantityFit}</span>
                            <span className="font-mono font-bold text-emerald-700">+{weightsUsed.quantityWeight} {matchingLabels.pts}</span>
                          </div>
                          <div className="bg-white p-2 rounded border border-stone-200 flex items-center justify-between">
                            <span className="text-[11px] text-stone-600">{matchingLabels.qualityFit}</span>
                            <span className="font-mono font-bold text-emerald-700">+{weightsUsed.qualityWeight} {matchingLabels.pts}</span>
                          </div>
                          <div className="bg-white p-2 rounded border border-stone-200 flex items-center justify-between">
                            <span className="text-[11px] text-stone-600">{matchingLabels.priceCompatibility}</span>
                            <span className="font-mono font-bold text-emerald-700">+{weightsUsed.priceWeight} {matchingLabels.pts}</span>
                          </div>
                          <div className="bg-white p-2 rounded border border-stone-200 flex items-center justify-between">
                            <span className="text-[11px] text-stone-600">{matchingLabels.distanceLocation}</span>
                            <span className="font-mono font-bold text-emerald-700">+{weightsUsed.locationWeight} {matchingLabels.pts}</span>
                          </div>
                          <div className="bg-white p-2 rounded border border-stone-200 flex items-center justify-between">
                            <span className="text-[11px] text-stone-600">{matchingLabels.deliveryDateWindow}</span>
                            <span className="font-mono font-bold text-emerald-700">+{weightsUsed.deliveryDateWeight} {matchingLabels.pts}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Transparent "Why This Match?" Explanation */}
                    <div className="bg-emerald-50/60 border border-emerald-200/60 rounded-lg p-3 space-y-2">
                      <div className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-emerald-700" />
                        <span>{t.module5.whyThisMatch}</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] text-stone-800">
                        {reasons.map((r: string, rIdx: number) => (
                          <div key={`why-reason-${rIdx}`} className="flex items-start gap-1.5">
                            <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <span>{r}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
                      <button
                        onClick={() => openBidSubmissionModal(pItem, false)}
                        className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <Tag className="w-3.5 h-3.5" />
                        <span>Submit Direct Bid on this Lot</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* -------------------- TAB 3: COMPETITIVE BIDDING DESK -------------------- */}
      {activeTab === 'bids' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-stone-900">
              {isFarmer
                ? t.module5.bidsReceived
                : language === 'mr'
                ? 'मी दिलेल्या थेट बोली'
                : language === 'hi'
                ? 'मेरी प्रस्तुत सीधी बोलियां'
                : 'My Submitted Direct Bids'}
            </h3>
            <span className="text-xs text-stone-500">
              {isFarmer
                ? (language === 'mr' ? 'बोलींचे विश्लेषण करा किंवा निव्वळ नफा गणकामध्ये तपासा' : language === 'hi' ? 'बोलियों का मूल्यांकन करें या शुद्ध लाभ गणक में जांचें' : 'Evaluate bids or compare with Net Realisation calculation')
                : (language === 'mr' ? 'थेट बोली कक्ष' : language === 'hi' ? 'सीधा बोली कक्ष' : 'Real-time bidding desk')}
            </span>
          </div>

          {bids.length === 0 ? (
            <div className="py-12 text-center bg-white border border-stone-200 rounded-xl p-6 text-xs text-stone-500">
              {language === 'mr'
                ? 'सध्या या बोली कक्षात कोणतीही सक्रिय बोली नोंदवलेली नाही.'
                : language === 'hi'
                ? 'वर्तमान में इस बोली कक्ष में कोई सक्रिय बोली दर्ज नहीं है।'
                : 'No active bids currently recorded in this bidding desk.'}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {bids.map((b) => {
                const isAccepted = b.status === 'ACCEPTED';
                const isRejected = b.status === 'REJECTED';
                const isFinalOffer = b.status === 'FINAL_OFFER' || b.is_closed === 1;
                const isCountered = b.status === 'COUNTERED';
                const isOwner = user?.role === 'BUYER' && b.buyer_id === user.id;

                return (
                  <div
                    key={b.id}
                    className={`bg-white border rounded-xl p-4 shadow-2xs space-y-3.5 transition-all ${
                      isAccepted
                        ? 'border-emerald-300 ring-1 ring-emerald-500/20'
                        : isFinalOffer
                        ? 'border-amber-300'
                        : 'border-stone-200'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-extrabold text-sm text-stone-900">
                          {isFarmer ? b.business_name || 'Buyer Bid' : b.crop_name_en || 'Produce Lot'}
                        </div>
                        <div className="text-[11px] text-stone-500 mt-0.5">
                          {isFarmer
                            ? `${b.buyer_type || 'Buyer'} • Contact: ${b.contact_person || 'Procurement Officer'}`
                            : `Farmer: ${b.farmer_name || 'Produce Lot'} (${b.produce_village || (b as any).produce_district || 'Farm'})`}
                        </div>
                        <div className="text-xs font-semibold text-emerald-800 mt-1">
                          Produce: {b.variety || b.crop_name_en} ({b.quantity_qtl} {t.common.quintals})
                        </div>
                      </div>

                      {/* Status Badge */}
                      <span
                        className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                          isAccepted
                            ? 'bg-emerald-100 text-emerald-900 border-emerald-200'
                            : isRejected
                            ? 'bg-rose-100 text-rose-900 border-rose-200'
                            : isFinalOffer
                            ? 'bg-amber-100 text-amber-900 border-amber-200'
                            : isCountered
                            ? 'bg-purple-100 text-purple-900 border-purple-200'
                            : 'bg-blue-100 text-blue-900 border-blue-200'
                        }`}
                      >
                        {isAccepted
                          ? t.module5.bidStatusAccepted
                          : isRejected
                          ? t.module5.bidStatusRejected
                          : isFinalOffer
                          ? t.module5.bidStatusFinalOffer
                          : isCountered
                          ? t.module5.bidStatusCountered
                          : t.module5.bidStatusPending}
                      </span>
                    </div>

                    {/* Price and Details */}
                    <div className="grid grid-cols-2 gap-2 text-xs bg-stone-50 p-2.5 rounded-lg border border-stone-200">
                      <div>
                        <span className="text-[10px] text-stone-500 font-bold uppercase">{t.module5.bidAmount}</span>
                        <div className="text-base font-black text-emerald-800 tabular-nums">
                          ₹{b.bid_price_per_qtl} / Qtl
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] text-stone-500 font-bold uppercase">{t.module5.totalBidValue}</span>
                        <div className="text-base font-black text-stone-900 tabular-nums">
                          ₹{(b.bid_price_per_qtl * b.quantity_qtl).toLocaleString('en-IN')}
                        </div>
                      </div>
                      <div className="col-span-2 text-[11px] text-stone-700">
                        <span className="font-bold">Payment Terms:</span> {b.payment_terms || 'Immediate on Inspection'}
                      </div>
                      <div className="col-span-2 text-[11px] text-stone-700">
                        <span className="font-bold">Proposed Pickup:</span>{' '}
                        {new Date(b.proposed_pickup_date).toLocaleDateString()}
                      </div>
                    </div>

                    {/* Counter price note if any */}
                    {b.counter_price_per_qtl && (
                      <div className="p-2 bg-purple-50 border border-purple-200 text-purple-950 text-xs rounded-lg">
                        <strong>Counter-Offer Sent:</strong> ₹{b.counter_price_per_qtl} / Qtl (
                        {b.counter_price_per_qtl > b.bid_price_per_qtl ? '+' : ''}
                        {b.counter_price_per_qtl - b.bid_price_per_qtl} ₹/Qtl)
                      </div>
                    )}

                    {/* Notes */}
                    {b.notes && (
                      <div className="text-[11px] text-stone-600 bg-stone-50 p-2 rounded border border-stone-200 italic">
                        "{b.notes}"
                      </div>
                    )}

                    {/* Action Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-stone-100">
                      {/* Farmer Actions */}
                      {isFarmer && !isAccepted && !isRejected && (
                        <div className="flex flex-wrap items-center gap-1.5 w-full justify-end">
                          <button
                            onClick={() => handleEvaluateModule2(b)}
                            className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-sm transition-colors flex items-center gap-1"
                            title="Compare bid vs APMC mandis"
                          >
                            <Scale className="w-3.5 h-3.5" />
                            <span>Evaluate Net Realisation</span>
                          </button>

                          <button
                            onClick={() => {
                              setCounterBid(b);
                              setCounterPrice(Math.round(b.bid_price_per_qtl * 1.08));
                            }}
                            className="px-2.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-lg shadow-sm transition-colors"
                          >
                            {t.module5.counterBid}
                          </button>

                          <button
                            onClick={() => handleAcceptBidAndCreateTx(b.id)}
                            className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg shadow-sm transition-colors flex items-center gap-1"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>{t.module5.acceptBid}</span>
                          </button>
                        </div>
                      )}

                      {/* Buyer Actions */}
                      {isBuyer && !isAccepted && !isRejected && (
                        <div className="flex items-center gap-2 w-full justify-end">
                          {!isFinalOffer && (
                            <>
                              <button
                                onClick={() => openBidSubmissionModal(b, true, b)}
                                className="px-2.5 py-1.5 border border-stone-300 hover:bg-stone-50 text-stone-700 font-bold text-xs rounded-lg transition-colors flex items-center gap-1"
                              >
                                <Edit2 className="w-3 h-3" />
                                <span>{t.module5.editBid}</span>
                              </button>

                              <button
                                onClick={() => handleCloseBidding(b.id)}
                                className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg shadow-sm transition-colors flex items-center gap-1"
                              >
                                <Lock className="w-3 h-3" />
                                <span>{t.module5.closeBidding}</span>
                              </button>
                            </>
                          )}
                        </div>
                      )}

                      {isAccepted && (
                        <div className="w-full flex items-center justify-between text-xs text-emerald-800 font-bold">
                          <span>Trade deal confirmed & locked</span>
                          <button
                            onClick={() => onNavigate && onNavigate('transactions')}
                            className="text-emerald-700 underline flex items-center gap-1 font-extrabold"
                          >
                            <span>Go to Order & Settlement</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* -------------------- TAB 4: FARMER MATCHED REQUIREMENTS -------------------- */}
      {isFarmer && activeTab === 'matching' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-stone-900">
              Buyer Demands Matching Your Crops
            </h3>
            <span className="text-xs text-stone-500">
              Buyers actively seeking to purchase your listed varieties
            </span>
          </div>

          {farmerMatchedReqs.length === 0 ? (
            <div className="py-12 text-center bg-white border border-stone-200 rounded-xl p-6 text-xs text-stone-500">
              No matching buyer requirements found for your current crops. Add new produce lots to discover buyers!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {farmerMatchedReqs.map((mr: any, idx: number) => {
                const req = mr.requirement || mr;
                const score = mr.score || 88;
                const reasons = mr.reasons || [
                  `Exact Crop Match: ${req.crop_name_en}`,
                  `Buyer offers up to ₹${req.max_price_per_qtl}/Qtl`,
                  `Delivery at ${req.delivery_location}`,
                ];

                return (
                  <div
                    key={req.id ? `farmer-matched-req-${req.id}` : `farmer-matched-req-${idx}`}
                    className="bg-white border border-stone-200 rounded-xl p-4 shadow-2xs space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-extrabold text-sm text-stone-900">
                          {req.business_name}
                        </div>
                        <div className="text-[11px] text-stone-500">
                          {req.buyer_type} • Destination: {req.delivery_location}
                        </div>
                        <div className="text-xs font-bold text-emerald-800 mt-1">
                          Crop: {req.crop_name_en} ({req.min_quantity_qtl} Qtl needed)
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] font-bold text-stone-500 uppercase">Target Price</span>
                        <div className="text-base font-black text-emerald-800 tabular-nums">
                          ₹{req.max_price_per_qtl} / Qtl
                        </div>
                      </div>
                    </div>

                    <div className="bg-emerald-50/60 border border-emerald-200/60 p-2.5 rounded-lg text-[11px] text-stone-800 space-y-1">
                      <div className="font-bold text-emerald-950 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Why this match? (Score: {score}%)</span>
                      </div>
                      {reasons.map((r: string, rIdx: number) => (
                        <div key={`fm-reason-${rIdx}`} className="flex items-center gap-1 text-stone-700">
                          <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span>{r}</span>
                        </div>
                      ))}
                    </div>

                    <div className="text-[11px] text-stone-500">
                      Payment Terms: {req.payment_terms || 'Immediate on Inspection'}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* -------------------- TAB 5: FARMER PRODUCE LOTS -------------------- */}
      {isFarmer && activeTab === 'farmerProduce' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-stone-900">
              My Listed Produce Lots
            </h3>
            <button
              onClick={() => setShowAddProduce(true)}
              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg shadow-sm transition-colors flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Produce Lot</span>
            </button>
          </div>

          {farmerProduce.length === 0 ? (
            <div className="py-12 text-center bg-white border border-stone-200 rounded-xl p-6 text-xs text-stone-500">
              No produce lots listed yet. Click "Add Produce Lot" to enable direct buyer matching.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {farmerProduce.map((p) => (
                <div key={p.id} className="bg-white border border-stone-200 rounded-xl p-4 shadow-2xs space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-extrabold text-sm text-stone-900">
                        {p.crop_name_en} {p.variety ? `(${p.variety})` : ''}
                      </div>
                      <div className="text-[11px] text-stone-500">
                        Village: {p.village} • Harvested: {new Date(p.harvest_date).toLocaleDateString()}
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-900">
                      {p.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs bg-stone-50 p-2 rounded border border-stone-200">
                    <div>
                      <span className="text-[10px] text-stone-500 uppercase font-bold">Quantity</span>
                      <div className="font-black text-stone-900 tabular-nums">{p.quantity_qtl} Qtl</div>
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-500 uppercase font-bold">Expected Price</span>
                      <div className="font-black text-emerald-800 tabular-nums">₹{p.expected_price_per_qtl} / Qtl</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* -------------------- MODAL: CREATE BUYER REQUIREMENT -------------------- */}
      {showAddReq && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl border border-stone-200 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-bold text-sm text-stone-900 flex items-center gap-2">
                <Package className="w-4 h-4 text-emerald-700" />
                <span>{t.module5.createNewRequirement}</span>
              </h3>
              <button
                onClick={() => setShowAddReq(false)}
                className="text-stone-400 hover:text-stone-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateRequirementSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Crop */}
                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    {t.module5.crop} *
                  </label>
                  <select
                    value={reqCropId}
                    onChange={(e) => setReqCropId(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-hidden bg-white font-medium"
                  >
                    {crops.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name_en} ({c.name_mr})
                      </option>
                    ))}
                  </select>
                  {formValidationErrors.crop && (
                    <span className="text-rose-600 text-[10px] mt-0.5 block">{formValidationErrors.crop}</span>
                  )}
                </div>

                {/* Variety */}
                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Variety (Optional)
                  </label>
                  <input
                    type="text"
                    value={reqVariety}
                    onChange={(e) => setReqVariety(e.target.value)}
                    placeholder="e.g. JS-335, Phule Vikram, Gavran"
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-hidden font-medium"
                  />
                </div>

                {/* Required Quantity */}
                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    {t.module5.minQuantity} *
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    required
                    value={reqQty}
                    onChange={(e) => setReqQty(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-hidden font-bold"
                  />
                  {formValidationErrors.qty && (
                    <span className="text-rose-600 text-[10px] mt-0.5 block">{formValidationErrors.qty}</span>
                  )}
                </div>

                {/* Target Price */}
                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    {t.module5.maxPrice} *
                  </label>
                  <input
                    type="number"
                    min="100"
                    step="50"
                    required
                    value={reqPrice}
                    onChange={(e) => setReqPrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-hidden font-bold"
                  />
                  {formValidationErrors.price && (
                    <span className="text-rose-600 text-[10px] mt-0.5 block">{formValidationErrors.price}</span>
                  )}
                </div>

                {/* Quality Grade */}
                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    {t.module5.qualityGrade} *
                  </label>
                  <select
                    value={reqQuality}
                    onChange={(e) => setReqQuality(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-hidden bg-white font-medium"
                  >
                    <option value="Grade A">Grade A (Premium / Export Quality)</option>
                    <option value="Grade B">Grade B (Standard Commercial)</option>
                    <option value="Grade C">Grade C (Processing Quality)</option>
                    <option value="Fair Average Quality (FAQ)">Fair Average Quality (FAQ)</option>
                  </select>
                </div>

                {/* Delivery Date */}
                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    {t.module5.deliveryDate} *
                  </label>
                  <input
                    type="date"
                    required
                    value={reqDeliveryDate}
                    onChange={(e) => setReqDeliveryDate(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-hidden font-medium"
                  />
                  {formValidationErrors.deliveryDate && (
                    <span className="text-rose-600 text-[10px] mt-0.5 block">{formValidationErrors.deliveryDate}</span>
                  )}
                </div>

                {/* Delivery Location */}
                <div className="sm:col-span-2">
                  <label className="block font-bold text-stone-700 mb-1">
                    {t.module5.deliveryLocation} *
                  </label>
                  <input
                    type="text"
                    required
                    value={reqLocation}
                    onChange={(e) => setReqLocation(e.target.value)}
                    placeholder="e.g. Vashi APMC Sector 19, Navi Mumbai or Sahyadri Processing Plant, Dindori"
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-hidden font-medium"
                  />
                  {formValidationErrors.location && (
                    <span className="text-rose-600 text-[10px] mt-0.5 block">{formValidationErrors.location}</span>
                  )}
                </div>

                {/* Payment Terms */}
                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    {t.module5.paymentTerms} *
                  </label>
                  <input
                    type="text"
                    required
                    value={reqPaymentTerms}
                    onChange={(e) => setReqPaymentTerms(e.target.value)}
                    placeholder="e.g. 100% on Quality Verification"
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-hidden font-medium"
                  />
                </div>

                {/* Buyer Type */}
                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    {t.module5.buyerType} *
                  </label>
                  <input
                    type="text"
                    required
                    value={reqBuyerType}
                    onChange={(e) => setReqBuyerType(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-hidden font-medium"
                  />
                </div>

                {/* Logistics Preference */}
                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    {t.module5.pickupDeliveryPref}
                  </label>
                  <select
                    value={reqLogistics}
                    onChange={(e) => setReqLogistics(e.target.value as any)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-hidden bg-white font-medium"
                  >
                    <option value="BUYER_PICKUP">{t.module5.buyerPickup}</option>
                    <option value="FARMER_DELIVERY">{t.module5.farmerDelivery}</option>
                  </select>
                </div>

                {/* Packaging Preference */}
                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    {t.module5.packagingPreference}
                  </label>
                  <select
                    value={reqPackaging}
                    onChange={(e) => setReqPackaging(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-hidden bg-white font-medium"
                  >
                    <option value="50kg Jute Gunny Bags">50kg Jute Gunny Bags</option>
                    <option value="25kg HDPE Bags">25kg HDPE Bags</option>
                    <option value="Plastic Crates">Plastic Crates (Perishables)</option>
                    <option value="Bulk Loose Truckload">Bulk Loose Truckload</option>
                  </select>
                </div>

                {/* Additional Notes */}
                <div className="sm:col-span-2">
                  <label className="block font-bold text-stone-700 mb-1">
                    {t.module5.additionalNotes} (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={reqNotes}
                    onChange={(e) => setReqNotes(e.target.value)}
                    placeholder="e.g. Moisture ceiling 11%, uniform color, no chemical residue, inspection certificate required."
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-hidden font-medium"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowAddReq(false)}
                  className="px-3.5 py-2 border border-stone-300 rounded-lg text-stone-700 font-bold hover:bg-stone-50"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  disabled={submittingReq}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg shadow-sm transition-colors disabled:opacity-50"
                >
                  {submittingReq ? t.common.saving : 'Post Requirement & Match'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* -------------------- MODAL: SUBMIT / EDIT DIRECT BID -------------------- */}
      {showBidModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-bold text-sm text-stone-900 flex items-center gap-2">
                <Tag className="w-4 h-4 text-emerald-700" />
                <span>{editingBidId ? t.module5.editBid : t.module5.placeBidAsBuyer}</span>
              </h3>
              <button
                onClick={() => setShowBidModal(false)}
                className="text-stone-400 hover:text-stone-600"
              >
                ✕
              </button>
            </div>

            {targetProduceForBid && (
              <div className="text-xs bg-stone-50 p-2.5 rounded-lg border border-stone-200 space-y-0.5">
                <div className="font-bold text-stone-900">
                  Target Produce: {targetProduceForBid.crop_name_en} ({targetProduceForBid.quantity_qtl || targetProduceForBid.current_quantity_qtl} Qtl)
                </div>
                <div className="text-stone-500">
                  Location: {targetProduceForBid.village || targetProduceForBid.collection_center || targetProduceForBid.district || 'Maharashtra'} • Expected: ₹{targetProduceForBid.expected_price_per_qtl || 3100}/Qtl
                </div>
              </div>
            )}

            <form onSubmit={handleBidSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  {t.module5.bidAmount} *
                </label>
                <input
                  type="number"
                  min="100"
                  step="25"
                  required
                  value={bidPrice}
                  onChange={(e) => setBidPrice(parseFloat(e.target.value) || 0)}
                  className="w-full text-sm font-black px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-hidden font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Quantity (Quintals) *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={bidQty}
                  onChange={(e) => setBidQty(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-hidden font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  {t.module5.pickupDate} *
                </label>
                <input
                  type="date"
                  required
                  value={bidPickupDate}
                  onChange={(e) => setBidPickupDate(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Payment Terms *
                </label>
                <input
                  type="text"
                  required
                  value={bidPaymentTerms}
                  onChange={(e) => setBidPaymentTerms(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Validity / Expiry Date
                </label>
                <input
                  type="date"
                  value={bidValidity}
                  onChange={(e) => setBidValidity(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Notes / Specifications
                </label>
                <textarea
                  rows={2}
                  value={bidNotes}
                  onChange={(e) => setBidNotes(e.target.value)}
                  placeholder="e.g. Weighment at farmgate weighbridge, buyer provides transport vehicle."
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowBidModal(false)}
                  className="px-3 py-1.5 border border-stone-300 rounded-lg text-stone-700 font-bold hover:bg-stone-50"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  disabled={submittingBid}
                  className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg shadow-sm transition-colors disabled:opacity-50"
                >
                  {submittingBid ? t.common.saving : editingBidId ? 'Update Bid' : 'Confirm Bid'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* -------------------- MODAL: MODULE 2 EVALUATION -------------------- */}
      {evaluatingBid && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-bold text-sm text-stone-900 flex items-center gap-2">
                <Scale className="w-4 h-4 text-emerald-700" />
                <span>
                  {language === 'mr'
                    ? 'निव्वळ नफा आणि कृषी उत्पन्न बाजार समिती तुलना'
                    : language === 'hi'
                    ? 'शुद्ध आय बनाम एपीएमसी मंडी तुलना'
                    : 'Net Realisation vs APMC Mandis'}
                </span>
              </h3>
              <button
                onClick={() => setEvaluatingBid(null)}
                className="text-stone-400 hover:text-stone-600"
              >
                ✕
              </button>
            </div>

            {loadingModule2 ? (
              <div className="py-8 text-center text-xs text-stone-500">{t.common.loading}</div>
            ) : module2Result ? (
              <div className="space-y-4 text-xs">
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-emerald-800 uppercase font-bold">
                        Direct Buyer Net Realisation
                      </span>
                      <div className="text-xl font-black text-emerald-950 tabular-nums">
                        ₹{module2Result.farmerNetRealisationPerQtl} / Qtl
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-emerald-800 uppercase font-bold">
                        Net Revenue
                      </span>
                      <div className="text-lg font-black text-emerald-950 tabular-nums">
                        ₹{module2Result.totalNetRevenue.toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>
                  <div className="text-[11px] text-emerald-900 flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>
                      {module2Result.logisticsMode} — 0 mandi cess, 0 commission, 0 unloading deduction.
                    </span>
                  </div>
                </div>

                {module2Result.profitDifferenceVsBestMandi > 0 && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-950 text-xs">
                    <strong>Net Financial Advantage:</strong> Selling directly to this buyer yields an estimated{' '}
                    <span className="font-black text-emerald-700">
                      +₹{module2Result.profitDifferenceVsBestMandi} / Qtl
                    </span>{' '}
                    higher profit than hauling to the best APMC market!
                  </div>
                )}

                {/* Mandi comparison list */}
                {module2Result.mandiComparison && module2Result.mandiComparison.length > 0 && (
                  <div className="space-y-2">
                    <div className="font-bold text-stone-800 text-xs">
                      Alternative APMC Mandi Realisations:
                    </div>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {module2Result.mandiComparison.slice(0, 3).map((mandi: any, mIdx: number) => (
                        <div
                          key={mandi.marketId ? `mandi-comp-${mandi.marketId}` : `mandi-comp-${mIdx}`}
                          className="flex items-center justify-between p-2.5 bg-stone-50 rounded-lg border border-stone-200 text-stone-700"
                        >
                          <div>
                            <div className="font-bold text-stone-900">{mandi.marketName}</div>
                            <div className="text-[10px] text-stone-500">
                              {mandi.distanceKm} km • Mandi Rate: ₹{mandi.modalPrice}/Qtl
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-stone-500">Net Realisation:</span>
                            <div className="font-black text-stone-900 tabular-nums">
                              ₹{mandi.netRealisationPerQtl} / Qtl
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
                  <button
                    onClick={() => setEvaluatingBid(null)}
                    className="px-3.5 py-1.5 border border-stone-300 text-stone-700 font-bold text-xs rounded-lg hover:bg-stone-50"
                  >
                    Close Comparison
                  </button>
                  <button
                    onClick={() => {
                      const bidId = evaluatingBid.id;
                      setEvaluatingBid(null);
                      handleAcceptBidAndCreateTx(bidId);
                    }}
                    className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg shadow-sm"
                  >
                    Accept Offer & Proceed to Order
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* -------------------- MODAL: FARMER ADD PRODUCE LOT -------------------- */}
      {showAddProduce && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-bold text-sm text-stone-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-700" />
                <span>{t.farmerDashboard.addProduceButton}</span>
              </h3>
              <button
                onClick={() => setShowAddProduce(false)}
                className="text-stone-400 hover:text-stone-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFarmerAddProduceSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-stone-700 mb-1">Crop *</label>
                <select
                  value={prodCropId}
                  onChange={(e) => setProdCropId(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-hidden bg-white"
                >
                  {crops.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name_en} ({c.name_mr})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Variety</label>
                <input
                  type="text"
                  value={prodVariety}
                  onChange={(e) => setProdVariety(e.target.value)}
                  placeholder="e.g. JS-335, Phule Vikram"
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Quantity (Quintals) *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={prodQty}
                  onChange={(e) => setProdQty(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-hidden font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Expected Price (₹/Qtl) *</label>
                <input
                  type="number"
                  min="100"
                  step="50"
                  required
                  value={prodPrice}
                  onChange={(e) => setProdPrice(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-hidden font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Quality Grade</label>
                <select
                  value={prodGrade}
                  onChange={(e) => setProdGrade(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-hidden bg-white"
                >
                  <option value="Grade A">Grade A (Premium)</option>
                  <option value="Grade B">Grade B (Standard)</option>
                  <option value="Grade C">Grade C (Commercial)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Village / Location</label>
                <input
                  type="text"
                  value={prodVillage}
                  onChange={(e) => setProdVillage(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowAddProduce(false)}
                  className="px-3 py-1.5 border border-stone-300 rounded-lg text-stone-700 font-bold hover:bg-stone-50"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  disabled={submittingProduce}
                  className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg shadow-sm disabled:opacity-50"
                >
                  {submittingProduce ? t.common.saving : 'List Produce'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* -------------------- MODAL: COUNTER OFFER (FOR FARMER) -------------------- */}
      {counterBid && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-bold text-sm text-stone-900">{t.module5.counterBid}</h3>
              <button onClick={() => setCounterBid(null)} className="text-stone-400 hover:text-stone-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleCounterSubmit} className="space-y-4 text-xs">
              <div className="bg-stone-50 p-3 rounded-lg border border-stone-200">
                <span className="text-[10px] text-stone-500 uppercase font-bold">Buyer's Original Offer</span>
                <div className="text-lg font-black text-stone-900 tabular-nums">
                  ₹{counterBid.bid_price_per_qtl} / Qtl
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Your Proposed Counter Price (₹/Qtl) *
                </label>
                <input
                  type="number"
                  min={counterBid.bid_price_per_qtl}
                  step="25"
                  required
                  value={counterPrice}
                  onChange={(e) => setCounterPrice(parseFloat(e.target.value) || 0)}
                  className="w-full text-sm font-black px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-hidden font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setCounterBid(null)}
                  className="px-3 py-1.5 border border-stone-300 rounded-lg text-stone-700 font-bold"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  disabled={submittingCounter}
                  className="px-4 py-1.5 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-lg shadow-sm disabled:opacity-50"
                >
                  {submittingCounter ? t.common.saving : 'Send Counter Offer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
