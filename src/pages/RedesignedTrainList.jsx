import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, X, Bell, Check, Train, Clock, MapPin, ArrowRight } from 'lucide-react';
import { motion as m, AnimatePresence } from 'framer-motion';
import { useCountry } from '../context/CountryContext';
import indonesiaRailService from '../services/IndonesiaRailService';
import { CALCULATE_DISTANCE } from '../constants';

export default function RedesignedTrainList() {
  const navigate = useNavigate();
  const { isIndonesia, countryFlag } = useCountry();
  const [trains, setTrains] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [boardingStation, setBoardingStation] = useState(null);
  const [selectedTrain, setSelectedTrain] = useState(null);
  const [selectedClass, setSelectedClass] = useState('SL'); // Default travel class

  useEffect(() => {
    const st = localStorage.getItem('boardingStation');
    if (!st) { navigate('/train'); return; }
    const parsedStation = JSON.parse(st);
    setBoardingStation(parsedStation);

    if (isIndonesia) {
      indonesiaRailService.loadData().then(() => {
        const stIdentifier = parsedStation.code || parsedStation.id || parsedStation.name;
        const matchedRoutes = indonesiaRailService.getRoutesForStation(stIdentifier);

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
      });
    } else {
      fetch('/data/trainSchedule.json').then(r => r.json()).then(setTrains).catch(console.error);
    }
  }, [navigate, isIndonesia]);

  const filters = isIndonesia ? ['All', 'Antarkota', 'Commuter Line', 'Bandara'] : ['All', 'Express', 'Mail', 'Passenger'];
  const classesList = isIndonesia ? ['ECO', 'BUS', 'EXE'] : ['SL', '3A', '2A', '1A'];

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
    <div className="pt-16 pb-24 min-h-screen bg-slate-50 dark:bg-slate-950 font-sans max-w-md mx-auto border-x border-slate-200 dark:border-slate-800">
      <div className="px-4 space-y-4">

        {/* Top Destination Header */}
        <div className="saas-card p-4 flex items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-3">
            <m.button
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate('/')}
              className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-200"
            >
              <ArrowLeft size={16} />
            </m.button>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">Boarding Point</span>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white truncate max-w-[180px]">
                {boardingStation?.name || 'Select Station'}
              </h3>
            </div>
          </div>
          <span className="text-lg">{countryFlag}</span>
        </div>

        {/* IRCTC-Style Search Card */}
        <div className="saas-card p-4 space-y-3 shadow-md">
          <div className="relative flex items-center">
            <Search size={16} className="absolute left-3 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search train name or number..."
              className="w-full h-11 pl-9 pr-8 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium focus:outline-none"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2.5 w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                <X size={10} className="text-slate-500" />
              </button>
            )}
          </div>

          {/* Quick Filters */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {filters.map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-lg text-[11px] font-bold border transition-all ${
                  filter === f 
                    ? 'bg-blue-600 border-blue-600 text-white shadow-sm' 
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Train List */}
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="saas-card p-8 text-center text-slate-400 text-xs">
              <Train size={32} className="mx-auto mb-2 opacity-30" />
              <p>No active trains matching criteria</p>
            </div>
          ) : (
            filtered.map(t => (
              <m.div
                key={t.trainNumber}
                whileHover={{ y: -1 }}
                className="saas-card p-4 space-y-3 border-l-4 border-l-orange-500 shadow-md"
              >
                {/* Header Ticket Block */}
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-orange-500">
                      {t.trainNumber}
                    </span>
                    <h4 className="font-extrabold text-sm text-slate-900 dark:text-white leading-tight">{t.trainName}</h4>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black text-slate-900 dark:text-white">{t.stops[0]?.arrival}</span>
                    <span className="block text-[8px] font-black uppercase tracking-widest text-slate-400">Departure</span>
                  </div>
                </div>

                {/* Class Availability Selection Grid */}
                <div className="grid grid-cols-4 gap-2 pt-1">
                  {classesList.map(cls => (
                    <button
                      key={cls}
                      onClick={() => setSelectedClass(cls)}
                      className={`p-2 rounded-lg border text-center transition-all ${
                        selectedClass === cls
                          ? 'bg-orange-500/10 border-orange-500 text-orange-600'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
                      }`}
                    >
                      <span className="block text-xs font-bold">{cls}</span>
                      <span className="block text-[8px] font-bold text-emerald-500">AVAILABLE</span>
                    </button>
                  ))}
                </div>

                {/* Stops Summary */}
                <div className="flex justify-between items-center text-[10px] text-slate-500 bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
                  <span className="font-bold truncate max-w-[100px]">{t.stops[0]?.name}</span>
                  <span className="font-black text-blue-600">{t.stops.length} Stops</span>
                  <span className="font-bold truncate max-w-[100px]">{t.stops[t.stops.length - 1]?.name}</span>
                </div>

                {/* Book Alarm Button */}
                <m.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedTrain(t)}
                  className="w-full h-10 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/10"
                >
                  <Bell size={14} />
                  <span>Choose Destination Stop</span>
                </m.button>
              </m.div>
            ))
          )}
        </div>
      </div>

      {/* Timeline Destination Sheet */}
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
        className="fixed inset-0 z-[5000] bg-slate-950/60 backdrop-blur-sm"
      />

      <m.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 26, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 z-[5001] max-w-md mx-auto bg-white dark:bg-slate-900 rounded-t-[28px] shadow-2xl flex flex-col"
        style={{ height: '70vh' }}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-slate-300 dark:bg-slate-800 rounded-full" />
        </div>

        <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between">
          <div>
            <span className="text-[9px] font-black px-2 py-0.5 rounded bg-orange-500/10 text-orange-600">
              {train.trainNumber}
            </span>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white mt-1">{train.trainName}</h3>
            <p className="text-[10px] text-slate-500">Pick destination station to sound alert</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
            <X size={14} />
          </button>
        </div>

        {/* Timeline List */}
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2">
          {stops.map((stop, idx) => {
            const isSelected = selectedDest?.name === stop.name;
            return (
              <m.button
                key={idx}
                whileTap={{ scale: 0.99 }}
                onClick={() => setSelectedDest(stop)}
                className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'bg-blue-500/10 border-blue-500 text-blue-600'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center font-black text-[10px] border ${
                    isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-800 border-slate-300 text-slate-600'
                  }`}>
                    {isSelected ? <Check size={10} /> : idx + 1}
                  </div>
                  <div>
                    <h4 className="font-bold text-xs">{stop.name}</h4>
                    <span className="text-[10px] text-slate-500">Arrives {stop.arrival}</span>
                  </div>
                </div>
                <span className="text-xs font-black text-slate-400">{stop.distanceFromOriginKm} km</span>
              </m.button>
            );
          })}
        </div>

        <div className="p-5 border-t border-slate-100 dark:border-slate-800">
          <m.button
            whileTap={{ scale: 0.98 }}
            onClick={handleConfirm}
            disabled={!selectedDest}
            className={`w-full h-12 rounded-xl font-extrabold text-sm flex items-center justify-center gap-2 transition-all ${
              selectedDest ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
            }`}
          >
            <Bell size={16} />
            <span>{selectedDest ? `Arm Alarm for ${selectedDest.name}` : 'Choose Stop'}</span>
          </m.button>
        </div>
      </m.div>
    </>
  );
}
