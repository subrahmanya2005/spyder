"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  User, Mail, Lock, Eye, EyeOff, Phone, MapPin, Hash,
  Briefcase, Banknote, Calendar, Building2, CreditCard,
  Camera, FileText, ArrowRight, ArrowLeft, Activity, Shield, CheckCircle,
} from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';

export default function SignupPage() {
  const t = useTranslations('Signup');
  const locale = useLocale();
  const GENDERS = [t('male'), t('female'), t('other')];
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const STEPS = [t('step1'), t('step2'), t('step3'), t('step4')];

  const [form, setForm] = useState({
    name: '', gender: '', email: '', phone: '', password: '', confirm_password: '',
    address: '', pincode: '',
    occupation: '', current_salary: '', average_income: '', days_of_work: '',
    bank_name: '', bank_account_number: '', bank_ifsc: '',
    aadhaar_number: '', pan_photo_url: '', profile_photo_url: '',
  });

  const [profilePreview, setProfilePreview] = useState(null);
  const [panPreview, setPanPreview]         = useState(null);
  const [uploadingProfile, setUploadingProfile] = useState(false);
  const [uploadingPan, setUploadingPan]         = useState(false);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const compressImage = (file) =>
    new Promise((resolve) => {
      const img    = new Image();
      const reader = new FileReader();
      reader.onload = e => {
        img.onload = () => {
          const maxSize = 900;
          let { width, height } = img;
          if (width > height && width > maxSize) { height = (height * maxSize) / width; width = maxSize; }
          else if (height > maxSize) { width = (width * maxSize) / height; height = maxSize; }
          const canvas = document.createElement('canvas');
          canvas.width = width; canvas.height = height;
          canvas.getContext('2d').drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.82));
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });

  const dataURLtoFile = (dataurl, filename) => {
    let arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, {type:mime});
  };

  const uploadToCloudinary = async (file, folder) => {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('folder', folder);

    const res  = await fetch('/api/profile/upload', {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || t('uploadFailed'));
    return data.url;
  };

  const handleProfilePhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingProfile(true);
    try {
      const base64 = await compressImage(file);
      setProfilePreview(base64);
      const compressedFile = dataURLtoFile(base64, file.name);
      const url = await uploadToCloudinary(compressedFile, 'profiles');
      set('profile_photo_url', url);
    } catch (err) {
      setError(t('profilePhotoFailed'));
    } finally {
      setUploadingProfile(false);
    }
  };

  const handlePanPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPan(true);
    try {
      const base64 = await compressImage(file);
      setPanPreview(base64);
      const compressedFile = dataURLtoFile(base64, file.name);
      const url = await uploadToCloudinary(compressedFile, 'pan');
      set('pan_photo_url', url);
    } catch (err) {
      setError(t('panPhotoFailed'));
    } finally {
      setUploadingPan(false);
    }
  };

  const validateStep = () => {
    setError('');
    if (step === 1) {
      if (!form.name || !form.gender || !form.email || !form.phone || !form.password || !form.confirm_password)
        return setError(t('fillAllFields')) || false;
      if (form.password.length < 8)
        return setError(t('passwordShort')) || false;
      if (form.password !== form.confirm_password)
        return setError(t('passwordMismatch')) || false;
    }
    if (step === 2) {
      if (!form.address || !form.pincode)
        return setError(t('fillAddressFields')) || false;
    }
    return true;
  };

  const nextStep = () => { if (validateStep()) setStep(s => s + 1); };
  const prevStep = () => { setError(''); setStep(s => s - 1); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res  = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      
      const redirectUrl = sessionStorage.getItem('postLoginRedirect');
      if (redirectUrl) {
        sessionStorage.removeItem('postLoginRedirect');
        router.push(redirectUrl);
      } else {
        router.push(`/${locale}/dashboard`);
      }
    } catch {
      setError(t('networkError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F0E] text-white selection:bg-[#1ED760]/30 flex flex-col items-center justify-center p-4 relative overflow-hidden">


      <div className="card-primary w-full max-w-lg p-8 md:p-10 relative z-10 animate-in slide-in-from-bottom-4 duration-500">

        {/* Brand */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-[#1ED760]/10 border border-[#1ED760]/20 rounded-xl flex items-center justify-center">
            <Shield className="text-[#1ED760]" size={20} />
          </div>
          <span className="text-2xl font-extrabold text-white tracking-tight">SAVEMATE</span>
        </div>

        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-3">
            {STEPS.map((label, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-[0_0_10px_rgba(30,215,96,0)]
                  ${i + 1 < step ? 'bg-[#1ED760] text-black shadow-[0_0_15px_rgba(30,215,96,0.3)]' :
                    i + 1 === step ? 'bg-[#1ED760] text-black ring-4 ring-[#1ED760]/30 shadow-[0_0_20px_rgba(30,215,96,0.5)]' :
                    'bg-white/5 text-gray-500 border border-white/10'}`}>
                  {i + 1 < step ? <CheckCircle size={14} /> : i + 1}
                </div>
                <span className={`text-[10px] font-black uppercase tracking-widest hidden sm:block ${i + 1 === step ? 'text-[#1ED760]' : 'text-gray-500'}`}>
                  {label}
                </span>
              </div>
            ))}
          </div>
          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#1ED760] rounded-full transition-all duration-500 shadow-glow"
              style={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }}
            />
          </div>
        </div>

        <h2 className="text-2xl md:text-3xl font-black text-white mb-2 tracking-tight">
          {step === 1 && t('step1Title')}
          {step === 2 && t('step2Title')}
          {step === 3 && t('step3Title')}
          {step === 4 && t('step4Title')}
        </h2>
        <p className="text-gray-400 text-sm font-medium mb-8">
          {step === 1 && t('step1Desc')}
          {step === 2 && t('step2Desc')}
          {step === 3 && t('step3Desc')}
          {step === 4 && t('step4Desc')}
        </p>

        {error && (
          <div className="mb-4 text-red-400 text-sm bg-red-500/10 border border-red-500/30 px-4 py-2.5 rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={step === 4 ? handleSubmit : (e) => { e.preventDefault(); nextStep(); }}>

          {/* ── Step 1: Account ── */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <Row>
                <Field label={t('fullName')} icon={User}>
                  <input type="text" required value={form.name} onChange={e => set('name', e.target.value)}
                    className="input-premium !pl-10" placeholder={t('fullName')} />
                </Field>
                <Field label={t('gender')} icon={User}>
                  <select required value={form.gender} onChange={e => set('gender', e.target.value)}
                    className="input-premium !pl-10 appearance-none text-white">
                    <option value="" className="bg-[#121212] text-white">{t('select')}</option>
                    <option value="Male" className="bg-[#121212] text-white">{t('male')}</option>
                    <option value="Female" className="bg-[#121212] text-white">{t('female')}</option>
                    <option value="Other" className="bg-[#121212] text-white">{t('other')}</option>
                  </select>
                </Field>
              </Row>
              <Field label={t('emailLabel')} icon={Mail}>
                <input type="email" required value={form.email} onChange={e => set('email', e.target.value)}
                  className="input-premium !pl-10" placeholder="you@example.com" />
              </Field>
              <Field label={t('phone')} icon={Phone}>
                <input type="tel" required value={form.phone} onChange={e => set('phone', e.target.value)}
                  className="input-premium !pl-10" placeholder={t('phonePlaceholder')} />
              </Field>
              <PasswordField label={t('password')} value={form.password} onChange={v => set('password', v)} placeholder={t('passwordPlaceholder')} />
              <PasswordField label={t('confirmPassword')} value={form.confirm_password} onChange={v => set('confirm_password', v)} placeholder={t('passwordPlaceholder')} />
            </div>
          )}

          {/* ── Step 2: Address ── */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <Field label={t('address')} icon={MapPin}>
                <textarea required value={form.address} onChange={e => set('address', e.target.value)}
                  className="input-premium !pl-10 h-24 resize-none" placeholder={t('addressPlaceholder')} />
              </Field>
              <Field label={t('pincode')} icon={Hash}>
                <input type="text" required maxLength={6} value={form.pincode} onChange={e => set('pincode', e.target.value)}
                  className="input-premium !pl-10" placeholder={t('pincodePlaceholder')} />
              </Field>
            </div>
          )}

          {/* ── Step 3: Financial ── */}
          {step === 3 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <Field label={t('occupation')} icon={Briefcase}>
                <input type="text" value={form.occupation} onChange={e => set('occupation', e.target.value)}
                  className="input-premium !pl-10" placeholder={t('occupationPlaceholder')} />
              </Field>
              <Row>
                <Field label={t('salary')} icon={Banknote}>
                  <input type="number" min="0" value={form.current_salary} onChange={e => set('current_salary', e.target.value)}
                    className="input-premium !pl-10" placeholder={t('salaryPlaceholder')} />
                </Field>
                <Field label={t('avgIncome')} icon={Banknote}>
                  <input type="number" min="0" value={form.average_income} onChange={e => set('average_income', e.target.value)}
                    className="input-premium !pl-10" placeholder={t('avgIncomePlaceholder')} />
                </Field>
              </Row>
              <Field label={t('workingDays')} icon={Calendar}>
                <input type="number" min="1" max="31" value={form.days_of_work} onChange={e => set('days_of_work', e.target.value)}
                  className="input-premium !pl-10" placeholder={t('daysPlaceholder')} />
              </Field>
            </div>
          )}

          {/* ── Step 4: Documents ── */}
          {step === 4 && (
            <div className="space-y-5 animate-in fade-in duration-200">

              {/* Profile photo */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
                  {t('profilePhoto')} <span className="text-slate-500">({t('optional')})</span>
                </label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-[#1a1a1a] border border-white/10 overflow-hidden flex items-center justify-center shrink-0">
                    {profilePreview
                      ? <img src={profilePreview} alt="Profile" className="w-full h-full object-cover" />
                      : <Camera className="text-slate-500" size={24} />
                    }
                  </div>
                  <label className="cursor-pointer flex-1">
                    <div className={`px-4 py-3 bg-[#1a1a1a] border border-white/10 rounded-xl text-sm font-bold text-slate-400 hover:border-[#1ED760]/30 hover:text-white transition-all flex items-center gap-2 ${uploadingProfile ? 'opacity-50' : ''}`}>
                      {uploadingProfile ? <Activity size={16} className="animate-spin" /> : <Camera size={16} />}
                      {uploadingProfile ? t('uploading') : t('choosePhoto')}
                    </div>
                    <input type="file" accept="image/*" className="hidden" onChange={handleProfilePhoto} disabled={uploadingProfile} />
                  </label>
                </div>
              </div>

              {/* Bank details */}
              <div className="pt-6 border-t border-white/5">
                <p className="text-xs font-bold text-white mb-4 flex items-center gap-2 uppercase tracking-widest">
                  <Building2 size={16} className="text-[#1ED760]" /> {t('bankDetails')}
                </p>
                <div className="space-y-4">
                  <Field label={t('bankName')} icon={Building2}>
                    <input type="text" value={form.bank_name} onChange={e => set('bank_name', e.target.value)}
                      className="input-premium !pl-10" placeholder={t('bankPlaceholder')} />
                  </Field>
                  <Row>
                    <Field label={t('accNumber')} icon={CreditCard}>
                      <input type="text" value={form.bank_account_number} onChange={e => set('bank_account_number', e.target.value)}
                        className="input-premium !pl-10" placeholder={t('accPlaceholder')} />
                    </Field>
                    <Field label={t('ifsc')} icon={Hash}>
                      <input type="text" value={form.bank_ifsc} onChange={e => set('bank_ifsc', e.target.value)}
                        className="input-premium !pl-10" placeholder={t('ifscPlaceholder')} />
                    </Field>
                  </Row>
                </div>
              </div>

              {/* KYC documents */}
              <div className="pt-6 border-t border-white/5">
                <p className="text-xs font-black text-white mb-4 flex items-center gap-2 uppercase tracking-widest">
                  <FileText size={16} className="text-[#1ED760]" /> {t('kycDocs')} <span className="text-gray-600 font-normal tracking-normal">({t('optional')})</span>
                </p>
                <div className="space-y-4">
                  <Field label={t('aadhaar')} icon={Hash}>
                    <input type="text" maxLength={12} value={form.aadhaar_number} onChange={e => set('aadhaar_number', e.target.value)}
                      className="input-premium !pl-10" placeholder={t('aadhaarPlaceholder')} />
                  </Field>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{t('panPhoto')}</label>
                    {panPreview && (
                      <img src={panPreview} alt="PAN" className="w-full h-32 object-cover rounded-xl border border-white/10 mb-3" />
                    )}
                    <label className="cursor-pointer block">
                      <div className={`px-4 py-3 bg-[#1a1a1a] border border-white/10 rounded-xl text-sm font-bold text-slate-400 hover:border-[#1ED760]/30 hover:text-white transition-all flex items-center gap-2 ${uploadingPan ? 'opacity-50' : ''}`}>
                        {uploadingPan ? <Activity size={16} className="animate-spin" /> : <FileText size={16} />}
                        {uploadingPan ? t('uploading') : panPreview ? t('replacePan') : t('uploadPan')}
                      </div>
                      <input type="file" accept="image/*" className="hidden" onChange={handlePanPhoto} disabled={uploadingPan} />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex gap-4 mt-8">
            {step > 1 && (
              <button type="button" onClick={prevStep}
                className="btn-secondary flex-[0.5] py-4">
                <ArrowLeft size={20} />
              </button>
            )}
            <button
              type="submit"
              disabled={loading || uploadingProfile || uploadingPan}
              className="btn-primary flex-1 py-4 text-base disabled:opacity-50"
            >
              {loading
                ? <Activity size={20} className="animate-spin" />
                : step === 4
                  ? <><Shield size={20} /> {t('createAccount')}</>
                  : <>{t('next')} <ArrowRight size={20} /></>
              }
            </button>
          </div>
        </form>

        <p className="mt-8 text-center text-slate-400 text-sm font-medium">
          {t('alreadyHaveAccount')}{' '}
          <Link href={`/${locale}`} className="text-white font-bold hover:underline underline-offset-4 transition-colors"> {t('signIn')}</Link>
        </p>
      </div>
    </div>
  );
}

function Row({ children }) {
  return <div className="grid grid-cols-2 gap-3">{children}</div>;
}

function Field({ label, icon: Icon, children }) {
  return (
    <div className="group">
      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 group-focus-within:text-[#1ED760] transition-colors">{label}</label>
      <div className="relative">
        {Icon && <Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-[#1ED760] transition-colors pointer-events-none" size={18} />}
        {children}
      </div>
    </div>
  );
}

function PasswordField({ label, value, onChange, placeholder }) {
  const [show, setShow] = useState(false);
  return (
    <div className="group">
      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 group-focus-within:text-[#1ED760] transition-colors">{label}</label>
      <div className="relative">
        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-[#1ED760] transition-colors pointer-events-none" size={18} />
        <input
          type={show ? 'text' : 'password'} required
          value={value} onChange={e => onChange(e.target.value)}
          className="input-premium !pl-10 !pr-10"
          placeholder={placeholder}
        />
        <button type="button" onClick={() => setShow(s => !s)}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors">
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );
}