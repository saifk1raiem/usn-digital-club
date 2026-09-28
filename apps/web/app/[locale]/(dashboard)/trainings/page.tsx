'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { SessionUser } from '@usn/types';
import { EmptyState, LoadingState } from '@usn/ui';
import { CalendarClock, ChevronLeft, ChevronRight, Clock3, MapPin, Plus, Users } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { PageHeading } from '@/components/page-heading';
import type { WebLocale } from '@/i18n';
import { api } from '@/lib/api';

type Category = { id: string; nameAr: string; nameFr: string };
type Season = { id: string; name: string; isCurrent: boolean };
type Facility = { id: string; nameAr: string; nameFr: string };
type Player = { id: string; position?: string | null; person: { fullNameAr: string; firstName: string; lastName: string }; seasons: Array<{ jerseyNumber?: number | null }> };
type Training = { id: string; startsAt: string; endsAt: string; type: string; intensity?: number | null; objective?: string | null; category: Category; facility?: Facility | null; _count: { attendance: number } };
type Form = { categoryId: string; facilityId: string; date: string; startTime: string; endTime: string; type: string; intensity: number; objective: string; playerIds: string[] };

const weekdays = { ar: ['الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت', 'الأحد'], fr: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'] };
const defaultValues = (): Form => ({ categoryId: '', facilityId: '', date: localDateKey(new Date()), startTime: '17:00', endTime: '18:30', type: 'TACTICAL', intensity: 5, objective: '', playerIds: [] });

function localDateKey(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function monthGrid(month: Date) {
  const start = new Date(month.getFullYear(), month.getMonth(), 1);
  const mondayOffset = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - mondayOffset);
  start.setHours(0, 0, 0, 0);
  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    return day;
  });
}

