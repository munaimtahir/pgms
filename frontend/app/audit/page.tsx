"use client";

import React, { useState, useEffect } from "react";
import { apiRequest } from "../../lib/api";

interface AuditLog {
  id: number;
  actor_username: string | null;
  actor_category: string | null;
  action: string;
  target_model: string;
  target_id: string;
  before: Record<string, any> | null;
  after: Record<string, any> | null;
  metadata: Record<string, any>;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await apiRequest("/audit/");
      const data = await res.json();
      if (res.status === 200) {
        setLogs(data);
      } else {
        setError(data.detail || "Failed to load system audit trail.");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "medium",
    });
  };

  return (
    <div className="shell audit-shell">
      <div className="panel audit-panel">
        <div className="header-zone">
          <p className="eyebrow">Administration</p>
          <h2 className="title">System Audit Trail</h2>
          <p className="subtitle">Real-time append-only security logs for user authentication and state changes.</p>
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
            <p>Loading audit trail...</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="audit-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Actor</th>
                  <th>Action</th>
                  <th>Target</th>
                  <th>IP Address</th>
                  <th>Context Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="empty-row">
                      No audit logs recorded yet.
                    </td>
                  </tr>
                ) : (
                  logs.map((l) => (
                    <tr key={l.id}>
                      <td className="time-col">{formatTimestamp(l.created_at)}</td>
                      <td>
                        <div className="actor-info">
                          <span className="actor-name">{l.actor_username || "System"}</span>
                          {l.actor_category && (
                            <span className="actor-role">{l.actor_category.replace("_", " ")}</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={`action-badge badge-${l.action.toLowerCase()}`}>
                          {l.action.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td>
                        {l.target_model ? (
                          <div className="target-info">
                            <span className="target-model">{l.target_model.split(".").pop()}</span>
                            <span className="target-id">ID #{l.target_id}</span>
                          </div>
                        ) : (
                          <span className="muted-text">—</span>
                        )}
                      </td>
                      <td className="ip-col">{l.ip_address || "N/A"}</td>
                      <td className="meta-col">
                        {l.metadata && Object.keys(l.metadata).length > 0 ? (
                          <pre className="meta-block">{JSON.stringify(l.metadata, null, 2)}</pre>
                        ) : l.before || l.after ? (
                          <div className="diff-indicator">
                            State changes recorded ({l.before ? "Before" : "None"} → {l.after ? "After" : "None"})
                          </div>
                        ) : (
                          <span className="muted-text">—</span>
                        )}
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
        .audit-shell {
          padding-top: 2rem;
          place-items: start center;
        }
        .audit-panel {
          width: min(1100px, 100%);
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
        .audit-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
          font-size: 0.85rem;
        }
        .audit-table th {
          background: rgba(255, 255, 255, 0.03);
          border-bottom: 1px solid var(--border);
          padding: 1rem;
          font-weight: 600;
          color: var(--text);
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .audit-table td {
          border-bottom: 1px solid var(--border);
          padding: 1rem;
          color: var(--muted);
          vertical-align: top;
        }
        .audit-table tr:last-child td {
          border-bottom: none;
        }
        .audit-table tr:hover td {
          background: rgba(255, 255, 255, 0.01);
        }
        .time-col {
          white-space: nowrap;
          color: var(--text);
        }
        .actor-info {
          display: flex;
          flex-direction: column;
          line-height: 1.3;
        }
        .actor-name {
          font-weight: 600;
          color: var(--text);
        }
        .actor-role {
          font-size: 0.7rem;
          color: var(--accent);
          font-weight: 500;
        }
        .ip-col {
          font-family: monospace;
          color: var(--muted);
        }
        .target-info {
          display: flex;
          flex-direction: column;
          line-height: 1.3;
        }
        .target-model {
          font-weight: 600;
          color: var(--text);
        }
        .target-id {
          font-family: monospace;
          font-size: 0.75rem;
          color: var(--muted);
        }
        .action-badge {
          display: inline-block;
          font-size: 0.7rem;
          font-weight: 700;
          padding: 0.15rem 0.4rem;
          border-radius: 6px;
          text-transform: uppercase;
          letter-spacing: 0.03em;
          white-space: nowrap;
        }
        /* Color badges based on action type group */
        .badge-login_success {
          background: rgba(34, 197, 94, 0.1);
          color: #86efac;
          border: 1px solid rgba(34, 197, 94, 0.2);
        }
        .badge-login_failed {
          background: rgba(239, 68, 68, 0.1);
          color: #fca5a5;
          border: 1px solid rgba(239, 68, 68, 0.2);
        }
        .badge-logout {
          background: rgba(255, 255, 255, 0.05);
          color: var(--muted);
          border: 1px solid var(--border);
        }
        .badge-user_created {
          background: rgba(59, 130, 246, 0.1);
          color: #93c5fd;
          border: 1px solid rgba(59, 130, 246, 0.2);
        }
        .badge-user_deactivated {
          background: rgba(249, 115, 22, 0.1);
          color: #fdba74;
          border: 1px solid rgba(249, 115, 22, 0.2);
        }
        .badge-user_activated, .badge-profile_completed, .badge-password_changed {
          background: rgba(16, 185, 129, 0.1);
          color: #6ee7b7;
          border: 1px solid rgba(16, 185, 129, 0.2);
        }
        .meta-col {
          max-width: 320px;
        }
        .meta-block {
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 0.5rem;
          margin: 0;
          font-family: monospace;
          font-size: 0.72rem;
          color: var(--accent);
          white-space: pre-wrap;
          word-break: break-all;
        }
        .diff-indicator {
          font-size: 0.75rem;
          color: var(--accent);
          font-weight: 500;
        }
        .muted-text {
          color: rgba(245, 247, 255, 0.3);
        }
        .empty-row {
          text-align: center;
          padding: 3rem;
          color: rgba(245, 247, 255, 0.35);
        }
      `}</style>
    </div>
  );
}
