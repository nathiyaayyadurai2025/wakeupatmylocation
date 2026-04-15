import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion as m, AnimatePresence } from 'framer-motion';
import { Search, Train, ArrowLeft, Loader2, Gauge, MapPin, ArrowRight } from 'lucide-react';
import { AlarmContext } from '../App';
import { TRAIN_DATA, API_BASE_URL } from '../constants';

const TrainSelectionPage = () => {
  const navigate = useNavigate();
  const { setSelectedTrain, t } = useContext(AlarmContext);
  const [searchQuery, setSearchQuery] = useState('');
  const [trains, setTrains] = useState(TRAIN_DATA);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchAllTrains = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/train`);
        if (res.ok) {
          const data = await res.json();
          setTrains(data);
        }
      } catch (err) {
        console.error("Fetch all trains failed", err);
      } finally {
        setLoading(false);
      }
    };

    const searchTrain = async () => {
      if (searchQuery.length < 1) {
        fetchAllTrains();
        return;
      }

      if (/^\d+$/.test(searchQuery)) {
        setLoading(true);
        try {
          const res = await fetch(`${API_BASE_URL}/train/${searchQuery}`);
          if (res.ok) {
            const data = await res.json();
            setTrains([data]);
          } else {
             // Try name search on backend even if number fails
             setTrains([]); 
          }
        } catch (err) {
          console.error("API error:", err);
        } finally {
          setLoading(false);
        }
      } else {
        // Local filtering for quick fuzzy search on the fetched list
        setTrains(prev => prev.filter(t => 
          t.trainName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.trainNumber.includes(searchQuery)
        ));
      }
    };

    const timer = setTimeout(searchTrain, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelect = (train) => {
    setSelectedTrain(train);
    navigate('/stop-selection');
  };

  return (
    <div className="page-container relative pt-8 pb-32">
      <div className="absolute top-10 right-0 w-48 h-48 bg-indigo-500/5 blur-[80px] pointer-events-none" />
      
      <div className="flex items-center space-x-5 mb-10 relative z-10 px-2">
        <m.button 
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate('/')}
          className="w-12 h-12 glass flex items-center justify-center rounded-2xl text-slate-400 hover:text-white transition-colors border border-white/5"
        >
          <ArrowLeft size={22} />
        </m.button>
        <div>
           <h2 className="text-3xl font-black text-gradient leading-none mb-1">{t.train}</h2>
           <p className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">Select Your Route</p>
        </div>
      </div>

      <div className="relative mb-10 group px-2 relative z-10">
        <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none text-brand-indigo group-focus-within:text-brand-cyan transition-colors z-20">
          {loading ? <Loader2 size={20} className="animate-spin" /> : <Search size={20} />}
        </div>
        <input
          type="text"
          placeholder={t.searchTrain}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-14 pr-6 py-5 glass-darker rounded-[1.5rem] border border-white/5 focus:border-brand-indigo/50 focus:ring-4 focus:ring-brand-indigo/10 outline-none transition-all placeholder:text-slate-600 font-bold text-slate-200"
        />
      </div>

      <div className="space-y-6 relative z-10 px-2">
        <div className="flex items-center justify-between opacity-60">
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 font-mono flex items-center">
            <Gauge size={12} className="mr-2" />
            Live Results ({trains.length})
          </h3>
          <div className="h-[1px] flex-1 bg-white/5 ml-4" />
        </div>
        
        <div className="grid grid-cols-1 gap-4">
          <AnimatePresence>
            {trains.map((train, idx) => (
              <m.button
                key={train.trainNumber}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => handleSelect(train)}
                className="w-full text-left glass-interactive p-6 rounded-[2rem] border border-white/5 group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-20 transition-opacity">
                   <Train size={80} strokeWidth={1} />
                </div>

                <div className="flex justify-between items-start mb-6 border-b border-white/5 pb-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-brand-indigo group-hover:bg-brand-indigo group-hover:text-white transition-all shadow-xl">
                      <Train size={24} />
                    </div>
                    <div>
                      <h4 className="text-xl font-black text-white leading-none mb-1.5">{train.trainNumber}</h4>
                      <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{train.trainName}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-black bg-brand-indigo/10 text-brand-indigo px-3 py-1 rounded-full border border-brand-indigo/20 uppercase">
                      {train.stops.length} Stops
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-slate-400 group-hover:text-slate-200 transition-colors">
                  <div className="flex items-center space-x-3 max-w-[40%]">
                    <MapPin size={12} className="text-slate-600 flex-shrink-0" />
                    <span className="text-xs font-bold truncate uppercase tracking-tighter">{train.from}</span>
                  </div>
                  <m.div 
                    animate={{ x: [0, 5, 0] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="text-slate-700 mx-2"
                  >
                    <ArrowRight size={14} />
                  </m.div>
                  <div className="flex items-center space-x-3 max-w-[40%] text-right justify-end">
                    <span className="text-xs font-bold truncate uppercase tracking-tighter">{train.to}</span>
                    <MapPin size={12} className="text-brand-indigo flex-shrink-0" />
                  </div>
                </div>
              </m.button>
            ))}
          </AnimatePresence>
          
          {trains.length === 0 && (
            <m.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }}
              className="text-center py-24 opacity-30"
            >
              <Search size={64} className="mx-auto mb-6 text-slate-500" strokeWidth={1} />
              <p className="text-sm font-black uppercase tracking-widest">No matching routes</p>
            </m.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrainSelectionPage;
