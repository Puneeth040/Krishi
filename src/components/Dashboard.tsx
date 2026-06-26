import React, { useState, useEffect } from 'react';
import { 
  Cloud, 
  Wind, 
  Droplets, 
  TrendingUp, 
  MapPin, 
  RefreshCw, 
  AlertCircle, 
  Newspaper,
  Sun,
  Moon,
  CloudRain,
  Milk,
  Navigation,
  Sprout,
  TrendingDown,
  Minus,
  Calculator,
  Camera,
  Ruler,
  MessageSquare,
  HelpCircle,
  FileText,
  Waves
} from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, YAxis, XAxis, Tooltip, CartesianGrid } from 'recharts';
import { getFarmerData, getProactiveAdvice, generateSpeech, registerAudio, stopGlobalSpeech } from '@/src/services/gemini';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { translations, Language } from '../constants/translations';
import { locationTranslations } from '../constants/location_translations';
import { cn } from '../lib/utils';
import { Bot, Sparkles, Volume2 } from 'lucide-react';

export function Dashboard({ 
  lang, 
  userLocation,
  crop,
  sowingDate
}: { 
  lang: Language, 
  userLocation?: string,
  crop?: string,
  sowingDate?: string
}) {
  const t = translations[lang];
  
  const translateLocation = (loc: string) => {
    if (!loc) return loc;
    return loc.split(', ').map(part => locationTranslations[lang]?.[part] || part).join(', ');
  };

  const [data, setData] = useState<any>(null);
  const [proactiveAdvice, setProactiveAdvice] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAdvice, setLoadingAdvice] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState(userLocation || t.defaultLocation);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [selectedTrendCrop, setSelectedTrendCrop] = useState<any>(null);
  const isActiveRef = React.useRef(true);

  useEffect(() => {
    isActiveRef.current = true;
    return () => {
      isActiveRef.current = false;
      stopGlobalSpeech();
    };
  }, []);

  useEffect(() => {
    if (userLocation) {
      setLocation(userLocation);
    }
  }, [userLocation]);

  useEffect(() => {
    fetchData();
  }, [location]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const langMap: Record<string, string> = {
        en: 'English', hi: 'Hindi', mr: 'Marathi', te: 'Telugu', ta: 'Tamil', kn: 'Kannada', bn: 'Bengali'
      };
      const result = await getFarmerData(location, langMap[lang] || 'English');
      if (!isActiveRef.current) return;
      setData(result);
      if (result.weather?.alerts) {
        (window as any).setAppNotifications?.(result.weather.alerts);
      }
      
      // Fetch proactive advice after main data is loaded
      fetchAdvice(result);
      
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
      if (isActiveRef.current) {
        setError(t.failedLoad);
        setLoading(false);
      }
    }
  };

  const fetchAdvice = async (currentData: any) => {
    setLoadingAdvice(true);
    try {
      const langMap: Record<string, string> = {
        en: 'English', hi: 'Hindi', mr: 'Marathi', te: 'Telugu', ta: 'Tamil', kn: 'Kannada', bn: 'Bengali'
      };
      const advice = await getProactiveAdvice(langMap[lang] || 'English', { crop, location, sowingDate }, currentData);
      if (isActiveRef.current) setProactiveAdvice(advice);
    } catch (err) {
      console.error("Failed to fetch proactive advice:", err);
    } finally {
      if (isActiveRef.current) setLoadingAdvice(false);
    }
  };

  const speakText = async (text: string) => {
    if (isSpeaking) return;
    setIsSpeaking(true);
    try {
      const audioUrl = await generateSpeech(text);
      if (!isActiveRef.current) {
        setIsSpeaking(false);
        return;
      }
      if (audioUrl) {
        const audio = new Audio(audioUrl);
        registerAudio(audio);
        audio.onended = () => {
          if (isActiveRef.current) setIsSpeaking(false);
        };
        audio.play().catch(() => {
          if (isActiveRef.current) setIsSpeaking(false);
        });
      } else {
        setIsSpeaking(false);
      }
    } catch (err) {
      console.error("TTS failed:", err);
      if (isActiveRef.current) setIsSpeaking(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 h-64 bg-zinc-100 dark:bg-slate-800 animate-pulse rounded-3xl" />
        <div className="h-64 bg-zinc-100 dark:bg-slate-800 animate-pulse rounded-3xl" />
        <div className="h-64 bg-zinc-100 dark:bg-slate-800 animate-pulse rounded-3xl" />
        <div className="md:col-span-2 h-64 bg-zinc-100 dark:bg-slate-800 animate-pulse rounded-3xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-12 text-center bg-red-50 dark:bg-red-900/10 rounded-3xl border border-red-100 dark:border-red-900/20">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <p className="text-red-800 dark:text-red-300 text-lg font-medium">{error}</p>
        <button 
          onClick={fetchData}
          className="mt-6 px-8 py-3 bg-red-600 text-white rounded-full hover:bg-red-700 transition-all shadow-lg hover:shadow-red-200 dark:shadow-none"
        >
          {t.retry}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.2em] ml-1">{t.milkDairy.operatingFrom}</span>
          <div className="flex items-center gap-3 px-5 py-3 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-zinc-100 dark:border-slate-800">
            <MapPin className="w-5 h-5 text-emerald-600" />
            <span className="font-bold text-zinc-800 dark:text-slate-200">{translateLocation(location)}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 self-end sm:self-center">
          <button 
            onClick={() => (window as any).toggleAppTheme?.()}
            className="p-4 bg-white dark:bg-slate-900 hover:bg-zinc-50 dark:hover:bg-slate-800 rounded-2xl shadow-sm border border-zinc-100 dark:border-slate-800 transition-all text-slate-500 dark:text-slate-400 group"
          >
            {document.documentElement.classList.contains('dark') ? <Sun className="w-5 h-5 group-hover:text-amber-500" /> : <Moon className="w-5 h-5 group-hover:text-blue-500" />}
          </button>
          <button 
            onClick={fetchData}
            className="p-4 bg-white dark:bg-slate-900 hover:bg-zinc-50 dark:hover:bg-slate-800 rounded-2xl shadow-sm border border-zinc-100 dark:border-slate-800 transition-all active:rotate-180 duration-500 group"
          >
            <RefreshCw className="w-5 h-5 text-zinc-500 dark:text-slate-400 group-hover:text-emerald-600 transition-colors" />
          </button>
        </div>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Proactive Advice - Chitti's Tips */}
        {(proactiveAdvice.length > 0 || loadingAdvice) && (
          <Card className="md:col-span-3 bg-indigo-50 dark:bg-indigo-900/10 border-indigo-100 dark:border-indigo-800/50 overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
              <Bot className="w-24 h-24 text-indigo-600" />
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-indigo-950 dark:text-indigo-200 flex items-center gap-2 text-sm font-black uppercase tracking-widest">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                {t.chittiProactiveTitle || "Chitti's Proactive Tips"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingAdvice ? (
                <div className="flex items-center gap-3 animate-pulse">
                  <div className="w-8 h-8 bg-indigo-200 dark:bg-indigo-800 rounded-full" />
                  <div className="h-4 bg-indigo-100 dark:bg-indigo-800 rounded w-2/3" />
                </div>
              ) : (
                <div className="space-y-3">
                  {proactiveAdvice.map((advice, i) => (
                    <div key={i} className="flex items-start gap-3 group/item">
                      <div className="mt-1 w-6 h-6 rounded-full bg-white dark:bg-indigo-900 flex items-center justify-center shadow-sm border border-indigo-100 dark:border-indigo-800 shrink-0">
                        <Bot className="w-3 h-3 text-indigo-600" />
                      </div>
                      <div className="flex-1 flex items-center justify-between gap-4">
                        <p className="text-sm font-bold text-indigo-900 dark:text-indigo-100 leading-relaxed">
                          {advice}
                        </p>
                        <button 
                          onClick={() => speakText(advice)}
                          className="p-2 hover:bg-indigo-100 dark:hover:bg-indigo-800 rounded-full transition-colors text-indigo-600 dark:text-indigo-400"
                        >
                          <Volume2 className={cn("w-4 h-4", isSpeaking && "animate-pulse")} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Weather - Large Card */}
        <Card className="md:col-span-2 bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-700 text-white border-none relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
            <Sun className="w-48 h-48" />
          </div>
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Cloud className="w-5 h-5" />
              {t.weather}
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <div className="text-7xl font-black tracking-tighter">{data.weather.temp}</div>
                <div className="text-xl font-medium text-sky-100 mt-1">{data.weather.condition}</div>
                <div className="flex flex-wrap gap-4 mt-6">
                  <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10">
                    <div className="text-xs text-sky-200 uppercase font-bold tracking-wider">{t.humidity}</div>
                    <div className="font-bold">{data.weather.humidity}</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10">
                    <div className="text-xs text-sky-200 uppercase font-bold tracking-wider">{t.aqi}</div>
                    <div className="font-bold">{data.weather.aqi}</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10">
                    <div className="text-xs text-sky-200 uppercase font-bold tracking-wider">{t.wind}</div>
                    <div className="font-bold">{data.weather.wind || `12 ${t.kmh}`}</div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 w-full md:w-auto">
                {data.weather.forecast?.slice(0, 3).map((f: any, i: number) => (
                  <div key={i} className="text-center p-3 bg-white/5 rounded-2xl border border-white/5">
                    <div className="text-xs text-sky-200 font-bold mb-2">{f.day}</div>
                    {f.condition.includes('Rain') ? <CloudRain className="w-6 h-6 mx-auto mb-2" /> : f.condition.includes('Sun') ? <Sun className="w-6 h-6 mx-auto mb-2" /> : <Cloud className="w-6 h-6 mx-auto mb-2" />}
                    <div className="font-bold">{f.temp}</div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Soil Moisture - Square Card */}
        <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-none flex flex-col justify-between group">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Droplets className="w-5 h-5" />
              {t.soilHealth}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4">
              <div className="relative inline-block">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/10" />
                  <circle 
                    cx="64" cy="64" r="58" 
                    stroke="currentColor" 
                    strokeWidth="8" 
                    fill="transparent" 
                    strokeDasharray="364" 
                    strokeDashoffset={364 - (364 * (parseInt(data.weather.moisture) || 42) / 100)} 
                    className="text-white transition-all duration-1000" 
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-black">{data.weather.moisture || "42%"}</span>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-100">{t.moisture}</span>
                </div>
              </div>
              <p className="mt-4 text-emerald-50 text-sm font-medium">{t.optimal}</p>
            </div>
          </CardContent>
        </Card>

        {/* Weather Alerts & Forecast Expansion */}
        {data.weather.alerts && data.weather.alerts.length > 0 && (
          <div className="md:col-span-3">
            <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-4 animate-pulse">
              <AlertCircle className="w-6 h-6 text-rose-600" />
              <div className="flex-1 flex items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-black text-rose-600 uppercase tracking-widest">{t.weatherAlert}</div>
                  <div className="text-sm font-bold text-rose-900 dark:text-rose-300">{data.weather.alerts[0]}</div>
                </div>
                <button 
                  onClick={() => speakText(`${t.weatherAlert}: ${data.weather.alerts[0]}`)}
                  className="p-2 hover:bg-rose-100 dark:hover:bg-rose-800 rounded-full transition-colors text-rose-600 dark:text-rose-400"
                >
                  <Volume2 className={cn("w-4 h-4", isSpeaking && "animate-pulse")} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Crop Recommendations */}
        <Card className="md:col-span-3 bg-white dark:bg-slate-900 border-zinc-100 dark:border-slate-800 shadow-xl shadow-zinc-200/50 dark:shadow-none">
          <CardHeader className="border-b border-zinc-50 dark:border-slate-800 pb-4">
            <CardTitle className="flex items-center gap-2 text-zinc-800 dark:text-white font-black">
              <Sprout className="w-6 h-6 text-emerald-500" />
              {t.smartCropRecommendations}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {data.recommendations?.map((rec: any, i: number) => (
                <div key={i} className="p-6 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-3xl border border-emerald-100 dark:border-emerald-900/20">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-black text-slate-900 dark:text-white">{t.crops[rec.crop] || rec.crop}</h4>
                    <span className={cn(
                      "text-[10px] font-black uppercase px-2 py-1 rounded-full",
                      rec.risk === 'Low' ? "bg-emerald-100 text-emerald-700" : 
                      rec.risk === 'Medium' ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"
                    )}>
                      {t.riskLevels[rec.risk] || rec.risk} {t.risk}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-4">{rec.reason}</p>
                  <div className="flex items-center justify-between pt-4 border-t border-emerald-100 dark:border-emerald-900/20">
                    <div className="flex flex-col">
                      <div className="text-[10px] font-black text-slate-400 uppercase">{t.estYield}</div>
                      <div className="text-sm font-black text-emerald-600">{rec.yield}</div>
                    </div>
                    <button 
                      onClick={() => speakText(`${t.crops[rec.crop] || rec.crop}. ${rec.reason}. ${t.estYield}: ${rec.yield}`)}
                      className="p-2 hover:bg-emerald-100 dark:hover:bg-emerald-800 rounded-full transition-colors text-emerald-600 dark:text-emerald-400"
                    >
                      <Volume2 className={cn("w-4 h-4", isSpeaking && "animate-pulse")} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Milk Dairy Section */}
        <Card className="md:col-span-3 bg-white dark:bg-slate-900 border-zinc-100 dark:border-slate-800 shadow-xl shadow-zinc-200/50 dark:shadow-none">
          <CardHeader className="flex flex-row items-center justify-between border-b border-zinc-50 dark:border-slate-800 pb-4">
            <CardTitle className="flex items-center gap-2 text-zinc-800 dark:text-white font-black">
              <Milk className="w-6 h-6 text-blue-500" />
              {t.milkDairy.title}
            </CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-full">
                {t.milkDairy.rates}
              </span>
            </div>
          </CardHeader>
          <CardContent className="pt-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Cow Milk Card */}
              <div className="p-6 bg-blue-50/50 dark:bg-blue-900/10 rounded-[2rem] border border-blue-100 dark:border-blue-900/20 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                  <Milk className="w-24 h-24" />
                </div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center shadow-sm">🐄</div>
                  <h4 className="text-xl font-black text-slate-900 dark:text-white">{t.milkDairy.cow}</h4>
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-xs font-black text-blue-600 uppercase tracking-widest mb-1">{t.milkDairy.pricePerLitre}</div>
                    <div className="text-4xl font-black text-slate-900 dark:text-white">{data.milkRates?.cow?.price || `${t.currencySymbol}42.50`}</div>
                  </div>
                  <div className="flex gap-4">
                    <div className="text-center">
                      <div className="text-[10px] font-black text-slate-400 uppercase mb-1">{t.milkDairy.fat}</div>
                      <div className="px-3 py-1 bg-white dark:bg-slate-800 rounded-lg font-bold text-sm">{data.milkRates?.cow?.fat || "4.2%"}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-[10px] font-black text-slate-400 uppercase mb-1">{t.milkDairy.snf}</div>
                      <div className="px-3 py-1 bg-white dark:bg-slate-800 rounded-lg font-bold text-sm">{data.milkRates?.cow?.snf || "8.5%"}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Buffalo Milk Card */}
              <div className="p-6 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-[2rem] border border-indigo-100 dark:border-indigo-900/20 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                  <Milk className="w-24 h-24" />
                </div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center shadow-sm">🐃</div>
                  <h4 className="text-xl font-black text-slate-900 dark:text-white">{t.milkDairy.buffalo}</h4>
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-1">{t.milkDairy.pricePerLitre}</div>
                    <div className="text-4xl font-black text-slate-900 dark:text-white">{data.milkRates?.buffalo?.price || `${t.currencySymbol}58.00`}</div>
                  </div>
                  <div className="flex gap-4">
                    <div className="text-center">
                      <div className="text-[10px] font-black text-slate-400 uppercase mb-1">{t.milkDairy.fat}</div>
                      <div className="px-3 py-1 bg-white dark:bg-slate-800 rounded-lg font-bold text-sm">{data.milkRates?.buffalo?.fat || "6.5%"}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-[10px] font-black text-slate-400 uppercase mb-1">{t.milkDairy.snf}</div>
                      <div className="px-3 py-1 bg-white dark:bg-slate-800 rounded-lg font-bold text-sm">{data.milkRates?.buffalo?.snf || "9.0%"}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {(data.nearbyDairies || []).map((dairy: any, i: number) => (
                <button 
                  key={i} 
                  onClick={() => window.open(`https://www.google.com/maps/search/${encodeURIComponent(dairy.name + ' ' + location)}`, '_blank')}
                  className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 group hover:border-blue-200 dark:hover:border-blue-800 hover:bg-blue-50/30 transition-all text-left"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-bold text-slate-800 dark:text-white text-xs truncate">{dairy.name}</div>
                    <div className="text-[10px] font-black text-blue-500 flex items-center gap-1">
                      <Navigation className="w-3 h-3" />
                      {dairy.distance}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.milkDairy.nearby}</div>
                    {dairy.source && (
                      <div className="text-[8px] text-slate-300 dark:text-slate-600 truncate max-w-[60px]">{dairy.source}</div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Market Rates */}
        <Card className="md:col-span-2 bg-white dark:bg-slate-900 border-zinc-100 dark:border-slate-800 shadow-xl shadow-zinc-200/50 dark:shadow-none">
          <CardHeader className="flex flex-row items-center justify-between border-b border-zinc-50 dark:border-slate-800 pb-4">
            <CardTitle className="flex items-center gap-2 text-zinc-800 dark:text-white">
              <TrendingUp className="w-5 h-5 text-rose-500" />
              {t.marketRates}
            </CardTitle>
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 bg-zinc-100 dark:bg-slate-800 px-2 py-1 rounded-md">{t.updatedAt.replace('{time}', '2h')}</span>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {data.marketRates.map((item: any, i: number) => {
                const cropName = t.crops[item.crop] || item.crop;
                return (
                  <div 
                    key={i} 
                    onClick={() => setSelectedTrendCrop(item)}
                    className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-slate-800/50 rounded-2xl border border-zinc-100 dark:border-slate-800 hover:border-emerald-200 dark:hover:border-emerald-800 hover:bg-emerald-50/30 transition-all group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white dark:bg-slate-700 rounded-xl shadow-sm flex items-center justify-center text-lg">
                        {item.crop.includes('Wheat') ? '🌾' : item.crop.includes('Rice') ? '🍚' : item.crop.includes('Cotton') ? '☁️' : '🌱'}
                      </div>
                      <div>
                        <div className="font-bold text-zinc-800 dark:text-slate-200">{cropName}</div>
                        <div className="text-[10px] text-zinc-400 uppercase font-bold tracking-tighter">
                          {item.source || t.localMarket}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 flex-1 justify-end">
                      <div className="w-20 h-10">
                        {item.history && item.history.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={item.history}>
                              <YAxis hide domain={['auto', 'auto']} />
                              <Line 
                                type="monotone" 
                                dataKey="price" 
                                stroke={item.trend === 'up' ? '#10b981' : item.trend === 'down' ? '#f43f5e' : '#71717a'} 
                                strokeWidth={2} 
                                dot={false} 
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <div className="w-full h-0.5 bg-zinc-200 dark:bg-slate-700 rounded-full" />
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <div className="text-lg font-black text-emerald-600">{item.price}</div>
                          <button 
                            onClick={() => speakText(`${cropName}: ${item.price} ${t.per} ${item.unit}`)}
                            className="p-1.5 hover:bg-emerald-100 dark:hover:bg-emerald-800 rounded-lg transition-colors text-emerald-600 dark:text-emerald-400"
                          >
                            <Volume2 className={cn("w-3.5 h-3.5", isSpeaking && "animate-pulse")} />
                          </button>
                          <div className={cn(
                            "px-1.5 py-0.5 rounded-md flex items-center gap-1",
                            item.trend === 'up' ? "bg-emerald-100 text-emerald-600" : 
                            item.trend === 'down' ? "bg-rose-100 text-rose-600" : "bg-zinc-100 text-zinc-500"
                          )}>
                            {item.trend === 'up' ? <TrendingUp className="w-3 h-3" /> : item.trend === 'down' ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                            {(item.trend === 'stable' || !item.trend) && <span className="text-[8px] font-black uppercase tracking-tighter">{t.stable}</span>}
                          </div>
                        </div>
                        <div className="text-[10px] text-zinc-400 font-bold">{t.per} {item.unit}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Agri News */}
        <Card className="bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800/50">
          <CardHeader>
            <CardTitle className="text-amber-900 dark:text-amber-300 flex items-center gap-2 text-sm">
              <Newspaper className="w-4 h-4" />
              {t.news}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-xs font-bold text-amber-800 dark:text-amber-400 hover:underline cursor-pointer">{t.newsPlaceholder1}</div>
              <div className="h-px bg-amber-200/50 dark:bg-amber-800/50" />
              <div className="text-xs font-bold text-amber-800 dark:text-amber-400 hover:underline cursor-pointer">{t.newsPlaceholder2}</div>
            </div>
          </CardContent>
        </Card>

        {/* Gov Schemes */}
        <Card className="bg-indigo-50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-800/50">
          <CardHeader>
            <CardTitle className="text-indigo-900 dark:text-indigo-300 flex items-center gap-2 text-sm">
              <AlertCircle className="w-4 h-4" />
              {t.pmKisanUpdate}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-indigo-800 dark:text-indigo-400 font-medium">{t.pmKisanDesc}</p>
            <button className="mt-3 text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200">{t.viewDetails} →</button>
          </CardContent>
        </Card>

        {/* Detailed Trends Card */}
        <Card className="md:col-span-3 bg-white dark:bg-slate-900 border-zinc-100 dark:border-slate-800 shadow-xl shadow-zinc-200/50 dark:shadow-none">
          <CardHeader className="flex flex-row items-center justify-between border-b border-zinc-50 dark:border-slate-800 pb-4">
            <CardTitle className="flex items-center gap-2 text-zinc-800 dark:text-white">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
              {t.detailedTrends}
            </CardTitle>
            {selectedTrendCrop && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-emerald-600">{t.crops[selectedTrendCrop.crop] || selectedTrendCrop.crop}</span>
              </div>
            )}
          </CardHeader>
          <CardContent className="pt-6">
            {selectedTrendCrop ? (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="text-lg font-black text-zinc-800 dark:text-white">{t.priceHistory}</h4>
                    <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest">{t.crops[selectedTrendCrop.crop] || selectedTrendCrop.crop} - {selectedTrendCrop.source}</p>
                  </div>
                  <div className="text-left sm:text-right">
                    <div className="text-2xl font-black text-emerald-600">{selectedTrendCrop.price}</div>
                    <div className="text-[10px] text-zinc-400 font-bold uppercase">{t.per} {selectedTrendCrop.unit}</div>
                  </div>
                </div>

                <div className="h-[300px] w-full bg-zinc-50 dark:bg-slate-800/30 rounded-3xl p-4 border border-zinc-100 dark:border-slate-800">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={selectedTrendCrop.history}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis 
                        dataKey="day" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                        dy={10}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                        dx={-10}
                        domain={['auto', 'auto']}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1e293b', 
                          border: 'none', 
                          borderRadius: '12px',
                          color: '#fff',
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}
                        itemStyle={{ color: '#10b981' }}
                        cursor={{ stroke: '#10b981', strokeWidth: 2 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="price" 
                        stroke="#10b981" 
                        strokeWidth={4} 
                        dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
                        activeDot={{ r: 6, strokeWidth: 0 }}
                        animationDuration={1500}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100 dark:border-emerald-900/20">
                    <div className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Max Price</div>
                    <div className="text-lg font-black text-emerald-900 dark:text-emerald-100">
                      {t.currencySymbol}{Math.max(...selectedTrendCrop.history.map((h: any) => h.price))}
                    </div>
                  </div>
                  <div className="p-4 bg-rose-50 dark:bg-rose-900/10 rounded-2xl border border-rose-100 dark:border-rose-900/20">
                    <div className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-1">Min Price</div>
                    <div className="text-lg font-black text-rose-900 dark:text-rose-100">
                      {t.currencySymbol}{Math.min(...selectedTrendCrop.history.map((h: any) => h.price))}
                    </div>
                  </div>
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/20">
                    <div className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Avg Price</div>
                    <div className="text-lg font-black text-blue-900 dark:text-blue-100">
                      {t.currencySymbol}{Math.round(selectedTrendCrop.history.reduce((acc: number, curr: any) => acc + curr.price, 0) / selectedTrendCrop.history.length)}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-[300px] flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-16 h-16 bg-zinc-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-8 h-8 text-zinc-400" />
                </div>
                <div>
                  <h4 className="font-black text-zinc-800 dark:text-white">{t.detailedTrends}</h4>
                  <p className="text-sm text-zinc-400 font-bold max-w-[200px] mx-auto">{t.selectCropToView}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Tools Section */}
        <div className="md:col-span-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <button 
            onClick={() => (window as any).openCropAdvisory()}
            className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-zinc-100 dark:border-slate-800 shadow-sm hover:border-emerald-500 transition-all group flex flex-col items-center gap-3 cursor-pointer"
          >
            <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Sprout className="w-6 h-6 text-emerald-600" />
            </div>
            <span className="text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">{t.cropAdvisory.title}</span>
          </button>
          <button 
            onClick={() => (window as any).openCalculators()}
            className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-zinc-100 dark:border-slate-800 shadow-sm hover:border-emerald-500 transition-all group flex flex-col items-center gap-3 cursor-pointer"
          >
            <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Calculator className="w-6 h-6 text-emerald-600" />
            </div>
            <span className="text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">{t.calculators}</span>
          </button>
          <button 
            onClick={() => (window as any).openScanner()}
            className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-zinc-100 dark:border-slate-800 shadow-sm hover:border-rose-500 transition-all group flex flex-col items-center gap-3 cursor-pointer"
          >
            <div className="w-12 h-12 bg-rose-50 dark:bg-rose-900/30 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Camera className="w-6 h-6 text-rose-600" />
            </div>
            <span className="text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">{t.aiScanner}</span>
          </button>
          <button 
            onClick={() => (window as any).openLandMeasure()}
            className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-zinc-100 dark:border-slate-800 shadow-sm hover:border-blue-500 transition-all group flex flex-col items-center gap-3 cursor-pointer"
          >
            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Ruler className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">{t.landMeasureTool}</span>
          </button>
          <button 
            onClick={() => (window as any).openTBDam()}
            className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-zinc-100 dark:border-slate-800 shadow-sm hover:border-blue-500 transition-all group flex flex-col items-center gap-3 cursor-pointer relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-8 h-8 bg-blue-500/10 rounded-bl-full flex items-center justify-center text-[8px] font-black text-blue-600 uppercase tracking-widest">
              Live
            </div>
            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Waves className="w-6 h-6 text-blue-600 animate-pulse" />
            </div>
            <span className="text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest text-center">{t.tbDamTitle}</span>
          </button>
          <button 
            onClick={() => (window as any).openHelp()}
            className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-zinc-100 dark:border-slate-800 shadow-sm hover:border-rose-500 transition-all group flex flex-col items-center gap-3 cursor-pointer"
          >
            <div className="w-12 h-12 bg-rose-50 dark:bg-rose-900/30 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <HelpCircle className="w-6 h-6 text-rose-600" />
            </div>
            <span className="text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">{t.help}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
