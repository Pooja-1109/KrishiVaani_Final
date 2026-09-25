import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { Transaction, TransactionStatus, QualityVerification, PaymentRecord } from '../../types';
import {
  Receipt,
  CheckCircle,
  RefreshCw,
  AlertCircle,
  Clock,
  Truck,
  ShieldCheck,
  CreditCard,
  XCircle,
  FileCheck2,
  ExternalLink,
  ChevronRight,
  Info,
  Calendar,
  AlertTriangle,
  LifeBuoy,
} from 'lucide-react';

interface TransactionsViewProps {
  onNavigate?: (tab: string, extra?: any) => void;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { t, getCropName, language } = useLanguage();

  const isFarmer = user?.role === 'FARMER';
  const isBuyer = user?.role === 'BUYER';
  const isAdmin = user?.role === 'ADMIN';

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Quality Verification Modal
  const [selectedTxForQuality, setSelectedTxForQuality] = useState<Transaction | null>(null);
  const [qualityGrade, setQualityGrade] = useState('Grade A');
  const [isAccepted, setIsAccepted] = useState(true);
  const [qtyVerified, setQtyVerified] = useState<number>(0);
  const [qualityNotes, setQualityNotes] = useState('');
  const [verifierName, setVerifierName] = useState(user?.mobile || 'Verified Inspector');
  const [submittingQuality, setSubmittingQuality] = useState(false);

  // Delivery Modal
  const [selectedTxForDelivery, setSelectedTxForDelivery] = useState<Transaction | null>(null);
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [submittingDelivery, setSubmittingDelivery] = useState(false);

  // Payment Modal
  const [selectedTxForPayment, setSelectedTxForPayment] = useState<Transaction | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState('Direct Bank Transfer (NEFT/RTGS)');
  const [payRef, setPayRef] = useState('');
  const [submittingPayment, setSubmittingPayment] = useState(false);

  // Detail Modal
  const [viewTx, setViewTx] = useState<Transaction | null>(null);

  const loadTransactions = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getTransactions();
      setTransactions(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  const openQualityModal = (tx: Transaction) => {
    setSelectedTxForQuality(tx);
    setQtyVerified(tx.quantity_qtl);
    setQualityGrade('Grade A');
    setIsAccepted(true);
    setQualityNotes('Lot meets standard moisture (<12%) and visual quality criteria.');
  };

  const handleQualitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTxForQuality) return;
    setSubmittingQuality(true);
    setError(null);

