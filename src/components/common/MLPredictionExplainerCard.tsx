import React from 'react';
import { MLPipelineResult, SupportedLanguage } from '../../types';
import {
  Brain,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Layers,
  Database,
  BarChart3,
  Percent,
  GitBranch,
} from 'lucide-react';

interface Props {
  mlResult: MLPipelineResult | null;
  loading?: boolean;
  language: SupportedLanguage;
  cropName: string;
  className?: string;
}

export const MLPredictionExplainerCard: React.FC<Props> = ({
  mlResult,
  loading = false,
  language,
  cropName,
  className = '',
}) => {
  const ui = {
    en: {
      title: 'Commodity Price Prediction Pipeline',
      statusTrained: 'Model Trained & Evaluated',
      statusInsufficient: 'Insufficient Historical Data',
      insufficientMessage: 'Insufficient historical data for reliable prediction',
      algorithmLabel: 'Algorithm',
      validationSplit: 'Time-Based Validation',
      metricsHeader: 'Empirical Holdout Evaluation Metrics',
      maeLabel: 'MAE (Mean Absolute Error)',
      rmseLabel: 'RMSE (Root Mean Square Error)',
      r2Label: 'R² (Coefficient of Determination)',
      testSamples: 'Holdout Test Records',
      forecastHeader: 'Multi-Day Mandi Price Projections',
      contributingFeatures: 'Key Contributing Features',
      datasetHeader: 'Training Data Provenance',
      noFakeMetricsNote: 'Zero Synthetic Metrics: MAE, RMSE, and R² are computed strictly on chronological holdout test data.',
      retrievedAt: 'Retrieved At',
      dateRange: 'Historical Date Range',
      recordCount: 'Training Dataset Size',
    },
    mr: {
      title: 'शेतमाल भाव अंदाज व मशीन लर्निंग विश्लेषण',
      statusTrained: 'मॉडेल प्रशिक्षित व प्रमाणित',
      statusInsufficient: 'अपुरा ऐतिहासिक डेटा',
      insufficientMessage: 'विश्वसनीय अंदाजासाठी पुरेसा ऐतिहासिक डेटा उपलब्ध नाही',
      algorithmLabel: 'अल्गोरिदम',
      validationSplit: 'वेळेवर आधारित विभाजन',
      metricsHeader: 'चाचणी मूल्यांकन मेट्रिक्स (Holdout Evaluation)',
      maeLabel: 'MAE (सरासरी त्रुटी)',
      rmseLabel: 'RMSE (वर्गमूळ त्रुटी)',
      r2Label: 'R² (निश्चितता निर्देशांक)',
      testSamples: 'चाचणी नोंदींची संख्या',
      forecastHeader: 'पुढील दिवसांचा अंदाजित बाजारभाव',
      contributingFeatures: 'महत्त्वाचे घटक व प्रभाव',
      datasetHeader: 'डेटासेट स्त्रोत व संदर्भ',
      noFakeMetricsNote: 'कोणतीही खोटी आकडेवारी नाही: सर्व मेट्रिक्स थेट स्वतंत्र चाचणी डेटावर आधारित आहेत.',
      retrievedAt: 'माहिती वेळ',
      dateRange: 'ऐतिहासिक कालावधी',
      recordCount: 'एकूण नोंदींची संख्या',
    },
    hi: {
      title: 'कृषि उपज मूल्य पूर्वानुमान पाइपलाइन',
      statusTrained: 'मॉडल प्रशिक्षित व मूल्यांकित',
      statusInsufficient: 'अपर्याप्त ऐतिहासिक डेटा',
      insufficientMessage: 'विश्वसनीय पूर्वानुमान के लिए पर्याप्त ऐतिहासिक डेटा उपलब्ध नहीं',
      algorithmLabel: 'एल्गोरिदम',
      validationSplit: 'समय-आधारित विभाजन',
      metricsHeader: 'स्वतंत्र परीक्षण मूल्यांकन मेट्रिक्स',
      maeLabel: 'MAE (औसत निरपेक्ष त्रुटि)',
      rmseLabel: 'RMSE (वर्ग माध्य मूल त्रुटि)',
      r2Label: 'R² (निर्धारण गुणांक)',
      testSamples: 'परीक्षण रिकॉर्ड्स',
      forecastHeader: 'आगामी दिनों का अनुमानित मंडी भाव',
      contributingFeatures: 'प्रमुख प्रभावशाली कारक',
      datasetHeader: 'डेटासेट स्रोत व विवरण',
      noFakeMetricsNote: 'कोई कृत्रिम सटीकता नहीं: सभी मेट्रिक्स सीधे वास्तविक परीक्षण डेटा पर आधारित हैं।',
      retrievedAt: 'प्राप्ति समय',
      dateRange: 'ऐतिहासिक अवधि',
      recordCount: 'कुल रिकॉर्ड्स संख्या',
    },
  }[language];

  if (loading) {
    return (
      <div className={`p-6 bg-white rounded-xl border border-stone-200 animate-pulse ${className}`}>
        <div className="h-5 bg-stone-200 rounded w-1/3 mb-4"></div>
        <div className="h-4 bg-stone-100 rounded w-2/3 mb-6"></div>
        <div className="grid grid-cols-3 gap-3">
          <div className="h-16 bg-stone-100 rounded"></div>
          <div className="h-16 bg-stone-100 rounded"></div>
          <div className="h-16 bg-stone-100 rounded"></div>
        </div>
      </div>
    );
  }

  if (!mlResult) return null;

  // Case A: Insufficient Data (< 15 records) - No fake metrics allowed!
  if (mlResult.status === 'INSUFFICIENT_DATA') {
    const message =
      language === 'mr' ? mlResult.messageMr : language === 'hi' ? mlResult.messageHi : mlResult.messageEn;

    return (
      <div className={`p-5 bg-amber-50/70 border border-amber-300 rounded-xl ${className}`}>
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-200 px-2 py-0.5 rounded">
                {ui.statusInsufficient}
              </span>
              <span className="text-xs text-amber-700 font-mono">
                ({mlResult.dataSource.recordCount} records available, 15 required)
              </span>
            </div>
            <h4 className="text-base font-bold text-amber-950">{ui.insufficientMessage}</h4>
            <p className="text-xs text-amber-900 leading-relaxed">
              {language === 'mr'
                ? `${cropName} साठी पुरेशा ऐतिहासिक नोंदी उपलब्ध नसल्याने कोणताही खोटा अंदाज किंवा अचूकतेचा दावा केला जात नाही. विश्वासार्ह अंदाजासाठी किमान १५ दिवसांच्या नोंदी आवश्यक आहेत.`
                : language === 'hi'
                ? `${cropName} के लिए पर्याप्त ऐतिहासिक रिकॉर्ड उपलब्ध नहीं हैं, इसलिए कोई फर्जी सटीकता प्रतिशत नहीं दिखाया जा रहा है। विश्वसनीय मॉडल के लिए कम से कम 15 दिनों का डेटा आवश्यक है।`
                : `Because fewer than 15 historical market price points exist for ${cropName}, KrishiVaani declines to fabricate an ungrounded accuracy percentage or projected future price.`}
            </p>

            <div className="pt-2 text-xs text-amber-800 border-t border-amber-200/60 flex items-center gap-2">
              <Database className="w-3.5 h-3.5 text-amber-700" />
              <span>
                {ui.datasetHeader}: <strong>{mlResult.dataSource.name}</strong>
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Case B: Trained and Evaluated with Genuine Empirical Metrics
  const message =
    language === 'mr' ? mlResult.messageMr : language === 'hi' ? mlResult.messageHi : mlResult.messageEn;

  return (
    <div className={`bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-stone-50 to-emerald-50/30 border-b border-stone-200">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-emerald-600 text-white rounded-lg">
              <Brain className="w-4 h-4" />
            </span>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                {ui.statusTrained}
              </span>
              <h4 className="text-sm font-bold text-stone-900">{ui.title} - {cropName}</h4>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs bg-stone-100 text-stone-700 font-mono px-2 py-1 rounded border border-stone-200">
              {mlResult.algorithm}
            </span>
          </div>
        </div>

        <p className="text-xs text-stone-600 mt-2 font-sans">{message}</p>
        <div className="mt-2 text-[11px] text-stone-700 font-mono bg-white/80 px-2.5 py-1.5 rounded border border-stone-200">
          <GitBranch className="w-3 h-3 inline mr-1 text-emerald-600" />
          {mlResult.trainTestSplitDescription}
        </div>
      </div>

      {/* Real Empirical Metrics Grid */}
      {mlResult.metrics && (
        <div className="p-4 border-b border-stone-100">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-600 flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5 text-blue-600" />
              {ui.metricsHeader}
            </span>
            <span className="text-[11px] text-stone-700 font-medium">
              {ui.testSamples}: <strong className="font-mono text-stone-700">{mlResult.metrics.testSampleSize}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* MAE */}
            <div className="p-3 bg-stone-50 rounded-lg border border-stone-200">
              <span className="text-[11px] font-semibold text-stone-700 block mb-0.5">
                {ui.maeLabel}
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-bold font-mono text-stone-900">
                  ₹{mlResult.metrics.mae}
                </span>
                <span className="text-xs text-stone-700 font-medium">/Qtl</span>
              </div>
              <p className="text-[10px] text-stone-700 mt-1">
                {language === 'mr'
                  ? 'चाचणी डेटावर सरासरी फरक'
                  : language === 'hi'
                  ? 'परीक्षण डेटा पर औसत अंतर'
                  : 'Average deviation on holdout test set'}
              </p>
            </div>

            {/* RMSE */}
            <div className="p-3 bg-stone-50 rounded-lg border border-stone-200">
              <span className="text-[11px] font-semibold text-stone-700 block mb-0.5">
                {ui.rmseLabel}
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-bold font-mono text-stone-900">
                  ₹{mlResult.metrics.rmse}
                </span>
                <span className="text-xs text-stone-700 font-medium">/Qtl</span>
              </div>
              <p className="text-[10px] text-stone-700 mt-1">
                {language === 'mr'
                  ? 'मोठ्या फरकांचे वजन'
                  : language === 'hi'
                  ? 'बड़े विचलनों का भार'
                  : 'Penalizes larger auction variances'}
              </p>
            </div>

            {/* R2 */}
            <div className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-200">
              <span className="text-[11px] font-semibold text-emerald-800 block mb-0.5">
                {ui.r2Label}
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-bold font-mono text-emerald-900">
                  {mlResult.metrics.r2}
                </span>
                <span className="text-xs text-emerald-700 font-medium">/ 1.00</span>
              </div>
              <p className="text-[10px] text-emerald-700 mt-1">
                {language === 'mr'
                  ? 'बाजारातील बदलांचे स्पष्टीकरण'
                  : language === 'hi'
                  ? 'बाजार उतार-चढ़ाव की व्याख्या'
                  : 'Proportion of market variance captured'}
              </p>
            </div>
          </div>

          <p className="mt-2 text-[10px] text-stone-700 italic">
            * {ui.noFakeMetricsNote}
          </p>
        </div>
      )}

      {/* Forecast Table */}
      {mlResult.forecast && mlResult.forecast.length > 0 && (
        <div className="p-4 border-b border-stone-100">
          <span className="text-xs font-bold uppercase tracking-wider text-stone-600 block mb-2.5">
            {ui.forecastHeader}
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {mlResult.forecast.map((fc, i) => {
              const isUp = fc.projectedTrend === 'UP';
              const isDown = fc.projectedTrend === 'DOWN';

              return (
                <div
                  key={fc.targetDate ? `ml-fc-${fc.targetDate}` : `ml-fc-${fc.dayOffset ?? i}`}
                  className="p-3 rounded-lg border border-stone-200 bg-white hover:border-emerald-300 transition-colors"
                >
                  <div className="flex items-center justify-between text-xs text-stone-700 mb-1">
                    <span className="font-semibold text-stone-700">
                      +{fc.dayOffset} {language === 'mr' ? 'दिवस' : language === 'hi' ? 'दिन' : 'Days'}
                    </span>
                    <span className="font-mono text-[11px]">{fc.targetDate}</span>
                  </div>

                  <div className="flex items-baseline justify-between mt-1">
                    <span className="text-lg font-bold font-mono text-stone-900">
                      ₹{fc.predictedPrice.toLocaleString('en-IN')}
                    </span>
                    <span
                      className={`inline-flex items-center gap-0.5 text-xs font-bold ${
                        isUp ? 'text-emerald-600' : isDown ? 'text-rose-600' : 'text-stone-500'
                      }`}
                    >
                      {isUp && <TrendingUp className="w-3.5 h-3.5" />}
                      {isDown && <TrendingDown className="w-3.5 h-3.5" />}
                      {!isUp && !isDown && <Minus className="w-3.5 h-3.5" />}
                      {fc.projectedTrend}
                    </span>
                  </div>

                  <div className="mt-2 pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-700">
                    <span>
                      {language === 'mr' ? 'अपेक्षित कक्षा' : language === 'hi' ? 'अनुमानित दायरा' : '90% Range'}:
                    </span>
                    <span className="font-mono font-medium text-stone-800">
                      ₹{fc.priceRangeMin} - ₹{fc.priceRangeMax}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Provenance & Source Footer */}
      <div className="px-4 py-2.5 bg-stone-50 text-xs text-stone-700 flex flex-wrap items-center justify-between gap-2 border-t border-stone-100">
        <div className="flex items-center gap-2">
          <Database className="w-3.5 h-3.5 text-stone-700" />
          <span>
            {ui.datasetHeader}: <strong className="text-stone-700">{mlResult.dataSource.name}</strong>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span>
            {ui.recordCount}: <strong className="font-mono text-stone-700">{mlResult.dataSource.recordCount}</strong>
          </span>
          <span className="text-stone-300">•</span>
          <span>
            {ui.dateRange}: <strong className="font-mono text-stone-700">{mlResult.dataSource.dateRange}</strong>
          </span>
        </div>
      </div>
    </div>
  );
};
