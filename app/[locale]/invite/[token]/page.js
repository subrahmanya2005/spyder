"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Target, Loader2, Users, Home, CheckCircle2, ShieldCheck, Zap } from 'lucide-react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';

export default function InvitePage() {
  const t = useTranslations('Invite');
  const locale = useLocale();
  const router = useRouter();
  const params = useParams();
  const token = params.token;

  const [goal, setGoal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAccepting, setIsAccepting] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch('/api/dashboard');
        const data = await res.json();
        if (data.user) setIsLoggedIn(true);
      } catch (err) {}
    };
    checkSession();
  }, []);

  useEffect(() => {
    const fetchInviteDetails = async () => {
      try {
        const res = await fetch(`/api/goals/invite?token=${token}`);
        const data = await res.json();
        if (data.success) {
          setGoal(data.goal);
        } else {
          setError(data.error || t('notFoundMsg'));
        }
      } catch (err) {
        setError(t('notFoundMsg'));
      }
      setLoading(false);
    };
    if (token) fetchInviteDetails();
  }, [token]);

  const handleAccept = async () => {
    setIsAccepting(true);
    try {
      const res = await fetch('/api/goals/accept-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invite_token: token })
      });
      const data = await res.json();
      if (data.success) {
        setAccepted(true);
        setTimeout(() => router.push(`/${locale}/dashboard`), 1800);
      } else {
        alert(data.error);
        setIsAccepting(false);
      }
    } catch (err) {
      alert('Failed to accept invite.');
      setIsAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B0B0B]">
        <div className="w-12 h-12 border-2 border-[#1ED760]/10 border-t-[#1ED760] rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0B0B0B] p-4 text-center">
        <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center mb-6 border border-red-500/20">
          <Target size={32} />
        </div>
        <h1 className="text-3xl font-black text-white mb-2 tracking-tighter">{t('notFoundTitle')}</h1>
        <p className="text-gray-500 mb-8 max-w-sm font-medium">{error}</p>
        <Link
          href={`/${locale}`}
          className="px-8 py-4 bg-[#121212] hover:bg-white/10 text-white font-black rounded-2xl transition-all border border-white/5"
        >
          {t('goHome')}
        </Link>
      </div>
    );
  }

  if (accepted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0B0B0B] p-4 text-center">
        <div className="w-24 h-24 bg-[#1ED760]/10 text-[#1ED760] rounded-full flex items-center justify-center mb-6 border border-[#1ED760]/20 shadow-[0_0_40px_rgba(30,215,96,0.2)] animate-pulse">
          <CheckCircle2 size={44} />
        </div>
        <h1 className="text-4xl font-black text-white tracking-tighter mb-2">Authorization Confirmed</h1>
        <p className="text-gray-400 font-medium">Redirecting to your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B0B0B] p-4 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-[#1ED760]/5 rounded-full blur-[120px] pointer-events-none" />

      <div
        className="w-full max-w-md relative z-10 rounded-[32px] p-8 border border-white/5 text-center"
        style={{ background: 'linear-gradient(135deg, #121212 0%, #0D0D0D 100%)', boxShadow: '0 40px 80px -20px rgba(0,0,0,0.8)' }}
      >
        {/* Top bar */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#1ED760] to-[#4ade80] rounded-t-[32px]" />

        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 bg-black border border-[#1ED760]/30 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(30,215,96,0.2)]">
            <ShieldCheck className="text-[#1ED760]" size={20} />
          </div>
          <span className="text-lg font-black text-[#1ED760] tracking-tighter">SAVEMATE</span>
        </div>

        {/* Icon */}
        <div className="w-20 h-20 bg-[#1ED760]/10 border border-[#1ED760]/20 text-[#1ED760] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(30,215,96,0.15)]">
          <Users size={36} />
        </div>

        <p className="text-[10px] font-black text-[#1ED760] uppercase tracking-[0.3em] mb-2">{t('title')}</p>
        <h1 className="text-2xl md:text-3xl font-black text-white mb-2 leading-tight tracking-tighter">
          {t('invitedBy', { name: goal.owner_name })}
        </h1>

        {/* Goal Card */}
        <div
          className="my-6 p-6 rounded-[24px] border border-[#1ED760]/20 text-left relative overflow-hidden"
          style={{ background: 'rgba(30,215,96,0.04)' }}
        >
          <div className="absolute top-0 right-0 -mt-6 -mr-6 opacity-5 text-[#1ED760]">
            <Target size={100} />
          </div>
          <p className="text-[10px] font-black text-[#888888] uppercase tracking-widest mb-1">{t('targetGoal')}</p>
          <h3 className="text-xl font-black text-white break-words tracking-tight mb-1">{goal.name}</h3>
          <p className="text-[#1ED760] font-bold text-sm">
            {t('targetAmount', { amount: goal.target_amount.toLocaleString('en-IN') })}
          </p>
        </div>

        {/* Action Buttons */}
        {isLoggedIn ? (
          <div className="space-y-3">
            <button
              onClick={handleAccept}
              disabled={isAccepting}
              className="w-full py-4 bg-[#1ED760] text-black font-black rounded-2xl flex items-center justify-center gap-2 transition-all shadow-[0_10px_30px_rgba(30,215,96,0.3)] hover:shadow-[0_20px_40px_rgba(30,215,96,0.4)] active:scale-95 disabled:opacity-50 text-base uppercase tracking-widest"
            >
              {isAccepting
                ? <><Loader2 size={20} className="animate-spin" /> Joining...</>
                : <><Zap size={20} fill="#000" /> {t('acceptBtn')}</>
              }
            </button>
            <button
              onClick={() => router.push(`/${locale}/dashboard`)}
              className="w-full py-3 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white font-black rounded-2xl flex items-center justify-center gap-2 transition-all border border-white/5 text-sm uppercase tracking-widest"
            >
              Decline
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-200/90 text-sm text-left font-medium">
              {t('loginRequired')}
            </div>
            <Link
              href={`/${locale}`}
              onClick={() => sessionStorage.setItem('postLoginRedirect', `/invite/${token}`)}
              className="w-full py-4 bg-[#1ED760] text-black font-black rounded-2xl flex items-center justify-center gap-2 transition-all shadow-glow uppercase tracking-widest"
            >
              <Home size={18} /> {t('goToLogin')}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
