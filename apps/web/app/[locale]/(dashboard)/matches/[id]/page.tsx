'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { LoadingState } from '@usn/ui';
import { PageHeading } from '@/components/page-heading';
import { api } from '@/lib/api';
import type { WebLocale } from '@/i18n';

type Player = { id: string; person: { fullNameAr: string; firstName: string; lastName: string }; seasons: Array<{ jerseyNumber?: number | null }> };
type Match = { id: string; opponent: string; competition: string; kickoffAt: string; categoryId: string; category: { nameAr: string; nameFr: string }; formation?: string | null; tacticalNotes?: string | null; homeScore?: number | null; awayScore?: number | null; squad: Array<{ playerId: string; isStarter: boolean; player: Player }>; events: Array<{ id: string; type: string; minute: number; player?: Player | null }> };
type Result = { homeScore: number; awayScore: number; coachNotes: string };
export default function MatchCenterPage() {
  const { locale, id } = useParams<{ locale: WebLocale; id: string }>(); const ar = locale === 'ar'; const cache = useQueryClient(); const [selected, setSelected] = useState<Record<string, boolean>>({});
  const match = useQuery({ queryKey: ['match', id], queryFn: () => api<{ data: Match }>(`/matches/${id}`) });
  const categoryId = match.data?.data.categoryId; const players = useQuery({ queryKey: ['players', categoryId], enabled: Boolean(categoryId), queryFn: () => api<{ data: Player[] }>(`/players?categoryId=${categoryId}`) });
  const initial = useMemo(() => new Set(match.data?.data.squad.map((item) => item.playerId) ?? []), [match.data]);
  const squad = useMutation({ mutationFn: () => api(`/matches/${id}/squad`, { method: 'PUT', body: JSON.stringify({ players: players.data!.data.filter((player) => selected[player.id] ?? initial.has(player.id)).map((player, index) => ({ playerId: player.id, isStarter: index < 11, shirtNumber: player.seasons[0]?.jerseyNumber })), formation: match.data?.data.formation || '4-3-3' }) }), onSuccess: () => cache.invalidateQueries({ queryKey: ['match', id] }) });
  const { register, handleSubmit } = useForm<Result>({ values: { homeScore: match.data?.data.homeScore ?? 0, awayScore: match.data?.data.awayScore ?? 0, coachNotes: '' } });
  const result = useMutation({ mutationFn: (values: Result) => api(`/matches/${id}/result`, { method: 'PATCH', body: JSON.stringify({ ...values, homeScore: Number(values.homeScore), awayScore: Number(values.awayScore) }) }), onSuccess: () => cache.invalidateQueries({ queryKey: ['match', id] }) });
  if (match.isLoading || !match.data) return <LoadingState label={ar ? 'جار التحميل…' : 'Chargement…'} />; const data = match.data.data;
  return <><PageHeading eyebrow={`${data.competition} · ${ar ? data.category.nameAr : data.category.nameFr}`} title={`USN × ${data.opponent}`} description={new Date(data.kickoffAt).toLocaleString(ar ? 'ar-TN' : 'fr-TN')} action={<Link className="ghost-button" href={`/${locale}/matches`}><ArrowLeft size={16} />{ar ? 'عودة' : 'Retour'}</Link>} />
    <div className="detail-grid"><section className="data-card panel-padding"><div className="panel-title"><div><span className="eyebrow">SQUAD</span><h2>{ar ? 'قائمة المباراة' : 'Convocation'}</h2></div>{players.data?.data.length ? <button className="usn-button" disabled={squad.isPending} onClick={() => squad.mutate()}>{ar ? 'حفظ القائمة' : 'Enregistrer'}</button> : null}</div>{players.data?.data.length ? <div className="selection-list">{players.data.data.map((player) => { const checked = selected[player.id] ?? initial.has(player.id); return <label key={player.id}><input type="checkbox" checked={checked} onChange={(event) => setSelected((current) => ({ ...current, [player.id]: event.target.checked }))} /><span className="avatar">{player.person.fullNameAr.slice(0, 1)}</span><b>{ar ? player.person.fullNameAr : `${player.person.firstName} ${player.person.lastName}`}</b><small>#{player.seasons[0]?.jerseyNumber ?? '—'}</small></label>; })}</div> : <p className="muted-empty">{ar ? 'لا يوجد لاعبون في الصنف.' : 'Aucun joueur dans cette catégorie.'}</p>}</section>
      <section className="data-card panel-padding"><div className="panel-title"><div><span className="eyebrow">RESULT</span><h2>{ar ? 'نتيجة المباراة' : 'Résultat'}</h2></div></div><form className="score-form" onSubmit={handleSubmit((values) => result.mutate(values))}><label><span>USN</span><input type="number" min="0" {...register('homeScore', { valueAsNumber: true })} /></label><b>—</b><label><span>{data.opponent}</span><input type="number" min="0" {...register('awayScore', { valueAsNumber: true })} /></label><textarea placeholder={ar ? 'ملاحظات المدرب' : "Notes de l'entraîneur"} {...register('coachNotes')} /><button className="usn-button" disabled={result.isPending}>{ar ? 'تثبيت النتيجة' : 'Valider le résultat'}</button></form></section></div>
  </>;
}
