import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Sprout, Phone, ArrowRight, Lock } from 'lucide-react';
import { Language, translations } from '../constants/translations';

interface LoginProps {
  lang: Language;
  onLogin: (phone: string) => void;
}

export function Login({ lang, onLogin }: LoginProps) {
  const t = translations[lang];
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length === 10) {
      onLogin(phone);
    } else {
      setError(t.invalidPhone);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-white dark:bg-slate-950 flex items-center justify-center p-4">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-emerald-100/40 dark:bg-emerald-900/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[10%] -right-[10%] w-[30%] h-[30%] bg-sky-100/40 dark:bg-sky-900/20 blur-[100px] rounded-full" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-2xl border border-slate-100 dark:border-slate-800 relative z-10"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 bg-emerald-600 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-emerald-200 dark:shadow-none mb-6">
            <Sprout className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white text-center">{t.login?.title || "Farmer Login"}</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-center mt-2">{t.tagline}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 ml-1">
              {t.login?.phoneLabel || "Phone Number"}
            </label>
            <div className="relative">
              <Phone className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="tel" 
                value={phone}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                  setPhone(val);
                  setError("");
                }}
                placeholder={t.login?.phonePlaceholder || "Enter 10 digit number"}
                className="w-full pl-14 pr-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 dark:text-white font-bold transition-all"
              />
            </div>
            {error && <p className="text-rose-500 text-xs font-bold mt-2 ml-1">{error}</p>}
          </div>

          <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-800/50 flex items-start gap-3">
            <Lock className="w-5 h-5 text-emerald-600 mt-0.5" />
            <p className="text-xs text-emerald-800 dark:text-emerald-300 font-medium leading-relaxed">
              {t.secureDataNote}
            </p>
          </div>

          <button 
            type="submit"
            className="w-full py-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-lg shadow-xl shadow-emerald-200 dark:shadow-none transition-all flex items-center justify-center gap-2 group"
          >
            {t.login?.loginBtn || "Login"}
            <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-widest">
            {t.madeForIndia}
          </p>
        </div>
      </motion.div>
    </div>
  );
}
