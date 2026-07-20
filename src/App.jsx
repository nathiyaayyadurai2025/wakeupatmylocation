import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// New Pages
import RedesignedHome from './pages/RedesignedHome';
import RedesignedTrainMode from './pages/RedesignedTrainMode';
import RedesignedTrainList from './pages/RedesignedTrainList';
import RedesignedTracking from './pages/RedesignedTracking';

// Existing GPS Flow (from previous steps) 
import TrainAlarmFlow from './pages/TrainAlarmFlow';

// Components
import StepHeader from './components/StepHeader';

import { CountryProvider } from './context/CountryContext';

import Navbar from './components/Navbar';
import MobileBottomNav from './components/MobileBottomNav';

function App() {
  return (
    <CountryProvider>
      <BrowserRouter>
        <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 font-sans transition-colors duration-300">
          <Navbar />
          <StepHeader />
          
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<RedesignedHome />} />
              <Route path="/train" element={<RedesignedTrainMode />} />
              <Route path="/trains" element={<RedesignedTrainList />} />
              <Route path="/tracking" element={<RedesignedTracking />} />
              <Route path="/location-alarm" element={<TrainAlarmFlow />} />
            </Routes>
          </main>

          <MobileBottomNav />
        </div>
      </BrowserRouter>
    </CountryProvider>
  );
}

export default App;
