import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Check } from 'lucide-react';

const steps = [
  { path: '/', label: 'Home' },
  { path: '/train', label: 'Stations' },
  { path: '/trains', label: 'Trains' },
  { path: '/tracking', label: 'Tracking' }
];

export default function StepHeader() {
  const location = useLocation();
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    if (!navigator.onLine) setIsOffline(true);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const currentIdx = steps.findIndex(s => s.path === location.pathname);

  // If we are at location alarm, just hide train steps or show custom
  if (location.pathname === '/location-alarm') return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-slate-900 border-b border-slate-800">
      {isOffline && (
        <div className="bg-yellow-500 text-black text-xs font-bold text-center py-1 uppercase tracking-widest">
          Offline Mode — Alarm still active
        </div>
      )}
      <div className="overflow-x-auto whitespace-nowrap p-3" style={{ scrollbarWidth: 'none' }}>
        <div className="flex items-center space-x-1 sm:justify-center min-w-max px-2">
          {steps.map((step, idx) => {
            const isActive = currentIdx === idx;
            const isCompleted = currentIdx > idx;

            return (
              <React.Fragment key={step.path}>
                <div className="flex items-center">
                  <div className={`flex items-center justify-center h-6 px-3 rounded-full text-xs font-bold transition-colors ${
                    isActive ? 'bg-blue-600 text-white' : 
                    isCompleted ? 'bg-green-600 text-white' : 
                    'bg-slate-800 text-slate-500'
                  }`}>
                    {isCompleted ? <Check size={12} className="mr-1" /> : null}
                    {step.label}
                  </div>
                </div>
                {idx < steps.length - 1 && (
                  <div className={`w-4 h-[2px] mx-1 ${isCompleted ? 'bg-green-600' : 'bg-slate-800'}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}
