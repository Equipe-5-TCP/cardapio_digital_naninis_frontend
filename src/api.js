// Defina EXPO_PUBLIC_API_URL no arquivo .env (ex.: https://naninis-api.onrender.com)
const API = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

async function call(path, opts) {
  const r = await fetch(API + path, {
    headers: { 'Content-Type': 'application/json' }, ...opts,
  });
  if (!r.ok) throw new Error((await r.json().catch(() => ({}))).detail || 'Erro de conexão');
  return r.json();
}
export const getMenu = () => call('/menu');
export const createOrder = (body) => call('/orders', { method: 'POST', body: JSON.stringify(body) });
export const getStatus = (id) => call(`/orders/${id}/status`);
