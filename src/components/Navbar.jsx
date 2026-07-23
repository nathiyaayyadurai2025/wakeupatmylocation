import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Train, ShieldAlert, Settings } from 'lucide-react';
import { motion as m } from 'framer-motion';
import { useCountry } from '../context/CountryContext';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { country, setCountry, countryFlag } = useCountry();

  return (
    <header className="fixed top-0 left-0 right-0 z-[4000] glass-nav transition-all duration-300 max-w-md mx-auto border-x border-slate-200 dark:border-slate-800">
      <div className="px-4 h-16 flex items-center justify-between">
        
        {/* Centered / Left Brand Logo */}
        <div 
          onClick={() => navigate('/')}
          className="flex items-center gap-2 cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-700 flex items-center justify-center text-white shadow-md">
            <Train size={18} className="animate-pulse" />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-sm tracking-tight text-slate-900 dark:text-white leading-none">
              WakeUp<span className="text-blue-600">MyStop</span>
            </span>
            <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">
              PLANNER
            </span>
          </div>
        </div>

        {/* Quick Config / Settings Action Bar */}
        <div className="flex items-center gap-2">
          {/* Quick Country Indicator Badge */}
          <div className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-black text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
            {country === 'IN' ? '🇮🇳 IR' : '🇮🇩 KAI'}
          </div>

          <m.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate('/tracking')}
            className="w-9 h-9 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 flex items-center justify-center text-slate-600 dark:text-slate-200 shadow-sm"
          >
            <Settings size={16} />
          </m.button>
        </div>

      </div>
    </header>
  );
}
