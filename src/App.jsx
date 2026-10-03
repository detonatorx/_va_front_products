import { useEffect, useState } from 'react';

const apiBase = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const emptyDish = { name: '', description: '', category: '', image_url: '', price: '', is_active: true };
const currency = new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' });

async function request(path, token, options = {}) {
  const response = await fetch(`${apiBase}/api${path}`, {
    ...options,
    headers: { Authorization: `Bearer ${token}`, ...(options.body ? { 'Content-Type': 'application/json' } : {}) }
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || `Ошибка сервера (${response.status})`);
  }
  return response.status === 204 ? null : response.json();
}

function toForm(dish) {
  return {
    name: dish.name, description: dish.description, category: dish.category,
    image_url: dish.image_url, price: (dish.price_kopeks / 100).toFixed(2), is_active: dish.is_active
  };
}

function toPayload(form) {
  const price = form.price.trim().replace(',', '.');
  if (!/^\d+(\.\d{1,2})?$/.test(price)) throw new Error('Укажите цену в рублях с точностью до копейки');
  const [rubles, kopeks = ''] = price.split('.');
  const price_kopeks = Number(rubles) * 100 + Number(kopeks.padEnd(2, '0'));
  if (!Number.isSafeInteger(price_kopeks) || price_kopeks > 100000000) throw new Error('Цена слишком велика');
  return { name: form.name, description: form.description, category: form.category,
    image_url: form.image_url, price_kopeks, is_active: form.is_active };
}

