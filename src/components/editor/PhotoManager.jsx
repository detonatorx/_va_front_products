import { useRef, useState } from 'react';
import { IconArrowLeft, IconArrowRight, IconGripVertical, IconPlus } from '@tabler/icons-react';
import { photoSource } from '../../utils/photo.js';
import { movePhoto } from '../../utils/photoOrder.mjs';

export default function PhotoManager({
  name,
  items,
  busy,
  onSelectFiles,
  onChangePrimary,
  onReorder,
  onEditPhoto,
  onRemovePhoto,
  onRemovePending
}) {
  const fileInputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [draggedPhoto, setDraggedPhoto] = useState(null);
  const [dropTarget, setDropTarget] = useState(null);
  const draggedPhotoRef = useRef(null);
  const photoIds = items.map((photo) => photo.id);

  function endPhotoDrag() {
    draggedPhotoRef.current = null;
    setDraggedPhoto(null);
    setDropTarget(null);
  }

  return (
    <div className="photo-manager">
      <div className="photo-heading">
        <strong>Фотографии</strong>
        <span>{items.length} / 10</span>
      </div>
      <p>
        Перетаскивайте фото или используйте стрелки, чтобы изменить порядок. Первое фото — главное.
        Фото с пометкой «Будет добавлено» загрузятся при сохранении блюда.
      </p>
      <div className="photo-list">
        {items.map((photo, index) => {
          const primary = index === 0;
          return (
            <div
              className={`photo-item${draggedPhoto === photo.id ? ' is-dragging' : ''}${dropTarget === photo.id ? ' is-drop-target' : ''}`}
              key={photo.id}
              onDragOver={(event) => {
                if (busy || !draggedPhotoRef.current || draggedPhotoRef.current === photo.id)
                  return;
                event.preventDefault();
                event.dataTransfer.dropEffect = 'move';
                setDropTarget(photo.id);
              }}
              onDragLeave={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) setDropTarget(null);
              }}
              onDrop={(event) => {
                if (!draggedPhotoRef.current) return;
                event.preventDefault();
                event.stopPropagation();
                if (!busy) onReorder(movePhoto(photoIds, draggedPhotoRef.current, photo.id));
                endPhotoDrag();
              }}
            >
              <div
                className="photo-item-preview"
                draggable={!busy && items.length > 1}
                onDragStart={(event) => {
                  if (busy) {
                    event.preventDefault();
                    return;
                  }
                  draggedPhotoRef.current = photo.id;
                  setDraggedPhoto(photo.id);
                  event.dataTransfer.effectAllowed = 'move';
                  event.dataTransfer.setData('text/plain', photo.id);
                }}
                onDragEnd={endPhotoDrag}
              >
                <img
                  src={photo.blob ? photo.url : photoSource(photo.url)}
                  alt={`Фото блюда ${name}, ${index + 1}`}
                  draggable={false}
                />
                <span className="photo-position">{index + 1}</span>
                {items.length > 1 && (
                  <span className="photo-drag-handle" aria-hidden="true">
                    <IconGripVertical size={18} />
                  </span>
                )}
              </div>
              <div className="photo-item-actions">
                {items.length > 1 && (
                  <div className="photo-order-actions">
                    <button
                      type="button"
                      disabled={busy || index === 0}
                      aria-label={`Переместить фото ${index + 1} назад`}
                      title="Переместить назад"
                      onClick={() => onReorder(movePhoto(photoIds, photo.id, photoIds[index - 1]))}
                    >
                      <IconArrowLeft size={16} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      disabled={busy || index === items.length - 1}
                      aria-label={`Переместить фото ${index + 1} вперёд`}
                      title="Переместить вперёд"
                      onClick={() => onReorder(movePhoto(photoIds, photo.id, photoIds[index + 1]))}
                    >
                      <IconArrowRight size={16} aria-hidden="true" />
                    </button>
                  </div>
                )}
                {photo.blob && <span className="photo-pending">Будет добавлено</span>}
                {!primary && (
                  <button type="button" disabled={busy} onClick={() => onChangePrimary(photo)}>
                    Сделать главным
                  </button>
                )}
                {(photo.blob || photo.can_edit) && (
                  <button type="button" disabled={busy} onClick={() => onEditPhoto(photo)}>
                    Изменить фото
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
        <div
          className={`photo-dropzone${dragging && !busy ? ' is-dragging' : ''}${busy ? ' is-disabled' : ''}`}
          onDragOver={(event) => {
            if (draggedPhotoRef.current) return;
            event.preventDefault();
            event.dataTransfer.dropEffect = busy ? 'none' : 'copy';
            if (!busy) setDragging(true);
          }}
          onDragLeave={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) setDragging(false);
          }}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            if (draggedPhotoRef.current) return;
            if (!busy) onSelectFiles(Array.from(event.dataTransfer.files));
          }}
        >
          <button
            type="button"
            className="photo-upload"
            disabled={busy}
            onClick={() => fileInputRef.current?.click()}
          >
            <IconPlus size={20} stroke={1.8} aria-hidden="true" />
            Добавить фото
          </button>
          <span className="photo-dropzone-hint">
            {dragging && !busy ? 'Отпустите фото здесь' : 'или перетащите фото сюда'}
          </span>
          <input
            ref={fileInputRef}
            className="photo-file-input"
            type="file"
            hidden
            multiple
            accept="image/jpeg,image/png,image/webp"
            disabled={busy}
            onChange={(event) => {
              const files = Array.from(event.target.files || []);
              event.target.value = '';
              onSelectFiles(files);
            }}
          />
        </div>
      )}
      <small>
        JPEG, PNG или WebP до 10 МБ. При добавлении можно свободно обрезать фото или выбрать 1:1.
      </small>
    </div>
  );
}
