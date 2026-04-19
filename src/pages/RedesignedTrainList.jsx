import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, X, Check, Bell } from 'lucide-react';
import { motion as m, AnimatePresence } from 'framer-motion';

export default function RedesignedTrainList() {
  const navigate = useNavigate();
  const [trains, setTrains] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [boardingStation, setBoardingStation] = useState(null);
  const [selectedTrain, setSelectedTrain] = useState(null);
  
  useEffect(() => {
    const st = localStorage.getItem('boardingStation');
    if (st) setBoardingStation(JSON.parse(st));
    else { navigate('/train'); return; }

    fetch('/data/trainSchedule.json').then(r => r.json()).then(setTrains).catch(console.error);
  }, [navigate]);

  const handleSetAlarm = (train) => {
    setSelectedTrain(train);
  };

  const filtered = trains.filter(t => {
    const matchSearch = t.trainName.toLowerCase().includes(search.toLowerCase()) || t.trainNumber.includes(search);
    const matchType = filter === 'All' ? true : t.trainName.toLowerCase().includes(filter.toLowerCase());
    return matchSearch && matchType;
  });

  return (
    <div className="h-screen flex flex-col bg-[#0A0F1E] font-sans">
      {/* Header Area */}
      <div className="pt-16 pb-4 px-6 bg-[#0A0F1E] z-10 sticky top-0">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => navigate('/train')} className="w-10 h-10 flex items-center justify-center rounded-full bg-[#1C2537] text-white active:scale-95 transition-transform">
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-[#F9FAFB] font-bold text-lg">{boardingStation?.name || 'Station'}</h2>
          <span className="text-[#9CA3AF] text-xs font-bold bg-[#1C2537] px-3 py-1.5 rounded-full">{filtered.length} trains</span>
        </div>

        <div className="relative mb-4">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
          <input 
            type="text" 
            placeholder="Search trains..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-[#1C2537] text-white pl-11 pr-10 h-12 rounded-xl text-sm border border-white/5 outline-none focus:border-[#3B82F6]/50 focus:shadow-[0_0_20px_rgba(59,130,246,0.1)] transition-all"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-white">
              <X size={16} />
            </button>
          )}
        </div>

        <div className="flex space-x-2 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
          {['All', 'Express', 'Mail', 'Passenger'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
                filter === f ? 'bg-[#3B82F6] text-white' : 'bg-[#1C2537] text-[#9CA3AF] border border-white/5'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Train List */}
      <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-4">
        <m.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.08 } } }}>
          {filtered.map(t => (
            <m.div
              key={t.trainNumber}
              variants={{ hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } }}
              className="bg-[#1C2537] rounded-2xl p-5 border border-white/5 mb-4"
            >
              <div className="flex justify-between items-start mb-5">
                <div className="flex items-center space-x-3">
                  <span className="bg-[#3B82F6]/10 text-[#3B82F6] px-2.5 py-1 rounded-lg text-xs font-bold tracking-wide">
                    {t.trainNumber}
                  </span>
                  <h3 className="text-[#F9FAFB] font-bold text-lg tracking-tight">{t.trainName}</h3>
                </div>
                <div className="text-right">
                  <div className="text-[#F9FAFB] font-bold">{t.stops[0]?.arrival}</div>
                  <div className="text-[#4B5563] text-[10px] uppercase tracking-wide font-bold">Departs</div>
                </div>
              </div>

              {/* Route Visualization */}
              <div className="flex items-center justify-between px-2 mb-6 relative">
                <div className="absolute left-4 right-4 top-1.5 h-[2px] bg-[#4B5563]" />
                <div className="flex flex-col items-center relative z-10 w-24">
                  <div className="w-3.5 h-3.5 rounded-full bg-[#10B981] border-[3px] border-[#1C2537]" />
                  <span className="text-xs text-[#9CA3AF] mt-2 text-center leading-tight">{t.stops[0]?.name}</span>
                </div>
                <div className="flex flex-col items-center relative z-10 w-24">
                  <div className="w-3.5 h-3.5 rounded-full bg-[#EF4444] border-[3px] border-[#1C2537]" />
                  <span className="text-xs text-[#9CA3AF] mt-2 text-center leading-tight">{t.stops[t.stops.length-1]?.name}</span>
                </div>
              </div>

              <button
                onClick={() => handleSetAlarm(t)}
                className="w-full bg-[#3B82F6] hover:bg-blue-500 active:scale-95 text-white h-12 rounded-xl font-bold transition-all shadow-[0_4px_14px_rgba(59,130,246,0.2)]"
              >
                Set Alarm
              </button>
            </m.div>
          ))}
        </m.div>
      </div>

      {/* Bottom Sheet */}
      <AnimatePresence>
        {selectedTrain && (
          <StopPickerSheet train={selectedTrain} onClose={() => setSelectedTrain(null)} boardingStation={boardingStation} />
        )}
      </AnimatePresence>
    </div>
  );
}

