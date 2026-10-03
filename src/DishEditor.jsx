import { useState } from 'react';
import { request } from './api.js';
import { emptyDish, toForm, toPayload } from './dish.js';
import CropEditor from './CropEditor.jsx';
import PhotoManager from './PhotoManager.jsx';

export default function DishEditor({ dish, token, onSaved, onDeleted, onClose }) {
  const [form, setForm] = useState(dish ? toForm(dish) : { ...emptyDish, photos: [] });
  const [editingId, setEditingId] = useState(dish?.id || null);
  const [pendingPhotos, setPendingPhotos] = useState([]);
  const [pendingPrimary, setPendingPrimary] = useState(null);
  const [cropFile, setCropFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  function updateDish(updated) {
    onSaved(updated);
    setForm((current) => ({ ...current, photos: updated.photos, image_url: updated.image_url }));
  }

  function close() {
    pendingPhotos.forEach((photo) => URL.revokeObjectURL(photo.url));
    onClose();
  }

  function selectFile(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 10 * 1024 * 1024) {
      setError('Выберите JPEG, PNG или WebP размером до 10 МБ');
      return;
    }
    if (form.photos.length + pendingPhotos.length >= 10) { setError('Не более 10 фото на блюдо'); return; }
    setError('');
    setCropFile(file);
  }

  function addCropped(blob) {
    const photo = { id: crypto.randomUUID(), blob, url: URL.createObjectURL(blob) };
    setPendingPhotos((current) => [...current, photo]);
    if (!form.photos.length && !pendingPhotos.length) setPendingPrimary(photo.id);
    setCropFile(null);
  }

  function removePending(photo) {
    URL.revokeObjectURL(photo.url);
    const rest = pendingPhotos.filter((item) => item.id !== photo.id);
    setPendingPhotos(rest);
    if (pendingPrimary === photo.id) setPendingPrimary(rest[0]?.id || null);
  }

  async function changePrimary(photo) {
    if (photo.blob) { setPendingPrimary(photo.id); return; }
    setBusy(true);
    setError('');
    try {
      updateDish(await request(`/dishes/${editingId}/photos/${photo.id}/primary`, token, { method: 'PATCH' }));
      setPendingPrimary(null);
    } catch (reason) { setError(reason.message); }
    finally { setBusy(false); }
  }

  async function removePhoto(photo) {
    if (!window.confirm('Удалить это фото?')) return;
    setBusy(true);
    setError('');
    try { updateDish(await request(`/dishes/${editingId}/photos/${photo.id}`, token, { method: 'DELETE' })); }
    catch (reason) { setError(reason.message); }
    finally { setBusy(false); }
  }

  async function save(event) {
    event.preventDefault();
    setError('');
    let payload;
    try { payload = toPayload(form); } catch (reason) { setError(reason.message); return; }
    setBusy(true);
    try {
      let saved = await request(editingId ? `/dishes/${editingId}` : '/dishes', token, {
        method: editingId ? 'PUT' : 'POST', body: JSON.stringify(payload)
      });
      updateDish(saved);
      setEditingId(saved.id);
      for (const photo of pendingPhotos) {
        const before = new Set(saved.photos.map((item) => item.id));
        const data = new FormData();
        data.append('photo', photo.blob, 'dish.jpg');
        saved = await request(`/dishes/${saved.id}/photos`, token, { method: 'POST', body: data });
        updateDish(saved);
        setPendingPhotos((current) => current.filter((item) => item.id !== photo.id));
        URL.revokeObjectURL(photo.url);
        if (pendingPrimary === photo.id) {
          const uploaded = saved.photos.find((item) => !before.has(item.id));
          saved = await request(`/dishes/${saved.id}/photos/${uploaded.id}/primary`, token, { method: 'PATCH' });
          updateDish(saved);
          setPendingPrimary(null);
        }
      }
      onClose();
    } catch (reason) { setError(reason.message); }
    finally { setBusy(false); }
  }

  async function remove() {
    if (!window.confirm(`Удалить «${form.name}»? Это действие нельзя отменить.`)) return;
    setBusy(true);
    setError('');
    try {
      await request(`/dishes/${editingId}`, token, { method: 'DELETE' });
      onDeleted(editingId);
      close();
    } catch (reason) { setError(reason.message); }
    finally { setBusy(false); }
  }

  return <>
    <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy && !cropFile) close(); }}>
      <section className="editor" role="dialog" aria-modal="true" aria-labelledby="editor-title">
        <div className="editor-head"><div><span className="eyebrow">РЕДАКТОР МЕНЮ</span><h2 id="editor-title">{editingId ? 'Редактировать блюдо' : 'Новое блюдо'}</h2></div><button className="close" onClick={close} aria-label="Закрыть" disabled={busy}>×</button></div>
        <form onSubmit={save}><div className="form-fields">
          <label>Название блюда *<input required maxLength={120} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Например, домашний борщ" /></label>
          <label>Описание<textarea maxLength={2000} rows={3} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Расскажите о блюде" /></label>
          <div className="form-row"><label>Категория<input maxLength={80} value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} placeholder="Супы" /></label><label>Цена, ₽ *<input required inputMode="decimal" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} placeholder="350,00" /></label></div>
          <PhotoManager name={form.name} photos={form.photos} pendingPhotos={pendingPhotos} pendingPrimary={pendingPrimary} busy={busy}
            onSelectFile={selectFile} onChangePrimary={changePrimary} onRemovePhoto={removePhoto} onRemovePending={removePending} />
          <label className="switch-row"><span><strong>Опубликовать блюдо</strong><small>Скрытые блюда не видны покупателям</small></span><input type="checkbox" checked={form.is_active} onChange={(event) => setForm({ ...form, is_active: event.target.checked })} /></label>
          {error && <div className="alert" role="alert">{error}</div>}
        </div><div className="editor-actions">{editingId && <button type="button" className="delete-button" onClick={remove} disabled={busy}>Удалить</button>}<button type="button" className="button subtle" onClick={close} disabled={busy}>Отмена</button><button className="button primary" disabled={busy}>{busy ? 'Сохраняем...' : 'Сохранить блюдо'}</button></div></form>
      </section>
    </div>
    {cropFile && <CropEditor file={cropFile} onCancel={() => setCropFile(null)} onSave={addCropped} />}
  </>;
}
