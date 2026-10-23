const DEFAULT_BASE_URL = '/api';

function getBaseUrl() {
  return (import.meta.env.VITE_API_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, '');
}

function buildUrl(path: string) {
  return `${getBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(buildUrl(path), {
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers || {})
    },
    ...init
  });

  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json') ? await response.json() : await response.text();

  if (!response.ok) {
    const message = payload && typeof payload === 'object' && 'error' in payload ? payload.error.message : 'Request failed';
    throw new Error(message || 'Request failed');
  }

  return payload as T;
}

export function getJson<T>(path: string): Promise<T> {
  return request<T>(path, { method: 'GET' });
}

export function postJson<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, { method: 'POST', body: JSON.stringify(body) });
}
