"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Target, Activity, Users, ArrowLeft, Trash2, Link as LinkIcon, CheckCircle, IndianRupee, Clock, ArrowRight, TrendingUp, AlertTriangle, Check, Copy, Gift, Sparkles, X, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { io } from 'socket.io-client';
import { useTranslations, useLocale } from 'next-intl';

export default function GoalDetailsPage() {
  const t = useTranslations('GoalDetails');
  const tCommon = useTranslations('Common');
  const locale = useLocale();
  const router = useRouter();
  const params = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [emailToast, setEmailToast] = useState(null);

  // Goal-claim (OTP) state
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [claimStep, setClaimStep] = useState('idle'); // idle | sending | otp | verifying | success
  const [claimOtp, setClaimOtp] = useState('');
  const [claimError, setClaimError] = useState('');
  const [claimedAmount, setClaimedAmount] = useState(0);
  const [devOtp, setDevOtp] = useState(''); // shown in dev only

  const fetchData = async () => {
    try {
      const res = await fetch('/api/dashboard');
      const json = await res.json();
      if (res.status === 401) return router.push(`/${locale}`);
      
      if (json.goals) {
        // Find the specific goal from the array
        const activeGoal = json.goals.find(g => g._id === params.id);
        if (activeGoal) {
            setData({ ...json, goal: activeGoal });
        } else {
            router.push(`/${locale}/dashboard`);
        }
      }
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [params.id]);

  useEffect(() => {
    if (!data || !data.user) return;
    
    const socket = io();
    socket.emit('join_user_room', data.user._id);

    socket.on('data_updated', () => {
      console.log('Real-time update received on goal details, refetching data...');
      fetchData();
    });

    return () => {
      socket.disconnect();
    };
  }, [data?.user?._id]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Activity className="animate-spin text-primary w-12 h-12" /></div>;
  }

  const handleDelete = async () => {
    if (!confirm(t('confirmDelete'))) return;
    setIsDeleting(true);
    try {
      const res = await fetch('/api/actions/delete-goal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal_id: params.id })
      });
      const result = await res.json();
      if (result.success) {
        router.push(`/${locale}/dashboard`);
      } else {
        alert(result.error);
        setIsDeleting(false);
      }
    } catch (err) {
      alert(t('failedDelete'));
      setIsDeleting(false);
    }
  };

  const handleGenerateInvite = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/goals/generate-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal_id: params.id })
      });
      const result = await res.json();
      if (result.success) {
        setInviteLink(`${window.location.origin}/invite/${result.invite_token}`);
      } else {
        alert(result.error || t('failedInvite'));
      }
    } catch (err) {
      alert("Failed to connect to server");
    }
    setIsGenerating(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendEmailInvite = async () => {
    if (!emailInput || !emailInput.includes('@')) {
      setEmailToast({ type: 'error', msg: 'Please enter a valid email address.' });
      setTimeout(() => setEmailToast(null), 3000);
      return;
    }
    setIsSendingEmail(true);
    try {
      const res = await fetch('/api/collab/send-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientEmail: emailInput,
          goalName: data.goal.name,
          inviterName: data.user.name,
          inviteLink
        })
      });
      const result = await res.json();
      if (result.success) {
        setEmailToast({ type: 'success', msg: `Invite sent to ${emailInput}!` });
        setEmailInput('');
      } else {
        setEmailToast({ type: 'error', msg: result.error || 'Failed to send email.' });
      }
    } catch (err) {
      setEmailToast({ type: 'error', msg: 'Network error. Try again.' });
    }
    setIsSendingEmail(false);
    setTimeout(() => setEmailToast(null), 4000);
  };

  const handleSendClaimOtp = async () => {
    setClaimStep('sending');
    setClaimError('');
    try {
      const res = await fetch('/api/goals/send-withdraw-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal_id: params.id })
      });
      const result = await res.json();
      if (result.success) {
        setClaimStep('otp');
        if (result.otp) setDevOtp(result.otp); // dev mode only
      } else {
        setClaimError(result.error || 'Failed to send OTP');
        setClaimStep('idle');
      }
    } catch (err) {
      setClaimError('Network error. Try again.');
      setClaimStep('idle');
    }
  };

  const handleVerifyClaimOtp = async () => {
    if (!claimOtp || claimOtp.length !== 6) {
      setClaimError('Please enter the 6-digit OTP.');
      return;
    }
    setClaimStep('verifying');
    setClaimError('');
    try {
      const res = await fetch('/api/goals/verify-withdraw-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal_id: params.id, otp: claimOtp })
      });
      const result = await res.json();
      if (result.success) {
        setClaimedAmount(result.claimed_amount);
        setClaimStep('success');
        // Refresh data after 2.5s so stats update
        setTimeout(() => fetchData(), 2500);
      } else {
        setClaimError(result.error || 'Invalid OTP');
        setClaimStep('otp');
      }
    } catch (err) {
      setClaimError('Network error. Try again.');
      setClaimStep('otp');
    }
  };

  if (!data || !data.goal) return null;

  const { account, goal, stats } = data;
  
  const saved_for_goal = goal.saved_amount || 0;
  const progressPercent = Math.min(100, (saved_for_goal / goal.target_amount) * 100).toFixed(1);
  const remaining_amount = Math.max(0, goal.target_amount - saved_for_goal);
  
  const days_passed = Math.floor((new Date() - new Date(goal.created_at)) / (1000 * 60 * 60 * 24));
  const days_left = Math.max(1, goal.duration_days - days_passed);
  const required_daily_saving = Math.ceil(remaining_amount / days_left);

  const isOwner = data?.user?._id === goal.user_id?._id ||
                   data?.user?._id?.toString() === goal.user_id?.toString() ||
                   data?.user?._id?.toString() === goal.user_id?._id?.toString();

  return (
    <div className="min-h-screen bg-[#0B0F0E] text-white p-4 md:p-8 max-w-4xl mx-auto space-y-8 animate-in slide-in-from-right-8 duration-500 pb-24">

      {/* ─── CLAIM OTP MODAL ─── */}
      {showClaimModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div
            className="w-full max-w-md rounded-[32px] p-8 relative animate-in zoom-in-95 duration-300 card-primary"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#1ED760] to-[#4ade80] rounded-t-[32px]" />

            <button
              onClick={() => { setShowClaimModal(false); setClaimStep('idle'); setClaimOtp(''); setClaimError(''); setDevOtp(''); }}
              className="absolute top-5 right-5 w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all"
            >
              <X size={18} />
            </button>

            {claimStep === 'success' ? (
              // ─── Success State ───
              <div className="text-center py-4">
                <div className="w-20 h-20 bg-[#1ED760]/10 text-[#1ED760] rounded-full flex items-center justify-center mx-auto mb-4 shadow-[0_0_30px_rgba(30,215,96,0.3)]">
                  <CheckCircle size={40} />
                </div>
                <h2 className="text-3xl font-black text-white tracking-tighter mb-2">Funds Claimed</h2>
                <p className="text-gray-400 font-medium mb-6">
                  <span className="text-[#1ED760] font-black text-xl">₹{claimedAmount.toLocaleString('en-IN')}</span>
                  {' '}has been added to your wallet.
                </p>
                <button
                  onClick={() => { setShowClaimModal(false); setClaimStep('idle'); }}
                  className="btn-primary w-full py-4 text-base tracking-widest"
                >
                  Awesome! View Dashboard
                </button>
              </div>
            ) : (
              // ─── OTP Flow State ───
              <div className="space-y-6">
                <div className="text-center">
                  <p className="text-[10px] font-black text-[#1ED760] uppercase tracking-[0.3em] mb-1">Claim Your Savings</p>
                  <h2 className="text-2xl font-black text-white tracking-tighter">{goal.name}</h2>
                  <p className="text-gray-400 text-sm font-medium mt-1">₹{(goal.saved_amount || 0).toLocaleString('en-IN')} will be added to your wallet</p>
                </div>

                {claimStep === 'idle' && (
                  <>
                    <p className="text-gray-500 text-sm text-center">
                      We'll send a one-time OTP to your email to confirm this claim.
                    </p>
                    <button
                      onClick={handleSendClaimOtp}
                      className="btn-primary w-full py-4 text-sm"
                    >
                      <Sparkles size={18} /> Send OTP to Email
                    </button>
                  </>
                )}

                {claimStep === 'sending' && (
                  <div className="flex flex-col items-center gap-3 py-4">
                    <Loader2 size={32} className="text-[#1ED760] animate-spin" />
                    <p className="text-gray-400 text-sm">Sending OTP to your email...</p>
                  </div>
                )}

                {claimStep === 'otp' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-black text-[#888] uppercase tracking-widest mb-3">Enter OTP</label>
                      <input
                        type="text"
                        maxLength={6}
                        value={claimOtp}
                        onChange={e => { setClaimOtp(e.target.value.replace(/\D/g, '')); setClaimError(''); }}
                        placeholder="• • • • • •"
                        className="input-premium px-6 py-5 text-center text-3xl font-black text-[#1ED760] tracking-[0.5em]"
                        autoFocus
                      />
                    </div>
                    {devOtp && (
                      <p className="text-[10px] text-amber-400 text-center font-bold">DEV: OTP is {devOtp}</p>
                    )}
                    <button
                      onClick={handleVerifyClaimOtp}
                      disabled={claimOtp.length !== 6}
                      className="btn-primary w-full py-4"
                    >
                      Claim ₹{(goal.saved_amount || 0).toLocaleString('en-IN')} →
                    </button>
                    <button
                      onClick={handleSendClaimOtp}
                      className="w-full py-2 text-gray-500 hover:text-gray-300 text-xs font-bold uppercase tracking-widest transition-colors"
                    >
                      Resend OTP
                    </button>
                  </div>
                )}

                {claimStep === 'verifying' && (
                  <div className="flex flex-col items-center gap-3 py-4">
                    <Loader2 size={32} className="text-[#1ED760] animate-spin" />
                    <p className="text-gray-400 text-sm">Verifying OTP and claiming...</p>
                  </div>
                )}

                {claimError && (
                  <p className="text-red-400 text-xs font-black uppercase tracking-widest text-center">{claimError}</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      {/* Toast */}
      {emailToast && (
        <div className={`fixed top-6 right-4 left-4 md:left-auto md:right-6 md:max-w-sm z-50 animate-in slide-in-from-top-4 duration-300 px-5 py-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center gap-3 border shadow-2xl ${emailToast.type === 'success' ? 'bg-[#1ED760]/10 border-[#1ED760]/30 text-[#1ED760]' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
          <span>{emailToast.type === 'success' ? '✅' : '❌'}</span>
          {emailToast.msg}
        </div>
      )}
      <Link href={`/${locale}/dashboard`} className="inline-flex items-center gap-2 text-gray-400 hover:text-[#1ED760] transition-colors font-bold text-sm uppercase tracking-widest">
        <ArrowLeft size={16} /> {tCommon('back')}
      </Link>

      {/* Goal Progress Banner */}
      <section className="card-primary p-6 md:p-8 border-l-4 border-l-[#1ED760] relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 opacity-5 text-white">
          <Target size={200} />
        </div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 relative z-10 gap-4">
          <div className="min-w-0">
            <h2 className="text-sm uppercase tracking-wider text-[#1ED760] font-black mb-1">{t('title')}</h2>
            <div className="text-3xl md:text-5xl font-extrabold text-white tracking-tighter break-words">{goal.name}</div>
            <p className="text-gray-400 mt-2 text-sm md:text-xl font-medium">{t('savedOf', {saved: saved_for_goal.toLocaleString('en-IN'), target: goal.target_amount.toLocaleString('en-IN')})}</p>
          </div>
          <div className="text-left md:text-right shrink-0">
            <div className="text-5xl md:text-6xl font-black neon-text text-[#1ED760]">{progressPercent}%</div>
            <p className="text-white/80 mt-2 font-medium text-sm">{t('daysRemaining', {days: days_left})}</p>
          </div>
        </div>
        <div className="w-full h-3 bg-white/10 rounded-full relative z-10">
          <div className="h-full bg-[#1ED760] rounded-full shadow-[0_0_15px_rgba(30,215,96,0.6)] transition-all duration-700" style={{ width: `${progressPercent}%` }} />
        </div>
      </section>

        {/* Motivation Banner for nearing goals */}
        {progressPercent >= 80 && progressPercent < 100 && (
          <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/10 border border-amber-500/50 p-4 rounded-xl flex items-center gap-4 mt-6 animate-pulse shadow-[0_0_15px_rgba(245,158,11,0.2)]">
            <div>
              <h4 className="text-amber-400 font-bold">{t('almostThere')}</h4>
              <p className="text-amber-200/80 text-sm">{t('motivationMsg', {days: days_left})}</p>
            </div>
          </div>
        )}

      {/* Conditional Rendering based on Goal Completion */}
      {progressPercent >= 100 ? (
        <section className="card-primary border border-[#1ED760]/40 relative overflow-hidden animate-in zoom-in-95 duration-500">
          {/* Celebration shimmer */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#1ED760] via-[#4ade80] to-[#1ED760] animate-pulse" />
          <div className="absolute top-4 right-4 text-[#1ED760]/10 pointer-events-none">
            <Sparkles size={120} />
          </div>

          <div className="p-8 text-center">
            <div className="w-20 h-20 bg-[#1ED760]/20 text-[#1ED760] rounded-full flex items-center justify-center mx-auto mb-5 shadow-[0_0_30px_rgba(30,215,96,0.4)]">
              <Gift size={36} />
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-white mb-2 tracking-tighter">{t('goalReached')}</h2>
            <p className="text-gray-400 mb-8 max-w-lg mx-auto font-medium">
              {t('congratsMsg', {amount: saved_for_goal.toLocaleString('en-IN')})}
            </p>

            <div className="flex flex-col md:flex-row justify-center gap-4">
              {/* Claim Goal — owner only */}
              {isOwner && (
                <button
                  onClick={() => { setShowClaimModal(true); setClaimStep('idle'); setClaimOtp(''); setClaimError(''); }}
                  className="btn-primary py-4 px-8"
                >
                  <Gift size={20} />
                  Claim Goal
                  <Sparkles size={16} />
                </button>
              )}
              <Link href={`/${locale}/dashboard/goal-setup`} className="btn-secondary py-4 px-6">
                {t('startNewGoal')}
              </Link>
              <Link href={`/${locale}/demotrading`} className="btn-secondary py-4 px-6 gap-2 border-white/20">
                {t('investBtn')} <ArrowRight size={18} strokeWidth={3} />
              </Link>
            </div>
          </div>
        </section>
      ) : (
        <>
          {/* Math & Suggestions */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card-secondary p-6">
              <h3 className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mb-2 flex items-center gap-2"><TrendingUp size={16} className="text-white"/> {t('remainingAmount')}</h3>
              <p className="text-3xl font-extrabold text-white tracking-tighter">₹{remaining_amount.toLocaleString('en-IN')}</p>
            </div>
            
            <div className="card-secondary p-6 border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10">
              <h3 className="text-amber-400 font-black text-[10px] uppercase tracking-widest mb-2 flex items-center gap-2"><AlertTriangle size={16}/> {t('suggestedDaily')}</h3>
              <p className="text-3xl font-black text-white tracking-tighter">₹{required_daily_saving.toLocaleString('en-IN')}</p>
              <p className="text-xs text-amber-300/70 mt-2 font-bold">{t('suggestedDailyMsg', {days: days_left})}</p>
            </div>
          </section>

          {/* Deposit Call to action */}
          <Link href={`/${locale}/dashboard/deposit?goal_id=${goal._id}&goal_name=${encodeURIComponent(goal.name)}`} className="btn-primary w-full py-4 text-base">
            {t('depositBtn')} <ArrowRight size={20} strokeWidth={3} />
          </Link>
        </>
      )}

      {/* Collaborators Section */}
      <section className="card-secondary p-6 md:p-8 mt-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-white/5 rounded-xl text-[#1ED760] flex items-center justify-center">
            <Users size={20} />
          </div>
          <div>
            <h3 className="text-xl font-black text-white">{t('collaborators')}</h3>
            <p className="text-gray-400 text-xs font-medium">{t('collaboratorsDesc')}</p>
          </div>
        </div>
        
        <div className="space-y-4">
          {/* Owner */}
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#1ED760]/20 text-[#1ED760] flex items-center justify-center font-black">
                {goal.user_id?.name?.charAt(0) || 'O'}
              </div>
              <div>
                <p className="text-white font-bold">{goal.user_id?.name} <span className="text-[9px] text-[#1ED760] ml-2 bg-[#1ED760]/10 px-2 py-0.5 rounded-full border border-[#1ED760]/20 uppercase tracking-widest">{t('owner')}</span></p>
                <p className="text-gray-400 text-xs font-medium">{goal.user_id?.email}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-white font-black text-lg">
                ₹{(goal.contributions?.find(c => c.user_id?._id === goal.user_id?._id)?.amount || 0).toLocaleString('en-IN')}
              </p>
              <p className="text-gray-500 text-[10px] uppercase font-black tracking-widest">{t('contributed')}</p>
            </div>
          </div>

          {/* Shared With */}
          {goal.shared_with?.map(collaborator => (
            <div key={collaborator._id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#1ED760]/20 text-[#1ED760] flex items-center justify-center font-black">
                  {collaborator.name?.charAt(0) || 'C'}
                </div>
                <div>
                  <p className="text-white font-bold">{collaborator.name}</p>
                  <p className="text-gray-400 text-xs font-medium">{collaborator.email}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[#1ED760] font-black text-lg">
                  ₹{(goal.contributions?.find(c => c.user_id?._id === collaborator._id)?.amount || 0).toLocaleString('en-IN')}
                </p>
                <p className="text-gray-500 text-[10px] uppercase font-black tracking-widest">{t('contributed')}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Family Collaboration */}
      <section className="card-secondary p-6 md:p-8 mt-8 border-[#1ED760]/30 bg-gradient-to-br from-[#121212] to-[#121212]">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-[#1ED760]/20 rounded-xl text-[#1ED760] flex items-center justify-center">
            <Users size={20} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">{t('familyCollab')}</h3>
            <p className="text-slate-400 text-xs font-medium">{t('familyCollabDesc')}</p>
          </div>
        </div>

        {!inviteLink ? (
          <button 
            onClick={handleGenerateInvite} 
            disabled={isGenerating}
            className="btn-primary w-full sm:w-auto px-6 py-4"
          >
            {isGenerating ? <Activity size={20} className="animate-spin" /> : <LinkIcon size={20} />}
            {isGenerating ? t('generating') : t('generateInvite')}
          </button>
        ) : (
          <div className="mt-4 animate-in fade-in duration-300 space-y-4">
            {/* Copy Link Row */}
            <div>
              <label className="block text-[10px] font-black text-[#888888] uppercase tracking-widest mb-3">{t('shareLink')}</label>
              <div className="flex flex-col sm:flex-row gap-3">
                <input 
                  type="text" 
                  readOnly 
                  value={inviteLink} 
                  className="input-premium flex-1"
                />
                <button 
                  onClick={copyToClipboard}
                  className="btn-secondary px-5 py-3"
                >
                  {copied ? <Check size={16} className="text-[#1ED760]" /> : <Copy size={16} />}
                  {copied ? t('copied') : t('copyLink')}
                </button>
              </div>
            </div>

            {/* Email Invite Row */}
            <div>
              <label className="block text-[10px] font-black text-[#888888] uppercase tracking-widest mb-3">Share via Email</label>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  value={emailInput}
                  onChange={e => setEmailInput(e.target.value)}
                  placeholder="friend@example.com"
                  className="input-premium flex-1"
                />
                <button
                  onClick={handleSendEmailInvite}
                  disabled={isSendingEmail}
                  className="btn-secondary px-5 py-3 text-[#1ED760] border-[#1ED760]/30 hover:border-[#1ED760]/50 hover:bg-[#1ED760]/10"
                >
                  {isSendingEmail ? <Activity size={16} className="animate-spin" /> : null}
                  {isSendingEmail ? 'Sending...' : 'Send Invite'}
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Danger Zone */}
      <div className="pt-8 border-t border-white/5 text-center">
        <button 
          onClick={handleDelete}
          disabled={isDeleting}
          className="text-red-500 hover:text-red-400 font-bold uppercase text-[10px] tracking-widest transition-colors disabled:opacity-50"
        >
          {isDeleting ? t('deleting') : t('deleteGoal')}
        </button>
      </div>

    </div>
  );
}
