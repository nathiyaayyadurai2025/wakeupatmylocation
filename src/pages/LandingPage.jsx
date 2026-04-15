import React from 'react';
import { motion as m } from 'framer-motion';
import { Train, Bus, Navigation, ShieldCheck, Zap, Globe, Gauge, Bell, Map as MapIcon, Sliders, Smartphone, ArrowRight, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
    const navigate = useNavigate();

    return (
        <div className="bg-[#020617] text-white min-h-screen overflow-x-hidden font-roboto selection:bg-cyan-500/30">
            {/* Nav */}
            <nav className="fixed top-0 left-0 right-0 z-50 glass-darker border-b border-white/5 px-6 py-4 flex items-center justify-between backdrop-blur-xl">
                <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-xl glass-interactive flex items-center justify-center text-brand-cyan shadow-lg shadow-cyan-900/20">
                        <Bell size={18} />
                    </div>
                    <span className="font-light text-xl tracking-tighter text-gradient">WakeMyStop</span>
                </div>
                <div className="hidden md:flex items-center space-x-8 text-xs font-medium uppercase tracking-widest text-[#94a3b8]">
                    <a href="#how" className="hover:text-brand-cyan transition-colors">How it works</a>
                    <a href="#features" className="hover:text-brand-cyan transition-colors">Features</a>
                    <button 
                        onClick={() => navigate('/')}
                        className="bg-brand-cyan/10 border border-brand-cyan/20 text-brand-cyan px-4 py-2 rounded-xl hover:bg-brand-cyan hover:text-white transition-all shadow-lg shadow-cyan-900/20"
                    >
                        Launch App
                    </button>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-40 pb-32 px-6 overflow-hidden">
                <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-cyan-600/10 rounded-full blur-[160px] opacity-20" />
                <div className="absolute top-1/2 -right-40 w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[140px] opacity-20" />
                
                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <m.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center space-x-2 px-4 py-2 rounded-full glass-interactive border border-white/10 mb-8"
                    >
                        <Zap size={14} className="text-brand-cyan animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-cyan">Next-Gen Travel Alert System</span>
                    </m.div>

                    <m.h1 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 }}
                        className="text-6xl md:text-8xl font-light tracking-tighter mb-8 leading-[0.95] text-gradient"
                    >
                        Never Miss Your <br className="hidden md:block" /> Stop Again <span className="text-brand-cyan">🚆</span>
                    </m.h1>

                    <m.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-lg md:text-xl text-[#cbd5e1] max-w-2xl mx-auto mb-12 font-light leading-relaxed font-mono opacity-80"
                    >
                        WakeMyStop wakes you exactly when you reach your destination. Accurate, reliable, and specialized for Indian Railways, Bus Routes, and GPS tracking.
                    </m.p>

                    <m.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6"
                    >
                        <button 
                            onClick={() => navigate('/')}
                        className="group bg-brand-cyan text-[#020617] px-8 py-5 rounded-[2rem] font-medium text-xl shadow-2xl shadow-cyan-900/40 hover:scale-105 active:scale-95 transition-all flex items-center"
                        >
                            Start Live Demo
                            <ArrowRight size={20} className="ml-3 group-hover:translate-x-1 transition-transform" />
                        </button>
                        <button className="glass-interactive border border-white/10 text-white px-8 py-5 rounded-[2rem] font-medium text-xl hover:bg-white/5 transition-all flex items-center">
                            <Download size={20} className="mr-3" />
                            Download App
                        </button>
                    </m.div>
                </div>
            </section>

            {/* How It Works Section */}
            <section id="how" className="py-24 px-6 relative bg-white/5 border-y border-white/5">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-light text-gradient tracking-tighter mb-4">Precision Workflow</h2>
                        <p className="text-[#94a3b8] font-mono text-xs uppercase tracking-widest leading-none">4 Steps to Safe Arrival</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        <StepCard number="01" icon={Train} title="Select Train" desc="Official Indian Railways route database integration." />
                        <StepCard number="02" icon={MapIcon} title="Choose Stop" desc="Target any specific station or custom location." />
                        <StepCard number="03" icon={Activity} title="Track Journey" desc="Adaptive GPS polling for battery efficiency." />
                        <StepCard number="04" icon={ShieldCheck} title="Wake Up Safely" desc="High-vol alarm within the critical 2KM zone." />
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-32 px-6">
                <div className="max-w-6xl mx-auto border border-white/5 rounded-[4rem] glass-darker p-12 relative overflow-hidden">
                    <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-cyan-600/10 rounded-full blur-[80px]" />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                        <div>
                            <h2 className="text-5xl font-light text-gradient tracking-tighter mb-8 leading-none">Production-Grade <br/> Travel Safety</h2>
                            <div className="space-y-6">
                                <FeatureItem icon={Globe} title="Satellite GPS Tracking" desc="Works online and offline via internal system chips." />
                                <FeatureItem icon={Zap} title="Smart Battery Optimization" desc="Adaptive polling scaled by distance from destination." />
                                <FeatureItem icon={Bell} title="Critical Geofencing" desc="Vector-based passing detection prevents false alarms." />
                                <FeatureItem icon={Smartphone} title="Elite Mobile Interface" desc="High-contrast dark mode for overnight clarity." />
                            </div>
                        </div>
                        <div className="relative">
                            <div className="glass-interactive border border-white/10 rounded-[3rem] p-4 shadow-2xl relative z-10">
                                <div className="absolute -inset-4 bg-gradient-to-br from-cyan-500/20 to-transparent blur-2xl -z-10" />
                                <img src="https://images.unsplash.com/photo-1510511459019-5dda7724fd87?auto=format&fit=crop&q=80&w=1000" alt="Dashboard" className="rounded-[2.5rem] grayscale contrast-125" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section className="py-24 px-6 text-center">
                <div className="max-w-2xl mx-auto space-y-8">
                    <div className="w-16 h-1 bg-brand-cyan mx-auto rounded-full" />
                    <p className="text-4xl italic font-light text-[#cbd5e1] leading-snug">
                        "I used to sit up all night terrified of missing my station. With WakeMyStop, I sleep peacefully and wake up exactly at the platform."
                    </p>
                    <div>
                        <p className="text-brand-cyan font-bold text-lg leading-none">Daily Train Passenger</p>
                        <p className="text-[#64748b] text-xs font-mono uppercase tracking-widest mt-2">Verified Mission Success</p>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-24 px-6 border-t border-white/5 bg-black/40">
                <div className="max-w-6xl mx-auto text-center">
                    <h2 className="text-3xl font-light mb-12 text-gradient">Your destination is our mission.</h2>
                    <div className="flex justify-center space-x-6">
                         <button onClick={() => navigate('/')} className="bg-brand-cyan text-[#020617] px-12 py-5 rounded-[2rem] font-bold text-lg shadow-xl shadow-cyan-900/20 hover:scale-105 transition-all">Launch Web App</button>
                    </div>
                    <p className="mt-16 text-[#64748b] text-[10px] font-mono uppercase tracking-[0.4em]">© 2026 WakeMyStop. Aerospace Grade Navigation.</p>
                </div>
            </footer>
        </div>
    );
};