export default function TrainingsPage() {
  const { locale } = useParams<{ locale: WebLocale }>();
  const ar = locale === 'ar';
  const cache = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [month, setMonth] = useState(() => { const today = new Date(); return new Date(today.getFullYear(), today.getMonth(), 1); });
  const days = useMemo(() => monthGrid(month), [month]);
  const range = useMemo(() => {
    const end = new Date(days[days.length - 1]!); end.setHours(23, 59, 59, 999);
    return { from: days[0]!.toISOString(), to: end.toISOString() };
  }, [days]);
  const session = useQuery({ queryKey: ['session'], queryFn: () => api<{ data: SessionUser }>('/auth/me') });
  const canCreate = session.data?.data.permissions.includes('training.create') ?? false;
  const trainings = useQuery({ queryKey: ['trainings', range.from, range.to], queryFn: () => api<{ data: Training[] }>(`/trainings?from=${encodeURIComponent(range.from)}&to=${encodeURIComponent(range.to)}`) });
  const categories = useQuery({ queryKey: ['categories'], queryFn: () => api<{ data: Category[] }>('/categories'), enabled: canCreate });
  const seasons = useQuery({ queryKey: ['seasons'], queryFn: () => api<{ data: Season[] }>('/seasons'), enabled: canCreate });
  const facilities = useQuery({ queryKey: ['facilities'], queryFn: () => api<{ data: Facility[] }>('/facilities'), enabled: canCreate });
  const { control, register, handleSubmit, reset, setValue, formState: { errors } } = useForm<Form>({ defaultValues: defaultValues() });
  const categoryId = useWatch({ control, name: 'categoryId' });
  const players = useQuery({ queryKey: ['players', categoryId], queryFn: () => api<{ data: Player[] }>(`/players?categoryId=${encodeURIComponent(categoryId)}`), enabled: canCreate && Boolean(categoryId) });

  useEffect(() => {
    setValue('playerIds', players.data?.data.map((player) => player.id) ?? [], { shouldDirty: false });
  }, [categoryId, players.data, setValue]);

  const create = useMutation({
    mutationFn: (values: Form) => api('/trainings', { method: 'POST', body: JSON.stringify({ categoryId: values.categoryId, facilityId: values.facilityId || undefined, seasonId: seasons.data?.data.find((item) => item.isCurrent)?.id, startsAt: new Date(`${values.date}T${values.startTime}`).toISOString(), endsAt: new Date(`${values.date}T${values.endTime}`).toISOString(), type: values.type, intensity: Number(values.intensity), objective: values.objective || undefined, playerIds: values.playerIds }) }),
    onSuccess: async () => { await Promise.all([cache.invalidateQueries({ queryKey: ['trainings'] }), cache.invalidateQueries({ queryKey: ['overview'] })]); reset(defaultValues()); setCreating(false); },
  });
  const label = (item: Category | Facility) => ar ? item.nameAr : item.nameFr;
  const eventsByDay = useMemo(() => {
    const grouped = new Map<string, Training[]>();
    for (const training of trainings.data?.data ?? []) {
      const key = localDateKey(new Date(training.startsAt));
      grouped.set(key, [...(grouped.get(key) ?? []), training]);
    }
    return grouped;
  }, [trainings.data]);
  const openCreate = (day?: Date) => {
    if (!canCreate) return;
    if (day) setValue('date', localDateKey(day));
    setCreating(true);
  };
  const currentMonthLabel = new Intl.DateTimeFormat(ar ? 'ar-TN' : 'fr-TN', { month: 'long', year: 'numeric' }).format(month);

  return <>
    <PageHeading eyebrow="FOOTBALL OPERATIONS" title={ar ? 'التدريبات' : 'Entraînements'} description={ar ? 'رزنامة الحصص والتوقيت واللاعبون المدعوون' : 'Calendrier, horaires et joueurs convoqués'} action={canCreate ? <button className="usn-button action-button" onClick={() => setCreating((value) => !value)}><Plus size={17} />{ar ? 'حصة جديدة' : 'Nouvelle séance'}</button> : undefined} />
    {!session.isLoading && !canCreate ? <div className="readonly-notice"><CalendarClock size={18} /><div><b>{ar ? 'برنامجك التدريبي' : 'Votre programme'}</b><span>{ar ? 'يمكنك مشاهدة الحصص المدعو إليها فقط، دون تعديلها.' : 'Vous pouvez consulter uniquement vos séances, sans les modifier.'}</span></div></div> : null}
    {creating && canCreate && <form className="operation-form training-form" onSubmit={handleSubmit((values) => create.mutate(values))}>
      <label><span>{ar ? 'الصنف' : 'Catégorie'}</span><select {...register('categoryId', { required: true })}><option value="">{ar ? 'اختر الصنف' : 'Choisir la catégorie'}</option>{categories.data?.data.map((item) => <option key={item.id} value={item.id}>{label(item)}</option>)}</select></label>
      <label><span>{ar ? 'الملعب' : 'Installation'}</span><select {...register('facilityId')}><option value="">{ar ? 'اختر الملعب' : 'Choisir le terrain'}</option>{facilities.data?.data.map((item) => <option key={item.id} value={item.id}>{label(item)}</option>)}</select></label>
      <label><span>{ar ? 'التاريخ' : 'Date'}</span><input type="date" {...register('date', { required: true })} /></label>
      <label><span>{ar ? 'نوع الحصة' : 'Type'}</span><select {...register('type')}><option value="TACTICAL">TACTICAL</option><option value="TECHNICAL">TECHNICAL</option><option value="PHYSICAL">PHYSICAL</option><option value="RECOVERY">RECOVERY</option><option value="GYM">GYM</option><option value="MATCH_PREPARATION">MATCH PREPARATION</option></select></label>
      <label><span>{ar ? 'وقت البداية' : 'Début'}</span><input type="time" {...register('startTime', { required: true })} /></label>
      <label><span>{ar ? 'وقت النهاية' : 'Fin'}</span><input type="time" {...register('endTime', { required: true })} /></label>
      <label><span>{ar ? 'الشدة (1-10)' : 'Intensité (1-10)'}</span><input type="number" min="1" max="10" {...register('intensity', { valueAsNumber: true })} /></label>
      <label><span>{ar ? 'هدف الحصة' : 'Objectif'}</span><input placeholder={ar ? 'مثال: التحولات الهجومية' : 'Ex. transitions offensives'} {...register('objective')} /></label>
      <fieldset className="player-picker form-wide"><legend>{ar ? 'اللاعبون المدعوون' : 'Joueurs convoqués'}</legend>{!categoryId ? <p>{ar ? 'اختر الصنف لإظهار اللاعبين.' : 'Choisissez une catégorie pour afficher les joueurs.'}</p> : players.isLoading ? <p>{ar ? 'جار تحميل اللاعبين…' : 'Chargement des joueurs…'}</p> : players.data?.data.length ? <><div className="player-picker-actions"><button type="button" onClick={() => setValue('playerIds', players.data!.data.map((player) => player.id))}>{ar ? 'اختيار الكل' : 'Tout sélectionner'}</button><button type="button" onClick={() => setValue('playerIds', [])}>{ar ? 'إلغاء الكل' : 'Tout désélectionner'}</button></div><div className="player-picker-grid">{players.data.data.map((player) => <label key={player.id}><input type="checkbox" value={player.id} {...register('playerIds')} /><span><b>{ar ? player.person.fullNameAr : `${player.person.firstName} ${player.person.lastName}`}</b><small>{player.seasons[0]?.jerseyNumber ? `#${player.seasons[0].jerseyNumber}` : player.position || '—'}</small></span></label>)}</div></> : <p>{ar ? 'لا يوجد لاعبون في هذا الصنف.' : 'Aucun joueur dans cette catégorie.'}</p>}</fieldset>
      <div className="form-actions form-wide"><button className="usn-button" disabled={create.isPending}>{create.isPending ? '...' : ar ? 'حفظ الحصة' : 'Enregistrer'}</button><button type="button" className="ghost-button" onClick={() => setCreating(false)}>{ar ? 'إلغاء' : 'Annuler'}</button>{(create.isError || Object.keys(errors).length > 0) && <span>{ar ? 'تثبت من البيانات والتوقيت' : 'Vérifiez les informations et les horaires'}</span>}</div>
    </form>}
    <section className="training-calendar" aria-label={ar ? 'رزنامة التدريبات' : 'Calendrier des entraînements'}>
      <header className="calendar-toolbar"><div><CalendarClock /><h2>{currentMonthLabel}</h2></div><div><button className="ghost-button" onClick={() => setMonth((value) => new Date(value.getFullYear(), value.getMonth() - 1, 1))} aria-label={ar ? 'الشهر السابق' : 'Mois précédent'}><ChevronRight size={17} /></button><button className="ghost-button" onClick={() => { const today = new Date(); setMonth(new Date(today.getFullYear(), today.getMonth(), 1)); }}>{ar ? 'اليوم' : "Aujourd'hui"}</button><button className="ghost-button" onClick={() => setMonth((value) => new Date(value.getFullYear(), value.getMonth() + 1, 1))} aria-label={ar ? 'الشهر القادم' : 'Mois suivant'}><ChevronLeft size={17} /></button></div></header>
      <div className="calendar-weekdays">{weekdays[ar ? 'ar' : 'fr'].map((day) => <span key={day}>{day}</span>)}</div>
      {trainings.isLoading ? <LoadingState label={ar ? 'جار تحميل الرزنامة…' : 'Chargement du calendrier…'} /> : <div className="calendar-grid">{days.map((day) => {
        const key = localDateKey(day); const dayEvents = eventsByDay.get(key) ?? []; const outside = day.getMonth() !== month.getMonth(); const today = key === localDateKey(new Date());
        return <article className={`calendar-day${outside ? ' calendar-day--outside' : ''}${today ? ' calendar-day--today' : ''}`} key={key}><div className="calendar-day-head"><time dateTime={key}>{day.getDate()}</time>{canCreate && <button type="button" onClick={() => openCreate(day)} aria-label={ar ? `إضافة حصة يوم ${key}` : `Ajouter une séance le ${key}`}><Plus size={13} /></button>}</div><div className="calendar-events">{dayEvents.map((training) => <Link href={`/${locale}/trainings/${training.id}`} className="calendar-event" key={training.id}><span><Clock3 size={11} />{new Intl.DateTimeFormat(ar ? 'ar-TN' : 'fr-TN', { hour: '2-digit', minute: '2-digit' }).format(new Date(training.startsAt))}</span><b>{label(training.category)}</b><small><Users size={10} />{training._count.attendance}{training.facility ? <><MapPin size={10} />{label(training.facility)}</> : null}</small></Link>)}</div></article>;
      })}</div>}
    </section>
    {!trainings.isLoading && !trainings.data?.data.length && <EmptyState title={ar ? 'لا توجد حصص في هذا الشهر' : 'Aucune séance ce mois-ci'} message={canCreate ? (ar ? 'اضغط على أي يوم لإضافة حصة.' : 'Cliquez sur un jour pour ajouter une séance.') : (ar ? 'ستظهر هنا الحصص المدعو إليها.' : 'Vos séances assignées apparaîtront ici.')} />}
  </>;
}
