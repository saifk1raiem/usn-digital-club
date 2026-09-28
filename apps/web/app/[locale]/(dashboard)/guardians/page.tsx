'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { SessionUser } from '@usn/types';
import { EmptyState, LoadingState } from '@usn/ui';
import { Plus, UserRoundCheck } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { PageHeading } from '@/components/page-heading';
import type { WebLocale } from '@/i18n';
import { api } from '@/lib/api';

type Player = { id: string; person: { fullNameAr: string; firstName: string; lastName: string } };
type Guardian = { id: string; relationship?: string | null; person: { fullNameAr: string; firstName: string; lastName: string; phone?: string | null }; players: Array<{ player: Player }> };
type Form = { playerId: string; relationship: string; firstName: string; lastName: string; fullNameAr: string; phone: string; emergencyContact: string };

export default function GuardiansPage() {
  const { locale } = useParams<{ locale: WebLocale }>(); const ar = locale === 'ar'; const cache = useQueryClient(); const [creating, setCreating] = useState(false);
  const session = useQuery({ queryKey: ['session'], queryFn: () => api<{ data: SessionUser }>('/auth/me') });
  const guardians = useQuery({ queryKey: ['guardians'], queryFn: () => api<{ data: Guardian[] }>('/guardians') });
  const players = useQuery({ queryKey: ['players'], queryFn: () => api<{ data: Player[] }>('/players') });
  const canManage = session.data?.data.permissions.includes('guardians.manage') ?? false;
  const { register, handleSubmit, reset } = useForm<Form>();
  const create = useMutation({ mutationFn: (values: Form) => api('/guardians', { method: 'POST', body: JSON.stringify({ ...values, phone: values.phone || undefined, emergencyContact: values.emergencyContact || undefined }) }), onSuccess: async () => { await cache.invalidateQueries({ queryKey: ['guardians'] }); reset(); setCreating(false); } });
  const playerName = (player: Player) => ar ? player.person.fullNameAr : `${player.person.firstName} ${player.person.lastName}`;

  return <>
    <PageHeading eyebrow="YOUTH SAFEGUARDING" title={ar ? 'الأولياء' : 'Parents et tuteurs'} description={ar ? 'ربط الولي بأطفاله دون كشف بيانات بقية اللاعبين' : 'Relier chaque tuteur à ses enfants sans exposer les autres joueurs'} action={canManage ? <button className="usn-button action-button" onClick={() => setCreating((value) => !value)}><Plus size={17} />{ar ? 'إضافة ولي' : 'Ajouter un tuteur'}</button> : undefined} />
    {creating ? <form className="operation-form" onSubmit={handleSubmit((values) => create.mutate(values))}><select {...register('playerId', { required: true })}><option value="">{ar ? 'اختر اللاعب' : 'Choisir le joueur'}</option>{players.data?.data.map((player) => <option key={player.id} value={player.id}>{playerName(player)}</option>)}</select><input placeholder={ar ? 'صلة القرابة' : 'Lien de parenté'} {...register('relationship', { required: true })} /><input placeholder={ar ? 'الاسم' : 'Prénom'} {...register('firstName', { required: true })} /><input placeholder={ar ? 'اللقب' : 'Nom'} {...register('lastName', { required: true })} /><input placeholder={ar ? 'الاسم الكامل بالعربية' : 'Nom complet en arabe'} {...register('fullNameAr', { required: true })} /><input type="tel" placeholder={ar ? 'الهاتف' : 'Téléphone'} {...register('phone')} /><input type="tel" placeholder={ar ? 'اتصال الطوارئ' : 'Contact urgence'} {...register('emergencyContact')} /><div className="form-actions"><button className="usn-button" disabled={create.isPending}>{ar ? 'حفظ' : 'Enregistrer'}</button></div></form> : null}
    {guardians.isLoading ? <LoadingState label={ar ? 'جار التحميل…' : 'Chargement…'} /> : !guardians.data?.data.length ? <EmptyState title={ar ? 'لا يوجد أولياء' : 'Aucun tuteur'} message={ar ? 'أضف وليا واربطه بلاعب من الفئات الشابة' : 'Ajoutez un tuteur et reliez-le à un jeune joueur'} /> : <div className="phase-grid">{guardians.data.data.map((guardian) => <article className="phase-card" key={guardian.id}><div className="phase-card-icon"><UserRoundCheck /></div><div><span>{guardian.relationship || (ar ? 'ولي' : 'Tuteur')}</span><h2>{ar ? guardian.person.fullNameAr : `${guardian.person.firstName} ${guardian.person.lastName}`}</h2><p>{guardian.players.map((link) => playerName(link.player)).join(' · ')}</p><small>{guardian.person.phone || '—'}</small></div></article>)}</div>}
  </>;
}
