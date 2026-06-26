import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Play, Square, RotateCcw, Ruler, Navigation, X } from 'lucide-react';
import { Language, translations } from '../constants/translations';

interface Point {
  lat: number;
  lng: number;
}

export function LandMeasurement({ lang, onClose }: { lang: Language; onClose: () => void }) {
  const t = translations[lang];
  const [isTracking, setIsTracking] = useState(false);
  const [points, setPoints] = useState<Point[]>([]);
  const [area, setArea] = useState<number>(0);
  const [currentPos, setCurrentPos] = useState<Point | null>(null);
  const watchId = useRef<number | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setCurrentPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      });
    }
    return () => {
      if (watchId.current) navigator.geolocation.clearWatch(watchId.current);
    };
  }, []);

  const startTracking = () => {
    setIsTracking(true);
    if (navigator.geolocation) {
      watchId.current = navigator.geolocation.watchPosition(
        (pos) => {
          const newPoint = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setCurrentPos(newPoint);
          setPoints((prev) => [...prev, newPoint]);
        },
        (err) => console.error(err),
        { enableHighAccuracy: true }
      );
    }
  };

  const stopTracking = () => {
    setIsTracking(false);
    if (watchId.current) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
    calculateArea();
  };

  const reset = () => {
    setPoints([]);
    setArea(0);
    setIsTracking(false);
    if (watchId.current) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
  };

  // Shoelace formula for area calculation in square meters
  const calculateArea = () => {
    if (points.length < 3) return;

    const R = 6378137; // Earth's radius in meters
    let area = 0;

    for (let i = 0; i < points.length; i++) {
      const p1 = points[i];
      const p2 = points[(i + 1) % points.length];
      
      const x1 = p1.lng * (Math.PI / 180) * R * Math.cos(p1.lat * (Math.PI / 180));
      const y1 = p1.lat * (Math.PI / 180) * R;
      const x2 = p2.lng * (Math.PI / 180) * R * Math.cos(p2.lat * (Math.PI / 180));
      const y2 = p2.lat * (Math.PI / 180) * R;

      area += (x1 * y2 - x2 * y1);
    }

    setArea(Math.abs(area) / 2);
  };

  const formatArea = (sqMeters: number) => {
    if (sqMeters === 0) return "0";
    const acres = sqMeters / 4046.86;
    const guntha = sqMeters / 101.17;
    return `${acres.toFixed(2)} ${t.acres} (${guntha.toFixed(1)} ${t.guntha})`;
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-white dark:bg-slate-950 flex flex-col"
    >
      <header className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white">
            <Ruler className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">{t.landMeasure?.title || "Land Measurement"}</h2>
            <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest">{t.landMeasure?.desc || "GPS Area Calculator"}</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all">
          <X className="w-6 h-6 text-slate-500" />
        </button>
      </header>

      <main className="flex-1 overflow-y-auto p-6 space-y-8">
        <div className="bg-slate-50 dark:bg-slate-900 rounded-[2rem] p-8 border border-slate-100 dark:border-slate-800 text-center">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{t.landMeasure?.area || "Total Area"}</div>
          <div className="text-4xl font-black text-emerald-600 mb-4">
            {formatArea(area)}
          </div>
          <div className="flex items-center justify-center gap-2 text-slate-500 dark:text-slate-400 font-bold text-sm">
            <MapPin className="w-4 h-4" />
            {points.length} {t.landMeasure?.points || "Points Collected"}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
            <Navigation className="w-5 h-5 text-emerald-500" />
            {t.currentLocation}
          </h3>
          <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
            {currentPos ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t.latitude}</div>
                  <div className="font-bold text-slate-700 dark:text-slate-300">{currentPos.lat.toFixed(6)}</div>
                </div>
                <div>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t.longitude}</div>
                  <div className="font-bold text-slate-700 dark:text-slate-300">{currentPos.lng.toFixed(6)}</div>
                </div>
              </div>
            ) : (
              <div className="text-slate-400 font-bold animate-pulse">{t.waitingGPS}</div>
            )}
          </div>
        </div>

        <div className="bg-amber-50 dark:bg-amber-900/20 p-6 rounded-3xl border border-amber-100 dark:border-amber-800/50">
          <h4 className="text-amber-800 dark:text-amber-300 font-bold text-sm mb-2">{t.instructions}</h4>
          <ul className="text-xs text-amber-700 dark:text-amber-400 space-y-2 font-medium">
            <li>{t.instruction1}</li>
            <li>{t.instruction2}</li>
            <li>{t.instruction3}</li>
            <li>{t.instruction4}</li>
          </ul>
        </div>
      </main>

      <footer className="p-6 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
        <div className="flex gap-4">
          <button 
            onClick={reset}
            className="p-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-bold hover:bg-slate-200 transition-all"
          >
            <RotateCcw className="w-6 h-6" />
          </button>
          
          {!isTracking ? (
            <button 
              onClick={startTracking}
              className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-emerald-200 flex items-center justify-center gap-3 hover:bg-emerald-700 transition-all"
            >
              <Play className="w-6 h-6 fill-current" />
              {t.landMeasure?.start || "Start Tracking"}
            </button>
          ) : (
            <button 
              onClick={stopTracking}
              className="flex-1 py-4 bg-rose-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-rose-200 flex items-center justify-center gap-3 hover:bg-rose-700 transition-all animate-pulse"
            >
              <Square className="w-6 h-6 fill-current" />
              {t.landMeasure?.stop || "Stop & Calculate"}
            </button>
          )}
        </div>
      </footer>
    </motion.div>
  );
}
