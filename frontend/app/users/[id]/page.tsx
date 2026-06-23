"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiRequest, User } from "../../../lib/api";

export default function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Edit Form State
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState("RESIDENT");
  const [isActive, setIsActive] = useState(true);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  // Reset Password State
  const [newPassword, setNewPassword] = useState("");
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    fetchUser();
  }, [id]);

  const fetchUser = async () => {
    try {
      const res = await apiRequest(`/users/${id}/`);
      const data = await res.json();
      if (res.status === 200) {
        setUser(data);
        setFullName(data.full_name || "");
        setPhone(data.phone || "");
        setEmail(data.email || "");
        setCategory(data.user_category);
        setIsActive(data.is_active !== false);
      } else {
        setEditError(data.detail || "Failed to load user account details.");
      }
    } catch (err: any) {
      setEditError(err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError(null);
    setEditSuccess(null);
    setUpdating(true);

    try {
      const res = await apiRequest(`/users/${id}/`, {
        method: "PATCH",
        body: JSON.stringify({
          full_name: fullName,
          phone: phone,
          email: email || null,
          user_category: category,
          is_active: isActive,
        }),
      });

      const data = await res.json();

      if (res.status === 200) {
        setEditSuccess("User details updated successfully!");
        setUser(data);
      } else {
        setEditError(
          data.full_name?.[0] ||
            data.phone?.[0] ||
            data.email?.[0] ||
            data.detail ||
            "Failed to update user details."
        );
      }
    } catch (err: any) {
      setEditError(err.message || "An error occurred.");
    } finally {
      setUpdating(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setResetError("Password must be at least 6 characters.");
      return;
    }

    setResetError(null);
    setResetSuccess(null);
    setResetting(true);

    try {
      const res = await apiRequest(`/users/${id}/reset-password/`, {
        method: "POST",
        body: JSON.stringify({
          new_password: newPassword,
        }),
      });

      const data = await res.json();

      if (res.status === 200) {
        setResetSuccess("Password reset successfully! Temporary flag has been reactivated.");
        setNewPassword("");
      } else {
        setResetError(data.new_password?.[0] || data.detail || "Failed to reset password.");
      }
    } catch (err: any) {
      setResetError(err.message || "An error occurred.");
    } finally {
      setResetting(false);
    }
  };

  if (loading) {
    return (
      <div className="shell users-shell">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading user details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="shell users-shell">
      <div className="panel detail-panel">
        <div className="header-zone">
          <div>
            <p className="eyebrow">Administration</p>
            <h2 className="title">Manage Account</h2>
            <p className="subtitle">
              Username: <span className="highlight-text">{user?.username}</span> | Internal Anchor: ID #{user?.id}
            </p>
          </div>
          <Link href="/users" className="btn-back">
            ← Directory
          </Link>
        </div>

        <div className="settings-grid">
          {/* Main Account Settings */}
          <div className="settings-card">
            <h3>Account Settings</h3>
            
            {editError && (
              <div className="alert alert-error">
                <span className="alert-icon">⚠️</span>
                <span className="alert-message">{editError}</span>
              </div>
            )}

            {editSuccess && (
              <div className="alert alert-success">
                <span className="alert-icon">✅</span>
                <span className="alert-message">{editSuccess}</span>
              </div>
            )}

            <form onSubmit={handleUpdate} className="profile-form">
              <div className="form-group">
                <label htmlFor="fullName">Full Name</label>
                <input
                  type="text"
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter full name"
                  disabled={updating}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="phone">Contact Phone</label>
                  <input
                    type="tel"
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Enter phone number"
                    disabled={updating}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="category">Category</label>
                  <select
                    id="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    disabled={updating}
                  >
                    <option value="RESIDENT">Resident</option>
                    <option value="SUPERVISOR">Supervisor</option>
                    <option value="SUPPORT_STAFF">Support Staff</option>
                    <option value="UTRMC_ADMIN">UTRMC Admin</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email address"
                  disabled={updating}
                />
              </div>

              <div className="form-group checkbox-group">
                <label className="switch-container">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    disabled={updating}
                  />
                  <span className="switch-label">Enable User Account (is_active)</span>
                </label>
                <p className="field-hint">Disabled users cannot sign in to the platform.</p>
              </div>

              <button type="submit" className="btn-submit" disabled={updating}>
                {updating ? "Saving..." : "Save Account Settings"}
              </button>
            </form>
          </div>

          {/* Administrative Password Reset */}
          <div className="settings-card reset-card">
            <h3>Force Password Reset</h3>
            <p className="card-hint">
              Assign a new password to this user. They will be forced to change it on their next login (must_change_password=True).
            </p>

            {resetError && (
              <div className="alert alert-error">
                <span className="alert-icon">⚠️</span>
                <span className="alert-message">{resetError}</span>
              </div>
            )}

            {resetSuccess && (
              <div className="alert alert-success">
                <span className="alert-icon">✅</span>
                <span className="alert-message">{resetSuccess}</span>
              </div>
            )}

            <form onSubmit={handleResetPassword} className="profile-form">
              <div className="form-group">
                <label htmlFor="newPassword">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new temporary password"
                  disabled={resetting}
                  required
                />
              </div>

              <button type="submit" className="btn-reset" disabled={resetting}>
                {resetting ? "Resetting..." : "Reset User Password"}
              </button>
            </form>
          </div>
        </div>
      </div>

      <style jsx>{`
        .users-shell {
          padding-top: 2rem;
          place-items: start center;
        }
        .detail-panel {
          width: min(840px, 100%);
          border-radius: 24px;
        }
        .header-zone {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1.5rem;
          margin-bottom: 2.5rem;
          flex-wrap: wrap;
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
        .highlight-text {
          color: var(--accent);
          font-weight: 700;
        }
        .btn-back {
          text-decoration: none;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--border);
          color: var(--muted);
          padding: 0.65rem 1.25rem;
          border-radius: 12px;
          font-size: 0.85rem;
          font-weight: 700;
          transition: all 0.2s ease;
        }
        .btn-back:hover {
          background: var(--bg-soft);
          color: var(--text);
        }
        .settings-grid {
          display: flex;
          flex-direction: column;
          gap: 2.5rem;
        }
        .settings-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 2rem;
        }
        .settings-card h3 {
          margin: 0 0 1.5rem;
          font-size: 1.25rem;
          font-weight: 700;
          letter-spacing: -0.02em;
          border-bottom: 1px solid var(--border);
          padding-bottom: 0.75rem;
        }
        .card-hint {
          font-size: 0.85rem;
          color: var(--muted);
          margin: 0 0 1.5rem;
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
        .profile-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .form-row {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.25rem;
        }
        @media (min-width: 640px) {
          .form-row {
            grid-template-columns: 1fr 1fr;
          }
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
        .form-group input,
        .form-group select {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid var(--border);
          color: var(--text);
          padding: 0.75rem 1rem;
          border-radius: 12px;
          font-size: 0.95rem;
          outline: none;
          transition: all 0.2s ease;
          width: 100%;
        }
        .form-group select option {
          background: #0a1020;
          color: var(--text);
        }
        .form-group input:focus,
        .form-group select:focus {
          border-color: var(--accent);
          background: rgba(255, 255, 255, 0.06);
          box-shadow: 0 0 0 4px rgba(143, 211, 255, 0.15);
        }
        .checkbox-group {
          padding: 0.5rem 0;
        }
        .switch-container {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          cursor: pointer;
          font-weight: 600;
          font-size: 0.9rem;
        }
        .switch-container input {
          width: auto;
          margin: 0;
          cursor: pointer;
          transform: scale(1.15);
        }
        .field-hint {
          font-size: 0.75rem;
          color: var(--muted);
          margin: 0.25rem 0 0;
        }
        .btn-submit {
          background: var(--text);
          color: var(--bg);
          border: none;
          padding: 0.85rem 1.5rem;
          border-radius: 12px;
          font-size: 0.9rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
          align-self: flex-start;
        }
        .btn-submit:hover:not(:disabled) {
          background: var(--accent-strong);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(143, 211, 255, 0.2);
        }
        .btn-reset {
          background: rgba(255, 100, 100, 0.1);
          border: 1px solid rgba(255, 100, 100, 0.25);
          color: #ff8888;
          padding: 0.85rem 1.5rem;
          border-radius: 12px;
          font-size: 0.9rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
          align-self: flex-start;
        }
        .btn-reset:hover:not(:disabled) {
          background: rgba(255, 100, 100, 0.2);
          border-color: rgba(255, 100, 100, 0.45);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(255, 100, 100, 0.15);
        }
        .spinner {
          width: 2rem;
          height: 2rem;
          border: 3px solid rgba(255, 255, 255, 0.1);
          border-top-color: var(--accent);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin: 0 auto 1rem;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .loading-state {
          padding: 5rem 0;
          text-align: center;
          color: var(--muted);
          width: 100%;
        }
      `}</style>
    </div>
  );
}
