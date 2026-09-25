import React, { useState } from 'react';
import { ExplainablePayload, SupportedLanguage } from '../../types';
import {
  Info,
  Layers,
  Database,
  Calculator,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  SlidersHorizontal,
} from 'lucide-react';

interface Props {
  payload: ExplainablePayload;
  language: SupportedLanguage;
  defaultExpanded?: boolean;
  className?: string;
}

export const ExplainableRecommendationCard: React.FC<Props> = ({
  payload,
  language,
  defaultExpanded = true,
  className = '',
}) => {
  const [showCalculationDetails, setShowCalculationDetails] = useState(defaultExpanded);
  const [showAssumptions, setShowAssumptions] = useState(false);

  // Localization Helpers
  const recTitle =
    language === 'mr'
      ? payload.recommendationTitleMr
      : language === 'hi'
      ? payload.recommendationTitleHi
      : payload.recommendationTitleEn;

  const formula =
    language === 'mr'
      ? payload.calculation.formulaMr
      : language === 'hi'
      ? payload.calculation.formulaHi
      : payload.calculation.formulaEn;

  const assumptionsList =
    language === 'mr'
      ? payload.assumptions.mr
      : language === 'hi'
      ? payload.assumptions.hi
      : payload.assumptions.en;

  const disclaimer =
    language === 'mr'
      ? payload.farmerDisclaimer.mr
      : language === 'hi'
      ? payload.farmerDisclaimer.hi
      : payload.farmerDisclaimer.en;

  const uiLabels = {
    en: {
      explainHeader: 'Explainable Decision Framework',
      whyThisRec: 'Why This Recommendation?',
      dataSource: 'Data Source Attribution',
      calculationDerivation: 'Mathematical Derivation',
      contributingFactors: 'Contributing Evidence & Weights',
      assumptionsTitle: 'Operating Assumptions & Caveats',
      alternativesTitle: 'Actionable Alternatives',
      disclaimerTitle: 'Farmer Decision Sovereignty',
      liveBadge: 'Live Verified Source',
      datasetBadge: 'Historical APMC Dataset',
      hideDetails: 'Collapse Details',
      viewDetails: 'Expand Step-by-Step Derivation',
      impactPositive: 'Favorable Impact',
      impactNegative: 'Risk / Markdown',
      impactNeutral: 'Neutral Factor',
    },
    mr: {
      explainHeader: 'पारदर्शक निर्णय चौकट',
      whyThisRec: 'हीच शिफारस का?',
      dataSource: 'माहिती स्त्रोत व संदर्भ',
      calculationDerivation: 'गणितीय पद्धत व हिशोब',
      contributingFactors: 'कारणीभूत घटक व प्रभाव',
      assumptionsTitle: 'गृहीतके व स्थानिक अटी',
      alternativesTitle: 'पर्यायी मार्ग',
      disclaimerTitle: 'शेतकऱ्याचा अंतिम निर्णय अधिकार',
      liveBadge: 'थेट चालू माहिती',
      datasetBadge: 'ऐतिहासिक कृषी पणन डेटासेट',
      hideDetails: 'तपशील लपवा',
      viewDetails: 'सविस्तर हिशोब पाहा',
      impactPositive: 'फायदेशीर घटक',
      impactNegative: 'जोखीम / खर्च',
      impactNeutral: 'तटस्थ घटक',
    },
    hi: {
      explainHeader: 'पारदर्शी निर्णय रूपरेखा',
      whyThisRec: 'यही सिफारिश क्यों?',
      dataSource: 'डेटा स्रोत व संदर्भ',
      calculationDerivation: 'गणितीय पद्धति व गणना',
      contributingFactors: 'प्रभाव डालने वाले घटक',
      assumptionsTitle: 'मान्यताएं व आवश्यक शर्तें',
      alternativesTitle: 'वैकल्पिक उपाय',
      disclaimerTitle: 'किसान का अंतिम निर्णय अधिकार',
      liveBadge: 'लाइव सत्यापित डेटा',
      datasetBadge: 'ऐतिहासिक मंडी डेटासेट',
      hideDetails: 'विवरण समेटें',
      viewDetails: 'विस्तृत गणना देखें',
      impactPositive: 'लाभकारी कारक',
      impactNegative: 'जोखिम / कटौती',
      impactNeutral: 'तटस्थ कारक',
    },
  }[language];

  return (
    <div className={`bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden ${className}`}>
      {/* 1. Header with Badge & Attribution */}
      <div className="bg-stone-50 border-b border-stone-200 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-emerald-100 text-emerald-800 rounded-md">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-700">
                {uiLabels.explainHeader}
              </span>
              <h4 className="text-base font-bold text-stone-900">{recTitle}</h4>
            </div>
          </div>

          {/* Data Source Badge */}
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                payload.dataSource.isLive
                  ? 'bg-blue-100 text-blue-800 border border-blue-200'
                  : 'bg-amber-100 text-amber-800 border border-amber-200'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              {payload.dataSource.isLive ? uiLabels.liveBadge : uiLabels.datasetBadge}
            </span>
          </div>
        </div>

        {/* Data Source Details Line */}
        <div className="mt-2.5 text-xs text-stone-700 flex flex-wrap items-center gap-x-4 gap-y-1 bg-white px-3 py-2 rounded-lg border border-stone-200">
          <span className="font-medium text-stone-700">
            {uiLabels.dataSource}: <strong className="text-stone-900 font-semibold">{payload.dataSource.sourceName}</strong>
          </span>
          <span className="text-stone-400">•</span>
          <span>
            {language === 'mr' ? 'नोंद तारीख' : language === 'hi' ? 'रिकॉर्ड तिथि' : 'Record Date'}:{' '}
            <strong className="text-stone-800 font-medium">{payload.dataSource.recordDate}</strong>
          </span>
          <span className="text-stone-400">•</span>
          <span>
            {language === 'mr' ? 'ताजी माहिती वेळ' : language === 'hi' ? 'पुनर्प्राप्ति समय' : 'Retrieved'}:{' '}
            {new Date(payload.dataSource.retrievedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>

      {/* 2. Contributing Factors Breakdown */}
      <div className="p-4 border-b border-stone-100">
        <h5 className="text-xs font-bold uppercase tracking-wider text-stone-600 mb-3 flex items-center gap-1.5">
          <SlidersHorizontal className="w-4 h-4 text-emerald-600" />
          {uiLabels.contributingFactors}
        </h5>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {payload.factors.map((factor, idx) => {
            const factorName = language === 'mr' ? factor.nameMr : language === 'hi' ? factor.nameHi : factor.nameEn;
            const factorRationale =
              language === 'mr' ? factor.rationaleMr : language === 'hi' ? factor.rationaleHi : factor.rationaleEn;

            const isPos = factor.impact === 'POSITIVE';
            const isNeg = factor.impact === 'NEGATIVE';

            return (
              <div
                key={`rec-factor-${factor.nameEn || idx}-${idx}`}
                className={`p-3 rounded-lg border text-xs ${
                  isPos
                    ? 'bg-emerald-50/50 border-emerald-200'
                    : isNeg
                    ? 'bg-rose-50/50 border-rose-200'
                    : 'bg-stone-50 border-stone-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-stone-800">{factorName}</span>
                  <span
                    className={`font-mono font-bold text-xs px-1.5 py-0.5 rounded ${
                      isPos
                        ? 'bg-emerald-100 text-emerald-800'
                        : isNeg
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-stone-200 text-stone-700'
                    }`}
                  >
                    {factor.valueDisplay}
                  </span>
                </div>
                <p className="text-stone-600 leading-relaxed">{factorRationale}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Mathematical Derivation & Step-by-Step Calculation */}
      <div className="p-4 bg-stone-50/40 border-b border-stone-200">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Calculator className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-bold uppercase tracking-wider text-stone-600">
              {uiLabels.calculationDerivation}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowCalculationDetails(!showCalculationDetails)}
            className="text-xs text-emerald-700 hover:text-emerald-800 font-medium inline-flex items-center gap-1 cursor-pointer"
          >
            {showCalculationDetails ? uiLabels.hideDetails : uiLabels.viewDetails}
            {showCalculationDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Formula Box */}
        <div className="bg-white p-2.5 rounded-lg border border-stone-200 text-xs font-mono text-stone-700 mb-3 overflow-x-auto">
          <span className="text-stone-400 font-sans select-none">Formula: </span>
          {formula}
        </div>

        {/* Step-by-step table */}
        {showCalculationDetails && (
          <div className="bg-white rounded-lg border border-stone-200 overflow-hidden divide-y divide-stone-100">
            {payload.calculation.steps.map((step, idx) => {
              const stepLabel = language === 'mr' ? step.labelMr : language === 'hi' ? step.labelHi : step.labelEn;
              const isLast = idx === payload.calculation.steps.length - 1;

              return (
                <div
                  key={`calc-step-${step.labelEn || idx}-${idx}`}
                  className={`flex items-center justify-between px-3 py-2 text-xs ${
                    isLast ? 'bg-emerald-50/60 font-bold text-emerald-950' : 'text-stone-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-stone-400 font-mono text-[10px] w-4">{idx + 1}.</span>
                    <span>{stepLabel}</span>
                  </div>
                  <span
                    className={`font-mono font-medium ${
                      step.isDeduction ? 'text-rose-600' : isLast ? 'text-emerald-700 font-bold' : 'text-stone-800'
                    }`}
                  >
                    {step.isDeduction ? `- ` : ''}₹{Number(step.value).toLocaleString('en-IN')}{' '}
                    <span className="text-[10px] text-stone-400">{step.unit}</span>
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Actionable Alternatives & Scenarios */}
      {payload.alternativeOptions && payload.alternativeOptions.length > 0 && (
        <div className="p-4 border-b border-stone-200">
          <h5 className="text-xs font-bold uppercase tracking-wider text-stone-600 mb-2.5 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-purple-600" />
            {uiLabels.alternativesTitle}
          </h5>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {payload.alternativeOptions.map((alt, idx) => {
              const altTitle = language === 'mr' ? alt.titleMr : language === 'hi' ? alt.titleHi : alt.titleEn;
              const altOutcome =
                language === 'mr' ? alt.expectedOutcomeMr : language === 'hi' ? alt.expectedOutcomeHi : alt.expectedOutcomeEn;

              return (
                <div key={`alt-opt-${alt.titleEn || idx}-${idx}`} className="p-3 bg-purple-50/40 border border-purple-200 rounded-lg text-xs">
                  <h6 className="font-semibold text-purple-900 mb-1">{altTitle}</h6>
                  <p className="text-purple-800 leading-relaxed">{altOutcome}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. Operating Assumptions Accordion */}
      {assumptionsList && assumptionsList.length > 0 && (
        <div className="px-4 py-3 bg-stone-50 border-b border-stone-200">
          <button
            type="button"
            onClick={() => setShowAssumptions(!showAssumptions)}
            className="w-full flex items-center justify-between text-xs font-medium text-stone-600 hover:text-stone-800 cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-stone-500" />
              {uiLabels.assumptionsTitle} ({assumptionsList.length})
            </span>
            {showAssumptions ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showAssumptions && (
            <ul className="mt-2 space-y-1 text-xs text-stone-600 list-disc list-inside bg-white p-3 rounded border border-stone-200">
              {assumptionsList.map((a, i) => (
                <li key={`assumption-${i}-${a.slice(0, 15)}`}>{a}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* 6. Farmer Decision Disclaimer */}
      <div className="p-3 bg-amber-50 text-amber-900 border-t border-amber-200 text-xs flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold mr-1">{uiLabels.disclaimerTitle}:</span>
          <span>{disclaimer}</span>
        </div>
      </div>
    </div>
  );
};
