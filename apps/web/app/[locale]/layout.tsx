import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Providers } from '../providers';
import { isLocale } from '@/i18n';
import '../globals.css';
export const metadata: Metadata = { title: 'USN Digital Club', description: 'Private club operating system for Union Sportive de Nadhour' };
export function generateStaticParams() { return [{ locale: 'ar' }, { locale: 'fr' }]; }
export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) { const { locale } = await params; if (!isLocale(locale)) notFound(); return <html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'}><body><Providers>{children}</Providers></body></html>; }
