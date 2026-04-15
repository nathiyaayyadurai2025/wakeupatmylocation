import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion as m, AnimatePresence } from 'framer-motion';
import { Check, ArrowLeft, Train, Bus, Zap, Search, Clock, Loader2, MapPin } from 'lucide-react';
import { AlarmContext } from '../App';
import { API_BASE_URL } from '../constants';

const StopSelectionPage = () => {
  const navigate = useNavigate();
  const { 
    selectedTrain, 
    selectedBusRoute, 
    travelMode, 
    selectedStops, 
    setSelectedStops,
    settings,
    t 
  } = useContext(AlarmContext);
  
  const [stops, setStops] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (travelMode === 'train' && selectedTrain) {
      setStops(selectedTrain.stops);
    } else if (travelMode === 'bus' && selectedBusRoute) {
      setStops(selectedBusRoute.stops);
    } else if (travelMode !== 'general') {
      // Direct visit without selection - redirect back to mission selection
      console.warn("Mission Hub Error: No route selected. Returning to base.");
      navigate('/');
    } else {
      setStops([]);
    }
  }, [travelMode, selectedTrain, selectedBusRoute, navigate]);

  const toggleStop = (stop) => {
    const stopId = stop.station || stop.stopName;
    const isSelected = selectedStops.find(s => (s.station || s.stopName) === stopId);
    if (isSelected) {
      setSelectedStops(selectedStops.filter(s => (s.station || s.stopName) !== stopId));
    } else {
      setSelectedStops([...selectedStops, stop]);
    }
  };

  const syncMission = async () => {
    setSyncing(true);
    try {
      await fetch(`${API_BASE_URL}/user/save-alarm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'test-user-123',
          travelMode,
          destinationStops: selectedStops
            .filter(s => s && s.lat && (s.lng || s.lon))
            .map(s => ({
              name: s.station || s.stopName,
              lat: s.lat,
              lng: s.lng || s.lon
            })),
          alarmDistance: settings.distanceThreshold
        })
      });
      navigate('/tracking');
    } catch (err) {
      console.error("Sync error:", err);
      navigate('/tracking');
    } finally {
      setSyncing(false);
    }
  };

  const filteredStops = stops.filter(s => 
    (s.station || s.stopName).toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="page-container relative pt-8 pb-40">
      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-indigo-500/5 to-transparent pointer-events-none" />
      
        <div className="flex items-center space-x-5 mb-4 relative z-10 px-2">
          <m.button 
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(-1)}
            className="w-12 h-12 glass flex items-center justify-center rounded-2xl text-slate-400 hover:text-white transition-colors border border-white/5"
          >
            <ArrowLeft size={22} />
          </m.button>
          <div className="flex-1">
             <h2 className="text-3xl font-black text-gradient leading-none mb-1">{t.selectStops}</h2>
             <div className="flex items-center space-x-3">
               <p className="text-[10px] font-black uppercase text-brand-indigo tracking-[0.2em] opacity-80">
                  {travelMode === 'train' ? selectedTrain?.trainName : selectedBusRoute?.routeName}
               </p>
               {travelMode === 'train' && selectedTrain?.liveStatus && selectedTrain.liveStatus.delayMinutes > 0 && (
                 <div className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-red-500/10 text-red-400 border border-red-500/20">
                   {selectedTrain.liveStatus.statusMessage}
                 </div>
               )}
             </div>
          </div>
        </div>

        {travelMode === 'train' && selectedTrain?.liveStatus && selectedTrain.liveStatus.delayMinutes > 0 && (
          <div className="px-3 mb-6 relative z-10">
            <div className="glass-darker p-3 rounded-2xl border border-white/5 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Live NTES Feedback: Delayed</span>
              </div>
              <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Update: {selectedTrain.liveStatus.lastUpdated}</span>
            </div>
          </div>
        )}

      <div className="relative mb-8 group px-2 relative z-10">
        <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none text-slate-500 group-focus-within:text-brand-indigo transition-colors z-20">
          <Search size={20} />
        </div>
        <input
          type="text"
          placeholder="Search stops..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-14 pr-6 py-5 glass-darker rounded-[1.5rem] border border-white/5 focus:border-brand-indigo/50 outline-none transition-all placeholder:text-slate-700 font-bold text-slate-200"
        />
      </div>

      <div className="space-y-4 relative z-10 px-2 pb-12">
        {filteredStops.map((stop, idx) => {
          const name = stop.station || stop.stopName;
          const isSelected = selectedStops.find(s => (s.station || s.stopName) === name);
          
          return (
            <m.button
              key={name}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: idx * 0.03 }}
              onClick={() => toggleStop(stop)}
              className={`w-full text-left p-5 rounded-[2rem] border transition-all flex items-center group relative overflow-hidden ${
                isSelected 
                  ? 'bg-brand-indigo/15 border-brand-indigo/50 shadow-2xl shadow-brand-indigo/10' 
                  : 'glass-darker border-white/5 opacity-80 grayscale-[0.3]'
              }`}
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mr-5 transition-all ${
                isSelected ? 'bg-brand-indigo text-white shadow-lg' : 'bg-slate-900 text-slate-500'
              }`}>
                {isSelected ? <Check size={24} strokeWidth={3} /> : (travelMode === 'train' ? <Train size={20} /> : <Bus size={20} />)}
              </div>
              <div className="flex-1 overflow-hidden">
                <h4 className={`text-lg font-black transition-colors mb-1 ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                  {name}
                </h4>
                {travelMode === 'train' ? (
                  <div className="flex items-center space-x-4">
                     <div className="flex items-center space-x-1.5 font-bold text-[10px] text-slate-500 uppercase tracking-widest">
                        <Clock size={10} className="text-brand-indigo" />
                        <span className={stop.expectedArrival !== stop.arrival ? 'line-through opacity-40' : ''}>{stop.arrival}</span>
                        {stop.expectedArrival !== stop.arrival && <span className="text-red-400 font-black">{stop.expectedArrival}</span>}
                        {stop.expectedDate && (
                           <span className="ml-1 px-1.5 py-0.5 bg-brand-indigo/20 text-brand-indigo rounded text-[8px] font-black border border-brand-indigo/10">
                             {stop.expectedDate}
                           </span>
                        )}
                     </div>
                     <div className="w-1 h-1 rounded-full bg-slate-800" />
                     <div className="flex items-center space-x-1.5 font-bold text-[10px] text-slate-500 uppercase tracking-widest">
                        <MapPin size={10} className="text-slate-600" />
                        <span>{stop.departure}</span>
                     </div>
                  </div>
                ) : (
                  <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest">GPS Tracked Hub</div>
                )}
              </div>
              {isSelected && (
                <div className="w-1.5 h-1.5 rounded-full bg-brand-indigo absolute right-6 animate-pulse" />
              )}
            </m.button>
          );
        })}
      </div>

      <AnimatePresence>
        {selectedStops.length > 0 && (
          <m.div 
            initial={{ y: 120, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 120, opacity: 0 }}
            className="fixed bottom-28 left-6 right-6 z-50 pointer-events-none"
          >
            <button 
              disabled={syncing}
              onClick={syncMission}
              className="w-full py-6 bg-gradient-to-r from-brand-indigo to-brand-cyan text-white font-black rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(99,102,241,0.5)] flex items-center justify-center space-x-4 tracking-[0.25em] uppercase text-sm pointer-events-auto active:scale-95 transition-all disabled:opacity-50 relative overflow-hidden group"
            >
              <div className="scan-line rounded-3xl opacity-20" />
              {syncing ? <Loader2 size={24} className="animate-spin" /> : <Zap size={24} fill="currentColor" />}
              <span>{syncing ? 'Connecting...' : `${t.activate} (${selectedStops.length})`}</span>
            </button>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StopSelectionPage;
