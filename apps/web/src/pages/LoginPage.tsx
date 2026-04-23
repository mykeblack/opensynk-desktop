import { useEffect, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import './LoginPage.css';

interface LoginPageProps {
  onLogin: (username: string, mode: 'demo' | 'live') => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const savedUsername = localStorage.getItem('opensynk_username');
    if (savedUsername) {
      setUsername(savedUsername);
    }
  }, []);

function handleSubmit(e: React.FormEvent) {
  e.preventDefault();
  setErrorMessage(null);

  const trimmedUsername = username.trim();

  if (!trimmedUsername) {
    setErrorMessage('Please enter a username.');
    return;
  }

  // 🔥 save username
  localStorage.setItem('opensynk_username', trimmedUsername);

  if (trimmedUsername.toLowerCase() === 'demo') {
    onLogin(trimmedUsername, 'demo');
    return;
  }

  if (!password.trim()) {
    setErrorMessage('Please enter a password.');
    return;
  }

  onLogin(trimmedUsername, 'live');
}

  return (
    <main className="login-page">
      <div className="login-card">
        <div className="login-card__header">
          <h1>OpenSynk Desktop</h1>
          <p>Monitor and manage your solar, battery, and home energy system.</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-field">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              autoComplete="username"
            />
          </div>

          <div className="login-field">
            <label htmlFor="password">Password</label>

            <div className="login-password-wrapper">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                autoComplete="current-password"
              />

              <button
                type="button"
                className="login-password-toggle"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {errorMessage && <div className="login-error">{errorMessage}</div>}

          <button className="login-button" type="submit">
            Sign In
          </button>
        </form>

        <div className="login-hint">
          <strong>Just exploring?</strong> Sign in with username <code>demo</code> to
          jump into a guided demo with sample energy data.
        </div>
      </div>
    </main>
  );
}