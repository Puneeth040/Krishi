import React, { useState, useEffect, useRef } from 'react';
import { Sprout, Droplets, ShieldAlert, BookOpen, X, ChevronRight, ShieldCheck, Leaf, Waves, Volume2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { translations, Language } from '../constants/translations';
import { chatWithChitti, getFarmerData, generateSpeech, registerAudio, stopGlobalSpeech } from '../services/gemini';
import { cn } from '../lib/utils';

export function CropAdvisory({ lang, onClose, crop: currentCrop, location, sowingDate }: { lang: Language, onClose: () => void, crop?: string, location?: string, sowingDate?: string }) {
  const t = translations[lang];
  const [selectedCrop, setSelectedCrop] = useState<string | null>(null);
  const [advisory, setAdvisory] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const isActiveRef = useRef(true);

  useEffect(() => {
    isActiveRef.current = true;
    return () => {
      isActiveRef.current = false;
      stopGlobalSpeech();
    };
  }, []);

  const cropsList = Object.keys(t.crops);

  const fetchAdvisory = async (crop: string) => {
    setSelectedCrop(crop);
    setLoading(true);
    try {
      const langMap: Record<string, string> = {
        en: 'English',
        hi: 'Hindi',
        mr: 'Marathi',
        te: 'Telugu',
        ta: 'Tamil',
        kn: 'Kannada',
        bn: 'Bengali'
      };
      const targetLang = langMap[lang] || 'English';
      
      // Fetch current weather for context
      const farmerData = await getFarmerData(location || 'Karnataka');
      const weatherContext = farmerData?.weather ? JSON.stringify(farmerData.weather) : 'Not available';

      const prompt = `Provide detailed crop advisory for ${crop} in ${targetLang}. 
      The farmer is located in ${location || 'Karnataka'}. 
      ${crop === currentCrop && sowingDate ? `The crop was sown on ${sowingDate}.` : ''}
      
      CURRENT WEATHER CONTEXT:
      ${weatherContext}

      Include:
      1. Planting guidance (best time, spacing, depth).
      2. Fertilizer schedule (types, timing, dosage).
      3. Pest & Disease control (common issues and solutions).
      4. Disease prevention strategies (proactive measures).
      5. Organic pest control methods (natural and sustainable solutions).
      6. Weather-based Irrigation recommendations (Based on current weather and crop water requirements, suggest optimal watering schedules and amounts).
      
      CRITICAL: Return ONLY a valid JSON object.
      JSON Structure:
      {
        "planting": "string",
        "fertilizing": "string",
        "pestControl": "string",
        "diseasePrevention": "string",
        "organicPestControl": "string",
        "irrigation": "string"
      }`;

      const response = await chatWithChitti(prompt, targetLang, { crop, location, sowingDate });
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const cleanJson = jsonMatch[0].replace(/```json|```/g, '').trim();
        setAdvisory(JSON.parse(cleanJson));
      }
    } catch (err) {
      console.error("Failed to fetch advisory:", err);
    } finally {
      setLoading(false);
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

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <Card className="w-full max-w-4xl max-h-[90vh] flex flex-col bg-white dark:bg-slate-900 border-none overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between border-b border-zinc-100 dark:border-slate-800 p-6">
          <CardTitle className="flex items-center gap-3 text-2xl font-black text-emerald-950 dark:text-white">
            <Sprout className="w-8 h-8 text-emerald-600" />
            {t.cropAdvisory.title}
          </CardTitle>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-slate-800 rounded-full transition-colors">
            <X className="w-6 h-6 text-zinc-500" />
          </button>
        </CardHeader>
        
        <CardContent className="flex-1 overflow-y-auto p-6 space-y-8">
          {!selectedCrop ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {cropsList.map((crop) => (
                <button
                  key={crop}
                  onClick={() => fetchAdvisory(crop)}
                  className="p-6 bg-emerald-50 dark:bg-emerald-900/20 rounded-3xl border-2 border-transparent hover:border-emerald-500 transition-all flex flex-col items-center gap-3 group"
                >
                  <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-3xl shadow-sm group-hover:scale-110 transition-transform">
                    {crop === 'Wheat' ? '🌾' : crop === 'Rice' ? '🍚' : crop === 'Cotton' ? '☁️' : crop === 'Sugarcane' ? '🎋' : '🌱'}
                  </div>
                  <span className="font-black text-emerald-900 dark:text-emerald-100 text-center">{t.crops[crop]}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-8">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => { setSelectedCrop(null); setAdvisory(null); }}
                  className="p-2 hover:bg-zinc-100 dark:hover:bg-slate-800 rounded-full"
                >
                  <ChevronRight className="w-6 h-6 rotate-180" />
                </button>
                <h3 className="text-2xl font-black text-emerald-900 dark:text-white">{t.crops[selectedCrop]}</h3>
              </div>

              {loading ? (
                <div className="space-y-4">
                  <div className="h-32 bg-zinc-100 dark:bg-slate-800 animate-pulse rounded-3xl" />
                  <div className="h-32 bg-zinc-100 dark:bg-slate-800 animate-pulse rounded-3xl" />
                  <div className="h-32 bg-zinc-100 dark:bg-slate-800 animate-pulse rounded-3xl" />
                </div>
              ) : advisory ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-6 bg-blue-50 dark:bg-blue-900/10 rounded-3xl border border-blue-100 dark:border-blue-900/20"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <BookOpen className="w-6 h-6 text-blue-600" />
                        <h4 className="font-black text-blue-900 dark:text-blue-100">{t.cropAdvisory.planting}</h4>
                      </div>
                      <button 
                        onClick={() => speakText(`${t.cropAdvisory.planting}: ${advisory.planting}`)}
                        className="p-2 hover:bg-blue-100 dark:hover:bg-blue-800 rounded-full transition-colors text-blue-600 dark:text-blue-400"
                      >
                        <Volume2 className={cn("w-5 h-5", isSpeaking && "animate-pulse")} />
                      </button>
                    </div>
                    <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed whitespace-pre-wrap">{advisory.planting}</p>
                  </motion.div>

                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="p-6 bg-emerald-50 dark:bg-emerald-900/10 rounded-3xl border border-emerald-100 dark:border-emerald-900/20"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Droplets className="w-6 h-6 text-emerald-600" />
                        <h4 className="font-black text-emerald-900 dark:text-emerald-100">{t.cropAdvisory.fertilizing}</h4>
                      </div>
                      <button 
                        onClick={() => speakText(`${t.cropAdvisory.fertilizing}: ${advisory.fertilizing}`)}
                        className="p-2 hover:bg-emerald-100 dark:hover:bg-emerald-800 rounded-full transition-colors text-emerald-600 dark:text-emerald-400"
                      >
                        <Volume2 className={cn("w-5 h-5", isSpeaking && "animate-pulse")} />
                      </button>
                    </div>
                    <p className="text-sm text-emerald-800 dark:text-emerald-200 leading-relaxed whitespace-pre-wrap">{advisory.fertilizing}</p>
                  </motion.div>

                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="p-6 bg-cyan-50 dark:bg-cyan-900/10 rounded-3xl border border-cyan-100 dark:border-cyan-900/20"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Waves className="w-6 h-6 text-cyan-600" />
                        <h4 className="font-black text-cyan-900 dark:text-cyan-100">{t.cropAdvisory.irrigation}</h4>
                      </div>
                      <button 
                        onClick={() => speakText(`${t.cropAdvisory.irrigation}: ${advisory.irrigation}`)}
                        className="p-2 hover:bg-cyan-100 dark:hover:bg-cyan-800 rounded-full transition-colors text-cyan-600 dark:text-cyan-400"
                      >
                        <Volume2 className={cn("w-5 h-5", isSpeaking && "animate-pulse")} />
                      </button>
                    </div>
                    <p className="text-sm text-cyan-800 dark:text-cyan-200 leading-relaxed whitespace-pre-wrap">{advisory.irrigation}</p>
                  </motion.div>

                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="p-6 bg-rose-50 dark:bg-rose-900/10 rounded-3xl border border-rose-100 dark:border-rose-900/20"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <ShieldAlert className="w-6 h-6 text-rose-600" />
                        <h4 className="font-black text-rose-900 dark:text-rose-100">{t.cropAdvisory.pestControl}</h4>
                      </div>
                      <button 
                        onClick={() => speakText(`${t.cropAdvisory.pestControl}: ${advisory.pestControl}`)}
                        className="p-2 hover:bg-rose-100 dark:hover:bg-rose-800 rounded-full transition-colors text-rose-600 dark:text-rose-400"
                      >
                        <Volume2 className={cn("w-5 h-5", isSpeaking && "animate-pulse")} />
                      </button>
                    </div>
                    <p className="text-sm text-rose-800 dark:text-rose-200 leading-relaxed whitespace-pre-wrap">{advisory.pestControl}</p>
                  </motion.div>

                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="p-6 bg-amber-50 dark:bg-amber-900/10 rounded-3xl border border-amber-100 dark:border-amber-900/20"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <ShieldCheck className="w-6 h-6 text-amber-600" />
                        <h4 className="font-black text-amber-900 dark:text-amber-100">{t.cropAdvisory.diseasePrevention}</h4>
                      </div>
                      <button 
                        onClick={() => speakText(`${t.cropAdvisory.diseasePrevention}: ${advisory.diseasePrevention}`)}
                        className="p-2 hover:bg-amber-100 dark:hover:bg-amber-800 rounded-full transition-colors text-amber-600 dark:text-amber-400"
                      >
                        <Volume2 className={cn("w-5 h-5", isSpeaking && "animate-pulse")} />
                      </button>
                    </div>
                    <p className="text-sm text-amber-800 dark:text-amber-200 leading-relaxed whitespace-pre-wrap">{advisory.diseasePrevention}</p>
                  </motion.div>

                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="p-6 bg-lime-50 dark:bg-lime-900/10 rounded-3xl border border-lime-100 dark:border-lime-900/20"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Leaf className="w-6 h-6 text-lime-600" />
                        <h4 className="font-black text-lime-900 dark:text-lime-100">{t.cropAdvisory.organicPestControl}</h4>
                      </div>
                      <button 
                        onClick={() => speakText(`${t.cropAdvisory.organicPestControl}: ${advisory.organicPestControl}`)}
                        className="p-2 hover:bg-lime-100 dark:hover:bg-lime-800 rounded-full transition-colors text-lime-600 dark:text-lime-400"
                      >
                        <Volume2 className={cn("w-5 h-5", isSpeaking && "animate-pulse")} />
                      </button>
                    </div>
                    <p className="text-sm text-lime-800 dark:text-lime-200 leading-relaxed whitespace-pre-wrap">{advisory.organicPestControl}</p>
                  </motion.div>
                </div>
              ) : null}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
