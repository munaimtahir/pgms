"use client";

import React, { useState } from "react";
import { useAuth } from "../context";
import { apiRequest } from "../../lib/api";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError("Username and password are required.");
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const res = await apiRequest("/auth/login/", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.status === 200) {
        login(data.access, data.refresh, data.user);
      } else {
        setError(data.detail || "Invalid username or password.");
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="shell">
      <div className="panel login-panel">
        <div className="header-zone">
          <p className="eyebrow">Institutional Access</p>
          <h2 className="title">Sign In to PGMS</h2>
          <p className="subtitle">Postgraduate Management System</p>
        </div>

        {error && (
          <div className="alert alert-error">
            <span className="alert-icon">⚠️</span>
            <span className="alert-message">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              autoComplete="username"
              disabled={submitting}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
              disabled={submitting}
              required
            />
          </div>

          <button type="submit" className="btn-submit" disabled={submitting}>
            {submitting ? "Signing In..." : "Sign In"}
          </button>
        </form>
      </div>

      <style jsx>{`
        .login-panel {
          max-width: 440px;
          border-radius: 24px;
        }
        .header-zone {
          text-align: center;
          margin-bottom: 2rem;
        }
        .title {
          font-size: 2rem;
          font-weight: 800;
          margin: 0.5rem 0 0.25rem;
          letter-spacing: -0.03em;
        }
        .subtitle {
          font-size: 0.9rem;
          color: var(--muted);
          margin: 0;
        }
        .alert {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          background: rgba(255, 100, 100, 0.08);
          border: 1px solid rgba(255, 100, 100, 0.2);
          padding: 1rem;
          border-radius: 12px;
          margin-bottom: 1.5rem;
          color: #ff9999;
          font-size: 0.85rem;
        }
        .alert-icon {
          font-size: 1.1rem;
        }
        .login-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .form-group label {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text);
        }
        .form-group input {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid var(--border);
          color: var(--text);
          padding: 0.75rem 1rem;
          border-radius: 12px;
          font-size: 0.95rem;
          outline: none;
          transition: all 0.2s ease;
        }
        .form-group input:focus {
          border-color: var(--accent);
          background: rgba(255, 255, 255, 0.06);
          box-shadow: 0 0 0 4px rgba(143, 211, 255, 0.15);
        }
        .form-group input::placeholder {
          color: rgba(245, 247, 255, 0.35);
        }
        .btn-submit {
          background: var(--text);
          color: var(--bg);
          border: none;
          padding: 0.85rem;
          border-radius: 12px;
          font-size: 0.95rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
          margin-top: 0.5rem;
        }
        .btn-submit:hover:not(:disabled) {
          background: var(--accent-strong);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(143, 211, 255, 0.2);
        }
        .btn-submit:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
