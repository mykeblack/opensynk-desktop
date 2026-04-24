import { useState } from 'react';
import { login } from '../api/auth';
import './LoginPage.css';

type AppMode = 'demo' | 'live';

type Props = {
  onLogin: (
    email: string,
    mode: AppMode,
    sessionToken: string,
    keepSignedIn: boolean,
  ) => void;
};

export default function LoginPage({ onLogin }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [keepSignedIn, setKeepSignedIn] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);
    setError(null);

    try {
      const result = await login(email, password, keepSignedIn);

      if (!result.success) {
        setError(result.message || 'Login failed');
        return;
      }

      if (!result.session_token) {
        setError('Login failed: no session token returned');
        return;
      }

      onLogin(
        result.email!,
        result.mode!,
        result.session_token,
        keepSignedIn,
      );
    } catch (err) {
      console.error('Login error', err);
      setError('Unable to connect to server');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>OpenSynk</h1>
        <p className="login-subtitle">
          Monitor your solar, battery, and energy usage
        </p>

        <form onSubmit={handleSubmit}>
          <div className="login-field">
            <label>Email</label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
            />
          </div>

          <div className="login-field">
            <label>Password</label>

            <div className="login-password-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your Sunsynk password"
                required
              />

              <button
                type="button"
                className="login-show-password"
                onClick={() => setShowPassword((prev) => !prev)}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>

            <div className="login-forgot">
              <a
                href="https://www.sunsynk.net/forget"
                target="_blank"
                rel="noreferrer"
              >
                Forgot your Sunsynk password?
              </a>
            </div>
          </div>

          <div className="login-checkbox">
            <label>
              <input
                type="checkbox"
                checked={keepSignedIn}
                onChange={(e) => setKeepSignedIn(e.target.checked)}
              />
              Keep me signed in
            </label>
          </div>

          {error && <div className="login-error">{error}</div>}

          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div className="login-demo">
          <p>
            Try demo mode:
            <br />
            <strong>demo / demo</strong>
          </p>
        </div>
      </div>
    </div>
  );
}