'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { SessionUser } from '@usn/types';
import { LoadingState } from '@usn/ui';
import { ArrowLeft, CalendarClock, CheckCircle2, Clock3, MapPin, Users } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { PageHeading } from '@/components/page-heading';
import type { WebLocale } from '@/i18n';
import { api } from '@/lib/api';

type Attendance = { playerId: string; status?: string | null; response: string; coachNote?: string | null; player: { person: { fullNameAr: string; firstName: string; lastName: string } } };
type Training = { id: string; startsAt: string; endsAt: string; type: string; objective?: string | null; notes?: string | null; category: { nameAr: string; nameFr: string }; facility?: { nameAr: string; nameFr: string } | null; attendance: Attendance[] };
const statuses = ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED', 'INJURED'];

export default function TrainingAttendancePage() {
  const { locale, id } = useParams<{ locale: WebLocale; id: string }>();
  const ar = locale === 'ar';
  const cache = useQueryClient();
  const [changes, setChanges] = useState<Record<string, string>>({});
  const session = useQuery({ queryKey: ['session'], queryFn: () => api<{ data: SessionUser }>('/auth/me') });
  const query = useQuery({ queryKey: ['training', id], queryFn: () => api<{ data: Training }>(`/trainings/${id}`) });
  const canManageAttendance = session.data?.data.permissions.includes('training.manageAttendance') ?? false;
  const memberOnly = Boolean(session.data?.data.roles.some((role) => role === 'PLAYER' || role === 'PARENT')) && !session.data?.data.permissions.includes('training.create') && !canManageAttendance;
  const save = useMutation({ mutationFn: () => api(`/trainings/${id}/attendance`, { method: 'PUT', body: JSON.stringify({ records: query.data!.data.attendance.map((row) => ({ playerId: row.playerId, status: changes[row.playerId] || row.status || 'PRESENT' })) }) }), onSuccess: async () => { setChanges({}); await cache.invalidateQueries({ queryKey: ['training', id] }); } });
  if (query.isLoading || session.isLoading || !query.data) return <LoadingState label={ar ? 'جار التحميل…' : 'Chargement…'} />;
  const training = query.data.data;
  const date = new Intl.DateTimeFormat(ar ? 'ar-TN' : 'fr-TN', { dateStyle: 'full' }).format(new Date(training.startsAt));
  const time = new Intl.DateTimeFormat(ar ? 'ar-TN' : 'fr-TN', { hour: '2-digit', minute: '2-digit' });
  return <>
    <PageHeading eyebrow={ar ? training.category.nameAr : training.category.nameFr} title={canManageAttendance ? (ar ? 'سجل الحضور' : 'Feuille de présence') : (ar ? 'تفاصيل الحصة' : 'Détails de la séance')} description={`${training.type.replaceAll('_', ' ')} · ${date}`} action={<Link className="ghost-button" href={`/${locale}/trainings`}><ArrowLeft size={16} />{ar ? 'عودة' : 'Retour'}</Link>} />
    <div className="training-summary">
      <div><CalendarClock /><span>{ar ? 'التاريخ' : 'Date'}<b>{date}</b></span></div>
      <div><Clock3 /><span>{ar ? 'التوقيت' : 'Horaire'}<b>{time.format(new Date(training.startsAt))} – {time.format(new Date(training.endsAt))}</b></span></div>
      <div><MapPin /><span>{ar ? 'الملعب' : 'Terrain'}<b>{training.facility ? (ar ? training.facility.nameAr : training.facility.nameFr) : '—'}</b></span></div>
      <div><Users /><span>{ar ? 'اللاعبون' : 'Joueurs'}<b>{training.attendance.length}</b></span></div>
    </div>
    {memberOnly ? <div className="readonly-notice"><CalendarClock size={18} /><div><b>{ar ? 'عرض فقط' : 'Lecture seule'}</b><span>{ar ? 'هذه الحصة مبرمجة لك ولا يمكنك تعديل بياناتها.' : 'Cette séance vous est assignée et ne peut pas être modifiée.'}</span></div></div> : null}
    <div className="data-card attendance-sheet"><div className="attendance-toolbar"><div><CheckCircle2 /><b>{training.objective || (ar ? 'قائمة اللاعبين المدعوين' : 'Liste des joueurs convoqués')}</b></div>{canManageAttendance && training.attendance.length > 0 ? <button className="usn-button" onClick={() => save.mutate()} disabled={save.isPending}>{save.isPending ? '...' : ar ? 'حفظ الحضور' : 'Enregistrer'}</button> : null}</div>
      {training.attendance.length ? <div className="table-wrap"><table><thead><tr><th>{ar ? 'اللاعب' : 'Joueur'}</th><th>{ar ? 'رد اللاعب' : 'Réponse'}</th><th>{ar ? 'الحضور' : 'Présence'}</th></tr></thead><tbody>{training.attendance.map((row) => <tr key={row.playerId}><td><b>{ar ? row.player.person.fullNameAr : `${row.player.person.firstName} ${row.player.person.lastName}`}</b></td><td>{row.response}</td><td>{canManageAttendance ? <select className="table-select" value={changes[row.playerId] || row.status || 'PRESENT'} onChange={(event) => setChanges((current) => ({ ...current, [row.playerId]: event.target.value }))}>{statuses.map((status) => <option key={status}>{status}</option>)}</select> : <span className="readonly-value">{row.status || (ar ? 'لم تسجل بعد' : 'Non enregistrée')}</span>}</td></tr>)}</tbody></table></div> : <p className="muted-empty">{ar ? 'لا يوجد لاعبون مدعوون لهذه الحصة.' : 'Aucun joueur convoqué pour cette séance.'}</p>}
    </div>
  </>;
}
