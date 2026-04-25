"use client";

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, PiggyBank, IndianRupee, Banknote, Wallet, Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';

export default function DepositPage() {
  const t = useTranslations('Deposit');
  const tCommon = useTranslations('Common');
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const goal_id = searchParams.get('goal_id');
  const goal_name = searchParams.get('goal_name');
  const urlAmount = searchParams.get('amount') || '';

  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [source, setSource] = useState(null);
  const [amount, setAmount] = useState(urlAmount);
  const [amountError, setAmountError] = useState('');

  const AMOUNT_MIN = 1;
  const AMOUNT_MAX = 1_000_000_000_000;

  const validateAmt = (val) => {
    const n = Number(val);
    if (val === '' || isNaN(n)) return 'Amount must be at least ₹1';
    if (n < AMOUNT_MIN) return 'Amount must be at least ₹1';
    if (n > AMOUNT_MAX) return 'Amount exceeds allowed limit';
    return '';
  };

  const handleAmountChange = (val) => {
    setAmount(val);
    setAmountError(validateAmt(val));
  };

  const handleDeposit = async () => {
    const err = validateAmt(amount);
    if (err) { setAmountError(err); return; }
    setLoading(true);
    try {
      const resUser = await fetch('/api/dashboard');
      const userData = await resUser.json();
      if (!userData.user) throw new Error(t('notLoggedIn'));

      const res = await fetch('/api/actions/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userData.user._id,
          amount: Number(amount),
          source,
          goal_id: goal_id || undefined
        })
      });

      const result = await res.json();
      if (result.success) {
        // Redirect back to dashboard hub
        router.push(`/${locale}/dashboard`);
      } else {
        alert(result.error);
      }
    } catch (err) {
      alert(t('failedProcess'));
    }
    setLoading(false);
  };

  if (loading && step === 2) {
    return (
      <div className="min-h-screen bg-[#0B0F0E] flex items-center justify-center">
        <div className="w-12 h-12 border-2 border-[#1ED760]/10 border-t-[#1ED760] rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F0E] text-white selection:bg-[#1ED760]/30 stagger-in p-4 md:p-12 pb-32">

      <div className="max-w-2xl mx-auto space-y-8 md:space-y-12">

        <header className="flex items-center gap-6 animate-in fade-in slide-in-from-left-4 duration-700">
          <Link href={`/${locale}/dashboard`} className="w-12 h-12 card-secondary rounded-2xl flex items-center justify-center text-slate-400 hover:text-white transition-all group">
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          </Link>
          <div>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">
              {goal_name ? t('depositTo', { name: goal_name }) : t('title')}
            </h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-2">{t('capitalInjection')}</p>
          </div>
        </header>

        <div className="card-primary p-8 md:p-14 relative overflow-hidden">

          {step === 1 && (
            <div className="animate-in fade-in zoom-in-95 duration-500">
              <div className="relative mb-10">
                <div className="relative bg-[#1ED760]/10 w-20 h-20 rounded-2xl flex items-center justify-center text-[#1ED760] border border-[#1ED760]/20">
                  <PiggyBank size={40} strokeWidth={1.5} />
                </div>
              </div>

              <div className="mb-12">
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-2 text-white">{t('selectSource')}</h2>
                <p className="text-slate-400 font-medium leading-relaxed">{t('sourceDesc')}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <button onClick={() => { setSource('cash'); setStep(2); }} className="card-secondary p-8 flex flex-col items-start gap-6 hover:border-[#1ED760]/40 hover:bg-[#1ED760]/5 transition-all text-left group">
                  <div className="p-4 bg-[#1a1a1a] text-slate-400 rounded-2xl group-hover:bg-[#1ED760] group-hover:text-black transition-all">
                    <Banknote size={28} strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white group-hover:text-[#1ED760] transition-colors mb-1">{t('sourcePhysical')}</h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{t('handheldAsset')}</p>
                  </div>
                </button>

                <button onClick={() => { setSource('bank'); setStep(2); }} className="card-secondary p-8 flex flex-col items-start gap-6 hover:border-[#1ED760]/40 hover:bg-[#1ED760]/5 transition-all text-left group">
                  <div className="p-4 bg-[#1a1a1a] text-slate-400 rounded-2xl group-hover:bg-[#1ED760] group-hover:text-black transition-all">
                    <Wallet size={28} strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white group-hover:text-[#1ED760] transition-colors mb-1">{t('sourceBank')}</h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{t('safeWalletSync')}</p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="animate-in slide-in-from-right-8 fade-in duration-500">
              <button onClick={() => setStep(1)} className="text-[10px] font-bold text-slate-500 hover:text-white uppercase tracking-widest mb-10 flex items-center gap-2 transition-colors">
                <ArrowLeft size={14} className="mb-0.5" /> {t('changeSource')}
              </button>

              <div className="mb-12">
                <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4 text-white">
                  {source === 'cash' ? t('sourcePhysical') : t('sourceBank')}
                </h2>
                <p className="text-slate-400 text-lg font-medium leading-relaxed">
                  {source === 'cash' ? t('cashPrompt') : t('bankPrompt')}
                </p>
              </div>

              <div className="space-y-10">
                <div className="space-y-4">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">{t('amountLabel')}</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-[#1ED760]">₹</span>
                    <input
                      autoFocus
                      type="number"
                      min="1"
                      value={amount}
                      onChange={e => handleAmountChange(e.target.value)}
                      className={`input-premium w-full !pl-12 pr-6 py-4 text-xl font-semibold text-white rounded-2xl border focus:ring-2 focus:ring-[#1ED760] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [appearance:textfield] ${amountError ? 'border-red-500/60 focus:border-red-500 focus:shadow-[0_0_15px_rgba(239,68,68,0.1)]' : 'border-white/10'}`}
                      placeholder="0"
                    />
                  </div>
                  {amountError && (
                    <p className="text-red-500 text-xs font-bold uppercase tracking-widest mt-2">{amountError}</p>
                  )}
                </div>

                <button
                  onClick={handleDeposit}
                  disabled={loading || !amount || !!amountError}
                  className="btn-primary w-full py-5 md:py-6 text-lg md:text-xl disabled:opacity-50 mt-8"
                >
                  {loading ? <RefreshCw className="animate-spin" /> : <>{t('saveBtn')} <ArrowRight size={24} /></>}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

function RefreshCw({ size = 24, className = "" }) {
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