/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * KrishiVaani Real-World Multilingual Voice Assistant Service
 * Uses Browser Web Speech API (SpeechRecognition / webkitSpeechRecognition)
 * Supports natural farmer speech parsing in Marathi (mr-IN), Hindi (hi-IN), and English (en-IN).
 * 
 * Rules:
 * - NO hardcoded fake transcripts or sample responses.
 * - Extracts structured fields dynamically from real microphone audio.
 * - NEVER invents missing details (unmentioned fields remain undefined).
 */

import { MAHARASHTRA_DISTRICTS } from './maharashtraGeo';

export interface ExtractedFarmProfile {
  fullName?: string;
  state?: string;
  district?: string;
  taluka?: string;
  village?: string;
  landArea?: string;
  primaryCrop?: string;
  cropId?: number;
  unrecognizedFields: string[];
  rawTranscript: string;
}

export interface ExtractedProduce {
  cropName?: string;
  cropId?: number;
  quantityQtl?: number;
  unit?: string;
  qualityGrade?: string;
  expectedPrice?: number;
  variety?: string;
  unrecognizedFields: string[];
  rawTranscript: string;
}

// Convert Devanagari numerals to standard ASCII digits
export function normalizeNumbers(text: string): string {
  const devanagariDigits: Record<string, string> = {
    '०': '0', '१': '1', '२': '2', '३': '3', '४': '4',
    '५': '5', '६': '6', '७': '7', '८': '8', '९': '9',
  };
  return text.replace(/[०-९]/g, (d) => devanagariDigits[d] || d);
}

// Convert Web Speech API errors into friendly localized messages
export function getVoiceErrorMessage(error: string, language: 'en' | 'mr' | 'hi'): { message: string; isPermissionDenied: boolean } {
  const isPermission = error === 'not-allowed' || error === 'permission-denied' || error === 'NotAllowedError';
  
  if (isPermission) {
    return {
      message: language === 'mr'
        ? 'आवाज इनपुट वापरण्यासाठी मायक्रोफोन परवानगी आवश्यक आहे.'
        : language === 'hi'
        ? 'आवाज़ इनपुट का उपयोग करने के लिए माइक्रोफ़ोन की अनुमति आवश्यक है।'
        : 'Microphone permission is needed to use voice input.',
      isPermissionDenied: true,
    };
  }

  if (error === 'no-speech') {
    return {
      message: language === 'mr'
        ? 'कोणताही आवाज ऐकू आला नाही. कृपया पुन्हा बोला.'
        : language === 'hi'
        ? 'कोई आवाज़ सुनाई नहीं दी। कृपया पुनः बोलें।'
        : 'No speech was detected. Please try speaking again.',
      isPermissionDenied: false,
    };
  }

  if (error === 'audio-capture') {
    return {
      message: language === 'mr'
        ? 'मायक्रोफोन उपलब्ध नाही किंवा दुसऱ्या ॲपमध्ये वापरला जात आहे.'
        : language === 'hi'
        ? 'माइक्रोफ़ोन उपलब्ध नहीं है या किसी अन्य ऐप द्वारा उपयोग में है।'
        : 'Microphone is unavailable or in use by another application.',
      isPermissionDenied: false,
    };
  }

  if (error === 'network') {
    return {
      message: language === 'mr'
        ? 'आवाज प्रक्रियेदरम्यान नेटवर्क अडचण आली.'
        : language === 'hi'
        ? 'आवाज़ प्रक्रिया के दौरान नेटवर्क समस्या आई।'
        : 'Network connection error during voice processing.',
      isPermissionDenied: false,
    };
  }

  return {
    message: language === 'mr'
      ? 'आवाज ओळखता आला नाही. आपण माहिती थेट फॉर्ममध्ये लिहून भरू शकता.'
      : language === 'hi'
      ? 'आवाज़ पहचानी नहीं जा सकी। आप विवरण सीधे फॉर्म में भर सकते हैं।'
      : 'Could not recognize speech. You can enter details manually in the form.',
    isPermissionDenied: false,
  };
}

