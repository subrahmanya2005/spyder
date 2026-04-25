import '../globals.css';
import Script from "next/script";
import { Poppins } from 'next/font/google';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
});

import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';

export const metadata = {
  title: 'SaveMate - Goal-Based Savings',
  description: 'Dynamic savings app for irregular income earners.',
};

export default async function RootLayout({ children, params }) {
  const { locale } = await params;
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className={`${poppins.className} antialiased bg-[#0B0F0E] text-white`}>
                <Script src="https://checkout.razorpay.com/v1/checkout.js" />


        <NextIntlClientProvider messages={messages} locale={locale}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
