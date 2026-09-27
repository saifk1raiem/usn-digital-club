import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';
import type { SessionUser } from '@usn/types';
type AuthState = { token: string | null; user: SessionUser | null; hydrated: boolean; initialize: () => Promise<void>; signIn: (token: string, refreshToken: string, user: SessionUser) => Promise<void>; signOut: () => Promise<void> };
export const useAuth = create<AuthState>((set) => ({
  token: null, user: null, hydrated: false,
  initialize: async () => { const [token, storedUser] = await Promise.all([SecureStore.getItemAsync('access_token'), SecureStore.getItemAsync('session_user')]); set({ token, user: storedUser ? JSON.parse(storedUser) as SessionUser : null, hydrated: true }); },
  signIn: async (token, refreshToken, user) => { await Promise.all([SecureStore.setItemAsync('access_token', token), SecureStore.setItemAsync('refresh_token', refreshToken), SecureStore.setItemAsync('session_user', JSON.stringify(user))]); set({ token, user }); },
  signOut: async () => { await Promise.all([SecureStore.deleteItemAsync('access_token'), SecureStore.deleteItemAsync('refresh_token'), SecureStore.deleteItemAsync('session_user')]); set({ token: null, user: null }); },
}));
