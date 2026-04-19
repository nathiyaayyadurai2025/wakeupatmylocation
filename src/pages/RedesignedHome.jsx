import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Train, MapPin, ShieldCheck, ArrowRight } from 'lucide-react';
import { motion as m } from 'framer-motion';

export default function RedesignedHome() {
  const navigate = useNavigate();

  return (
    <div className="h-screen bg-[#0A0F1E] flex flex-col font-sans overflow-hidden">
      {/* Top 40% */}
      <div className="h-[45%] flex flex-col items-center justify-end pb-8 relative">
        <m.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative mb-6"
        >
          {/* Animated rings for illustration placeholder */}
          <div className="w-32 h-32 rounded-full border-2 border-[#3B82F6]/20 flex items-center justify-center relative">
            <m.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 rounded-full border-l-2 border-t-2 border-[#3B82F6]/50"
            />
            <div className="w-20 h-20 bg-[#3B82F6]/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <Train size={40} className="text-[#3B82F6]" />
            </div>
          </div>
        </m.div>

        <m.h1 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-[28px] font-black text-white tracking-tight"
        >
          WakeMyStop
        </m.h1>
        <m.p 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-[#9CA3AF] text-sm mt-1"
        >
          Never miss your stop again
        </m.p>
      </div>

      {/* Bottom 60% */}
      <div className="h-[55%] px-6 pt-4 pb-10 flex flex-col space-y-4 items-center">
        <m.div
          initial="hidden"
          animate="visible"
          variants={{
            visible: { transition: { staggerChildren: 0.08 } },
            hidden: {}
          }}
          className="w-full max-w-sm space-y-4"
        >
          {/* Train Alarm Card */}
          <m.button
            variants={{ hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/train')}
            className="w-full relative overflow-hidden bg-gradient-to-br from-[#1C2537] to-[#0F172A] rounded-2xl p-5 border border-white/5 border-l-[3px] border-l-[#3B82F6] hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] transition-shadow text-left group"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full bg-[#3B82F6]/20 flex items-center justify-center text-[#60A5FA] flex-shrink-0">
                <Train size={24} />
              </div>
              <div className="flex-1">
                <h2 className="text-white font-bold text-lg leading-tight tracking-tight">Train Alarm</h2>
                <p className="text-[#9CA3AF] text-xs mt-1 leading-relaxed">
                  GPS tracking with 2km alert
                </p>
              </div>
              <ArrowRight size={20} className="text-[#4B5563] group-hover:text-[#3B82F6] transition-colors" />
            </div>
          </m.button>

          {/* Location Alarm Card */}
          <m.button
            variants={{ hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/location-alarm')}
            className="w-full relative overflow-hidden bg-gradient-to-br from-[#1C2537] to-[#0F172A] rounded-2xl p-5 border border-white/5 border-l-[3px] border-l-[#10B981] hover:shadow-[0_0_20px_rgba(16,185,129,0.2)] transition-shadow text-left group"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full bg-[#10B981]/20 flex items-center justify-center text-[#34D399] flex-shrink-0">
                <MapPin size={24} />
              </div>
              <div className="flex-1">
                <h2 className="text-white font-bold text-lg leading-tight tracking-tight">Location Alarm</h2>
                <p className="text-[#9CA3AF] text-xs mt-1 leading-relaxed">
                  Wake up at any location
                </p>
              </div>
              <ArrowRight size={20} className="text-[#4B5563] group-hover:text-[#10B981] transition-colors" />
            </div>
          </m.button>
        </m.div>

        {/* Social Proof */}
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-auto flex items-center justify-center space-x-1.5 text-[#4B5563]"
        >
          <ShieldCheck size={14} />
          <span className="text-xs font-medium tracking-wide">56 lakh+ journeys tracked</span>
        </m.div>
      </div>
    </div>
  );
}
