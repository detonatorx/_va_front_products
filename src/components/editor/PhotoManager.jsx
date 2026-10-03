import { photoSource } from '../../utils/photo.js';

export default function PhotoManager({
  name,
  photos,
  pendingPhotos,
  pendingPrimary,
  busy,
  onSelectFile,
  onChangePrimary,
  onRemovePhoto,
  onRemovePending
}) {
  const items = [...photos, ...pendingPhotos].sort(
    (a, b) => Number(b.id === pendingPrimary) - Number(a.id === pendingPrimary)
  );

  return (
    <div className="photo-manager">
      <div className="photo-heading">
        <strong>Фотографии</strong>
        <span>{items.length} / 10</span>
      </div>
      <p>
        Первое фото в галерее — главное. Фото с пометкой «Будет добавлено» загрузятся при сохранении
        блюда.
      </p>
      <div className="photo-list">
        {items.map((photo) => {
          const primary = pendingPrimary ? pendingPrimary === photo.id : photo.is_primary;
          return (
            <div className="photo-item" key={photo.id}>
              <img
                src={photo.blob ? photo.url : photoSource(photo.url)}
                alt={`Фото блюда ${name}`}
              />
              <div className="photo-item-actions">
                {photo.blob && <span className="photo-pending">Будет добавлено</span>}
                {primary ? (
                  <span className="photo-primary">Главное</span>
                ) : (
                  <button type="button" disabled={busy} onClick={() => onChangePrimary(photo)}>
                    Сделать главным
                  </button>
                )}
                <button
                  type="button"
                  className="photo-remove"
                  disabled={busy}
                  onClick={() => (photo.blob ? onRemovePending(photo) : onRemovePhoto(photo))}
                >
                  Удалить
                </button>
              </div>
            </div>
          );
        })}
      </div>
      {items.length < 10 && (
        <label className="photo-upload">
          ＋ Добавить фото
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={busy}
            onChange={onSelectFile}
          />
        </label>
      )}
      <small>
        JPEG, PNG или WebP до 10 МБ. При добавлении можно свободно обрезать фото или выбрать 1:1.
      </small>
    </div>
  );
}