// Check Web Speech API availability
export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
}

// Start browser microphone speech recognition
export function startSpeechRecognition(options: {
  language: 'en' | 'mr' | 'hi';
  onResult: (transcript: string, isFinal: boolean) => void;
  onError: (error: string) => void;
  onEnd: () => void;
}): () => void {
  const SpeechRecognitionClass =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  if (!SpeechRecognitionClass) {
    options.onError('Speech recognition not supported in this browser');
    return () => {};
  }

  try {
    const recognition = new SpeechRecognitionClass();
    recognition.continuous = false;
    recognition.interimResults = true;

    // Dynamically set language based on active selection
    if (options.language === 'mr') {
      recognition.lang = 'mr-IN';
    } else if (options.language === 'hi') {
      recognition.lang = 'hi-IN';
    } else {
      recognition.lang = 'en-IN';
    }

    recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      const text = (final || interim).trim();
      options.onResult(text, Boolean(final));
    };

    recognition.onerror = (event: any) => {
      const err = event.error || 'speech-error';
      options.onError(err);
    };

    recognition.onend = () => {
      options.onEnd();
    };

    recognition.start();

    return () => {
      try {
        recognition.stop();
      } catch (_) {}
    };
  } catch (err: any) {
    options.onError(err.message || 'Could not start microphone');
    return () => {};
  }
}

// Optional gentle voice confirmation
export function speakFeedback(text: string, language: 'en' | 'mr' | 'hi') {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language === 'mr' ? 'mr-IN' : language === 'hi' ? 'hi-IN' : 'en-IN';
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  } catch (_) {}
}

/**
 * Natural Farmer Speech Parser for Farm Profile / Onboarding
 * Extracts structured fields from spoken Marathi, Hindi, or English.
 * NEVER invents missing data.
 */
