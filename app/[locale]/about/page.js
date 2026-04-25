"use client";

import Link from 'next/link';
import { useLocale } from 'next-intl';
import { ArrowLeft, Mail, Phone, Shield, Zap, Target, Users, Heart } from 'lucide-react';

export default function AboutPage() {
  const locale = useLocale();

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-white selection:bg-[#1ED760]/30 relative overflow-hidden">
      
      {/* Background Ambient Glow */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-[#1ED760]/5 rounded-full blur-[120px] animate-pulse-glow"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-[#1ED760]/3 rounded-full blur-[100px] animate-pulse-glow" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Top Header */}
      <header style={{ backgroundColor: '#0B0B0B', borderBottom: '1px solid rgba(30,215,96,0.10)' }}
        className="sticky top-0 z-50 px-6 md:px-12 py-5 flex items-center gap-4">
        <Link
          href={`/${locale}/dashboard`}
          className="w-10 h-10 bg-white/5 border border-white/5 rounded-xl flex items-center justify-center text-gray-400 hover:text-[#1ED760] hover:border-[#1ED760]/30 transition-all group"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-black border border-[#1ED760]/30 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(30,215,96,0.2)]">
            <Shield className="text-[#1ED760]" size={18} />
          </div>
          <span className="text-xl font-black text-[#1ED760] tracking-tighter" style={{ textShadow: '0 0 15px rgba(30,215,96,0.5)' }}>SAVEMATE</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-3xl mx-auto px-4 py-12 md:py-20 space-y-10">

        {/* Hero Section */}
        <div className="text-center space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#1ED760]/10 border border-[#1ED760]/20 rounded-full text-[10px] font-black text-[#1ED760] uppercase tracking-widest">
            <Zap size={12} fill="#1ED760" />
            Our Mission
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white">
            About <span className="text-[#1ED760]" style={{ textShadow: '0 0 20px rgba(30,215,96,0.4)' }}>SaveMate</span>
          </h1>
          <p className="text-gray-400 text-lg font-medium max-w-xl mx-auto leading-relaxed">
            Empowering everyday Indians to build wealth — one rupee at a time.
          </p>
        </div>

        {/* About Card */}
        <div
          className="rounded-[28px] p-8 md:p-12 border border-white/5 animate-in fade-in slide-in-from-bottom-4 duration-700 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #121212 0%, #0D0D0D 100%)', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.5)' }}
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#1ED760] to-[#4ade80]"></div>
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-[#1ED760]/5 rounded-full blur-2xl"></div>

          <h2 className="text-[10px] font-black text-[#1ED760] uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
            <Heart size={14} /> Who We Are
          </h2>
          <p className="text-gray-300 text-base md:text-lg leading-relaxed font-medium">
            SaveMate is a goal-based savings companion built for India's working class — daily wage earners, 
            freelancers, and anyone with an irregular income. We understand that saving money is not about 
            how much you earn, but about building the right habits.
          </p>
          <p className="text-gray-400 text-sm md:text-base leading-relaxed mt-4 font-medium">
            With features like smart streak tracking, emergency withdrawal security, family savings goals, 
            and real-time portfolio tracking, SaveMate makes financial discipline simple, rewarding, and 
            accessible to everyone.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {[
            { icon: Target, title: 'Goal Based Saving', desc: 'Set targets, track progress, stay motivated with visual milestones.' },
            { icon: Zap, title: 'Streak Rewards', desc: 'Build saving streaks and watch your discipline turn into wealth.' },
            { icon: Users, title: 'Family Goals', desc: 'Collaborate on savings goals with family members in real-time.' },
          ].map((feat, i) => (
            <div
              key={i}
              className="rounded-[24px] p-6 border border-white/5 group hover:border-[#1ED760]/30 transition-all"
              style={{ background: 'linear-gradient(135deg, #121212 0%, #0D0D0D 100%)' }}
            >
              <div className="w-12 h-12 bg-[#1ED760]/10 rounded-2xl flex items-center justify-center text-[#1ED760] mb-4 group-hover:scale-110 transition-transform">
                <feat.icon size={22} />
              </div>
              <h3 className="text-sm font-black text-white uppercase tracking-widest mb-2">{feat.title}</h3>
              <p className="text-xs text-gray-500 font-medium leading-relaxed">{feat.desc}</p>
            </div>
          ))}
        </div>

        {/* Contact Section */}
        <div
          className="rounded-[28px] p-8 md:p-12 border border-[#1ED760]/20 animate-in fade-in slide-in-from-bottom-4 duration-700"
          style={{ background: 'linear-gradient(135deg, rgba(30,215,96,0.05) 0%, #0D0D0D 100%)', boxShadow: '0 0 30px rgba(30,215,96,0.05)' }}
        >
          <h2 className="text-[10px] font-black text-[#1ED760] uppercase tracking-[0.3em] mb-8 flex items-center gap-2">
            <Mail size={14} /> Contact Us
          </h2>

          <div className="space-y-6">
            <a
              href="mailto:savemet1234@gmail.com"
              className="flex items-center gap-5 group"
            >
              <div className="w-12 h-12 bg-[#1ED760]/10 border border-[#1ED760]/20 rounded-2xl flex items-center justify-center text-[#1ED760] shrink-0 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(30,215,96,0.1)]">
                <Mail size={20} />
              </div>
              <div>
                <p className="text-[10px] font-black text-[#888888] uppercase tracking-widest mb-1">Email</p>
                <p className="text-lg font-black text-white group-hover:text-[#1ED760] transition-colors">savemet1234@gmail.com</p>
              </div>
            </a>

            <a
              href="tel:+916363628385"
              className="flex items-center gap-5 group"
            >
              <div className="w-12 h-12 bg-[#1ED760]/10 border border-[#1ED760]/20 rounded-2xl flex items-center justify-center text-[#1ED760] shrink-0 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(30,215,96,0.1)]">
                <Phone size={20} />
              </div>
              <div>
                <p className="text-[10px] font-black text-[#888888] uppercase tracking-widest mb-1">Phone</p>
                <p className="text-lg font-black text-white group-hover:text-[#1ED760] transition-colors">+91 63636 28385</p>
              </div>
            </a>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center pb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <Link
            href={`/${locale}/dashboard`}
            className="inline-flex items-center gap-3 px-8 py-4 bg-[#1ED760] text-black font-black rounded-2xl text-sm uppercase tracking-widest transition-all hover:shadow-[0_20px_40px_-10px_rgba(30,215,96,0.5)] active:scale-95"
          >
            <Shield size={18} />
            Go to Dashboard
          </Link>
        </div>
      </main>
    </div>
  );
}
