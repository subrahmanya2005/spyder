"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Banknote, ArrowLeft, ArrowRight, Loader2, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';

export default function EditCashPage() {
  const t = useTranslations('SyncCash');
  const tCommon = useTranslations('Common');
  const locale = useLocale();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [amount, setAmount] = useState('');

  const fetchData = async () => {
    try {
      const res = await fetch('/api/dashboard');
      const json = await res.json();
      if (res.status === 401) return router.push(`/${locale}`);
      if (json.user) {
        setData(json);
        setAmount(json.account.cash_savings.toString());
      }
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdate = async () => {
    if (amount === '' || Number(amount) < 0) return;
    setProcessing(true);
    try {
      const res = await fetch('/api/actions/edit-cash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: data.user._id,
          amount: Number(amount)
        })
      });

      const result = await res.json();
      if (result.success) {
        router.push(`/${locale}/dashboard`);
      } else {
        alert(result.error);
      }
    } catch (err) {
      alert("Failed to update cash balance");
    }
    setProcessing(false);
  };

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-[#0B0B0B] flex items-center justify-center">
        <div className="w-12 h-12 border-2 border-[#1ED760]/10 border-t-[#1ED760] rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-white selection:bg-[#1ED760]/30 stagger-in p-4 md:p-12 pb-32">

      <div className="max-w-2xl mx-auto space-y-8 md:space-y-12">

        <header className="flex items-center gap-6 animate-in fade-in slide-in-from-left-4 duration-700">
          <Link href={`/${locale}/dashboard`} className="w-12 h-12 glass rounded-2xl flex items-center justify-center text-gray-400 hover:text-[#1ED760] hover:border-[#1ED760]/30 transition-all group">
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          </Link>
          <div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tighter">{t('title')}</h1>
            <p className="text-[10px] text-[#888888] uppercase tracking-[0.3em] font-black mt-1">Tactical Asset Sync</p>
          </div>
        </header>

        <div className="card-premium p-8 md:p-14 border-white/5 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#1ED760] to-[#4ade80]"></div>

          <div className="animate-in fade-in relative z-10">
            <div className="relative mb-10">
              <div className="absolute -inset-4 bg-[#1ED760]/20 rounded-full blur-xl animate-pulse"></div>
              <div className="relative bg-[#1ED760]/10 w-20 h-20 rounded-2xl flex items-center justify-center text-[#1ED760] border border-[#1ED760]/20">
                <RefreshCwIcon size={40} strokeWidth={1.5} className="animate-spin-slow" />
              </div>
            </div>

            <div className="mb-12">
              <h2 className="text-2xl md:text-3xl font-black tracking-tight mb-2">Sync Physical Balance</h2>
              <p className="text-[#888888] font-medium leading-relaxed">
                {t('description')}
              </p>
            </div>

            <div className="space-y-10">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-[#888888] uppercase tracking-widest block">{t('amountLabel')}</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-[#1ED760]">₹</span>
                  <input
                    autoFocus
                    type="number"
                    min="0"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    className="input-premium w-full !pl-12 pr-6 py-4 text-xl font-semibold text-white rounded-2xl border border-white/10 focus:border-[#1ED760] focus:ring-2 focus:ring-[#1ED760] transition-all [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [appearance:textfield]"
                    placeholder="0"
                  />
                </div>
              </div>

              <button
                onClick={handleUpdate}
                disabled={processing || amount === '' || Number(amount) < 0}
                className="btn-bounce w-full bg-[#1ED760] text-black font-black py-5 md:py-6 rounded-2xl flex items-center justify-center gap-3 shadow-glow transition-all text-lg md:text-xl disabled:opacity-50"
              >
                {processing ? <RefreshCwIcon className="animate-spin" /> : <>{t('updateBtn')} <ArrowRight size={24} strokeWidth={3} /></>}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RefreshCwIcon({ size = 24, className = "" }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
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