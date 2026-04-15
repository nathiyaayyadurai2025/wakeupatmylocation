import React, { createContext, useContext, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { Home, Map as MapIcon, Settings as SettingsIcon, Bell, Navigation, Train, Bus, MapPin, Search, Play, X, Sliders, Info, Zap, Clock } from 'lucide-react';
import { TRANSLATIONS } from './constants';

export const AlarmContext = createContext();

export const AlarmProvider = ({ children }) => {
  const [userLocation, setUserLocation] = useState(null);
  const [selectedTrain, setSelectedTrain] = useState(null);
  const [selectedBusRoute, setSelectedBusRoute] = useState(null);
  const [selectedStops, setSelectedStops] = useState([]); // Multiple stops
  const [activeStop, setActiveStop] = useState(null); // The stop currently triggering the alarm
  const [isTracking, setIsTracking] = useState(false);
  const [isAlarmActive, setIsAlarmActive] = useState(false);
  const [travelMode, setTravelMode] = useState('train'); // train, bus, general
  const [lang, setLang] = useState('en'); // en, ta
  const [settings, setSettings] = useState({
    distanceThreshold: 2, // km
    timeThreshold: 10, // minutes
    vibrate: true,
    repeatAlarm: true,
  });
  const [remainingDistance, setRemainingDistance] = useState(null);

  const t = TRANSLATIONS[lang];

  const value = {
    userLocation, setUserLocation,
    selectedTrain, setSelectedTrain,
    selectedBusRoute, setSelectedBusRoute,
    selectedStops, setSelectedStops,
    activeStop, setActiveStop,
    isTracking, setIsTracking,
    isAlarmActive, setIsAlarmActive,
    travelMode, setTravelMode,
    settings, setSettings,
    remainingDistance, setRemainingDistance,
    lang, setLang, t
  };

  return <AlarmContext.Provider value={value}>{children}</AlarmContext.Provider>;
};

const DigitalClock = () => {
  const [mounted, setMounted] = useState(false);
  const [time, setTime] = useState(null);

  useEffect(() => {
    setMounted(true);
    const update = () => setTime(new Date());
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!mounted || !time) {
    return (
      <div className="flex flex-col items-center justify-center font-mono text-[9px] font-black tracking-widest text-slate-800 px-4 border-l border-white/5 h-10 ml-4 translate-y-1">
        <div className="flex items-center space-x-1.5 whitespace-nowrap">
          <Clock size={10} />
          <span className="opacity-20">00:00:00</span>
        </div>
        <div className="opacity-10 uppercase text-[7px] mt-0.5">--- --, ----</div>
      </div>
    );
  }

  const timeStr = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  const dateStr = time.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div className="flex flex-col items-center justify-center font-mono text-[9px] font-black tracking-widest text-brand-indigo/60 px-4 border-l border-white/5 h-10 ml-4 translate-y-1">
      <div className="flex items-center space-x-1.5 whitespace-nowrap">
        <Clock size={10} />
        <span>{timeStr}</span>
      </div>
      <div className="opacity-40 uppercase text-[7px] mt-0.5">{dateStr}</div>
    </div>
  );
};

// Layout with Navigation
const Layout = ({ children }) => {
  const { lang, setLang, t } = useContext(AlarmContext);
  
  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 selection:bg-brand-500/30 overflow-hidden">
      <header className="fixed top-0 left-0 right-0 h-20 bg-slate-950/40 backdrop-blur-xl z-50 flex items-center justify-between px-6 border-b border-white/[0.03]">
        <div className="flex items-center space-x-3">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-brand-indigo rounded-xl flex items-center justify-center shadow-lg shadow-brand-indigo/20 pulse-glow">
              <Bell size={20} className="text-white fill-current" />
            </div>
            <div className="flex flex-col ml-3">
              <span className="font-normal text-2xl tracking-tighter text-gradient leading-none">{t.title}</span>
              <span className="text-[7px] font-medium uppercase tracking-[0.4em] text-slate-600 mt-1">Satellite Lock Active</span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-1 glass-darker p-1 rounded-full border border-white/5">
          <button 
            onClick={() => setLang('en')}
            className={`text-[9px] font-black px-3 py-1.5 rounded-full transition-all ${lang === 'en' ? 'bg-brand-indigo text-white shadow-lg shadow-brand-indigo/20' : 'text-slate-500 hover:text-slate-300'}`}
          >
            ENG
          </button>
          <button 
            onClick={() => setLang('ta')}
            className={`text-[9px] font-black px-3 py-1.5 rounded-full transition-all ${lang === 'ta' ? 'bg-brand-indigo text-white shadow-lg shadow-brand-indigo/20' : 'text-slate-500 hover:text-slate-300'}`}
          >
            தமிழ்
          </button>
          <button 
            onClick={() => setLang('hi')}
            className={`text-[9px] font-black px-3 py-1.5 rounded-full transition-all ${lang === 'hi' ? 'bg-brand-indigo text-white shadow-lg shadow-brand-indigo/20' : 'text-slate-500 hover:text-slate-300'}`}
          >
            हिन्दी
          </button>
        </div>
      </header>
      
      <main className="flex-grow pt-20 pb-28 relative overflow-y-auto">
        <div className="max-w-md mx-auto min-h-full relative px-4">
          {children}
        </div>
      </main>
      
      {/* Elite Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50">
        <div className="nav-pill flex items-center justify-around px-8">
          <NavButton icon={Home} label="Home" path="/" />
          <NavButton icon={MapIcon} label="Track" path="/tracking" />
          <NavButton icon={SettingsIcon} label="Settings" path="/settings" />
        </div>
      </nav>
    </div>
  );
};

const NavButton = ({ icon: Icon, label, path }) => {
  const navigate = useNavigate();
  const isActive = window.location.pathname === path;
  
  return (
    <button 
      onClick={() => navigate(path)}
      className={`flex flex-col items-center justify-center space-y-1 transition-colors ${isActive ? 'text-brand-400' : 'text-slate-400 hover:text-slate-300'}`}
    >
      <Icon size={20} className={isActive ? 'animate-pulse' : ''} />
      <span className="text-[10px] font-medium tracking-wide uppercase">{label}</span>
    </button>
  );
};

// Pages
import HomePage from './pages/HomePage';
import TrainSelectionPage from './pages/TrainSelectionPage';
import BusSelectionPage from './pages/BusSelectionPage';
import StopSelectionPage from './pages/StopSelectionPage';
import GeneralSelectionPage from './pages/GeneralSelectionPage';
import TrackingPage from './pages/TrackingPage';
import AlarmPage from './pages/AlarmPage';
import SettingsPage from './pages/SettingsPage';
import LandingPage from './pages/LandingPage';

const App = () => {
  return (
    <AlarmProvider>
      <Router>
        <Routes>
          <Route path="/landing" element={<LandingPage />} />
          <Route path="/*" element={
            <Layout>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="train-selection" element={<TrainSelectionPage />} />
                <Route path="bus-selection" element={<BusSelectionPage />} />
                <Route path="stop-selection" element={<StopSelectionPage />} />
                <Route path="general-selection" element={<GeneralSelectionPage />} />
                <Route path="tracking" element={<TrackingPage />} />
                <Route path="alarm" element={<AlarmPage />} />
                <Route path="settings" element={<SettingsPage />} />
              </Routes>
            </Layout>
          } />
        </Routes>
      </Router>
    </AlarmProvider>
  );
};

export default App;
