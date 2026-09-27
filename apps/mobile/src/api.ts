import * as SecureStore from 'expo-secure-store';
import { useAuth } from './store';

const baseUrl = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';
export async function request<T>(path: string, options: RequestInit = {}, token?: string | null, retried = false): Promise<T> {
  const activeToken = token ?? useAuth.getState().token;
  const response = await fetch(`${baseUrl}${path}`, { ...options, headers: { 'Content-Type': 'application/json', ...(activeToken ? { Authorization: `Bearer ${activeToken}` } : {}), ...options.headers } });
  if (response.status === 401 && !retried && !path.startsWith('/auth/')) {
    const refreshToken = await SecureStore.getItemAsync('refresh_token');
    if (refreshToken) {
      const refreshed = await fetch(`${baseUrl}/auth/refresh`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refreshToken }) });
      if (refreshed.ok) {
        const next = await refreshed.json() as { accessToken: string; refreshToken: string };
        await Promise.all([SecureStore.setItemAsync('access_token', next.accessToken), SecureStore.setItemAsync('refresh_token', next.refreshToken)]);
        useAuth.setState({ token: next.accessToken });
        return request<T>(path, options, next.accessToken, true);
      }
    }
  }
  if (!response.ok) throw new Error('API request failed');
  return response.json() as Promise<T>;
}
