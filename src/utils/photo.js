import { apiBase } from '../api/client.js';

export const photoSource = (url) => (url.startsWith('/api/photos/') ? `${apiBase}${url}` : url);
