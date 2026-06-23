"use client";

import Link from "next/link";
import { useAuth } from "./context";

export default function HomePage() {
  const { user } = useAuth();

  if (!user) {
    return (
      <main className="shell">
        <section className="hero">
          <p className="eyebrow">PGMS</p>
          <h1>Postgraduate Management System</h1>
          <p className="lead">Initializing authentication check...</p>
        </section>
      </main>
    );
  }

  const isAdmin = user.user_category === "UTRMC_ADMIN";

  return (
    <main className="shell welcome-shell">
      <section className="hero welcome-card">
        <p className="eyebrow">Institutional Portal</p>
        <h1>Welcome to PGMS</h1>
        <p className="lead">Postgraduate Resident & Supervisor Management System</p>
        
        <div className="welcome-meta">
          <p className="user-greeting">
            Signed in as: <strong className="user-highlight">{user.full_name || user.username}</strong>
          </p>
          <span className="role-tag">{user.user_category.replace("_", " ")}</span>
        </div>

        <p className="copy">
          This system monitors training timelines, rotations, and supervisors across departments. Under Brick 1 guidelines, you can currently access and manage user credentials, roles, and administrative logs.
        </p>

        <div className="action-links">
          {isAdmin ? (
            <>
              <Link href="/users" className="btn-primary">
                Manage Users
              </Link>
              <Link href="/audit" className="btn-secondary">
                Audit Trail
              </Link>
            </>
          ) : (
            <Link href="/account" className="btn-primary">
              View Profile
            </Link>
          )}
        </div>
      </section>

      <style jsx>{`
        .welcome-shell {
          padding-top: 3rem;
        }
        .welcome-card {
          max-width: 680px;
          border-radius: 28px;
        }
        .welcome-meta {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-top: 1.5rem;
          flex-wrap: wrap;
        }
        .user-greeting {
          margin: 0;
          font-size: 1.05rem;
          color: var(--accent-strong);
        }
        .user-highlight {
          color: var(--text);
        }
        .role-tag {
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          background: rgba(143, 211, 255, 0.1);
          color: var(--accent);
          border: 1px solid rgba(143, 211, 255, 0.2);
          padding: 0.2rem 0.6rem;
          border-radius: 6px;
          text-transform: uppercase;
        }
        .copy {
          max-width: 100%;
          margin: 1.5rem 0 2rem;
          font-size: 0.95rem;
          line-height: 1.6;
        }
        .action-links {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
        }
        .btn-primary {
          background: var(--text);
          color: var(--bg);
          text-decoration: none;
          padding: 0.85rem 1.75rem;
          border-radius: 12px;
          font-size: 0.95rem;
          font-weight: 700;
          transition: all 0.2s ease;
        }
        .btn-primary:hover {
          background: var(--accent-strong);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(143, 211, 255, 0.2);
        }
        .btn-secondary {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--border);
          color: var(--muted);
          text-decoration: none;
          padding: 0.85rem 1.75rem;
          border-radius: 12px;
          font-size: 0.95rem;
          font-weight: 700;
          transition: all 0.2s ease;
        }
        .btn-secondary:hover {
          background: var(--bg-soft);
          color: var(--text);
        }
      `}</style>
    </main>
  );
}
