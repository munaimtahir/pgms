"use client";

import { useEffect, useState } from "react";

export default function HealthPage() {
  const [backendStatus, setBackendStatus] = useState<string>("checking...");
  const [backendBrick, setBackendBrick] = useState<string>("N/A");

  useEffect(() => {
    fetch("/api/health/")
      .then((res) => res.json())
      .then((data) => {
        setBackendStatus(data.status === "ok" ? "Connected" : "Error");
        setBackendBrick(data.brick || "N/A");
      })
      .catch(() => {
        setBackendStatus("Disconnected / Unavailable");
      });
  }, []);

  return (
    <main className="shell">
      <section className="panel health-panel">
        <p className="eyebrow">System Status</p>
        <h1>Health Check</h1>
        
        <div className="status-grid">
          <div className="status-item">
            <span className="status-label">Next.js Frontend</span>
            <span className="status-value status-ok">OK (Brick 1)</span>
          </div>

          <div className="status-item">
            <span className="status-label">Django Backend</span>
            <span className="status-value">
              {backendStatus.includes("Connected") ? (
                <span className="status-ok">CONNECTED (Brick {backendBrick})</span>
              ) : (
                <span className="status-err">{backendStatus}</span>
              )}
            </span>
          </div>
        </div>
      </section>

      <style jsx>{`
        .health-panel {
          max-width: 540px;
          border-radius: 24px;
        }
        .status-grid {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          margin-top: 2rem;
          border-top: 1px solid var(--border);
          padding-top: 1.5rem;
        }
        .status-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--border);
          padding: 0.85rem 1.25rem;
          border-radius: 12px;
        }
        .status-label {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--muted);
        }
        .status-value {
          font-size: 0.9rem;
          font-weight: 700;
        }
        .status-ok {
          color: #22c55e;
          text-shadow: 0 0 10px rgba(34, 197, 94, 0.2);
        }
        .status-err {
          color: #ef4444;
          text-shadow: 0 0 10px rgba(239, 68, 68, 0.2);
        }
      `}</style>
    </main>
  );
}
