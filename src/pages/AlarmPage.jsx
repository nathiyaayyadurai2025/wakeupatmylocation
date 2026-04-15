import React, { useContext, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion as m, AnimatePresence } from 'framer-motion';
import { Bell, MapPin, Train, Volume2, X, Info, Zap, BellOff, VolumeX, AlertTriangle, Bus, ShieldAlert, Navigation } from 'lucide-react';
import { AlarmContext } from '../App';

const AlarmPage = () => {
  const navigate = useNavigate();
  const { 
    isAlarmActive, setIsAlarmActive, 
    activeStop, selectedStops, setSelectedStops,
    travelMode, t 
  } = useContext(AlarmContext);
  const audioRef = useRef(null);

  useEffect(() => {
    // Specialized High-Impact Aviation Alarm
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'); 
    audio.loop = true;
    audioRef.current = audio;
    
    // Attempt playback immediately (gesture-based if coming from Tracking)
    const playAttempt = async () => {
      try {
        await audio.play();
        console.log("Mission Alert System Engaged: High-Volume Active.");
      } catch (err) {
        console.warn("Satellite Audio Blocked. Requires User Interaction.");
      }
    };
    
    playAttempt();

    if ("vibrate" in navigator) {
      navigator.vibrate([1000, 500, 1000, 500, 2000]);
    }

    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(t.wakeUp, {
        body: `${activeStop?.station || activeStop?.stopName || ''} is approaching!`,
        icon: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
        tag: 'wake-me-stop'
      });
    }

    return () => {
      audio.pause();
      if ("vibrate" in navigator) navigator.vibrate(0);
    };
  }, [activeStop, t.wakeUp]);

  const handleStop = () => {
    if (audioRef.current) audioRef.current.pause();
    setIsAlarmActive(false);

    const remainingStops = selectedStops.filter(s => 
      (s.station || s.stopName) !== (activeStop?.station || activeStop?.stopName)
    );
    setSelectedStops(remainingStops);

    if (remainingStops.length > 0) navigate('/tracking');
    else navigate('/');
  };

  const stopIcon = travelMode === 'train' ? <Train size={80} strokeWidth={1.5} /> : travelMode === 'bus' ? <Bus size={80} strokeWidth={1.5} /> : <Navigation size={80} strokeWidth={1.5} />;

  return (
    <div className="fixed inset-0 z-[100] bg-red-950 flex flex-col items-center justify-center p-8 text-center overflow-hidden">
      {/* Explosive Strobe Background */}
      <m.div 
        animate={{ 
          scale: [1, 1.5, 1],
          opacity: [0.1, 0.3, 0.1]
        }}
        transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute w-[600px] h-[600px] bg-red-600 blur-[120px] rounded-full pointer-events-none"
      />
      <m.div 
        animate={{ 
           scale: [1.2, 0.8, 1.2],
           opacity: [0.05, 0.15, 0.05]
        }}
        transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
        className="absolute w-[800px] h-[800px] bg-rose-500 blur-[150px] rounded-full pointer-events-none"
      />

      {/* Main Alert Content */}
      <div className="relative z-10 flex flex-col items-center">
        <m.div 
          animate={{ 
            boxShadow: [
              "0 0 0px 0px rgba(239, 68, 68, 0)",
              "0 0 50px 20px rgba(239, 68, 68, 0.4)",
              "0 0 0px 0px rgba(239, 68, 68, 0)"
            ],
            scale: [1, 1.1, 1]
          }}
          transition={{ duration: 0.6, repeat: Infinity }}
          className="w-44 h-44 rounded-[3rem] bg-white text-red-600 flex items-center justify-center mb-12 shadow-2xl relative overflow-hidden"
        >
          <div className="scan-line bg-red-500/10" />
          {stopIcon}
        </m.div>

        <m.h1 
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 0.3, repeat: Infinity }}
          className="text-7xl font-black text-white mb-6 uppercase tracking-tighter italic"
        >
          {t.wakeUp}
        </m.h1>

        <m.div 
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="glass-darker p-10 rounded-[2.5rem] border border-white/10 mb-16 w-full max-w-sm shadow-[0_40px_100px_rgba(0,0,0,0.6)]"
        >
          <div className="flex items-center justify-center space-x-2 text-red-400 font-black text-[11px] uppercase tracking-[0.4em] mb-4">
            <ShieldAlert size={14} className="animate-pulse" />
            <span>Target Reached</span>
          </div>
          <h2 className="text-4xl font-black text-white mb-2 uppercase tracking-tight leading-none truncate">
            {activeStop?.station || activeStop?.stopName || 'Arriving'}
          </h2>
          <p className="text-xs font-bold text-slate-400 font-mono tracking-widest uppercase opacity-60">Approaching Stop Now</p>
        </m.div>
      </div>

      <m.div 
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-sm relative z-10"
      >
        <m.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleStop}
          className="w-full py-7 bg-white text-slate-950 font-black rounded-[2rem] shadow-[0_25px_50px_-12px_rgba(255,255,255,0.25)] flex items-center justify-center space-x-4 tracking-[0.3em] uppercase text-xl relative overflow-hidden group"
        >
           <div className="absolute inset-0 bg-red-600 opacity-0 group-hover:opacity-5 transition-opacity" />
           <VolumeX size={32} strokeWidth={2.5} />
           <span>{t.dismiss}</span>
        </m.button>
        <p className="mt-6 text-[10px] font-black uppercase text-white/40 tracking-[0.2em]">
          Powered by WakeMyStop Smart Sync
        </p>
      </m.div>
    </div>
  );
};

export default AlarmPage;
