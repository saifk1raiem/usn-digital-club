import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { SessionUser } from '@usn/types';
import { request } from '@/src/api';
import { messages } from '@/src/i18n';
import { useAuth } from '@/src/store';
import { colors } from '@/src/theme';
type Form = { email: string; password: string };
export default function SignIn() {
  const t = messages.ar; const signIn = useAuth((state) => state.signIn); const cache = useQueryClient(); const [error, setError] = useState(false);
  const { control, handleSubmit, formState: { isSubmitting } } = useForm<Form>({ defaultValues: { email: '', password: '' } });
  const submit = handleSubmit(async (values) => { try { setError(false); const data = await request<{ accessToken: string; refreshToken: string; user: SessionUser }>('/auth/login', { method: 'POST', body: JSON.stringify(values) }); cache.clear(); await signIn(data.accessToken, data.refreshToken, data.user); router.replace('/(tabs)'); } catch { setError(true); } });
  return <View style={styles.page}><View style={styles.logo}><Text style={styles.logoText}>USN</Text></View><Text style={styles.brand}>USN DIGITAL CLUB</Text><Text style={styles.title}>{t.private}</Text><Controller control={control} name="email" render={({ field }) => <TextInput style={styles.input} placeholder={t.email} placeholderTextColor={colors.muted} autoCapitalize="none" keyboardType="email-address" value={field.value} onChangeText={field.onChange} />} /><Controller control={control} name="password" render={({ field }) => <TextInput style={styles.input} placeholder={t.password} placeholderTextColor={colors.muted} secureTextEntry value={field.value} onChangeText={field.onChange} />} />{error && <Text style={styles.error}>{'تعذر تسجيل الدخول'}</Text>}<Pressable style={styles.button} onPress={submit} disabled={isSubmitting}><Text style={styles.buttonText}>{isSubmitting ? '...' : t.signIn}</Text></Pressable></View>;
}
const styles = StyleSheet.create({ page: { flex: 1, justifyContent: 'center', padding: 26, backgroundColor: colors.navy950 }, logo: { alignSelf: 'center', width: 90, height: 90, borderRadius: 45, borderWidth: 1, borderColor: colors.gold, alignItems: 'center', justifyContent: 'center', marginBottom: 18 }, logoText: { color: colors.gold, fontSize: 25, fontWeight: '900' }, brand: { color: colors.gold, textAlign: 'center', fontWeight: '800', letterSpacing: 2, fontSize: 11 }, title: { color: colors.white, textAlign: 'center', fontSize: 27, fontWeight: '700', marginTop: 9, marginBottom: 35 }, input: { height: 52, color: colors.white, backgroundColor: colors.navy900, borderColor: colors.line, borderWidth: 1, borderRadius: 13, paddingHorizontal: 15, marginBottom: 13, textAlign: 'right' }, button: { height: 52, backgroundColor: colors.gold, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginTop: 7 }, buttonText: { color: colors.navy950, fontWeight: '800' }, error: { color: colors.red, textAlign: 'right', marginBottom: 5 } });
