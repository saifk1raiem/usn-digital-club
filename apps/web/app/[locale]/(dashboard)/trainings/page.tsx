'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarClock, Plus, Users } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { EmptyState, LoadingState } from '@usn/ui';
import { PageHeading } from '@/components/page-heading';
import { api } from '@/lib/api';
import type { WebLocale } from '@/i18n';

type Category = { id: string; nameAr: string; nameFr: string };
type Season = { id: string; name: string; isCurrent: boolean };
type Facility = { id: string; nameAr: string; nameFr: string };
type Training = { id: string; startsAt: string; endsAt: string; type: string; intensity?: number | null; objective?: string | null; category: Category; facility?: Facility | null; _count: { attendance: number } };
type Form = { categoryId: string; facilityId: string; startsAt: string; endsAt: string; type: string; intensity: number; objective: string };

export default function TrainingsPage() {
  const { locale } = useParams<{ locale: WebLocale }>(); const ar = locale === 'ar'; const cache = useQueryClient(); const [creating, setCreating] = useState(false);
  const trainings = useQuery({ queryKey: ['trainings'], queryFn: () => api<{ data: Training[] }>('/trainings') });
  const categories = useQuery({ queryKey: ['categories'], queryFn: () => api<{ data: Category[] }>('/categories') });
  const seasons = useQuery({ queryKey: ['seasons'], queryFn: () => api<{ data: Season[] }>('/seasons') });
  const facilities = useQuery({ queryKey: ['facilities'], queryFn: () => api<{ data: Facility[] }>('/facilities') });
  const { register, handleSubmit, reset, formState: { errors } } = useForm<Form>({ defaultValues: { type: 'TACTICAL', intensity: 5 } });
  const create = useMutation({ mutationFn: (values: Form) => api('/trainings', { method: 'POST', body: JSON.stringify({ ...values, seasonId: seasons.data?.data.find((item) => item.isCurrent)?.id, startsAt: new Date(values.startsAt).toISOString(), endsAt: new Date(values.endsAt).toISOString(), intensity: Number(values.intensity), facilityId: values.facilityId || undefined }) }), onSuccess: async () => { await cache.invalidateQueries({ queryKey: ['trainings'] }); reset(); setCreating(false); } });
  const label = (item: Category | Facility) => ar ? item.nameAr : item.nameFr;
  return <>
    <PageHeading eyebrow="FOOTBALL OPERATIONS" title={ar ? 'التدريبات' : 'Entraînements'} description={ar ? 'برمجة الحصص ومتابعة الحضور حسب الصنف' : 'Planifiez les séances et suivez les présences par catégorie'} action={<button className="usn-button action-button" onClick={() => setCreating((value) => !value)}><Plus size={17} />{ar ? 'حصة جديدة' : 'Nouvelle séance'}</button>} />
    {creating && <form className="operation-form" onSubmit={handleSubmit((values) => create.mutate(values))}>
      <select {...register('categoryId', { required: true })}><option value="">{ar ? 'اختر الصنف' : 'Choisir la catégorie'}</option>{categories.data?.data.map((item) => <option key={item.id} value={item.id}>{label(item)}</option>)}</select>
      <select {...register('facilityId')}><option value="">{ar ? 'الملعب' : 'Installation'}</option>{facilities.data?.data.map((item) => <option key={item.id} value={item.id}>{label(item)}</option>)}</select>
      <input type="datetime-local" {...register('startsAt', { required: true })} /><input type="datetime-local" {...register('endsAt', { required: true })} />
      <select {...register('type')}><option value="TACTICAL">TACTICAL</option><option value="TECHNICAL">TECHNICAL</option><option value="PHYSICAL">PHYSICAL</option><option value="RECOVERY">RECOVERY</option><option value="GYM">GYM</option><option value="MATCH_PREPARATION">MATCH PREPARATION</option></select>
      <input type="number" min="1" max="10" placeholder={ar ? 'الحدة 1-10' : 'Intensité 1-10'} {...register('intensity', { valueAsNumber: true })} />
      <input className="form-wide" placeholder={ar ? 'هدف الحصة' : 'Objectif de la séance'} {...register('objective')} />
      <div className="form-actions form-wide"><button className="usn-button" disabled={create.isPending}>{create.isPending ? '...' : ar ? 'حفظ الحصة' : 'Enregistrer'}</button>{(create.isError || Object.keys(errors).length > 0) && <span>{ar ? 'تثبت من البيانات' : 'Vérifiez les informations'}</span>}</div>
    </form>}
    {trainings.isLoading ? <LoadingState label={ar ? 'جار التحميل…' : 'Chargement…'} /> : !trainings.data?.data.length ? <EmptyState title={ar ? 'لا توجد حصص' : 'Aucune séance'} message={ar ? 'أضف أول حصة لهذا الموسم' : 'Ajoutez la première séance de la saison'} /> : <div className="operation-grid">{trainings.data.data.map((training) => <Link href={`/${locale}/trainings/${training.id}`} className="operation-card" key={training.id}><div className="operation-icon"><CalendarClock /></div><div className="operation-main"><span>{label(training.category)} · {training.type.replaceAll('_', ' ')}</span><h2>{new Intl.DateTimeFormat(ar ? 'ar-TN' : 'fr-TN', { dateStyle: 'full', timeStyle: 'short' }).format(new Date(training.startsAt))}</h2><p>{training.objective || (training.facility ? label(training.facility) : '—')}</p></div><div className="operation-meta"><Users size={15} /><b>{training._count.attendance}</b><small>{ar ? 'لاعبا' : 'joueurs'}</small></div></Link>)}</div>}
  </>;
}
