"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Target, IndianRupee, Activity, CheckCircle, ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';

export default function GoalSetupPage() {
  const t = useTranslations('GoalSetup');
  const tCommon = useTranslations('Common');
  const locale = useLocale();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    target_amount: '',
    duration_days: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // We need user_id, fetch from dashboard endpoint first
      const resUser = await fetch('/api/dashboard');
      const userData = await resUser.json();
      if (!userData.user) throw new Error("Not logged in");

      const res = await fetch('/api/actions/create-goal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          user_id: userData.user._id,
          ...formData
        })
      });
      
      const result = await res.json();
      if (result.success) {
        // Redirect to the new goal details page
        router.push(`/${locale}/dashboard/goal-details/${result.goal._id}`);
      } else {
        alert(result.error);
      }
    } catch (err) {
      alert(t('failed'));
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0B0F0E] text-white selection:bg-[#1ED760]/30 stagger-in p-4 md:p-12 pb-32">
      
      <div className="max-w-2xl mx-auto space-y-8 md:space-y-12">
        
        <header className="flex items-center gap-6 animate-in fade-in slide-in-from-left-4 duration-700">
          <Link href={`/${locale}/dashboard`} className="w-12 h-12 card-secondary rounded-2xl flex items-center justify-center text-slate-400 hover:text-white transition-all group">
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          </Link>
          <div>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">{t('title')}</h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-2">Strategic Objective</p>
          </div>
        </header>

        <div className="card-primary p-8 md:p-14 relative overflow-hidden">
          
          <div className="relative z-10">
            <div className="relative mb-10">
              <div className="w-20 h-20 rounded-2xl bg-[#1ED760]/10 border border-[#1ED760]/20 flex items-center justify-center text-[#1ED760]">
                <Target size={40} strokeWidth={1.5} />
              </div>
            </div>
            
            <div className="mb-10 md:mb-12">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-2 text-white">Define Your Vision</h2>
              <p className="text-slate-400 font-medium leading-relaxed">
                Set a target and we&apos;ll help you reach it with smart daily suggestions and tracking.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">{t('nameLabel')}</label>
                <input 
                  required 
                  type="text" 
                  value={formData.name} 
                  onChange={e=>setFormData({...formData, name: e.target.value})} 
                  className="input-premium px-6 py-4 text-lg" 
                  placeholder={t('namePlaceholder')} 
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">{t('targetLabel')}</label>
                <div className="relative">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-xl font-bold text-[#1ED760]">₹</span>
                  <input 
                    required 
                    type="number" 
                    min="1" 
                    value={formData.target_amount} 
                    onChange={e=>setFormData({...formData, target_amount: e.target.value})} 
                    className="input-premium pl-12 pr-6 py-4 text-xl" 
                    placeholder="0" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Duration (Days)</label>
                <input 
                  required 
                  type="number" 
                  min="1" 
                  value={formData.duration_days} 
                  onChange={e=>setFormData({...formData, duration_days: e.target.value})} 
                  className="input-premium px-6 py-4 text-lg" 
                  placeholder="e.g. 180" 
                />
              </div>

              <button 
                disabled={loading} 
                type="submit" 
                className="btn-primary w-full py-5 text-lg mt-8 disabled:opacity-50"
              >
                {loading ? <RefreshCwIcon className="animate-spin" /> : <>{t('createBtn')} <ArrowRight size={20} /></>}
              </button>
            </form>
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