function StopPickerSheet({ train, onClose, boardingStation }) {
  const navigate = useNavigate();
  const [selectedDest, setSelectedDest] = useState(null);

  const startIdx = Math.max(1, train.stops.findIndex(s => boardingStation?.name && s.name.includes(boardingStation.name)) + 1);
  const availableStops = train.stops.slice(startIdx);

  const confirm = () => {
    if (!selectedDest) return;
    localStorage.setItem("destinationName", selectedDest.name);
    localStorage.setItem("destinationLat", selectedDest.lat.toString());
    localStorage.setItem("destinationLng", selectedDest.lng.toString());
    localStorage.setItem("trainName", train.trainName);
    localStorage.setItem("trainNumber", train.trainNumber);
    localStorage.setItem("allStops", JSON.stringify(train.stops));
    localStorage.setItem("alarmTriggered", "false");
    navigate('/tracking');
  };

  return (
    <>
      <m.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-[#0A0F1E]/80 backdrop-blur-sm z-[200]"
      />
      <m.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 h-[75vh] bg-[#111827] rounded-t-3xl z-[250] flex flex-col shadow-[0_-8px_40px_rgba(0,0,0,0.6)]"
      >
        <div className="px-6 pt-5 pb-4 border-b border-white/5 flex justify-between items-start bg-[#111827] rounded-t-3xl">
          <div>
            <span className="inline-block bg-[#3B82F6]/10 text-[#3B82F6] px-2 py-0.5 rounded-lg text-[10px] font-bold tracking-wide mb-1 flex-shrink-0 w-max">{train.trainNumber}</span>
            <h3 className="text-white font-bold text-xl tracking-tight leading-none">{train.trainName}</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-[#1C2537] flex items-center justify-center text-[#9CA3AF]">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 relative">
          <div className="absolute left-[35px] top-6 bottom-6 w-0.5 bg-[#1C2537] z-0" />
          
          <div className="space-y-1 relative z-10">
            {availableStops.map((st, i) => {
              const isSelected = selectedDest?.name === st.name;
              return (
                <button
                  key={i}
                  onClick={() => setSelectedDest(st)}
                  className={`w-full flex items-center p-3 rounded-2xl transition-all border ${
                    isSelected 
                      ? 'bg-[#3B82F6]/15 border-[#3B82F6] border-l-4' 
                      : 'bg-transparent border-transparent hover:bg-[#1C2537]'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 shrink-0 mr-4 transition-colors ${
                    isSelected ? 'border-[#3B82F6] bg-[#3B82F6]' : 'border-[#4B5563] bg-[#111827]'
                  }`}>
                    {isSelected ? <Check size={12} className="text-white font-bold" /> : <div className="w-1.5 h-1.5 rounded-full bg-[#4B5563]" />}
                  </div>
                  <div className="text-left flex-1">
                    <h4 className={`font-bold text-base tracking-tight ${isSelected ? 'text-[#60A5FA]' : 'text-[#F9FAFB]'}`}>{st.name}</h4>
                    <p className={`text-xs mt-0.5 ${isSelected ? 'text-[#3B82F6]' : 'text-[#9CA3AF]'}`}>{st.arrival}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#4B5563]">{st.distanceFromOriginKm} km</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-6 bg-[#111827] border-t border-white/5">
          <button
            disabled={!selectedDest}
            onClick={confirm}
            className={`w-full h-14 rounded-xl font-bold flex items-center justify-center transition-all ${
              selectedDest 
                ? 'bg-[#3B82F6] text-white hover:bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.3)] active:scale-95' 
                : 'bg-[#1C2537] text-[#4B5563] cursor-not-allowed'
            }`}
          >
            {selectedDest && <Bell size={18} className="mr-2" />}
            {selectedDest ? `Set Alarm for ${selectedDest.name}` : 'Select destination stop'}
          </button>
        </div>
      </m.div>
    </>
  );
}
