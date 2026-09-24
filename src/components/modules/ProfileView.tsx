import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage, SupportedLanguage } from '../../i18n/LanguageContext';
import { api } from '../../services/api';
import { VoiceAssistantModal } from '../common/VoiceAssistantModal';
import { LocationSelector } from '../common/LocationSelector';
import { ExtractedFarmProfile } from '../../services/voiceAssistant';
import {
  User as UserIcon,
  MapPin,
  Phone,
  Mail,
  Building,
  Sprout,
  CheckCircle2,
  Edit3,
  Save,
  X,
  RefreshCw,
  AlertCircle,
  FileCheck,
  Mic,
} from 'lucide-react';

export const ProfileView: React.FC = () => {
  const { user, profile, refreshMe } = useAuth();
  const { t, language, setLanguage } = useLanguage();

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Common Fields
  const [email, setEmail] = useState('');
  const [district, setDistrict] = useState('');
  const [state, setState] = useState('Maharashtra');
  const [address, setAddress] = useState('');

  // Farmer Specific Fields
  const [fullName, setFullName] = useState('');
  const [village, setVillage] = useState('');
  const [taluka, setTaluka] = useState('');
  const [landArea, setLandArea] = useState<number | string>('');
  const [primaryCrop, setPrimaryCrop] = useState('');
  const [latitude, setLatitude] = useState<number | undefined>(undefined);
  const [longitude, setLongitude] = useState<number | undefined>(undefined);
  const [showVoiceModal, setShowVoiceModal] = useState(false);

  // Buyer Specific Fields
  const [businessName, setBusinessName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [buyerType, setBuyerType] = useState('Food Processor');
  const [deliveryLocation, setDeliveryLocation] = useState('');
  const [gstin, setGstin] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('100% Escrow on Dispatch');

  useEffect(() => {
    if (user) {
      setEmail(user.email || '');
    }
    if (profile) {
      if ('full_name' in profile) {
        setFullName(profile.full_name || '');
        setVillage(profile.village || '');
        setTaluka(profile.taluka || '');
        setDistrict(profile.district || '');
        setState(profile.state || 'Maharashtra');
        setAddress(profile.address || '');
        setLandArea(profile.land_area_acres || '');
        setPrimaryCrop(profile.primary_crop || '');
        if ((profile as any).latitude) setLatitude((profile as any).latitude);
        if ((profile as any).longitude) setLongitude((profile as any).longitude);
      } else if ('business_name' in profile) {
        setBusinessName(profile.business_name || '');
        setContactPerson(profile.contact_person || '');
        setBuyerType(profile.buyer_type || 'Food Processor');
        setDeliveryLocation(profile.delivery_location || '');
        setGstin(profile.gstin || '');
        setDistrict(profile.district || '');
        setState(profile.state || 'Maharashtra');
        setAddress(profile.address || '');
        setPaymentTerms(profile.payment_terms || '100% Escrow on Dispatch');
      }
    }
  }, [user, profile]);

  if (!user) return null;

  const isFarmer = user.role === 'FARMER';
  const isBuyer = user.role === 'BUYER';
  const isAdmin = user.role === 'ADMIN';

  const handleLanguageChange = async (newLang: SupportedLanguage) => {
    setLanguage(newLang);
    try {
      await api.updateLanguage(newLang);
      setSuccessMsg(
        newLang === 'mr'
          ? 'भाषा प्राधान्य जतन केले'
          : newLang === 'hi'
          ? 'भाषा प्राथमिकता सहेजी गई'
          : 'Language preference updated'
      );
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleVoiceProfileApplied = (extracted: ExtractedFarmProfile) => {
    if (extracted.fullName) setFullName(extracted.fullName);
    if (extracted.village) setVillage(extracted.village);
    if (extracted.taluka) setTaluka(extracted.taluka);
    if (extracted.district) setDistrict(extracted.district);
    if (extracted.landArea) setLandArea(extracted.landArea);
    if (extracted.primaryCrop) setPrimaryCrop(extracted.primaryCrop);
    setSuccessMsg(
      language === 'mr'
        ? 'आवाजाद्वारे शेती माहिती भरली गेली'
        : language === 'hi'
        ? 'आवाज से खेत विवरण भरा गया'
        : 'Farm details populated from speech'
    );
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const payload: any = {
        email: email.trim() || undefined,
        district: district.trim() || undefined,
        state: state.trim() || undefined,
        address: address.trim() || undefined,
      };

      if (isFarmer) {
        payload.full_name = fullName.trim();
        payload.village = village.trim();
        payload.taluka = taluka.trim();
        payload.land_area_acres = landArea ? Number(landArea) : undefined;
        payload.primary_crop = primaryCrop.trim() || undefined;
        payload.latitude = latitude;
        payload.longitude = longitude;
      } else if (isBuyer) {
        payload.business_name = businessName.trim();
        payload.contact_person = contactPerson.trim();
        payload.buyer_type = buyerType;
        payload.delivery_location = deliveryLocation.trim();
        payload.gstin = gstin.trim() || undefined;
        payload.payment_terms = paymentTerms;
      }

      await api.updateProfile(payload);
      await refreshMe();
      setIsEditing(false);
      setSuccessMsg('Profile updated successfully and synchronized with backend database!');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="border-b border-stone-200 pb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-stone-900 tracking-tight flex items-center gap-2">
            <UserIcon className="w-5 h-5 text-emerald-700" />
            <span>{t.profile.title}</span>
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 mt-1">
            {t.profile.subtitle}
          </p>
        </div>

        {!isEditing && !isAdmin && (
          <button
            onClick={() => setIsEditing(true)}
            className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg shadow-2xs flex items-center gap-1.5"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{t.profile.editProfile}</span>
          </button>
        )}
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs rounded-lg flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Profile Card (View Mode) */}
      {!isEditing ? (
        <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-2xs space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded bg-stone-100 text-stone-800">
                {user.role}
              </span>
              <h3 className="text-lg font-black text-stone-900 mt-2">
                {isFarmer && profile && 'full_name' in profile
                  ? profile.full_name
                  : isBuyer && profile && 'business_name' in profile
                  ? profile.business_name
                  : user.mobile}
              </h3>
              {isBuyer && profile && 'contact_person' in profile && (
                <div className="text-xs text-stone-700 font-semibold mt-0.5">
                  {t.profile.contactPerson}: {profile.contact_person} •{' '}
                  <span className="text-emerald-800 font-bold">{profile.buyer_type}</span>
                </div>
              )}
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              {isFarmer ? <Sprout className="w-6 h-6" /> : <Building className="w-6 h-6" />}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-3 border-t border-stone-100">
            <div className="flex items-center gap-2 text-stone-700">
              <Phone className="w-4 h-4 text-stone-700" />
              <span>
                {t.profile.mobile}: <strong className="text-stone-900 tabular-nums">{user.mobile}</strong>
              </span>
            </div>

            <div className="flex items-center gap-2 text-stone-700">
              <Mail className="w-4 h-4 text-stone-700" />
              <span>
                {t.profile.email}: <strong className="text-stone-900">{user.email || '—'}</strong>
              </span>
            </div>

            {isFarmer && profile && 'village' in profile && (
              <>
                <div className="flex items-center gap-2 text-stone-700 sm:col-span-2">
                  <MapPin className="w-4 h-4 text-stone-700" />
                  <span>
                    {t.profile.village}: <strong className="text-stone-900">{profile.village}</strong>, {t.profile.taluka}:{' '}
                    <strong className="text-stone-900">{profile.taluka}</strong>, {t.profile.district}:{' '}
                    <strong className="text-stone-900">{profile.district}</strong>, {t.profile.state}:{' '}
                    <strong className="text-stone-900">{profile.state}</strong>
                  </span>
                </div>

                <div className="text-stone-700">
                  {t.profile.landArea}:{' '}
                  <strong className="text-stone-900">
                    {profile.land_area_acres ? `${profile.land_area_acres} Acres` : '—'}
                  </strong>
                </div>

                <div className="text-stone-700">
                  {t.profile.primaryCrop}:{' '}
                  <strong className="text-emerald-800 font-bold">
                    {profile.primary_crop || '—'}
                  </strong>
                </div>
              </>
            )}

            {isBuyer && profile && 'delivery_location' in profile && (
              <>
                <div className="flex items-center gap-2 text-stone-700 sm:col-span-2">
                  <MapPin className="w-4 h-4 text-stone-700" />
                  <span>
                    {t.profile.deliveryLocation}:{' '}
                    <strong className="text-stone-900">{profile.delivery_location}</strong> ({profile.district},{' '}
                    {profile.state})
                  </span>
                </div>

                <div className="text-stone-700">
                  {t.profile.gstin}:{' '}
                  <strong className="text-stone-900 font-mono">
                    {profile.gstin || '—'}
                  </strong>
                </div>

                <div className="text-stone-700">
                  {t.profile.paymentTerms}:{' '}
                  <strong className="text-emerald-800 font-bold">{profile.payment_terms}</strong>
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        /* Edit Mode Form */
        <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-stone-200 pb-3">
            <h3 className="text-sm font-bold text-stone-900">
              {t.profile.editProfile}
            </h3>
            <button
              onClick={() => setIsEditing(false)}
              className="text-stone-400 hover:text-stone-700 text-sm font-bold"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            {isFarmer ? (
              <>
                {/* Voice Assistant Shortcut */}
                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-emerald-50 to-amber-50/50 border border-emerald-300 rounded-xl">
                  <div className="flex items-center gap-2">
                    <Mic className="w-4 h-4 text-emerald-700 animate-pulse" />
                    <div>
                      <div className="text-xs font-bold text-emerald-950">
                        {language === 'mr'
                          ? 'बोलून शेती माहिती भरा'
                          : language === 'hi'
                          ? 'बोलकर खेत का विवरण भरें'
                          : 'Speak to populate farm details'}
                      </div>
                      <div className="text-[10px] text-stone-600">
                        {language === 'mr'
                          ? 'माईक दाबून आपले नाव, गाव किंवा पीक बोला'
                          : language === 'hi'
                          ? 'माइक दबाकर नाम, गाँव या फसल बोलें'
                          : 'Tap mic and speak your name, village, land, or crop'}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowVoiceModal(true)}
                    className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
                  >
                    <Mic className="w-3.5 h-3.5 text-amber-300" />
                    <span>{t.voice.tapToSpeak}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      {t.profile.fullName} *
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-3 py-2 border border-stone-300 rounded-md text-xs text-stone-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      {t.profile.email}
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-stone-300 rounded-md text-xs text-stone-900"
                    />
                  </div>
                </div>

                {/* Dynamic Maharashtra Location Selector */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1.5">
                    {t.profile.village} / {t.profile.taluka} / {t.profile.district} *
                  </label>
                  <LocationSelector
                    valueDistrict={district}
                    valueTaluka={taluka}
                    valueVillage={village}
                    valueLat={latitude}
                    valueLon={longitude}
                    onChange={(loc) => {
                      setDistrict(loc.district);
                      if (loc.taluka) setTaluka(loc.taluka);
                      if (loc.village) setVillage(loc.village);
                      setLatitude(loc.latitude);
                      setLongitude(loc.longitude);
                    }}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      {t.profile.landArea}
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0.1"
                      value={landArea}
                      onChange={(e) => setLandArea(e.target.value)}
                      className="w-full px-3 py-2 border border-stone-300 rounded-md text-xs text-stone-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      {t.profile.primaryCrop}
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Onion, Tomato, Soybean"
                      value={primaryCrop}
                      onChange={(e) => setPrimaryCrop(e.target.value)}
                      className="w-full px-3 py-2 border border-stone-300 rounded-md text-xs text-stone-900"
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      {t.profile.businessName} *
                    </label>
                    <input
                      type="text"
                      required
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      className="w-full px-3 py-2 border border-stone-300 rounded-md text-xs text-stone-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      {t.profile.contactPerson} *
                    </label>
                    <input
                      type="text"
                      required
                      value={contactPerson}
                      onChange={(e) => setContactPerson(e.target.value)}
                      className="w-full px-3 py-2 border border-stone-300 rounded-md text-xs text-stone-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      {t.profile.buyerType} *
                    </label>
                    <select
                      value={buyerType}
                      onChange={(e) => setBuyerType(e.target.value)}
                      className="w-full px-3 py-2 border border-stone-300 rounded-md text-xs text-stone-900 bg-white"
                    >
                      <option value="Food Processor">Food Processing Unit</option>
                      <option value="Wholesale Exporter">Wholesale Exporter</option>
                      <option value="Supermarket Retailer">Supermarket / Retail Chain</option>
                      <option value="Bulk Trader">Bulk Trader / Aggregator</option>
                      <option value="Institutional Buyer">Institutional Buyer</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      {t.profile.gstin}
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 27AAAAA0000A1Z5"
                      value={gstin}
                      onChange={(e) => setGstin(e.target.value)}
                      className="w-full px-3 py-2 border border-stone-300 rounded-md text-xs text-stone-900 uppercase font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      {t.profile.deliveryLocation} *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Industrial Area / APMC Warehouse"
                      value={deliveryLocation}
                      onChange={(e) => setDeliveryLocation(e.target.value)}
                      className="w-full px-3 py-2 border border-stone-300 rounded-md text-xs text-stone-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      {t.profile.paymentTerms}
                    </label>
                    <select
                      value={paymentTerms}
                      onChange={(e) => setPaymentTerms(e.target.value)}
                      className="w-full px-3 py-2 border border-stone-300 rounded-md text-xs text-stone-900 bg-white"
                    >
                      <option value="100% Escrow on Dispatch">100% Escrow on Dispatch</option>
                      <option value="Immediate Bank Transfer on Delivery">Immediate Bank Transfer on Delivery</option>
                      <option value="Net 3 Days Post Quality Check">Net 3 Days Post Quality Check</option>
                      <option value="50% Advance + 50% on Delivery">50% Advance + 50% on Delivery</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            <div className="pt-3 border-t border-stone-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-3 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-md"
              >
                {t.common.cancel}
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-md flex items-center gap-1.5 shadow-sm"
              >
                {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>{t.profile.saveChanges}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Language Preference Card */}
      <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-2xs space-y-3">
        <h3 className="text-sm font-bold text-stone-900">
          Preferred Language / पसंतीची भाषा / पसंदीदा भाषा
        </h3>
        <p className="text-xs text-stone-600">
          Select your default interface language for mandi price tickers, transparent matching breakdowns, and advisory decisions.
        </p>

        <div className="grid grid-cols-3 gap-3 pt-2">
          <button
            onClick={() => handleLanguageChange('mr')}
            className={`p-3 rounded-lg border text-center transition-all ${
              language === 'mr'
                ? 'border-emerald-700 bg-emerald-50 text-emerald-900 font-bold'
                : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
            }`}
          >
            <div className="text-base font-bold">मराठी</div>
            <div className="text-[10px] text-stone-700 mt-0.5">महाराष्ट्र कृषी</div>
          </button>

          <button
            onClick={() => handleLanguageChange('hi')}
            className={`p-3 rounded-lg border text-center transition-all ${
              language === 'hi'
                ? 'border-emerald-700 bg-emerald-50 text-emerald-900 font-bold'
                : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
            }`}
          >
            <div className="text-base font-bold">हिन्दी</div>
            <div className="text-[10px] text-stone-700 mt-0.5">राष्ट्रीय भाषा</div>
          </button>

          <button
            onClick={() => handleLanguageChange('en')}
            className={`p-3 rounded-lg border text-center transition-all ${
              language === 'en'
                ? 'border-emerald-700 bg-emerald-50 text-emerald-900 font-bold'
                : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
            }`}
          >
            <div className="text-base font-bold">English</div>
            <div className="text-[10px] text-stone-700 mt-0.5">Standard</div>
          </button>
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
    </div>
  );
};
