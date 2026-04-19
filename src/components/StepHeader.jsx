import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Check, WifiOff } from 'lucide-react';
import { motion as m, AnimatePresence } from 'framer-motion';

const STEPS = [
  { path: '/', label: 'Home' },
  { path: '/train', label: 'Location' },
  { path: '/trains', label: 'Trains' },
  { path: '/tracking', label: 'Tracking' },
];

export default function StepHeader() {
  const { pathname } = useLocation();
  const [offline, setOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const on = () => setOffline(false);
    const off = () => setOffline(true);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  if (pathname === '/location-alarm') {
    return (
      <AnimatePresence>
        {offline && (
          <m.div
            initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -30, opacity: 0 }}
            className="fixed top-0 left-0 right-0 z-[5000] flex justify-center pt-3 pointer-events-none"
          >
            <div className="flex items-center gap-2 px-4 py-2 rounded-full text-white text-xs font-bold"
              style={{ background: '#92400E' }}>
              <WifiOff size={14} /> Offline — Alarm still active
            </div>
          </m.div>
        )}
      </AnimatePresence>
    );
  }

  const currentIdx = STEPS.findIndex(s => s.path === pathname);

  return (
    <div className="fixed top-0 left-0 right-0 z-[5000] flex flex-col items-center pt-3 pointer-events-none"
      style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Step Pill */}
      <div
        className="pointer-events-auto flex items-center gap-1.5 px-4 py-2 rounded-full"
        style={{ background: 'rgba(17,24,39,0.92)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 4px 24px rgba(0,0,0,0.4)' }}
      >
        {STEPS.map((step, i) => {
          const isActive = i === currentIdx;
          const isDone = i < currentIdx;
          return (
            <React.Fragment key={step.path}>
              <div className="flex items-center gap-1.5">
                <m.div
                  layout
                  className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-colors"
                  style={{
                    background: isActive ? '#3B82F6' : isDone ? '#10B981' : 'transparent',
                    border: isActive || isDone ? 'none' : '2px solid #374151',
                    boxShadow: isActive ? '0 0 12px rgba(59,130,246,0.5)' : 'none',
                  }}
                >
                  {isDone ? <Check size={11} className="text-white" /> :
                   isActive ? <div className="w-2 h-2 bg-white rounded-full" /> : null}
                </m.div>
                <AnimatePresence>
                  {isActive && (
                    <m.span
                      initial={{ width: 0, opacity: 0 }} animate={{ width: 'auto', opacity: 1 }} exit={{ width: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="text-white text-[11px] font-bold tracking-wide overflow-hidden whitespace-nowrap"
                    >
                      {step.label}
                    </m.span>
                  )}
                </AnimatePresence>
              </div>
              {i < STEPS.length - 1 && (
                <div className="w-4 h-[1.5px] rounded-full flex-shrink-0 transition-colors"
                  style={{ background: isDone ? '#10B981' : '#374151' }} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Offline banner */}
      <AnimatePresence>
        {offline && pathname !== '/location-alarm' && (
          <m.div
            initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }}
            className="pointer-events-auto mt-2 flex items-center gap-2 px-4 py-2 rounded-full text-white text-xs font-bold"
            style={{ background: '#92400E', boxShadow: '0 4px 16px rgba(0,0,0,0.3)' }}
          >
            <WifiOff size={13} /> Offline — Alarm still active
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
