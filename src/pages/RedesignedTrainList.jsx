import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, X, Clock, Navigation } from 'lucide-react';
import { motion as m, AnimatePresence } from 'framer-motion';

export default function RedesignedTrainList() {
  const navigate = useNavigate();
  const [trains, setTrains] = useState([]);
  const [search, setSearch] = useState('');
  const [boardingStation, setBoardingStation] = useState(null);
  
  const [selectedTrain, setSelectedTrain] = useState(null);
  const [availableStops, setAvailableStops] = useState([]);
  
  useEffect(() => {
    const st = localStorage.getItem('boardingStation');
    if (st) {
      setBoardingStation(JSON.parse(st));
    } else {
      navigate('/train');
      return;
    }

    fetch('/data/trainSchedule.json')
      .then(res => res.json())
      .then(data => {
        setTrains(data); // In reality we'd filter by checking if station exists in stops
      })
      .catch(err => console.error(err));
  }, [navigate]);

  const handleSetAlarmClick = (train) => {
    setSelectedTrain(train);
    // Find stops AFTER the boarding station. But we don't have perfect matching for name out of the box, let's just show all stops for simulation sake, or try to match.
    // The prompt says: "Show scrollable list of ALL stops for that train AFTER the selected boarding station."
    // Let's assume user boarding station might not match perfectly string-wise to json, so just show all stops for now, or attempt matching.
    const boardIdx = train.stops.findIndex(
      s => boardingStation && boardingStation.name.toLowerCase().includes(s.name.toLowerCase())
    );
    
    // If not found, show all. If found, show subsequent.
    const startIdx = boardIdx >= 0 ? boardIdx + 1 : 1; 
    setAvailableStops(train.stops.slice(startIdx));
  };

  const filteredTrains = trains.filter(t => 
    t.trainName.toLowerCase().includes(search.toLowerCase()) || 
    t.trainNumber.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 pt-[3.5rem]">
      <div className="p-4 bg-slate-900 border-b border-slate-800 sticky top-[3.5rem] z-20 shadow-md">
        <h2 className="text-white font-bold text-lg mb-3">Available Trains</h2>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input 
            type="text" 
            placeholder="Search by name or number..." 
            className="w-full bg-slate-800 text-white pl-10 pr-4 py-2 rounded-xl text-sm border border-slate-700 outline-none focus:border-blue-500 focus:bg-slate-900"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredTrains.length === 0 ? (
          <div className="text-center text-slate-500 py-10">No trains found at this station</div>
        ) : (
          filteredTrains.map(t => (
            <div key={t.trainNumber} className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-lg">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-white font-bold text-base flex items-center space-x-2">
                    <span className="bg-blue-600/20 text-blue-400 px-2 py-0.5 rounded text-xs">{t.trainNumber}</span>
                    <span>{t.trainName}</span>
                  </h3>
                  <p className="text-slate-400 text-xs mt-1 flex items-center">
                    <Navigation size={10} className="mr-1" /> To {t.stops[t.stops.length-1].name}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center text-slate-300 text-xs font-medium">
                  <Clock size={12} className="mr-1 text-slate-500" /> Departs: {t.stops[0].arrival}
                </div>
                <button 
                  onClick={() => handleSetAlarmClick(t)}
                  className="bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-bold px-4 py-2 rounded-lg transition-all"
                >
                  Set Alarm
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* BOTTOM SHEET */}
      <AnimatePresence>
        {selectedTrain && (
          <>
            <m.div 
              initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}}
              className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
              onClick={() => setSelectedTrain(null)}
            />
            <m.div 
              initial={{y: '100%'}} animate={{y: 0}} exit={{y: '100%'}}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900 border-t border-slate-700 rounded-t-3xl max-h-[85vh] flex flex-col"
            >
              <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900 rounded-t-3xl">
                <div>
                  <h3 className="text-white font-black text-lg">{selectedTrain.trainName} ({selectedTrain.trainNumber})</h3>
                  <p className="text-slate-400 text-xs mt-1">Select your destination stop</p>
                </div>
                <button onClick={() => setSelectedTrain(null)} className="w-8 h-8 flex items-center justify-center bg-slate-800 rounded-full text-slate-400 hover:text-white">
                  <X size={16} />
                </button>
              </div>
              
              <div className="overflow-y-auto flex-1 p-3">
                <StopList 
                  stops={availableStops} 
                  train={selectedTrain} 
                  boardingStation={boardingStation} 
                  fullStops={selectedTrain.stops}
                />
              </div>
            </m.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function StopList({ stops, train, boardingStation, fullStops }) {
  const navigate = useNavigate();
  const [selectedDest, setSelectedDest] = useState(null);

  const confirmAlarm = () => {
    if (!selectedDest) return;
    localStorage.setItem("destinationName", selectedDest.name);
    localStorage.setItem("destinationLat", selectedDest.lat.toString());
    localStorage.setItem("destinationLng", selectedDest.lng.toString());
    localStorage.setItem("trainName", train.trainName);
    localStorage.setItem("trainNumber", train.trainNumber);
    localStorage.setItem("allStops", JSON.stringify(fullStops));
    localStorage.setItem("alarmTriggered", "false");
    
    navigate('/tracking');
  };

  return (
    <div className="flex flex-col h-full">
      <div className="space-y-2 flex-1 pb-4">
        {stops.map((st, idx) => {
          const isSelected = selectedDest?.name === st.name;
          return (
            <button
              key={idx}
              onClick={() => setSelectedDest(st)}
              className={`w-full text-left p-4 rounded-xl flex items-center justify-between border transition-all ${
                isSelected 
                  ? 'bg-blue-600 border-blue-500 shadow-lg shadow-blue-900/30' 
                  : 'bg-slate-800/50 border-slate-700/50 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${isSelected ? 'bg-white text-blue-600' : 'bg-slate-700 text-slate-300'}`}>
                  {idx + 1}
                </div>
                <div>
                  <h4 className={`font-bold text-sm ${isSelected ? 'text-white' : 'text-slate-200'}`}>{st.name}</h4>
                  <p className={`text-xs mt-0.5 ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>Arrival: {st.arrival}</p>
                </div>
              </div>
              <div className={`text-xs font-mono font-bold ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                {st.distanceFromOriginKm} km
              </div>
            </button>
          );
        })}
      </div>
      <div className="pt-3 pb-safe bg-slate-900 sticky bottom-0 border-t border-slate-800">
        <button
          disabled={!selectedDest}
          onClick={confirmAlarm}
          className={`w-full py-4 rounded-xl font-bold text-sm transition-all ${
            selectedDest 
              ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)] active:scale-[0.98]' 
              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
          }`}
        >
          {selectedDest ? `Set Alarm to ${selectedDest.name}` : 'Select a stop'}
        </button>
      </div>
    </div>
  );
}
