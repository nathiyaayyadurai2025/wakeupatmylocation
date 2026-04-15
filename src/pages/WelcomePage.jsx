import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Map, Settings, Navigation, Train, Bus, MapPin, Search, Play, X, Sliders, Info, Zap } from 'lucide-react';

const WelcomePage = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 py-10 text-center">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="w-24 h-24 bg-brand-500 rounded-3xl flex items-center justify-center mb-8 pulse-glow relative"
      >
        <Bell size={48} className="text-white animate-float" />
        <div className="absolute -top-1 -right-1 w-6 h-6 bg-amber-400 rounded-full border-4 border-slate-950"></div>
      </motion.div>

      <motion.h1 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="text-5xl font-black mb-2 tracking-tighter"
      >
        WakeMe <span className="text-brand-indigo">There</span>
      </motion.h1>

      <motion.p 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="text-slate-400 text-xl font-medium mb-12 max-w-xs leading-relaxed opacity-80"
      >
        Free location alarm app
      </motion.p>

      <div className="w-full space-y-4">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/destination')}
          className="w-full py-4 glass bg-brand-600/90 text-white font-bold rounded-2xl flex items-center justify-center space-x-3 shadow-xl shadow-brand-500/20"
        >
          <Play size={20} fill="currentColor" />
          <span>START TRACKING</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/settings')}
          className="w-full py-4 glass text-slate-300 font-semibold rounded-2xl flex items-center justify-center space-x-3"
        >
          <Settings size={20} />
          <span>APP SETTINGS</span>
        </motion.button>
      </div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-16 flex space-x-8 text-slate-500"
      >
        <div className="flex flex-col items-center">
          <Train size={20} />
          <span className="text-[10px] mt-1 font-medium tracking-wider uppercase">Railways</span>
        </div>
        <div className="flex flex-col items-center text-brand-400">
          <Bus size={20} />
          <span className="text-[10px] mt-1 font-medium tracking-wider uppercase">Bus Routes</span>
        </div>
        <div className="flex flex-col items-center">
          <Navigation size={20} />
          <span className="text-[10px] mt-1 font-medium tracking-wider uppercase">GPS Tracking</span>
        </div>
      </motion.div>
    </div>
  );
};

export default WelcomePage;
