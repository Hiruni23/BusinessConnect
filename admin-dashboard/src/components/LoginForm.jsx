import { useState } from 'react';

export default function LoginForm({ onSubmit, loading, errorMessage }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit(email.trim(), password);
  };

  return (
    <main className="login-shell">
      <section className="login-card">
        <p className="brand-eyebrow">BusinessConnect</p>
        <h1>Admin Sign In</h1>
        <p>Only authorized administrators can access this dashboard.</p>

        <form className="login-form" onSubmit={handleSubmit}>
          <label htmlFor="admin-email">Email</label>
          <input
            id="admin-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="admin@businessconnect.com"
            required
          />

          <label htmlFor="admin-password">Password</label>
          <input
            id="admin-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter password"
            required
          />

          {errorMessage ? <div className="form-error">{errorMessage}</div> : null}

          <button className="primary-btn" type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in as Admin'}
          </button>
        </form>
      </section>
    </main>
  );
}
