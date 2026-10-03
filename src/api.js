const apiBase = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export const photoSource = (url) => url.startsWith('/api/photos/') ? `${apiBase}${url}` : url;

export async function request(path, token, options = {}) {
  const response = await fetch(`${apiBase}/api${path}`, {
    ...options,
    headers: { Authorization: `Bearer ${token}`, ...(options.body && !(options.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}) }
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || `Ошибка сервера (${response.status})`);
  }
  return response.status === 204 ? null : response.json();
}
