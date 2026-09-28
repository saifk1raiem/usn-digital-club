'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { SessionUser } from '@usn/types';
import { Badge, EmptyState, LoadingState } from '@usn/ui';
import { Plus, ScanSearch, Users } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { PageHeading } from '@/components/page-heading';
import type { WebLocale } from '@/i18n';
import { api } from '@/lib/api';

type Category = { id: string; nameAr: string; nameFr: string };
type Facility = { id: string; nameAr: string; nameFr: string };
type Candidate = { id: string; fullName: string; status: string };
type Trial = { id: string; birthYear: number; startsAt: string; venue?: string | null; maxParticipants?: number | null; category: Category; facility?: Facility | null; candidates: Candidate[] };
type Form = { categoryId: string; birthYear: number; startsAt: string; facilityId: string; venue: string; registrationFee: number; maxParticipants: number; description: string };

export default function TrialsPage() {
  const { locale } = useParams<{ locale: WebLocale }>(); const ar = locale === 'ar'; const cache = useQueryClient(); const [creating, setCreating] = useState(false);
  const session = useQuery({ queryKey: ['session'], queryFn: () => api<{ data: SessionUser }>('/auth/me') });
  const trials = useQuery({ queryKey: ['trials'], queryFn: () => api<{ data: Trial[] }>('/trials') });
  const categories = useQuery({ queryKey: ['categories'], queryFn: () => api<{ data: Category[] }>('/categories') });
  const facilities = useQuery({ queryKey: ['facilities'], queryFn: () => api<{ data: Facility[] }>('/facilities') });
  const canManage = session.data?.data.permissions.includes('trials.manage') ?? false;
  const { register, handleSubmit, reset } = useForm<Form>();
  const create = useMutation({ mutationFn: (values: Form) => api('/trials', { method: 'POST', body: JSON.stringify({ ...values, birthYear: Number(values.birthYear), startsAt: new Date(values.startsAt).toISOString(), facilityId: values.facilityId || undefined, venue: values.venue || undefined, registrationFee: values.registrationFee ? Number(values.registrationFee) : undefined, maxParticipants: values.maxParticipants ? Number(values.maxParticipants) : undefined, description: values.description || undefined }) }), onSuccess: async () => { await cache.invalidateQueries({ queryKey: ['trials'] }); reset(); setCreating(false); } });
  const label = (item: Category | Facility) => ar ? item.nameAr : item.nameFr;

  return <>
    <PageHeading eyebrow="RECRUITMENT PIPELINE" title={ar ? 'اختبارات اللاعبين' : 'Détections'} description={ar ? 'تنظيم الاختبارات والتقييم والتحويل إلى ملف لاعب' : 'Organisez les essais, évaluations et conversions en joueur'} action={canManage ? <button className="usn-button action-button" onClick={() => setCreating((value) => !value)}><Plus size={17} />{ar ? 'اختبار جديد' : 'Nouvelle détection'}</button> : undefined} />
    {creating ? <form className="operation-form" onSubmit={handleSubmit((values) => create.mutate(values))}><select {...register('categoryId', { required: true })}><option value="">{ar ? 'الصنف' : 'Catégorie'}</option>{categories.data?.data.map((category) => <option key={category.id} value={category.id}>{label(category)}</option>)}</select><input type="number" min="1990" max="2030" placeholder={ar ? 'سنة الميلاد' : 'Année de naissance'} {...register('birthYear', { valueAsNumber: true, required: true })} /><input type="datetime-local" {...register('startsAt', { required: true })} /><select {...register('facilityId')}><option value="">{ar ? 'الملعب' : 'Installation'}</option>{facilities.data?.data.map((facility) => <option key={facility.id} value={facility.id}>{label(facility)}</option>)}</select><input placeholder={ar ? 'المكان' : 'Lieu'} {...register('venue')} /><input type="number" min="0" step="0.001" placeholder={ar ? 'معلوم التسجيل' : 'Frais'} {...register('registrationFee', { valueAsNumber: true })} /><input type="number" min="1" placeholder={ar ? 'العدد الأقصى' : 'Capacité'} {...register('maxParticipants', { valueAsNumber: true })} /><input placeholder={ar ? 'وصف الاختبار' : 'Description'} {...register('description')} /><div className="form-actions form-wide"><button className="usn-button" disabled={create.isPending}>{ar ? 'حفظ الاختبار' : 'Enregistrer'}</button></div></form> : null}
    {trials.isLoading ? <LoadingState label={ar ? 'جار التحميل…' : 'Chargement…'} /> : !trials.data?.data.length ? <EmptyState title={ar ? 'لا توجد اختبارات' : 'Aucune détection'} message={ar ? 'أنشئ أول موعد لاختبار اللاعبين' : 'Créez la première session de détection'} /> : <div className="phase-grid">{trials.data.data.map((trial) => <article className="phase-card" key={trial.id}><div className="phase-card-icon"><ScanSearch /></div><div><span>{label(trial.category)} · {trial.birthYear}</span><h2>{new Intl.DateTimeFormat(ar ? 'ar-TN' : 'fr-TN', { dateStyle: 'full', timeStyle: 'short' }).format(new Date(trial.startsAt))}</h2><p>{trial.facility ? label(trial.facility) : trial.venue || '—'}</p><small><Users size={13} /> {trial.candidates.length}{trial.maxParticipants ? ` / ${trial.maxParticipants}` : ''}</small></div><Badge tone="gold">{trial.candidates.length} {ar ? 'مترشح' : 'candidats'}</Badge></article>)}</div>}
  </>;
}
