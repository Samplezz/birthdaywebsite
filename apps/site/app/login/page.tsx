'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, Lock, KeyRound, Eye, EyeOff, Sparkles } from 'lucide-react';

export default function VisitorLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Incorrect password.');
        setLoading(false);
        return;
      }

      // Success: Redirect to main birthday page
      router.push('/');
      router.refresh();
    } catch {
      setError('Unable to connect to the celebration server. Please try again.');
      setLoading(false);
    }
  };

  return (
    <main className="login-container">
      {/* Ambient candle background */}
      <div className="candle-ambient" />

      <div className="login-card glass-panel glass-glow">
        <div className="login-badge">
          <Heart size={18} fill="#ff758f" color="#ff758f" className="badge-heart" />
          <span>Private Celebration</span>
        </div>

        <h1 className="login-title script-heading">Happy Birthday</h1>
        <p className="login-subtitle">
          A world made with love, kept just for us. Please enter the password to step inside.
        </p>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-field-wrapper">
            <KeyRound size={18} className="field-icon" />
            <input
              type={showPassword ? 'text' : 'password'}
              className="password-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your secret password..."
              autoFocus
              required
            />
            <button
              type="button"
              className="toggle-vis-btn"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {error && (
            <div className="error-alert">
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            className="romantic-btn submit-btn"
            disabled={loading}
          >
            {loading ? (
              <span>Unlocking...</span>
            ) : (
              <>
                <Sparkles size={18} /> Enter Celebration
              </>
            )}
          </button>
        </form>

        <div className="login-hint">
          <Lock size={12} />
          <span>Protected with server-side encryption</span>
        </div>
      </div>

      <style jsx>{`
        .login-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          position: relative;
          background: #12070f;
          overflow: hidden;
        }

        .candle-ambient {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at 50% 30%, rgba(255, 190, 11, 0.16) 0%, transparent 60%),
            radial-gradient(circle at 80% 80%, rgba(255, 117, 143, 0.14) 0%, transparent 50%),
            linear-gradient(180deg, #12070f 0%, #200a18 100%);
          pointer-events: none;
        }

        .login-card {
          width: 100%;
          max-width: 420px;
          padding: 40px 28px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          position: relative;
          z-index: 2;
          background: rgba(36, 12, 27, 0.85);
        }

        .login-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 14px;
          background: rgba(255, 117, 143, 0.15);
          border: 1px solid rgba(255, 117, 143, 0.35);
          border-radius: 9999px;
          font-size: 0.8rem;
          color: var(--rose-soft);
          margin-bottom: 16px;
        }

        .badge-heart {
          animation: gentle-pulse 1.8s infinite;
        }

        .login-title {
          font-size: clamp(2.4rem, 8vw, 3.2rem);
          color: #fff;
          text-shadow: 0 0 20px rgba(255, 117, 143, 0.4);
          line-height: 1.1;
          margin-bottom: 10px;
        }

        .login-subtitle {
          font-size: 0.95rem;
          color: var(--text-muted);
          line-height: 1.5;
          margin-bottom: 28px;
        }

        .login-form {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .input-field-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          width: 100%;
        }

        .field-icon {
          position: absolute;
          left: 16px;
          color: var(--rose-soft);
          pointer-events: none;
        }

        .password-input {
          width: 100%;
          background: rgba(18, 5, 14, 0.8);
          border: 1.5px solid rgba(255, 117, 143, 0.35);
          border-radius: 9999px;
          padding: 14px 48px 14px 46px;
          color: #fff;
          font-size: 1rem;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .password-input:focus {
          border-color: var(--rose-soft);
          box-shadow: 0 0 16px rgba(255, 117, 143, 0.3);
        }

        .toggle-vis-btn {
          position: absolute;
          right: 14px;
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          display: flex;
          align-items: center;
          padding: 4px;
        }

        .toggle-vis-btn:hover {
          color: #fff;
        }

        .error-alert {
          background: rgba(239, 68, 68, 0.15);
          border: 1px solid rgba(239, 68, 68, 0.4);
          color: #fca5a5;
          padding: 10px 14px;
          border-radius: 12px;
          font-size: 0.85rem;
          text-align: left;
        }

        .submit-btn {
          width: 100%;
          margin-top: 6px;
        }

        .login-hint {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.75rem;
          color: var(--text-muted);
          margin-top: 24px;
          opacity: 0.8;
        }
      `}</style>
    </main>
  );
}
