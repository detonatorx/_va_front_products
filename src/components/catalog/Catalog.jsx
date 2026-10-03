import { useState } from 'react';
import DishCard from './DishCard.jsx';
import DishDetails from './DishDetails.jsx';

export default function Catalog({ dishes, loading, error, onAdd, onEdit, onLogout }) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [detailsId, setDetailsId] = useState(null);
  const visible = dishes.filter((dish) =>
    (filter === 'all' || (filter === 'active' ? dish.is_active : !dish.is_active)) &&
    `${dish.name} ${dish.category}`.toLocaleLowerCase('ru').includes(search.toLocaleLowerCase('ru'))
  );
  const details = dishes.find((dish) => dish.id === detailsId);

  function edit(dish) {
    setDetailsId(null);
    onEdit(dish);
  }

  return <div className="app-shell">
    <header className="topbar">
      <div className="brand"><div className="brand-mark small">К</div><span>КУХНЯ <b>/</b> КАТАЛОГ</span></div>
      <button className="text-button" onClick={onLogout}>Выйти <span>↗</span></button>
    </header>
    <main className="content">
      <div className="intro"><div><span className="eyebrow">ВАШЕ ПРОСТРАНСТВО</span><h1>Каталог <em>блюд</em></h1>
        <p>Создавайте блюда и управляйте тем, что увидят покупатели.</p></div>
        <button className="button primary add-desktop" onClick={onAdd}>＋ Добавить блюдо</button>
      </div>
      <div className="stats"><div><strong>{dishes.length}</strong><span>Всего блюд</span></div>
        <div><strong>{dishes.filter((dish) => dish.is_active).length}</strong><span>Опубликовано</span></div>
        <div><strong>{dishes.filter((dish) => !dish.is_active).length}</strong><span>Скрыто</span></div>
      </div>
      <div className="section-heading"><h2>Блюда <span>{visible.length}</span></h2><div className="tools">
        <input aria-label="Поиск блюд" className="search" placeholder="Поиск по меню..." value={search} onChange={(event) => setSearch(event.target.value)} />
        <select aria-label="Фильтр публикации" value={filter} onChange={(event) => setFilter(event.target.value)}>
          <option value="all">Все блюда</option><option value="active">Опубликованы</option><option value="hidden">Скрыты</option>
        </select>
      </div></div>
      {error && <div className="alert" role="alert">{error}</div>}
      {loading ? <div className="empty">Загружаем блюда...</div> : visible.length === 0 ?
        <div className="empty"><span className="empty-icon">✳</span><h3>{dishes.length ? 'Ничего не найдено' : 'Начните с первого блюда'}</h3>
          <p>{dishes.length ? 'Измените запрос или фильтр.' : 'Добавьте блюдо — и оно появится здесь.'}</p>
          {!dishes.length && <button className="button primary" onClick={onAdd}>Добавить блюдо</button>}
        </div> : <div className="dish-grid">{visible.map((dish) =>
          <DishCard key={dish.id} dish={dish} onView={setDetailsId} onEdit={edit} />)}</div>}
    </main>
    <button className="mobile-add" onClick={onAdd} aria-label="Добавить блюдо">＋</button>
    {details && <DishDetails dish={details} onClose={() => setDetailsId(null)} onEdit={edit} />}
  </div>;
}
