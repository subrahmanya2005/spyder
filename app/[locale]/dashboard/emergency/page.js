"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, AlertTriangle, Wallet, Target, Activity, CheckCircle, Lock, Shield, ArrowRight, Loader2, ShieldCheck, CheckCircle2, Siren, AlertOctagon } from 'lucide-react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';

export default function EmergencyWithdrawalPage() {
  const t = useTranslations('Emergency');
  const tCommon = useTranslations('Common');
  const locale = useLocale();
  const router = useRouter();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const [step, setStep] = useState(1);
  const [sourceType, setSourceType] = useState('basic'); // 'basic' or 'goal'
  const [selectedGoalId, setSelectedGoalId] = useState('');
  const [amount, setAmount] = useState('');

  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [processing, setProcessing] = useState(false);
  const [simulatedOtpDisplay, setSimulatedOtpDisplay] = useState(null);
  const [amountError, setAmountError] = useState('');

  const AMOUNT_MAX = 1_000_000_000_000;

  const validateAmt = (val) => {
    const n = Number(val);
    if (val === '' || isNaN(n)) return 'Amount must be at least ₹1';
    if (n < 1) return 'Amount must be at least ₹1';
    if (n > AMOUNT_MAX) return 'Amount exceeds allowed limit';
    return '';
  };

  const handleAmountChange = (val) => {
    setAmount(val);
    setAmountError(validateAmt(val));
  };

  const fetchData = async () => {
    try {
      const res = await fetch('/api/dashboard');
      const json = await res.json();
      if (res.status === 401) return router.push(`/${locale}`);
      if (json.user) setData(json);
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getAvailableBalance = () => {
    if (!data) return 0;
    if (sourceType === 'basic') return data.account.savings_wallet;
    if (sourceType === 'goal') {
      const goal = data.goals.find(g => g._id === selectedGoalId);
      return goal ? (goal.saved_amount || 0) : 0;
    }
    return 0;
  };

  const maxAmount = getAvailableBalance();

  const handleRequestOtp = async () => {
    const err = validateAmt(amount);
    if (err) { setAmountError(err); return; }
    if (Number(amount) > maxAmount) return alert(t('insufficientFunds'));
    if (sourceType === 'goal' && !selectedGoalId) return alert(t('pleaseSelectGoal'));

    setProcessing(true);
    try {
      const res = await fetch('/api/auth/send-transaction-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: data.user._id })
      });
      const result = await res.json();
      if (result.success) {
        setOtpSent(true);
        setStep(2);
        if (result.simulatedOtp) {
          setSimulatedOtpDisplay(result.simulatedOtp);
        }
      } else {
        alert(result.error);
      }
    } catch (err) {
      alert(t('failedOtp'));
    }
    setProcessing(false);
  };

  const handleConfirmWithdrawal = async () => {
    if (!otp) return alert(t('enterOtp'));

    setProcessing(true);
    try {
      const res = await fetch('/api/actions/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: data.user._id,
          amount: Number(amount),
          otp,
          source_type: sourceType,
          goal_id: sourceType === 'goal' ? selectedGoalId : undefined
        })
      });
      const result = await res.json();
      if (result.success) {
        setStep(3); // Success Screen
      } else {
        alert(result.error);
      }
    } catch (err) {
      alert(t('failed'));
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
            <p className="text-[10px] text-[#888888] uppercase tracking-[0.3em] font-black mt-1">{t('highFriction')}</p>
          </div>
        </header>

        <div className="card-premium p-8 md:p-14 border-white/5 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#1ED760] to-[#4ade80]"></div>

          {step === 1 && (
            <div className="animate-in fade-in relative z-10">
              <div className="relative mb-10">
                <div className="absolute -inset-4 bg-[#1ED760]/20 rounded-full blur-xl animate-pulse"></div>
                <div className="relative bg-[#1ED760]/10 w-20 h-20 rounded-2xl flex items-center justify-center text-[#1ED760] border border-[#1ED760]/20">
                  <Siren size={40} strokeWidth={1.5} />
                </div>
              </div>

              <div className="card-premium border-[#1ED760]/30 bg-[#1ED760]/5 p-6 md:p-8 mb-10 flex gap-6 items-start relative overflow-hidden group">
                <div className="absolute -right-4 -top-4 w-16 h-16 bg-[#1ED760]/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-1000"></div>
                <AlertOctagon className="text-[#1ED760] shrink-0 mt-1" size={28} />
                <div className="relative z-10">
                  <h3 className="text-[#1ED760] font-black uppercase tracking-widest text-[10px] mb-2">{t('caution')}</h3>
                  <p className="text-[#888888] text-sm font-medium leading-relaxed">
                    {t('cautionMsg')}
                  </p>
                </div>
              </div>

              <div className="space-y-10">
                {/* Source Selection */}
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-[#888888] uppercase tracking-widest block">{t('withdrawFrom')}</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                      onClick={() => setSourceType('basic')}
                      className={`p-6 rounded-[24px] border text-left transition-all relative overflow-hidden group ${sourceType === 'basic' ? 'bg-[#1ED760]/10 border-[#1ED760]/50' : 'bg-white/5 border-white/5 hover:border-[#1ED760]/30'}`}
                    >
                      <div className="font-black text-white md:text-lg mb-1">{t('sourceBasic')}</div>
                      <div className="text-[10px] font-bold text-[#888888] uppercase tracking-widest">{t('available', { amount: data.account.savings_wallet.toLocaleString('en-IN') })}</div>
                      {sourceType === 'basic' && <div className="absolute top-4 right-4 w-2 h-2 bg-[#1ED760] rounded-full shadow-glow"></div>}
                    </button>
                    <button
                      onClick={() => setSourceType('goal')}
                      disabled={data.goals.length === 0}
                      className={`p-6 rounded-[24px] border text-left transition-all relative overflow-hidden group ${sourceType === 'goal' ? 'bg-[#1ED760]/10 border-[#1ED760]/50' : 'bg-white/5 border-white/5 hover:border-[#1ED760]/30'} disabled:opacity-30 disabled:cursor-not-allowed`}
                    >
                      <div className="font-black text-white md:text-lg mb-1">{t('sourceGoal')}</div>
                      <div className="text-[10px] font-bold text-[#888888] uppercase tracking-widest">{t('breakGoal')}</div>
                      {sourceType === 'goal' && <div className="absolute top-4 right-4 w-2 h-2 bg-[#1ED760] rounded-full shadow-glow"></div>}
                    </button>
                  </div>
                </div>

                {/* Goal Selection Dropdown (if goal selected) */}
                {sourceType === 'goal' && data.goals.length > 0 && (
                  <div className="animate-in slide-in-from-top-4 fade-in duration-500 space-y-4">
                    <label className="text-[10px] font-black text-[#888888] uppercase tracking-widest block">{t('selectGoal')}</label>
                    <div className="relative">
                      <Target className="absolute left-6 top-1/2 -translate-y-1/2 text-[#1ED760] opacity-50" size={20} />
                      <select
                        value={selectedGoalId}
                        onChange={(e) => setSelectedGoalId(e.target.value)}
                        className="w-full bg-white/5 border border-white/5 rounded-[24px] pl-14 pr-6 py-4 text-white focus:outline-none focus:border-[#1ED760]/30 transition-all font-bold appearance-none"
                      >
                        <option value="" disabled className="bg-[#0B0B0B]">{t('chooseGoal')}</option>
                        {data.goals.map(goal => (
                          <option key={goal._id} value={goal._id} className="bg-[#0B0B0B]">
                            {goal.name} (₹{(goal.saved_amount || 0).toLocaleString('en-IN')})
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                        <ArrowRight size={16} className="rotate-90" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Amount Input */}
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <label className="text-[10px] font-black text-[#888888] uppercase tracking-widest block">{t('amountLabel')}</label>
                    <span className="text-[10px] font-black text-[#1ED760] uppercase tracking-widest">{t('maxAmount', { amount: maxAmount.toLocaleString('en-IN') })}</span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-[#1ED760]">₹</span>
                    <input
                      type="number"
                      min="1"
                      max={maxAmount}
                      value={amount}
                      onChange={e => handleAmountChange(e.target.value)}
                      className={`input-premium w-full !pl-12 pr-24 py-4 text-xl font-semibold text-white rounded-2xl border focus:ring-2 focus:ring-[#1ED760] transition-all [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [appearance:textfield] ${amountError ? 'border-red-500/60 focus:border-red-500' : 'border-white/10 focus:border-[#1ED760]'}`}
                      placeholder="0"
                    />
                    <button
                      onClick={() => { setAmount(maxAmount.toString()); setAmountError(''); }}
                      className="absolute right-6 top-1/2 -translate-y-1/2 px-4 py-2 bg-white/5 text-[10px] font-black text-white rounded-xl hover:bg-white/10 transition-all uppercase tracking-widest"
                    >
                      MAX
                    </button>
                  </div>
                  {amountError && (
                    <p className="text-red-400 text-xs font-black uppercase tracking-widest mt-2">{amountError}</p>
                  )}
                </div>

                <button
                  onClick={handleRequestOtp}
                  disabled={processing || !amount || !!amountError || Number(amount) <= 0 || Number(amount) > maxAmount}
                  className="btn-bounce w-full bg-[#1ED760] text-black font-black py-5 md:py-6 rounded-2xl flex items-center justify-center gap-3 shadow-glow transition-all text-lg md:text-xl disabled:opacity-50"
                >
                  {processing ? <RefreshCwIcon className="animate-spin" /> : <>{t('withdrawBtn')} <ArrowRight size={24} strokeWidth={3} /></>}
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="animate-in slide-in-from-right-8 fade-in duration-500 text-center relative z-10">
              <div className="relative mb-10 mx-auto w-24">
                <div className="absolute -inset-4 bg-[#1ED760]/20 rounded-full blur-xl animate-pulse"></div>
                <div className="relative bg-[#1ED760]/10 w-24 h-24 rounded-[32px] flex items-center justify-center text-[#1ED760] border border-[#1ED760]/20 mx-auto">
                  <ShieldCheck size={48} strokeWidth={1.5} />
                </div>
              </div>

              <h2 className="text-3xl md:text-5xl font-black tracking-tighter mb-4">{t('otpTitle')}</h2>
              <p className="text-[#888888] text-lg font-medium mb-2">{t('otpMsg')}</p>
              <p className="text-[#1ED760] text-sm font-black uppercase tracking-widest mb-10">{t('authMsg', { amount: Number(amount).toLocaleString('en-IN') })}</p>

              {simulatedOtpDisplay && (
                <div className="mb-10 p-5 glass border-[#1ED760]/20 rounded-[24px] inline-block mx-auto text-left relative overflow-hidden group">
                  <div className="absolute -right-4 -top-4 w-12 h-12 bg-[#1ED760]/5 rounded-full blur-xl"></div>
                  <p className="text-[9px] text-[#888888] uppercase tracking-[0.3em] font-black mb-2">{t('demoMode')}</p>
                  <p className="text-sm text-[#888888] font-medium">{t('emailOtp')} <strong className="text-white bg-white/5 px-3 py-1.5 rounded-lg tracking-[0.5em] ml-2 font-black">{simulatedOtpDisplay}</strong></p>
                </div>
              )}

              <div className="max-w-xs mx-auto mb-12">
                <input
                  autoFocus
                  type="text"
                  maxLength={4}
                  value={otp}
                  onChange={e => setOtp(e.target.value)}
                  className="w-full bg-white/5 border border-white/5 rounded-[24px] py-6 text-center text-5xl tracking-[0.5em] font-black text-white focus:outline-none focus:border-[#1ED760]/30 transition-all placeholder:text-white/5"
                  placeholder="0000"
                />
              </div>

              <button
                onClick={handleConfirmWithdrawal}
                disabled={processing || otp.length !== 4}
                className="btn-bounce w-full bg-[#1ED760] text-black font-black py-5 md:py-6 rounded-2xl shadow-glow transition-all text-lg md:text-xl disabled:opacity-50"
              >
                {processing ? <RefreshCwIcon className="animate-spin" /> : t('verifyBtn')}
              </button>

              <button onClick={() => setStep(1)} className="mt-8 text-[10px] font-black text-[#888888] hover:text-white uppercase tracking-widest transition-colors">
                {t('cancel')}
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="animate-in zoom-in-95 text-center relative z-10 py-8">
              <div className="relative mb-10 mx-auto w-24">
                <div className="absolute -inset-6 bg-[#1ED760]/20 rounded-full blur-2xl animate-pulse"></div>
                <div className="relative bg-[#1ED760]/10 w-24 h-24 rounded-full flex items-center justify-center text-[#1ED760] border border-[#1ED760]/30 mx-auto">
                  <CheckCircle2 size={56} strokeWidth={3} />
                </div>
              </div>
              <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-4">{t('successTitle')}</h2>
              <p className="text-[#888888] text-lg font-medium mb-12 max-w-md mx-auto">{t('successMsg', { amount: Number(amount).toLocaleString('en-IN') })}</p>
              <Link href={`/${locale}/dashboard`} className="btn-bounce py-5 px-12 bg-white text-black font-black rounded-2xl shadow-premium text-lg">
                {tCommon('returnBtn')}
              </Link>
            </div>
          )}

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