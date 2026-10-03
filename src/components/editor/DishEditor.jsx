import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { emptyDish, parsePrice, toForm, toPayload } from '../../utils/dish.js';
import { useDishMutations } from '../../hooks/useDishMutations.js';
import CropEditor from './CropEditor.jsx';
import PhotoManager from './PhotoManager.jsx';

export default function DishEditor({ dish, token, onClose }) {
  const {
    register,
    handleSubmit,
    watch,
    getValues,
    setValue,
    setError,
    clearErrors,
    formState: { errors, isSubmitting }
  } = useForm({
    defaultValues: dish ? toForm(dish) : { ...emptyDish, photos: [] },
    mode: 'onChange'
  });
  const [editingId, setEditingId] = useState(dish?.id || null);
  const [pendingPhotos, setPendingPhotos] = useState([]);
  const [pendingPrimary, setPendingPrimary] = useState(null);
  const [cropTarget, setCropTarget] = useState(null);
  const {
    saveDish,
    uploadPhoto,
    loadCurrentPhoto,
    loadOriginalPhoto,
    editPhoto,
    setPrimaryPhoto,
    deletePhoto,
    deleteDish
  } = useDishMutations(token);
  const photos = watch('photos') || [];
  const name = watch('name');
  const busy =
    isSubmitting ||
    [
      saveDish,
      uploadPhoto,
      loadCurrentPhoto,
      loadOriginalPhoto,
      editPhoto,
      setPrimaryPhoto,
      deletePhoto,
      deleteDish
    ].some((mutation) => mutation.isPending);
  const showError = (reason) => setError('root.server', { message: reason.message });

  function updateDish(updated) {
    setValue('photos', updated.photos);
    setValue('image_url', updated.image_url);
  }

  function close() {
    pendingPhotos.forEach((photo) => URL.revokeObjectURL(photo.url));
    onClose();
  }

  function selectFile(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (
      !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) ||
      file.size > 10 * 1024 * 1024
    ) {
      showError(new Error('Выберите JPEG, PNG или WebP размером до 10 МБ'));
      return;
    }
    if (photos.length + pendingPhotos.length >= 10) {
      showError(new Error('Не более 10 фото на блюдо'));
      return;
    }
    clearErrors('root.server');
    setCropTarget({ file, photo: null });
  }

  async function editExistingPhoto(photo) {
    clearErrors('root.server');
    try {
      const file = photo.blob ? photo.blob : await loadCurrentPhoto.mutateAsync(photo);
      setCropTarget({ file, photo });
    } catch (reason) {
      showError(reason);
    }
  }

  async function saveCropped(blob) {
    const target = cropTarget.photo;
    if (!target) {
      const photo = {
        id: crypto.randomUUID(),
        blob,
        original: cropTarget.file,
        url: URL.createObjectURL(blob)
      };
      setPendingPhotos((current) => [...current, photo]);
      if (!photos.length && !pendingPhotos.length) setPendingPrimary(photo.id);
    } else if (target.blob) {
      URL.revokeObjectURL(target.url);
      setPendingPhotos((current) =>
        current.map((photo) =>
          photo.id === target.id ? { ...photo, blob, url: URL.createObjectURL(blob) } : photo
        )
      );
    } else {
      updateDish(await editPhoto.mutateAsync({ dishId: editingId, photoId: target.id, blob }));
    }
    setCropTarget(null);
  }

  function loadOriginalForEditor() {
    const target = cropTarget.photo;
    return target.blob
      ? target.original
      : loadOriginalPhoto.mutateAsync({ dishId: editingId, photoId: target.id });
  }

  function removePending(photo) {
    URL.revokeObjectURL(photo.url);
    const rest = pendingPhotos.filter((item) => item.id !== photo.id);
    setPendingPhotos(rest);
    if (pendingPrimary === photo.id) setPendingPrimary(rest[0]?.id || null);
  }

  async function changePrimary(photo) {
    if (photo.blob) {
      setPendingPrimary(photo.id);
      return;
    }
    clearErrors('root.server');
    try {
      updateDish(await setPrimaryPhoto.mutateAsync({ dishId: editingId, photoId: photo.id }));
      setPendingPrimary(null);
    } catch (reason) {
      showError(reason);
    }
  }

  async function removePhoto(photo) {
    if (!window.confirm('Удалить это фото?')) return;
    clearErrors('root.server');
    try {
      updateDish(await deletePhoto.mutateAsync({ dishId: editingId, photoId: photo.id }));
    } catch (reason) {
      showError(reason);
    }
  }

  async function save(values) {
    clearErrors('root.server');
    try {
      let saved = await saveDish.mutateAsync({ id: editingId, payload: toPayload(values) });
      updateDish(saved);
      setEditingId(saved.id);
      for (const photo of pendingPhotos) {
        const before = new Set(saved.photos.map((item) => item.id));
        saved = await uploadPhoto.mutateAsync({
          dishId: saved.id,
          blob: photo.blob,
          original: photo.original
        });
        updateDish(saved);
        setPendingPhotos((current) => current.filter((item) => item.id !== photo.id));
        URL.revokeObjectURL(photo.url);
        if (pendingPrimary === photo.id) {
          const uploaded = saved.photos.find((item) => !before.has(item.id));
          saved = await setPrimaryPhoto.mutateAsync({ dishId: saved.id, photoId: uploaded.id });
          updateDish(saved);
          setPendingPrimary(null);
        }
      }
      close();
    } catch (reason) {
      showError(reason);
    }
  }

  async function remove() {
    if (!window.confirm(`Удалить «${getValues('name')}»? Это действие нельзя отменить.`)) return;
    clearErrors('root.server');
    try {
      await deleteDish.mutateAsync(editingId);
      close();
    } catch (reason) {
      showError(reason);
    }
  }

  function validatePrice(value) {
    try {
      parsePrice(value);
      return true;
    } catch (reason) {
      return reason.message;
    }
  }

  return (
    <>
      <div
        className="modal-backdrop"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget && !busy && !cropTarget) close();
        }}
      >
        <section className="editor" role="dialog" aria-modal="true" aria-labelledby="editor-title">
          <div className="editor-head">
            <div>
              <span className="eyebrow">РЕДАКТОР МЕНЮ</span>
              <h2 id="editor-title">{editingId ? 'Редактировать блюдо' : 'Новое блюдо'}</h2>
            </div>
            <button className="close" onClick={close} aria-label="Закрыть" disabled={busy}>
              ×
            </button>
          </div>
          <form noValidate onSubmit={handleSubmit(save)}>
            <div className="form-fields">
              <label>
                Название блюда *
                <input
                  maxLength={120}
                  placeholder="Например, домашний борщ"
                  aria-invalid={Boolean(errors.name)}
                  {...register('name', {
                    validate: (value) => Boolean(value.trim()) || 'Укажите название блюда',
                    maxLength: { value: 120, message: 'Не более 120 символов' }
                  })}
                />
                {errors.name && (
                  <span className="field-error" role="alert">
                    {errors.name.message}
                  </span>
                )}
              </label>
              <label>
                Описание
                <textarea
                  maxLength={2000}
                  rows={3}
                  placeholder="Расскажите о блюде"
                  aria-invalid={Boolean(errors.description)}
                  {...register('description', {
                    maxLength: { value: 2000, message: 'Не более 2000 символов' }
                  })}
                />
                {errors.description && (
                  <span className="field-error" role="alert">
                    {errors.description.message}
                  </span>
                )}
              </label>
              <div className="form-row">
                <label>
                  Категория
                  <input
                    maxLength={80}
                    placeholder="Супы"
                    aria-invalid={Boolean(errors.category)}
                    {...register('category', {
                      maxLength: { value: 80, message: 'Не более 80 символов' }
                    })}
                  />
                  {errors.category && (
                    <span className="field-error" role="alert">
                      {errors.category.message}
                    </span>
                  )}
                </label>
                <label>
                  Цена, ₽ *
                  <input
                    inputMode="decimal"
                    placeholder="350,00"
                    aria-invalid={Boolean(errors.price)}
                    {...register('price', { validate: validatePrice })}
                  />
                  {errors.price && (
                    <span className="field-error" role="alert">
                      {errors.price.message}
                    </span>
                  )}
                </label>
              </div>
              <input type="hidden" {...register('image_url')} />
              <PhotoManager
                name={name}
                photos={photos}
                pendingPhotos={pendingPhotos}
                pendingPrimary={pendingPrimary}
                busy={busy}
                onSelectFile={selectFile}
                onChangePrimary={changePrimary}
                onEditPhoto={editExistingPhoto}
                onRemovePhoto={removePhoto}
                onRemovePending={removePending}
              />
              <label className="switch-row">
                <span>
                  <strong>Опубликовать блюдо</strong>
                  <small>Скрытые блюда не видны покупателям</small>
                </span>
                <input type="checkbox" {...register('is_active')} />
              </label>
              {errors.root?.server && (
                <div className="alert" role="alert">
                  {errors.root.server.message}
                </div>
              )}
            </div>
            <div className="editor-actions">
              {editingId && (
                <button type="button" className="delete-button" onClick={remove} disabled={busy}>
                  Удалить
                </button>
              )}
              <button type="button" className="button subtle" onClick={close} disabled={busy}>
                Отмена
              </button>
              <button className="button primary" disabled={busy}>
                {busy ? 'Сохраняем...' : 'Сохранить блюдо'}
              </button>
            </div>
          </form>
        </section>
      </div>
      {cropTarget && (
        <CropEditor
          file={cropTarget.file}
          editing={Boolean(cropTarget.photo)}
          onCancel={() => setCropTarget(null)}
          onSave={saveCropped}
          onReset={loadOriginalForEditor}
        />
      )}
    </>
  );
}
