import React, { useEffect, useState } from 'react';
import { WeatherData, SupportedLanguage } from '../../types';
import {
  CloudRain,
  Sun,
  Cloud,
  Droplets,
  Wind,
  ShieldAlert,
  ShieldCheck,
  Radio,
  Database,
  Calendar,
  RefreshCw,
  MapPin,
} from 'lucide-react';

interface Props {
  district?: string;
  latitude?: number;
  longitude?: number;
  weather?: WeatherData | null;
  language: SupportedLanguage;
  onRefresh?: () => void;
  className?: string;
}

export const OpenMeteoWeatherCard: React.FC<Props> = ({
  district = '',
  latitude,
  longitude,
  weather: initialWeather,
  language,
  onRefresh,
  className = '',
}) => {
  const [weather, setWeather] = useState<WeatherData | null>(initialWeather || null);
  const [loading, setLoading] = useState<boolean>(!initialWeather);
  const [error, setError] = useState<string | null>(null);

  const fetchWeather = async (dist: string, lat?: number, lon?: number) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (lat !== undefined && lon !== undefined) {
        params.set('lat', lat.toString());
        params.set('lon', lon.toString());
      }
      if (dist) {
        params.set('district', dist);
      }
      const res = await fetch(`/api/weather?${params.toString()}`);
      if (!res.ok) throw new Error('Weather fetch failed');
      const data = await res.json();
      setWeather(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load weather');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialWeather) {
      setWeather(initialWeather);
      setLoading(false);
    } else {
      fetchWeather(district, latitude, longitude);
    }
  }, [initialWeather, district, latitude, longitude]);

  const ui = {
    en: {
      weatherFor: 'Weather for',
      liveBadge: 'Open-Meteo Satellite Feed',
      cachedBadge: 'Regional Agrometeorological Dataset',
      temp: 'Current Temperature',
      humidity: 'Humidity',
      rainfall48h: '48h Rainfall Forecast',
      riskLevel: 'Moisture Risk',
      retrievedAt: 'Retrieved',
      forecastTitle: '7-Day Atmospheric & Rainfall Trajectory',
      highRiskWarning: 'High humidity & expected rain increase spoilage risk for perishable crops. Plan transport or storage accordingly.',
      lowRiskNote: 'Favorable harvesting and transport weather with minimal rainfall risk.',
      refreshBtn: 'Refresh Weather',
      wind: 'Wind',
      highLow: 'High / Low',
    },
    mr: {
      weatherFor: 'हवामान अंदाज:',
      liveBadge: 'ओपन-मेटिओ थेट उपग्रह माहिती',
      cachedBadge: 'स्थानिक कृषी हवामान डेटासेट',
      temp: 'चालू तापमान',
      humidity: 'आर्द्रता',
      rainfall48h: '४८ तासांचा पाऊस अंदाज',
      riskLevel: 'ओलावा जोखीम',
      retrievedAt: 'माहिती वेळ',
      forecastTitle: 'पुढील ७ दिवसांचा पाऊस व तापमान अंदाज',
      highRiskWarning: 'जास्त आर्द्रता व संभाव्य पावसामुळे नाशवंत शेतमालाला बुरशी व सडण्याचा धोका आहे. वाहतूक नियोजन त्वरित करा.',
      lowRiskNote: 'शेतमाल काढणी व वाहतुकीसाठी हवामान अनुकूल, पावसाचा धोका कमी.',
      refreshBtn: 'हवामान ताजे करा',
      wind: 'वारा',
      highLow: 'कमाल / किमान',
    },
    hi: {
      weatherFor: 'मौसम पूर्वानुमान:',
      liveBadge: 'ओपन-मेटिओ लाइव सैटेलाइट डेटा',
      cachedBadge: 'स्थानीय कृषि मौसम डेटासेट',
      temp: 'वर्तमान तापमान',
      humidity: 'सापेक्ष आर्द्रता',
      rainfall48h: '48 घंटों में बारिश',
      riskLevel: 'नमी जोखिम',
      retrievedAt: 'प्राप्ति समय',
      forecastTitle: 'अगले 7 दिनों का वर्षा व तापमान रुझान',
      highRiskWarning: 'अधिक आर्द्रता और बारिश से खराब होने वाली फसलों में सड़न का जोखिम है। तुरंत बिक्री या सुरक्षित भंडारण करें।',
      lowRiskNote: 'फसल कटाई व परिवहन के लिए मौसम अनुकूल, बारिश का खतरा कम।',
      refreshBtn: 'मौसम अपडेट करें',
      wind: 'हवा',
      highLow: 'अधिकतम / न्यूनतम',
    },
  }[language];

  if (loading) {
    return (
      <div className={`p-6 bg-white rounded-2xl border border-stone-200 shadow-2xs animate-pulse ${className}`}>
        <div className="h-4 bg-stone-200 rounded-lg w-1/3 mb-4"></div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="h-20 bg-stone-100 rounded-xl"></div>
          <div className="h-20 bg-stone-100 rounded-xl"></div>
          <div className="h-20 bg-stone-100 rounded-xl"></div>
          <div className="h-20 bg-stone-100 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (!weather) return null;

  const isHighRain = weather.rainRisk === 'HIGH' || weather.rainRisk === 'SEVERE';
  const isModerateRain = weather.rainRisk === 'MODERATE';
  const isSunny = weather.rainRisk === 'LOW' && weather.maxRainNext48hMm < 1;

  // Dynamic aesthetic gradient based on real condition
  const bgStyle = isHighRain
    ? 'from-sky-50 via-cyan-50/40 to-white border-sky-200'
    : isModerateRain
    ? 'from-teal-50/60 via-emerald-50/30 to-white border-teal-200'
    : 'from-amber-50/60 via-orange-50/20 to-white border-amber-200/80';

  const headerAccent = isHighRain
    ? 'text-sky-900'
    : isModerateRain
    ? 'text-teal-950'
    : 'text-[#173D32]';

  const todayForecast = weather.dailyForecast && weather.dailyForecast.length > 0 ? weather.dailyForecast[0] : null;
  const summary = language === 'mr' ? weather.summaryMr : language === 'hi' ? weather.summaryHi : weather.summaryEn;

  return (
    <div className={`bg-gradient-to-b ${bgStyle} rounded-2xl border shadow-sm overflow-hidden ${className}`}>
      {/* Top Banner with location & live badge */}
      <div className="p-5 border-b border-stone-200/60">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-2xs ${
              isHighRain ? 'bg-sky-600 text-white' : isModerateRain ? 'bg-[#173D32] text-white' : 'bg-[#D6A844] text-[#0F2821]'
            }`}>
              {isHighRain ? (
                <CloudRain className="w-5 h-5" />
              ) : isModerateRain ? (
                <Cloud className="w-5 h-5" />
              ) : (
                <Sun className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs text-stone-500 font-semibold">
                <MapPin className="w-3.5 h-3.5 text-[#173D32]" />
                <span>{ui.weatherFor}</span>
              </div>
              <h3 className={`text-base font-black ${headerAccent} tracking-tight`}>
                {weather.district || district || 'Maharashtra'}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                weather.isLive
                  ? 'bg-emerald-100 text-[#173D32] border border-emerald-300'
                  : 'bg-amber-100 text-amber-900 border border-amber-300'
              }`}
            >
              {weather.isLive ? <Radio className="w-3 h-3 text-[#173D32] animate-pulse" /> : <Database className="w-3 h-3" />}
              {weather.isLive ? ui.liveBadge : ui.cachedBadge}
            </span>

            <button
              type="button"
              onClick={() => {
                if (onRefresh) onRefresh();
                else fetchWeather(district, latitude, longitude);
              }}
              title={ui.refreshBtn}
              className="p-2 text-stone-600 hover:text-stone-900 hover:bg-white/80 rounded-xl transition-all cursor-pointer border border-stone-200/60 shadow-2xs"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Large Primary Weather Hero Metrics */}
        <div className="mt-4 flex flex-wrap items-baseline justify-between gap-4">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl sm:text-5xl font-black text-stone-900 font-mono tracking-tight">
              {Math.round(weather.currentTemp)}°
            </span>
            <span className="text-sm font-bold text-stone-600">C</span>
            {todayForecast && (
              <span className="text-xs text-stone-500 font-medium ml-2">
                {ui.highLow}: <strong>{Math.round(todayForecast.tempMax)}° / {Math.round(todayForecast.tempMin)}°</strong>
              </span>
            )}
          </div>

          <p className="text-xs text-stone-700 font-medium max-w-lg leading-relaxed">
            {summary}
          </p>
        </div>
      </div>

      {/* Primary 4-Metric Grid */}
      <div className="p-4 sm:p-5 grid grid-cols-2 sm:grid-cols-4 gap-3 border-b border-stone-200/60 bg-white/70">
        {/* Humidity */}
        <div className="p-3.5 bg-stone-50/80 rounded-xl border border-stone-200/70">
          <div className="flex items-center gap-1.5 text-xs text-stone-600 font-bold mb-1">
            <Droplets className="w-3.5 h-3.5 text-cyan-600" />
            <span>{ui.humidity}</span>
          </div>
          <div className="text-xl font-black font-mono text-stone-900">
            {weather.currentHumidity}%
          </div>
        </div>

        {/* 48h Rain Forecast */}
        <div className="p-3.5 bg-stone-50/80 rounded-xl border border-stone-200/70">
          <div className="flex items-center gap-1.5 text-xs text-stone-600 font-bold mb-1">
            <CloudRain className="w-3.5 h-3.5 text-blue-600" />
            <span>{ui.rainfall48h}</span>
          </div>
          <div className="text-xl font-black font-mono text-stone-900">
            {weather.maxRainNext48hMm} <span className="text-xs font-normal text-stone-500">mm</span>
          </div>
        </div>

        {/* Moisture Spoilage Risk Level */}
        <div
          className={`p-3.5 rounded-xl border ${
            isHighRain
              ? 'bg-rose-50 border-rose-200 text-rose-950'
              : isModerateRain
              ? 'bg-amber-50 border-amber-200 text-amber-950'
              : 'bg-emerald-50 border-emerald-200 text-emerald-950'
          }`}
        >
          <div className="text-xs font-bold mb-1 flex items-center gap-1.5">
            {isHighRain ? (
              <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
            ) : (
              <ShieldCheck className="w-3.5 h-3.5 text-[#173D32]" />
            )}
            <span>{ui.riskLevel}</span>
          </div>
          <div className="text-lg font-black tracking-wide">
            {weather.rainRisk}
          </div>
        </div>

        {/* Advisory Action */}
        <div className="p-3.5 bg-stone-50/80 rounded-xl border border-stone-200/70 flex flex-col justify-between">
          <div className="text-xs text-stone-600 font-bold">
            {language === 'mr' ? 'काढणी सल्ला' : language === 'hi' ? 'कटाई परामर्श' : 'Harvest Plan'}
          </div>
          <div className="text-xs font-bold text-[#173D32] mt-1">
            {isHighRain
              ? (language === 'mr' ? 'तातडीने सुरक्षित करा' : 'Secure immediately')
              : (language === 'mr' ? 'हवामान अनुकूल' : 'Favorable')}
          </div>
        </div>
      </div>

      {/* Advisory Alert Callout */}
      <div className={`p-3.5 text-xs flex items-start gap-2.5 border-b border-stone-200/60 ${
        isHighRain ? 'bg-amber-50 text-amber-950' : 'bg-emerald-50/60 text-emerald-950'
      }`}>
        <Droplets className="w-4 h-4 shrink-0 mt-0.5 text-blue-600" />
        <p className="leading-relaxed font-medium">
          {isHighRain ? ui.highRiskWarning : ui.lowRiskNote}
        </p>
      </div>

      {/* 7-Day Forecast Strip */}
      {weather.dailyForecast && weather.dailyForecast.length > 0 && (
        <div className="p-4 bg-stone-50/60">
          <span className="text-xs font-extrabold uppercase tracking-wider text-stone-700 block mb-2.5">
            {ui.forecastTitle}
          </span>
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 overflow-x-auto">
            {weather.dailyForecast.slice(0, 7).map((day, idx) => (
              <div
                key={idx}
                className="bg-white p-2.5 rounded-xl border border-stone-200 text-center text-xs flex flex-col items-center justify-between shadow-2xs hover:border-[#173D32] transition-colors"
              >
                <span className="text-[11px] text-stone-600 font-bold font-mono">
                  {new Date(day.date).toLocaleDateString(undefined, { weekday: 'short' })}
                </span>
                <div className="my-1.5">
                  {day.rainfallMm > 5 ? (
                    <CloudRain className="w-4 h-4 text-blue-600 mx-auto" />
                  ) : day.rainfallMm > 0.5 ? (
                    <Cloud className="w-4 h-4 text-teal-600 mx-auto" />
                  ) : (
                    <Sun className="w-4 h-4 text-amber-500 mx-auto" />
                  )}
                </div>
                <div className="text-[11px] font-mono font-bold text-stone-800">
                  {Math.round(day.tempMax)}° / {Math.round(day.tempMin)}°
                </div>
                <span className="text-[10px] text-blue-600 font-mono mt-0.5 font-bold">
                  {day.rainfallMm}mm
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Provenance Footer */}
      <div className="px-4 py-2 bg-stone-100/70 text-[11px] text-stone-600 flex flex-wrap items-center justify-between gap-2 border-t border-stone-200/60">
        <span>
          Source: <strong className="text-stone-800">{weather.source}</strong>
        </span>
        <span>
          {ui.retrievedAt}:{' '}
          <strong className="text-stone-800 font-mono">
            {new Date(weather.retrievedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({weather.weatherDate})
          </strong>
        </span>
      </div>
    </div>
  );
};
