import { useEffect, useState } from 'react';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

function initialCrop(image, ratio) {
  return ratio
    ? centerCrop(
        makeAspectCrop({ unit: '%', width: 85 }, ratio, image.width, image.height),
        image.width,
        image.height
      )
    : { unit: '%', x: 5, y: 5, width: 90, height: 90 };
}

export default function CropEditor({ file, onSave, onCancel }) {
  const [source, setSource] = useState('');
  const [image, setImage] = useState(null);
  const [crop, setCrop] = useState();
  const [ratio, setRatio] = useState('free');
  const [width, setWidth] = useState('3');
  const [height, setHeight] = useState('2');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setSource(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const customAspect = Number(width) / Number(height);
  const aspect =
    ratio === 'free'
      ? undefined
      : ratio === 'custom'
        ? Number.isFinite(customAspect) && customAspect > 0
          ? customAspect
          : undefined
        : Number(ratio);

  function changeCropMode(value) {
    setRatio(value);
    if (image)
      setCrop(
        initialCrop(
          image,
          value === 'free' ? undefined : value === 'custom' ? customAspect : Number(value)
        )
      );
  }

  function changeCustom(nextWidth, nextHeight) {
    setWidth(nextWidth);
    setHeight(nextHeight);
    const nextAspect = Number(nextWidth) / Number(nextHeight);
    if (image && Number.isFinite(nextAspect) && nextAspect > 0)
      setCrop(initialCrop(image, nextAspect));
  }

  async function apply() {
    if (!image || !crop?.width || !crop?.height || (ratio === 'custom' && !aspect)) {
      setError('Выберите область обрезки и корректное соотношение сторон');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;
      const pixels =
        crop.unit === '%'
          ? {
              x: (crop.x * image.width) / 100,
              y: (crop.y * image.height) / 100,
              width: (crop.width * image.width) / 100,
              height: (crop.height * image.height) / 100
            }
          : crop;
      const sourceWidth = Math.floor(pixels.width * scaleX);
      const sourceHeight = Math.floor(pixels.height * scaleY);
      if (sourceWidth < 20 || sourceHeight < 20) throw new Error('Область обрезки слишком мала');
      const scale = Math.min(1, 2000 / Math.max(sourceWidth, sourceHeight));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(sourceWidth * scale));
      canvas.height = Math.max(1, Math.round(sourceHeight * scale));
      const context = canvas.getContext('2d');
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(
        image,
        Math.round(pixels.x * scaleX),
        Math.round(pixels.y * scaleY),
        sourceWidth,
        sourceHeight,
        0,
        0,
        canvas.width,
        canvas.height
      );
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.88));
      if (!blob) throw new Error('Не удалось сохранить обрезанное фото');
      onSave(blob);
    } catch (reason) {
      setError(reason.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="crop-backdrop" role="presentation">
      <section className="crop-dialog" role="dialog" aria-modal="true" aria-labelledby="crop-title">
        <div className="crop-head">
          <div>
            <span className="eyebrow">НОВОЕ ФОТО</span>
            <h2 id="crop-title">Обрезать фото</h2>
          </div>
          <button
            type="button"
            className="close"
            onClick={onCancel}
            aria-label="Закрыть"
            disabled={busy}
          >
            ×
          </button>
        </div>
        <div className="crop-content">
          <p>Перетащите границы области, чтобы выбрать нужную часть снимка.</p>
          <div className="crop-stage">
            {source && (
              <ReactCrop
                crop={crop}
                onChange={setCrop}
                aspect={aspect}
                keepSelection
                minWidth={20}
                minHeight={20}
              >
                <img
                  src={source}
                  alt="Фото для обрезки"
                  onLoad={(event) => {
                    if (
                      event.currentTarget.naturalWidth * event.currentTarget.naturalHeight >
                      40000000
                    ) {
                      setError('Разрешение фото слишком велико (максимум 40 мегапикселей)');
                      return;
                    }
                    setImage(event.currentTarget);
                    setCrop(initialCrop(event.currentTarget, aspect));
                  }}
                />
              </ReactCrop>
            )}
          </div>
          <div className="crop-modes" role="group" aria-label="Соотношение сторон">
            {[
              ['free', 'Свободно'],
              ['1', '1:1'],
              ['1.3333333333', '4:3'],
              ['1.7777777778', '16:9'],
              ['custom', 'Своё']
            ].map(([value, label]) => (
              <button
                type="button"
                key={value}
                className={ratio === value ? 'selected' : ''}
                onClick={() => changeCropMode(value)}
              >
                {label}
              </button>
            ))}
          </div>
          {ratio === 'custom' && (
            <div className="crop-custom">
              <label>
                Ширина
                <input
                  type="number"
                  min="0.01"
                  step="any"
                  value={width}
                  onChange={(event) => changeCustom(event.target.value, height)}
                />
              </label>
              <span>:</span>
              <label>
                Высота
                <input
                  type="number"
                  min="0.01"
                  step="any"
                  value={height}
                  onChange={(event) => changeCustom(width, event.target.value)}
                />
              </label>
            </div>
          )}
          {error && (
            <div className="alert" role="alert">
              {error}
            </div>
          )}
        </div>
        <div className="crop-actions">
          <button type="button" className="button subtle" onClick={onCancel} disabled={busy}>
            Отмена
          </button>
          <button type="button" className="button primary" onClick={apply} disabled={busy}>
            Добавить фото
          </button>
        </div>
      </section>
    </div>
  );
}
