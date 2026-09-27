const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';
export class ApiError extends Error { constructor(public status: number, message: string) { super(message); } }
export async function api<T>(path: string, options: RequestInit = {}, retried = false): Promise<T> {
  const token = typeof window === 'undefined' ? null : localStorage.getItem('usn_access_token');
  const response = await fetch(`${baseUrl}${path}`, { ...options, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers } });
  if (response.status === 401 && !retried && !path.startsWith('/auth/')) {
    const refreshToken = localStorage.getItem('usn_refresh_token');
    if (refreshToken) {
      const refreshed = await fetch(`${baseUrl}/auth/refresh`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refreshToken }) });
      if (refreshed.ok) {
        const tokens = await refreshed.json() as { accessToken: string; refreshToken: string };
        localStorage.setItem('usn_access_token', tokens.accessToken);
        localStorage.setItem('usn_refresh_token', tokens.refreshToken);
        return api<T>(path, options, true);
      }
      localStorage.removeItem('usn_access_token'); localStorage.removeItem('usn_refresh_token');
    }
  }
  if (!response.ok) throw new ApiError(response.status, (await response.json().catch(() => null))?.message ?? 'Request failed');
  return response.json() as Promise<T>;
}
