import { useState } from 'react';
import { Eye, EyeOff, KeyRound, LogIn, Mail } from 'lucide-react';
import { login } from '../api/auth';
import { AppBrand } from '../components/AppBrand';
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
        <div className="login-brand-wrap">
          <AppBrand href="" />
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-field">
            <label>Email</label>
            <div className="login-input-wrapper">
              <span className="login-input-icon"><Mail size={16} /></span>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
              />
            </div>
          </div>

          <div className="login-field">
            <label>Password</label>
            <div className="login-password-wrapper">
              <span className="login-input-icon"><KeyRound size={16} /></span>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your Sunsynk password"
                required
              />
              <button
                type="button"
                className="login-password-toggle"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>

            <a
              className="login-forgot-link"
              href="https://www.sunsynk.net/forget"
              target="_blank"
              rel="noreferrer"
            >
              Forgot your Sunsynk password?
            </a>
          </div>

          <label className="login-checkbox">
            <input
              type="checkbox"
              checked={keepSignedIn}
              onChange={(e) => setKeepSignedIn(e.target.checked)}
            />
            Keep me signed in
          </label>

          {error && <div className="login-error">{error}</div>}

          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >
            <LogIn size={18} />
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div className="login-demo">
          <p>Try demo mode with <strong>demo / demo</strong></p>
        </div>
      </div>
    </div>
  );
}