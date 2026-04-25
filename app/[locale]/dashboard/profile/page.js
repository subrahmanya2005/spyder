"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Edit3, Mail, Phone, MapPin, Briefcase, Building2,
  FileText, Shield, Lock, ChevronUp, ChevronDown, CheckCircle,
  AlertTriangle, Trash2
} from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { Eye, EyeOff } from 'lucide-react';

export default function ProfilePage() {
  const t = useTranslations('Profile');
  const tCommon = useTranslations('Common');
  const locale = useLocale();
  const router = useRouter();
  const [user, setUser]     = useState(null);
  const [loading, setLoading] = useState(true);

  // Change password
  const [showChangePw, setShowChangePw]   = useState(false);
  const [currentPw, setCurrentPw]         = useState('');
  const [newPw, setNewPw]                 = useState('');
  const [confirmPw, setConfirmPw]         = useState('');
  const [pwLoading, setPwLoading]         = useState(false);
  const [pwError, setPwError]             = useState('');
  const [pwSuccess, setPwSuccess]         = useState(false);
  const [showCurr, setShowCurr]           = useState(false);
  const [showNew, setShowNew]             = useState(false);

  // Delete account
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading]         = useState(false);

  useEffect(() => {
    fetch('/api/profile', { cache: 'no-store' })
      .then(r => { if (r.status === 401) router.push(`/${locale}`); return r.json(); })
      .then(d => { if (d.user) setUser(d.user); })
      .finally(() => setLoading(false));
  }, []);

  const maskAadhaar = (num) => {
    if (!num) return '—';
    const s = num.replace(/\s/g, '');
    return `XXXX-XXXX-${s.slice(-4)}`;
  };

  const maskAccount = (num) => {
    if (!num) return '—';
    return `${'•'.repeat(num.length - 4)}${num.slice(-4)}`;
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwError('');
    if (newPw !== confirmPw) { setPwError('New passwords do not match.'); return; }
    setPwLoading(true);
    try {
      const res  = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current_password: currentPw, new_password: newPw }),
      });
      const data = await res.json();
      if (!res.ok) { setPwError(data.error); return; }
      setPwSuccess(true);
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
      setTimeout(() => { setPwSuccess(false); setShowChangePw(false); }, 3000);
    } catch {
      setPwError('Network error.');
    } finally {
      setPwLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    try {
      await fetch('/api/profile', { method: 'DELETE' });
      router.push(`/${locale}`);
    } catch {
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0B0B] flex items-center justify-center">
        <div className="w-12 h-12 border-2 border-[#1ED760]/10 border-t-[#1ED760] rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-white selection:bg-[#1ED760]/30 stagger-in p-4 md:p-12 pb-32">
      
      <div className="max-w-3xl mx-auto space-y-8 md:space-y-12">
        
        {/* Top nav */}
        <div className="flex items-center justify-between animate-in fade-in slide-in-from-top-4 duration-700">
          <Link href={`/${locale}/dashboard`} className="w-12 h-12 glass rounded-2xl flex items-center justify-center text-gray-400 hover:text-[#1ED760] hover:border-[#1ED760]/30 transition-all group shrink-0">
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          </Link>
          <Link
            href={`/${locale}/dashboard/profile/edit`}
            className="btn-bounce flex items-center gap-2 px-6 py-3 bg-[#1ED760] text-black rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-glow"
          >
            <Edit3 size={14} strokeWidth={3} /> {t('editBtn')}
          </Link>
        </div>

        {/* Hero card */}
        <section className="card-premium p-8 md:p-12 flex flex-col md:flex-row items-center md:items-start gap-10 border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#1ED760] to-[#4ade80]"></div>
          
          {/* Avatar */}
          <div className="shrink-0 relative">
            <div className="absolute -inset-4 bg-[#1ED760]/20 rounded-full blur-xl animate-pulse group-hover:scale-125 transition-transform duration-1000"></div>
            {user.profile_photo_url ? (
              <img
                src={user.profile_photo_url}
                alt={user.name}
                className="relative w-32 h-32 md:w-40 md:h-40 rounded-3xl object-cover border-2 border-[#1ED760]/30 p-1"
              />
            ) : (
              <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-3xl bg-[#1ED760]/10 flex items-center justify-center border-2 border-[#1ED760]/30">
                <span className="text-5xl font-black text-[#1ED760] neon-text">
                  {user.name?.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>

          {/* Name & basic info */}
          <div className="flex-1 text-center md:text-left space-y-4">
            <div>
              <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white">{user.name}</h1>
              <p className="text-[#888888] text-lg font-medium mt-2">{user.gender} · {user.occupation || t('occupationNotSet')}</p>
            </div>
            <div className="flex flex-wrap justify-center md:justify-start gap-3">
              <InfoPill icon={Mail} label={user.email} />
              <InfoPill icon={Phone} label={user.phone || t('noPhone')} />
            </div>
          </div>
        </section>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Address */}
          <Section title={t('addressSection')} icon={MapPin}>
            <div className="space-y-6">
              <InfoRow label={t('fullAddress')} value={user.address || '—'} />
              <InfoRow label={t('pincode')}      value={user.pincode  || '—'} />
            </div>
          </Section>

          {/* Financial profile */}
          <Section title={t('financialSection')} icon={Briefcase}>
            <div className="space-y-6">
              <InfoRow label={t('occupation')}          value={user.occupation      || '—'} />
              <InfoRow label={t('salary')}      value={user.current_salary  ? `₹${Number(user.current_salary).toLocaleString('en-IN')}/mo` : '—'} />
              <InfoRow label={t('avgIncome')}      value={user.average_income  ? `₹${Number(user.average_income).toLocaleString('en-IN')}/mo` : '—'} />
              <InfoRow label={t('workingDays')} value={user.days_of_work   ? `${user.days_of_work} days` : '—'} />
            </div>
          </Section>

          {/* Banking */}
          <Section title={t('bankingSection')} icon={Building2}>
            <div className="space-y-6">
              <InfoRow label={t('bank')}           value={user.bank_name           || '—'} />
              <InfoRow label={t('accNumber')} value={maskAccount(user.bank_account_number)} />
              <InfoRow label={t('ifsc')}           value={user.bank_ifsc           || '—'} />
            </div>
          </Section>

          {/* KYC documents */}
          <Section title={t('kycSection')} icon={FileText}>
            <div className="space-y-6">
              <InfoRow label={t('aadhaar')} value={maskAadhaar(user.aadhaar_number)} />
              <div className="space-y-3">
                <p className="text-[10px] font-black text-[#888888] uppercase tracking-widest">{t('pan')}</p>
                {user.pan_photo_url ? (
                  <img src={user.pan_photo_url} alt="PAN" className="h-32 w-full object-cover rounded-2xl border border-white/5" />
                ) : (
                  <div className="h-32 w-full bg-white/5 rounded-2xl flex items-center justify-center border border-dashed border-white/10 text-[#888888] text-sm">
                    {t('panNotUploaded')}
                  </div>
                )}
              </div>
            </div>
          </Section>
        </div>

        {/* Account security */}
        <Section title={t('securitySection')} icon={Shield}>
          <p className="text-[10px] font-black text-[#888888] uppercase tracking-[0.2em] mb-6">
            {t('memberSince', {date: new Date(user.createdAt).toLocaleDateString()})}
          </p>

          <button
            onClick={() => { setShowChangePw(s => !s); setPwError(''); setPwSuccess(false); }}
            className="flex items-center gap-3 text-[10px] font-black text-[#1ED760] hover:text-white uppercase tracking-[0.2em] transition-all group"
          >
            <Lock size={14} className="group-hover:scale-110 transition-transform" />
            {t('changePassword')}
            {showChangePw ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {showChangePw && (
            <form onSubmit={handleChangePassword} className="mt-8 space-y-6 animate-in slide-in-from-top-4 duration-500 max-w-md">
              <PwField label={t('currentPassword')} value={currentPw} onChange={setCurrentPw} show={showCurr} toggle={() => setShowCurr(s => !s)} />
              <PwField label={t('newPassword')}     value={newPw}     onChange={setNewPw}     show={showNew}  toggle={() => setShowNew(s => !s)} />
              <div className="space-y-2">
                <label className="text-[10px] font-black text-[#888888] uppercase tracking-widest block">{t('confirmNewPassword')}</label>
                <input
                  type="password" required
                  value={confirmPw} onChange={e => setConfirmPw(e.target.value)}
                  className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#1ED760]/30"
                  placeholder={t('passwordPlaceholder')}
                />
              </div>
              {pwError   && <p className="text-red-500 text-xs font-black uppercase tracking-widest">{pwError}</p>}
              {pwSuccess  && (
                <div className="flex items-center gap-2 text-[#1ED760] text-xs font-black uppercase tracking-widest">
                  <CheckCircle size={14} /> {t('passwordSuccess')}
                </div>
              )}
              <button
                type="submit"
                disabled={pwLoading}
                className="btn-bounce px-8 py-3 bg-[#1ED760] text-black rounded-xl text-xs font-black uppercase tracking-widest shadow-glow flex items-center gap-2 disabled:opacity-50"
              >
                {pwLoading ? <RefreshCwIcon className="animate-spin" /> : t('updatePassword')}
              </button>
            </form>
          )}
        </Section>

        {/* Danger zone */}
        <section className="card-premium p-8 md:p-12 border-red-500/10 bg-red-500/5 group">
          <h3 className="text-[10px] font-black text-red-500 uppercase tracking-[0.3em] flex items-center gap-3 mb-6">
            <AlertTriangle size={16} /> {t('dangerZone')}
          </h3>
          <p className="text-[#888888] text-sm font-medium mb-10 max-w-xl">
            {t('deleteDesc')}
          </p>

          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="btn-bounce px-8 py-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-500 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2"
            >
              <Trash2 size={16} /> {t('deleteBtn')}
            </button>
          ) : (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
              <p className="text-lg font-bold text-red-500">{t('deleteConfirm')}</p>
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
                >
                  {tCommon('cancel')}
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteLoading}
                  className="btn-bounce px-8 py-4 bg-red-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-[0_0_20px_rgba(239,68,68,0.3)] transition-all flex items-center justify-center gap-2"
                >
                  {deleteLoading ? <RefreshCwIcon className="animate-spin" /> : <><Trash2 size={16} /> {t('yesDelete')}</>}
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

/* ── Reusable pieces ────────────────────────────────── */
function Section({ title, icon: Icon, children }) {
  return (
    <section className="card-premium p-8 md:p-10 border-white/5 relative overflow-hidden group">
      <div className="absolute top-0 left-0 w-full h-1 bg-[#1ED760]/20 group-hover:bg-[#1ED760]/50 transition-colors"></div>
      <h2 className="text-[10px] font-black text-[#888888] uppercase tracking-[0.3em] flex items-center gap-3 mb-8">
        <Icon size={16} className="text-[#1ED760]" /> {title}
      </h2>
      {children}
    </section>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] font-black text-[#888888] uppercase tracking-widest">{label}</p>
      <p className="text-lg font-black text-white break-all leading-tight">{value}</p>
    </div>
  );
}

function InfoPill({ icon: Icon, label }) {
  return (
    <span className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/5 rounded-full text-[10px] font-black text-[#888888] uppercase tracking-widest hover:border-[#1ED760]/30 hover:text-white transition-all cursor-default">
      <Icon size={12} className="text-[#1ED760]" /> {label}
    </span>
  );
}

function PwField({ label, value, onChange, show, toggle }) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-[#888888] uppercase tracking-widest block">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'} required
          value={value} onChange={e => onChange(e.target.value)}
          className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#1ED760]/30 pr-12"
          placeholder="••••••••"
        />
        <button type="button" onClick={toggle}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-[#888888] hover:text-white transition-colors">
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
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