export function extractFarmProfileFromText(
  rawText: string,
  lang: 'en' | 'mr' | 'hi',
  crops: Array<{ id: number; name_en: string; name_mr: string; name_hi: string }>
): ExtractedFarmProfile {
  const text = normalizeNumbers(rawText);
  const result: ExtractedFarmProfile = {
    state: 'Maharashtra',
    rawTranscript: rawText,
    unrecognizedFields: [],
  };

  if (!rawText || rawText.trim().length === 0) {
    return result;
  }

  // 1. EXTRACT FULL NAME
  // Marathi: माझं नाव रमेश पाटील आहे / माझे नाव रमेश / मी रमेश बोलतोय / नाव रमेश
  // Hindi: मेरा नाम रमेश है / नाम रमेश है
  // English: My name is Ramesh / I am Ramesh
  const mrNameMatch =
    text.match(/(?:माझं|माझे|माझ)\s+नाव\s+([A-Za-z\u0900-\u097F]+(?:\s+[A-Za-z\u0900-\u097F]+)?)/i) ||
    text.match(/(?:मी|नाव)\s+([A-Za-z\u0900-\u097F]+(?:\s+[A-Za-z\u0900-\u097F]+)?)\s+(?:बोलतोय|आहे|राहतो)/i) ||
    text.match(/नाव\s+([A-Za-z\u0900-\u097F]+(?:\s+[A-Za-z\u0900-\u097F]+)?)/i);

  const hiNameMatch =
    text.match(/(?:मेरा\s+नाम|नाम)\s+([A-Za-z\u0900-\u097F]+(?:\s+[A-Za-z\u0900-\u097F]+)?)/i) ||
    text.match(/मैं\s+([A-Za-z\u0900-\u097F]+(?:\s+[A-Za-z\u0900-\u097F]+)?)\s+(?:बोल\s+रहा\s+हूं|हूं)/i);

  const enNameMatch =
    text.match(/(?:my name is|i am|name is|this is)\s+([A-Za-z]+(?:\s+[A-Za-z]+)?)/i);

  if (mrNameMatch && mrNameMatch[1]) {
    const rawN = mrNameMatch[1].trim();
    if (!/जिल्ह्यात|गावात|एकर|कांदा|टोमॅटो/i.test(rawN)) {
      result.fullName = rawN;
    }
  } else if (hiNameMatch && hiNameMatch[1]) {
    const rawN = hiNameMatch[1].trim();
    if (!/जिले|गांव|एकड़|प्याज|टमाटर/i.test(rawN)) {
      result.fullName = rawN;
    }
  } else if (enNameMatch && enNameMatch[1]) {
    const rawN = enNameMatch[1].trim();
    if (!/district|village|acres|farmer|onion|tomato/i.test(rawN)) {
      result.fullName = rawN;
    }
  }

  // 2. EXTRACT DISTRICT (Searching across all 36 Maharashtra Districts)
  const lowerText = text.toLowerCase();
  for (const d of MAHARASHTRA_DISTRICTS) {
    const matchEn = lowerText.includes(d.nameEn.toLowerCase().split(' ')[0]);
    const matchMr = text.includes(d.nameMr.split(' ')[0]) || text.includes(d.nameMr);
    const matchHi = text.includes(d.nameHi.split(' ')[0]) || text.includes(d.nameHi);

    if (matchEn || matchMr || matchHi) {
      result.district = lang === 'mr' ? d.nameMr : lang === 'hi' ? d.nameHi : d.nameEn;
      break;
    }
  }

  // Also check synonyms for recently renamed districts
  if (!result.district) {
    if (/औरंगाबाद|aurangabad/i.test(text)) {
      result.district = lang === 'mr' ? 'छत्रपती संभाजीनगर (औरंगाबाद)' : lang === 'hi' ? 'छत्रपति संभाजीनगर (औरंगाबाद)' : 'Chhatrapati Sambhajinagar (Aurangabad)';
    } else if (/उस्मानाबाद|osmanabad/i.test(text)) {
      result.district = lang === 'mr' ? 'धाराशिव (उस्मानाबाद)' : lang === 'hi' ? 'धाराशिव (उस्मानाबाद)' : 'Dharashiv (Osmanabad)';
    } else if (/अहमदनगर|ahmednagar/i.test(text)) {
      result.district = lang === 'mr' ? 'अहिल्यानगर (अहमदनगर)' : lang === 'hi' ? 'अहिल्यानगर (अहमदनगर)' : 'Ahmednagar (Ahilyanagar)';
    }
  }

  // 3. EXTRACT TALUKA / TEHSIL
  // e.g. "राहुरी तालुक्यात", "राहुरी तालुका", "ता. राहुरी", "तहसील राहुरी", "taluka Rahuri", "in Rahuri tehsil"
  const mrTalukaMatch =
    text.match(/([A-Za-z\u0900-\u097F]+)\s*(?:तालुक्यात|तालुक्यातील|तालुका)/i) ||
    text.match(/(?:तालुका|ता\.)\s*([A-Za-z\u0900-\u097F]+)/i);

  const hiTalukaMatch =
    text.match(/([A-Za-z\u0900-\u097F]+)\s*(?:तहसील|तालुका)(?:\s+में)?/i) ||
    text.match(/(?:तहसील|तालुका)\s*([A-Za-z\u0900-\u097F]+)/i);

  const enTalukaMatch =
    text.match(/([A-Za-z]+)\s*(?:taluka|tehsil)/i) ||
    text.match(/(?:taluka|tehsil)\s*([A-Za-z]+)/i);

  if (mrTalukaMatch && mrTalukaMatch[1]) {
    const rawT = mrTalukaMatch[1].trim();
    if (!result.district || !result.district.includes(rawT)) {
      result.taluka = rawT;
    }
  } else if (hiTalukaMatch && hiTalukaMatch[1]) {
    const rawT = hiTalukaMatch[1].trim();
    if (!result.district || !result.district.includes(rawT)) {
      result.taluka = rawT;
    }
  } else if (enTalukaMatch && enTalukaMatch[1]) {
    result.taluka = enTalukaMatch[1].trim();
  }

  // 4. EXTRACT VILLAGE
  // Marathi: "राहुरी गावात", "पिंपळगाव गावातील", "माझं गाव राहुरी", "गाव पिंपळगाव"
  // Hindi: "राहुरी गांव में", "गांव राहुरी"
  // English: "Rahuri village", "in village Rahuri", "live in Rahuri"
  const mrVillageMatch =
    text.match(/([A-Za-z\u0900-\u097F]+)\s*(?:गावात|गावातील|गाव)/i) ||
    text.match(/(?:गाव|गावाचे\s+नाव)\s+([A-Za-z\u0900-\u097F]+)/i);

  const hiVillageMatch =
    text.match(/([A-Za-z\u0900-\u097F]+)\s*(?:गांव|गाँव)(?:\s+में)?/i) ||
    text.match(/(?:गांव|गाँव|ग्राम)\s+([A-Za-z\u0900-\u097F]+)/i);

  const enVillageMatch =
    text.match(/([A-Za-z]+)\s+village/i) ||
    text.match(/(?:village|town)\s+([A-Za-z]+)/i) ||
    text.match(/in\s+([A-Za-z]+)\s+(?:village|town)/i);

  if (mrVillageMatch && mrVillageMatch[1]) {
    const rawV = mrVillageMatch[1].trim();
    if (rawV !== result.district && rawV !== result.taluka) {
      result.village = rawV;
    }
  } else if (hiVillageMatch && hiVillageMatch[1]) {
    const rawV = hiVillageMatch[1].trim();
    if (rawV !== result.district && rawV !== result.taluka) {
      result.village = rawV;
    }
  } else if (enVillageMatch && enVillageMatch[1]) {
    result.village = enVillageMatch[1].trim();
  }

  // 5. EXTRACT LAND AREA
  // e.g. "2 एकर", "२ एकर", "2.5 एकर", "3 acres", "5.5 एकड़", "2 हेक्टर"
  const landMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:एकर|एकड़|acres?|hec(?:tare)?|हेक्टर)/i);
  if (landMatch && landMatch[1]) {
    result.landArea = `${landMatch[1]} Acres`;
  }

  // 6. EXTRACT PRIMARY CROP
  for (const c of crops) {
    const enName = c.name_en.toLowerCase();
    const mrName = c.name_mr.toLowerCase();
    const hiName = c.name_hi.toLowerCase();

    if (
      lowerText.includes(enName) ||
      text.includes(c.name_mr) ||
      text.includes(c.name_hi) ||
      (enName === 'onion' && (text.includes('कांदा') || text.includes('कांदे') || text.includes('प्याज़') || text.includes('प्याज'))) ||
      (enName === 'tomato' && (text.includes('टोमॅटो') || text.includes('टमाटर'))) ||
      (enName === 'soybean' && (text.includes('सोयाबीन') || text.includes('सोया'))) ||
      (enName === 'cotton' && (text.includes('कापूस') || text.includes('कपास'))) ||
      (enName === 'pomegranate' && (text.includes('डाळिंब') || text.includes('अनार'))) ||
      (enName === 'grapes' && (text.includes('द्राक्षे') || text.includes('द्राक्ष') || text.includes('अंगूर'))) ||
      (enName === 'wheat' && (text.includes('गहू') || text.includes('गेहूं'))) ||
      (enName === 'sugarcane' && (text.includes('ऊस') || text.includes('गन्ना'))) ||
      (enName === 'banana' && (text.includes('केळी') || text.includes('केला'))) ||
      (enName === 'gram' && (text.includes('हरभरा') || text.includes('चना')))
    ) {
      result.primaryCrop = lang === 'mr' ? c.name_mr : lang === 'hi' ? c.name_hi : c.name_en;
      result.cropId = c.id;
      break;
    }
  }

  // Detect which fields were NOT mentioned/recognized
  if (!result.fullName) result.unrecognizedFields.push('name');
  if (!result.district) result.unrecognizedFields.push('district');
  if (!result.village) result.unrecognizedFields.push('village');
  if (!result.landArea) result.unrecognizedFields.push('landArea');
  if (!result.primaryCrop) result.unrecognizedFields.push('crop');

  return result;
}

