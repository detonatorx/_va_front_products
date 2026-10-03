import { useState } from 'react';

export default function AuthScreen({ onLogin, error, loading }) {
  const [tokenInput, setTokenInput] = useState('');

  return <div className="auth-page">
    <div className="auth-card">
      <div className="brand-mark">К</div>
      <span className="eyebrow">УПРАВЛЕНИЕ МЕНЮ</span>
      <h1>Ваша кухня.<br /><em>Ваше меню.</em></h1>
      <p>Войдите с токеном администратора, чтобы создавать и редактировать блюда.</p>
      <form onSubmit={(event) => { event.preventDefault(); onLogin(tokenInput.trim()); }}>
        <label htmlFor="token">Токен администратора</label>
        <input id="token" type="password" autoComplete="off" required value={tokenInput}
          onChange={(event) => setTokenInput(event.target.value)} placeholder="Введите токен" />
        <button className="button primary full" disabled={loading}>Открыть каталог <span>→</span></button>
      </form>
      {error && <div className="alert" role="alert">{error}</div>}
      <small>Токен хранится только в памяти текущей вкладки.</small>
    </div>
  </div>;
}
