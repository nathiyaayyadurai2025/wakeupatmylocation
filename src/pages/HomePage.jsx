import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion as m } from 'framer-motion';
import { Train, Bus, Navigation, ArrowRight, ShieldCheck, Zap, Globe, Gauge } from 'lucide-react';
import { AlarmContext } from '../App';

const HomePage = () => {
  const navigate = useNavigate();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const { setTravelMode, t } = useContext(AlarmContext);

  const handleSelectMode = (mode) => {
    setTravelMode(mode);
    if (mode === 'train') navigate('/train-selection');
    else if (mode === 'bus') navigate('/bus-selection');
    else if (mode === 'general') navigate('/general-selection');
    else navigate('/stop-selection');
  };

  if (!mounted) {
    return (
      <div className="flex flex-col h-screen bg-slate-950 items-center justify-center p-8 text-center">
         <div className="w-20 h-20 rounded-3xl bg-brand-cyan/20 flex items-center justify-center text-brand-cyan animate-pulse mb-8 shadow-2xl shadow-cyan-900/40">
            <Zap size={40} />
         </div>
         <h1 className="text-3xl font-light text-gradient tracking-tighter mb-4 leading-none">Starting Mission Dashboard</h1>
         <p className="text-slate-500 font-mono text-[10px] uppercase tracking-[0.3em]">Calibrating Interfaces... v2.9</p>
      </div>
    );
  }

  return (
    <div className="page-container relative overflow-hidden pt-12">
      {/* Decorative Blobs */}
      <div className="absolute -top-24 -left-20 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute top-1/2 -right-32 w-80 h-80 bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none" />

      <header className="text-center mb-12 relative z-10">
        <m.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="inline-flex p-4 rounded-3xl bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 border border-white/10 mb-8 shadow-2xl relative"
        >
          <div className="scan-line rounded-3xl opacity-30" />
          <Zap size={40} className="text-brand-cyan fill-current animate-pulse" />
        </m.div>

        <m.h1 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-5xl font-light mb-4 tracking-tighter text-gradient"
        >
          {t.title}
        </m.h1>

        <m.p 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-[#cbd5e1] text-base max-w-[280px] mx-auto font-normal leading-tight opacity-90"
        >
          {t.tagline}
        </m.p>
      </header>

      <section className="space-y-6 relative z-10">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-[10px] font-medium uppercase tracking-[0.3em] text-[#94a3b8]">
            {t.selectMode}
          </h3>
          <div className="h-[1px] flex-1 bg-gradient-to-r from-cyan-400/20 to-transparent ml-4" />
        </div>
        
        <div className="grid grid-cols-1 gap-4">
          <ModeCard 
            icon={Train} 
            label={t.train} 
            desc="Indian Railways & Express"
            accent="from-cyan-600/10 to-transparent"
            iconColor="text-cyan-400"
            onClick={() => handleSelectMode('train')} 
          />
          <ModeCard 
            icon={Bus} 
            label={t.bus} 
            desc="MTC & Private Route Tracking"
            accent="from-teal-600/10 to-transparent"
            iconColor="text-teal-400"
            onClick={() => handleSelectMode('bus')} 
          />
          <ModeCard 
            icon={Navigation} 
            label={t.general} 
            desc="Any destination with GPS"
            accent="from-indigo-600/10 to-transparent"
            iconColor="text-indigo-400"
            onClick={() => handleSelectMode('general')} 
          />
        </div>
      </section>

      <m.footer 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-16 flex flex-col items-center space-y-4"
      >
        <div className="flex items-center space-x-6 px-6 py-4 glass-darker rounded-2xl border border-white/5 w-full justify-around">
           <StatusItem icon={Globe} label="Global" />
           <div className="h-8 w-[1px] bg-white/5" />
           <StatusItem icon={Gauge} label="Lat: 0.2s" />
           <div className="h-8 w-[1px] bg-white/5" />
           <StatusItem icon={ShieldCheck} label="Secured" />
        </div>
        <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest text-center leading-loose">
          Version 2.4.0 — Optimized for Offline Sync
        </p>
      </m.footer>
    </div>
  );
};

const ModeCard = ({ icon: Icon, label, desc, accent, iconColor, onClick }) => (
  <m.button
    whileHover={{ x: 8 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className="w-full glass-interactive p-6 rounded-[2rem] flex items-center text-left group overflow-hidden relative"
  >
    <div className={`absolute inset-0 bg-gradient-to-br ${accent} opacity-0 group-hover:opacity-100 transition-opacity`} />
    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mr-6 relative z-10 transition-transform group-hover:scale-110 ${iconColor} bg-white/5 border border-white/5`}>
      <Icon size={32} />
    </div>
    <div className="flex-1 relative z-10">
      <h4 className="text-xl font-light tracking-tight text-white mb-0.5">{label}</h4>
      <p className="text-[10px] text-[#94a3b8] font-medium uppercase tracking-widest opacity-60 group-hover:opacity-100 transition-opacity">{desc}</p>
    </div>
    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-500 group-hover:text-white group-hover:bg-brand-indigo transition-all relative z-10">
      <ArrowRight size={18} />
    </div>
  </m.button>
);

const StatusItem = ({ icon: Icon, label }) => (
  <div className="flex items-center space-x-2">
    <Icon size={14} className="text-[#64748b]" />
    <span className="text-[10px] font-medium uppercase text-[#94a3b8] tracking-wider font-mono">{label}</span>
  </div>
);

export default HomePage;
