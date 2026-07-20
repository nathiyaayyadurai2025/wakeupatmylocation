import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, MapPin, Compass, Bell, User } from 'lucide-react';
import { motion as m } from 'framer-motion';

export default function MobileBottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    { label: 'Home', icon: Home, path: '/' },
    { label: 'Location', icon: MapPin, path: '/train' },
    { label: 'Trains', icon: Compass, path: '/trains' },
    { label: 'Tracking', icon: Bell, path: '/tracking' },
  ];

  return (
    <div className="md:hidden fixed bottom-4 left-4 right-4 z-[4000] pointer-events-none">
      <div className="pointer-events-auto bg-slate-900/90 dark:bg-slate-900/95 backdrop-blur-xl border border-white/10 p-2 rounded-3xl shadow-2xl shadow-black/50 flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = location.pathname === tab.path;
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={`relative flex flex-col items-center gap-1 py-1.5 px-4 rounded-2xl transition-all ${
                isActive ? 'text-blue-400 font-bold' : 'text-slate-400 hover:text-slate-200 font-medium'
              }`}
            >
              {isActive && (
                <m.div
                  layoutId="mobileTabBg"
                  className="absolute inset-0 bg-blue-500/15 rounded-2xl border border-blue-500/30"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <Icon size={18} className={`relative z-10 ${isActive ? 'scale-110 text-blue-400' : ''}`} />
              <span className="relative z-10 text-[10px] tracking-tight">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
