import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage, SupportedLanguage } from '../../i18n/LanguageContext';
import { VoiceAssistantModal } from '../common/VoiceAssistantModal';
import { LocationSelector } from '../common/LocationSelector';
import { ExtractedFarmProfile } from '../../services/voiceAssistant';
import {
  Sprout,
  ShieldCheck,
  Handshake,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Mic,
  Languages,
  Lock,
  Phone,
  KeyRound,
  X,
  UserCheck,
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
    <div className="min-h-screen w-full relative flex flex-col justify-between overflow-x-hidden bg-[#153B32]">
      {/* 1. FULL VIEWPORT AGRICULTURAL BACKGROUND VISUAL */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat transition-all duration-1000 scale-100"
        style={{
          backgroundImage: `url('/assets/indian_farm_hero.jpg')`,
        }}
        aria-hidden="true"
      />
      {/* Soft Dark / Forest Gradient Overlay with subtle cream/green tint */}
      <div
        className="fixed inset-0 bg-gradient-to-br from-[#0D261F]/92 via-[#153B32]/82 to-[#24312C]/75 backdrop-blur-[0.5px]"
        aria-hidden="true"
      />

      {/* 2. TOP ELEGANT HEADER */}
      <header className="relative z-20 w-full border-b border-white/10 bg-[#0D261F]/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand Wordmark & Emblem */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#D6A844] flex items-center justify-center text-[#153B32] shadow-md transition-transform hover:scale-105">
              <Sprout className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl sm:text-2xl font-black tracking-tight text-white font-serif block leading-none">
                {t.common.appName}
              </span>
              <span className="text-[10px] sm:text-xs font-semibold text-[#D6A844] tracking-wide block mt-0.5">
                {language === 'mr'
                  ? 'महाराष्ट्र कृषी बाजार व थेट व्यवहार मंच'
                  : language === 'hi'
                  ? 'महाराष्ट्र कृषि बाज़ार एवं प्रत्यक्ष व्यापार मंच'
                  : 'Agricultural Market Linkage Platform'}
              </span>
            </div>
          </div>

          {/* Right Controls: Language Selector + Quick Mode Toggles */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Language Selector */}
            <div className="inline-flex p-1 bg-black/30 rounded-xl border border-white/15 backdrop-blur-md">
              {(['mr', 'hi', 'en'] as SupportedLanguage[]).map((lang) => (
                <button
                  key={`lang-opt-${lang}`}
                  type="button"
                  onClick={() => setLanguage(lang)}
                  className={`px-2.5 sm:px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    language === lang
                      ? 'bg-[#D6A844] text-[#153B32] shadow-sm'
                      : 'text-stone-200 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {lang === 'mr' ? 'मराठी' : lang === 'hi' ? 'हिंदी' : 'English'}
                </button>
              ))}
            </div>

            {/* Quick Header Sign In / Get Started Switcher */}
            <div className="hidden sm:flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setMode('LOGIN');
                  setError(null);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  mode === 'LOGIN'
                    ? 'bg-white text-[#153B32] shadow-sm'
                    : 'text-stone-200 hover:text-white hover:bg-white/10 border border-white/20'
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
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  mode === 'SIGNUP'
                    ? 'bg-[#D6A844] text-[#153B32] shadow-sm font-extrabold'
                    : 'bg-[#D6A844]/90 hover:bg-[#D6A844] text-[#153B32]'
                }`}
              >
                {t.auth.signupButton}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 3. MAIN HERO & AUTHENTICATION COMPOSITION */}
      <main className="relative z-10 flex-1 flex items-center justify-center py-6 sm:py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* LEFT COLUMN: Clean Welcoming Statement & Agricultural Value */}
          <div className="lg:col-span-7 flex flex-col justify-center text-white space-y-5 sm:space-y-6">
            
            {/* Trust Signature */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-stone-200 text-xs backdrop-blur-md w-fit">
              <ShieldCheck className="w-4 h-4 text-[#D6A844]" />
              <span className="font-semibold tracking-wide">
                {language === 'mr'
                  ? 'पारदर्शक कृषी व्यापार मंच'
                  : language === 'hi'
                  ? 'पारदर्शी कृषि व्यापार मंच'
                  : 'Transparent Agricultural Market Linkage'}
              </span>
            </div>

            {/* Main Welcoming Headline */}
            <div className="space-y-2">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-black tracking-tight leading-[1.15] font-serif text-[#F6F1E5]">
                {language === 'mr' ? (
                  <>
                    बाजारभाव जाणून घ्या.<br />
                    तुमची कमाई समजून घ्या.<br />
                    <span className="text-[#D6A844]">आत्मविश्वासाने विक्री करा.</span>
                  </>
                ) : language === 'hi' ? (
                  <>
                    बाज़ार भाव जानें।<br />
                    अपनी कमाई समझें।<br />
                    <span className="text-[#D6A844]">आत्मविश्वास के साथ बेचें।</span>
                  </>
                ) : (
                  <>
                    Know your market.<br />
                    Understand your earnings.<br />
                    <span className="text-[#D6A844]">Sell with confidence.</span>
                  </>
                )}
              </h1>
            </div>

            {/* Welcoming Description */}
            <p className="text-sm sm:text-base text-stone-200/90 max-w-xl leading-relaxed font-normal">
              {language === 'mr'
                ? 'महाराष्ट्रातील सर्व कृषी उत्पन्न बाजार समित्यांचे थेट दर, वाहतूक व हमाली वजा जाता मिळणारा खरा निव्वळ नफा, आणि थेट पडताळणीकृत खरेदीदारांशी पारदर्शक व्यापार.'
                : language === 'hi'
                ? 'महाराष्ट्र की सभी कृषि उपज मंडियों के लाइव भाव, भाड़ा व मंडी खर्च काटकर हाथ में मिलने वाली शुद्ध आय, और सत्यापित खरीदारों के साथ सीधा पारदर्शी व्यापार।'
                : 'Real-time APMC price discovery across Maharashtra, transparent net realization after freight & deductions, and direct linkage with verified buyers.'}
            </p>

            {/* Quick Action Badges */}
            <div className="pt-2 flex flex-wrap items-center gap-3 text-xs text-stone-300">
              <div className="flex items-center gap-2 bg-white/10 border border-white/10 px-3 py-1.5 rounded-xl backdrop-blur-xs">
                <UserCheck className="w-4 h-4 text-[#D6A844]" />
                <span>
                  {language === 'mr'
                    ? 'शेतकरी आणि संस्थात्मक खरेदीदार'
                    : language === 'hi'
                    ? 'किसान और संस्थागत खरीदार'
                    : 'Farmers & Verified Institutional Buyers'}
                </span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 border border-white/10 px-3 py-1.5 rounded-xl backdrop-blur-xs">
                <Sprout className="w-4 h-4 text-[#D6A844]" />
                <span>Maharashtra State Mandis</span>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Polished Authentication / Entry Card */}
          <div className="lg:col-span-5 w-full">
            <div className="bg-[#FDFBF7] text-stone-900 rounded-3xl shadow-2xl border border-stone-200/90 overflow-hidden flex flex-col">
              
              {/* Header Mode Switcher (Sign In vs Get Started) */}
              <div className="grid grid-cols-2 p-1.5 bg-stone-100/90 border-b border-stone-200/80">
                <button
                  type="button"
                  onClick={() => {
                    setMode('LOGIN');
                    setError(null);
                  }}
                  className={`py-2.5 text-xs sm:text-sm font-extrabold rounded-2xl transition-all ${
                    mode === 'LOGIN'
                      ? 'bg-white text-[#153B32] shadow-sm'
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
                  className={`py-2.5 text-xs sm:text-sm font-extrabold rounded-2xl transition-all ${
                    mode === 'SIGNUP'
                      ? 'bg-white text-[#153B32] shadow-sm'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  {t.auth.signupButton}
                </button>
              </div>

              {/* Form Content Area */}
              <div className="p-6 sm:p-8">
                
                {/* Error Banner */}
                {error && (
                  <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2.5 animate-fadeIn">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* 1. SIGN IN FORM */}
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
                          className="w-full pl-10 pr-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm text-stone-900 focus:bg-white focus:ring-2 focus:ring-[#153B32] focus:border-transparent tabular-nums transition-all"
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
                          className="text-xs font-semibold text-[#153B32] hover:underline"
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
                          className="w-full pl-10 pr-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm text-stone-900 focus:bg-white focus:ring-2 focus:ring-[#153B32] focus:border-transparent transition-all"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full mt-2 py-3 px-4 bg-[#153B32] hover:bg-[#0D261F] active:scale-[0.99] text-white font-extrabold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {loading ? t.common.loading : t.auth.loginButton}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>
                )}

                {/* 2. SIGN UP / GET STARTED FORM */}
                {mode === 'SIGNUP' && (
                  <div className="space-y-4">
                    {/* Role Selection (Farmer vs Buyer) */}
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-2">
                        {t.auth.selectRole}
                      </label>
                      <div className="grid grid-cols-2 gap-2.5">
                        <button
                          type="button"
                          onClick={() => setSignupRole('FARMER')}
                          className={`p-3 rounded-2xl border text-left transition-all flex items-center gap-2.5 ${
                            signupRole === 'FARMER'
                              ? 'border-[#153B32] bg-[#EBF1E8] text-[#153B32] font-bold ring-1 ring-[#153B32]'
                              : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                          }`}
                        >
                          <Sprout className="w-5 h-5 text-[#153B32] shrink-0" />
                          <div>
                            <div className="text-xs font-bold">
                              {language === 'mr' ? 'शेतकरी' : language === 'hi' ? 'किसान' : 'Farmer'}
                            </div>
                            <div className="text-[10px] text-stone-600">
                              {language === 'mr'
                                ? 'माझ्या शेतीमालाचे व्यवस्थापन'
                                : language === 'hi'
                                ? 'अपनी उपज का प्रबंधन'
                                : 'Manage produce'}
                            </div>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSignupRole('BUYER')}
                          className={`p-3 rounded-2xl border text-left transition-all flex items-center gap-2.5 ${
                            signupRole === 'BUYER'
                              ? 'border-[#153B32] bg-[#EBF1E8] text-[#153B32] font-bold ring-1 ring-[#153B32]'
                              : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                          }`}
                        >
                          <Handshake className="w-5 h-5 text-[#153B32] shrink-0" />
                          <div>
                            <div className="text-xs font-bold">
                              {language === 'mr' ? 'खरेदीदार' : language === 'hi' ? 'खरीदार' : 'Buyer'}
                            </div>
                            <div className="text-[10px] text-stone-600">
                              {language === 'mr'
                                ? 'कृषी मालाची खरेदी'
                                : language === 'hi'
                                ? 'कृषि उपज खोजें'
                                : 'Procure produce'}
                            </div>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* FARMER REGISTRATION */}
                    {signupRole === 'FARMER' && (
                      <form onSubmit={handleFarmerSignupSubmit} className="space-y-3">
                        {/* Voice Assistant Auto-fill Banner */}
                        <div className="p-3 bg-gradient-to-r from-emerald-50 to-amber-50 border border-emerald-300/80 rounded-2xl flex items-center justify-between gap-3 shadow-2xs">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-[#153B32] text-white flex items-center justify-center shrink-0">
                              <Mic className="w-4 h-4 text-[#D6A844] animate-pulse" />
                            </div>
                            <div>
                              <div className="text-xs font-bold text-[#0D261F]">
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
                            className="shrink-0 px-3 py-1.5 bg-[#153B32] hover:bg-[#0D261F] active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all"
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
                            className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:bg-white focus:ring-2 focus:ring-[#153B32]"
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
                              className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 tabular-nums focus:bg-white focus:ring-2 focus:ring-[#153B32]"
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
                              className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:bg-white focus:ring-2 focus:ring-[#153B32]"
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
                              className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:bg-white focus:ring-2 focus:ring-[#153B32]"
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
                              className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:bg-white focus:ring-2 focus:ring-[#153B32]"
                            />
                          </div>
                        </div>

                        {/* Location Selector */}
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
                              className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:bg-white focus:ring-2 focus:ring-[#153B32]"
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
                              className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:bg-white focus:ring-2 focus:ring-[#153B32]"
                            />
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={loading}
                          className="w-full mt-3 py-3 px-4 bg-[#153B32] hover:bg-[#0D261F] text-white font-extrabold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {loading ? t.common.saving : t.auth.signupButton}
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                      </form>
                    )}

                    {/* BUYER REGISTRATION */}
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
                            className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:bg-white focus:ring-2 focus:ring-[#153B32]"
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
                              className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:bg-white focus:ring-2 focus:ring-[#153B32]"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-stone-700 mb-1">
                              {t.buyerSignup.buyerType} *
                            </label>
                            <select
                              value={buyerData.buyerType}
                              onChange={(e) => setBuyerData({ ...buyerData, buyerType: e.target.value })}
                              className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:bg-white focus:ring-2 focus:ring-[#153B32]"
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
                              className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 tabular-nums focus:bg-white focus:ring-2 focus:ring-[#153B32]"
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
                              className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:bg-white focus:ring-2 focus:ring-[#153B32]"
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
                              className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:bg-white focus:ring-2 focus:ring-[#153B32]"
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
                              className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:bg-white focus:ring-2 focus:ring-[#153B32]"
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
                          className="w-full mt-3 py-3 px-4 bg-[#153B32] hover:bg-[#0D261F] text-white font-extrabold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
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
      </main>

      {/* 4. FOOTER NOTE */}
      <footer className="relative z-10 py-3 text-center text-xs text-stone-300/80 border-t border-white/10 bg-[#0D261F]/40 backdrop-blur-xs">
        <p>© 2026 {t.common.appName}. {language === 'mr' ? 'शेतकरी व खरेदीदारांसाठी पारदर्शक कृषी व्यापार.' : language === 'hi' ? 'किसानों और खरीदारों के लिए पारदर्शी कृषि व्यापार।' : 'Empowering Agricultural Communities with Transparent Price Discovery.'}</p>
      </footer>

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
              <div className="flex items-center gap-2 text-[#153B32]">
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
                  className="w-full py-2.5 bg-[#153B32] text-white font-bold text-xs rounded-xl"
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
                    className="flex-1 py-2.5 bg-[#153B32] hover:bg-[#0D261F] text-white text-xs font-bold rounded-xl"
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
