import createMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import { locales, defaultLocale } from './i18n';

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  // Always show locale prefix: /en, /hi, /kn
  localePrefix: 'always',
  // Enable auto-detection from Accept-Language header
  localeDetection: true,
});

export default function proxy(request) {
  const pathname = request.nextUrl.pathname;

  // Protected routes require auth_token cookie
  const isProtectedRoute = /^\/(en|hi|kn)\/(dashboard|demotrading)/.test(pathname);

  if (isProtectedRoute) {
    const token = request.cookies.get('auth_token')?.value;
    if (!token) {
      const locale = pathname.split('/')[1] || defaultLocale;
      return NextResponse.redirect(new URL(`/${locale}`, request.url));
    }
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};
