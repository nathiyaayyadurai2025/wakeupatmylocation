import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Train, MapPin, ShieldCheck, ArrowRight, Zap } from 'lucide-react';
import { motion as m } from 'framer-motion';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.35, ease: 'easeOut' } }),
};

export default function RedesignedHome() {
  const navigate = useNavigate();

  return (
    <m.div
      variants={pageVariants} initial="initial" animate="animate"
      className="min-h-screen bg-[#0A0F1E] flex flex-col overflow-hidden"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* ── TOP HERO (40%) ── */}
      <div className="flex flex-col items-center justify-center pt-20 pb-8 px-6 flex-shrink-0" style={{ minHeight: '42vh' }}>
        {/* Animated Illustration */}
        <div className="relative flex items-center justify-center mb-8">
          {/* outer rings */}
          {[140, 110, 80].map((size, i) => (
            <m.div
              key={size}
              className="absolute rounded-full border border-[#3B82F6]"
              style={{ width: size, height: size, opacity: 0.08 + i * 0.07 }}
              animate={{ scale: [1, 1.06, 1], opacity: [0.08 + i * 0.07, 0.15 + i * 0.05, 0.08 + i * 0.07] }}
              transition={{ duration: 3 + i, repeat: Infinity, ease: 'easeInOut', delay: i * 0.4 }}
            />
          ))}
          {/* rotating arc */}
          <m.div
            className="absolute rounded-full border-t-2 border-l-2 border-[#3B82F6]"
            style={{ width: 120, height: 120 }}
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          />
          {/* center icon */}
          <div className="w-20 h-20 rounded-full bg-[#3B82F6]/15 border border-[#3B82F6]/30 flex items-center justify-center backdrop-blur-sm shadow-[0_0_40px_rgba(59,130,246,0.2)]">
            <Train size={36} className="text-[#3B82F6]" />
          </div>
          {/* floating Zap badge */}
          <m.div
            className="absolute -top-1 -right-1 w-7 h-7 bg-[#3B82F6] rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.5)]"
            animate={{ y: [-3, 3, -3] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Zap size={14} className="text-white fill-white" />
          </m.div>
        </div>

        <m.h1
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.4 }}
          className="text-[30px] font-black text-white tracking-tight text-center"
        >
          WakeMyStop
        </m.h1>
        <m.p
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.4 }}
          className="text-[#9CA3AF] text-[14px] mt-2 text-center font-medium"
        >
          Never miss your stop again
        </m.p>
      </div>

      {/* ── BOTTOM SECTION (60%) ── */}
      <div className="flex-1 px-5 pb-10 flex flex-col justify-between">
        <div className="space-y-3">
          {/* Train Alarm Card */}
          <m.button
            custom={0} variants={cardVariants} initial="hidden" animate="visible"
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/train')}
            className="w-full text-left group relative overflow-hidden rounded-2xl p-5 border-l-[3px] border-[#3B82F6] border-r border-t border-b flex items-center gap-4 transition-all duration-200 hover:shadow-[0_0_24px_rgba(59,130,246,0.2)] active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, #1C2537 0%, #0F172A 100%)',
              borderTopColor: 'rgba(255,255,255,0.05)',
              borderRightColor: 'rgba(255,255,255,0.05)',
              borderBottomColor: 'rgba(255,255,255,0.05)',
            }}
          >
            <div className="w-14 h-14 rounded-full bg-[#3B82F6]/15 border border-[#3B82F6]/25 flex items-center justify-center flex-shrink-0">
              <Train size={26} className="text-[#60A5FA]" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-[#F9FAFB] font-bold text-[17px] tracking-tight">Train Alarm</h2>
              <p className="text-[#9CA3AF] text-xs mt-1 leading-relaxed">GPS tracking with 2km alert</p>
            </div>
            <ArrowRight size={18} className="text-[#4B5563] group-hover:text-[#3B82F6] transition-colors flex-shrink-0" />
          </m.button>

          {/* Location Alarm Card */}
          <m.button
            custom={1} variants={cardVariants} initial="hidden" animate="visible"
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/location-alarm')}
            className="w-full text-left group relative overflow-hidden rounded-2xl p-5 border-l-[3px] border-[#10B981] border-r border-t border-b flex items-center gap-4 transition-all duration-200 hover:shadow-[0_0_24px_rgba(16,185,129,0.2)] active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, #1C2537 0%, #0F172A 100%)',
              borderTopColor: 'rgba(255,255,255,0.05)',
              borderRightColor: 'rgba(255,255,255,0.05)',
              borderBottomColor: 'rgba(255,255,255,0.05)',
            }}
          >
            <div className="w-14 h-14 rounded-full bg-[#10B981]/15 border border-[#10B981]/25 flex items-center justify-center flex-shrink-0">
              <MapPin size={26} className="text-[#34D399]" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-[#F9FAFB] font-bold text-[17px] tracking-tight">Location Alarm</h2>
              <p className="text-[#9CA3AF] text-xs mt-1 leading-relaxed">Wake up at any location</p>
            </div>
            <ArrowRight size={18} className="text-[#4B5563] group-hover:text-[#10B981] transition-colors flex-shrink-0" />
          </m.button>
        </div>

        {/* Social Proof */}
        <m.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7, duration: 0.5 }}
          className="flex items-center justify-center gap-2 mt-6"
        >
          <ShieldCheck size={14} className="text-[#3B82F6]" />
          <span className="text-[#4B5563] text-xs font-medium tracking-wide">56 lakh+ journeys tracked safely</span>
        </m.div>
      </div>
    </m.div>
  );
}
