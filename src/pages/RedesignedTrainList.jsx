import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, X, Bell, Check, Train, Clock, MapPin, ArrowRight } from 'lucide-react';
import { motion as m, AnimatePresence } from 'framer-motion';
import { useCountry } from '../context/CountryContext';
import { useIndonesiaRail } from '../hooks/useIndonesiaRail';
import { CALCULATE_DISTANCE } from '../constants';

export default function RedesignedTrainList() {
  const navigate = useNavigate();
  const { isIndonesia, countryFlag, countryName } = useCountry();
  const [trains, setTrains] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [boardingStation, setBoardingStation] = useState(null);
  const [selectedTrain, setSelectedTrain] = useState(null);

  const { getRoutesForStation } = useIndonesiaRail();

  useEffect(() => {
    const st = localStorage.getItem('boardingStation');
    if (!st) { navigate('/train'); return; }
    const parsedStation = JSON.parse(st);
    setBoardingStation(parsedStation);

    if (isIndonesia) {
      const stIdentifier = parsedStation.code || parsedStation.id || parsedStation.name;
      const matchedRoutes = getRoutesForStation(stIdentifier);

      const formatted = matchedRoutes.map(r => ({
        trainNumber: r.trainNumber,
        trainName: r.trainName,
        category: r.category,
        stops: r.stops.map(s => ({
          name: s.stationName,
          lat: s.latitude,
          lng: s.longitude,
          arrival: s.arrival,
          distanceFromOriginKm: s.distanceFromOriginKm
        }))
      }));

      setTrains(formatted);
    } else {
      fetch('/data/trainSchedule.json').then(r => r.json()).then(setTrains).catch(console.error);
    }
  }, [navigate, isIndonesia, getRoutesForStation]);

  const filters = isIndonesia ? ['All', 'Antarkota', 'Commuter Line', 'Bandara'] : ['All', 'Express', 'Mail', 'Passenger'];

  const filtered = trains.filter(t => {
    if (boardingStation && t.stops && t.stops.length > 0) {
      const stopsAtBoarding = t.stops.some(stop => {
        const stopName = (stop.name || '').toLowerCase();
        const boardName = (boardingStation.name || '').toLowerCase();
        const clean = (s) => s.replace(/stasiun|station|junction|jn|\s/g, '');
        const nameMatch = clean(stopName).includes(clean(boardName)) || clean(boardName).includes(clean(stopName));
        
        let distMatch = false;
        if (stop.lat && stop.lng && boardingStation.lat && boardingStation.lng) {
          distMatch = CALCULATE_DISTANCE(stop.lat, stop.lng, boardingStation.lat, boardingStation.lng) <= 2.5;
        }
        return nameMatch || distMatch;
      });

      if (!stopsAtBoarding) return false;
    }

    const matchSearch = t.trainName.toLowerCase().includes(search.toLowerCase()) || t.trainNumber.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'All' || (t.category && t.category.toLowerCase() === filter.toLowerCase()) || t.trainName.toLowerCase().includes(filter.toLowerCase());
    return matchSearch && matchFilter;
  });

  return (
    <div className="pt-20 pb-24 min-h-screen bg-slate-50 dark:bg-slate-950 font-sans">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

        {/* Top Header Card */}
        <div className="saas-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <m.button
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate('/train')}
              className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-200"
            >
              <ArrowLeft size={18} />
            </m.button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">Boarding Station</span>
                <span>{countryFlag}</span>
              </div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {boardingStation?.name || 'Station'}
              </h2>
            </div>
          </div>

          <div className="px-4 py-1.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-xs font-bold self-start sm:self-auto">
            {filtered.length} Trains Available
          </div>
        </div>

        {/* Command Palette Train Search Bar */}
        <div className="saas-card p-6 space-y-4">
          <div className="relative flex items-center">
            <Search size={18} className="absolute left-4 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search train by name or number (e.g., CL-4101, Argo Parahyangan)..."
              className="w-full h-12 pl-11 pr-10 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3.5 w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-500"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Filter Chips */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            {filters.map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                  filter === f
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                    : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Train List Cards */}
        <div className="space-y-4">
          {filtered.length === 0 ? (
            <div className="saas-card p-12 text-center text-slate-400">
              <Train size={44} className="mx-auto mb-3 opacity-30" />
              <p className="font-bold">No trains available for {boardingStation?.name || 'this station'}</p>
            </div>
          ) : (
            filtered.map(t => (
              <m.div
                key={t.trainNumber}
                whileHover={{ y: -2 }}
                className="saas-card p-6 space-y-4"
              >
                {/* Top Row Header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-xs font-black">
                      {t.trainNumber}
                    </span>
                    <div>
                      <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">{t.trainName}</h3>
                      {t.category && (
                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-500">
                          {t.category}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-slate-900 dark:text-white font-extrabold text-base">{t.stops[0]?.arrival}</div>
                    <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Departure</div>
                  </div>
                </div>

                {/* Route Visualization */}
                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-100/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{t.stops[0]?.name}</span>
                  </div>

                  <div className="flex items-center gap-2 px-3 text-slate-400 text-xs font-medium">
                    <div className="h-[2px] w-12 bg-slate-300 dark:bg-slate-700" />
                    <span>{t.stops.length} Stops</span>
                    <div className="h-[2px] w-12 bg-slate-300 dark:bg-slate-700" />
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{t.stops[t.stops.length - 1]?.name}</span>
                  </div>
                </div>

                {/* CTA Button */}
                <m.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setSelectedTrain(t)}
                  className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all"
                >
                  <Bell size={16} />
                  <span>Select Destination & Set Alarm</span>
                </m.button>
              </m.div>
            ))
          )}
        </div>
      </div>

      {/* Stop Picker Sheet Component */}
      <AnimatePresence>
        {selectedTrain && (
          <StopPickerSheet
            train={selectedTrain}
            boardingStation={boardingStation}
            onClose={() => setSelectedTrain(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Timeline UI Stop Picker Sheet
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
      <m.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[5000] bg-slate-950/70 backdrop-blur-md"
      />

      <m.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 26, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 z-[5001] max-w-2xl mx-auto bg-white dark:bg-slate-900 rounded-t-[32px] shadow-2xl flex flex-col"
        style={{ height: '75vh' }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-800 rounded-full" />
        </div>

        {/* Sheet Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between">
          <div>
            <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400">
              {train.trainNumber}
            </span>
            <h3 className="font-extrabold text-xl text-slate-900 dark:text-white mt-1">{train.trainName}</h3>
            <p className="text-slate-500 text-xs">Tap a station to set as your alarm destination stop</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500"
          >
            <X size={16} />
          </button>
        </div>

        {/* Timeline UI Station List */}
        <div className="flex-1 overflow-y-auto px-6 py-4 relative space-y-2">
          {stops.map((stop, idx) => {
            const isSelected = selectedDest?.name === stop.name;
            return (
              <m.button
                key={idx}
                whileTap={{ scale: 0.99 }}
                onClick={() => setSelectedDest(stop)}
                className={`w-full flex items-center justify-between p-4 rounded-2xl border text-left transition-all ${
                  isSelected
                    ? 'bg-blue-500/10 border-blue-500 text-blue-600 dark:text-blue-400 shadow-md'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs border ${
                    isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-800 border-slate-300 text-slate-600 dark:text-slate-400'
                  }`}>
                    {isSelected ? <Check size={14} /> : idx + 1}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">{stop.name}</h4>
                    <span className="text-xs text-slate-500">Arrives {stop.arrival}</span>
                  </div>
                </div>

                <span className="text-xs font-extrabold text-slate-400">{stop.distanceFromOriginKm} km</span>
              </m.button>
            );
          })}
        </div>

        {/* Confirm Alarm CTA */}
        <div className="p-6 border-t border-slate-100 dark:border-slate-800">
          <m.button
            whileTap={{ scale: 0.97 }}
            onClick={handleConfirm}
            disabled={!selectedDest}
            className={`w-full h-14 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all ${
              selectedDest
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-500/25'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
            }`}
          >
            <Bell size={18} />
            <span>{selectedDest ? `Arm Alarm for ${selectedDest.name}` : 'Select a Stop Above'}</span>
          </m.button>
        </div>
      </m.div>
    </>
  );
}
