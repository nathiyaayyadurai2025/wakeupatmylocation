import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion as m, AnimatePresence } from 'framer-motion';
import {
  Navigation,
  Play,
  WifiOff,
  MapPin,
  BatteryCharging,
  Bell,
  Train,
  Bus,
  Clock,
  ShieldCheck,
  Zap,
  Sliders,
  ChevronDown,
  Sparkles,
  ArrowRight,
  TrendingUp,
  CheckCircle2,
  Globe2
} from 'lucide-react';
import { useCountry } from '../context/CountryContext';

export default function RedesignedHome() {
  const navigate = useNavigate();
  const { countryName, countryFlag } = useCountry();
  const [openFaq, setOpenFaq] = useState(null);

  const trustBadges = [
    { label: 'Works Offline', icon: WifiOff, color: 'text-amber-500', bg: 'bg-amber-500/10 border-amber-500/20' },
    { label: 'GPS Tracking', icon: MapPin, color: 'text-blue-500', bg: 'bg-blue-500/10 border-blue-500/20' },
    { label: 'Battery Optimized', icon: BatteryCharging, color: 'text-emerald-500', bg: 'bg-emerald-500/10 border-emerald-500/20' },
    { label: 'Real-Time Alerts', icon: Bell, color: 'text-indigo-500', bg: 'bg-indigo-500/10 border-indigo-500/20' },
  ];

  const features = [
    { title: 'GPS Tracking', desc: 'Haversine formula calculations track your exact location in real-time.', icon: MapPin, gradient: 'from-blue-500 to-indigo-600' },
    { title: 'Train Tracking', desc: `Full support for ${countryName} ${countryFlag} intercity & commuter lines.`, icon: Train, gradient: 'from-indigo-500 to-purple-600' },
    { title: 'Bus & Vehicle Mode', desc: 'Universal GPS alarm for long-distance buses and road journeys.', icon: Bus, gradient: 'from-sky-500 to-blue-600' },
    { title: 'Live ETA & Speed', desc: 'Calculates dynamic estimated time of arrival based on vehicle velocity.', icon: Clock, gradient: 'from-emerald-500 to-teal-600' },
    { title: 'Offline Backup', desc: '100% offline functionality. No active internet needed after setup.', icon: WifiOff, gradient: 'from-amber-500 to-orange-600' },
    { title: 'Custom Alarms', desc: 'Set wake-up thresholds at 5km, 10km, 15km, 20km, or custom distance.', icon: Sliders, gradient: 'from-rose-500 to-red-600' },
    { title: 'Nearby Stops', desc: 'Automatically detects nearest railway stations around your position.', icon: Navigation, gradient: 'from-violet-500 to-purple-600' },
    { title: 'High Accuracy', desc: 'Smart background location updates designed for minimum battery drain.', icon: Zap, gradient: 'from-cyan-500 to-blue-600' },
  ];

  const statistics = [
    { label: 'Trips Completed', value: '12,450+', change: '+14%' },
    { label: 'Stops Saved', value: '99.8%', change: 'Highest Rate' },
    { label: 'Average Accuracy', value: '± 25m', change: 'GPS Precision' },
    { label: 'Total Distance', value: '1.28M km', change: 'Global Travel' },
    { label: 'Success Rate', value: '100%', change: 'Guaranteed' },
  ];

  const faqs = [
    { q: 'How does WakeUpMyStop work offline?', a: 'WakeUpMyStop loads station coordinates and route data directly into your browser memory. Your phone GPS receives satellite coordinates even without cell service or internet.' },
    { q: 'Does keeping GPS active drain my battery?', a: 'No! WakeUpMyStop uses optimized adaptive geolocation polling. When you are far from your stop, polling intervals are extended, conserving up to 80% battery.' },
    { q: 'Which countries and train routes are supported?', a: 'WakeUpMyStop fully supports India (Indian Railways) and Indonesia (PT KAI, KAI Commuter, KAI Bandara) along with universal GPS tracking for any bus or vehicle.' },
    { q: 'How early will the alarm trigger before my station?', a: 'You can choose your alarm distance threshold (5 km, 10 km, 15 km, 20 km or custom). The alarm sounds continuously with high volume and vibration until disarmed.' },
  ];

  return (
    <div className="pt-20 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-24" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ── HERO SECTION ── */}
      <section className="relative pt-6 pb-12 flex flex-col lg:flex-row items-center justify-between gap-12">
        {/* Ambient Gradient Blob */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none -z-10" />

        {/* Hero Left Text Column */}
        <m.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex-1 text-center lg:text-left space-y-6 max-w-2xl"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-bold tracking-wide">
            <Sparkles size={14} />
            <span>Next-Gen Travel Assistant & Alarm</span>
            <span className="text-base">{countryFlag}</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.15]">
            Never Miss Your <br />
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 bg-clip-text text-transparent">
              Stop Again.
            </span>
          </h1>

          <p className="text-lg text-slate-600 dark:text-slate-400 font-medium leading-relaxed max-w-xl">
            Sleep peacefully while we track your journey in real time and wake you before your destination. Works 100% offline with low battery usage.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
            <m.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => navigate('/train')}
              className="w-full sm:w-auto h-14 px-8 rounded-[20px] bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-base shadow-xl shadow-blue-500/25 flex items-center justify-center gap-3 transition-all"
            >
              <Navigation size={18} />
              <span>Start Journey</span>
              <ArrowRight size={18} />
            </m.button>

            <m.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => navigate('/train')}
              className="w-full sm:w-auto h-14 px-7 rounded-[20px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 font-bold text-base shadow-md flex items-center justify-center gap-2.5 transition-all"
            >
              <Play size={16} className="text-blue-600 fill-blue-600" />
              <span>Watch Demo</span>
            </m.button>
          </div>

          {/* Trust Badges Bar */}
          <div className="pt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {trustBadges.map((badge, i) => {
              const Icon = badge.icon;
              return (
                <div
                  key={i}
                  className={`flex items-center gap-2 p-2.5 rounded-2xl border ${badge.bg} backdrop-blur-sm transition-all`}
                >
                  <Icon size={16} className={badge.color} />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{badge.label}</span>
                </div>
              );
            })}
          </div>
        </m.div>

        {/* Hero Right Graphic / Vector Illustration */}
        <m.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="flex-1 w-full max-w-lg relative"
        >
          <div className="relative rounded-[28px] bg-gradient-to-b from-slate-900 to-slate-950 p-6 border border-slate-800 shadow-2xl shadow-blue-500/10 overflow-hidden">
            {/* Ambient Background Grid */}
            <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px] opacity-10" />

            {/* Travel Card Mockup Header */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <Train size={20} />
                </div>
                <div>
                  <h4 className="text-white font-bold text-sm">Express Journey Active</h4>
                  <p className="text-slate-400 text-xs font-medium">Destination Alert Armed</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Live GPS
              </span>
            </div>

            {/* Animated Sleeping Traveler SVG Graphic */}
            <div className="relative py-8 flex flex-col items-center justify-center text-center z-10">
              <div className="relative w-32 h-32 mb-4">
                {/* Pulse Rings */}
                <div className="absolute inset-0 rounded-full border-2 border-blue-500/30 animate-ping" />
                <div className="absolute inset-2 rounded-full border border-indigo-500/40 animate-pulse" />
                
                <div className="w-full h-full rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 p-0.5 shadow-2xl shadow-blue-500/40 flex items-center justify-center">
                  <div className="w-full h-full bg-slate-900 rounded-full flex flex-col items-center justify-center">
                    <span className="text-4xl mb-1">😴</span>
                    <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Sleeping Safe</span>
                  </div>
                </div>
              </div>

              {/* Station Progress Widget */}
              <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-4 mt-2 text-left space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-medium">Distance Remaining</span>
                  <span className="text-blue-400 font-extrabold text-sm">8.4 km</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 rounded-full w-[72%]" />
                </div>
                <div className="flex justify-between items-center text-[11px] text-slate-400">
                  <span>Current: 55 km/h</span>
                  <span className="text-emerald-400 font-bold">Alarm in ~8 mins</span>
                </div>
              </div>
            </div>
          </div>
        </m.div>
      </section>

      {/* ── FEATURES GRID ── */}
      <section className="space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Designed for Peace of Mind
          </h2>
          <p className="text-slate-600 dark:text-slate-400 font-medium">
            Everything you need for worry-free travel on trains, buses, and long journeys.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feat, i) => {
            const Icon = feat.icon;
            return (
              <m.div
                key={i}
                whileHover={{ y: -5 }}
                className="saas-card p-6 flex flex-col justify-between"
              >
                <div>
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${feat.gradient} flex items-center justify-center text-white shadow-lg mb-5`}>
                    <Icon size={22} />
                  </div>
                  <h3 className="text-slate-900 dark:text-white font-bold text-lg mb-2">{feat.title}</h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{feat.desc}</p>
                </div>
              </m.div>
            );
          })}
        </div>
      </section>

      {/* ── TRIP STATISTICS DASHBOARD ── */}
      <section className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-[28px] p-8 sm:p-12 text-white shadow-2xl space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-3">
              <TrendingUp className="text-emerald-400" />
              <span>Real-Time Travel Performance</span>
            </h2>
            <p className="text-blue-200 text-sm mt-1">Trusted by thousands of train and vehicle commuters daily.</p>
          </div>
          <button
            onClick={() => navigate('/train')}
            className="px-5 py-2.5 rounded-xl bg-white text-blue-900 font-bold text-xs hover:bg-blue-50 transition-all shadow-md"
          >
            Launch Tracker
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
          {statistics.map((stat, i) => (
            <div key={i} className="bg-white/5 border border-white/10 p-5 rounded-2xl space-y-1">
              <span className="text-xs font-bold text-blue-300 uppercase tracking-wider">{stat.label}</span>
              <div className="text-2xl sm:text-3xl font-black text-white">{stat.value}</div>
              <span className="inline-block text-[11px] font-bold text-emerald-400">{stat.change}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── INTERACTIVE FAQ ACCORDION ── */}
      <section className="max-w-3xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">Frequently Asked Questions</h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm">Everything you need to know about GPS alarms and travel tracking.</p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, i) => {
            const isOpen = openFaq === i;
            return (
              <div
                key={i}
                className="saas-card overflow-hidden transition-all"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : i)}
                  className="w-full p-5 text-left font-bold text-base text-slate-900 dark:text-white flex items-center justify-between gap-4"
                >
                  <span>{faq.q}</span>
                  <ChevronDown size={18} className={`text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-blue-600' : ''}`} />
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <m.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="px-5 pb-5 text-sm text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800/60 pt-3"
                    >
                      {faq.a}
                    </m.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="pt-12 border-t border-slate-200 dark:border-slate-800 text-center space-y-4 text-xs text-slate-500">
        <div className="flex items-center justify-center gap-2 font-bold text-slate-700 dark:text-slate-300">
          <Train size={16} className="text-blue-600" />
          <span>WakeUpMyStop &copy; {new Date().getFullYear()}</span>
        </div>
        <p>Built for commuters across India 🇮🇳 & Indonesia 🇮🇩 with GPS precision.</p>
      </footer>

    </div>
  );
}
