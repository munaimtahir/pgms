"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { apiRequest, User } from "../../lib/api";

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await apiRequest("/users/");
      const data = await res.json();
      if (res.status === 200) {
        setUsers(data);
      } else {
        setError(data.detail || "Failed to load user directory.");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="shell users-shell">
      <div className="panel directory-panel">
        <div className="header-zone">
          <div className="title-area">
            <p className="eyebrow">Administration</p>
            <h2 className="title">User Accounts</h2>
            <p className="subtitle">List, view, and manage PGMS users and roles.</p>
          </div>
          <Link href="/users/new" className="btn-create">
            + New User
          </Link>
        </div>

        {error && (
          <div className="alert alert-error">
            <span className="alert-icon">⚠️</span>
            <span className="alert-message">{error}</span>
          </div>
        )}

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading user list...</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="user-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Username</th>
                  <th>Full Name</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Completed</th>
                  <th className="actions-header">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="empty-row">
                      No users found.
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id}>
                      <td className="id-col">#{u.id}</td>
                      <td className="username-col">{u.username}</td>
                      <td>{u.full_name || <span className="muted-text">—</span>}</td>
                      <td>
                        <span className={`role-badge badge-${u.user_category.toLowerCase()}`}>
                          {u.user_category.replace("_", " ")}
                        </span>
                      </td>
                      <td>
                        <span className={u.extra_data?.is_active !== false ? "status-dot active-dot" : "status-dot inactive-dot"}></span>
                        {u.extra_data?.is_active !== false ? "Active" : "Disabled"}
                      </td>
                      <td>
                        <span className={`completion-badge ${u.is_profile_complete ? "complete" : "incomplete"}`}>
                          {u.is_profile_complete ? "Yes" : "No"}
                        </span>
                      </td>
                      <td className="actions-cell">
                        <Link href={`/users/${u.id}`} className="btn-edit">
                          Edit
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style jsx>{`
        .users-shell {
          padding-top: 2rem;
          place-items: start center;
        }
        .directory-panel {
          width: min(1000px, 100%);
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
        .btn-create {
          background: var(--text);
          color: var(--bg);
          text-decoration: none;
          padding: 0.75rem 1.5rem;
          border-radius: 12px;
          font-size: 0.9rem;
          font-weight: 700;
          transition: all 0.2s ease;
        }
        .btn-create:hover {
          background: var(--accent-strong);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(143, 211, 255, 0.2);
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
        .loading-state {
          padding: 3rem 0;
          text-align: center;
          color: var(--muted);
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
        .table-responsive {
          width: 100%;
          overflow-x: auto;
          border: 1px solid var(--border);
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.01);
        }
        .user-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
          font-size: 0.9rem;
        }
        .user-table th {
          background: rgba(255, 255, 255, 0.03);
          border-bottom: 1px solid var(--border);
          padding: 1rem;
          font-weight: 600;
          color: var(--text);
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .user-table td {
          border-bottom: 1px solid var(--border);
          padding: 1rem;
          color: var(--muted);
          vertical-align: middle;
        }
        .user-table tr:last-child td {
          border-bottom: none;
        }
        .user-table tr:hover td {
          background: rgba(255, 255, 255, 0.01);
        }
        .id-col {
          font-family: monospace;
          color: var(--muted);
          font-weight: 500;
        }
        .username-col {
          color: var(--text);
          font-weight: 600;
        }
        .muted-text {
          color: rgba(245, 247, 255, 0.3);
        }
        .role-badge {
          display: inline-block;
          font-size: 0.72rem;
          font-weight: 700;
          padding: 0.2rem 0.5rem;
          border-radius: 6px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .badge-utrmc_admin {
          background: rgba(143, 211, 255, 0.1);
          color: var(--accent);
          border: 1px solid rgba(143, 211, 255, 0.2);
        }
        .badge-resident {
          background: rgba(168, 85, 247, 0.1);
          color: #d8b4fe;
          border: 1px solid rgba(168, 85, 247, 0.2);
        }
        .badge-supervisor {
          background: rgba(34, 197, 94, 0.1);
          color: #86efac;
          border: 1px solid rgba(34, 197, 94, 0.2);
        }
        .badge-support_staff {
          background: rgba(234, 179, 8, 0.1);
          color: #fde047;
          border: 1px solid rgba(234, 179, 8, 0.2);
        }
        .status-dot {
          display: inline-block;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          margin-right: 6px;
        }
        .active-dot {
          background: #22c55e;
          box-shadow: 0 0 8px #22c55e;
        }
        .inactive-dot {
          background: #ef4444;
          box-shadow: 0 0 8px #ef4444;
        }
        .completion-badge {
          font-size: 0.75rem;
          font-weight: 600;
        }
        .completion-badge.complete {
          color: #4ade80;
        }
        .completion-badge.incomplete {
          color: rgba(245, 247, 255, 0.35);
        }
        .empty-row {
          text-align: center;
          padding: 3rem;
          color: rgba(245, 247, 255, 0.35);
        }
        .actions-header {
          text-align: right;
        }
        .actions-cell {
          text-align: right;
        }
        .btn-edit {
          display: inline-block;
          text-decoration: none;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--border);
          color: var(--text);
          padding: 0.35rem 0.75rem;
          border-radius: 8px;
          font-size: 0.8rem;
          font-weight: 600;
          transition: all 0.2s ease;
        }
        .btn-edit:hover {
          background: var(--bg-soft);
          border-color: var(--accent);
          color: var(--accent);
        }
      `}</style>
    </div>
  );
}
