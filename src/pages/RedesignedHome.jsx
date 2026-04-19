import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Train, MapPin } from 'lucide-react';
import { motion as m } from 'framer-motion';

export default function RedesignedHome() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 p-6 flex flex-col justify-center items-center pt-20">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-black text-white tracking-tighter">WakeMyStop</h1>
          <p className="text-slate-400 mt-2 text-sm">Select an alarm mode to begin</p>
        </div>

        <div className="space-y-4">
          <m.button
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/train')}
            className="w-full bg-slate-800 p-6 rounded-xl flex items-center text-left space-x-4 border border-blue-500/20 hover:border-blue-500 transition-colors shadow-lg active:scale-95"
          >
            <div className="w-14 h-14 bg-blue-500/10 rounded-full flex items-center justify-center flex-shrink-0 text-blue-500">
              <Train size={30} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white mb-1">Train Alarm</h2>
              <p className="text-slate-400 text-xs leading-relaxed">
                Track your train journey, get alerted 2km before your stop
              </p>
            </div>
          </m.button>

          <m.button
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/location-alarm')}
            className="w-full bg-slate-800 p-6 rounded-xl flex items-center text-left space-x-4 border border-green-500/20 hover:border-green-500 transition-colors shadow-lg active:scale-95"
          >
            <div className="w-14 h-14 bg-green-500/10 rounded-full flex items-center justify-center flex-shrink-0 text-green-500">
              <MapPin size={30} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white mb-1">Location Alarm</h2>
              <p className="text-slate-400 text-xs leading-relaxed">
                Set any location as destination, alarm triggers when nearby
              </p>
            </div>
          </m.button>
        </div>
      </div>
    </div>
  );
}
