import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, RefreshCw, Volume2, Image as ImageIcon, ExternalLink, ShieldAlert, Leaf, Beaker, Info, CheckCircle2 } from 'lucide-react';
import { analyzeLeaf, generateSpeech, stopGlobalSpeech, registerAudio } from '@/src/services/gemini';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

import { translations, Language } from '../constants/translations';

interface LeafAnalysis {
  name: string;
  confidence: string;
  symptoms: string[];
  treatmentChemical: string[];
  treatmentOrganic: string[];
  prevention: string[];
  learnMore: string[];
}

export function LeafScanner({ lang, onClose }: { lang: Language, onClose: () => void }) {
  const t = translations[lang];
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<LeafAnalysis | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isActiveRef = useRef(true);

  useEffect(() => {
    isActiveRef.current = true;
    startCamera();
    return () => {
      isActiveRef.current = false;
      stopSpeaking();
      stopGlobalSpeech();
      // Access the live stream ref directly from standard tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          try { track.stop(); } catch (_) {}
        });
      }
    };
  }, []);

  const streamRef = useRef<MediaStream | null>(null);

  const stopSpeaking = () => {
    stopGlobalSpeech();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsSpeaking(false);
  };

  const startCamera = async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (!isActiveRef.current) {
        s.getTracks().forEach(track => track.stop());
        return;
      }
      streamRef.current = s;
      setStream(s);
      if (videoRef.current) {
        videoRef.current.srcObject = s;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
    }
  };

  const processImage = async (base64Image: string) => {
    setIsScanning(true);
    setResult(null);
    stopSpeaking();
    try {
      const langMap: Record<string, string> = {
        en: 'English', hi: 'Hindi', mr: 'Marathi', te: 'Telugu', ta: 'Tamil', kn: 'Kannada', bn: 'Bengali'
      };
      const analysis = await analyzeLeaf(base64Image, langMap[lang] || 'English');
      if (!isActiveRef.current) return;
      setResult(analysis);
      
      if (analysis && analysis.name) {
        try {
          // Speak only the name and a short summary immediately for "quickness"
          const speechText = `${analysis.name}. ${analysis.symptoms?.[0] || ''}`;
          const audioUrl = await generateSpeech(speechText);
          if (!isActiveRef.current) return;
          if (audioUrl) {
            const audio = new Audio(audioUrl);
            registerAudio(audio);
            audioRef.current = audio;
            setIsSpeaking(true);
            audio.onended = () => {
              if (isActiveRef.current) {
                setIsSpeaking(false);
                audioRef.current = null;
              }
            };
            audio.onerror = () => {
              if (isActiveRef.current) {
                setIsSpeaking(false);
                audioRef.current = null;
              }
            };
            audio.play().catch(() => {
              if (isActiveRef.current) setIsSpeaking(false);
            });
          }
        } catch (speechErr) {
          console.error("Speech generation or playback failed:", speechErr);
          if (isActiveRef.current) setIsSpeaking(false);
        }
      }
    } catch (err) {
      console.error("Analysis failed:", err);
    } finally {
      if (isActiveRef.current) setIsScanning(false);
    }
  };

  const replaySpeech = async () => {
    if (!result || isSpeaking) return;
    setIsSpeaking(true);
    try {
      const speechText = `${result.name}. ${result.symptoms?.[0] || ''}. ${result.treatmentOrganic?.[0] || ''}`;
      const audioUrl = await generateSpeech(speechText);
      if (!isActiveRef.current) {
        setIsSpeaking(false);
        return;
      }
      if (audioUrl) {
        const audio = new Audio(audioUrl);
        registerAudio(audio);
        audioRef.current = audio;
        audio.onended = () => {
          if (isActiveRef.current) {
            setIsSpeaking(false);
            audioRef.current = null;
          }
        };
        audio.onerror = () => {
          if (isActiveRef.current) {
            setIsSpeaking(false);
            audioRef.current = null;
          }
        };
        audio.play().catch(() => {
          if (isActiveRef.current) setIsSpeaking(false);
        });
      }
    } catch (err) {
      console.error("Replay speech failed:", err);
      if (isActiveRef.current) setIsSpeaking(false);
    }
  };

  const captureAndAnalyze = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    
    const base64Image = canvas.toDataURL('image/jpeg');
    await processImage(base64Image);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Image = reader.result as string;
      await processImage(base64Image);
    };
    reader.readAsDataURL(file);
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
            <Camera className="w-8 h-8 text-emerald-600" />
            {t.scanLeaf}
          </CardTitle>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-slate-800 rounded-full transition-colors">
            <X className="w-6 h-6 text-zinc-500" />
          </button>
        </CardHeader>
        
        <CardContent className="flex-1 overflow-y-auto p-6 space-y-6">
          {!result ? (
            <div className="space-y-6">
              <div className="relative aspect-video bg-zinc-900 rounded-3xl overflow-hidden shadow-2xl">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  className="w-full h-full object-cover"
                />
                <canvas ref={canvasRef} className="hidden" />
                
                <div className="absolute inset-0 border-4 border-emerald-500/30 rounded-3xl pointer-events-none">
                  <div className="absolute top-1/2 left-0 w-full h-1 bg-emerald-500/40 animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                </div>

                <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold text-white uppercase tracking-widest border border-white/20">
                  {t.liveView}
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button 
                  onClick={captureAndAnalyze}
                  disabled={isScanning}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-2xl font-black shadow-lg flex items-center justify-center gap-3 disabled:opacity-50 transition-all active:scale-95 text-lg"
                >
                  {isScanning ? <RefreshCw className="w-6 h-6 animate-spin" /> : <Camera className="w-6 h-6" />}
                  {isScanning ? t.analyzing : t.scanLeaf}
                </button>

                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isScanning}
                  className="w-full bg-zinc-100 dark:bg-slate-800 hover:bg-zinc-200 dark:hover:bg-slate-700 text-zinc-800 dark:text-white px-8 py-4 rounded-2xl font-black flex items-center justify-center gap-3 disabled:opacity-50 transition-all active:scale-95 border border-zinc-200 dark:border-slate-700"
                >
                  <ImageIcon className="w-6 h-6" />
                  {t.uploadGallery}
                </button>
                
                <input 
                  ref={fileInputRef}
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleFileUpload}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="p-6 bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-100 dark:border-emerald-800 rounded-3xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4">
                  <button 
                    onClick={() => isSpeaking ? stopSpeaking() : replaySpeech()}
                    className={cn(
                      "p-3 bg-white dark:bg-slate-800 shadow-md hover:shadow-lg rounded-2xl transition-all active:scale-90 flex items-center gap-2",
                      isSpeaking && "ring-2 ring-emerald-500"
                    )}
                  >
                    <Volume2 className={cn("w-6 h-6 text-emerald-600", isSpeaking && "animate-pulse")} />
                    {isSpeaking && <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">{t.chittiSpeaking}</span>}
                  </button>
                </div>

                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-800 rounded-xl">
                    <ShieldAlert className="w-6 h-6 text-emerald-600 dark:text-emerald-300" />
                  </div>
                  <div>
                    <h4 className="text-2xl font-black text-emerald-950 dark:text-white leading-tight">{result.name}</h4>
                    <div className="flex items-center gap-1.5 mt-1">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                        {t.leafScanner.confidence}: {result.confidence}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-100 font-bold text-sm">
                      <Info className="w-4 h-4" />
                      {t.leafScanner.symptoms}
                    </div>
                    <ul className="space-y-2">
                      {result.symptoms.map((s, i) => (
                        <li key={i} className="text-sm text-emerald-800 dark:text-emerald-300 flex gap-2">
                          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-100 font-bold text-sm">
                      <CheckCircle2 className="w-4 h-4" />
                      {t.leafScanner.prevention}
                    </div>
                    <ul className="space-y-2">
                      {result.prevention.map((s, i) => (
                        <li key={i} className="text-sm text-emerald-800 dark:text-emerald-300 flex gap-2">
                          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 rounded-3xl">
                  <div className="flex items-center gap-2 text-amber-900 dark:text-amber-100 font-black mb-3">
                    <Leaf className="w-5 h-5" />
                    {t.leafScanner.treatmentOrganic}
                  </div>
                  <ul className="space-y-2">
                    {result.treatmentOrganic.map((s, i) => (
                      <li key={i} className="text-sm text-amber-800 dark:text-amber-200 flex gap-2">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-5 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20 rounded-3xl">
                  <div className="flex items-center gap-2 text-blue-900 dark:text-blue-100 font-black mb-3">
                    <Beaker className="w-5 h-5" />
                    {t.leafScanner.treatmentChemical}
                  </div>
                  <ul className="space-y-2">
                    {result.treatmentChemical.map((s, i) => (
                      <li key={i} className="text-sm text-blue-800 dark:text-blue-200 flex gap-2">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {result.learnMore && result.learnMore.length > 0 && (
                <div className="space-y-3">
                  <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-2">
                    {t.leafScanner.learnMore}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {result.learnMore.map((link, i) => (
                      <a 
                        key={i}
                        href={link.startsWith('http') ? link : `https://www.google.com/search?q=${encodeURIComponent(link)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-zinc-50 dark:bg-slate-800 hover:bg-zinc-100 dark:hover:bg-slate-700 rounded-xl text-xs font-bold text-zinc-600 dark:text-slate-300 border border-zinc-200 dark:border-slate-700 transition-all"
                      >
                        {link.length > 20 ? link.substring(0, 20) + '...' : link}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
              
              <button 
                onClick={() => {
                  stopSpeaking();
                  setResult(null);
                }}
                className="w-full py-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl font-black hover:opacity-90 transition-all active:scale-95 shadow-xl"
              >
                {t.scanAnother}
              </button>
            </div>
          )}
          
          <div className="p-4 bg-zinc-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-zinc-200 dark:border-slate-700">
            <p className="text-[10px] text-zinc-500 dark:text-slate-400 text-center font-medium leading-relaxed">
              {t.scanInstructions}
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
