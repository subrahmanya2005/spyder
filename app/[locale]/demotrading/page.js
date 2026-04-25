"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Activity, ShieldCheck, CheckCircle2, Building, TrendingUp, Wallet, X, Loader2, CreditCard, Landmark, Smartphone } from 'lucide-react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';

const INVESTMENT_OPTIONS = {
  stocks: [
    { id: 'stk_1', name: 'BluePeak Capital', tagline: 'Trusted by 10K+ investors', price: '₹3,450.00', growth: '+12.4%', risk_level: 'High', color: '#3B82F6' },
    { id: 'stk_2', name: 'NovaGrowth Funds', tagline: 'Consistent high returns', price: '₹22,514.65', growth: '+8.2%', risk_level: 'High', color: '#3B82F6' },
    { id: 'stk_3', name: 'Zenith Wealth', tagline: 'Diversified global assets', price: '₹1,240.50', growth: '+15.1%', risk_level: 'High', color: '#3B82F6' },
    { id: 'stk_4', name: 'Apex Equity', tagline: 'Top-tier performance', price: '₹2,105.20', growth: '+9.3%', risk_level: 'High', color: '#3B82F6' },
  ],
  funds: [
    { id: 'mf_1', name: 'GreenLine Investments', tagline: 'Sustainable growth focus', price: 'NAV ₹45.20', growth: '+9.1%', risk_level: 'Medium', color: '#3B82F6' },
    { id: 'mf_2', name: 'Orbit Mutuals', tagline: 'Market leading stability', price: 'NAV ₹112.50', growth: '+6.5%', risk_level: 'Low', color: '#3B82F6' },
    { id: 'mf_3', name: 'Vanguard Alpha', tagline: 'Expertly managed portfolio', price: 'NAV ₹88.40', growth: '+11.2%', risk_level: 'Medium', color: '#3B82F6' },
    { id: 'mf_4', name: 'Horizon Wealth', tagline: 'Long-term value creation', price: 'NAV ₹62.15', growth: '+14.5%', risk_level: 'Medium', color: '#3B82F6' },
  ]
};

