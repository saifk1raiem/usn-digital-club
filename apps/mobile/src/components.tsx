import type { PropsWithChildren } from 'react'; import { StyleSheet, Text, View } from 'react-native'; import { colors } from './theme';
export function Screen({ children }: PropsWithChildren) { return <View style={styles.screen}>{children}</View>; }
export function Card({ children }: PropsWithChildren) { return <View style={styles.card}>{children}</View>; }
export function Empty({ text }: { text: string }) { return <Card><Text style={styles.empty}>{text}</Text></Card>; }
const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: colors.navy950, padding: 18 }, card: { borderWidth: 1, borderColor: colors.line, backgroundColor: colors.navy900, borderRadius: 18, padding: 18 }, empty: { color: colors.muted, textAlign: 'center', paddingVertical: 25 } });
