"use client";

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { useTransition, useEffect } from 'react';
import { Globe } from 'lucide-react';

const LANG_LABELS = {
  en: 'EN',
  hi: 'हि',
  kn: 'ಕ',
};

const LANG_FULL = {
  en: 'English',
  hi: 'हिन्दी',
  kn: 'ಕನ್ನಡ',
};

export default function LanguageSwitcher() {
  const [isPending, startTransition] = useTransition();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  // On mount, if localStorage has a stored preference different from current
  // locale, redirect to it (one-time correction on first load).
  useEffect(() => {
    const stored = localStorage.getItem('savemate_locale');
    if (stored && stored !== locale && ['en', 'hi', 'kn'].includes(stored)) {
      const newPath = pathname.replace(`/${locale}`, `/${stored}`);
      router.replace(newPath);
    }
  }, []); // run once on mount

  const switchLocale = (nextLocale) => {
    if (nextLocale === locale) return;

    // Persist preference
    localStorage.setItem('savemate_locale', nextLocale);

    // Replace current locale segment in the path
    const newPath = pathname.replace(`/${locale}`, `/${nextLocale}`);

    startTransition(() => {
      router.replace(newPath);
    });
  };

  return (
    <div className="flex items-center gap-1 bg-white/5 border border-white/5 rounded-xl p-1">
      <Globe size={14} className="text-[#888888] ml-1.5" />
      {Object.entries(LANG_LABELS).map(([code, short]) => (
        <button
          key={code}
          onClick={() => switchLocale(code)}
          disabled={isPending}
          title={LANG_FULL[code]}
          className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all disabled:opacity-50 uppercase tracking-tighter ${
            locale === code
              ? 'bg-[#1ED760] text-black shadow-glow'
              : 'text-[#888888] hover:text-white hover:bg-white/5'
          }`}
        >
          {short}
        </button>
      ))}
    </div>
  );
}
