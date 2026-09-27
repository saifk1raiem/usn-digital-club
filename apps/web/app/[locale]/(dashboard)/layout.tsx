import { DashboardShell } from '@/components/dashboard-shell';
import { isLocale } from '@/i18n';
import { notFound } from 'next/navigation';
export default async function DashboardLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) { const { locale } = await params; if (!isLocale(locale)) notFound(); return <DashboardShell locale={locale}>{children}</DashboardShell>; }
