'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { LoadingState } from '@usn/ui';
import { PageHeading } from '@/components/page-heading';
import { api } from '@/lib/api';
import type { WebLocale } from '@/i18n';

type Attendance = { playerId: string; status?: string | null; response: string; coachNote?: string | null; player: { person: { fullNameAr: string; firstName: string; lastName: string } } };
type Training = { id: string; startsAt: string; type: string; objective?: string | null; category: { nameAr: string; nameFr: string }; attendance: Attendance[] };
const statuses = ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED', 'INJURED'];
export default function TrainingAttendancePage() {
  const { locale, id } = useParams<{ locale: WebLocale; id: string }>(); const ar = locale === 'ar'; const cache = useQueryClient(); const [changes, setChanges] = useState<Record<string, string>>({});
  const query = useQuery({ queryKey: ['training', id], queryFn: () => api<{ data: Training }>(`/trainings/${id}`) });
  const save = useMutation({ mutationFn: () => api(`/trainings/${id}/attendance`, { method: 'PUT', body: JSON.stringify({ records: query.data!.data.attendance.map((row) => ({ playerId: row.playerId, status: changes[row.playerId] || row.status || 'PRESENT' })) }) }), onSuccess: async () => { setChanges({}); await cache.invalidateQueries({ queryKey: ['training', id] }); } });
  if (query.isLoading || !query.data) return <LoadingState label={ar ? 'جار التحميل…' : 'Chargement…'} />;
  const training = query.data.data;
  return <><PageHeading eyebrow={ar ? training.category.nameAr : training.category.nameFr} title={ar ? 'سجل الحضور' : 'Feuille de présence'} description={`${training.type.replaceAll('_', ' ')} · ${new Date(training.startsAt).toLocaleString(ar ? 'ar-TN' : 'fr-TN')}`} action={<Link className="ghost-button" href={`/${locale}/trainings`}><ArrowLeft size={16} />{ar ? 'عودة' : 'Retour'}</Link>} />
    <div className="data-card attendance-sheet"><div className="attendance-toolbar"><div><CheckCircle2 /><b>{training.objective || (ar ? 'تسجيل الحضور النهائي' : 'Présence finale')}</b></div>{training.attendance.length > 0 && <button className="usn-button" onClick={() => save.mutate()} disabled={save.isPending}>{save.isPending ? '...' : ar ? 'حفظ الحضور' : 'Enregistrer'}</button>}</div>
      {training.attendance.length ? <div className="table-wrap"><table><thead><tr><th>{ar ? 'اللاعب' : 'Joueur'}</th><th>{ar ? 'رد اللاعب' : 'Réponse'}</th><th>{ar ? 'الحضور' : 'Présence'}</th></tr></thead><tbody>{training.attendance.map((row) => <tr key={row.playerId}><td><b>{ar ? row.player.person.fullNameAr : `${row.player.person.firstName} ${row.player.person.lastName}`}</b></td><td>{row.response}</td><td><select className="table-select" value={changes[row.playerId] || row.status || 'PRESENT'} onChange={(event) => setChanges((current) => ({ ...current, [row.playerId]: event.target.value }))}>{statuses.map((status) => <option key={status}>{status}</option>)}</select></td></tr>)}</tbody></table></div> : <p className="muted-empty">{ar ? 'لا يوجد لاعبون مسجلون في هذا الصنف.' : 'Aucun joueur inscrit dans cette catégorie.'}</p>}
    </div></>;
}
