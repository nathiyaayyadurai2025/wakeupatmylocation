import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Train, Navigation, Sparkles } from 'lucide-react';
import { motion as m } from 'framer-motion';
import { useCountry } from '../context/CountryContext';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { country, setCountry } = useCountry();

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'Location', path: '/train' },
    { label: 'Trains', path: '/trains' },
    { label: 'Tracking', path: '/tracking' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-[4000] glass-nav transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo */}
        <div 
          onClick={() => navigate('/')}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/25 group-hover:scale-105 transition-transform duration-300">
            <Train size={20} className="animate-pulse" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 dark:from-white dark:via-blue-200 dark:to-white bg-clip-text text-transparent">
              WakeUp<span className="text-blue-600">MyStop</span>
            </span>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest -mt-1">
              AI GPS Alarm
            </span>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 dark:bg-slate-900/60 p-1.5 rounded-full border border-slate-200/60 dark:border-slate-800/60">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <button
                key={link.path}
                onClick={() => navigate(link.path)}
                className={`relative px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200 ${
                  isActive
                    ? 'text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {isActive && (
                  <m.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-blue-600 rounded-full shadow-md shadow-blue-500/30"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{link.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Action Items */}
        <div className="flex items-center gap-3">
          {/* Country Switcher */}
          <div className="flex items-center p-1 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
            <button
              onClick={() => setCountry('IN')}
              className={`px-2.5 py-1 rounded-full text-xs font-extrabold transition-all flex items-center gap-1 ${
                country === 'IN'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <span>🇮🇳</span>
              <span className="text-[10px]">IN</span>
            </button>
            <button
              onClick={() => setCountry('ID')}
              className={`px-2.5 py-1 rounded-full text-xs font-extrabold transition-all flex items-center gap-1 ${
                country === 'ID'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <span>🇮🇩</span>
              <span className="text-[10px]">ID</span>
            </button>
          </div>

          {/* Primary CTA Button */}
          <m.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/train')}
            className="hidden sm:flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-500/25 transition-all"
          >
            <Navigation size={14} />
            <span>Start Tracking</span>
          </m.button>
        </div>

      </div>
    </header>
  );
}
