import { useEffect, useState } from 'react';
import { request } from './api.js';
import AuthScreen from './AuthScreen.jsx';
import Catalog from './Catalog.jsx';
import DishEditor from './DishEditor.jsx';

export default function App() {
  const [token, setToken] = useState('');
  const [dishes, setDishes] = useState([]);
  const [editorDish, setEditorDish] = useState(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    setLoading(true);
    request('/dishes', token).then((data) => {
      if (!cancelled) { setDishes(data); setError(''); }
    }).catch((reason) => {
      if (!cancelled) { setError(reason.message); setLoading(false); setToken(''); }
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [token]);

  function saveDish(dish) {
    setDishes((current) => current.some((item) => item.id === dish.id)
      ? current.map((item) => item.id === dish.id ? dish : item) : [dish, ...current]);
  }

  function logout() {
    setEditorDish(undefined);
    setToken('');
    setDishes([]);
  }

  if (!token) return <AuthScreen loading={loading} error={error} onLogin={(value) => { setError(''); setToken(value); }} />;

  return <>
    <Catalog dishes={dishes} loading={loading} error={error} onAdd={() => setEditorDish(null)}
      onEdit={setEditorDish} onLogout={logout} />
    {editorDish !== undefined && <DishEditor dish={editorDish} token={token} onSaved={saveDish}
      onDeleted={(id) => setDishes((current) => current.filter((item) => item.id !== id))}
      onClose={() => setEditorDish(undefined)} />}
  </>;
}