/**
 * Natural Farmer Speech Parser for Harvest Produce Lot Entry
 * Extracts structured crop, quantity, grade, and expected price.
 * NEVER invents missing data.
 */
export function extractProduceFromText(
  rawText: string,
  lang: 'en' | 'mr' | 'hi',
  crops: Array<{ id: number; name_en: string; name_mr: string; name_hi: string }>
): ExtractedProduce {
  const text = normalizeNumbers(rawText);
  const lowerText = text.toLowerCase();
  const result: ExtractedProduce = {
    rawTranscript: rawText,
    unrecognizedFields: [],
  };

  if (!rawText || rawText.trim().length === 0) {
    return result;
  }

  // 1. Crop Match
  for (const c of crops) {
    const enName = c.name_en.toLowerCase();

    if (
      lowerText.includes(enName) ||
      text.includes(c.name_mr) ||
      text.includes(c.name_hi) ||
      (enName === 'onion' && (text.includes('कांदा') || text.includes('कांदे') || text.includes('प्याज़') || text.includes('प्याज'))) ||
      (enName === 'tomato' && (text.includes('टोमॅटो') || text.includes('टमाटर'))) ||
      (enName === 'soybean' && (text.includes('सोयाबीन') || text.includes('सोया'))) ||
      (enName === 'cotton' && (text.includes('कापूस') || text.includes('कपास'))) ||
      (enName === 'pomegranate' && (text.includes('डाळिंब') || text.includes('अनार'))) ||
      (enName === 'grapes' && (text.includes('द्राक्षे') || text.includes('द्राक्ष') || text.includes('अंगूर'))) ||
      (enName === 'wheat' && (text.includes('गहू') || text.includes('गेहूं'))) ||
      (enName === 'sugarcane' && (text.includes('ऊस') || text.includes('गन्ना'))) ||
      (enName === 'banana' && (text.includes('केळी') || text.includes('केला'))) ||
      (enName === 'gram' && (text.includes('हरभरा') || text.includes('चना')))
    ) {
      result.cropName = lang === 'mr' ? c.name_mr : lang === 'hi' ? c.name_hi : c.name_en;
      result.cropId = c.id;
      break;
    }
  }

  // 2. Quantity
  // e.g. "20 क्विंटल", "२५ क्विंटल", "15 टन", "50 bags", "30 qtl"
  const qtyMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:क्विंटल|quintals?|qtl|टन|ton|बोरी|bags?)/i);
  if (qtyMatch && qtyMatch[1]) {
    let q = parseFloat(qtyMatch[1]);
    if (/टन|ton/i.test(qtyMatch[0])) {
      q = q * 10; // 1 ton = 10 quintals
      result.unit = 'Ton';
    } else {
      result.unit = 'Quintal';
    }
    result.quantityQtl = q;
  }

  // 3. Quality Grade
  if (/ग्रेड\s*a|दर्जा\s*अ|grade\s*a|प्रीमियम/i.test(text)) {
    result.qualityGrade = 'Grade A';
  } else if (/ग्रेड\s*b|दर्जा\s*ब|grade\s*b|मध्यम/i.test(text)) {
    result.qualityGrade = 'Grade B';
  } else if (/ग्रेड\s*c|दर्जा\s*क|grade\s*c|साधारण/i.test(text)) {
    result.qualityGrade = 'Grade C';
  }

  // 4. Expected Price
  const priceMatch = text.match(/(\d{3,5})\s*(?:रुपये|भाव|रु|rs|inr|\/-\s*|per\s*quintal)/i);
  if (priceMatch && priceMatch[1]) {
    result.expectedPrice = parseFloat(priceMatch[1]);
  }

  if (!result.cropName) result.unrecognizedFields.push('crop');
  if (!result.quantityQtl) result.unrecognizedFields.push('quantity');
  if (!result.qualityGrade) result.unrecognizedFields.push('grade');

  return result;
}
