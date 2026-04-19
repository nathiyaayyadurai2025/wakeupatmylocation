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

function App() {
  return (
    <BrowserRouter>
      {/* 
        This div is required to leave space for the absolute/fixed StepHeader.
        It spans the router content so all pages inherit it.
      */}
      <div className="flex flex-col min-h-screen bg-slate-950 font-sans">
        <StepHeader />
        
        <Routes>
          <Route path="/" element={<RedesignedHome />} />
          <Route path="/train" element={<RedesignedTrainMode />} />
          <Route path="/trains" element={<RedesignedTrainList />} />
          <Route path="/tracking" element={<RedesignedTracking />} />
          <Route path="/location-alarm" element={<TrainAlarmFlow />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