export default function App() {
  const [token, setToken] = useState('');
  const [tokenInput, setTokenInput] = useState('');
  const [dishes, setDishes] = useState([]);
  const [form, setForm] = useState(emptyDish);
  const [editingId, setEditingId] = useState(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    setLoading(true);
    request('/dishes', token).then((data) => {
      if (!cancelled) { setDishes(data); setError(''); }
    }).catch((reason) => { if (!cancelled) { setError(reason.message); setToken(''); } })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [token]);

  function openEditor(dish) {
    setEditingId(dish?.id || null);
    setForm(dish ? toForm(dish) : { ...emptyDish });
    setError('');
    setEditorOpen(true);
  }

  async function save(event) {
    event.preventDefault();
    setError('');
    let payload;
    try { payload = toPayload(form); } catch (reason) { setError(reason.message); return; }
    setBusy(true);
    try {
      const saved = await request(editingId ? `/dishes/${editingId}` : '/dishes', token, {
        method: editingId ? 'PUT' : 'POST', body: JSON.stringify(payload)
      });
      setDishes((current) => editingId
        ? current.map((dish) => dish.id === editingId ? saved : dish)
        : [saved, ...current]);
      setEditorOpen(false);
    } catch (reason) { setError(reason.message); }
    finally { setBusy(false); }
  }

  async function remove(dish) {
    if (!window.confirm(`Удалить «${dish.name}»? Это действие нельзя отменить.`)) return;
    setBusy(true);
    setError('');
    try {
      await request(`/dishes/${dish.id}`, token, { method: 'DELETE' });
      setDishes((current) => current.filter((item) => item.id !== dish.id));
      setEditorOpen(false);
    } catch (reason) { setError(reason.message); }
    finally { setBusy(false); }
  }

  const visible = dishes.filter((dish) =>
    (filter === 'all' || (filter === 'active' ? dish.is_active : !dish.is_active)) &&
    `${dish.name} ${dish.category}`.toLocaleLowerCase('ru').includes(search.toLocaleLowerCase('ru'))
  );

  if (!token) return <div className="auth-page">
    <div className="auth-card">
      <div className="brand-mark">К</div>
      <span className="eyebrow">УПРАВЛЕНИЕ МЕНЮ</span>
      <h1>Ваша кухня.<br /><em>Ваше меню.</em></h1>
      <p>Войдите с токеном администратора, чтобы создавать и редактировать блюда.</p>
      <form onSubmit={(event) => { event.preventDefault(); setError(''); setToken(tokenInput.trim()); }}>
        <label htmlFor="token">Токен администратора</label>
        <input id="token" type="password" autoComplete="off" required value={tokenInput}
          onChange={(event) => setTokenInput(event.target.value)} placeholder="Введите токен" />
        <button className="button primary full" disabled={loading}>Открыть каталог <span>→</span></button>
      </form>
      {error && <div className="alert" role="alert">{error}</div>}
      <small>Токен хранится только в памяти текущей вкладки.</small>
    </div>
  </div>;

  return <div className="app-shell">
    <header className="topbar">
      <div className="brand"><div className="brand-mark small">К</div><span>КУХНЯ <b>/</b> КАТАЛОГ</span></div>
      <button className="text-button" onClick={() => { setToken(''); setTokenInput(''); setDishes([]); setEditorOpen(false); }}>Выйти <span>↗</span></button>
    </header>
    <main className="content">
      <div className="intro"><div><span className="eyebrow">ВАШЕ ПРОСТРАНСТВО</span><h1>Каталог <em>блюд</em></h1>
        <p>Создавайте блюда и управляйте тем, что увидят покупатели.</p></div>
        <button className="button primary add-desktop" onClick={() => openEditor(null)}>＋ Добавить блюдо</button>
      </div>
      <div className="stats"><div><strong>{dishes.length}</strong><span>Всего блюд</span></div><div><strong>{dishes.filter((dish) => dish.is_active).length}</strong><span>Опубликовано</span></div><div><strong>{dishes.filter((dish) => !dish.is_active).length}</strong><span>Скрыто</span></div></div>
      <div className="section-heading"><h2>Блюда <span>{visible.length}</span></h2><div className="tools"><input aria-label="Поиск блюд" className="search" placeholder="Поиск по меню..." value={search} onChange={(event) => setSearch(event.target.value)} /><select aria-label="Фильтр публикации" value={filter} onChange={(event) => setFilter(event.target.value)}><option value="all">Все блюда</option><option value="active">Опубликованы</option><option value="hidden">Скрыты</option></select></div></div>
      {error && !editorOpen && <div className="alert" role="alert">{error}</div>}
      {loading ? <div className="empty">Загружаем блюда...</div> : visible.length === 0 ? <div className="empty"><span className="empty-icon">✳</span><h3>{dishes.length ? 'Ничего не найдено' : 'Начните с первого блюда'}</h3><p>{dishes.length ? 'Измените запрос или фильтр.' : 'Добавьте блюдо — и оно появится здесь.'}</p>{!dishes.length && <button className="button primary" onClick={() => openEditor(null)}>Добавить блюдо</button>}</div> :
        <div className="dish-grid">{visible.map((dish) => <article className="dish-card" key={dish.id}>
          <div className="dish-image">{dish.image_url ? <img src={dish.image_url} alt={dish.name} loading="lazy" /> : <span>К</span>}</div>
          <div className="dish-body"><div className="dish-meta"><span>{dish.category || 'Без категории'}</span><span className={dish.is_active ? 'badge live' : 'badge hidden'}>{dish.is_active ? 'Опубликовано' : 'Скрыто'}</span></div>
          <h3>{dish.name}</h3><p>{dish.description || 'Описание пока не добавлено'}</p><div className="dish-footer"><strong>{currency.format(dish.price_kopeks / 100)}</strong><button onClick={() => openEditor(dish)} aria-label={`Редактировать ${dish.name}`}>Редактировать <span>↗</span></button></div></div>
        </article>)}</div>}
    </main>
    <button className="mobile-add" onClick={() => openEditor(null)} aria-label="Добавить блюдо">＋</button>
    {editorOpen && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) setEditorOpen(false); }}>
      <section className="editor" role="dialog" aria-modal="true" aria-labelledby="editor-title">
        <div className="editor-head"><div><span className="eyebrow">РЕДАКТОР МЕНЮ</span><h2 id="editor-title">{editingId ? 'Редактировать блюдо' : 'Новое блюдо'}</h2></div><button className="close" onClick={() => setEditorOpen(false)} aria-label="Закрыть" disabled={busy}>×</button></div>
        <form onSubmit={save}><div className="form-fields">
          <label>Название блюда *<input required maxLength={120} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Например, домашний борщ" /></label>
          <label>Описание<textarea maxLength={2000} rows={3} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Расскажите о блюде" /></label>
          <div className="form-row"><label>Категория<input maxLength={80} value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} placeholder="Супы" /></label><label>Цена, ₽ *<input required inputMode="decimal" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} placeholder="350,00" /></label></div>
          <label>Ссылка на фото<input type="url" maxLength={2048} value={form.image_url} onChange={(event) => setForm({ ...form, image_url: event.target.value })} placeholder="https://..." /></label>
          <label className="switch-row"><span><strong>Опубликовать блюдо</strong><small>Скрытые блюда не видны покупателям</small></span><input type="checkbox" checked={form.is_active} onChange={(event) => setForm({ ...form, is_active: event.target.checked })} /></label>
          {error && <div className="alert" role="alert">{error}</div>}
        </div><div className="editor-actions">{editingId && <button type="button" className="delete-button" onClick={() => remove({ id: editingId, name: form.name })} disabled={busy}>Удалить</button>}<button type="button" className="button subtle" onClick={() => setEditorOpen(false)} disabled={busy}>Отмена</button><button className="button primary" disabled={busy}>{busy ? 'Сохраняем...' : 'Сохранить блюдо'}</button></div></form>
      </section>
    </div>}
  </div>;
}
