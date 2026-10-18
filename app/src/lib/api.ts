import Constants from 'expo-constants';

export const API_URL = (
  process.env.EXPO_PUBLIC_API_URL ||
  Constants.expoConfig?.extra?.apiUrl ||
  'http://localhost:8000/api'
).replace(/\/+$/, '');

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const detail = body?.detail;
    throw new Error(
      typeof detail === 'string'
        ? detail
        : `Request failed (${response.status}). Check the fields and try again.`,
    );
  }
  return response.status === 204 ? (undefined as T) : response.json();
}

export const json = (method: string, body?: unknown): RequestInit => ({
  method,
  ...(body === undefined ? {} : { body: JSON.stringify(body) }),
});
