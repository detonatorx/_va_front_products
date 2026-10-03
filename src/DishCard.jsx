import DishGallery from './DishGallery.jsx';
import { formatPrice } from './dish.js';

export default function DishCard({ dish, onView, onEdit }) {
  return <article className="dish-card">
    <div className="dish-image"><DishGallery photos={dish.photos} name={dish.name} /></div>
    <div className="dish-body">
      <div className="dish-meta"><span>{dish.category || 'Без категории'}</span>
        <span className={dish.is_active ? 'badge live' : 'badge hidden'}>{dish.is_active ? 'Опубликовано' : 'Скрыто'}</span>
      </div>
      <h3>{dish.name}</h3><p>{dish.description || 'Описание пока не добавлено'}</p>
      <div className="dish-footer"><strong>{formatPrice(dish.price_kopeks)}</strong>
        <div className="dish-links"><button onClick={() => onView(dish.id)} aria-label={`Открыть ${dish.name}`}>Просмотр</button>
          <button onClick={() => onEdit(dish)} aria-label={`Редактировать ${dish.name}`}>Изменить <span>↗</span></button>
        </div>
      </div>
    </div>
  </article>;
}
