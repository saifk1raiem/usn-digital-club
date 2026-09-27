import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';
import type { SessionUser } from '@usn/types';
type AuthState = { token: string | null; user: SessionUser | null; hydrated: boolean; initialize: () => Promise<void>; signIn: (token: string, user: SessionUser) => Promise<void>; signOut: () => Promise<void> };
export const useAuth = create<AuthState>((set) => ({
  token: null, user: null, hydrated: false,
  initialize: async () => set({ token: await SecureStore.getItemAsync('access_token'), hydrated: true }),
  signIn: async (token, user) => { await SecureStore.setItemAsync('access_token', token); set({ token, user }); },
  signOut: async () => { await SecureStore.deleteItemAsync('access_token'); set({ token: null, user: null }); },
}));
