import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings as SettingsIcon, Bell, Navigation, Train, Bus, MapPin, Search, Play, X, Sliders, Info, Zap, ChevronLeft, Volume2, Waves, Clock, Activity, ShieldHalf, Globe, Check } from 'lucide-react';
import { AlarmContext } from '../App';

const SettingsPage = () => {
  const navigate = useNavigate();
  const { settings, setSettings, t, lang, setLang } = useContext(AlarmContext);

  const handleDistanceChange = (e) => {
    setSettings({ ...settings, distanceThreshold: parseFloat(e.target.value) });
  };

  const handleTimeChange = (e) => {
    setSettings({ ...settings, timeThreshold: parseFloat(e.target.value) });
  };

  return (
    <div className="flex flex-col min-h-screen pt-8 px-6 pb-24 overflow-y-auto">
      <div className="flex items-center justify-between mb-8">
        <button 
          onClick={() => navigate(-1)}
          className="w-10 h-10 glass flex items-center justify-center rounded-xl text-slate-400 hover:text-brand-400"
        >
          <ChevronLeft size={20} />
        </button>
        <h2 className="text-2xl font-black">{t.settings}</h2>
        <div className="w-10"></div>
      </div>

      {/* Language Switcher */}
      <div className="mb-10 group">
        <div className="flex items-center space-x-2 mb-6 text-slate-500 font-black text-xs uppercase tracking-[0.2em] px-2 leading-none">
          <Globe size={14} className="group-focus-within:text-brand-400 transition-colors" />
          <span>{t.language} Preferences</span>
        </div>
        <div className="grid grid-cols-2 gap-3 p-1.5 glass-darker rounded-2xl">
          <button 
            onClick={() => setLang('en')}
            className={`py-3 px-4 rounded-xl font-black text-xs flex items-center justify-center space-x-2 transition-all ${lang === 'en' ? 'bg-brand-500 text-white shadow-xl shadow-brand-500/20' : 'text-slate-500 hover:bg-slate-800'}`}
          >
            <span>{t.english}</span>
          </button>
          <button 
            onClick={() => setLang('ta')}
            className={`py-3 px-4 rounded-xl font-black text-xs flex items-center justify-center space-x-2 transition-all ${lang === 'ta' ? 'bg-brand-500 text-white shadow-xl shadow-brand-500/20' : 'text-slate-500 hover:bg-slate-800'}`}
          >
            <span>{t.tamil}</span>
          </button>
        </div>
      </div>

      {/* Threshold Sliders */}
      <div className="space-y-12 mb-10">
        <div className="group">
          <div className="flex items-center justify-between mb-6 px-2">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-400 border border-brand-500/20">
                <Navigation size={16} />
              </div>
              <h3 className="font-black text-sm uppercase tracking-widest text-slate-300">WAKE BEFORE DISTANCE</h3>
            </div>
            <span className="text-2xl font-black text-brand-400 tracking-tighter tabular-nums">
              {settings.distanceThreshold} <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">km</span>
            </span>
          </div>
          
          <div className="relative group px-1">
            <input 
              type="range"
              min="0.5"
              max="10"
              step="0.5"
              value={settings.distanceThreshold}
              onChange={handleDistanceChange}
              className="w-full h-3 bg-slate-900 rounded-full appearance-none cursor-pointer accent-brand-500 hover:bg-slate-800 transition-colors"
            />
            <div className="flex justify-between mt-4 text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] px-1 overflow-hidden">
              <span>0.5 KM</span>
              <span>10 KM</span>
            </div>
          </div>
        </div>

        <div className="group">
          <div className="flex items-center justify-between mb-6 px-2">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                <Clock size={16} />
              </div>
              <h3 className="font-black text-sm uppercase tracking-widest text-slate-300">WAKE BEFORE TIME</h3>
            </div>
            <span className="text-2xl font-black text-indigo-400 tracking-tighter tabular-nums">
              {settings.timeThreshold} <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">min</span>
            </span>
          </div>
          
          <div className="relative group px-1">
            <input 
              type="range"
              min="5"
              max="30"
              step="5"
              value={settings.timeThreshold}
              onChange={handleTimeChange}
              className="w-full h-3 bg-slate-900 rounded-full appearance-none cursor-pointer accent-indigo-500 hover:bg-slate-800 transition-colors"
            />
            <div className="flex justify-between mt-4 text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] px-1 overflow-hidden">
              <span>5 MIN</span>
              <span>30 MIN</span>
            </div>
          </div>
        </div>
      </div>

      {/* Preferences Checklist */}
      <div className="space-y-4 mb-10">
        <CheckToggle 
          icon={Waves} 
          label="Vibrate Device" 
          desc="Haptic feedback on arrival"
          active={settings.vibrate}
          onClick={() => setSettings({...settings, vibrate: !settings.vibrate})}
          color="teal"
        />
        <CheckToggle 
          icon={Volume2} 
          label="Loud Alarm" 
          desc="Repeat until dismissed"
          active={true}
          onClick={() => {}}
          color="purple"
        />
        <CheckToggle 
          icon={ShieldHalf} 
          label="Battery Optimization" 
          desc="Enable smart GPS tracking"
          active={true}
          onClick={() => {}}
          color="amber"
          disabled
        />
      </div>

      {/* Done Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => navigate(-1)}
        className="mt-auto w-full py-5 bg-gradient-to-r from-brand-600 to-indigo-600 text-white font-extrabold rounded-3xl shadow-2xl shadow-brand-500/30 flex items-center justify-center space-x-3 tracking-[0.2em] uppercase text-sm"
      >
        <Check size={18} />
        <span>SAVE PREFERENCES</span>
      </motion.button>
    </div>
  );
};

const CheckToggle = ({ icon: Icon, label, desc, active, onClick, color, disabled }) => {
  const colors = {
    teal: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20'
  };

  return (
    <label className={`flex items-center justify-between p-5 glass-darker rounded-3xl cursor-pointer group hover:bg-white/5 transition-all ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
      <div className="flex items-center space-x-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${colors[color]} group-hover:scale-110`}>
          <Icon size={24} />
        </div>
        <div>
          <h4 className="font-black text-slate-100 text-lg leading-none mb-1">{label}</h4>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{desc}</p>
        </div>
      </div>
      <button 
        onClick={onClick}
        disabled={disabled}
        className={`w-14 h-8 rounded-full flex items-center px-1 transition-all ${active ? 'bg-brand-500' : 'bg-slate-800 border border-white/5'}`}
      >
        <motion.div 
          animate={{ x: active ? 24 : 0 }}
          className={`w-6 h-6 rounded-full transition-shadow ${active ? 'bg-white shadow-xl shadow-brand-950/50' : 'bg-slate-600'}`}
        />
      </button>
    </label>
  );
};

export default SettingsPage;
