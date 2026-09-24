import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage, SupportedLanguage } from '../../i18n/LanguageContext';
import { VoiceAssistantModal } from '../common/VoiceAssistantModal';
import { LocationSelector } from '../common/LocationSelector';
import { ExtractedFarmProfile } from '../../services/voiceAssistant';
import {
  Sprout,
  ShieldCheck,
  TrendingUp,
  Scale,
  Users,
  Handshake,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Mic,
  Languages,
  Sparkles,
  Lock,
  Phone,
  Building2,
  MapPin,
  HelpCircle,
  KeyRound,
  X,
} from 'lucide-react';

export const AuthScreen: React.FC = () => {
  const { login, registerFarmer, registerBuyer } = useAuth();
  const { t, language, setLanguage } = useLanguage();

  const [mode, setMode] = useState<'LOGIN' | 'SIGNUP'>('LOGIN');
  const [signupRole, setSignupRole] = useState<'FARMER' | 'BUYER'>('FARMER');
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [forgotPasswordSubmitted, setForgotPasswordSubmitted] = useState(false);
  const [forgotMobile, setForgotMobile] = useState('');

  // Login form state
  const [loginMobile, setLoginMobile] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Farmer signup state
  const [farmerData, setFarmerData] = useState({
    fullName: '',
    mobile: '',
    password: '',
    confirmPassword: '',
    state: 'Maharashtra',
    district: '',
    taluka: '',
    village: '',
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
    placeId: '',
    preferredLanguage: language,
    email: '',
    address: '',
    landArea: '',
    primaryCrop: '',
  });

  // Buyer signup state
  const [buyerData, setBuyerData] = useState({
    businessName: '',
    contactPerson: '',
    mobile: '',
    password: '',
    confirmPassword: '',
    buyerType: 'Processor',
    state: 'Maharashtra',
    district: '',
    deliveryLocation: '',
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
    email: '',
    gstin: '',
    address: '',
    website: '',
    paymentTerms: 'Immediate via RTGS / NEFT',
  });

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!/^\d{10}$/.test(loginMobile.trim())) {
      setError(t.auth.invalidMobile);
      return;
    }
    if (loginPassword.length < 6) {
      setError(t.auth.passwordTooShort);
      return;
    }

    setLoading(true);
    try {
      await login(loginMobile.trim(), loginPassword);
    } catch (err: any) {
      setError(err.message || t.auth.loginFailed);
    } finally {
      setLoading(false);
    }
  };

  const handleFarmerSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (
      !farmerData.fullName ||
      !farmerData.mobile ||
      !farmerData.password ||
      !farmerData.village ||
      !farmerData.district
    ) {
      setError(t.common.error + ': ' + t.common.required);
      return;
    }

    if (!/^\d{10}$/.test(farmerData.mobile.trim())) {
      setError(t.auth.invalidMobile);
      return;
    }

    if (farmerData.password.length < 6) {
      setError(t.auth.passwordTooShort);
      return;
    }

    if (farmerData.password !== farmerData.confirmPassword) {
      setError(t.auth.passwordsDoNotMatch);
      return;
    }

    setLoading(true);
    try {
      await registerFarmer({
        ...farmerData,
        preferredLanguage: language,
      });
      try {
        sessionStorage.setItem('krishivaani_new_signup', 'true');
      } catch (_) {}
    } catch (err: any) {
      setError(err.message || t.common.error);
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceProfileApplied = (extracted: ExtractedFarmProfile) => {
    setFarmerData((prev) => ({
      ...prev,
      fullName: extracted.fullName || prev.fullName,
      district: extracted.district || prev.district,
      village: extracted.village || prev.village,
      taluka: extracted.taluka || prev.taluka,
      landArea: extracted.landArea || prev.landArea,
      primaryCrop: extracted.primaryCrop || prev.primaryCrop,
    }));
  };

  const handleBuyerSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (
      !buyerData.businessName ||
      !buyerData.contactPerson ||
      !buyerData.mobile ||
      !buyerData.password ||
      !buyerData.deliveryLocation
    ) {
      setError(t.common.error + ': ' + t.common.required);
      return;
    }

    if (!/^\d{10}$/.test(buyerData.mobile.trim())) {
      setError(t.auth.invalidMobile);
      return;
    }

    if (buyerData.password.length < 6) {
      setError(t.auth.passwordTooShort);
      return;
    }

    if (buyerData.password !== buyerData.confirmPassword) {
      setError(t.auth.passwordsDoNotMatch);
      return;
    }

    setLoading(true);
    try {
      await registerBuyer(buyerData);
    } catch (err: any) {
      setError(err.message || t.common.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] w-full bg-[#FAF8F5] flex flex-col justify-center">
      {/* Main Two-Column Hero Container */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10 flex-1 flex items-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* LEFT COLUMN: Agricultural Brand Hero Showcase (55% on desktop) */}
          <div className="lg:col-span-7 flex flex-col justify-between h-full">
            <div className="relative rounded-3xl overflow-hidden shadow-xl border border-stone-200/80 bg-stone-900 min-h-[380px] lg:min-h-[560px] flex flex-col justify-between p-6 sm:p-10 text-white">
              {/* Agricultural Background Photo */}
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 scale-105"
                style={{
                  backgroundImage: `url('/assets/indian_farm_hero.jpg')`,
                }}
              />
              {/* Warm Dark Forest Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-tr from-[#0F2821]/95 via-[#173D32]/85 to-[#24312C]/60 backdrop-blur-[0.5px]" />

              {/* Top Hero Brand Header */}
              <div className="relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-[#D6A844] flex items-center justify-center text-[#173D32] shadow-md">
                    <Sprout className="w-6 h-6" />
                  </div>
                  <div>
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white font-serif">
                      {t.common.appName}
                    </h1>
                    <span className="text-xs sm:text-sm font-semibold text-[#D6A844] tracking-wide block mt-0.5">
                      {language === 'mr'
                        ? 'महाराष्ट्र कृषी बाजार व थेट व्यवहार मंच'
                        : language === 'hi'
                        ? 'महाराष्ट्र कृषि बाज़ार एवं प्रत्यक्ष व्यापार मंच'
                        : 'Digital Agricultural Market Linkage Platform'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Center Hero Tagline & Core Pillars */}
              <div className="relative z-10 my-6 sm:my-8 max-w-xl">
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-[#F6F1E5] leading-snug">
                  {t.common.appTagline}
                </h2>
                <p className="mt-3 text-xs sm:text-sm text-stone-200/90 leading-relaxed font-normal">
                  {language === 'mr'
                    ? 'महाराष्ट्रातील सर्व कृषी उत्पन्न बाजार समित्यांचे थेट दर, वाहतूक व हमाली वजा जाता मिळणारा खरा निव्वळ नफा, आणि थेट संस्थात्मक खरेदीदारांशी पारदर्शक व्यापार.'
                    : language === 'hi'
                    ? 'महाराष्ट्र की सभी कृषि उपज मंडियों के लाइव भाव, भाड़ा व मंडी खर्च काटकर हाथ में मिलने वाली शुद्ध आय, और संस्थागत खरीदारों से सीधी बिक्री।'
                    : 'Real-time APMC price discovery across Maharashtra, transparent net realization after freight & deductions, and direct linkage with verified buyers.'}
                </p>

                {/* 3 Key Trust Pillars */}
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/15">
                    <TrendingUp className="w-5 h-5 text-[#D6A844] mb-1.5" />
                    <div className="text-xs font-bold text-white">
                      {language === 'mr' ? 'थेट बाजारभाव' : language === 'hi' ? 'लाइव मंडी भाव' : 'Live Mandi Rates'}
                    </div>
                    <div className="text-[11px] text-stone-300">
                      {language === 'mr' ? '३६ जिल्ह्यांचे भाव' : language === 'hi' ? '36 जिलों के भाव' : '36 Districts APMC'}
                    </div>
                  </div>

                  <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/15">
                    <Scale className="w-5 h-5 text-[#D6A844] mb-1.5" />
                    <div className="text-xs font-bold text-white">
                      {language === 'mr' ? 'निव्वळ नफा अंदाज' : language === 'hi' ? 'शुद्ध आय गणना' : 'Net Realisation'}
                    </div>
                    <div className="text-[11px] text-stone-300">
                      {language === 'mr' ? 'हातात येणारा खरा दर' : language === 'hi' ? 'हाथ में शुद्ध बचत' : 'True in-hand profit'}
                    </div>
                  </div>

                  <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/15">
                    <Handshake className="w-5 h-5 text-[#D6A844] mb-1.5" />
                    <div className="text-xs font-bold text-white">
                      {language === 'mr' ? 'थेट खरेदीदार' : language === 'hi' ? 'सीधे खरीदार' : 'Direct Buyers'}
                    </div>
                    <div className="text-[11px] text-stone-300">
                      {language === 'mr' ? 'स्पर्धात्मक थेट बोली' : language === 'hi' ? 'पारदर्शी बोलियां' : 'Institutional bids'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Trust Badge */}
              <div className="relative z-10 pt-4 border-t border-white/15 flex items-center justify-between text-[11px] text-stone-300">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    {language === 'mr'
                      ? 'प्रमाणित शेतकरी व खरेदीदार नेटवर्क'
                      : language === 'hi'
                      ? 'सत्यापित किसान और खरीदार नेटवर्क'
                      : 'Verified Farmer & Institutional Buyer Network'}
                  </span>
                </div>
                <span className="hidden sm:inline-block font-semibold text-[#D6A844]">
                  Maharashtra State
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Authentication Panel (45% on desktop) */}
          <div className="lg:col-span-5 w-full">
            <div className="bg-white rounded-3xl shadow-xl border border-stone-200/90 overflow-hidden flex flex-col">
              
              {/* Language Selector Top Bar */}
              <div className="px-6 pt-5 pb-3 border-b border-stone-100 flex items-center justify-between bg-[#FDFCF9]">
                <span className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                  <Languages className="w-3.5 h-3.5 text-[#173D32]" />
                  <span>{t.nav.changeLang}:</span>
                </span>
                
                <div className="inline-flex p-1 bg-stone-100 rounded-xl border border-stone-200/80">
                  {(['mr', 'hi', 'en'] as SupportedLanguage[]).map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => setLanguage(lang)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        language === lang
                          ? 'bg-[#173D32] text-white shadow-xs'
                          : 'text-stone-700 hover:text-stone-950 hover:bg-stone-200/60'
                      }`}
                    >
                      {lang === 'mr' ? 'मराठी' : lang === 'hi' ? 'हिंदी' : 'English'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-6 sm:p-8">
                {/* Sign In vs Create Account Tabs */}
                <div className="grid grid-cols-2 p-1 bg-stone-100 rounded-2xl mb-6 border border-stone-200/60">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('LOGIN');
                      setError(null);
                    }}
                    className={`py-2.5 text-xs sm:text-sm font-extrabold rounded-xl transition-all ${
                      mode === 'LOGIN'
                        ? 'bg-white text-[#173D32] shadow-sm'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    {t.auth.loginButton}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('SIGNUP');
                      setError(null);
                    }}
                    className={`py-2.5 text-xs sm:text-sm font-extrabold rounded-xl transition-all ${
                      mode === 'SIGNUP'
                        ? 'bg-white text-[#173D32] shadow-sm'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    {t.auth.signupButton}
                  </button>
                </div>

                {/* Error Banner */}
                {error && (
                  <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2.5 animate-fadeIn">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* 1. LOGIN FORM */}
                {mode === 'LOGIN' && (
                  <form onSubmit={handleLoginSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1.5">
                        {t.auth.mobileNumber}
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                          <Phone className="w-4 h-4" />
                        </div>
                        <input
                          type="tel"
                          required
                          maxLength={10}
                          value={loginMobile}
                          onChange={(e) => setLoginMobile(e.target.value.replace(/\D/g, ''))}
                          placeholder={t.auth.mobilePlaceholder}
                          className="w-full pl-10 pr-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm text-stone-900 focus:bg-white focus:ring-2 focus:ring-[#173D32] focus:border-transparent tabular-nums transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-bold text-stone-700">
                          {t.auth.password}
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setShowForgotPasswordModal(true);
                            setForgotMobile(loginMobile);
                            setForgotPasswordSubmitted(false);
                          }}
                          className="text-xs font-semibold text-[#173D32] hover:underline"
                        >
                          {language === 'mr'
                            ? 'पासवर्ड विसरलात?'
                            : language === 'hi'
                            ? 'पासवर्ड भूल गए?'
                            : 'Forgot password?'}
                        </button>
                      </div>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                          <Lock className="w-4 h-4" />
                        </div>
                        <input
                          type="password"
                          required
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          placeholder={t.auth.passwordPlaceholder}
                          className="w-full pl-10 pr-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm text-stone-900 focus:bg-white focus:ring-2 focus:ring-[#173D32] focus:border-transparent transition-all"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full mt-2 py-3 px-4 bg-[#173D32] hover:bg-[#0F2821] active:scale-[0.99] text-white font-extrabold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {loading ? t.common.loading : t.auth.loginButton}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>
                )}

                {/* 2. SIGNUP FORM */}
                {mode === 'SIGNUP' && (
                  <div className="space-y-4">
                    {/* Role Selection */}
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-2">
                        {t.auth.selectRole}
                      </label>
                      <div className="grid grid-cols-2 gap-2.5">
                        <button
                          type="button"
                          onClick={() => setSignupRole('FARMER')}
                          className={`p-3 rounded-xl border text-left transition-all flex items-center gap-2.5 ${
                            signupRole === 'FARMER'
                              ? 'border-[#173D32] bg-[#EBF1E8] text-[#173D32] font-bold ring-1 ring-[#173D32]'
                              : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                          }`}
                        >
                          <Sprout className="w-5 h-5 text-[#173D32] shrink-0" />
                          <div>
                            <div className="text-xs font-bold">
                              {language === 'mr' ? 'शेतकरी' : language === 'hi' ? 'किसान' : 'Farmer'}
                            </div>
                            <div className="text-[10px] text-stone-600">
                              {language === 'mr'
                                ? 'माझ्या शेतीमालाचे व्यवस्थापन करा'
                                : language === 'hi'
                                ? 'अपनी उपज का प्रबंधन करें'
                                : 'Manage my produce'}
                            </div>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSignupRole('BUYER')}
                          className={`p-3 rounded-xl border text-left transition-all flex items-center gap-2.5 ${
                            signupRole === 'BUYER'
                              ? 'border-[#173D32] bg-[#EBF1E8] text-[#173D32] font-bold ring-1 ring-[#173D32]'
                              : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                          }`}
                        >
                          <Handshake className="w-5 h-5 text-[#173D32] shrink-0" />
                          <div>
                            <div className="text-xs font-bold">
                              {language === 'mr' ? 'खरेदीदार' : language === 'hi' ? 'खरीदार' : 'Buyer'}
                            </div>
                            <div className="text-[10px] text-stone-600">
                              {language === 'mr'
                                ? 'कृषी मालाची खरेदी करा'
                                : language === 'hi'
                                ? 'कृषि उपज खोजें'
                                : 'Find agricultural produce'}
                            </div>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* FARMER SIGNUP */}
                    {signupRole === 'FARMER' && (
                      <form onSubmit={handleFarmerSignupSubmit} className="space-y-3">
                        {/* Voice Assistant Auto-fill Banner */}
                        <div className="p-3 bg-gradient-to-r from-emerald-50 to-amber-50 border border-emerald-300/80 rounded-2xl flex items-center justify-between gap-3 shadow-2xs">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-[#173D32] text-white flex items-center justify-center shrink-0">
                              <Mic className="w-4 h-4 text-[#D6A844] animate-pulse" />
                            </div>
                            <div>
                              <div className="text-xs font-bold text-[#0F2821]">
                                {t.voice.speakFarmDetails}
                              </div>
                              <div className="text-[10px] text-stone-600">
                                {language === 'mr'
                                  ? 'माहिती बोलून फॉर्म आपोआप भरण्यासाठी दाबा'
                                  : language === 'hi'
                                  ? 'बोलकर फॉर्म भरने के लिए दबाएं'
                                  : 'Speak to auto-fill registration'}
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowVoiceModal(true)}
                            className="shrink-0 px-3 py-1.5 bg-[#173D32] hover:bg-[#0F2821] active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all"
                          >
                            <Mic className="w-3.5 h-3.5 text-[#D6A844]" />
                            <span>{t.voice.tapToSpeak}</span>
                          </button>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-stone-700 mb-1">
                            {t.farmerSignup.fullName} *
                          </label>
                          <input
                            type="text"
                            required
                            value={farmerData.fullName}
                            onChange={(e) => setFarmerData({ ...farmerData, fullName: e.target.value })}
                            placeholder={t.farmerSignup.fullNamePlaceholder}
                            className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:bg-white"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <div>
                            <label className="block text-xs font-bold text-stone-700 mb-1">
                              {t.auth.mobileNumber} *
                            </label>
                            <input
                              type="tel"
                              required
                              maxLength={10}
                              value={farmerData.mobile}
                              onChange={(e) =>
                                setFarmerData({ ...farmerData, mobile: e.target.value.replace(/\D/g, '') })
                              }
                              placeholder={t.auth.mobilePlaceholder}
                              className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 tabular-nums focus:bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-stone-700 mb-1">
                              {t.farmerSignup.email}
                            </label>
                            <input
                              type="email"
                              value={farmerData.email}
                              onChange={(e) => setFarmerData({ ...farmerData, email: e.target.value })}
                              placeholder="name@email.com"
                              className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:bg-white"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <div>
                            <label className="block text-xs font-bold text-stone-700 mb-1">
                              {t.auth.password} *
                            </label>
                            <input
                              type="password"
                              required
                              value={farmerData.password}
                              onChange={(e) => setFarmerData({ ...farmerData, password: e.target.value })}
                              placeholder={t.auth.passwordPlaceholder}
                              className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-stone-700 mb-1">
                              {t.auth.confirmPassword} *
                            </label>
                            <input
                              type="password"
                              required
                              value={farmerData.confirmPassword}
                              onChange={(e) =>
                                setFarmerData({ ...farmerData, confirmPassword: e.target.value })
                              }
                              placeholder={t.auth.confirmPassword}
                              className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:bg-white"
                            />
                          </div>
                        </div>

                        {/* Dynamic Location Selector */}
                        <div>
                          <label className="block text-xs font-bold text-stone-700 mb-1.5">
                            {t.farmerSignup.state} / {t.farmerSignup.district} / {t.farmerSignup.village} *
                          </label>
                          <LocationSelector
                            valueDistrict={farmerData.district}
                            valueTaluka={farmerData.taluka}
                            valueVillage={farmerData.village}
                            valueLat={farmerData.latitude}
                            valueLon={farmerData.longitude}
                            onChange={(loc) => {
                              setFarmerData((prev) => ({
                                ...prev,
                                district: loc.district,
                                taluka: loc.taluka || '',
                                village: loc.village || prev.village,
                                latitude: loc.latitude,
                                longitude: loc.longitude,
                                placeId: loc.placeId || '',
                              }));
                            }}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2.5">
                          <div>
                            <label className="block text-xs font-bold text-stone-700 mb-1">
                              {t.farmerSignup.landArea}
                            </label>
                            <input
                              type="text"
                              value={farmerData.landArea}
                              onChange={(e) => setFarmerData({ ...farmerData, landArea: e.target.value })}
                              placeholder="e.g. 3 Acres"
                              className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-stone-700 mb-1">
                              {t.farmerSignup.primaryCrop}
                            </label>
                            <input
                              type="text"
                              value={farmerData.primaryCrop}
                              onChange={(e) =>
                                setFarmerData({ ...farmerData, primaryCrop: e.target.value })
                              }
                              placeholder="e.g. Onion, Tomato"
                              className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:bg-white"
                            />
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={loading}
                          className="w-full mt-3 py-3 px-4 bg-[#173D32] hover:bg-[#0F2821] text-white font-extrabold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {loading ? t.common.saving : t.auth.signupButton}
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                      </form>
                    )}

                    {/* BUYER SIGNUP */}
                    {signupRole === 'BUYER' && (
                      <form onSubmit={handleBuyerSignupSubmit} className="space-y-3">
                        <div>
                          <label className="block text-xs font-bold text-stone-700 mb-1">
                            {t.buyerSignup.businessName} *
                          </label>
                          <input
                            type="text"
                            required
                            value={buyerData.businessName}
                            onChange={(e) => setBuyerData({ ...buyerData, businessName: e.target.value })}
                            placeholder={t.buyerSignup.businessNamePlaceholder}
                            className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:bg-white"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2.5">
                          <div>
                            <label className="block text-xs font-bold text-stone-700 mb-1">
                              {t.buyerSignup.contactPerson} *
                            </label>
                            <input
                              type="text"
                              required
                              value={buyerData.contactPerson}
                              onChange={(e) =>
                                setBuyerData({ ...buyerData, contactPerson: e.target.value })
                              }
                              placeholder={t.buyerSignup.contactPersonPlaceholder}
                              className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-stone-700 mb-1">
                              {t.buyerSignup.buyerType} *
                            </label>
                            <select
                              value={buyerData.buyerType}
                              onChange={(e) => setBuyerData({ ...buyerData, buyerType: e.target.value })}
                              className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:bg-white"
                            >
                              <option value="Processor">{t.buyerSignup.buyerTypeProcessor}</option>
                              <option value="Wholesaler">{t.buyerSignup.buyerTypeWholesaler}</option>
                              <option value="Retailer">{t.buyerSignup.buyerTypeRetailer}</option>
                              <option value="Food Business">{t.buyerSignup.buyerTypeFoodBusiness}</option>
                              <option value="Institutional">{t.buyerSignup.buyerTypeInstitutional}</option>
                              <option value="Other">{t.buyerSignup.buyerTypeOther}</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2.5">
                          <div>
                            <label className="block text-xs font-bold text-stone-700 mb-1">
                              {t.auth.mobileNumber} *
                            </label>
                            <input
                              type="tel"
                              required
                              maxLength={10}
                              value={buyerData.mobile}
                              onChange={(e) =>
                                setBuyerData({ ...buyerData, mobile: e.target.value.replace(/\D/g, '') })
                              }
                              placeholder={t.auth.mobilePlaceholder}
                              className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 tabular-nums focus:bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-stone-700 mb-1">
                              {t.farmerSignup.email}
                            </label>
                            <input
                              type="email"
                              value={buyerData.email}
                              onChange={(e) => setBuyerData({ ...buyerData, email: e.target.value })}
                              placeholder="procurement@company.com"
                              className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:bg-white"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2.5">
                          <div>
                            <label className="block text-xs font-bold text-stone-700 mb-1">
                              {t.auth.password} *
                            </label>
                            <input
                              type="password"
                              required
                              value={buyerData.password}
                              onChange={(e) => setBuyerData({ ...buyerData, password: e.target.value })}
                              placeholder={t.auth.passwordPlaceholder}
                              className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-stone-700 mb-1">
                              {t.auth.confirmPassword} *
                            </label>
                            <input
                              type="password"
                              required
                              value={buyerData.confirmPassword}
                              onChange={(e) =>
                                setBuyerData({ ...buyerData, confirmPassword: e.target.value })
                              }
                              placeholder={t.auth.confirmPassword}
                              className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:bg-white"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-stone-700 mb-1.5">
                            {t.buyerSignup.deliveryLocation} / {t.buyerSignup.district} *
                          </label>
                          <LocationSelector
                            valueDistrict={buyerData.district}
                            valueVillage={buyerData.deliveryLocation}
                            valueLat={buyerData.latitude}
                            valueLon={buyerData.longitude}
                            onChange={(loc) => {
                              setBuyerData((prev) => ({
                                ...prev,
                                district: loc.district,
                                deliveryLocation: loc.village || loc.taluka || loc.district,
                                latitude: loc.latitude,
                                longitude: loc.longitude,
                              }));
                            }}
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={loading}
                          className="w-full mt-3 py-3 px-4 bg-[#173D32] hover:bg-[#0F2821] text-white font-extrabold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {loading ? t.common.saving : t.auth.signupButton}
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                      </form>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
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

      {/* Forgot Password Modal */}
      {showForgotPasswordModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-stone-200 overflow-hidden p-6 sm:p-8 animate-fadeIn">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-[#173D32]">
                <KeyRound className="w-5 h-5" />
                <h3 className="font-extrabold text-base">
                  {language === 'mr'
                    ? 'पासवर्ड रीसेट करा'
                    : language === 'hi'
                    ? 'पासवर्ड रीसेट करें'
                    : 'Reset Password'}
                </h3>
              </div>
              <button
                onClick={() => setShowForgotPasswordModal(false)}
                className="text-stone-400 hover:text-stone-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {forgotPasswordSubmitted ? (
              <div className="text-center py-4 space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <p className="text-xs text-stone-700">
                  {language === 'mr'
                    ? 'नोंदणीकृत मोबाईल क्रमांकावर तात्पुरता पासवर्ड पाठवला आहे.'
                    : language === 'hi'
                    ? 'पंजीकृत मोबाइल नंबर पर अस्थायी पासवर्ड भेज दिया गया है।'
                    : 'A temporary reset PIN has been sent to your registered mobile number.'}
                </p>
                <button
                  onClick={() => setShowForgotPasswordModal(false)}
                  className="w-full py-2.5 bg-[#173D32] text-white font-bold text-xs rounded-xl"
                >
                  {t.common.close}
                </button>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setForgotPasswordSubmitted(true);
                }}
                className="space-y-4"
              >
                <p className="text-xs text-stone-600">
                  {language === 'mr'
                    ? 'आपला १० अंकी नोंदणीकृत मोबाईल नंबर टाका:'
                    : language === 'hi'
                    ? 'अपना 10 अंकों का पंजीकृत मोबाइल नंबर दर्ज करें:'
                    : 'Enter your 10-digit registered mobile number:'}
                </p>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  value={forgotMobile}
                  onChange={(e) => setForgotMobile(e.target.value.replace(/\D/g, ''))}
                  placeholder={t.auth.mobilePlaceholder}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm tabular-nums"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotPasswordModal(false)}
                    className="flex-1 py-2.5 border border-stone-300 text-stone-700 text-xs font-bold rounded-xl"
                  >
                    {t.common.cancel}
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-[#173D32] hover:bg-[#0F2821] text-white text-xs font-bold rounded-xl"
                  >
                    {language === 'mr' ? 'ओटीपी पाठवा' : language === 'hi' ? 'ओटीपी भेजें' : 'Send OTP'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
