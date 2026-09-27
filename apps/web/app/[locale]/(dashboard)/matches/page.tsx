'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MapPin, Plus, Shirt } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { EmptyState, LoadingState } from '@usn/ui';
import { PageHeading } from '@/components/page-heading';
import { api } from '@/lib/api';
import type { WebLocale } from '@/i18n';

type Named = { id: string; nameAr: string; nameFr: string };
type Season = { id: string; isCurrent: boolean };
type Match = { id: string; competition: string; opponent: string; venueSide: string; kickoffAt: string; type: string; stadium?: string | null; homeScore?: number | null; awayScore?: number | null; category: Named; facility?: Named | null; _count: { squad: number } };
type Form = { categoryId: string; facilityId: string; competition: string; opponent: string; venueSide: string; kickoffAt: string; meetingAt: string; type: string; stadium: string };

export default function MatchesPage() {
  const { locale } = useParams<{ locale: WebLocale }>(); const ar = locale === 'ar'; const cache = useQueryClient(); const [creating, setCreating] = useState(false);
  const matches = useQuery({ queryKey: ['matches'], queryFn: () => api<{ data: Match[] }>('/matches') });
  const categories = useQuery({ queryKey: ['categories'], queryFn: () => api<{ data: Named[] }>('/categories') });
  const facilities = useQuery({ queryKey: ['facilities'], queryFn: () => api<{ data: Named[] }>('/facilities') });
  const seasons = useQuery({ queryKey: ['seasons'], queryFn: () => api<{ data: Season[] }>('/seasons') });
  const { register, handleSubmit, reset } = useForm<Form>({ defaultValues: { type: 'LEAGUE', venueSide: 'HOME' } });
  const create = useMutation({ mutationFn: (values: Form) => api('/matches', { method: 'POST', body: JSON.stringify({ ...values, seasonId: seasons.data?.data.find((item) => item.isCurrent)?.id, kickoffAt: new Date(values.kickoffAt).toISOString(), meetingAt: values.meetingAt ? new Date(values.meetingAt).toISOString() : undefined, facilityId: values.facilityId || undefined, stadium: values.stadium || undefined }) }), onSuccess: async () => { await cache.invalidateQueries({ queryKey: ['matches'] }); reset(); setCreating(false); } });
  const label = (item: Named) => ar ? item.nameAr : item.nameFr;
  return <><PageHeading eyebrow="MATCH CENTER" title={ar ? 'المباريات' : 'Matchs'} description={ar ? 'إدارة البرنامج، القائمة والنتائج' : 'Gérez le calendrier, les convocations et les résultats'} action={<button className="usn-button action-button" onClick={() => setCreating((value) => !value)}><Plus size={17} />{ar ? 'مباراة جديدة' : 'Nouveau match'}</button>} />
    {creating && <form className="operation-form" onSubmit={handleSubmit((values) => create.mutate(values))}><select {...register('categoryId', { required: true })}><option value="">{ar ? 'الصنف' : 'Catégorie'}</option>{categories.data?.data.map((item) => <option key={item.id} value={item.id}>{label(item)}</option>)}</select><input placeholder={ar ? 'المسابقة' : 'Compétition'} {...register('competition', { required: true })} /><input placeholder={ar ? 'المنافس' : 'Adversaire'} {...register('opponent', { required: true })} /><select {...register('venueSide')}><option value="HOME">HOME</option><option value="AWAY">AWAY</option><option value="NEUTRAL">NEUTRAL</option></select><input type="datetime-local" {...register('kickoffAt', { required: true })} /><input type="datetime-local" {...register('meetingAt')} /><select {...register('type')}><option value="LEAGUE">LEAGUE</option><option value="CUP">CUP</option><option value="FRIENDLY">FRIENDLY</option><option value="TOURNAMENT">TOURNAMENT</option></select><select {...register('facilityId')}><option value="">{ar ? 'الملعب' : 'Installation'}</option>{facilities.data?.data.map((item) => <option key={item.id} value={item.id}>{label(item)}</option>)}</select><input className="form-wide" placeholder={ar ? 'اسم الملعب' : 'Nom du stade'} {...register('stadium')} /><div className="form-actions form-wide"><button className="usn-button" disabled={create.isPending}>{create.isPending ? '...' : ar ? 'حفظ' : 'Enregistrer'}</button>{create.isError && <span>{ar ? 'تعذر الحفظ' : "Impossible d'enregistrer"}</span>}</div></form>}
    {matches.isLoading ? <LoadingState label={ar ? 'جار التحميل…' : 'Chargement…'} /> : !matches.data?.data.length ? <EmptyState title={ar ? 'لا توجد مباريات' : 'Aucun match'} message={ar ? 'أضف أول مباراة' : 'Ajoutez le premier match'} /> : <div className="operation-grid">{matches.data.data.map((match) => <Link href={`/${locale}/matches/${match.id}`} className="operation-card match-card" key={match.id}><div className="match-date"><b>{new Intl.DateTimeFormat(ar ? 'ar-TN' : 'fr-TN', { day: '2-digit' }).format(new Date(match.kickoffAt))}</b><span>{new Intl.DateTimeFormat(ar ? 'ar-TN' : 'fr-TN', { month: 'short' }).format(new Date(match.kickoffAt))}</span></div><div className="operation-main"><span>{label(match.category)} · {match.competition}</span><h2>USN <em>{match.homeScore == null ? '×' : `${match.homeScore} - ${match.awayScore}`}</em> {match.opponent}</h2><p><MapPin size={13} />{match.stadium || (match.facility && label(match.facility)) || match.venueSide}</p></div><div className="operation-meta"><Shirt size={16} /><b>{match._count.squad}</b><small>{ar ? 'بالقائمة' : 'convoqués'}</small></div></Link>)}</div>}
  </>;
}
