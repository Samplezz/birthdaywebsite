'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, KeyRound, Eye, EyeOff, ShieldCheck, Lock } from 'lucide-react';

export default function EditorLoginPage() {
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
        setError(data.error || 'Incorrect editor password.');
        setLoading(false);
        return;
      }

      // Success: Redirect to editor dashboard
      router.push('/');
      router.refresh();
    } catch {
      setError('Unable to reach authentication service. Please try again.');
      setLoading(false);
    }
  };

  return (
    <main className="editor-login-wrapper">
      <div className="login-box">
        <div className="brand-header">
          <div className="brand-icon-box">
            <ShieldCheck size={28} color="#ff758f" />
          </div>
          <h1 className="brand-title">Birthday Studio</h1>
          <p className="brand-subtitle">
            Private No-Code Owner Studio • Enter your admin key to edit her special site
          </p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-field-box">
            <KeyRound size={18} className="field-icon" />
            <input
              type={showPassword ? 'text' : 'password'}
              className="editor-input-field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter owner password..."
              autoFocus
              required
            />
            <button
              type="button"
              className="eye-toggle"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="btn-primary submit-btn" disabled={loading}>
            {loading ? 'Verifying...' : 'Unlock Studio Dashboard'}
          </button>
        </form>

        <div className="footer-notice">
          <Lock size={12} />
          <span>Editor session is completely isolated from visitor access</span>
        </div>
      </div>

      <style jsx>{`
        .editor-login-wrapper {
          min-height: 100vh;
          background: #150912;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .login-box {
          width: 100%;
          max-width: 440px;
          background: #241120;
          border: 1px solid rgba(255, 117, 143, 0.25);
          border-radius: 24px;
          padding: 38px 30px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          box-shadow: 0 15px 40px rgba(0, 0, 0, 0.6);
        }

        .brand-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 26px;
        }

        .brand-icon-box {
          width: 54px;
          height: 54px;
          border-radius: 16px;
          background: rgba(255, 117, 143, 0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 14px;
        }

        .brand-title {
          font-size: 1.6rem;
          font-weight: 700;
          color: #fff;
        }

        .brand-subtitle {
          font-size: 0.88rem;
          color: #d4a3b3;
          margin-top: 6px;
          line-height: 1.45;
        }

        .login-form {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .input-field-box {
          position: relative;
          display: flex;
          align-items: center;
          width: 100%;
        }

        .field-icon {
          position: absolute;
          left: 16px;
          color: #ff758f;
        }

        .editor-input-field {
          width: 100%;
          background: #180915;
          border: 1.5px solid rgba(255, 117, 143, 0.3);
          border-radius: 12px;
          padding: 14px 48px 14px 46px;
          color: #fff;
          font-size: 1rem;
          outline: none;
          transition: border-color 0.2s;
        }

        .editor-input-field:focus {
          border-color: #ff758f;
        }

        .eye-toggle {
          position: absolute;
          right: 14px;
          background: none;
          border: none;
          color: #d4a3b3;
          cursor: pointer;
          display: flex;
          align-items: center;
        }

        .eye-toggle:hover {
          color: #fff;
        }

        .error-message {
          background: rgba(239, 68, 68, 0.15);
          border: 1px solid rgba(239, 68, 68, 0.4);
          color: #fca5a5;
          padding: 10px 14px;
          border-radius: 10px;
          font-size: 0.85rem;
          text-align: left;
        }

        .submit-btn {
          width: 100%;
          border-radius: 12px;
          margin-top: 6px;
        }

        .footer-notice {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.75rem;
          color: #9a6d7c;
          margin-top: 24px;
        }
      `}</style>
    </main>
  );
}
