"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  PiggyBank,
  Wallet,
  ArrowRight,
  Target,
  Activity,
  IndianRupee,
  LogOut,
  RefreshCw,
  TrendingUp,
  Zap,
  Plus,
  ChevronRight,
  ChevronLeft,
  Banknote,
  FileText,
  ShieldCheck,
  Sparkles,
  CreditCard,
  History,
  ArrowUpRight,
  User,
  LayoutDashboard
} from 'lucide-react';
import Link from 'next/link';
import { io } from 'socket.io-client';
import { useTranslations, useLocale } from 'next-intl';
import LanguageSwitcher from '../../../components/LanguageSwitcher';
import SmartAssistant from '../../../components/SmartAssistant';

export default function DashboardHub() {
  const t = useTranslations('Dashboard');
  const locale = useLocale();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [savingTip, setSavingTip] = useState("");

  useEffect(() => {
    const tips = [
      "A small step today builds strong savings.",
      "Consistency matters more than amount.",
      "Regular saving improves financial stability."
    ];
    setSavingTip(tips[Math.floor(Math.random() * tips.length)]);
  }, []);

  // Exit guard: warn on refresh/close and browser back
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    const handlePopState = (e) => {
      const confirmed = window.confirm('Are you sure you want to exit SaveMate?');
      if (!confirmed) {
        window.history.pushState(null, '', window.location.href);
      }
    };
    window.history.pushState(null, '', window.location.href);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  useEffect(() => {
    if (showGoalModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [showGoalModal]);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/dashboard', { cache: 'no-store' });
      if (res.status === 401) {
        window.location.href = `/${locale}`;
        return;
      }
      const json = await res.json();
      if (json.user) setData(json);
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    if (!data?.user) return;
    const socket = io();
    socket.emit('join_user_room', data.user._id);
    socket.on('data_updated', fetchData);
    return () => socket.disconnect();
  }, [data?.user?._id]);

  useEffect(() => {
    if (!data || isHovered) return;
    const slidesCount = 3;
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % slidesCount);
    }, 6000);
    return () => clearInterval(timer);
  }, [data, isHovered]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = `/${locale}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0B0B] flex items-center justify-center">
        <div className="relative flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-2 border-white/5 border-t-[#1ED760] rounded-full animate-spin"></div>
          <p className="text-[10px] font-bold tracking-[0.2em] text-[#888] uppercase">{t('syncingWealth')}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { account, goals, stats } = data;

  const balance = account?.main_balance || 0;
  let suggestedSaving = 10;
  if (balance < 100) suggestedSaving = 10;
  else if (balance < 500) suggestedSaving = 30;
  else if (balance < 2000) suggestedSaving = 100;
  else if (balance < 10000) suggestedSaving = 300;
  else suggestedSaving = 700;

  return (
    <div className="min-h-screen bg-[#0B0F0E] text-white selection:bg-[#1ED760]/30 stagger-in pb-24">

      {/* 🟢 HEADER */}
      <header
        style={{ backgroundColor: '#0B0F0E', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
        className="sticky top-0 z-50 px-6 md:px-10 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#1ED760]/10 rounded-xl flex items-center justify-center">
            <PiggyBank className="text-[#1ED760]" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white leading-none">{t('title')}</h1>
            <p className="text-[9px] text-[#888888] uppercase tracking-widest font-semibold mt-1">{t('companionVersion')}</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden lg:flex items-center gap-3">
            <div className="flex flex-col items-end">
              <span className="text-[9px] font-bold text-[#888] uppercase tracking-widest">{t('welcome')}</span>
              <span className="text-sm font-semibold text-white">{data.user.name}</span>
            </div>
            <Link href={`/${locale}/dashboard/profile`} className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors">
              <span className="text-white font-bold">{data.user.name[0]}</span>
            </Link>
          </div>

          <Link href={`/${locale}/about`} className="hidden md:flex items-center gap-2 text-[10px] font-bold text-[#888] hover:text-white uppercase tracking-widest transition-colors">
            About
          </Link>

          <div className="h-6 w-px bg-white/10"></div>

          <LanguageSwitcher />

          <button onClick={handleLogout} className="p-2.5 rounded-xl bg-white/5 hover:bg-red-500/10 hover:text-red-500 transition-all border border-white/5">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <main className="px-4 sm:px-6 md:px-10 pt-8 space-y-8 md:space-y-12 max-w-[1600px] mx-auto">

        {/* 🟢 SUGGESTED SAVING */}
        <section className="card-secondary p-6 rounded-2xl border border-white/5 bg-[#121212] flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white mb-1">Suggested Saving</h2>
            <div className="flex items-center gap-3">
              <span className="text-3xl font-extrabold text-[#1ED760]">₹{suggestedSaving.toLocaleString('en-IN')}</span>
            </div>
            <p className="text-sm text-slate-400 mt-2 font-medium">
              Based on your current balance, this is a recommended amount to save today.
            </p>
            {savingTip && (
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-2">
                {savingTip}
              </p>
            )}
          </div>
          <Link
            href={`/${locale}/dashboard/deposit?amount=${suggestedSaving}`}
            className="btn-primary px-8 py-4 whitespace-nowrap w-full md:w-auto text-sm flex items-center justify-center gap-2"
          >
            Save Now <PiggyBank size={18} />
          </Link>
        </section>

        {/* 🟢 STATUS PANEL (HERO CAROUSEL) */}
        <section className="relative group" onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
          <div className="relative h-[450px] w-full card-primary bg-gradient-to-br from-[#121212] to-[#0a0a0a] overflow-hidden border-0">

            {/* Carousel Controls */}
            <button
              onClick={() => setCurrentSlide(prev => (prev === 0 ? 2 : prev - 1))}
              className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center z-30 opacity-0 group-hover:opacity-100 transition-all backdrop-blur-md border border-white/10"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() => setCurrentSlide(prev => (prev + 1) % 3)}
              className="absolute right-4 md:right-6 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center z-30 opacity-0 group-hover:opacity-100 transition-all backdrop-blur-md border border-white/10"
            >
              <ChevronRight size={20} />
            </button>

            {/* Slide 0: Master Portfolio */}
            <div className={`absolute inset-0 p-8 md:p-12 flex flex-col justify-between transition-opacity duration-700 ${currentSlide === 0 ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none z-0'}`}>
              <div className="flex justify-between items-start">
                <div className="w-full md:w-auto">
                  <div className="flex flex-wrap items-center gap-3 mb-6">
                    <span className="px-3 py-1 bg-[#1ED760]/10 text-[#1ED760] text-[10px] font-bold rounded-full border border-[#1ED760]/20 tracking-wider uppercase">{t('masterPortfolio')}</span>
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-full border border-white/10 text-white text-[10px] font-bold tracking-wider">
                      <TrendingUp size={12} className="text-[#1ED760]" />
                      <span>{t('growthSecured')}</span>
                    </div>
                  </div>
                  <p className="text-[#888] font-semibold text-xs mb-2 uppercase tracking-widest">{t('totalValuation')}</p>
                  <h2 className="text-5xl md:text-7xl lg:text-[80px] font-extrabold tracking-tight mb-4 leading-none text-white">
                    ₹{stats.total_saved.toLocaleString('en-IN')}
                  </h2>
                  <p className="text-slate-400 font-medium text-sm max-w-md hidden sm:block">
                    {t('valuationDesc')}
                  </p>
                </div>
                <StreakBadge streak={account?.currentStreak || 0} />
              </div>

              <div className="flex flex-col md:flex-row justify-between items-stretch md:items-end gap-6 pt-6 mt-auto border-t border-white/5">
                <div className="flex gap-10">
                  <div>
                    <p className="text-[#888] text-[10px] font-bold uppercase tracking-widest mb-1">{t('spendableBalance')}</p>
                    <p className="text-2xl font-bold tracking-tight">₹{account?.main_balance?.toLocaleString('en-IN') || 0}</p>
                  </div>
                  <div>
                    <p className="text-[#888] text-[10px] font-bold uppercase tracking-widest mb-1">{t('liquidityScore')}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold tracking-tight">9.4</span>
                      <span className="text-[#1ED760] text-[10px] font-semibold bg-[#1ED760]/10 px-2 py-0.5 rounded-full">{t('excellent')}</span>
                    </div>
                  </div>
                </div>
                <Link href={`/${locale}/dashboard/income`} className="w-full md:w-auto px-8 py-3.5 bg-white text-black hover:bg-gray-100 hover:scale-[1.02] font-bold rounded-xl flex items-center justify-center gap-2 transition-all text-sm">
                  {t('addNewEarnings')} <ArrowRight size={16} />
                </Link>
              </div>
            </div>

            {/* Slide 1: Tactical Reserves */}
            <div className={`absolute inset-0 p-8 md:p-12 flex flex-col justify-between transition-opacity duration-700 ${currentSlide === 1 ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none z-0'}`}>
              <div className="flex justify-between items-start">
                <div className="w-full md:w-auto">
                  <div className="flex items-center gap-3 mb-6">
                    <span className="px-3 py-1 bg-white/5 text-white text-[10px] font-bold rounded-full border border-white/10 tracking-wider uppercase">{t('tacticalReserves')}</span>
                  </div>
                  <p className="text-[#888] font-semibold text-xs mb-2 uppercase tracking-widest">{t('physicalAssets')}</p>
                  <h2 className="text-5xl md:text-7xl lg:text-[80px] font-extrabold tracking-tight mb-4 leading-none text-white">
                    ₹{account?.cash_savings?.toLocaleString('en-IN') || 0}
                  </h2>
                  <p className="text-slate-400 font-medium text-sm max-w-md hidden sm:block">
                    {t('cashDesc')}
                  </p>
                </div>
                <div className="w-20 h-20 bg-white/5 rounded-2xl flex items-center justify-center hidden md:flex border border-white/5">
                  <Banknote size={32} className="text-[#1ED760]" />
                </div>
              </div>

              <div className="flex justify-end pt-6 mt-auto border-t border-white/5">
                <Link href={`/${locale}/dashboard/edit-cash`} className="w-full md:w-auto px-8 py-3.5 bg-white text-black hover:bg-gray-100 hover:scale-[1.02] font-bold rounded-xl flex items-center justify-center gap-2 transition-all text-sm">
                  {t('logCurrentCash')} <CreditCard size={16} />
                </Link>
              </div>
            </div>

            {/* Slide 2: Growth Targets */}
            <div className={`absolute inset-0 p-8 md:p-12 flex flex-col justify-between transition-opacity duration-700 ${currentSlide === 2 ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none z-0'}`}>
              <div className="flex justify-between items-start">
                <div className="w-full md:w-auto">
                  <div className="flex items-center gap-3 mb-6">
                    <span className="px-3 py-1 bg-[#1ED760]/10 text-[#1ED760] text-[10px] font-bold rounded-full border border-[#1ED760]/20 tracking-wider uppercase">{t('growthTargets')}</span>
                  </div>
                  <p className="text-[#888] font-semibold text-xs mb-2 uppercase tracking-widest">{t('activeObjectives')}</p>
                  <h2 className="text-5xl md:text-7xl lg:text-[80px] font-extrabold tracking-tight mb-4 leading-none text-[#1ED760]">
                    {goals.length}
                  </h2>
                  <p className="text-slate-400 font-medium text-sm max-w-md hidden sm:block">
                    {t('goalsDesc', { count: goals.length })}
                  </p>
                </div>
                <div className="w-20 h-20 bg-white/5 rounded-2xl flex items-center justify-center hidden md:flex border border-white/5">
                  <Target size={32} className="text-[#1ED760]" />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center pt-6 mt-auto border-t border-white/5 gap-6">
                <div className="flex items-center gap-4">
                  <div className="flex -space-x-3">
                    {goals.slice(0, 4).map((g, i) => (
                      <div key={i} className="w-10 h-10 rounded-full border-2 border-[#121212] bg-[#1A1A1A] flex items-center justify-center text-white font-bold text-xs">
                        {g.name[0]}
                      </div>
                    ))}
                  </div>
                  <span className="text-[10px] font-bold text-[#888] uppercase tracking-widest">{t('trackingLive')}</span>
                </div>
                <Link href={`/${locale}/dashboard/goal-setup`} className="w-full sm:w-auto px-8 py-3.5 bg-[#1ED760] text-black hover:bg-[#1ED760]/90 hover:scale-[1.02] font-bold rounded-xl flex items-center justify-center gap-2 transition-all text-sm">
                  {t('launchNewGoal')} <Sparkles size={16} />
                </Link>
              </div>
            </div>

            {/* Pagination */}
            <div className="absolute bottom-6 md:bottom-8 left-8 md:left-12 flex gap-2 z-20">
              {[0, 1, 2].map((i) => (
                <button
                  key={i}
                  onClick={() => setCurrentSlide(i)}
                  className={`h-1.5 transition-all duration-300 rounded-full ${currentSlide === i ? 'w-8 bg-white' : 'w-2 bg-white/20'}`}
                />
              ))}
            </div>

          </div>
        </section>

        {/* 🟢 ACTION GRID */}
        <section className="grid grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6">
          {[
            { label: t('putMoneyAway'), icon: PiggyBank, link: `/${locale}/dashboard/deposit`, desc: t('secureDigitalDeposit'), primary: true },
            { label: t('investments'), icon: Activity, link: `/${locale}/demotrading`, desc: t('openTrading') },
            { label: t('logPhysicalCash'), icon: IndianRupee, link: `/${locale}/dashboard/edit-cash`, desc: t('handheldAssetSync') },
            { label: t('mapNewDream'), icon: Target, link: `/${locale}/dashboard/goal-setup`, desc: t('strategicGoalCreation') },
            { label: t('analyzeHistory'), icon: History, link: `/${locale}/dashboard/passbook`, desc: t('fullTransactionLedger') }
          ].map((item, i) => (
            <Link key={i} href={item.link} className={`group p-5 md:p-6 flex flex-col justify-between min-h-[160px] md:min-h-[200px] ${item.primary ? 'card-primary border-[#1ED760]/30' : 'card-secondary'}`}>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 ${item.primary ? 'bg-[#1ED760] text-black shadow-lg shadow-[#1ED760]/20' : 'bg-[#1a1a1a] text-slate-400 group-hover:text-white group-hover:bg-[#1ED760]'}`}>
                <item.icon size={22} />
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <h3 className={`text-base font-semibold tracking-tight ${item.primary ? 'text-[#1ED760]' : 'text-white'}`}>{item.label}</h3>
                  <ArrowUpRight size={14} className={`transition-colors ${item.primary ? 'text-[#1ED760]' : 'text-gray-500 group-hover:text-white'}`} />
                </div>
                <p className={`text-[9px] font-bold uppercase tracking-widest ${item.primary ? 'text-[#1ED760]/70' : 'text-gray-500'}`}>{item.desc}</p>
              </div>
            </Link>
          ))}
        </section>

        {/* 🟢 GOALS GRID */}
        <section>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 gap-4">
            <div>
              <h3 className="text-2xl font-bold tracking-tight text-white">{t('growthObjectivesHeader')}</h3>
            </div>
            {goals.length > 0 && (
              <button onClick={() => setShowGoalModal(true)} className="text-sm font-semibold text-[#888] hover:text-white transition-colors flex items-center gap-1">
                {t('expandView')} <ChevronRight size={16} />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {goals.length === 0 ? (
              <div className="col-span-1 md:col-span-2 lg:col-span-3 card-secondary p-12 flex flex-col items-center justify-center text-center min-h-[300px]">
                <div className="w-16 h-16 bg-[#1a1a1a] rounded-2xl flex items-center justify-center text-slate-500 mb-6">
                  <Target size={28} />
                </div>
                <h4 className="text-xl font-bold text-white mb-2">Create Your First Goal</h4>
                <p className="text-sm text-slate-400 max-w-sm mb-6">Create a savings target to begin tracking your financial journey step-by-step.</p>
                <Link href={`/${locale}/dashboard/goal-setup`} className="btn-primary text-sm">
                  Set up a goal
                </Link>
              </div>
            ) : (
              goals.map(goal => {
                const progress = (goal.saved_amount / goal.target_amount) * 100;
                return (
                  <Link key={goal._id} href={`/${locale}/dashboard/goal-details/${goal._id}`} className="card-secondary p-6 md:p-8 cursor-pointer group">
                    <div className="flex justify-between items-start mb-6">
                      <div className="w-12 h-12 bg-[#1a1a1a] rounded-xl flex items-center justify-center text-slate-400 group-hover:text-white group-hover:scale-105 transition-all">
                        <Target size={20} />
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-[#888] font-bold uppercase tracking-widest mb-1">{t('completion')}</p>
                        <p className="text-2xl font-bold text-[#1ED760]">{Math.round(progress)}%</p>
                      </div>
                    </div>

                    <div className="mb-6">
                      <h4 className="text-lg font-bold text-white mb-1 line-clamp-1 group-hover:text-gray-200">{goal.name}</h4>
                      <p className="text-[11px] text-slate-400 font-semibold">{t('securedAmount', { amount: goal.saved_amount.toLocaleString('en-IN') })}</p>
                    </div>

                    <div className="space-y-3">
                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-[#1ED760]" style={{ width: `${progress}%` }} />
                      </div>
                      <div className="flex justify-between items-center text-[10px] font-bold text-[#888] uppercase tracking-wider">
                        <span>{t('startingPoint')}</span>
                        <span className="text-white">₹{goal.target_amount.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </Link>
                );
              })
            )}

            {goals.length > 0 && (
              <Link href={`/${locale}/dashboard/goal-setup`} className="card-secondary border border-dashed border-white/10 hover:border-[#1ED760]/30 bg-transparent hover:bg-[#1ED760]/5 p-8 flex flex-col items-center justify-center group transition-all min-h-[250px]">
                <div className="w-14 h-14 rounded-full bg-[#1a1a1a] flex items-center justify-center text-slate-500 group-hover:bg-[#1ED760]/10 group-hover:text-[#1ED760] transition-colors mb-4">
                  <Plus size={24} />
                </div>
                <p className="font-bold text-slate-400 group-hover:text-white text-sm">{t('defineNewObjective')}</p>
              </Link>
            )}
          </div>
        </section>

        {/* 🟢 FINANCIAL SUMMARY */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          <div className="card-secondary p-6 flex items-center gap-4 group">
            <div className="w-12 h-12 bg-[#1a1a1a] rounded-xl flex items-center justify-center text-slate-400 group-hover:text-[#1ED760] transition-colors">
              <Wallet size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t('wallet')}</p>
              <p className="text-xl font-bold text-white group-hover:text-[#1ED760] transition-colors">₹{account?.main_balance?.toLocaleString('en-IN') || 0}</p>
            </div>
          </div>

          <div className="card-secondary p-6 flex items-center gap-4 group">
            <div className="w-12 h-12 bg-[#1a1a1a] rounded-xl flex items-center justify-center text-slate-400 group-hover:text-[#1ED760] transition-colors">
              <Activity size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t('investments')}</p>
              <p className="text-xl font-bold text-white group-hover:text-[#1ED760] transition-colors">₹{account?.investment_balance?.toLocaleString('en-IN') || 0}</p>
            </div>
          </div>

          <div className="card-secondary p-6 flex items-center gap-4 group">
            <div className="w-12 h-12 bg-[#1a1a1a] rounded-xl flex items-center justify-center text-slate-400 group-hover:text-[#1ED760] transition-colors">
              <Banknote size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t('cash')}</p>
              <p className="text-xl font-bold text-white group-hover:text-[#1ED760] transition-colors">₹{account?.cash_savings?.toLocaleString('en-IN') || 0}</p>
            </div>
          </div>
        </section>

      </main>

      {/* 🟢 FLOATING NAVIGATION */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[90] w-[90%] sm:w-auto">
        <nav
          className="bg-[#181818] border border-white/5 rounded-[24px] flex items-center justify-center p-1.5 shadow-[0_8px_30px_rgba(0,0,0,0.6)]"
        >
          {[
            { icon: LayoutDashboard, link: `/${locale}/dashboard`, label: t('navHome'), active: true },
            { icon: TrendingUp, link: `/${locale}/dashboard/deposit`, label: t('navSave') },
            { icon: Target, link: `/${locale}/dashboard/goal-setup`, label: t('navGoals') },
            { icon: History, link: `/${locale}/dashboard/passbook`, label: t('navHistory') },
            { icon: ShieldCheck, link: `/${locale}/dashboard/emergency`, label: 'Emergency', danger: true },
            { icon: User, link: `/${locale}/dashboard/profile`, label: 'Profile' }
          ].map((item, i) => (
            <Link key={i} href={item.link} className={`p-3.5 rounded-[18px] transition-all flex items-center gap-2 group ${item.active ? 'bg-white/10 text-white shadow-sm' : item.danger ? 'text-red-500 hover:bg-red-500/10' : 'text-[#888] hover:text-white hover:bg-white/5'}`}>
              <item.icon size={20} className={item.active ? "text-[#1ED760]" : ""} />
              <span className={`text-[10px] font-bold uppercase tracking-wider overflow-hidden transition-all duration-300 hidden sm:block ${item.active ? 'w-auto' : 'w-0 group-hover:w-auto opacity-0 group-hover:opacity-100 ml-0 group-hover:ml-1'}`}>
                {item.label}
              </span>
            </Link>
          ))}
        </nav>
      </div>

      {/* 🟢 SMART ASSISTANT */}
      <SmartAssistant
        balance={account?.main_balance || 0}
        saved={stats?.total_saved || 0}
        goals={goals || []}
        canWithdraw={(account?.main_balance || 0) > 0}
      />

    </div>
  );
}

function StreakBadge({ streak }) {
  const t = useTranslations('Dashboard');
  const displayStreak = streak ?? 0;

  return (
    <div className="card-premium bg-white/5 border-white/10 p-4 md:p-5 rounded-2xl flex items-center gap-4">
      <div className="w-10 h-10 bg-[#1ED760]/10 rounded-xl flex items-center justify-center text-[#1ED760]">
        <Zap size={20} fill="currentColor" />
      </div>
      <div>
        <p className="text-xl font-bold leading-tight">{displayStreak}</p>
        <p className="text-[9px] font-bold uppercase tracking-widest text-[#888]">{t('hourStreak')}</p>
      </div>
    </div>
  );
}