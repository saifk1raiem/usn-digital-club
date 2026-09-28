'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { SessionUser } from '@usn/types';
import { EmptyState, LoadingState } from '@usn/ui';
import { Activity, Plus } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { PageHeading } from '@/components/page-heading';
import type { WebLocale } from '@/i18n';
import { api } from '@/lib/api';

type TestType = { id: string; code: string; nameAr: string; nameFr: string; defaultUnit: string };
type Player = { id: string; person: { fullNameAr: string; firstName: string; lastName: string } };
type Result = { id: string; value: number; unit: string; measuredAt: string; notes?: string | null; testType: TestType; player: Player };
type ResultForm = { playerId: string; testTypeId: string; value: number; measuredAt: string; notes: string };
type TypeForm = { code: string; nameAr: string; nameFr: string; defaultUnit: string };

export default function PerformancePage() {
  const { locale } = useParams<{ locale: WebLocale }>(); const ar = locale === 'ar'; const cache = useQueryClient(); const [creating, setCreating] = useState(false);
  const session = useQuery({ queryKey: ['session'], queryFn: () => api<{ data: SessionUser }>('/auth/me') });
  const types = useQuery({ queryKey: ['physical-test-types'], queryFn: () => api<{ data: TestType[] }>('/performance/test-types') });
  const results = useQuery({ queryKey: ['physical-results'], queryFn: () => api<{ data: Result[] }>('/performance/results') });
  const players = useQuery({ queryKey: ['players'], queryFn: () => api<{ data: Player[] }>('/players') });
  const canEdit = session.data?.data.permissions.includes('performance.edit') ?? false;
  const resultForm = useForm<ResultForm>({ defaultValues: { measuredAt: new Date().toISOString().slice(0, 10) } });
  const typeForm = useForm<TypeForm>();
  const createResult = useMutation({ mutationFn: (values: ResultForm) => api('/performance/results', { method: 'POST', body: JSON.stringify({ ...values, value: Number(values.value), measuredAt: new Date(values.measuredAt).toISOString(), notes: values.notes || undefined }) }), onSuccess: async () => { await cache.invalidateQueries({ queryKey: ['physical-results'] }); resultForm.reset(); setCreating(false); } });
  const createType = useMutation({ mutationFn: (values: TypeForm) => api('/performance/test-types', { method: 'POST', body: JSON.stringify(values) }), onSuccess: async () => { await cache.invalidateQueries({ queryKey: ['physical-test-types'] }); typeForm.reset(); } });
  const playerName = (player: Player) => ar ? player.person.fullNameAr : `${player.person.firstName} ${player.person.lastName}`;

  return <>
    <PageHeading eyebrow="SPORTS SCIENCE" title={ar ? 'الأداء البدني' : 'Performance physique'} description={ar ? 'اختبارات قابلة للتهيئة ونتائج تاريخية لكل لاعب' : 'Tests configurables et historique par joueur'} action={canEdit ? <button className="usn-button action-button" onClick={() => setCreating((value) => !value)}><Plus size={17} />{ar ? 'نتيجة جديدة' : 'Nouveau résultat'}</button> : undefined} />
    {creating ? <div className="phase-forms"><form className="operation-form" onSubmit={resultForm.handleSubmit((values) => createResult.mutate(values))}><select {...resultForm.register('playerId', { required: true })}><option value="">{ar ? 'اللاعب' : 'Joueur'}</option>{players.data?.data.map((player) => <option key={player.id} value={player.id}>{playerName(player)}</option>)}</select><select {...resultForm.register('testTypeId', { required: true })}><option value="">{ar ? 'نوع الاختبار' : 'Type de test'}</option>{types.data?.data.map((type) => <option key={type.id} value={type.id}>{ar ? type.nameAr : type.nameFr} ({type.defaultUnit})</option>)}</select><input type="number" step="any" placeholder={ar ? 'القيمة' : 'Valeur'} {...resultForm.register('value', { valueAsNumber: true, required: true })} /><input type="date" {...resultForm.register('measuredAt', { required: true })} /><input className="form-wide" placeholder={ar ? 'ملاحظات' : 'Notes'} {...resultForm.register('notes')} /><div className="form-actions form-wide"><button className="usn-button" disabled={createResult.isPending}>{ar ? 'حفظ النتيجة' : 'Enregistrer le résultat'}</button></div></form><form className="operation-form" onSubmit={typeForm.handleSubmit((values) => createType.mutate(values))}><input placeholder="CODE" {...typeForm.register('code', { required: true })} /><input placeholder="الاسم بالعربية" {...typeForm.register('nameAr', { required: true })} /><input placeholder="Nom français" {...typeForm.register('nameFr', { required: true })} /><input placeholder={ar ? 'الوحدة' : 'Unité'} {...typeForm.register('defaultUnit', { required: true })} /><div className="form-actions form-wide"><button className="ghost-button" disabled={createType.isPending}>{ar ? 'إضافة نوع اختبار' : 'Ajouter le type'}</button></div></form></div> : null}
    {results.isLoading ? <LoadingState label={ar ? 'جار التحميل…' : 'Chargement…'} /> : !results.data?.data.length ? <EmptyState title={ar ? 'لا توجد نتائج' : 'Aucun résultat'} message={ar ? 'سجل أول اختبار بدني' : 'Enregistrez le premier test physique'} /> : <div className="data-card"><div className="table-wrap"><table><thead><tr><th>{ar ? 'اللاعب' : 'Joueur'}</th><th>{ar ? 'الاختبار' : 'Test'}</th><th>{ar ? 'النتيجة' : 'Résultat'}</th><th>{ar ? 'التاريخ' : 'Date'}</th></tr></thead><tbody>{results.data.data.map((result) => <tr key={result.id}><td><div className="person-cell"><span className="avatar"><Activity size={15} /></span><b>{playerName(result.player)}</b></div></td><td>{ar ? result.testType.nameAr : result.testType.nameFr}</td><td><b>{result.value} {result.unit}</b></td><td>{new Date(result.measuredAt).toLocaleDateString(ar ? 'ar-TN' : 'fr-TN')}</td></tr>)}</tbody></table></div></div>}
  </>;
}
