"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiRequest } from "../../../lib/api";

export default function NewUserPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [category, setCategory] = useState("SUPPORT_STAFF");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username) {
      setError("Username is required.");
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const res = await apiRequest("/users/", {
        method: "POST",
        body: JSON.stringify({
          username,
          email: email || null,
          full_name: fullName,
          phone,
          user_category: category,
        }),
      });

      const data = await res.json();

      if (res.status === 201) {
        router.push("/users");
      } else {
        setError(
          data.username?.[0] ||
            data.email?.[0] ||
            data.detail ||
            "Failed to create user. Please check inputs."
        );
      }
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="shell users-shell">
      <div className="panel create-user-panel">
        <div className="header-zone">
          <p className="eyebrow">Administration</p>
          <h2 className="title">Create User Account</h2>
          <p className="subtitle">Add a new resident, supervisor, support, or admin account.</p>
        </div>

        {error && (
          <div className="alert alert-error">
            <span className="alert-icon">⚠️</span>
            <span className="alert-message">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="user-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="category">User Category / Role</label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={submitting}
              >
                <option value="SUPPORT_STAFF">Support Staff</option>
                <option value="UTRMC_ADMIN">UTRMC Admin</option>
                <option value="RESIDENT">Resident</option>
                <option value="SUPERVISOR">Supervisor</option>
              </select>
            </div>

            {(category === "RESIDENT" || category === "SUPERVISOR") ? null : (
              <div className="form-group">
                <label htmlFor="username">Username (Login ID)</label>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. support.john"
                  disabled={submitting}
                  required
                />
                <p className="field-hint">Initial temporary password matches the username.</p>
              </div>
            )}
          </div>

          {(category === "RESIDENT" || category === "SUPERVISOR") ? (
            <div className="redirect-box">
              <span className="redirect-icon">💡</span>
              <div className="redirect-content">
                <p><strong>Note:</strong> {category === "RESIDENT" ? "Resident" : "Supervisor"} accounts cannot be created here. They must be provisioned alongside their profile details through the dedicated directories.</p>
                <Link href={category === "RESIDENT" ? "/residents/new" : "/supervisors/new"} className="btn-redirect">
                  Go to {category === "RESIDENT" ? "Resident" : "Supervisor"} Creation Flow
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="fullName">Full Name</label>
                  <input
                    type="text"
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. John Doe (Optional)"
                    disabled={submitting}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="phone">Contact Phone</label>
                  <input
                    type="tel"
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 03001234567 (Optional)"
                    disabled={submitting}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. user@institution.edu (Optional)"
                  disabled={submitting}
                />
                <p className="field-hint">If left empty, the user must specify a unique email during first-login profile completion.</p>
              </div>

              <div className="actions-bar">
                <Link href="/users" className="btn-cancel">
                  Cancel
                </Link>
                <button type="submit" className="btn-submit" disabled={submitting}>
                  {submitting ? "Creating Account..." : "Create Account"}
                </button>
              </div>
            </>
          )}
        </form>
      </div>

      <style jsx>{`
        .users-shell {
          padding-top: 2rem;
          place-items: start center;
        }
        .create-user-panel {
          width: min(720px, 100%);
          border-radius: 24px;
        }
        .header-zone {
          margin-bottom: 2rem;
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
        .alert {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem;
          border-radius: 12px;
          margin-bottom: 1.5rem;
          background: rgba(255, 100, 100, 0.08);
          border: 1px solid rgba(255, 100, 100, 0.2);
          color: #ff9999;
          font-size: 0.85rem;
        }
        .user-form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .form-row {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.5rem;
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
        .form-group input::placeholder {
          color: rgba(245, 247, 255, 0.35);
        }
        .field-hint {
          font-size: 0.75rem;
          color: var(--muted);
          margin: 0;
          margin-top: 0.15rem;
          line-height: 1.3;
        }
        .actions-bar {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 1rem;
          margin-top: 1rem;
          border-top: 1px solid var(--border);
          padding-top: 1.5rem;
        }
        .btn-cancel {
          text-decoration: none;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--border);
          color: var(--muted);
          padding: 0.75rem 1.5rem;
          border-radius: 12px;
          font-size: 0.9rem;
          font-weight: 700;
          transition: all 0.2s ease;
        }
        .btn-cancel:hover {
          background: var(--bg-soft);
          color: var(--text);
        }
        .btn-submit {
          background: var(--text);
          color: var(--bg);
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 12px;
          font-size: 0.9rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
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
        .redirect-box {
          background: rgba(143, 211, 255, 0.05);
          border: 1px solid rgba(143, 211, 255, 0.2);
          border-radius: 16px;
          padding: 1.5rem;
          display: flex;
          gap: 1rem;
          align-items: flex-start;
          backdrop-filter: blur(8px);
        }
        .redirect-icon {
          font-size: 1.5rem;
        }
        .redirect-content p {
          margin: 0 0 1rem;
          font-size: 0.95rem;
          color: var(--muted);
          line-height: 1.5;
        }
        .btn-redirect {
          display: inline-block;
          text-decoration: none;
          background: var(--text);
          color: var(--bg);
          padding: 0.65rem 1.25rem;
          border-radius: 10px;
          font-size: 0.85rem;
          font-weight: 700;
          transition: all 0.2s ease;
        }
        .btn-redirect:hover {
          background: var(--accent-strong);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(143, 211, 255, 0.2);
        }
      `}</style>
    </div>
  );
}
