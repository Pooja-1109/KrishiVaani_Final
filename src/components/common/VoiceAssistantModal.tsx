/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * KrishiVaani Farmer Real Voice Input Assistant
 * Genuine Web Speech API integration for Marathi (mr-IN), Hindi (hi-IN), and English (en-IN).
 * 
 * - Zero hard-coded transcripts or fake sample responses.
 * - Live microphone stream with real speech recognition.
 * - Confirmation and manual review before populating any form.
 */

import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import {
  isSpeechRecognitionSupported,
  startSpeechRecognition,
  extractFarmProfileFromText,
  extractProduceFromText,
  speakFeedback,
  getVoiceErrorMessage,
  ExtractedFarmProfile,
  ExtractedProduce,
} from '../../services/voiceAssistant';
import { Crop } from '../../types';
import { api } from '../../services/api';
import {
  Mic,
  MicOff,
  Volume2,
  CheckCircle2,
  AlertCircle,
  X,
  Edit3,
  RotateCcw,
  Sparkles,
  Check,
  Languages,
} from 'lucide-react';

interface VoiceAssistantModalProps {
  mode: 'FARM_PROFILE' | 'PRODUCE';
  onClose: () => void;
  onApplyProfile?: (profile: ExtractedFarmProfile) => void;
  onApplyProduce?: (produce: ExtractedProduce) => void;
}

type VoiceState = 'IDLE' | 'LISTENING' | 'PROCESSING' | 'CONFIRMATION' | 'ERROR' | 'UNSUPPORTED';

