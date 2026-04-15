import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Bus, ChevronRight, ArrowLeft, Info, MapPin, Loader2 } from 'lucide-react';
import { AlarmContext } from '../App';
import { BUS_ROUTES, API_BASE_URL } from '../constants';

const BusSelectionPage = () => {
  const navigate = useNavigate();
  const { setSelectedBusRoute, t } = useContext(AlarmContext);
  const [searchQuery, setSearchQuery] = useState('');
  const [routes, setRoutes] = useState(BUS_ROUTES);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchRoutes = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/bus/routes`);
        if (res.ok) {
          const data = await res.json();
          // Merge with local static routes if needed, or just replace
          setRoutes([...BUS_ROUTES, ...data]);
        }
      } catch (err) {
        console.error("Bus API error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRoutes();
  }, []);

  const filteredRoutes = routes.filter(r => 
    r.routeName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    r.routeId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (route) => {
    setSelectedBusRoute(route);
    navigate('/stop-selection');
  };

  return (
    <div className="flex flex-col min-h-screen pt-8 px-6 pb-24 overflow-y-auto">
      <div className="flex items-center space-x-4 mb-8">
        <button 
          onClick={() => navigate('/')}
          className="w-10 h-10 glass flex items-center justify-center rounded-xl text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-2xl font-black">{t.bus}</h2>
      </div>

      <div className="relative mb-8 group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-brand-400 transition-colors">
          {loading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
        </div>
        <input
          type="text"
          placeholder={t.searchBus}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-4 glass-darker rounded-2xl border border-white/5 focus:border-brand-500/50 focus:ring-4 focus:ring-brand-500/10 outline-none transition-all placeholder:text-slate-600 font-medium"
        />
      </div>

      <div className="space-y-4">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 px-2 flex items-center justify-between">
          <span>{t.stations}</span>
          <span className="bg-slate-900 border border-white/5 px-2 py-0.5 rounded text-[10px] tracking-normal font-bold">
            {loading ? 'Fetching Routes...' : `${filteredRoutes.length} available`}
          </span>
        </h3>
        
        <div className="space-y-4">
          <AnimatePresence>
            {filteredRoutes.map((route, idx) => (
              <motion.button
                key={route.routeId}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => handleSelect(route)}
                className="w-full text-left glass-darker p-5 rounded-3xl border border-white/5 hover:border-brand-500/30 transition-all group overflow-hidden relative"
              >
                <div className="absolute -right-2 top-0 bottom-0 w-1 bg-emerald-500/0 group-hover:bg-emerald-500/50 transition-all shadow-glow"></div>
                
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400 border border-emerald-500/20 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                      <Bus size={24} />
                    </div>
                    <div>
                      <h4 className="text-lg font-black text-slate-100 group-hover:text-white leading-none mb-1">{route.routeId}</h4>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-widest leading-none">{route.routeName}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-black uppercase text-slate-500">{t.stations}</div>
                    <div className="text-sm font-black text-emerald-400">{route.stops.length} STOPS</div>
                  </div>
                </div>

                <div className="flex flex-col pt-3 border-t border-white/5 space-y-2">
                  <div className="flex items-center space-x-2">
                    <MapPin size={12} className="text-slate-600" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">MAJOR STOPS</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {route.stops.slice(0, 3).map((stop, sidx) => (
                      <span key={sidx} className="text-[9px] font-black py-1 px-2 bg-slate-900 border border-white/5 text-slate-500 rounded-md truncate max-w-[80px]">
                        {stop.stopName || stop.station}
                      </span>
                    ))}
                    {route.stops.length > 3 && (
                      <span className="text-[9px] font-black py-1 px-2 bg-slate-900 border border-white/5 text-slate-500 rounded-md">
                        +{route.stops.length - 3} MORE
                      </span>
                    )}
                  </div>
                </div>
              </motion.button>
            ))}
          </AnimatePresence>
          
          {!loading && filteredRoutes.length === 0 && (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-slate-900 border border-white/5 rounded-full flex items-center justify-center mx-auto mb-6 opacity-40">
                <Search size={40} className="text-slate-500" />
              </div>
              <p className="text-slate-500 font-bold px-8">No bus routes found for <span className="text-emerald-400">"{searchQuery}"</span>. Try searching by city or route ID.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BusSelectionPage;
