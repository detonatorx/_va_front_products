import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useDishes } from './hooks/useDishes.js';
import AuthScreen from './components/auth/AuthScreen.jsx';
import Catalog from './components/catalog/Catalog.jsx';
import DishEditor from './components/editor/DishEditor.jsx';

export default function App() {
  const queryClient = useQueryClient();
  const [token, setToken] = useState('');
  const [editorDish, setEditorDish] = useState(undefined);
  const [authError, setAuthError] = useState('');
  const { data: dishes = [], isPending, error } = useDishes(token);

  useEffect(() => {
    if (!token || !error) return;
    setAuthError(error.message);
    setEditorDish(undefined);
    setToken('');
    queryClient.clear();
  }, [token, error, queryClient]);

  function logout() {
    setEditorDish(undefined);
    setToken('');
    setAuthError('');
    queryClient.clear();
  }

  if (!token)
    return (
      <AuthScreen
        error={authError}
        onLogin={(value) => {
          setAuthError('');
          setToken(value);
        }}
      />
    );

  return (
    <>
      <Catalog
        dishes={dishes}
        loading={isPending}
        onAdd={() => setEditorDish(null)}
        onEdit={setEditorDish}
        onLogout={logout}
      />
      {editorDish !== undefined && (
        <DishEditor dish={editorDish} token={token} onClose={() => setEditorDish(undefined)} />
      )}
    </>
  );
}
