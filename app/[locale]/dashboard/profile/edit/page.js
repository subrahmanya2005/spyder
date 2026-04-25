"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  User, Phone, MapPin, Hash, Briefcase, Banknote, Calendar,
  Building2, CreditCard, Camera, FileText, ArrowLeft, Loader2,
  CheckCircle, Save, Upload, X
} from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';

export default function EditProfilePage() {
  const t       = useTranslations('EditProfile');
  const tCommon = useTranslations('Common');
  const locale  = useLocale();
  const router  = useRouter();

  const [loading,          setLoading]          = useState(true);
  const [saving,           setSaving]           = useState(false);
  const [error,            setError]            = useState('');
  const [success,          setSuccess]          = useState(false);
  const [uploadingProfile, setUploadingProfile] = useState(false);
  const [uploadingPan,     setUploadingPan]     = useState(false);
  const [profilePreview,   setProfilePreview]   = useState(null);
  const [panPreview,       setPanPreview]       = useState(null);

  const [form, setForm] = useState({
    name: '', gender: '', phone: '',
    address: '', pincode: '',
    occupation: '', current_salary: '', average_income: '', days_of_work: '',
    bank_name: '', bank_account_number: '', bank_ifsc: '',
    aadhaar_number: '', pan_photo_url: '', profile_photo_url: '',
  });

  useEffect(() => {
    fetch('/api/profile', { cache: 'no-store' })
      .then(r => { if (r.status === 401) router.push(`/${locale}`); return r.json(); })
      .then(d => {
        if (d.user) {
          const u = d.user;
          setForm({
            name:                u.name                || '',
            gender:              u.gender              || '',
            phone:               u.phone               || '',
            address:             u.address             || '',
            pincode:             u.pincode             || '',
            occupation:          u.occupation          || '',
            current_salary:      u.current_salary      || '',
            average_income:      u.average_income      || '',
            days_of_work:        u.days_of_work        || '',
            bank_name:           u.bank_name           || '',
            bank_account_number: u.bank_account_number || '',
            bank_ifsc:           u.bank_ifsc           || '',
            aadhaar_number:      u.aadhaar_number      || '',
            pan_photo_url:       u.pan_photo_url       || '',
            profile_photo_url:   u.profile_photo_url   || '',
          });
          if (u.profile_photo_url) setProfilePreview(u.profile_photo_url);
          if (u.pan_photo_url)     setPanPreview(u.pan_photo_url);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const compressImage = (file) =>
    new Promise((resolve) => {
      const img    = new Image();
      const reader = new FileReader();
      reader.onload = e => {
        img.onload = () => {
          const maxSize = 900;
          let { width, height } = img;
          if (width > height && width > maxSize)      { height = (height * maxSize) / width;  width  = maxSize; }
          else if (height > maxSize)                   { width  = (width  * maxSize) / height; height = maxSize; }
          const canvas = document.createElement('canvas');
          canvas.width = width; canvas.height = height;
          canvas.getContext('2d').drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.82));
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });

  const uploadToCloudinary = async (base64, folder) => {
    const res  = await fetch('/api/profile/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: base64, folder }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Upload failed');
    return data.url;
  };

  const handleProfilePhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingProfile(true);
    setError('');
    try {
      const base64 = await compressImage(file);
      setProfilePreview(base64);
      const url = await uploadToCloudinary(base64, 'profiles');
      set('profile_photo_url', url);
    } catch {
      setError('Profile photo upload failed. Please try again.');
    } finally {
      setUploadingProfile(false);
    }
  };

  const handlePanPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPan(true);
    setError('');
    try {
      const base64 = await compressImage(file);
      setPanPreview(base64);
      const url = await uploadToCloudinary(base64, 'pan');
      set('pan_photo_url', url);
    } catch {
      setError('PAN photo upload failed. Please try again.');
    } finally {
      setUploadingPan(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim()) { setError('Name is required.'); return; }
    setSaving(true);
    try {
      const res  = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Update failed.'); return; }
      setSuccess(true);
      setTimeout(() => router.push(`/${locale}/dashboard/profile`), 1500);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0B0B] flex items-center justify-center">
        <div className="w-12 h-12 border-2 border-[#1ED760]/10 border-t-[#1ED760] rounded-full animate-spin" />
      </div>
    );
  }

  const busy = saving || uploadingProfile || uploadingPan;

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-white selection:bg-[#1ED760]/30 p-4 md:p-12 pb-32">
      <div className="max-w-3xl mx-auto space-y-8">

        {/* Top nav */}
        <div className="flex items-center justify-between animate-in fade-in slide-in-from-top-4 duration-700">
          <Link
            href={`/${locale}/dashboard/profile`}
            className="w-12 h-12 glass rounded-2xl flex items-center justify-center text-gray-400 hover:text-[#1ED760] hover:border-[#1ED760]/30 transition-all group shrink-0"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          </Link>
          <h1 className="text-sm font-black uppercase tracking-[0.25em] text-white">{t('title')}</h1>
          <div className="w-12" />
        </div>

        {/* Banners */}
        {success && (
          <div className="flex items-center gap-3 px-6 py-4 bg-[#1ED760]/10 border border-[#1ED760]/20 rounded-2xl text-[#1ED760] text-[11px] font-black uppercase tracking-widest animate-in zoom-in-95 duration-300">
            <CheckCircle size={16} /> {t('successMsg')}
          </div>
        )}
        {error && (
          <div className="flex items-center justify-between gap-3 px-6 py-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-[11px] font-black uppercase tracking-widest animate-in slide-in-from-top-2 duration-300">
            <span>{error}</span>
            <button onClick={() => setError('')} className="shrink-0 hover:text-red-300 transition-colors">
              <X size={14} />
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* ── Profile photo ─────────────────────────── */}
          <FormSection title={t('profilePhoto')} icon={Camera} delay="0.1s">
            <div className="flex flex-col sm:flex-row items-center gap-8">
              <div className="relative shrink-0">
                <div className="absolute -inset-4 bg-[#1ED760]/15 rounded-full blur-2xl animate-pulse" />
                <div className="relative w-28 h-28 rounded-3xl overflow-hidden border-2 border-[#1ED760]/20 bg-[#1ED760]/10 flex items-center justify-center">
                  {profilePreview
                    ? <img src={profilePreview} alt="Profile" className="w-full h-full object-cover" />
                    : <span className="text-4xl font-black text-[#1ED760] neon-text">{form.name?.charAt(0)?.toUpperCase() || '?'}</span>
                  }
                </div>
                {uploadingProfile && (
                  <div className="absolute inset-0 rounded-3xl bg-black/60 flex items-center justify-center">
                    <Loader2 size={22} className="animate-spin text-[#1ED760]" />
                  </div>
                )}
              </div>
              <label className={`cursor-pointer flex-1 w-full ${uploadingProfile ? 'pointer-events-none opacity-50' : ''}`}>
                <div className="px-6 py-4 glass rounded-2xl text-[11px] font-black uppercase tracking-widest text-gray-300 hover:text-[#1ED760] hover:border-[#1ED760]/30 transition-all flex items-center justify-center gap-3">
                  {uploadingProfile
                    ? <Loader2 size={15} className="animate-spin text-[#1ED760]" />
                    : <Camera size={15} className="text-[#1ED760]" />
                  }
                  {uploadingProfile ? t('uploading') : t('changePhoto')}
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={handleProfilePhoto} disabled={uploadingProfile} />
              </label>
            </div>
          </FormSection>

          {/* ── Personal info ─────────────────────────── */}
          <FormSection title={t('personalInfo')} icon={User} delay="0.15s">
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <InputField label={t('fullName')} icon={User} required>
                  <input
                    type="text" required
                    value={form.name} onChange={e => set('name', e.target.value)}
                    className="input-base pl-12" placeholder={t('namePlaceholder')}
                  />
                </InputField>
                <InputField label={t('gender')} icon={User}>
                  <select value={form.gender} onChange={e => set('gender', e.target.value)} className="input-base pl-12 appearance-none">
                    <option value="">{t('select')}</option>
                    <option value="Male">{t('male')}</option>
                    <option value="Female">{t('female')}</option>
                    <option value="Other">{t('other')}</option>
                  </select>
                </InputField>
              </div>
              <InputField label={t('phone')} icon={Phone}>
                <input
                  type="tel"
                  value={form.phone} onChange={e => set('phone', e.target.value)}
                  className="input-base pl-12" placeholder={t('phonePlaceholder')}
                />
              </InputField>
            </div>
          </FormSection>

          {/* ── Address ───────────────────────────────── */}
          <FormSection title={t('address')} icon={MapPin} delay="0.2s">
            <div className="space-y-5">
              <InputField label={t('fullAddress')} icon={MapPin} iconTop>
                <textarea
                  value={form.address} onChange={e => set('address', e.target.value)}
                  className="input-base pl-12 min-h-[90px] resize-none"
                  placeholder={t('addressPlaceholder')}
                />
              </InputField>
              <InputField label={t('pincode')} icon={Hash}>
                <input
                  type="text" maxLength={6}
                  value={form.pincode} onChange={e => set('pincode', e.target.value)}
                  className="input-base pl-12" placeholder={t('pincodePlaceholder')}
                />
              </InputField>
            </div>
          </FormSection>

          {/* ── Financial profile ─────────────────────── */}
          <FormSection title={t('financialProfile')} icon={Briefcase} delay="0.25s">
            <div className="space-y-5">
              <InputField label={t('occupation')} icon={Briefcase}>
                <input
                  type="text"
                  value={form.occupation} onChange={e => set('occupation', e.target.value)}
                  className="input-base pl-12" placeholder={t('occupationPlaceholder')}
                />
              </InputField>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <InputField label={t('salary')} icon={Banknote}>
                  <input
                    type="number" min="0"
                    value={form.current_salary} onChange={e => set('current_salary', e.target.value)}
                    className="input-base pl-12" placeholder={t('salaryPlaceholder')}
                  />
                </InputField>
                <InputField label={t('avgIncome')} icon={Banknote}>
                  <input
                    type="number" min="0"
                    value={form.average_income} onChange={e => set('average_income', e.target.value)}
                    className="input-base pl-12" placeholder={t('avgIncomePlaceholder')}
                  />
                </InputField>
              </div>
              <InputField label={t('workingDays')} icon={Calendar}>
                <input
                  type="number" min="1" max="31"
                  value={form.days_of_work} onChange={e => set('days_of_work', e.target.value)}
                  className="input-base pl-12" placeholder={t('daysPlaceholder')}
                />
              </InputField>
            </div>
          </FormSection>

          {/* ── Bank details ──────────────────────────── */}
          <FormSection title={t('bankDetails')} icon={Building2} delay="0.3s">
            <div className="space-y-5">
              <InputField label={t('bankName')} icon={Building2}>
                <input
                  type="text"
                  value={form.bank_name} onChange={e => set('bank_name', e.target.value)}
                  className="input-base pl-12" placeholder={t('bankPlaceholder')}
                />
              </InputField>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <InputField label={t('accNumber')} icon={CreditCard}>
                  <input
                    type="text"
                    value={form.bank_account_number} onChange={e => set('bank_account_number', e.target.value)}
                    className="input-base pl-12" placeholder={t('accPlaceholder')}
                  />
                </InputField>
                <InputField label={t('ifsc')} icon={Hash}>
                  <input
                    type="text"
                    value={form.bank_ifsc} onChange={e => set('bank_ifsc', e.target.value)}
                    className="input-base pl-12" placeholder={t('ifscPlaceholder')}
                  />
                </InputField>
              </div>
            </div>
          </FormSection>

          {/* ── KYC documents ─────────────────────────── */}
          <FormSection title={t('kycDocs')} icon={FileText} delay="0.35s">
            <div className="space-y-5">
              <InputField label={t('aadhaar')} icon={Hash}>
                <input
                  type="text" maxLength={12}
                  value={form.aadhaar_number} onChange={e => set('aadhaar_number', e.target.value)}
                  className="input-base pl-12" placeholder={t('aadhaarPlaceholder')}
                />
              </InputField>

              <div className="space-y-3">
                <p className="text-[10px] font-black text-[#888888] uppercase tracking-widest">{t('panPhoto')}</p>
                {panPreview && (
                  <div className="relative rounded-2xl overflow-hidden border border-white/5">
                    <img src={panPreview} alt="PAN" className="w-full h-28 object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  </div>
                )}
                <label className={`cursor-pointer block ${uploadingPan ? 'pointer-events-none opacity-50' : ''}`}>
                  <div className="px-6 py-4 glass rounded-2xl text-[11px] font-black uppercase tracking-widest text-gray-300 hover:text-[#1ED760] hover:border-[#1ED760]/30 transition-all flex items-center gap-3">
                    {uploadingPan
                      ? <Loader2 size={15} className="animate-spin text-[#1ED760]" />
                      : <Upload size={15} className="text-[#1ED760]" />
                    }
                    {uploadingPan ? t('uploading') : panPreview ? t('replacePan') : t('uploadPan')}
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={handlePanPhoto} disabled={uploadingPan} />
                </label>
              </div>
            </div>
          </FormSection>

          {/* ── Action buttons ────────────────────────── */}
          <div className="flex flex-col sm:flex-row gap-4 pb-8 animate-in fade-in slide-in-from-bottom-4 duration-700" style={{ animationDelay: '0.4s', animationFillMode: 'both' }}>
            <Link
              href={`/${locale}/dashboard/profile`}
              className="flex-1 py-4 glass rounded-2xl text-white font-black text-[10px] uppercase tracking-widest text-center hover:border-white/20 transition-all"
            >
              {tCommon('cancel')}
            </Link>
            <button
              type="submit"
              disabled={busy}
              className="btn-bounce flex-1 py-4 bg-[#1ED760] text-black rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-glow flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {saving
                ? <Loader2 size={16} className="animate-spin" />
                : <Save size={16} strokeWidth={3} />
              }
              {saving ? t('saving') : t('saveChanges')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Reusable pieces ──────────────────────────────────── */
function FormSection({ title, icon: Icon, children, delay = '0s' }) {
  return (
    <section
      className="card-premium p-8 md:p-10 border-white/5 relative overflow-hidden group animate-in fade-in slide-in-from-bottom-4 duration-500"
      style={{ animationDelay: delay, animationFillMode: 'both' }}
    >
      <div className="absolute top-0 left-0 w-full h-1 bg-[#1ED760]/20 group-hover:bg-[#1ED760]/50 transition-colors duration-500" />
      <h2 className="text-[10px] font-black text-[#888888] uppercase tracking-[0.3em] flex items-center gap-3 mb-8">
        <Icon size={16} className="text-[#1ED760]" /> {title}
      </h2>
      {children}
    </section>
  );
}

function InputField({ label, icon: Icon, required, iconTop, children }) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-[#888888] uppercase tracking-widest block">
        {label}{required && <span className="text-[#1ED760] ml-1">*</span>}
      </label>
      <div className="relative">
        {Icon && (
          <Icon
            size={15}
            className={`absolute left-4 pointer-events-none text-[#1ED760]/50 ${iconTop ? 'top-3.5' : 'top-1/2 -translate-y-1/2'}`}
          />
        )}
        {children}
      </div>
    </div>
  );
}
