import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Leaf, ChevronRight, Check } from 'lucide-react';
import { Language, languages, translations } from '../constants/translations';
import { karnatakaDistricts, districtTaluks } from '../constants/karnataka_locations';
import { locationTranslations } from '../constants/location_translations';

interface OnboardingProps {
  onComplete: (name: string, lang: Language, location: string, crop: string, sowingDate: string) => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [name, setName] = useState('');
  const [lang, setLang] = useState<Language>('en');
  const [state, setState] = useState('Karnataka');
  const [district, setDistrict] = useState('');
  const [taluk, setTaluk] = useState('');
  const [crop, setCrop] = useState('');
  const [sowingDate, setSowingDate] = useState('');
  const [step, setStep] = useState(1);
  const t = translations[lang].onboarding;

  const translate = (key: string) => {
    return locationTranslations[lang]?.[key] || key;
  };

  const handleNext = () => {
    if (step === 1 && name.trim()) {
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    } else if (step === 3 && district && taluk) {
      setStep(4);
    } else if (step === 4 && crop && sowingDate) {
      onComplete(name, lang, `${taluk}, ${district}, ${state}`, crop, sowingDate);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-emerald-50 flex items-start justify-center p-4 overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-[2rem] shadow-2xl shadow-emerald-200/50 p-8 relative overflow-hidden my-auto"
      >
        {/* Decorative elements */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-100 rounded-full blur-3xl" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-sky-100 rounded-full blur-3xl" />

        <div className="relative z-10">
          <div className="flex justify-center mb-8">
            <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
              <Leaf className="w-10 h-10" />
            </div>
          </div>

          <h1 className="text-3xl font-black text-emerald-950 text-center mb-2">{t.title}</h1>
          <p className="text-emerald-600/70 text-center font-medium mb-8">{t.subtitle}</p>

          {step === 1 ? (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div>
                <label className="block text-sm font-bold text-emerald-900 mb-2 uppercase tracking-wider">
                  {t.nameLabel}
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t.namePlaceholder}
                  className="w-full bg-emerald-50 border-2 border-emerald-100 rounded-2xl px-6 py-4 text-lg font-bold text-emerald-950 focus:outline-none focus:border-emerald-500 transition-all placeholder:text-emerald-300"
                  autoFocus
                />
              </div>
              
              <button
                onClick={handleNext}
                disabled={!name.trim()}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-200 text-white rounded-2xl py-4 font-black text-lg shadow-lg shadow-emerald-200 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                {t.next}
                <ChevronRight className="w-6 h-6" />
              </button>
            </motion.div>
          ) : step === 2 ? (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div>
                <label className="block text-sm font-bold text-emerald-900 mb-4 uppercase tracking-wider">
                  {t.langLabel}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {languages.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => setLang(l.code as Language)}
                      className={`px-4 py-3 rounded-xl font-bold transition-all flex items-center justify-between ${
                        lang === l.code 
                          ? 'bg-emerald-600 text-white shadow-md' 
                          : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                      }`}
                    >
                      {l.name}
                      {lang === l.code && <Check className="w-4 h-4" />}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleNext}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl py-4 font-black text-lg shadow-lg shadow-emerald-200 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                {t.next}
                <ChevronRight className="w-6 h-6" />
              </button>
            </motion.div>
          ) : step === 3 ? (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div>
                <label className="block text-sm font-bold text-emerald-900 mb-2 uppercase tracking-wider">
                  {t.locationLabel}
                </label>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-black text-emerald-600 uppercase mb-1 ml-1">{t.stateLabel}</label>
                    <select 
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="w-full bg-emerald-50 border-2 border-emerald-100 rounded-2xl px-6 py-4 text-lg font-bold text-emerald-950 focus:outline-none focus:border-emerald-500 transition-all"
                    >
                      <option value="Karnataka">{t.stateName}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-emerald-600 uppercase mb-1 ml-1">{t.districtLabel}</label>
                    <select 
                      value={district}
                      onChange={(e) => {
                        setDistrict(e.target.value);
                        setTaluk('');
                      }}
                      className="w-full bg-emerald-50 border-2 border-emerald-100 rounded-2xl px-6 py-4 text-lg font-bold text-emerald-950 focus:outline-none focus:border-emerald-500 transition-all"
                    >
                      <option value="">{t.districtLabel}</option>
                      {karnatakaDistricts.map(d => <option key={d} value={d}>{translate(d)}</option>)}
                    </select>
                  </div>

                  {district && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <label className="block text-xs font-black text-emerald-600 uppercase mb-1 ml-1">{t.talukLabel}</label>
                      <select 
                        value={taluk}
                        onChange={(e) => setTaluk(e.target.value)}
                        className="w-full bg-emerald-50 border-2 border-emerald-100 rounded-2xl px-6 py-4 text-lg font-bold text-emerald-950 focus:outline-none focus:border-emerald-500 transition-all"
                      >
                        <option value="">{t.talukLabel}</option>
                        {districtTaluks[district].map(tk => <option key={tk} value={tk}>{translate(tk)}</option>)}
                      </select>
                    </motion.div>
                  )}
                </div>
              </div>

              <button
                onClick={handleNext}
                disabled={!district || !taluk}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-200 text-white rounded-2xl py-4 font-black text-lg shadow-lg shadow-emerald-200 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                {t.next}
                <ChevronRight className="w-6 h-6" />
              </button>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div>
                <label className="block text-sm font-bold text-emerald-900 mb-2 uppercase tracking-wider">
                  {t.cropLabel}
                </label>
                <input
                  type="text"
                  value={crop}
                  onChange={(e) => setCrop(e.target.value)}
                  placeholder={t.cropPlaceholder}
                  className="w-full bg-emerald-50 border-2 border-emerald-100 rounded-2xl px-6 py-4 text-lg font-bold text-emerald-950 focus:outline-none focus:border-emerald-500 transition-all placeholder:text-emerald-300"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-emerald-900 mb-2 uppercase tracking-wider">
                  {t.sowingDateLabel}
                </label>
                <input
                  type="date"
                  value={sowingDate}
                  onChange={(e) => setSowingDate(e.target.value)}
                  className="w-full bg-emerald-50 border-2 border-emerald-100 rounded-2xl px-6 py-4 text-lg font-bold text-emerald-950 focus:outline-none focus:border-emerald-500 transition-all"
                />
              </div>

              <button
                onClick={handleNext}
                disabled={!crop || !sowingDate}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-200 text-white rounded-2xl py-4 font-black text-lg shadow-lg shadow-emerald-200 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                {t.getStarted}
                <Check className="w-6 h-6" />
              </button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