const MiniChart = ({ color }) => {
  const isBlue = color === '#3B82F6';
  const shadowColor = isBlue ? 'rgba(59, 130, 246, 0.4)' : 'rgba(30, 215, 96, 0.4)';

  return (
    <svg viewBox="0 0 100 30" className="w-full h-12 overflow-visible">
      <defs>
        <linearGradient id={`grad-${color.replace('#', '')}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
        <filter id={`glow-${color.replace('#', '')}`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      <path
        d="M0,25 C20,20 30,28 50,15 C60,8 70,18 80,10 C90,5 95,2 100,0"
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        filter={`url(#glow-${color.replace('#', '')})`}
        style={{ filter: `drop-shadow(0 4px 6px ${shadowColor})` }}
      />
      <path
        d="M0,25 C20,20 30,28 50,15 C60,8 70,18 80,10 C90,5 95,2 100,0 L100,30 L0,30 Z"
        fill={`url(#grad-${color.replace('#', '')})`}
      />
    </svg>
  );
};

export default function InvestmentPage() {
  const t = useTranslations('DemoTrading');
  const locale = useLocale();
  const router = useRouter();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState('stocks'); // 'stocks' | 'funds'

  // Modal states
  const [selectedItem, setSelectedItem] = useState(null);
  const [amount, setAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/dashboard');
        const json = await res.json();
        if (json.user) {
          setData(json);
        }
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleInvestSubmit = async (e) => {
    e.preventDefault();
    if (!selectedItem || !amount || Number(amount) < 100) return;

    setIsProcessing(true);
    try {
      const res = await fetch('/api/actions/partner-invest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Number(amount),
          risk_level: selectedItem.risk_level
        }),
      });
      const result = await res.json();

      if (result.error) {
        alert(result.error);
        setIsProcessing(false);
      } else {
        // Success
        setSuccess(true);
        setIsProcessing(false);
        // Refresh wallet balance
        const resDash = await fetch('/api/dashboard');
        const jsonDash = await resDash.json();
        if (jsonDash.user) setData(jsonDash);
      }
    } catch (err) {
      alert("Payment failed");
      setIsProcessing(false);
    }
  };

  const walletBalance = data?.account?.main_balance || 0;
  const numAmount = Number(amount) || 0;
  const isValidAmount = numAmount >= 100 && numAmount <= walletBalance;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0F0E] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#1ED760] w-12 h-12" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F0E] text-white p-4 md:p-8 pb-32 animate-in fade-in duration-500">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Header */}
        <header className="flex items-center gap-6">
          <Link href={`/${locale}/dashboard`} className="w-12 h-12 card-secondary rounded-2xl flex items-center justify-center text-slate-400 hover:text-white transition-all group shrink-0">
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          </Link>
          <div>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">Partner Investments</h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-2">Premium Partner Ecosystem</p>
          </div>
        </header>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-white/10 pb-4 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('stocks')}
            className={`text-lg font-bold px-4 py-2 transition-colors relative whitespace-nowrap ${activeTab === 'stocks' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Stocks & ETFs
            {activeTab === 'stocks' && <div className="absolute -bottom-4 left-0 w-full h-0.5 bg-[#3B82F6] rounded-t-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>}
          </button>
          <button
            onClick={() => setActiveTab('funds')}
            className={`text-lg font-bold px-4 py-2 transition-colors relative whitespace-nowrap ${activeTab === 'funds' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Mutual Funds
            {activeTab === 'funds' && <div className="absolute -bottom-4 left-0 w-full h-0.5 bg-[#3B82F6] rounded-t-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>}
          </button>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in slide-in-from-bottom-4 duration-500">
          {INVESTMENT_OPTIONS[activeTab].map((item) => (
            <div key={item.id} className="card-secondary p-6 flex flex-col justify-between group hover:-translate-y-1 transition-all duration-300 hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)] border-white/5 hover:border-[#3B82F6]/30 bg-[#121212]">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-xl bg-[#1a1a1a] flex items-center justify-center text-slate-400 group-hover:text-[#3B82F6] transition-colors border border-white/5">
                    {activeTab === 'stocks' ? <TrendingUp size={20} /> : <Building size={20} />}
                  </div>
                  <span className="text-[10px] font-extrabold text-[#3B82F6] bg-[#3B82F6]/10 px-2.5 py-1 rounded-full border border-[#3B82F6]/20">{item.growth}</span>
                </div>
                <h3 className="text-lg font-extrabold text-white mb-1 tracking-tight">{item.name}</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-6 flex items-center gap-1.5">
                  <ShieldCheck size={12} className="text-[#3B82F6]" /> {item.tagline}
                </p>
              </div>

              {/* Line Graph */}
              <div className="w-full h-16 mb-6 opacity-80 group-hover:opacity-100 transition-opacity">
                <MiniChart color={item.color} />
              </div>

              <div className="flex items-end justify-between mt-auto">
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{activeTab === 'stocks' ? 'Price' : 'NAV'}</p>
                  <p className="text-base font-extrabold text-white">{item.price}</p>
                </div>
                <button
                  onClick={() => { setSelectedItem(item); setAmount(''); setSuccess(false); }}
                  className="bg-[#3B82F6] hover:bg-[#2563EB] text-white px-5 py-2.5 rounded-xl text-sm font-extrabold shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all active:scale-95"
                >
                  Invest
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Invest Modal */}
      {selectedItem && !success && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200 overflow-y-auto">
          <div className="card-primary w-full max-w-lg p-6 md:p-8 relative animate-in zoom-in-95 duration-300 my-8">
            <button
              onClick={() => setSelectedItem(null)}
              className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors bg-[#1a1a1a] p-2 rounded-full"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-[#3B82F6]/10 flex items-center justify-center text-[#3B82F6]">
                {activeTab === 'stocks' ? <TrendingUp size={16} /> : <Building size={16} />}
              </div>
              <h2 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">{selectedItem.name}</h2>
            </div>
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mb-8 flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-[#3B82F6]" /> {selectedItem.tagline}
            </p>

            <form onSubmit={handleInvestSubmit} className="space-y-6">
              {/* Amount Input */}
              <div className="bg-[#121212] p-6 rounded-2xl border border-white/5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4 block">Investment Amount</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-[#3B82F6]">₹</span>
                  <input
                    type="number"
                    autoFocus
                    required
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    className="input-premium w-full !pl-12 pr-6 py-4 text-xl font-semibold text-white rounded-2xl border border-white/10 focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6] transition-all [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [appearance:textfield]"
                    placeholder="0"
                  />
                </div>
                {amount && !isValidAmount && (
                  <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest mt-3 flex items-center gap-1">
                    <X size={12} /> {numAmount < 100 ? 'Minimum amount is ₹100' : 'Insufficient wallet balance'}
                  </p>
                )}
              </div>

              {/* Payment Methods */}
              <div className="space-y-3 pt-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Select Payment Method</p>

                {/* SaveMate Wallet (Highlighted & Selected) */}
                <div className="border border-[#1ED760]/40 bg-[#1ED760]/5 rounded-2xl p-5 relative overflow-hidden cursor-pointer shadow-[0_0_20px_rgba(30,215,96,0.1)] group transition-all">
                  <div className="absolute top-0 right-0 bg-[#1ED760] text-black text-[9px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-bl-xl shadow-lg">Recommended</div>

                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-[#1ED760]/20 rounded-full flex items-center justify-center text-[#1ED760] border border-[#1ED760]/30 shadow-[0_0_15px_rgba(30,215,96,0.2)]">
                      <Wallet size={24} />
                    </div>
                    <div>
                      <p className="font-extrabold text-white text-lg">SaveMate Wallet</p>
                      <p className="text-xs text-[#1ED760] font-bold">Balance: ₹{walletBalance.toLocaleString('en-IN')}</p>
                    </div>
                  </div>

                  <div className="space-y-2 ml-[4.5rem]">
                    <p className="text-xs text-slate-300 flex items-center gap-2 font-medium"><CheckCircle2 size={14} className="text-[#1ED760]" /> Zero fees</p>
                    <p className="text-xs text-slate-300 flex items-center gap-2 font-medium"><CheckCircle2 size={14} className="text-[#1ED760]" /> Instant processing</p>
                    <p className="text-xs text-slate-300 flex items-center gap-2 font-medium"><CheckCircle2 size={14} className="text-[#1ED760]" /> No external redirection</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#1ED760]/20 flex justify-between items-center ml-[4.5rem]">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Powered by SaveMate</span>
                  </div>
                </div>

                {/* Other Disabled Methods */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                  {[
                    { name: 'UPI', icon: Smartphone },
                    { name: 'Credit / Debit', icon: CreditCard },
                    { name: 'Net Banking', icon: Landmark }
                  ].map((method) => (
                    <div key={method.name} className="border border-white/5 bg-[#121212] rounded-xl p-4 flex justify-between items-center opacity-40 cursor-not-allowed">
                      <div className="flex items-center gap-3">
                        <method.icon size={16} className="text-slate-500" />
                        <p className="font-bold text-slate-500 text-sm">{method.name}</p>
                      </div>
                      <span className="bg-white/5 text-slate-400 text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded">Soon</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={isProcessing || !isValidAmount}
                className="btn-primary w-full py-5 text-lg disabled:opacity-50 flex items-center justify-center gap-2 mt-6 shadow-[0_0_20px_rgba(30,215,96,0.3)]"
              >
                {isProcessing ? <Loader2 className="animate-spin" size={24} /> : <><ShieldCheck size={24} /> Pay ₹{numAmount > 0 ? numAmount.toLocaleString('en-IN') : '0'}</>}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {success && selectedItem && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="card-primary w-full max-w-md p-10 text-center relative animate-in zoom-in-95 duration-300 border-[#1ED760]/30 shadow-[0_0_50px_rgba(30,215,96,0.15)] bg-[#121212]">
            <div className="w-20 h-20 bg-[#1ED760]/10 text-[#1ED760] rounded-full flex items-center justify-center mx-auto mb-6 border border-[#1ED760]/20 shadow-[0_0_30px_rgba(30,215,96,0.2)]">
              <CheckCircle2 size={40} />
            </div>
            <h2 className="text-3xl font-extrabold text-white mb-2 tracking-tight">Investment Completed</h2>
            <p className="text-slate-300 font-medium mb-6 text-lg">
              You have successfully invested <span className="text-[#1ED760] font-extrabold">₹{Number(amount).toLocaleString('en-IN')}</span> in <span className="text-white font-extrabold">{selectedItem.name}</span>.
            </p>

            <div className="bg-[#1a1a1a] border border-white/5 rounded-xl p-4 mb-8">
              <p className="text-xs text-slate-400 font-medium flex items-center justify-center gap-2">
                <CheckCircle2 size={14} className="text-[#1ED760]" /> Processed instantly via SaveMate Wallet
              </p>
            </div>

            <button
              onClick={() => {
                setSuccess(false);
                setSelectedItem(null);
                setAmount('');
              }}
              className="btn-primary w-full py-4"
            >
              Done
            </button>
          </div>
        </div>
      )}

    </div>
  );
}