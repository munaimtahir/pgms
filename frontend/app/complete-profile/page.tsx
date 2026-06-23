"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../context";
import { apiRequest } from "../../lib/api";

export default function CompleteProfilePage() {
  const { user, syncUser } = useAuth();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || "");
      setPhone(user.phone || "");
      setEmail(user.email || "");
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !phone || !email) {
      setError("All fields are required.");
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const res = await apiRequest("/auth/complete-profile/", {
        method: "PATCH",
        body: JSON.stringify({
          full_name: fullName,
          phone: phone,
          email: email,
        }),
      });

      const data = await res.json();

      if (res.status === 200) {
        setSuccess(true);
        // Sync user state to update is_profile_complete = true
        await syncUser();
      } else {
        setError(data.full_name?.[0] || data.phone?.[0] || data.email?.[0] || data.detail || "Failed to update profile.");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="shell">
      <div className="panel complete-profile-panel">
        <div className="header-zone">
          <p className="eyebrow">Onboarding Required</p>
          <h2 className="title">Complete Profile</h2>
          <p className="subtitle">Please provide your institutional contact details to activate your account.</p>
        </div>

        {error && (
          <div className="alert alert-error">
            <span className="alert-icon">⚠️</span>
            <span className="alert-message">{error}</span>
          </div>
        )}

        {success && (
          <div className="alert alert-success">
            <span className="alert-icon">✅</span>
            <span className="alert-message">Profile completed! Redirecting...</span>
          </div>
        )}

        {!success && (
          <form onSubmit={handleSubmit} className="profile-form">
            <div className="form-group">
              <label htmlFor="fullName">Full Name</label>
              <input
                type="text"
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
                disabled={submitting}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone">Contact Phone Number</label>
              <input
                type="tel"
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter contact phone number"
                disabled={submitting}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter institutional email address"
                disabled={submitting}
                required
              />
              <p className="field-hint">This email will be used for future Google authentication compatibility.</p>
            </div>

            <button type="submit" className="btn-submit" disabled={submitting}>
              {submitting ? "Saving Profile..." : "Complete Profile"}
            </button>
          </form>
        )}
      </div>

      <style jsx>{`
        .complete-profile-panel {
          max-width: 500px;
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
          line-height: 1.4;
        }
        .alert {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem;
          border-radius: 12px;
          margin-bottom: 1.5rem;
          font-size: 0.85rem;
        }
        .alert-error {
          background: rgba(255, 100, 100, 0.08);
          border: 1px solid rgba(255, 100, 100, 0.2);
          color: #ff9999;
        }
        .alert-success {
          background: rgba(100, 255, 100, 0.08);
          border: 1px solid rgba(100, 255, 100, 0.2);
          color: #99ff99;
        }
        .alert-icon {
          font-size: 1.1rem;
        }
        .profile-form {
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
        .field-hint {
          font-size: 0.75rem;
          color: var(--muted);
          margin: 0;
          margin-top: 0.15rem;
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
