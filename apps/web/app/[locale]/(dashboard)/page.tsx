'use client';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, ArrowLeft, Boxes, CalendarCheck2, CalendarDays, Clock3, FileWarning, HeartPulse, MapPin, PackageSearch, ScrollText, Users, UserRoundCog } from 'lucide-react';
import { Card, LoadingState } from '@usn/ui';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { getMessages, type WebLocale } from '@/i18n';
import { PageHeading } from '@/components/page-heading';

type Overview = { season: { name: string } | null; stats: { players: number; categories: number; staff: number; injured: number; expiringDocuments: number; expiringContracts: number; equipmentIssues: number }; upcomingTrainings: Array<{ id: string; startsAt: string; endsAt: string; type: string; objective?: string | null; category: { nameAr: string; nameFr: string }; facility?: { nameAr: string; nameFr: string } | null; _count: { attendance: number } }>; upcomingMatches: Array<{ id: string; kickoffAt: string; opponent: string; category: { nameAr: string; nameFr: string } }> };
export default function DashboardPage() {
  const { locale } = useParams<{ locale: WebLocale }>(); const t = getMessages(locale);
  const query = useQuery({ queryKey: ['overview'], queryFn: () => api<{ data: Overview }>('/dashboard/overview') });
  if (query.isLoading) return <LoadingState label={t.common.loading} />;
  if (query.isError || !query.data) return <div className="error-panel"><AlertTriangle /><h2>{t.common.unavailable}</h2><button className="usn-button" onClick={() => query.refetch()}>{t.common.retry}</button></div>;
  const { stats, upcomingMatches, upcomingTrainings, season } = query.data.data;
  const cards = [
    [t.dashboard.players, stats.players, Users, 'gold'], [t.dashboard.categories, stats.categories, Boxes, 'blue'], [t.dashboard.staff, stats.staff, UserRoundCog, 'blue'], [t.dashboard.injured, stats.injured, HeartPulse, 'red'],
    [t.dashboard.documents, stats.expiringDocuments, FileWarning, 'gold'], [t.dashboard.contracts, stats.expiringContracts, ScrollText, 'gold'], [t.dashboard.equipment, stats.equipmentIssues, PackageSearch, 'red'],
  ] as const;
  const events = [...upcomingTrainings.map((event) => ({ id: `t-${event.id}`, date: event.startsAt, title: locale === 'ar' ? 'حصة تدريبية' : 'Entraînement', detail: locale === 'ar' ? event.category.nameAr : event.category.nameFr, kind: 'training' })), ...upcomingMatches.map((event) => ({ id: `m-${event.id}`, date: event.kickoffAt, title: locale === 'ar' ? `مباراة ضد ${event.opponent}` : `Match contre ${event.opponent}`, detail: locale === 'ar' ? event.category.nameAr : event.category.nameFr, kind: 'match' }))].sort((a, b) => +new Date(a.date) - +new Date(b.date)).slice(0, 5);
  const nextTraining = upcomingTrainings[0];
  const time = new Intl.DateTimeFormat(locale === 'ar' ? 'ar-TN' : 'fr-TN', { hour: '2-digit', minute: '2-digit' });
  return <>
    <PageHeading eyebrow={`${t.common.season} ${season?.name ?? '2026/2027'}`} title={t.dashboard.welcome} description={t.dashboard.subtitle} />
    {nextTraining ? <Link href={`/${locale}/trainings/${nextTraining.id}`} className="next-session-card"><div className="next-session-icon"><CalendarCheck2 /></div><div className="next-session-main"><span>{locale === 'ar' ? 'الحصة القادمة' : 'PROCHAINE SÉANCE'}</span><h2>{locale === 'ar' ? nextTraining.category.nameAr : nextTraining.category.nameFr}</h2><p>{new Intl.DateTimeFormat(locale === 'ar' ? 'ar-TN' : 'fr-TN', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(nextTraining.startsAt))}</p></div><div className="next-session-meta"><b><Clock3 />{time.format(new Date(nextTraining.startsAt))} – {time.format(new Date(nextTraining.endsAt))}</b><span><MapPin />{nextTraining.facility ? (locale === 'ar' ? nextTraining.facility.nameAr : nextTraining.facility.nameFr) : (locale === 'ar' ? 'يحدد لاحقا' : 'À confirmer')}</span></div><ArrowLeft className="next-session-arrow" /></Link> : null}
    <section className="section-heading"><div><span>{t.dashboard.operations}</span><h2>{t.dashboard.overview}</h2></div></section>
    <div className="stats-grid">{cards.map(([label, value, Icon, tone]) => <Card className={`stat-card stat-card--${tone}`} key={label}><div className="stat-icon"><Icon size={21} /></div><div><strong>{value}</strong><span>{label}</span></div></Card>)}</div>
    <div className="dashboard-grid"><Card className="schedule-card"><div className="card-title"><div><span className="eyebrow">USN</span><h2>{t.dashboard.upcoming}</h2></div><CalendarDays /></div>{events.length ? <div className="event-list">{events.map((event) => <div className="event-row" key={event.id}><time><b>{new Intl.DateTimeFormat(locale === 'ar' ? 'ar-TN' : 'fr-TN', { day: '2-digit' }).format(new Date(event.date))}</b><span>{new Intl.DateTimeFormat(locale === 'ar' ? 'ar-TN' : 'fr-TN', { month: 'short' }).format(new Date(event.date))}</span></time><div><b>{event.title}</b><span>{event.detail} · {new Intl.DateTimeFormat(locale === 'ar' ? 'ar-TN' : 'fr-TN', { hour: '2-digit', minute: '2-digit' }).format(new Date(event.date))}</span></div><span className={`event-dot event-dot--${event.kind}`} /></div>)}</div> : <p className="muted-empty">{t.dashboard.noEvents}</p>}</Card>
      <Card className="identity-card"><div className="identity-mark"><img src="https://u-s-n.vercel.app/favicon.png" alt="USN" /></div><span>UNION SPORTIVE</span><h2>DE NADHOUR</h2><div className="identity-rule" /><p>منذ 1977 · الناظور</p><small>نحو إدارة رياضية أكثر تنظيما</small></Card></div>
  </>;
}
