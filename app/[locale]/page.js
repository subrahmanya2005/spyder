"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  PiggyBank,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  Zap
} from 'lucide-react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import LanguageSwitcher from '../../components/LanguageSwitcher';

export default function LoginPage() {
  const t = useTranslations('Login');
  const locale = useLocale();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [loginMethod, setLoginMethod] = useState('password'); // 'password' | 'otp'
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailNotFound, setEmailNotFound] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setEmailNotFound(false);
    try {
      const endpoint = loginMethod === 'password' ? '/api/auth/login' : '/api/auth/verify-otp';
      const body = loginMethod === 'password'
        ? { email, password }
        : { email, otp };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        router.push(`/${locale}/dashboard`);
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || t('loginFailed'));
      }
    } catch (err) {
      setError(t('networkError'));
    }
    setLoading(false);
  };

  const handleSendOtp = async () => {
    if (!email) { setError(t('emailRequired')); return; }
    setLoading(true);
    setError('');
    setEmailNotFound(false);
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setOtpSent(true);
      } else {
        if (data.error === 'EMAIL_NOT_FOUND') {
          setEmailNotFound(true);
        } else {
          setError(data.error || t('otpSendFailed'));
        }
      }
    } catch (err) {
      setError(t('networkError'));
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0B0F0E] text-white selection:bg-[#1ED760]/30 flex flex-col items-center justify-center p-6 stagger-in">

      <div className="w-full max-w-md relative z-10">

        {/* Branding */}
        <div className="flex flex-col items-center mb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="w-16 h-16 bg-[#1ED760]/10 border border-[#1ED760]/20 rounded-2xl flex items-center justify-center mb-6">
            <PiggyBank className="text-[#1ED760]" size={32} strokeWidth={1.5} />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white">SAVEMATE</h1>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold mt-2">{t('wealthCompanion')}</p>
        </div>

        {/* Login Card */}
        <div className="card-primary p-8 md:p-10 animate-in fade-in slide-in-from-bottom-8 duration-700">

          {/* Tabs */}
          <div className="flex p-1 bg-[#1a1a1a] rounded-xl mb-8 relative border border-white/5">
            <div
              className="absolute h-[calc(100%-8px)] bg-white/10 rounded-lg transition-all duration-300 ease-out"
              style={{
                width: 'calc(50% - 4px)',
                left: loginMethod === 'password' ? '4px' : 'calc(50%)',
              }}
            />
            <button
              type="button"
              onClick={() => { setLoginMethod('password'); setError(''); setOtpSent(false); setEmailNotFound(false); }}
              className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-widest relative z-10 transition-colors duration-300 ${loginMethod === 'password' ? 'text-white' : 'text-slate-500'}`}
            >
              {t('passwordTab')}
            </button>
            <button
              type="button"
              onClick={() => { setLoginMethod('otp'); setError(''); setEmailNotFound(false); }}
              className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-widest relative z-10 transition-colors duration-300 ${loginMethod === 'otp' ? 'text-white' : 'text-slate-500'}`}
            >
              {t('otpTab')}
            </button>
          </div>

          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold tracking-tight mb-2 text-white">
              {loginMethod === 'password' ? t('signInTitle') : (otpSent ? t('verifyLoginBtn') : t('sendOtpBtn'))}
            </h2>
            <p className="text-slate-400 text-sm font-medium">
              {loginMethod === 'password' ? t('accessDashboard') : t('secureLoginOtp')}
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-5">
              <div className="group">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest group-focus-within:text-[#1ED760] transition-colors">{t('emailLabel')}</label>
                  {otpSent && (
                    <button
                      type="button"
                      onClick={() => setOtpSent(false)}
                      className="text-[10px] font-bold text-[#1ED760] hover:underline uppercase tracking-widest transition-colors"
                    >
                      {t('changeEmail')}
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-[#1ED760] transition-colors" size={20} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setEmailNotFound(false); }}
                    disabled={otpSent}
                    className="input-premium !pl-12"
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>

              {loginMethod === 'password' ? (
                <div className="group animate-in fade-in slide-in-from-top-2 duration-500">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest group-focus-within:text-[#1ED760] transition-colors">{t('passwordLabel')}</label>
                    <Link href={`/${locale}/forgot-password`} className="text-[10px] font-bold text-slate-500 hover:text-white uppercase tracking-widest transition-colors">
                      {t('forgotPassword')}
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-[#1ED760] transition-colors" size={20} />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="input-premium !pl-12"
                      placeholder="••••••••"
                      required={loginMethod === 'password'}
                    />
                  </div>
                </div>
              ) : otpSent && (
                <div className="group animate-in fade-in slide-in-from-top-2 duration-500">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block group-focus-within:text-[#1ED760] transition-colors">{t('enterOtp')}</label>
                  <div className="relative">
                    <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-[#1ED760] transition-colors" size={20} />
                    <input
                      type="text"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      className="input-premium !pl-12 tracking-[0.5em]"
                      placeholder="000000"
                      required={loginMethod === 'otp' && otpSent}
                    />
                  </div>
                  <p className="mt-3 text-[10px] text-slate-500 font-medium">
                    {t('otpSent')} <span className="text-white">{email}</span>
                  </p>
                </div>
              )}
            </div>

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm font-semibold text-center">
                {error}
              </div>
            )}

            {emailNotFound && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-center flex flex-col items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                <p className="text-red-500 text-sm font-semibold">Email not found. New here?</p>
                <Link href={`/${locale}/signup`} className="btn-primary w-full">
                  Create Account
                </Link>
              </div>
            )}

            <button
              type="button"
              onClick={loginMethod === 'otp' && !otpSent ? handleSendOtp : handleLogin}
              disabled={loading}
              className="btn-primary w-full py-4 text-base mt-4"
            >
              {loading ? (
                <RefreshCw size={24} className="animate-spin" />
              ) : (
                <>
                  {loginMethod === 'otp' && !otpSent ? t('sendOtpBtn') : t('signInBtn')}
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-slate-400 font-medium">
              {t('noAccount')}{' '}
              <Link href={`/${locale}/signup`} className="text-white font-bold hover:underline underline-offset-4 transition-colors">
                {t('createOne')}
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-8 flex justify-center gap-8 text-slate-500 animate-in fade-in duration-1000">
          <div className="flex items-center gap-2">
            <ShieldCheck size={14} className="text-[#1ED760]/50" />
            <span className="text-[10px] font-bold uppercase tracking-widest">{t('encrypted')}</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap size={14} className="text-[#1ED760]/50" />
            <span className="text-[10px] font-bold uppercase tracking-widest">{t('realTimeSync')}</span>
          </div>
        </div>

        {/* Global Footer Elements */}
        <footer className="mt-12 flex flex-col items-center gap-6 animate-in fade-in duration-1000">
          <div className="h-px w-16 bg-white/10"></div>
          <LanguageSwitcher />
        </footer>

      </div>
    </div>
  );
}

function RefreshCw({ size, className }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
      <path d="M16 16h5v5" />
    </svg>
  );
}