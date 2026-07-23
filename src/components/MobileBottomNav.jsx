import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, MapPin, Compass, Bell } from 'lucide-react';
import { motion as m } from 'framer-motion';

export default function MobileBottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    { label: 'Home', icon: Home, path: '/' },
    { label: 'Plan', icon: MapPin, path: '/train' },
    { label: 'Trains', icon: Compass, path: '/trains' },
    { label: 'Tracking', icon: Bell, path: '/tracking' },
  ];

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[4000] pointer-events-none max-w-md mx-auto">
      <div className="pointer-events-auto bg-slate-900/90 dark:bg-slate-950/95 backdrop-blur-xl border border-white/10 p-2 rounded-[22px] shadow-2xl flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = location.pathname === tab.path;
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={`relative flex flex-col items-center gap-1.5 py-1.5 px-4 rounded-xl transition-all ${
                isActive ? 'text-blue-400 font-bold' : 'text-slate-400 font-medium'
              }`}
            >
              {isActive && (
                <m.div
                  layoutId="mobileTabBg"
                  className="absolute inset-0 bg-blue-500/10 rounded-xl border border-blue-500/20"
                  transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                />
              )}
              <Icon size={16} className={`relative z-10 ${isActive ? 'scale-105 text-blue-400' : ''}`} />
              <span className="relative z-10 text-[9px] tracking-tight">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
