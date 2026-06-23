"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../app/context";

export default function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  if (!user) return null;

  const isRestricted = user.must_change_password || !user.is_profile_complete;

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link href="/" className="nav-brand">
          PGMS <span className="nav-version">v1.0</span>
        </Link>

        {!isRestricted && (
          <div className="nav-links">
            {(user.user_category === "UTRMC_ADMIN" || user.user_category === "SUPPORT_STAFF") && (
              <>
                <Link href="/residents" className={pathname.startsWith("/residents") ? "active" : ""}>
                  Residents
                </Link>
                <Link href="/supervisors" className={pathname.startsWith("/supervisors") ? "active" : ""}>
                  Supervisors
                </Link>
              </>
            )}
            {user.user_category === "UTRMC_ADMIN" ? (
              <>
                <Link href="/users" className={pathname === "/users" ? "active" : ""}>
                  Users
                </Link>
                <Link href="/audit" className={pathname === "/audit" ? "active" : ""}>
                  Audit Trail
                </Link>
              </>
            ) : null}
            <Link href="/account" className={pathname === "/account" ? "active" : ""}>
              My Account
            </Link>
          </div>
        )}

        <div className="nav-user">
          <span className="user-info">
            <span className="user-name">{user.full_name || user.username}</span>
            <span className="user-role">{user.user_category.replace("_", " ")}</span>
          </span>
          <button onClick={logout} className="btn-logout">
            Logout
          </button>
        </div>
      </div>

      <style jsx>{`
        .navbar {
          border-bottom: 1px solid var(--border);
          background: rgba(10, 16, 32, 0.7);
          backdrop-filter: blur(12px);
          position: sticky;
          top: 0;
          z-index: 100;
          padding: 0.75rem 1.5rem;
        }
        .nav-container {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1.5rem;
        }
        .nav-brand {
          font-weight: 800;
          font-size: 1.25rem;
          color: var(--text);
          text-decoration: none;
          letter-spacing: -0.02em;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .nav-version {
          font-size: 0.7rem;
          background: var(--bg-soft);
          border: 1px solid var(--border);
          padding: 0.15rem 0.4rem;
          border-radius: 6px;
          color: var(--accent);
          font-weight: 500;
        }
        .nav-links {
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }
        .nav-links :global(a) {
          text-decoration: none;
          font-size: 0.9rem;
          font-weight: 500;
          color: var(--muted);
          transition: color 0.2s ease;
          padding: 0.5rem 0;
          position: relative;
        }
        .nav-links :global(a:hover) {
          color: var(--text);
        }
        .nav-links :global(a.active) {
          color: var(--accent);
        }
        .nav-links :global(a.active::after) {
          content: "";
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: var(--accent);
          border-radius: 2px;
        }
        .nav-user {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .user-info {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          line-height: 1.2;
        }
        .user-name {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text);
        }
        .user-role {
          font-size: 0.7rem;
          color: var(--accent);
          font-weight: 500;
          letter-spacing: 0.05em;
        }
        .btn-logout {
          background: rgba(255, 100, 100, 0.1);
          border: 1px solid rgba(255, 100, 100, 0.2);
          color: #ff8888;
          padding: 0.4rem 0.8rem;
          border-radius: 8px;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .btn-logout:hover {
          background: rgba(255, 100, 100, 0.2);
          border-color: rgba(255, 100, 100, 0.4);
          color: #ff9999;
          transform: translateY(-1px);
        }
      `}</style>
    </nav>
  );
}
