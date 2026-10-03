import DishGallery from './DishGallery.jsx';
import { formatPrice } from '../../utils/dish.js';

export default function DishDetails({ dish, onClose, onEdit }) {
  return <div className="detail-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="detail-dialog" role="dialog" aria-modal="true" aria-labelledby="detail-title">
      <button type="button" className="detail-close" onClick={onClose} aria-label="Закрыть">×</button>
      <div className="detail-image"><DishGallery photos={dish.photos} name={dish.name} large /></div>
      <div className="detail-body"><span className="eyebrow">{dish.category || 'МЕНЮ'}</span><h2 id="detail-title">{dish.name}</h2>
        <p>{dish.description || 'Описание пока не добавлено'}</p>
        <div className="detail-bottom"><strong>{formatPrice(dish.price_kopeks)}</strong>
          <button className="button primary" onClick={() => onEdit(dish)}>Редактировать</button>
        </div>
      </div>
    </section>
  </div>;
}
