import React, { useState, useEffect, useRef } from 'react';
import { 
  Menu, 
  X, 
  MessageSquare, 
  Camera, 
  Mic, 
  Home, 
  Info, 
  Settings, 
  HelpCircle,
  Leaf,
  TrendingUp,
  ShieldCheck,
  Sprout,
  ChevronLeft,
  Languages,
  RefreshCw,
  Moon,
  Sun,
  Ruler,
  Milk,
  Bell,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Dashboard } from './components/Dashboard';
import { Chatbox } from './components/Chatbox';
import { LeafScanner } from './components/LeafScanner';
import { Onboarding } from './components/Onboarding';
import { Login } from './components/Login';
import { LandMeasurement } from './components/LandMeasurement';
import { Calculators } from './components/Calculators';
import { CropAdvisory } from './components/CropAdvisory';
import { AgriContact } from './components/AgriContact';
import { TBDamMonitor } from './components/TBDamMonitor';
import { WelcomeModal } from './components/WelcomeModal';
import { cn } from './lib/utils';
import { chatWithChitti, generateSpeech, transcribeAudio, registerAudio, stopGlobalSpeech } from './services/gemini';
import { translations, languages, Language } from './constants/translations';

export default function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showCalculators, setShowCalculators] = useState(false);
  const [showCropAdvisory, setShowCropAdvisory] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [notifications, setNotifications] = useState<string[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [lang, setLang] = useState<Language>(() => (localStorage.getItem('km_lang') as Language) || 'en');
  const [userName, setUserName] = useState(() => localStorage.getItem('km_user_name') || '');
  const [location, setLocation] = useState(() => localStorage.getItem('km_location') || '');
  const [crop, setCrop] = useState(() => localStorage.getItem('km_crop') || '');
  const [sowingDate, setSowingDate] = useState(() => localStorage.getItem('km_sowing_date') || '');
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [hasGreeted, setHasGreeted] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem('km_logged_in') === 'true');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => (localStorage.getItem('km_theme') as 'light' | 'dark') || 'light');
  const [showLandMeasure, setShowLandMeasure] = useState(false);
  const [showTBDam, setShowTBDam] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [emailCopied, setEmailCopied] = useState(false);

  useEffect(() => {
    if (isLoggedIn && userName) {
      const seen = localStorage.getItem('km_welcome_seen_forever2');
      if (!seen) {
        const timer = setTimeout(() => {
          setShowAboutModal(true);
        }, 1200);
        return () => clearTimeout(timer);
      }
    }
  }, [isLoggedIn, userName]);

  useEffect(() => {
    localStorage.setItem('km_lang', lang);
  }, [lang]);

  useEffect(() => {
    localStorage.setItem('km_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    const handleInteraction = () => {
      setHasInteracted(true);
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
    };
    window.addEventListener('click', handleInteraction);
    window.addEventListener('touchstart', handleInteraction);
    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
    };
  }, []);

  useEffect(() => {
    if (isLoggedIn && userName && !hasGreeted && hasInteracted && !showChat && !showScanner && !showLandMeasure && !showCalculators) {
      const timer = setTimeout(() => {
        const greetingText = t.onboarding.greeting.replace('{name}', userName) + ". " + t.subWelcome;
        playVoiceGreeting(greetingText);
        setHasGreeted(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [userName, lang, hasGreeted, hasInteracted, showChat, showScanner, showLandMeasure, showCalculators]);

  const playVoiceGreeting = async (text: string) => {
    setIsVoiceActive(true);
    const audioUrl = await generateSpeech(text);
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      registerAudio(audio);
      audio.onended = () => setIsVoiceActive(false);
      audio.play().catch(e => {
        console.error("Audio play failed", e);
        setIsVoiceActive(false);
      });
    } else {
      setIsVoiceActive(false);
    }
  };

  const handleOnboardingComplete = (name: string, selectedLang: Language, selectedLocation: string, selectedCrop: string, selectedSowingDate: string) => {
    setUserName(name);
    setLang(selectedLang);
    setLocation(selectedLocation);
    setCrop(selectedCrop);
    setSowingDate(selectedSowingDate);
    localStorage.setItem('km_user_name', name);
    localStorage.setItem('km_lang', selectedLang);
    localStorage.setItem('km_location', selectedLocation);
    localStorage.setItem('km_crop', selectedCrop);
    localStorage.setItem('km_sowing_date', selectedSowingDate);
    
    // Ensure the welcome modal shows right after onboarding is finished
    localStorage.removeItem('km_welcome_seen_forever2');
    setTimeout(() => {
      setShowAboutModal(true);
    }, 800);
  };

  const t = translations[lang];

  const menuItems = [
    { id: 'dashboard', label: t.home, icon: Home },
    { id: 'scanner', label: t.scanLeaf, icon: Camera },
    { id: 'chat', label: t.chittiAI, icon: MessageSquare },
    { id: 'schemes', label: t.schemes, icon: ShieldCheck },
    { id: 'about', label: t.about, icon: Info },
    { id: 'help', label: t.help, icon: HelpCircle },
    { id: 'reset', label: t.resetProfile, icon: RefreshCw },
  ];

  const handleResetProfile = () => {
    localStorage.removeItem('km_user_name');
    localStorage.removeItem('km_lang');
    localStorage.removeItem('km_logged_in');
    localStorage.removeItem('km_location');
    localStorage.removeItem('km_crop');
    localStorage.removeItem('km_sowing_date');
    localStorage.removeItem('km_welcome_seen_forever2');
    setUserName('');
    setLocation('');
    setCrop('');
    setSowingDate('');
    setIsLoggedIn(false);
    setHasGreeted(false);
    setIsMenuOpen(false);
  };

  const handleLogin = (phone: string) => {
    setIsLoggedIn(true);
    localStorage.setItem('km_logged_in', 'true');
    localStorage.setItem('km_phone', phone);
    
    // Reset/clear the seen flag for a fresh login session
    localStorage.removeItem('km_welcome_seen_forever2');
    // If they already have a profile completed, we can show the welcome modal right away.
    const savedName = localStorage.getItem('km_user_name');
    if (savedName) {
      setTimeout(() => {
        setShowAboutModal(true);
      }, 1000);
    }
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  useEffect(() => {
    (window as any).openChat = () => setShowChat(true);
    (window as any).openScanner = () => setShowScanner(true);
    (window as any).openLandMeasure = () => setShowLandMeasure(true);
    (window as any).openCalculators = () => setShowCalculators(true);
    (window as any).openCropAdvisory = () => setShowCropAdvisory(true);
    (window as any).openHelp = () => setShowHelp(true);
    (window as any).openTBDam = () => setShowTBDam(true);
    (window as any).toggleAppTheme = toggleTheme;
    (window as any).setAppNotifications = (alerts: string[]) => setNotifications(alerts);
    
    return () => {
      delete (window as any).openChat;
      delete (window as any).openScanner;
      delete (window as any).openLandMeasure;
      delete (window as any).openCalculators;
      delete (window as any).openCropAdvisory;
      delete (window as any).openHelp;
      delete (window as any).openTBDam;
      delete (window as any).toggleAppTheme;
      delete (window as any).setAppNotifications;
    };
  }, []);

  const handleBack = () => {
    setShowScanner(false);
    setShowChat(false);
    setShowLandMeasure(false);
    setShowCalculators(false);
    setShowCropAdvisory(false);
    setShowHelp(false);
    setShowTBDam(false);
  };

  const isSubViewOpen = showScanner || showChat || showLandMeasure || showCalculators || showCropAdvisory || showHelp || showTBDam;

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = (reader.result as string).split(',')[1];
          processVoiceCommand(base64Audio);
        };
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert(t.micError);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processVoiceCommand = async (base64Audio: string) => {
    setIsVoiceActive(true);
    try {
      const transcription = await transcribeAudio(base64Audio);
      if (transcription) {
        const langMap: Record<string, string> = {
          en: 'English',
          hi: 'Hindi',
          mr: 'Marathi',
          te: 'Telugu',
          ta: 'Tamil',
          kn: 'Kannada',
          bn: 'Bengali'
        };
        const targetLangName = langMap[lang] || 'English';
        const lowerText = transcription.toLowerCase();
        // Check for "market rates for [crop name]" pattern
        if (lowerText.includes('market rate') || lowerText.includes('price') || lowerText.includes('rate')) {
          const response = await chatWithChitti(`The farmer said: "${transcription}". They are asking for market rates in ${location}. Please provide the latest price for the crop mentioned.`, targetLangName, { crop, location, sowingDate });
          if (response) {
            playVoiceGreeting(response);
          }
        } else {
          // General query
          const response = await chatWithChitti(transcription, targetLangName, { crop, location, sowingDate });
          if (response) {
            playVoiceGreeting(response);
          }
        }
      }
    } catch (err) {
      console.error("Voice command processing failed:", err);
    } finally {
      setIsVoiceActive(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <AnimatePresence>
        {!isLoggedIn && <Login lang={lang} onLogin={handleLogin} />}
      </AnimatePresence>

      {/* Decorative Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-emerald-100/40 dark:bg-emerald-900/20 blur-[120px] rounded-full" />
        <div className="absolute top-[20%] -right-[10%] w-[30%] h-[30%] bg-sky-100/40 dark:bg-sky-900/20 blur-[100px] rounded-full" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-800/60">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isSubViewOpen || (isLoggedIn && userName) ? (
              <button 
                onClick={isSubViewOpen ? handleBack : handleResetProfile}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all active:scale-90 flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-bold"
              >
                <ChevronLeft className="w-6 h-6" />
                <span className="hidden sm:inline">{t.back}</span>
              </button>
            ) : (
              <motion.div 
                whileHover={{ rotate: 15 }}
                className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-200 dark:shadow-none"
              >
                <Leaf className="w-7 h-7" />
              </motion.div>
            )}
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-emerald-950 dark:text-white leading-none">{t.appName}</h1>
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">{t.tagline}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm text-slate-500 dark:text-slate-400 relative"
              >
                <Bell className="w-5 h-5" />
                {notifications.length > 0 && (
                  <span className="absolute top-0 right-0 w-3 h-3 bg-rose-500 border-2 border-white dark:border-slate-900 rounded-full" />
                )}
              </button>
              <AnimatePresence>
                {showNotifications && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 10 }}
                    className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 py-4 px-4 z-50"
                  >
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">{t.notifications}</h4>
                    {notifications.length === 0 ? (
                      <p className="text-xs text-slate-500 font-medium">{t.noNewAlerts}</p>
                    ) : (
                      <div className="space-y-3">
                        {notifications.map((n, i) => (
                          <div key={i} className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300">
                            {n}
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button 
              onClick={toggleTheme}
              className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm text-slate-500 dark:text-slate-400"
              title={theme === 'light' ? t.theme.dark : t.theme.light}
            >
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>

            {userName && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl border border-emerald-100 dark:border-emerald-800">
                <div className="w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center text-[10px] font-black text-white">
                  {userName[0].toUpperCase()}
                </div>
                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-200">{userName}</span>
              </div>
            )}
            {/* Language Selector */}
            <div className="relative">
              <button 
                onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                className="p-2 sm:px-3 sm:py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm"
              >
                <Languages className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                <span className="hidden sm:inline font-bold text-sm text-slate-700 dark:text-slate-200">
                  {languages.find(l => l.code === lang)?.name}
                </span>
              </button>
              
              <AnimatePresence>
                {isLangMenuOpen && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 10 }}
                    className="absolute right-0 mt-2 w-40 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 py-2 z-50 max-h-64 overflow-y-auto"
                  >
                    {languages.map((l) => (
                      <button
                        key={l.code}
                        onClick={() => {
                          setLang(l.code as Language);
                          setIsLangMenuOpen(false);
                        }}
                        className={cn(
                          "w-full px-4 py-2 text-left text-sm font-bold transition-all",
                          lang === l.code ? "bg-emerald-50 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300" : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                        )}
                      >
                        {l.name}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button 
              onClick={() => isRecording ? stopRecording() : startRecording()}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm transition-all shadow-sm",
                isRecording 
                  ? "bg-rose-600 text-white animate-pulse" 
                  : isVoiceActive
                  ? "bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400"
                  : "bg-emerald-600 text-white hover:bg-emerald-700"
              )}
            >
              <Mic className={cn("w-4 h-4", isRecording && "animate-bounce")} />
              <span className="hidden sm:inline">
                {isRecording ? t.listening : isVoiceActive ? t.chittiSpeaking : t.voiceHelp}
              </span>
            </button>
            
            <div className="relative">
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all active:scale-90 bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700"
              >
                {isMenuOpen ? <X className="w-6 h-6 text-slate-600 dark:text-slate-300" /> : <Menu className="w-6 h-6 text-slate-600 dark:text-slate-300" />}
              </button>

              <AnimatePresence>
                {isMenuOpen && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: -20, x: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -20, x: 20 }}
                    className="absolute right-0 mt-4 w-72 bg-white dark:bg-slate-800 rounded-3xl shadow-2xl shadow-slate-200 dark:shadow-none border border-slate-100 dark:border-slate-700 py-3 z-50 overflow-hidden"
                  >
                    <div className="px-4 py-2 mb-2 border-b border-slate-50 dark:border-slate-700">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.mainMenu}</span>
                    </div>
                    {menuItems.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          if (item.id === 'scanner') setShowScanner(true);
                          if (item.id === 'chat') setShowChat(true);
                          if (item.id === 'help') setShowHelp(true);
                          if (item.id === 'about') setShowAboutModal(true);
                          if (item.id === 'schemes') {
                            const schemesEl = document.querySelector('.bg-indigo-50');
                            if (schemesEl) {
                              schemesEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }
                          }
                          if (item.id === 'reset') handleResetProfile();
                          setIsMenuOpen(false);
                        }}
                        className="w-full px-4 py-3.5 flex items-center gap-4 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 group transition-all text-left"
                      >
                        <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 group-hover:bg-white dark:group-hover:bg-slate-600 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 group-hover:shadow-sm transition-all">
                          <item.icon className="w-5 h-5" />
                        </div>
                        <span className="font-bold text-slate-700 dark:text-slate-200 group-hover:text-emerald-900 dark:group-hover:text-white">{item.label}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-10 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
            <Sprout className="w-3 h-3" />
            {t.farmHealthy}
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">
            {t.onboarding.greeting.replace('{name}', userName)}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-base sm:text-lg max-w-2xl font-medium">
            {t.subWelcome}
          </p>
        </motion.div>

        <Dashboard lang={lang} userLocation={location} crop={crop} sowingDate={sowingDate} />

        {/* Quick Tools */}
        <div className="mt-16">
          <h3 className="text-xl font-black text-slate-800 dark:text-white mb-6 flex items-center gap-2">
            <div className="w-2 h-6 bg-emerald-500 rounded-full" />
            {t.quickTools}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <QuickActionCard 
              onClick={() => setShowScanner(true)}
              icon={Camera}
              title={t.scanLeaf}
              desc={t.scanDesc}
              color="emerald"
            />
            <QuickActionCard 
              onClick={() => setShowChat(true)}
              icon={MessageSquare}
              title={t.chittiAI}
              desc={t.chatDesc}
              color="blue"
            />
            <QuickActionCard 
              onClick={() => setShowLandMeasure(true)}
              icon={Ruler}
              title={t.landMeasure.title}
              desc={t.landMeasure.desc}
              color="amber"
            />
            <QuickActionCard 
              onClick={() => setShowHelp(true)}
              icon={HelpCircle}
              title={t.help}
              desc="Contact local agri office & vet"
              color="rose"
            />
          </div>
        </div>
      </main>

      {/* Overlays */}
      <AnimatePresence>
        {isLoggedIn && !userName && <Onboarding onComplete={handleOnboardingComplete} />}
        {showScanner && <LeafScanner lang={lang} onClose={() => setShowScanner(false)} />}
        {showChat && (
          <Chatbox 
            lang={lang} 
            onClose={() => setShowChat(false)} 
            crop={crop}
            location={location}
            sowingDate={sowingDate}
          />
        )}
        {showLandMeasure && <LandMeasurement lang={lang} onClose={() => setShowLandMeasure(false)} />}
        {showCalculators && <Calculators lang={lang} onClose={() => setShowCalculators(false)} />}
        {showCropAdvisory && (
          <CropAdvisory 
            lang={lang} 
            onClose={() => setShowCropAdvisory(false)} 
            crop={crop}
            location={location}
            sowingDate={sowingDate}
          />
        )}
        {showHelp && (
          <AgriContact 
            lang={lang} 
            location={location} 
            onClose={() => setShowHelp(false)} 
          />
        )}
        {showTBDam && (
          <TBDamMonitor 
            lang={lang} 
            onClose={() => setShowTBDam(false)} 
          />
        )}
        <WelcomeModal 
          isOpen={showAboutModal} 
          onClose={() => setShowAboutModal(false)} 
          lang={lang} 
        />
      </AnimatePresence>

      {/* Floating Action Button for Chitti */}
      <AnimatePresence>
        {!showChat && (
          <motion.button 
            initial={{ scale: 0, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 45 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowChat(true)}
            className="fixed bottom-8 right-8 w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-700 text-white rounded-3xl shadow-2xl shadow-emerald-200 dark:shadow-none flex items-center justify-center z-40 group overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            <MessageSquare className="w-7 h-7 relative z-10" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="mt-32 py-16 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-emerald-200 dark:via-emerald-800 to-transparent" />
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 items-start">
            
            {/* Column 1: Logo, Empowering, and Founder Info */}
            <div className="space-y-4 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-3">
                <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white">
                  <Leaf className="w-6 h-6" />
                </div>
                <span className="text-2xl font-black text-emerald-950 dark:text-white">{t.appName}</span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 font-medium text-sm leading-relaxed">
                {t.footer.empowering}
              </p>
              
              {/* Founder Signature Area */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">FOUNDER & DEVELOPER</p>
                <p className="text-base font-black text-slate-850 dark:text-slate-200 mt-1">Puneeth Chowdary</p>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 leading-normal">
                  BE in Electronics and Communication Engineering
                </p>
              </div>
            </div>

            {/* Column 2: Interactive Contact Platform */}
            <div className="flex flex-col items-center justify-center space-y-4">
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">CONTACT ADMIN CONCERN</p>
              
              {/* Pressable Email Card */}
              <div className="w-full max-w-sm p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col items-center gap-2 shadow-sm">
                <p className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-wider">Mail or Click to Copy</p>
                <div className="flex items-center gap-2">
                  <a 
                    href="mailto:chowdarypuneeth7@gmail.com"
                    className="text-sm font-black text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:underline transition-all font-mono"
                    title="Press to mail"
                  >
                    chowdarypuneeth7@gmail.com
                  </a>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText("chowdarypuneeth7@gmail.com");
                      setEmailCopied(true);
                      setTimeout(() => setEmailCopied(false), 2000);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all border ${
                      emailCopied
                        ? 'bg-emerald-500 text-white border-emerald-500'
                        : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {emailCopied ? "COPIED" : "COPY"}
                  </button>
                </div>
              </div>

              {/* Legal Links */}
              <div className="flex gap-6 mt-4">
                <a href="#" className="text-slate-400 dark:text-slate-500 hover:text-emerald-600 font-bold text-xs uppercase tracking-widest transition-colors">{t.footer.privacy}</a>
                <a href="#" className="text-slate-400 dark:text-slate-500 hover:text-emerald-600 font-bold text-xs uppercase tracking-widest transition-colors">{t.footer.terms}</a>
              </div>
            </div>

            {/* Column 3: Copyright to Admin Concern */}
            <div className="text-center md:text-right space-y-4 w-full">
              <div>
                <p className="text-slate-400 dark:text-slate-500 text-sm font-bold">
                  © 2018 - 2026
                </p>
                <p className="text-slate-800 dark:text-slate-200 text-sm font-black leading-tight mt-1">
                  Krishi Mitra Admin Concern
                </p>
                <p className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-wider mt-0.5">
                  All Rights Reserved
                </p>
              </div>
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 inline-block text-center md:text-right w-full">
                <p className="text-emerald-600/70 dark:text-emerald-400 text-xs font-black tracking-widest uppercase">
                  {t.madeForIndia}
                </p>
              </div>
            </div>

          </div>
        </div>
      </footer>
    </div>
  );
}

function QuickActionCard({ icon: Icon, title, desc, onClick, color }: any) {
  const colors: any = {
    emerald: "from-emerald-500 to-emerald-600 shadow-emerald-100 dark:shadow-none text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20",
    blue: "from-blue-500 to-blue-600 shadow-blue-100 dark:shadow-none text-blue-600 bg-blue-50 dark:bg-blue-900/20",
    rose: "from-rose-500 to-rose-600 shadow-rose-100 dark:shadow-none text-rose-600 bg-rose-50 dark:bg-rose-900/20",
    amber: "from-amber-500 to-amber-600 shadow-amber-100 dark:shadow-none text-amber-600 bg-amber-50 dark:bg-amber-900/20",
  };

  return (
    <motion.button 
      whileHover={{ y: -8 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="flex flex-col items-start p-8 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 hover:border-emerald-200 dark:hover:border-emerald-800 hover:shadow-2xl hover:shadow-slate-200 dark:hover:shadow-none transition-all text-left group relative overflow-hidden"
    >
      <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-all group-hover:scale-110", colors[color])}>
        <Icon className="w-7 h-7" />
      </div>
      <h4 className="text-xl font-black text-slate-900 dark:text-white mb-2">{title}</h4>
      <p className="text-slate-500 dark:text-slate-400 text-sm font-medium leading-relaxed">{desc}</p>
      <div className="mt-6 w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all">
        <TrendingUp className="w-4 h-4 rotate-45" />
      </div>
    </motion.button>
  );
}
