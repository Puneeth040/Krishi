import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Calculator, Droplets, Sprout, TrendingUp, X, IndianRupee, Volume2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { translations, Language } from '../constants/translations';
import { generateSpeech, registerAudio, stopGlobalSpeech } from '../services/gemini';
import { cn } from '../lib/utils';

export function Calculators({ lang, onClose }: { lang: Language, onClose: () => void }) {
  const t = translations[lang];
  const [activeTab, setActiveTab] = useState<'fertilizer' | 'expense'>('fertilizer');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const isActiveRef = useRef(true);

  useEffect(() => {
    isActiveRef.current = true;
    return () => {
      isActiveRef.current = false;
      stopGlobalSpeech();
    };
  }, []);
  
  // Fertilizer State
  const [crop, setCrop] = useState('Rice');
  const [landSize, setLandSize] = useState<string>('1');
  const [unit, setUnit] = useState('Acre');

  // Expense State
  const [seeds, setSeeds] = useState<string>('');
  const [labor, setLabor] = useState<string>('');
  const [fertilizer, setFertilizer] = useState<string>('');

  const calculateFertilizer = () => {
    const baseMap: Record<string, number> = {
      Rice: 50, Wheat: 40, Cotton: 45, Sugarcane: 100, Maize: 60, 
      Soybean: 30, Tomato: 80, Onion: 70, Potato: 90, Chilli: 65
    };
    const base = baseMap[crop] || 30;
    return base * (Number(landSize) || 0);
  };

  const calculateWater = () => {
    const baseMap: Record<string, number> = {
      Rice: 1200, Wheat: 800, Cotton: 900, Sugarcane: 2000, Maize: 700,
      Soybean: 500, Tomato: 1000, Onion: 600, Potato: 850, Chilli: 750
    };
    const base = baseMap[crop] || 500;
    return base * (Number(landSize) || 0);
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

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
    >
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden">
        <div className="p-6 bg-emerald-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calculator className="w-6 h-6" />
            <h2 className="text-xl font-black">{t.farmTools}</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex border-b border-zinc-100 dark:border-slate-800">
          <button 
            onClick={() => setActiveTab('fertilizer')}
            className={`flex-1 py-4 font-bold text-sm transition-all ${activeTab === 'fertilizer' ? 'text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50/50' : 'text-slate-400 hover:text-slate-600'}`}
          >
            {t.fertilizerWater}
          </button>
          <button 
            onClick={() => setActiveTab('expense')}
            className={`flex-1 py-4 font-bold text-sm transition-all ${activeTab === 'expense' ? 'text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50/50' : 'text-slate-400 hover:text-slate-600'}`}
          >
            {t.expenseTracker}
          </button>
        </div>

        <div className="p-8">
          {activeTab === 'fertilizer' ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase mb-2">{t.cropType}</label>
                  <select 
                    value={crop}
                    onChange={(e) => setCrop(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl px-4 py-3 font-bold text-slate-900 dark:text-white"
                  >
                    {Object.keys(t.crops).map(c => (
                      <option key={c} value={c}>{t.crops[c]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase mb-2">{t.landSize}</label>
                  <div className="flex gap-2">
                    <input 
                      type="number" 
                      value={landSize}
                      onChange={(e) => {
                        const val = e.target.value;
                        setLandSize(val.replace(/^0+(?=\d)/, ''));
                      }}
                      className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl px-4 py-3 font-bold text-slate-900 dark:text-white"
                    />
                    <select 
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      className="bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl px-2 py-3 font-bold text-slate-900 dark:text-white"
                    >
                      <option value="Acre">{t.acres}</option>
                      <option value="Hectare">{t.hectare}</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6">
                <div className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-3xl border border-blue-100 dark:border-blue-800">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Droplets className="w-5 h-5 text-blue-600" />
                      <span className="text-xs font-black text-blue-600 uppercase">{t.waterRequirement}</span>
                    </div>
                    <button 
                      onClick={() => speakText(`${t.waterRequirement}: ${calculateWater()} ${t.litre}`)}
                      className="p-2 hover:bg-blue-100 dark:hover:bg-blue-800 rounded-full transition-colors text-blue-600 dark:text-blue-400"
                    >
                      <Volume2 className={cn("w-4 h-4", isSpeaking && "animate-pulse")} />
                    </button>
                  </div>
                  <div className="text-3xl font-black text-slate-900 dark:text-white">{calculateWater()} {t.litre}</div>
                  <p className="text-[10px] text-blue-600/60 font-bold mt-1">{t.estCurrentSeason}</p>
                </div>
                <div className="p-6 bg-emerald-50 dark:bg-emerald-900/20 rounded-3xl border border-emerald-100 dark:border-emerald-800">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Sprout className="w-5 h-5 text-emerald-600" />
                      <span className="text-xs font-black text-emerald-600 uppercase">{t.fertilizerNPK}</span>
                    </div>
                    <button 
                      onClick={() => speakText(`${t.fertilizerNPK}: ${calculateFertilizer()} ${t.kg}`)}
                      className="p-2 hover:bg-emerald-100 dark:hover:bg-emerald-800 rounded-full transition-colors text-emerald-600 dark:text-emerald-400"
                    >
                      <Volume2 className={cn("w-4 h-4", isSpeaking && "animate-pulse")} />
                    </button>
                  </div>
                  <div className="text-3xl font-black text-slate-900 dark:text-white">{calculateFertilizer()} {t.kg}</div>
                  <p className="text-[10px] text-emerald-600/60 font-bold mt-1">{t.recommendedDosage}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase mb-2">{t.seedsCost}</label>
                  <div className="relative">
                    <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="number" 
                      value={seeds}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSeeds(val.replace(/^0+(?=\d)/, ''));
                      }}
                      className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl pl-10 pr-4 py-3 font-bold text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase mb-2">{t.laborCost}</label>
                  <div className="relative">
                    <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="number" 
                      value={labor}
                      onChange={(e) => {
                        const val = e.target.value;
                        setLabor(val.replace(/^0+(?=\d)/, ''));
                      }}
                      className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl pl-10 pr-4 py-3 font-bold text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase mb-2">{t.fertilizerCost}</label>
                  <div className="relative">
                    <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="number" 
                      value={fertilizer}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFertilizer(val.replace(/^0+(?=\d)/, ''));
                      }}
                      className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl pl-10 pr-4 py-3 font-bold text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="p-8 bg-slate-900 rounded-[2rem] text-white">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="w-6 h-6 text-emerald-400" />
                    <span className="text-sm font-black uppercase tracking-widest text-slate-400">{t.totalInvestment}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-3xl font-black">{t.currencySymbol}{(Number(seeds) || 0) + (Number(labor) || 0) + (Number(fertilizer) || 0)}</div>
                    <button 
                      onClick={() => speakText(`${t.totalInvestment}: ${t.currencySymbol}${(Number(seeds) || 0) + (Number(labor) || 0) + (Number(fertilizer) || 0)}`)}
                      className="p-2 hover:bg-white/10 rounded-full transition-colors text-emerald-400"
                    >
                      <Volume2 className={cn("w-5 h-5", isSpeaking && "animate-pulse")} />
                    </button>
                  </div>
                </div>
                <div className="h-px bg-slate-800 mb-6" />
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <div className="text-[10px] font-black text-slate-500 uppercase mb-1">{t.estProfit}</div>
                    <div className="text-xl font-black text-emerald-400">+ {t.currencySymbol}{((Number(seeds) || 0) + (Number(labor) || 0) + (Number(fertilizer) || 0)) * 1.5}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-black text-slate-500 uppercase mb-1">{t.roi}</div>
                    <div className="text-xl font-black text-blue-400">150%</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
