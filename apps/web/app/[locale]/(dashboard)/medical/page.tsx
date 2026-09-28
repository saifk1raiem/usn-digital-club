'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { SessionUser } from '@usn/types';
import { Badge, EmptyState, LoadingState } from '@usn/ui';
import { HeartPulse, Plus } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { PageHeading } from '@/components/page-heading';
import type { WebLocale } from '@/i18n';
import { api } from '@/lib/api';

type Player = { id: string; person: { fullNameAr: string; firstName: string; lastName: string } };
type MedicalCase = { id: string; issue: string; bodyArea?: string | null; status: string; occurredAt: string; expectedReturnAt?: string | null; rehabilitationPhase?: string | null; player: Player };
type Form = { playerId: string; issue: string; bodyArea: string; occurredAt: string; status: string; expectedReturnAt: string; confidentialNotes: string };

export default function MedicalPage() {
  const { locale } = useParams<{ locale: WebLocale }>();
  const ar = locale === 'ar';
  const cache = useQueryClient();
  const [creating, setCreating] = useState(false);
  const session = useQuery({ queryKey: ['session'], queryFn: () => api<{ data: SessionUser }>('/auth/me') });
  const cases = useQuery({ queryKey: ['medical-cases'], queryFn: () => api<{ data: MedicalCase[] }>('/medical') });
  const players = useQuery({ queryKey: ['players'], queryFn: () => api<{ data: Player[] }>('/players') });
  const canEdit = session.data?.data.permissions.includes('medical.edit') ?? false;
  const { register, handleSubmit, reset } = useForm<Form>({ defaultValues: { status: 'UNAVAILABLE', occurredAt: new Date().toISOString().slice(0, 10) } });
  const create = useMutation({ mutationFn: (values: Form) => api('/medical', { method: 'POST', body: JSON.stringify({ ...values, occurredAt: new Date(values.occurredAt).toISOString(), expectedReturnAt: values.expectedReturnAt ? new Date(values.expectedReturnAt).toISOString() : undefined, bodyArea: values.bodyArea || undefined, confidentialNotes: values.confidentialNotes || undefined }) }), onSuccess: async () => { await Promise.all([cache.invalidateQueries({ queryKey: ['medical-cases'] }), cache.invalidateQueries({ queryKey: ['players'] })]); reset(); setCreating(false); } });
  const name = (player: Player) => ar ? player.person.fullNameAr : `${player.person.firstName} ${player.person.lastName}`;

  return <>
    <PageHeading eyebrow="PLAYER AVAILABILITY" title={ar ? 'الإطار الطبي' : 'Suivi médical'} description={ar ? 'متابعة الجاهزية مع حماية تفاصيل العلاج الحساسة' : 'Suivi des disponibilités avec protection des détails confidentiels'} action={canEdit ? <button className="usn-button action-button" onClick={() => setCreating((value) => !value)}><Plus size={17} />{ar ? 'حالة جديدة' : 'Nouveau dossier'}</button> : undefined} />
    {creating ? <form className="operation-form" onSubmit={handleSubmit((values) => create.mutate(values))}>
      <select {...register('playerId', { required: true })}><option value="">{ar ? 'اختر اللاعب' : 'Choisir le joueur'}</option>{players.data?.data.map((player) => <option key={player.id} value={player.id}>{name(player)}</option>)}</select>
      <input placeholder={ar ? 'الإصابة أو الحالة' : 'Blessure ou problème'} {...register('issue', { required: true })} />
      <input placeholder={ar ? 'موضع الإصابة' : 'Zone du corps'} {...register('bodyArea')} />
      <input type="date" {...register('occurredAt', { required: true })} />
      <select {...register('status')}><option value="UNAVAILABLE">UNAVAILABLE</option><option value="LIMITED">LIMITED</option><option value="INDIVIDUAL_TRAINING">INDIVIDUAL TRAINING</option><option value="RETURN_TO_TRAINING">RETURN TO TRAINING</option><option value="MATCH_READY">MATCH READY</option><option value="AVAILABLE">AVAILABLE</option></select>
      <input type="date" {...register('expectedReturnAt')} />
      <textarea className="form-wide" placeholder={ar ? 'ملاحظات طبية سرية' : 'Notes médicales confidentielles'} {...register('confidentialNotes')} />
      <div className="form-actions form-wide"><button className="usn-button" disabled={create.isPending}>{ar ? 'حفظ' : 'Enregistrer'}</button>{create.isError ? <span>{ar ? 'تعذر حفظ الحالة' : 'Enregistrement impossible'}</span> : null}</div>
    </form> : null}
    {cases.isLoading ? <LoadingState label={ar ? 'جار التحميل…' : 'Chargement…'} /> : !cases.data?.data.length ? <EmptyState title={ar ? 'لا توجد حالات طبية' : 'Aucun dossier médical'} message={ar ? 'كل اللاعبين متاحون حاليا' : 'Tous les joueurs sont actuellement disponibles'} /> : <div className="phase-grid">{cases.data.data.map((item) => <article className="phase-card" key={item.id}><div className="phase-card-icon"><HeartPulse /></div><div><span>{name(item.player)}</span><h2>{item.issue}</h2><p>{item.bodyArea || '—'} · {new Date(item.occurredAt).toLocaleDateString(ar ? 'ar-TN' : 'fr-TN')}</p>{item.expectedReturnAt ? <small>{ar ? 'العودة المتوقعة: ' : 'Retour prévu : '}{new Date(item.expectedReturnAt).toLocaleDateString(ar ? 'ar-TN' : 'fr-TN')}</small> : null}</div><Badge tone={item.status === 'AVAILABLE' || item.status === 'MATCH_READY' ? 'green' : 'red'}>{item.status.replaceAll('_', ' ')}</Badge></article>)}</div>}
  </>;
}
