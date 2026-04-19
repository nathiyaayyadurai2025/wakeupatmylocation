import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, X, Bell, Check } from 'lucide-react';
import { motion as m, AnimatePresence } from 'framer-motion';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
};

export default function RedesignedTrainList() {
  const navigate = useNavigate();
  const [trains, setTrains] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [boardingStation, setBoardingStation] = useState(null);
  const [selectedTrain, setSelectedTrain] = useState(null);

  useEffect(() => {
    const st = localStorage.getItem('boardingStation');
    if (!st) { navigate('/train'); return; }
    setBoardingStation(JSON.parse(st));
    fetch('/data/trainSchedule.json').then(r => r.json()).then(setTrains).catch(console.error);
  }, [navigate]);

  const filters = ['All', 'Express', 'Mail', 'Passenger'];

  const filtered = trains.filter(t => {
    const matchSearch = t.trainName.toLowerCase().includes(search.toLowerCase()) || t.trainNumber.includes(search);
    const matchFilter = filter === 'All' || t.trainName.toLowerCase().includes(filter.toLowerCase());
    return matchSearch && matchFilter;
  });

  return (
    <m.div variants={pageVariants} initial="initial" animate="animate"
      className="min-h-screen bg-[#0A0F1E] flex flex-col" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ── HEADER ── */}
      <div className="bg-[#0A0F1E] px-5 pt-16 pb-4 sticky top-0 z-20" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <div className="flex items-center justify-between mb-5">
          <m.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate('/train')}
            className="w-10 h-10 rounded-full bg-[#1C2537] border border-white/5 flex items-center justify-center text-[#F9FAFB] active:scale-90 transition-transform"
          >
            <ArrowLeft size={18} />
          </m.button>
          <h2 className="text-[#F9FAFB] font-bold text-lg tracking-tight">{boardingStation?.name || 'Station'}</h2>
          <div className="bg-[#1C2537] border border-white/5 px-3 py-1 rounded-full">
            <span className="text-[#9CA3AF] text-xs font-bold">{filtered.length} trains</span>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF] pointer-events-none" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search trains..."
            className="w-full h-12 bg-[#1C2537] text-[#F9FAFB] pl-11 pr-10 rounded-xl text-sm outline-none transition-all"
            style={{ border: `1px solid ${search ? 'rgba(59,130,246,0.4)' : 'rgba(255,255,255,0.08)'}` }}
          />
          <AnimatePresence>
            {search && (
              <m.button
                initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.7 }}
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-[#374151] rounded-full flex items-center justify-center"
              >
                <X size={12} className="text-[#9CA3AF]" />
              </m.button>
            )}
          </AnimatePresence>
        </div>

        {/* Filter Chips */}
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {filters.map(f => (
            <m.button
              key={f} whileTap={{ scale: 0.95 }}
              onClick={() => setFilter(f)}
              className="px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all"
              style={{
                background: filter === f ? '#3B82F6' : 'rgba(28,37,55,1)',
                color: filter === f ? 'white' : '#9CA3AF',
                border: `1px solid ${filter === f ? 'rgba(59,130,246,0.4)' : 'rgba(255,255,255,0.06)'}`,
              }}
            >
              {f}
            </m.button>
          ))}
        </div>
      </div>

      {/* ── TRAIN CARDS ── */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3" style={{ scrollbarWidth: 'none' }}>
        {filtered.length === 0 && (
          <div className="text-center py-16 text-[#4B5563]">
            <div className="text-4xl mb-3">🚆</div>
            <p className="font-medium">No trains found at this station</p>
          </div>
        )}

        <m.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.07 } } }}>
          {filtered.map(t => (
            <m.div
              key={t.trainNumber}
              variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}
              className="bg-[#1C2537] rounded-2xl p-5 mb-3 shadow-[0_4px_24px_rgba(0,0,0,0.35)]"
              style={{ border: '1px solid rgba(255,255,255,0.05)' }}
            >
              {/* Top row */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2.5 flex-1 min-w-0 mr-3">
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-lg flex-shrink-0"
                    style={{ background: 'rgba(59,130,246,0.12)', color: '#93C5FD', border: '1px solid rgba(59,130,246,0.2)' }}
                  >
                    {t.trainNumber}
                  </span>
                  <h3 className="text-[#F9FAFB] font-bold text-[15px] tracking-tight truncate">{t.trainName}</h3>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-[#F9FAFB] font-bold text-[15px]">{t.stops[0]?.arrival}</div>
                  <div className="text-[#4B5563] text-[9px] font-bold uppercase tracking-wider">Dep.</div>
                </div>
              </div>

              {/* Route viz */}
              <div className="flex items-center px-1 mb-5">
                <div className="flex flex-col items-start mr-3 max-w-[80px]">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#10B981] mb-1.5" />
                  <span className="text-[#9CA3AF] text-[10px] leading-tight">{t.stops[0]?.name}</span>
                </div>
                <div className="flex-1 h-[2px] mx-1 relative">
                  <div className="absolute inset-0 bg-[#374151] rounded-full" />
                  <div className="absolute left-0 top-0 h-full w-1/3 bg-[#3B82F6] rounded-full" />
                  {/* train dot */}
                  <div className="absolute top-1/2 left-1/3 -translate-y-1/2 -translate-x-1/2 w-2 h-2 bg-[#3B82F6] rounded-full shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
                </div>
                <div className="flex flex-col items-end ml-3 max-w-[80px]">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#EF4444] mb-1.5" />
                  <span className="text-[#9CA3AF] text-[10px] leading-tight text-right">{t.stops[t.stops.length - 1]?.name}</span>
                </div>
              </div>

              {/* CTA button */}
              <m.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setSelectedTrain(t)}
                className="w-full h-11 bg-[#3B82F6] hover:bg-blue-400 text-white font-semibold rounded-xl text-sm transition-colors shadow-[0_4px_14px_rgba(59,130,246,0.25)] active:scale-95"
              >
                Set Alarm
              </m.button>
            </m.div>
          ))}
        </m.div>
      </div>

      {/* ── STOP PICKER BOTTOM SHEET ── */}
      <AnimatePresence>
        {selectedTrain && (
          <StopPickerSheet
            train={selectedTrain}
            boardingStation={boardingStation}
            onClose={() => setSelectedTrain(null)}
          />
        )}
      </AnimatePresence>
    </m.div>
  );
}

