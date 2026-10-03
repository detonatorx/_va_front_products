export const apiBase = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

async function fetchApi(path, token, options) {
  const response = await fetch(`${apiBase}/api${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.body && !(options.body instanceof FormData)
        ? { 'Content-Type': 'application/json' }
        : {})
    }
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || `Ошибка сервера (${response.status})`);
  }
  return response;
}

export async function request(path, token, options = {}) {
  const response = await fetchApi(path, token, options);
  return response.status === 204 ? null : response.json();
}

export async function requestBlob(path, token) {
  return (await fetchApi(path, token, {})).blob();
}