const StepCard = ({ number, icon: Icon, title, desc }) => (
    <div className="glass-interactive border border-white/5 p-8 rounded-[3rem] space-y-6 relative group overflow-hidden">
        <div className="absolute top-0 right-0 p-4 text-white/5 text-6xl font-black">{number}</div>
        <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-brand-cyan group-hover:scale-110 transition-transform">
            <Icon size={32} />
        </div>
        <div>
            <h3 className="text-xl font-light text-white mb-2">{title}</h3>
            <p className="text-xs text-[#94a3b8] font-mono leading-relaxed">{desc}</p>
        </div>
    </div>
);

const FeatureItem = ({ icon: Icon, title, desc }) => (
    <div className="flex items-start space-x-4">
        <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-brand-cyan shrink-0">
            <Icon size={20} />
        </div>
        <div>
            <h4 className="text-lg font-medium text-white leading-tight">{title}</h4>
            <p className="text-xs text-[#64748b] mt-1 leading-relaxed">{desc}</p>
        </div>
    </div>
);

const FeatureSection = ({ icon: Icon, title, desc }) => (
    <div className="flex items-center space-x-4">
        <Icon size={24} className="text-brand-cyan" />
        <div>
            <h3 className="text-lg font-bold">{title}</h3>
            <p className="text-slate-400 text-sm">{desc}</p>
        </div>
    </div>
);

export default LandingPage;