// ── Stop Picker Sheet Component ────────────────────────────────────────────────
function StopPickerSheet({ train, boardingStation, onClose }) {
  const navigate = useNavigate();
  const [selectedDest, setSelectedDest] = useState(null);

  const boardIdx = Math.max(0, train.stops.findIndex(s =>
    boardingStation?.name && s.name.toLowerCase().includes(boardingStation.name.toLowerCase())
  ));
  const stops = train.stops.slice(boardIdx + 1);

  const handleConfirm = () => {
    if (!selectedDest) return;
    localStorage.setItem('destinationName', selectedDest.name);
    localStorage.setItem('destinationLat', selectedDest.lat.toString());
    localStorage.setItem('destinationLng', selectedDest.lng.toString());
    localStorage.setItem('trainName', train.trainName);
    localStorage.setItem('trainNumber', train.trainNumber);
    localStorage.setItem('allStops', JSON.stringify(train.stops));
    localStorage.setItem('alarmTriggered', 'false');
    navigate('/tracking');
  };

  return (
    <>
      {/* Backdrop */}
      <m.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-40"
        style={{ background: 'rgba(10,15,30,0.8)', backdropFilter: 'blur(4px)' }}
      />

      {/* Sheet */}
      <m.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 26, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 z-50 flex flex-col bg-[#111827] rounded-t-3xl shadow-[0_-8px_40px_rgba(0,0,0,0.65)]"
        style={{ height: '75vh', fontFamily: "'Inter', sans-serif" }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 bg-[#374151] rounded-full" />
        </div>

        {/* Sheet Header */}
        <div className="px-5 py-4 flex items-start justify-between flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg"
                style={{ background: 'rgba(59,130,246,0.12)', color: '#93C5FD', border: '1px solid rgba(59,130,246,0.2)' }}>
                {train.trainNumber}
              </span>
            </div>
            <h3 className="text-[#F9FAFB] font-bold text-[18px] tracking-tight">{train.trainName}</h3>
            <p className="text-[#9CA3AF] text-xs mt-0.5">Select your destination stop</p>
          </div>
          <m.button
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-[#374151] flex items-center justify-center text-[#9CA3AF] hover:text-white transition-colors"
          >
            <X size={16} />
          </m.button>
        </div>

        {/* Stop list */}
        <div className="flex-1 overflow-y-auto px-5 py-3 relative" style={{ scrollbarWidth: 'none' }}>
          {/* Vertical connector line */}
          <div className="absolute left-[38px] top-3 bottom-3 w-px bg-[#1C2537]" />

          {stops.map((stop, idx) => {
            const isSelected = selectedDest?.name === stop.name;
            return (
              <m.button
                key={idx}
                whileTap={{ scale: 0.99 }}
                onClick={() => setSelectedDest(stop)}
                className="w-full flex items-start gap-4 py-3.5 relative text-left rounded-xl px-2 transition-all"
                style={{
                  background: isSelected ? 'rgba(59,130,246,0.1)' : 'transparent',
                  borderLeft: isSelected ? '3px solid #3B82F6' : '3px solid transparent',
                }}
              >
                {/* Circle */}
                <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5 border-2 transition-all z-10 ${
                  isSelected ? 'bg-[#3B82F6] border-[#3B82F6]' : 'bg-[#111827] border-[#4B5563]'
                }`}>
                  {isSelected
                    ? <Check size={12} className="text-white" />
                    : <span className="text-[#9CA3AF] text-[9px] font-black">{idx + 1}</span>
                  }
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <h4 className={`font-bold text-[14px] tracking-tight ${isSelected ? 'text-[#60A5FA]' : 'text-[#F9FAFB]'}`}>
                    {stop.name}
                  </h4>
                  <p className={`text-xs mt-0.5 ${isSelected ? 'text-[#3B82F6]' : 'text-[#9CA3AF]'}`}>
                    Arrives {stop.arrival}
                  </p>
                </div>

                {/* Distance */}
                <span className="text-[#4B5563] text-[11px] font-bold mt-1 flex-shrink-0">
                  {stop.distanceFromOriginKm} km
                </span>
              </m.button>
            );
          })}
        </div>

        {/* Confirm button */}
        <div className="p-5 flex-shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <m.button
            whileTap={{ scale: 0.97 }}
            onClick={handleConfirm}
            disabled={!selectedDest}
            className="w-full h-14 rounded-xl font-bold text-[15px] flex items-center justify-center gap-2.5 transition-all"
            style={{
              background: selectedDest ? '#3B82F6' : '#1C2537',
              color: selectedDest ? 'white' : '#4B5563',
              boxShadow: selectedDest ? '0 0 20px rgba(59,130,246,0.3)' : 'none',
            }}
          >
            <Bell size={18} style={{ opacity: selectedDest ? 1 : 0.4 }} />
            {selectedDest ? `Set Alarm for ${selectedDest.name}` : 'Select a stop'}
          </m.button>
        </div>
      </m.div>
    </>
  );
}
