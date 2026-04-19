import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Check, WifiOff } from 'lucide-react';
import { motion as m, AnimatePresence } from 'framer-motion';

const steps = [
  { path: '/', label: 'Home' },
  { path: '/train', label: 'Location' },
  { path: '/trains', label: 'Trains' },
  { path: '/tracking', label: 'Tracking' }
];

export default function StepHeader() {
  const location = useLocation();
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const currentIdx = steps.findIndex(s => s.path === location.pathname);

  // Still show offline toast independent of train flow
  if (location.pathname === '/location-alarm') {
    return (
      <div className="fixed top-0 left-0 right-0 z-[100] flex justify-center pt-2 pointer-events-none">
        <AnimatePresence>
          {isOffline && (
            <m.div
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -50, opacity: 0 }}
              className="bg-[#92400E] text-white flex items-center px-4 py-2 rounded-full shadow-[0_4px_24px_rgba(0,0,0,0.4)]"
            >
              <WifiOff size={16} className="mr-2" />
              <span className="font-semibold text-xs tracking-wide">Offline — Alarm still active</span>
            </m.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] flex flex-col items-center pt-4 pointer-events-none">
      <div className="bg-[#111827]/90 backdrop-blur-md px-5 py-3 rounded-full flex items-center shadow-[0_4px_24px_rgba(0,0,0,0.4)] border border-white/5 pointer-events-auto">
        {steps.map((step, idx) => {
          const isActive = currentIdx === idx;
          const isCompleted = currentIdx > idx;

          return (
            <React.Fragment key={step.path}>
              <div className="flex items-center">
                <m.div 
                  layout
                  className={`flex flex-col items-center justify-center transition-all ${
                    isActive ? 'px-2' : ''
                  }`}
                >
                  <div className={`flex items-center justify-center w-6 h-6 rounded-full transition-colors ${
                    isActive ? 'bg-[#3B82F6] shadow-[0_0_20px_rgba(59,130,246,0.3)]' : 
                    isCompleted ? 'bg-[#10B981]' : 
                    'border-2 border-[#4B5563] bg-transparent'
                  }`}>
                    {isCompleted ? <Check size={12} className="text-white font-bold" /> : null}
                    {isActive ? <div className="w-2 h-2 bg-white rounded-full" /> : null}
                  </div>
                  {isActive && (
                    <m.span 
                      initial={{ opacity: 0, width: 0 }} 
                      animate={{ opacity: 1, width: 'auto' }} 
                      className="ml-2 text-xs font-bold text-white whitespace-nowrap"
                    >
                      {step.label}
                    </m.span>
                  )}
                </m.div>
              </div>
              {idx < steps.length - 1 && (
                <div className={`w-6 h-[2px] mx-1 transition-colors ${isCompleted ? 'bg-[#10B981]' : 'bg-[#4B5563]'}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      <AnimatePresence>
        {isOffline && (
          <m.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            className="mt-3 bg-[#92400E] text-white flex items-center px-4 py-2 rounded-full shadow-lg pointer-events-auto"
          >
            <WifiOff size={16} className="mr-2" />
            <span className="font-semibold text-xs tracking-wide">Offline — Alarm still active</span>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
