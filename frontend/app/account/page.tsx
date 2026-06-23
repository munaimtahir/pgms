"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../context";
import { apiRequest } from "../../lib/api";

export default function AccountPage() {
  const { user, syncUser } = useAuth();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || "");
      setPhone(user.phone || "");
      setEmail(user.email || "");
    }
  }, [user]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
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
        setSuccess("Profile details updated successfully!");
        await syncUser();
      } else {
        setError(data.full_name?.[0] || data.phone?.[0] || data.email?.[0] || data.detail || "Failed to update profile.");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="shell">
        <p className="lead">Loading account details...</p>
      </div>
    );
  }

  return (
    <div className="shell account-shell">
      <div className="panel profile-panel">
        <div className="header-zone">
          <p className="eyebrow">User Profile</p>
          <h2 className="title">My Account</h2>
          <p className="subtitle">Manage your personal settings and contact details.</p>
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
            <span className="alert-message">{success}</span>
          </div>
        )}

        <div className="profile-grid">
          <div className="meta-info">
            <div className="meta-card">
              <span className="card-label">Username</span>
              <span className="card-value">{user.username}</span>
            </div>
            <div className="meta-card">
              <span className="card-label">User Category</span>
              <span className="card-value category-badge">{user.user_category.replace("_", " ")}</span>
            </div>
            <div className="meta-card">
              <span className="card-label">Account Status</span>
              <span className="card-value status-active">Active</span>
            </div>
            <div className="meta-card">
              <span className="card-label">Internal Identity Anchor</span>
              <span className="card-value identity-anchor">ID #{user.id}</span>
            </div>
          </div>

          <form onSubmit={handleUpdate} className="profile-form">
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
              <label htmlFor="phone">Contact Phone</label>
              <input
                type="tel"
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter phone number"
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
                placeholder="Enter email address"
                disabled={submitting}
                required
              />
            </div>

            <button type="submit" className="btn-submit" disabled={submitting}>
              {submitting ? "Updating..." : "Update Profile Details"}
            </button>
          </form>
        </div>
      </div>

      <style jsx>{`
        .account-shell {
          padding-top: 2rem;
          place-items: start center;
        }
        .profile-panel {
          width: min(840px, 100%);
          border-radius: 24px;
        }
        .header-zone {
          margin-bottom: 2.5rem;
        }
        .title {
          font-size: 2.25rem;
          font-weight: 800;
          margin: 0.5rem 0 0.25rem;
          letter-spacing: -0.03em;
        }
        .subtitle {
          font-size: 0.95rem;
          color: var(--muted);
          margin: 0;
        }
        .profile-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 2rem;
        }
        @media (min-width: 640px) {
          .profile-grid {
            grid-template-columns: 240px 1fr;
          }
        }
        .meta-info {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .meta-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 0.85rem 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        .card-label {
          font-size: 0.7rem;
          color: var(--muted);
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .card-value {
          font-size: 0.95rem;
          font-weight: 600;
          color: var(--text);
        }
        .category-badge {
          color: var(--accent);
        }
        .status-active {
          color: #88ff88;
        }
        .identity-anchor {
          font-family: monospace;
          font-size: 0.85rem;
          color: var(--muted);
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
        .form-group input:disabled {
          opacity: 0.6;
          cursor: not-allowed;
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
