import React, { useState, useEffect } from 'react';
import { Phone, MapPin, X, ExternalLink, ShieldCheck, HeartPulse, Navigation, RefreshCw, AlertCircle, Volume2 } from 'lucide-react';
import { getAgriContacts, generateSpeech, registerAudio, stopGlobalSpeech } from '@/src/services/gemini';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { translations, Language } from '../constants/translations';

interface ContactInfo {
  name: string;
  phone: string;
  address: string;
  mapQuery: string;
}

interface AgriContacts {
  agriOffice: ContactInfo;
  vetHospital: ContactInfo;
}

export function AgriContact({ lang, location, onClose }: { lang: Language, location: string, onClose: () => void }) {
  const t = translations[lang];
  const [contacts, setContacts] = useState<AgriContacts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const isActiveRef = React.useRef(true);

  useEffect(() => {
    isActiveRef.current = true;
    fetchContacts();
    return () => {
      isActiveRef.current = false;
      stopGlobalSpeech();
    };
  }, [location]);

  const fetchContacts = async () => {
    setLoading(true);
    setError(null);
    try {
      const langMap: Record<string, string> = {
        en: 'English', hi: 'Hindi', mr: 'Marathi', te: 'Telugu', ta: 'Tamil', kn: 'Kannada', bn: 'Bengali'
      };
      const result = await getAgriContacts(location, langMap[lang] || 'English');
      if (isActiveRef.current) setContacts(result);
    } catch (err) {
      console.error("Failed to fetch agri contacts:", err);
      if (isActiveRef.current) setError(t.failedLoad);
    } finally {
      if (isActiveRef.current) setLoading(false);
    }
  };

  const openMap = (query: string) => {
    window.open(`https://www.google.com/maps/search/${encodeURIComponent(query)}`, '_blank');
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
      <Card className="w-full max-w-2xl max-h-[90vh] flex flex-col bg-white dark:bg-slate-900 border-none overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between border-b border-zinc-100 dark:border-slate-800 p-6">
          <CardTitle className="flex items-center gap-3 text-2xl font-black text-emerald-950 dark:text-white">
            <ShieldCheck className="w-8 h-8 text-emerald-600" />
            {t.help}
          </CardTitle>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-slate-800 rounded-full transition-colors">
            <X className="w-6 h-6 text-zinc-500" />
          </button>
        </CardHeader>
        
        <CardContent className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="space-y-6 py-12">
              <div className="flex flex-col items-center justify-center gap-4">
                <RefreshCw className="w-12 h-12 text-emerald-500 animate-spin" />
                <p className="text-sm font-bold text-zinc-500 animate-pulse">{t.analyzing}</p>
              </div>
            </div>
          ) : error ? (
            <div className="p-8 text-center bg-red-50 dark:bg-red-900/10 rounded-3xl border border-red-100 dark:border-red-900/20">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-800 dark:text-red-300 font-bold">{error}</p>
              <button onClick={fetchContacts} className="mt-4 px-6 py-2 bg-red-600 text-white rounded-xl font-bold">{t.retry}</button>
            </div>
          ) : contacts && (
            <div className="space-y-6">
              <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-100 dark:border-emerald-800 flex items-center gap-3">
                <MapPin className="w-5 h-5 text-emerald-600" />
                <span className="text-sm font-bold text-emerald-900 dark:text-emerald-100">{location}</span>
              </div>

              {/* Agri Office */}
              <div className="group p-6 bg-white dark:bg-slate-800 rounded-3xl border border-zinc-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/40 rounded-2xl flex items-center justify-center">
                      <ShieldCheck className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                      <h4 className="text-lg font-black text-zinc-900 dark:text-white leading-tight">{contacts.agriOffice.name}</h4>
                      <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">{t.schemes}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => speakText(`${contacts.agriOffice.name}. ${contacts.agriOffice.address}. Phone: ${contacts.agriOffice.phone}`)}
                    className="p-2 hover:bg-emerald-100 dark:hover:bg-emerald-800 rounded-full transition-colors text-emerald-600 dark:text-emerald-400"
                  >
                    <Volume2 className={cn("w-5 h-5", isSpeaking && "animate-pulse")} />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <a 
                    href={`tel:${contacts.agriOffice.phone}`}
                    className="flex items-center gap-3 p-4 bg-zinc-50 dark:bg-slate-900 rounded-2xl border border-zinc-100 dark:border-slate-700 hover:border-emerald-500 transition-all group/btn"
                  >
                    <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center shadow-sm group-hover/btn:bg-emerald-600 group-hover/btn:text-white transition-colors">
                      <Phone className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Call Office</div>
                      <div className="text-sm font-black text-zinc-800 dark:text-white">{contacts.agriOffice.phone}</div>
                    </div>
                  </a>

                  <button 
                    onClick={() => openMap(contacts.agriOffice.mapQuery)}
                    className="flex items-center gap-3 p-4 bg-zinc-50 dark:bg-slate-900 rounded-2xl border border-zinc-100 dark:border-slate-700 hover:border-blue-500 transition-all group/btn text-left"
                  >
                    <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center shadow-sm group-hover/btn:bg-blue-600 group-hover/btn:text-white transition-colors">
                      <Navigation className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">View on Map</div>
                      <div className="text-sm font-black text-zinc-800 dark:text-white truncate max-w-[150px]">{contacts.agriOffice.address}</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Veterinary Hospital */}
              <div className="group p-6 bg-white dark:bg-slate-800 rounded-3xl border border-zinc-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-rose-100 dark:bg-rose-900/40 rounded-2xl flex items-center justify-center">
                      <HeartPulse className="w-6 h-6 text-rose-600" />
                    </div>
                    <div>
                      <h4 className="text-lg font-black text-zinc-900 dark:text-white leading-tight">{contacts.vetHospital.name}</h4>
                      <span className="text-[10px] font-bold text-rose-600 uppercase tracking-widest">Veterinary Services</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => speakText(`${contacts.vetHospital.name}. ${contacts.vetHospital.address}. Phone: ${contacts.vetHospital.phone}`)}
                    className="p-2 hover:bg-rose-100 dark:hover:bg-rose-800 rounded-full transition-colors text-rose-600 dark:text-rose-400"
                  >
                    <Volume2 className={cn("w-5 h-5", isSpeaking && "animate-pulse")} />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <a 
                    href={`tel:${contacts.vetHospital.phone}`}
                    className="flex items-center gap-3 p-4 bg-zinc-50 dark:bg-slate-900 rounded-2xl border border-zinc-100 dark:border-slate-700 hover:border-rose-500 transition-all group/btn"
                  >
                    <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center shadow-sm group-hover/btn:bg-rose-600 group-hover/btn:text-white transition-colors">
                      <Phone className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Call Doctor</div>
                      <div className="text-sm font-black text-zinc-800 dark:text-white">{contacts.vetHospital.phone}</div>
                    </div>
                  </a>

                  <button 
                    onClick={() => openMap(contacts.vetHospital.mapQuery)}
                    className="flex items-center gap-3 p-4 bg-zinc-50 dark:bg-slate-900 rounded-2xl border border-zinc-100 dark:border-slate-700 hover:border-blue-500 transition-all group/btn text-left"
                  >
                    <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center shadow-sm group-hover/btn:bg-blue-600 group-hover/btn:text-white transition-colors">
                      <Navigation className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">View on Map</div>
                      <div className="text-sm font-black text-zinc-800 dark:text-white truncate max-w-[150px]">{contacts.vetHospital.address}</div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}
          
          <div className="p-4 bg-zinc-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-zinc-200 dark:border-slate-700">
            <p className="text-[10px] text-zinc-500 dark:text-slate-400 text-center font-medium leading-relaxed">
              These contacts are provided based on your current farm location. In case of emergency, please contact the nearest government facility directly.
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
