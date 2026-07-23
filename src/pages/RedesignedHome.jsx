import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion as m, AnimatePresence } from 'framer-motion';
import {
  Train,
  MapPin,
  ArrowUpDown,
  Search,
  Bell,
  Clock,
  Settings,
  Shield,
  HelpCircle,
  TrendingUp,
  Map,
  Compass,
  ArrowRight,
  User,
  Star,
  ChevronRight,
  Share2
} from 'lucide-react';
import { useCountry } from '../context/CountryContext';
import { TRIGGER_ALARM_SOUND, STOP_ALARM_SOUND } from '../constants';

export default function RedesignedHome() {
  const navigate = useNavigate();
  const { countryName, countryFlag, setCountry, isIndonesia } = useCountry();

  // Booking Widget States
  const [fromStation, setFromStation] = useState(null);
  const [toStation, setToStation] = useState(null);
  const [journeyDate, setJourneyDate] = useState(new Date().toISOString().split('T')[0]);
  const [travelMode, setTravelMode] = useState('Train'); // Train, Bus, General GPS
  const [activeTracking, setActiveTracking] = useState(null);

  useEffect(() => {
    // Load station selections & active tracking state from localStorage
    const fromSt = localStorage.getItem('boardingStation');
    const destName = localStorage.getItem('destinationName');
    
    if (fromSt) {
      setFromStation(JSON.parse(fromSt));
    }
    if (destName) {
      setToStation({ name: destName });
      setActiveTracking({
        destination: destName,
        trainName: localStorage.getItem('trainName') || 'Active Journey',
        trainNumber: localStorage.getItem('trainNumber') || 'TRN'
      });
    }
  }, []);

  const handleSwapStations = () => {
    const temp = fromStation;
    setFromStation(toStation);
    setToStation(temp);
    if (fromStation) localStorage.setItem('destinationName', fromStation.name);
    else localStorage.removeItem('destinationName');
    if (toStation) localStorage.setItem('boardingStation', JSON.stringify(toStation));
    else localStorage.removeItem('boardingStation');
  };

  const handleSearchTrains = () => {
    if (!fromStation) {
      navigate('/train');
      return;
    }
    navigate('/trains');
  };

  const quickActions = [
    { label: 'Book Alarm', icon: Bell, color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20', path: '/train' },
    { label: 'Live Status', icon: Clock, color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20', path: '/tracking' },
    { label: 'Map View', icon: Map, color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20', path: '/tracking' },
    { label: 'Near Me', icon: Compass, color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20', path: '/train' },
    { label: 'Schedules', icon: Train, color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20', path: '/trains' },
    { label: 'Saved Trips', icon: Star, color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20', path: '/' },
  ];

  return (
    <div className="pt-20 pb-28 px-4 max-w-md mx-auto space-y-6 font-sans bg-slate-50 dark:bg-slate-950 min-h-screen">
      
      {/* Dynamic Native-App Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-md">
            <User size={18} />
          </div>
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Welcome traveler</span>
            <h3 className="font-extrabold text-sm text-slate-800 dark:text-white">Happy Journey!</h3>
          </div>
        </div>

        {/* Dynamic Country Selector IRCTC / PT KAI Accent */}
        <button
          onClick={() => setCountry(isIndonesia ? 'IN' : 'ID')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
        >
          <span>{countryFlag}</span>
          <span>{isIndonesia ? 'KAI Access' : 'IRCTC app'}</span>
        </button>
      </div>

      {/* Floating Active Journey Alert Banner */}
      {activeTracking && (
        <m.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => navigate('/tracking')}
          className="p-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg cursor-pointer flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center animate-pulse">
              <Train size={18} />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-200">Active Journey Tracking</span>
              <h4 className="font-bold text-sm truncate max-w-[180px]">{activeTracking.trainName}</h4>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs font-bold text-blue-100">
            <span>Live View</span>
            <ChevronRight size={14} />
          </div>
        </m.div>
      )}

      {/* "Plan My Journey" Card (IRCTC Style) */}
      <div className="bg-white dark:bg-slate-900 rounded-[24px] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
        {/* IRCTC Colors Top Banner */}
        <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 p-4 text-white">
          <div className="flex justify-between items-center">
            <h3 className="font-black text-base tracking-wide uppercase flex items-center gap-2">
              <Train size={18} />
              <span>Plan My Journey</span>
            </h3>
            <span className="text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded bg-white/20">
              {travelMode} Mode
            </span>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* Station Selection Fields */}
          <div className="relative space-y-3">
            {/* FROM Station */}
            <div
              onClick={() => navigate('/train')}
              className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 cursor-pointer flex items-center gap-3 hover:bg-slate-100/50"
            >
              <MapPin className="text-emerald-500 flex-shrink-0" size={18} />
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">From Station</span>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate block">
                  {fromStation ? `${fromStation.name} (${fromStation.code || ''})` : 'Select Boarding Station'}
                </span>
              </div>
            </div>

            {/* Swapping Icon Button */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2 z-10">
              <m.button
                whileHover={{ rotate: 180 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSwapStations();
                }}
                className="w-10 h-10 rounded-full bg-blue-600 text-white border-2 border-white dark:border-slate-900 shadow-lg flex items-center justify-center cursor-pointer transition-colors"
              >
                <ArrowUpDown size={16} />
              </m.button>
            </div>

            {/* TO Station */}
            <div
              onClick={() => navigate('/train')}
              className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 cursor-pointer flex items-center gap-3 hover:bg-slate-100/50"
            >
              <MapPin className="text-rose-500 flex-shrink-0" size={18} />
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">To Station</span>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate block">
                  {toStation ? toStation.name : 'Select Destination Station'}
                </span>
              </div>
            </div>
          </div>

          {/* Date Picker */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 flex items-center gap-3">
            <Clock className="text-blue-500 flex-shrink-0" size={18} />
            <div className="flex-1">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Departure Date</span>
              <input
                type="date"
                value={journeyDate}
                onChange={(e) => setJourneyDate(e.target.value)}
                className="bg-transparent text-sm font-bold text-slate-800 dark:text-slate-100 w-full focus:outline-none"
              />
            </div>
          </div>

          {/* Travel Mode Toggle Button Chips */}
          <div className="grid grid-cols-3 gap-2">
            {['Train', 'Bus', 'General'].map((mode) => (
              <button
                key={mode}
                onClick={() => setTravelMode(mode)}
                className={`py-2 rounded-xl text-xs font-extrabold transition-all border ${
                  travelMode === mode
                    ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                {mode} Mode
              </button>
            ))}
          </div>

          {/* Primary Action Buttons */}
          <div className="flex flex-col gap-2">
            {toStation && (
              <m.button
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  try {
                    TRIGGER_ALARM_SOUND();
                    setTimeout(() => {
                      STOP_ALARM_SOUND();
                    }, 50);
                  } catch (e) {
                    console.warn(e);
                  }

                  localStorage.setItem('destinationName', toStation.name);
                  localStorage.setItem('destinationLat', toStation.lat ? toStation.lat.toString() : (isIndonesia ? '-6.5962' : '9.9252'));
                  localStorage.setItem('destinationLng', toStation.lng ? toStation.lng.toString() : (isIndonesia ? '106.7907' : '78.1198'));
                  localStorage.setItem('trainName', travelMode + ' Journey');
                  localStorage.setItem('trainNumber', 'GPS-ALARM');
                  localStorage.setItem('alarmTriggered', 'false');

                  navigate('/tracking');
                }}
                className="w-full h-13 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2"
              >
                <Bell size={16} />
                <span>Set Alarm & Start Journey</span>
              </m.button>
            )}

            <m.button
              whileTap={{ scale: 0.98 }}
              onClick={handleSearchTrains}
              className={`w-full h-13 rounded-2xl font-extrabold text-sm flex items-center justify-center gap-2 transition-all ${
                toStation
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                  : 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/25 hover:from-orange-600 hover:to-amber-600'
              }`}
            >
              <Search size={16} />
              <span>Search Trains</span>
            </m.button>
          </div>
        </div>
      </div>

      {/* Quick Services Grid */}
      <div className="space-y-3">
        <h3 className="font-extrabold text-sm text-slate-800 dark:text-white uppercase tracking-wider pl-1">
          Quick Services
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {quickActions.map((action, idx) => {
            const Icon = action.icon;
            return (
              <m.div
                key={idx}
                whileTap={{ scale: 0.96 }}
                onClick={() => navigate(action.path)}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-center text-center gap-2 cursor-pointer hover:border-slate-300 shadow-sm"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${action.color}`}>
                  <Icon size={18} />
                </div>
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  {action.label}
                </span>
              </m.div>
            );
          })}
        </div>
      </div>

      {/* Recent Trips & Info Banner */}
      <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Shield size={16} />
          </div>
          <div>
            <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200">100% Safe Sleeping</h4>
            <p className="text-[10px] text-slate-500">Offline alarms wake you up securely</p>
          </div>
        </div>
        <HelpCircle size={16} className="text-slate-400 cursor-pointer" />
      </div>

    </div>
  );
}