    try {
      await api.verifyTransactionQuality(selectedTxForQuality.id, {
        verified_grade: qualityGrade,
        is_accepted: isAccepted,
        quantity_verified_qtl: qtyVerified,
        quality_notes: qualityNotes,
        verifier_name: verifierName,
      });

      setSelectedTxForQuality(null);
      setActionSuccess(
        isAccepted
          ? 'Quality verification completed & approved. Ready for dispatch!'
          : 'Quality rejected. Lot flagged for emergency crop rescue.'
      );
      setTimeout(() => setActionSuccess(null), 4000);
      await loadTransactions();
    } catch (err: any) {
      setError(err.message || 'Failed to submit quality verification');
    } finally {
      setSubmittingQuality(false);
    }
  };

  const handleAdvanceDelivery = async (txId: number, nextStatus: 'IN_TRANSIT' | 'DELIVERED') => {
    setSubmittingDelivery(true);
    try {
      await api.updateTransactionStatus(txId, nextStatus, deliveryNotes || undefined);
      setSelectedTxForDelivery(null);
      setDeliveryNotes('');
      setActionSuccess(`Consignment status updated to ${nextStatus}.`);
      setTimeout(() => setActionSuccess(null), 3000);
      await loadTransactions();
    } catch (err: any) {
      setError(err.message || 'Failed to update delivery');
    } finally {
      setSubmittingDelivery(false);
    }
  };

  const openPaymentModal = (tx: Transaction) => {
    setSelectedTxForPayment(tx);
    setPayAmount(tx.net_amount);
    setPayRef(`TXN-${Date.now().toString(36).toUpperCase()}`);
    setPayMethod('Direct Bank Transfer (NEFT/RTGS)');
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTxForPayment) return;
    setSubmittingPayment(true);
    setError(null);

    try {
      await api.recordDemoPayment(selectedTxForPayment.id, {
        amount: payAmount,
        payment_method: payMethod,
        payment_reference: payRef,
      });

      setSelectedTxForPayment(null);
      setActionSuccess('Payment recorded and updated in digital ledger. Transaction Completed!');
      setTimeout(() => setActionSuccess(null), 4000);
      await loadTransactions();
    } catch (err: any) {
      setError(err.message || 'Failed to record payment');
    } finally {
      setSubmittingPayment(false);
    }
  };

  const totalGross = transactions.reduce((sum, t) => sum + (t.gross_amount || 0), 0);
  const totalNet = transactions.reduce((sum, t) => sum + (t.net_amount || 0), 0);
  const totalVolume = transactions.reduce((sum, t) => sum + (t.quantity_qtl || 0), 0);

  const getStatusBadge = (status: TransactionStatus) => {
    switch (status) {
      case 'ORDER_CREATED':
        return { label: t.transactions.orderCreated, color: 'bg-blue-100 text-blue-900 border-blue-200' };
      case 'QUALITY_VERIFICATION':
        return { label: t.transactions.qualityVerification, color: 'bg-amber-100 text-amber-900 border-amber-200' };
      case 'READY_FOR_DELIVERY':
        return { label: t.transactions.readyForDelivery, color: 'bg-cyan-100 text-cyan-900 border-cyan-200' };
      case 'IN_TRANSIT':
        return { label: t.transactions.inTransit, color: 'bg-purple-100 text-purple-900 border-purple-200' };
      case 'DELIVERED':
        return { label: t.transactions.delivered, color: 'bg-teal-100 text-teal-900 border-teal-200' };
      case 'PAYMENT_PENDING':
        return { label: t.transactions.pending, color: 'bg-amber-100 text-amber-900 border-amber-200' };
      case 'COMPLETED':
        return { label: t.transactions.completed, color: 'bg-emerald-100 text-emerald-900 border-emerald-200' };
      case 'CANCELLED':
        return { label: t.transactions.cancelled, color: 'bg-rose-100 text-rose-900 border-rose-200' };
      default:
        return { label: status, color: 'bg-stone-100 text-stone-800 border-stone-200' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-stone-200 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-stone-900 tracking-tight flex items-center gap-2">
            <Receipt className="w-5 h-5 text-emerald-700" />
            <span>{t.transactions.title}</span>
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 mt-1">
            {t.transactions.subtitle}
          </p>
        </div>

        <button
          onClick={loadTransactions}
          className="p-2 border border-stone-300 rounded-lg bg-white hover:bg-stone-50 text-stone-700 self-start sm:self-auto"
          title={t.common.refresh}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {actionSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs rounded-lg flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-700 shrink-0" />
          <span className="font-semibold">{actionSuccess}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-900 text-xs rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-2xs">
          <span className="text-[11px] font-bold text-stone-700 uppercase tracking-wider">
            Total Settled Volume
          </span>
          <div className="text-2xl font-black text-stone-900 tabular-nums mt-1">
            {totalVolume.toLocaleString('en-IN')} <span className="text-xs font-bold text-stone-500">{t.common.quintals}</span>
          </div>
          <div className="text-[10px] text-stone-500 font-semibold mt-1">
            Across {transactions.length} orders
          </div>
        </div>

        <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-2xs">
          <span className="text-[11px] font-bold text-stone-700 uppercase tracking-wider">
            Net Realisation Payout
          </span>
          <div className="text-2xl font-black text-emerald-800 tabular-nums mt-1">
            ₹{totalNet.toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] text-emerald-700 font-semibold mt-1">
            Gross Trade Value: ₹{totalGross.toLocaleString('en-IN')}
          </div>
        </div>

        <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-2xs">
          <span className="text-[11px] font-bold text-stone-700 uppercase tracking-wider">
            Completed Settlements
          </span>
          <div className="text-2xl font-black text-stone-900 tabular-nums mt-1">
            {transactions.filter((tx) => tx.status === 'COMPLETED').length} / {transactions.length}
          </div>
          <div className="text-[10px] text-stone-500 font-semibold mt-1">
            {transactions.filter((tx) => tx.status !== 'COMPLETED' && tx.status !== 'CANCELLED').length} active lifecycle orders
          </div>
        </div>
      </div>

      {/* Transaction List */}
      {loading ? (
        <div className="py-12 text-center text-xs text-stone-500">{t.common.loading}</div>
      ) : transactions.length === 0 ? (
        <div className="py-12 text-center bg-white border border-stone-200 rounded-xl text-xs text-stone-600 p-6 space-y-3">
          <Receipt className="w-8 h-8 text-stone-400 mx-auto" />
          <div className="font-bold text-stone-800">No transactions recorded yet.</div>
          <p className="max-w-md mx-auto text-stone-500">
            Transactions are generated when a Farmer accepts a direct Buyer Bid or when a Purchase Mandate closes successfully.
          </p>
          <button
            onClick={() => onNavigate && onNavigate('module5')}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg shadow-sm transition-colors"
          >
            Go to Bidding & Matching
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {transactions.map((tx) => {
            const badge = getStatusBadge(tx.status);
            const isCompleted = tx.status === 'COMPLETED';
            const isCancelled = tx.status === 'CANCELLED';

            return (
              <div
                key={tx.id ? `tx-${tx.id}` : `tx-ref-${tx.transaction_ref}`}
                className={`bg-white border rounded-xl p-4 sm:p-5 shadow-2xs space-y-4 transition-all ${
                  isCompleted ? 'border-emerald-200' : isCancelled ? 'border-rose-200 opacity-80' : 'border-stone-200'
                }`}
              >
                {/* Top Row: Ref, Crop, Status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-sm text-stone-900">
                        {tx.transaction_ref}
                      </span>
                      <span
                        className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${badge.color}`}
                      >
                        {badge.label}
                      </span>
                      {tx.payment_record && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-stone-100 text-stone-700">
                          {tx.payment_record.payment_method}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-stone-500 mt-1 flex items-center gap-3">
                      <span>{new Date(tx.created_at).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>
                        {tx.buyer_name ? `Buyer: ${tx.buyer_name}` : ''}
                        {tx.farmer_name ? `Farmer: ${tx.farmer_name}` : ''}
                      </span>
                    </div>
                  </div>

                  <div className="text-right sm:self-center">
                    <span className="text-[10px] font-bold text-stone-700 uppercase">Net Agreed Settlement</span>
                    <div className="text-lg font-black text-emerald-800 tabular-nums">
                      ₹{tx.net_amount.toLocaleString('en-IN')}
                    </div>
                    <div className="text-[11px] text-stone-700">
                      {tx.quantity_qtl} Qtl @ ₹{tx.rate_per_qtl}/Qtl
                    </div>
                  </div>
                </div>

                {/* Lifecycle Progress Bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-bold text-stone-700">
                    <span className={tx.status !== 'CANCELLED' ? 'text-emerald-800' : ''}>1. Order Created</span>
                    <span className={['QUALITY_VERIFICATION', 'READY_FOR_DELIVERY', 'IN_TRANSIT', 'DELIVERED', 'PAYMENT_PENDING', 'COMPLETED'].includes(tx.status) ? 'text-emerald-800' : ''}>
                      2. Quality Verified
                    </span>
                    <span className={['IN_TRANSIT', 'DELIVERED', 'PAYMENT_PENDING', 'COMPLETED'].includes(tx.status) ? 'text-emerald-800' : ''}>
                      3. Dispatched
                    </span>
                    <span className={['DELIVERED', 'PAYMENT_PENDING', 'COMPLETED'].includes(tx.status) ? 'text-emerald-800' : ''}>
                      4. Delivered
                    </span>
                    <span className={tx.status === 'COMPLETED' ? 'text-emerald-800' : ''}>
                      5. Settled (Paid)
                    </span>
                  </div>
                  <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden flex">
                    <div
                      className={`h-full transition-all duration-300 ${
                        isCancelled
                          ? 'bg-rose-500 w-full'
                          : tx.status === 'COMPLETED'
                          ? 'bg-emerald-600 w-full'
                          : tx.status === 'PAYMENT_PENDING' || tx.status === 'DELIVERED'
                          ? 'bg-emerald-500 w-4/5'
                          : tx.status === 'IN_TRANSIT'
                          ? 'bg-purple-500 w-3/5'
                          : tx.status === 'READY_FOR_DELIVERY' || tx.status === 'QUALITY_VERIFICATION'
                          ? 'bg-amber-500 w-2/5'
                          : 'bg-blue-500 w-1/5'
                      }`}
                    />
                  </div>
                </div>

                {/* Quality & Payment Inspection Badges */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-stone-50 p-3 rounded-lg border border-stone-200">
                  <div>
                    <span className="text-[10px] font-bold text-stone-700 uppercase flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-stone-700" />
                      Quality Verification
                    </span>
                    {tx.quality_verification ? (
                      <div className="mt-1 space-y-0.5">
                        <div className="font-bold text-stone-900">
                          {tx.quality_verification.verified_grade} •{' '}
                          <span className={tx.quality_verification.is_accepted ? 'text-emerald-800 font-extrabold' : 'text-rose-700 font-extrabold'}>
                            {tx.quality_verification.is_accepted ? 'APPROVED' : 'REJECTED'}
                          </span>
                        </div>
                        <div className="text-[11px] text-stone-700 italic">
                          "{tx.quality_verification.quality_notes || 'Verified'}"
                        </div>
                      </div>
                    ) : (
                      <div className="text-stone-700 mt-1 italic">Pending initial lot inspection</div>
                    )}
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-stone-700 uppercase flex items-center gap-1">
                      <CreditCard className="w-3.5 h-3.5 text-stone-700" />
                      {language === 'mr' ? 'पेमेंट पावती' : language === 'hi' ? 'भुगतान वाउचर' : 'Settlement Voucher'}
                    </span>
                    {tx.payment_record ? (
                      <div className="mt-1 space-y-0.5">
                        <div className="font-bold text-stone-900">
                          ₹{tx.payment_record.amount.toLocaleString('en-IN')} (PAID)
                        </div>
                        <div className="text-[10px] font-mono text-stone-700">
                          Ref: {tx.payment_record.payment_reference}
                        </div>
                      </div>
                    ) : (
                      <div className="text-stone-700 mt-1 italic">
                        {tx.payment_status === 'PAID' ? 'Settled' : 'Payment scheduled post-delivery'}
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-stone-100">
                  <button
                    onClick={() => setViewTx(tx)}
                    className="text-xs font-bold text-stone-700 hover:text-stone-900 flex items-center gap-1"
                  >
                    <span>{t.transactions.viewReceipt}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>

                  <div className="flex items-center gap-2">
                    {/* Step 1: Perform Quality Inspection */}
                    {['ORDER_CREATED', 'QUALITY_VERIFICATION'].includes(tx.status) && (
                      <button
                        onClick={() => openQualityModal(tx)}
                        className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg shadow-sm transition-colors flex items-center gap-1"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>{t.transactions.performQualityCheck}</span>
                      </button>
                    )}

                    {/* Step 2: Dispatch / In Transit */}
                    {tx.status === 'READY_FOR_DELIVERY' && (
                      <button
                        onClick={() => handleAdvanceDelivery(tx.id, 'IN_TRANSIT')}
                        disabled={submittingDelivery}
                        className="px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-lg shadow-sm transition-colors flex items-center gap-1"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        <span>{t.transactions.markInTransit}</span>
                      </button>
                    )}

                    {/* Step 3: Confirm Delivery Receipt */}
                    {tx.status === 'IN_TRANSIT' && (
                      <button
                        onClick={() => handleAdvanceDelivery(tx.id, 'DELIVERED')}
                        disabled={submittingDelivery}
                        className="px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-lg shadow-sm transition-colors flex items-center gap-1"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>{t.transactions.confirmDelivery}</span>
                      </button>
                    )}

                    {/* Step 4: Record Demo Settlement */}
                    {['DELIVERED', 'PAYMENT_PENDING'].includes(tx.status) && (
                      <button
                        onClick={() => openPaymentModal(tx)}
                        className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg shadow-sm transition-colors flex items-center gap-1"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>{t.transactions.recordDemoPayment}</span>
                      </button>
                    )}

                    {/* Emergency Rescue Redirect if Cancelled */}
                    {isCancelled && (
                      <button
                        onClick={() => onNavigate && onNavigate('module6')}
                        className="px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs rounded-lg shadow-sm transition-colors flex items-center gap-1"
                      >
                        <LifeBuoy className="w-3.5 h-3.5" />
                        <span>Route to Emergency Crop Rescue Network</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Quality Verification Modal */}
      {selectedTxForQuality && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-bold text-sm text-stone-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <span>{t.transactions.performQualityCheck}</span>
              </h3>
              <button
                onClick={() => setSelectedTxForQuality(null)}
                className="text-stone-400 hover:text-stone-600"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-stone-600 bg-stone-50 p-2.5 rounded-lg border border-stone-200">
              <span className="font-bold text-stone-900">Order:</span> {selectedTxForQuality.transaction_ref} (
              {selectedTxForQuality.quantity_qtl} Qtl)
            </div>

            <form onSubmit={handleQualitySubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  {t.transactions.inspectionResult} *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAccepted(true)}
                    className={`py-2 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      isAccepted
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/20'
                        : 'border-stone-200 bg-stone-50 text-stone-600'
                    }`}
                  >
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{t.transactions.acceptQuality}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsAccepted(false)}
                    className={`py-2 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      !isAccepted
                        ? 'border-rose-600 bg-rose-50 text-rose-800 ring-2 ring-rose-500/20'
                        : 'border-stone-200 bg-stone-50 text-stone-600'
                    }`}
                  >
                    <XCircle className="w-3.5 h-3.5 text-rose-600" />
                    <span>{t.transactions.rejectQuality}</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  {t.transactions.gradeVerified}
                </label>
                <select
                  value={qualityGrade}
                  onChange={(e) => setQualityGrade(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-hidden bg-white"
                >
                  <option value="Grade A">Grade A (Premium / Export Quality)</option>
                  <option value="Grade B">Grade B (Standard Commercial)</option>
                  <option value="Grade C">Grade C (Processing / Fair Average)</option>
                  <option value="Sub-standard">Sub-standard (Below Tolerance)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  {t.transactions.qtyVerified}
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={qtyVerified}
                  onChange={(e) => setQtyVerified(parseFloat(e.target.value) || 0)}
                  className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-hidden font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  {t.transactions.qualityNotes}
                </label>
                <textarea
                  rows={2}
                  value={qualityNotes}
                  onChange={(e) => setQualityNotes(e.target.value)}
                  placeholder="e.g. Moisture at 11.2%, free of fungal infestation, uniform grain size."
                  className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  {t.transactions.verifierName}
                </label>
                <input
                  type="text"
                  required
                  value={verifierName}
                  onChange={(e) => setVerifierName(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-hidden"
                />
              </div>

              {!isAccepted && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-900 text-xs rounded-lg flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>
                    {t.transactions.emergencyRescueSuggested}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setSelectedTxForQuality(null)}
                  className="px-3 py-1.5 border border-stone-300 rounded-lg text-xs font-bold text-stone-700 hover:bg-stone-50"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  disabled={submittingQuality}
                  className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-sm disabled:opacity-50"
                >
                  {submittingQuality ? t.common.saving : t.common.submit}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Settlement Modal [DEMO] */}
      {selectedTxForPayment && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-bold text-sm text-stone-900 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-700" />
                <span>{t.transactions.recordDemoPayment}</span>
              </h3>
              <button
                onClick={() => setSelectedTxForPayment(null)}
                className="text-stone-400 hover:text-stone-600"
              >
                ✕
              </button>
            </div>

            {/* DEMO Disclaimer Banner */}
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-950 text-xs rounded-lg space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-amber-700" />
                <span>{t.transactions.demoPaymentBadge}</span>
              </div>
              <p className="text-[11px] text-amber-900">
                {t.transactions.demoPaymentDisclaimer}
              </p>
            </div>

            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  {t.transactions.paymentAmount}
                </label>
                <input
                  type="number"
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(parseFloat(e.target.value) || 0)}
                  className="w-full text-sm font-black px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-hidden font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  {t.transactions.paymentMethod}
                </label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-hidden bg-white"
                >
                  <option value="Direct Bank Transfer (NEFT/RTGS)">
                    Direct Bank Transfer (NEFT/RTGS)
                  </option>
                  <option value="Unified Payments Interface (UPI)">
                    Unified Payments Interface (UPI)
                  </option>
                  <option value="APMC Direct Settlement Voucher">
                    APMC Direct Settlement Voucher
                  </option>
                  <option value="Escrow Account Release">Escrow Account Release</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  {t.transactions.paymentReference}
                </label>
                <input
                  type="text"
                  required
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  className="w-full text-xs font-mono px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setSelectedTxForPayment(null)}
                  className="px-3 py-1.5 border border-stone-300 rounded-lg text-xs font-bold text-stone-700 hover:bg-stone-50"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  disabled={submittingPayment}
                  className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-sm disabled:opacity-50"
                >
                  {submittingPayment ? t.common.saving : t.transactions.confirmPayment}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Trade Certificate / Detail Modal */}
      {viewTx && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-bold text-sm text-stone-900 flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-emerald-700" />
                <span>Trade Certificate & Digital Ledger Record</span>
              </h3>
              <button
                onClick={() => setViewTx(null)}
                className="text-stone-400 hover:text-stone-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 bg-stone-50 rounded-lg">
                <span className="text-stone-600 font-medium">Transaction Reference:</span>
                <span className="font-mono font-bold text-stone-900">{viewTx.transaction_ref}</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 border border-stone-200 rounded-lg">
                  <div className="text-[10px] text-stone-500 font-bold uppercase">Agreed Quantity</div>
                  <div className="font-black text-sm text-stone-900 mt-0.5">{viewTx.quantity_qtl} Qtl</div>
                </div>
                <div className="p-2.5 border border-stone-200 rounded-lg">
                  <div className="text-[10px] text-stone-500 font-bold uppercase">Agreed Rate</div>
                  <div className="font-black text-sm text-stone-900 mt-0.5">₹{viewTx.rate_per_qtl} / Qtl</div>
                </div>
                <div className="p-2.5 border border-stone-200 rounded-lg">
                  <div className="text-[10px] text-stone-500 font-bold uppercase">Gross Trade Value</div>
                  <div className="font-black text-sm text-stone-900 mt-0.5">₹{viewTx.gross_amount.toLocaleString('en-IN')}</div>
                </div>
                <div className="p-2.5 border border-stone-200 rounded-lg bg-emerald-50/50">
                  <div className="text-[10px] text-emerald-800 font-bold uppercase">Net Farmer Realisation</div>
                  <div className="font-black text-sm text-emerald-950 mt-0.5">₹{viewTx.net_amount.toLocaleString('en-IN')}</div>
                </div>
              </div>

              {viewTx.quality_verification && (
                <div className="p-3 bg-amber-50/60 border border-amber-200/60 rounded-lg space-y-1">
                  <div className="font-bold text-amber-950 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                    <span>Inspection Certificate: {viewTx.quality_verification.verified_grade}</span>
                  </div>
                  <div className="text-stone-700">
                    Inspected by: {viewTx.quality_verification.verifier_name || 'Inspector'} on{' '}
                    {new Date(viewTx.quality_verification.verification_date).toLocaleDateString()}
                  </div>
                  <div className="text-[11px] text-stone-600 italic">
                    "{viewTx.quality_verification.quality_notes || 'All quality checks passed.'}"
                  </div>
                </div>
              )}

              {viewTx.payment_record && (
                <div className="p-3 bg-emerald-50/60 border border-emerald-200/60 rounded-lg space-y-1">
                  <div className="font-bold text-emerald-950 flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-700" />
                    <span>{language === 'mr' ? 'पेमेंट सेटलमेंट पावती' : language === 'hi' ? 'भुगतान निपटान वाउचर' : 'Payment Settlement Voucher'}</span>
                  </div>
                  <div className="text-stone-700">
                    Mode: {viewTx.payment_record.payment_method} • Ref: {viewTx.payment_record.payment_reference}
                  </div>
                  <div className="text-[10px] text-stone-500">
                    Settled on {new Date(viewTx.payment_record.payment_date).toLocaleString()}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-stone-100">
              <button
                onClick={() => setViewTx(null)}
                className="px-4 py-1.5 bg-stone-900 text-white rounded-lg text-xs font-bold"
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