export const VoiceAssistantModal: React.FC<VoiceAssistantModalProps> = ({
  mode,
  onClose,
  onApplyProfile,
  onApplyProduce,
}) => {
  const { t, language } = useLanguage();
  const [crops, setCrops] = useState<Crop[]>([]);
  const [voiceState, setVoiceState] = useState<VoiceState>('IDLE');
  const [transcript, setTranscript] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [manualEditMode, setManualEditMode] = useState(false);

  // Extracted structured entities
  const [extractedProfile, setExtractedProfile] = useState<ExtractedFarmProfile | null>(null);
  const [extractedProduce, setExtractedProduce] = useState<ExtractedProduce | null>(null);

  // Editable fields during confirmation
  const [editProfile, setEditProfile] = useState<{
    fullName: string;
    state: string;
    district: string;
    taluka: string;
    village: string;
    landArea: string;
    primaryCrop: string;
  }>({
    fullName: '',
    state: 'Maharashtra',
    district: '',
    taluka: '',
    village: '',
    landArea: '',
    primaryCrop: '',
  });

  const [editProduce, setEditProduce] = useState<{
    cropName: string;
    quantityQtl: number | '';
    qualityGrade: string;
    expectedPrice: number | '';
  }>({
    cropName: '',
    quantityQtl: '',
    qualityGrade: 'Grade A',
    expectedPrice: '',
  });

  const stopRecognitionRef = useRef<(() => void) | null>(null);
  const supported = isSpeechRecognitionSupported();

  useEffect(() => {
    api.getCrops().then(setCrops).catch(() => []);
    if (!supported) {
      setVoiceState('UNSUPPORTED');
    }
  }, [supported]);

  // Clean up recognition on unmount
  useEffect(() => {
    return () => {
      if (stopRecognitionRef.current) {
        try {
          stopRecognitionRef.current();
        } catch (_) {}
      }
    };
  }, []);

  const handleStartListening = () => {
    setErrorMessage(null);
    setTranscript('');
    setExtractedProfile(null);
    setExtractedProduce(null);
    setManualEditMode(false);

    if (!supported) {
      setVoiceState('UNSUPPORTED');
      return;
    }

    setVoiceState('LISTENING');

    const stopFn = startSpeechRecognition({
      language,
      onResult: (text, isFinal) => {
        setTranscript(text);
        if (isFinal && text.trim().length > 0) {
          handleProcessSpeech(text);
        }
      },
      onError: (err) => {
        const { message, isPermissionDenied } = getVoiceErrorMessage(err, language);
        if (err === 'no-speech') {
          setVoiceState('IDLE');
          setErrorMessage(message);
        } else {
          setVoiceState('ERROR');
          setErrorMessage(message);
        }
      },
      onEnd: () => {
        // Recognition completed
      },
    });

    stopRecognitionRef.current = stopFn;
  };

  const handleStopListening = () => {
    if (stopRecognitionRef.current) {
      try {
        stopRecognitionRef.current();
      } catch (_) {}
      stopRecognitionRef.current = null;
    }

    if (transcript.trim().length > 0) {
      handleProcessSpeech(transcript);
    } else {
      setVoiceState('IDLE');
    }
  };

  const handleProcessSpeech = (spokenText: string) => {
    setVoiceState('PROCESSING');

    setTimeout(() => {
      if (mode === 'FARM_PROFILE') {
        const result = extractFarmProfileFromText(spokenText, language, crops);
        setExtractedProfile(result);
        setEditProfile({
          fullName: result.fullName || '',
          state: result.state || 'Maharashtra',
          district: result.district || '',
          taluka: result.taluka || '',
          village: result.village || '',
          landArea: result.landArea || '',
          primaryCrop: result.primaryCrop || '',
        });

        // Gentle audible confirmation
        if (result.fullName) {
          const confirmText =
            language === 'mr'
              ? `${result.fullName}, आपली माहिती नोंदवली आहे.`
              : language === 'hi'
              ? `${result.fullName}, आपकी जानकारी प्राप्त हुई है।`
              : `Details recognized for ${result.fullName}.`;
          speakFeedback(confirmText, language);
        }
      } else {
        const result = extractProduceFromText(spokenText, language, crops);
        setExtractedProduce(result);
        setEditProduce({
          cropName: result.cropName || '',
          quantityQtl: result.quantityQtl || '',
          qualityGrade: result.qualityGrade || 'Grade A',
          expectedPrice: result.expectedPrice || '',
        });

        if (result.cropName) {
          const confirmText =
            language === 'mr'
              ? `${result.cropName} पिकाची नोंद झाली.`
              : language === 'hi'
              ? `${result.cropName} फसल की जानकारी मिली।`
              : `${result.cropName} produce detected.`;
          speakFeedback(confirmText, language);
        }
      }

      setVoiceState('CONFIRMATION');
    }, 450);
  };

  const handleConfirmAndApply = () => {
    if (mode === 'FARM_PROFILE') {
      const finalProfile: ExtractedFarmProfile = {
        fullName: editProfile.fullName.trim() || undefined,
        state: editProfile.state || 'Maharashtra',
        district: editProfile.district.trim() || undefined,
        taluka: editProfile.taluka.trim() || undefined,
        village: editProfile.village.trim() || undefined,
        landArea: editProfile.landArea.trim() || undefined,
        primaryCrop: editProfile.primaryCrop.trim() || undefined,
        cropId: extractedProfile?.cropId,
        unrecognizedFields: [],
        rawTranscript: transcript,
      };

      if (onApplyProfile) {
        onApplyProfile(finalProfile);
      }
    } else {
      const finalProduce: ExtractedProduce = {
        cropName: editProduce.cropName.trim() || undefined,
        cropId: extractedProduce?.cropId,
        quantityQtl: typeof editProduce.quantityQtl === 'number' ? editProduce.quantityQtl : undefined,
        qualityGrade: editProduce.qualityGrade,
        expectedPrice: typeof editProduce.expectedPrice === 'number' ? editProduce.expectedPrice : undefined,
        unrecognizedFields: [],
        rawTranscript: transcript,
      };

      if (onApplyProduce) {
        onApplyProduce(finalProduce);
      }
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-800 to-emerald-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-emerald-700 border border-emerald-500/50 flex items-center justify-center text-emerald-200">
              <Mic className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base leading-tight">
                {mode === 'FARM_PROFILE' ? t.voice.speakFarmDetails : t.voice.speakProduceDetails}
              </h3>
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-200 font-medium">
                <Languages className="w-3 h-3" />
                <span>
                  {language === 'mr'
                    ? 'मराठी (mr-IN)'
                    : language === 'hi'
                    ? 'हिंदी (hi-IN)'
                    : 'Indian English (en-IN)'}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-emerald-700 flex items-center justify-center text-emerald-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {/* Unsupported Browser State */}
          {voiceState === 'UNSUPPORTED' && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-3">
              <div className="flex items-start gap-2.5 text-amber-900">
                <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-xs">{t.voice.notSupported}</h4>
                  <p className="text-[11px] text-amber-800 mt-1">
                    {language === 'mr'
                      ? 'आपला ब्राऊझर आवाज ओळखण्यास असमर्थ आहे. आपण माहिती थेट फॉर्ममध्ये लिहून भरू शकता.'
                      : language === 'hi'
                      ? 'आपका ब्राउज़र ध्वनि पहचान का समर्थन नहीं करता है। आप फॉर्म में मैन्युअल रूप से लिख सकते हैं।'
                      : 'Your browser does not support the Web Speech API. You can fill the details manually.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2 bg-amber-800 hover:bg-amber-900 text-white rounded-lg text-xs font-bold transition-colors"
              >
                {t.voice.editManually}
              </button>
            </div>
          )}

          {/* Error Message Box */}
          {voiceState === 'ERROR' && errorMessage && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-stone-800 space-y-3">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="font-semibold block text-amber-950">{errorMessage}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleStartListening}
                  className="px-3.5 py-1.5 bg-emerald-800 text-white font-bold rounded-lg hover:bg-emerald-900 transition-colors flex items-center gap-1.5 text-xs shadow-xs"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>
                    {language === 'mr'
                      ? 'पुन्हा प्रयत्न करा'
                      : language === 'hi'
                      ? 'पुनः प्रयास करें'
                      : 'Try Again'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-1.5 bg-white border border-stone-300 text-stone-800 font-bold rounded-lg hover:bg-stone-50 transition-colors text-xs"
                >
                  {language === 'mr'
                    ? 'स्वतः माहिती भरा'
                    : language === 'hi'
                    ? 'मैन्युअल दर्ज करें'
                    : 'Enter Manually'}
                </button>
              </div>
            </div>
          )}

          {/* Central Microphone / Voice UI States */}
          {voiceState !== 'UNSUPPORTED' && (
            <div className="flex flex-col items-center justify-center text-center py-2">
              <div className="relative mb-3">
                {voiceState === 'LISTENING' && (
                  <div className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-35"></div>
                )}
                <button
                  type="button"
                  onClick={voiceState === 'LISTENING' ? handleStopListening : handleStartListening}
                  className={`relative w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95 ${
                    voiceState === 'LISTENING'
                      ? 'bg-rose-600 hover:bg-rose-700 text-white ring-8 ring-rose-100'
                      : 'bg-emerald-700 hover:bg-emerald-800 text-white ring-8 ring-emerald-50'
                  }`}
                >
                  {voiceState === 'LISTENING' ? (
                    <MicOff className="w-8 h-8" />
                  ) : (
                    <Mic className="w-8 h-8 text-amber-300" />
                  )}
                </button>
              </div>

              {/* Status Header */}
              <div className="text-sm font-bold text-stone-900">
                {voiceState === 'LISTENING'
                  ? t.voice.listening
                  : voiceState === 'PROCESSING'
                  ? t.voice.processing
                  : voiceState === 'CONFIRMATION'
                  ? t.voice.detectedInfo
                  : t.voice.tapToSpeak}
              </div>

              {/* Status Subtitle */}
              <div className="text-xs text-stone-600 mt-1 max-w-sm">
                {voiceState === 'LISTENING' ? (
                  <span className="text-emerald-700 font-semibold animate-pulse">
                    {language === 'mr'
                      ? 'आपण बोलत रहा, सिस्टीम ऐकत आहे...'
                      : language === 'hi'
                      ? 'आप बोलते रहें, सिस्टम सुन रहा है...'
                      : 'Listening to your speech in real-time...'}
                  </span>
                ) : voiceState === 'PROCESSING' ? (
                  <span className="text-amber-800 font-medium">
                    {language === 'mr'
                      ? 'माहिती समजून घेऊन तक्त्यात मांडत आहे...'
                      : language === 'hi'
                      ? 'जानकारी को समझकर तैयार किया जा रहा है...'
                      : 'Structuring extracted farm data...'}
                  </span>
                ) : (
                  <span>
                    {language === 'mr'
                      ? 'मायक्रोफोन दाबा आणि आपले नाव, जिल्हा, गाव, जमीन आणि पीक सांगा.'
                      : language === 'hi'
                      ? 'माइक्रोफ़ोन दबाएं और अपना नाम, जिला, गांव, जमीन और फसल बताएं।'
                      : 'Tap microphone and speak your details naturally.'}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Real Spoken Transcript Preview */}
          {transcript && (
            <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl">
              <div className="text-[10px] font-bold text-stone-600 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-emerald-700" />
                <span>
                  {language === 'mr'
                    ? 'नोंदवलेले बोल (Transcript)'
                    : language === 'hi'
                    ? 'सुने गए बोल (Transcript)'
                    : 'Recognized Speech Transcript'}
                </span>
              </div>
              <p className="text-xs text-stone-900 italic font-medium leading-relaxed">
                "{transcript}"
              </p>
            </div>
          )}

          {/* CONFIRMATION / FIELD REVIEW SECTION */}
          {voiceState === 'CONFIRMATION' && (
            <div className="bg-white border-2 border-emerald-600 rounded-xl p-4 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-stone-200">
                <div className="flex items-center gap-1.5 text-xs font-black text-emerald-950 uppercase tracking-wide">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>
                    {language === 'mr'
                      ? 'माहितीची पडताळणी करा'
                      : language === 'hi'
                      ? 'विवरण की पुष्टि करें'
                      : 'Please Check Your Details'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setManualEditMode(!manualEditMode)}
                  className="text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{manualEditMode ? t.common.view : t.voice.editManually}</span>
                </button>
              </div>

              {/* FARM PROFILE CONFIRMATION TABLE */}
              {mode === 'FARM_PROFILE' && (
                <div className="space-y-2 text-xs">
                  {/* Full Name */}
                  <div className="flex items-center justify-between py-1.5 border-b border-stone-100">
                    <span className="font-semibold text-stone-600">{t.voice.name}:</span>
                    {manualEditMode ? (
                      <input
                        type="text"
                        value={editProfile.fullName}
                        onChange={(e) => setEditProfile({ ...editProfile, fullName: e.target.value })}
                        className="px-2 py-1 border border-stone-300 rounded text-xs text-stone-900 w-44"
                        placeholder={language === 'mr' ? 'उदा. रमेश पाटील' : language === 'hi' ? 'उदा. रमेश पाटिल' : 'e.g. Ramesh Patil'}
                      />
                    ) : editProfile.fullName ? (
                      <span className="font-bold text-stone-900 bg-emerald-50 text-emerald-900 px-2 py-0.5 rounded">
                        {editProfile.fullName}
                      </span>
                    ) : (
                      <span className="text-amber-800 italic bg-amber-50 px-2 py-0.5 rounded text-[11px]">
                        {language === 'mr'
                          ? 'नाव आढळले नाही (आवश्यक)'
                          : language === 'hi'
                          ? 'नाम नहीं मिला (आवश्यक)'
                          : 'Not detected (enter manually)'}
                      </span>
                    )}
                  </div>

                  {/* District */}
                  <div className="flex items-center justify-between py-1.5 border-b border-stone-100">
                    <span className="font-semibold text-stone-600">{t.voice.district}:</span>
                    {manualEditMode ? (
                      <input
                        type="text"
                        value={editProfile.district}
                        onChange={(e) => setEditProfile({ ...editProfile, district: e.target.value })}
                        className="px-2 py-1 border border-stone-300 rounded text-xs text-stone-900 w-44"
                        placeholder={language === 'mr' ? 'उदा. अहमदनगर / पुणे' : language === 'hi' ? 'उदा. अहमदनगर / पुणे' : 'e.g. Ahmednagar / Pune'}
                      />
                    ) : editProfile.district ? (
                      <span className="font-bold text-stone-900 bg-emerald-50 text-emerald-900 px-2 py-0.5 rounded">
                        {editProfile.district}
                      </span>
                    ) : (
                      <span className="text-amber-800 italic bg-amber-50 px-2 py-0.5 rounded text-[11px]">
                        {language === 'mr'
                          ? 'जिल्हा आढळला नाही'
                          : language === 'hi'
                          ? 'जिला नहीं मिला'
                          : 'Not detected'}
                      </span>
                    )}
                  </div>

                  {/* Taluka */}
                  <div className="flex items-center justify-between py-1.5 border-b border-stone-100">
                    <span className="font-semibold text-stone-600">
                      {language === 'mr' ? 'तालुका' : language === 'hi' ? 'तहसील/तालुका' : 'Taluka/Tehsil'}:
                    </span>
                    {manualEditMode ? (
                      <input
                        type="text"
                        value={editProfile.taluka}
                        onChange={(e) => setEditProfile({ ...editProfile, taluka: e.target.value })}
                        className="px-2 py-1 border border-stone-300 rounded text-xs text-stone-900 w-44"
                      />
                    ) : editProfile.taluka ? (
                      <span className="font-bold text-stone-900 bg-emerald-50 text-emerald-900 px-2 py-0.5 rounded">
                        {editProfile.taluka}
                      </span>
                    ) : (
                      <span className="text-stone-400 italic text-[11px]">
                        {language === 'mr' ? 'उल्लेख नाही' : language === 'hi' ? 'उल्लेख नहीं' : 'Not specified'}
                      </span>
                    )}
                  </div>

                  {/* Village */}
                  <div className="flex items-center justify-between py-1.5 border-b border-stone-100">
                    <span className="font-semibold text-stone-600">{t.voice.village}:</span>
                    {manualEditMode ? (
                      <input
                        type="text"
                        value={editProfile.village}
                        onChange={(e) => setEditProfile({ ...editProfile, village: e.target.value })}
                        className="px-2 py-1 border border-stone-300 rounded text-xs text-stone-900 w-44"
                        placeholder={language === 'mr' ? 'उदा. राहुरी' : language === 'hi' ? 'उदा. राहुरी' : 'e.g. Rahuri'}
                      />
                    ) : editProfile.village ? (
                      <span className="font-bold text-stone-900 bg-emerald-50 text-emerald-900 px-2 py-0.5 rounded">
                        {editProfile.village}
                      </span>
                    ) : (
                      <span className="text-amber-800 italic bg-amber-50 px-2 py-0.5 rounded text-[11px]">
                        {language === 'mr'
                          ? 'गाव आढळले नाही'
                          : language === 'hi'
                          ? 'गांव नहीं मिला'
                          : 'Not detected'}
                      </span>
                    )}
                  </div>

                  {/* Land Area */}
                  <div className="flex items-center justify-between py-1.5 border-b border-stone-100">
                    <span className="font-semibold text-stone-600">{t.voice.landArea}:</span>
                    {manualEditMode ? (
                      <input
                        type="text"
                        value={editProfile.landArea}
                        onChange={(e) => setEditProfile({ ...editProfile, landArea: e.target.value })}
                        className="px-2 py-1 border border-stone-300 rounded text-xs text-stone-900 w-44"
                        placeholder={language === 'mr' ? 'उदा. २ एकर' : language === 'hi' ? 'उदा. २ एकड़' : 'e.g. 2 Acres'}
                      />
                    ) : editProfile.landArea ? (
                      <span className="font-bold text-stone-900 bg-emerald-50 text-emerald-900 px-2 py-0.5 rounded">
                        {editProfile.landArea}
                      </span>
                    ) : (
                      <span className="text-stone-400 italic text-[11px]">
                        {language === 'mr' ? 'उल्लेख नाही' : language === 'hi' ? 'उल्लेख नहीं' : 'Not specified'}
                      </span>
                    )}
                  </div>

                  {/* Primary Crop */}
                  <div className="flex items-center justify-between py-1.5">
                    <span className="font-semibold text-stone-600">{t.voice.crop}:</span>
                    {manualEditMode ? (
                      <input
                        type="text"
                        value={editProfile.primaryCrop}
                        onChange={(e) => setEditProfile({ ...editProfile, primaryCrop: e.target.value })}
                        className="px-2 py-1 border border-stone-300 rounded text-xs text-stone-900 w-44"
                        placeholder={language === 'mr' ? 'उदा. कांदा / टोमॅटो' : language === 'hi' ? 'उदा. प्याज / टमाटर' : 'e.g. Onion / Tomato'}
                      />
                    ) : editProfile.primaryCrop ? (
                      <span className="font-bold text-stone-900 bg-emerald-50 text-emerald-900 px-2 py-0.5 rounded">
                        {editProfile.primaryCrop}
                      </span>
                    ) : (
                      <span className="text-amber-800 italic bg-amber-50 px-2 py-0.5 rounded text-[11px]">
                        {language === 'mr'
                          ? 'पीक आढळले नाही'
                          : language === 'hi'
                          ? 'फसल नहीं मिली'
                          : 'Not detected'}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* PRODUCE LOT CONFIRMATION TABLE */}
              {mode === 'PRODUCE' && (
                <div className="space-y-2 text-xs">
                  {/* Crop */}
                  <div className="flex items-center justify-between py-1.5 border-b border-stone-100">
                    <span className="font-semibold text-stone-600">{t.voice.crop}:</span>
                    {manualEditMode ? (
                      <input
                        type="text"
                        value={editProduce.cropName}
                        onChange={(e) => setEditProduce({ ...editProduce, cropName: e.target.value })}
                        className="px-2 py-1 border border-stone-300 rounded text-xs text-stone-900 w-44"
                      />
                    ) : editProduce.cropName ? (
                      <span className="font-bold text-stone-900 bg-emerald-50 text-emerald-900 px-2 py-0.5 rounded">
                        {editProduce.cropName}
                      </span>
                    ) : (
                      <span className="text-amber-800 italic bg-amber-50 px-2 py-0.5 rounded text-[11px]">
                        {language === 'mr' ? 'पीक आढळले नाही' : language === 'hi' ? 'फसल नहीं मिली' : 'Not detected'}
                      </span>
                    )}
                  </div>

                  {/* Quantity */}
                  <div className="flex items-center justify-between py-1.5 border-b border-stone-100">
                    <span className="font-semibold text-stone-600">{t.voice.quantity}:</span>
                    {manualEditMode ? (
                      <input
                        type="number"
                        value={editProduce.quantityQtl}
                        onChange={(e) =>
                          setEditProduce({ ...editProduce, quantityQtl: parseFloat(e.target.value) || '' })
                        }
                        className="px-2 py-1 border border-stone-300 rounded text-xs text-stone-900 w-44"
                      />
                    ) : editProduce.quantityQtl ? (
                      <span className="font-bold text-stone-900 bg-emerald-50 text-emerald-900 px-2 py-0.5 rounded">
                        {editProduce.quantityQtl} {t.common.quintal}
                      </span>
                    ) : (
                      <span className="text-amber-800 italic bg-amber-50 px-2 py-0.5 rounded text-[11px]">
                        {language === 'mr' ? 'प्रमाण आढळले नाही' : language === 'hi' ? 'मात्रा नहीं मिली' : 'Not detected'}
                      </span>
                    )}
                  </div>

                  {/* Grade */}
                  <div className="flex items-center justify-between py-1.5 border-b border-stone-100">
                    <span className="font-semibold text-stone-600">{t.voice.grade}:</span>
                    {manualEditMode ? (
                      <select
                        value={editProduce.qualityGrade}
                        onChange={(e) => setEditProduce({ ...editProduce, qualityGrade: e.target.value })}
                        className="px-2 py-1 border border-stone-300 rounded text-xs text-stone-900 w-44"
                      >
                        <option value="Grade A">Grade A (Premium)</option>
                        <option value="Grade B">Grade B (Standard)</option>
                        <option value="Grade C">Grade C (Fair)</option>
                      </select>
                    ) : (
                      <span className="font-bold text-stone-900 bg-emerald-50 text-emerald-900 px-2 py-0.5 rounded">
                        {editProduce.qualityGrade}
                      </span>
                    )}
                  </div>

                  {/* Expected Price */}
                  <div className="flex items-center justify-between py-1.5">
                    <span className="font-semibold text-stone-600">
                      {language === 'mr' ? 'अपेक्षित भाव' : language === 'hi' ? 'अपेक्षित मूल्य' : 'Expected Price'}:
                    </span>
                    {manualEditMode ? (
                      <input
                        type="number"
                        value={editProduce.expectedPrice}
                        onChange={(e) =>
                          setEditProduce({ ...editProduce, expectedPrice: parseFloat(e.target.value) || '' })
                        }
                        className="px-2 py-1 border border-stone-300 rounded text-xs text-stone-900 w-44"
                        placeholder="₹"
                      />
                    ) : editProduce.expectedPrice ? (
                      <span className="font-bold text-stone-900 bg-emerald-50 text-emerald-900 px-2 py-0.5 rounded">
                        ₹{editProduce.expectedPrice} / Qtl
                      </span>
                    ) : (
                      <span className="text-stone-400 italic text-[11px]">
                        {language === 'mr' ? 'उल्लेख नाही' : language === 'hi' ? 'उल्लेख नहीं' : 'Not specified'}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* ACTION BUTTONS: Confirm, Edit, Try Again */}
              <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
                <button
                  type="button"
                  onClick={handleConfirmAndApply}
                  className="w-full sm:flex-1 py-2 px-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Check className="w-4 h-4" />
                  <span>
                    {language === 'mr'
                      ? 'माहिती निश्चित करा'
                      : language === 'hi'
                      ? 'विवरण की पुष्टि करें'
                      : 'Confirm Details'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleStartListening}
                  className="w-full sm:w-auto py-2 px-3 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>
                    {language === 'mr'
                      ? 'पुन्हा प्रयत्न करा'
                      : language === 'hi'
                      ? 'पुनः प्रयास करें'
                      : 'Try Again'}
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-stone-50 border-t border-stone-200 flex items-center justify-between text-[11px] text-stone-500">
          <span>
            {language === 'mr'
              ? 'आवाज ओळख सुरक्षित असून केवळ आपल्या संमतीनेच सेव्ह केली जाते.'
              : language === 'hi'
              ? 'ध्वनि पहचान सुरक्षित है और आपकी सहमति के बाद ही सहेजी जाती है।'
              : 'Voice input is processed securely and requires your confirmation.'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="font-bold text-stone-700 hover:text-stone-900"
          >
            {t.common.cancel}
          </button>
        </div>
      </div>
    </div>
  );
};
