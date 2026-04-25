"use client";

import { useState } from 'react';
import { Mail, ArrowLeft, Activity, Shield, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';

export default function ForgotPasswordPage() {
  const t = useTranslations('ForgotPassword');
  const locale = useLocale();
  const [email, setEmail]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [sent, setSent]         = useState(false);
  const [error, setError]       = useState('');
  const [simulatedUrl, setSimulatedUrl] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res  = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      if (data.simulatedUrl) setSimulatedUrl(data.simulatedUrl);
      setSent(true);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F0E] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="card-primary w-full max-w-md p-8 relative z-10 animate-in slide-in-from-bottom-4 duration-500">
        
        <Link href={`/${locale}`} className="inline-flex items-center gap-2 text-slate-500 hover:text-white text-[10px] font-bold uppercase tracking-widest transition-colors mb-8">
          <ArrowLeft size={16} /> {t('backToLogin')}
        </Link>

        {!sent ? (
          <>
            <div className="mb-8">
              <div className="w-12 h-12 bg-[#1ED760]/10 border border-[#1ED760]/20 rounded-xl flex items-center justify-center mb-4">
                <Shield className="text-[#1ED760]" size={24} />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">{t('title')}</h1>
              <p className="text-slate-400 text-sm font-medium">
                {t('description')}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{t('emailLabel')}</label>
                <div className="relative">
                   <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input
                    type="email" required autoFocus
                    value={email} onChange={e => setEmail(e.target.value)}
                    className="input-premium pl-12"
                    placeholder={t('emailPlaceholder')}
                  />
                </div>
              </div>

              {error && (
                <div className="text-red-500 text-sm bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-xl font-semibold">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !email}
                className="btn-primary w-full py-4 text-sm disabled:opacity-50"
              >
                {loading ? <Activity size={20} className="animate-spin" /> : t('sendBtn')}
              </button>
            </form>
          </>
        ) : (
          <div className="text-center py-4 animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-[#1ED760]/10 border border-[#1ED760]/20 text-[#1ED760] rounded-xl flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={32} />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">{t('checkInbox')}</h2>
            <p className="text-slate-400 text-sm font-medium mb-8">
              {t('inboxMsg', {email: email})}
            </p>

            {simulatedUrl && (
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-500 text-xs text-left mb-6 font-medium">
                <p className="font-bold mb-1">{t('demoMode')}</p>
                <p className="break-all">{t('resetUrl')} <span className="underline">{simulatedUrl}</span></p>
              </div>
            )}

            <Link href={`/${locale}`} className="btn-secondary w-full py-3.5 text-sm">
              {t('returnToLogin')}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
