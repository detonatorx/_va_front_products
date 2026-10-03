import { useForm } from 'react-hook-form';

export default function AuthScreen({ onLogin, error }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm({ defaultValues: { token: '' } });

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="brand-mark">К</div>
        <span className="eyebrow">УПРАВЛЕНИЕ МЕНЮ</span>
        <h1>
          Ваша кухня.
          <br />
          <em>Ваше меню.</em>
        </h1>
        <p>Войдите с токеном администратора, чтобы создавать и редактировать блюда.</p>
        <form noValidate onSubmit={handleSubmit(({ token }) => onLogin(token.trim()))}>
          <label htmlFor="token">Токен администратора</label>
          <input
            id="token"
            type="password"
            autoComplete="off"
            placeholder="Введите токен"
            aria-invalid={Boolean(errors.token)}
            {...register('token', {
              validate: (value) => Boolean(value.trim()) || 'Введите токен администратора'
            })}
          />
          {errors.token && (
            <span className="field-error" role="alert">
              {errors.token.message}
            </span>
          )}
          <button className="button primary full" disabled={isSubmitting}>
            Открыть каталог <span>→</span>
          </button>
        </form>
        {error && (
          <div className="alert" role="alert">
            {error}
          </div>
        )}
        <small>Токен хранится только в памяти текущей вкладки.</small>
      </div>
    </div>
  );
}
