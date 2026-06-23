"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { apiRequest, ResidentProfile } from "../../lib/api";
import { useAuth } from "../context";

export default function ResidentsDirectoryPage() {
  const { user } = useAuth();
  const [residents, setResidents] = useState<ResidentProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters state
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [programFilter, setProgramFilter] = useState("");
  const [institutionFilter, setInstitutionFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [hospitalFilter, setHospitalFilter] = useState("");
  const [sessionFilter, setSessionFilter] = useState("");
  const [trainingYearFilter, setTrainingYearFilter] = useState("");
  const [archivedFilter, setArchivedFilter] = useState("false");

  // Options state
  const [options, setOptions] = useState<{
    institutions: any[];
    hospitals: any[];
    departments: any[];
    programs: any[];
    academic_sessions: any[];
  }>({
    institutions: [],
    hospitals: [],
    departments: [],
    programs: [],
    academic_sessions: [],
  });

  useEffect(() => {
    async function loadOptions() {
      try {
        const res = await apiRequest("/identity/options/");
        const data = await res.json();
        if (res.status === 200) {
          setOptions(data);
        }
      } catch (err) {
        console.error("Failed to load options", err);
      }
    }
    loadOptions();
  }, []);

  useEffect(() => {
    fetchResidents();
  }, [
    statusFilter,
    programFilter,
    institutionFilter,
    departmentFilter,
    hospitalFilter,
    sessionFilter,
    trainingYearFilter,
    archivedFilter,
  ]);

  const fetchResidents = async (searchVal?: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      
      const querySearch = typeof searchVal === "string" ? searchVal : search;
      if (querySearch) params.append("search", querySearch);
      
      if (statusFilter) params.append("current_status", statusFilter);
      if (programFilter) params.append("program", programFilter);
      if (institutionFilter) params.append("institution", institutionFilter);
      if (departmentFilter) params.append("department", departmentFilter);
      if (hospitalFilter) params.append("hospital", hospitalFilter);
      if (sessionFilter) params.append("session", sessionFilter);
      if (trainingYearFilter) params.append("training_year", trainingYearFilter);
      
      if (user?.user_category === "UTRMC_ADMIN" || user?.user_category === "SUPPORT_STAFF") {
        params.append("is_archived", archivedFilter);
      }

      const res = await apiRequest(`/residents/?${params.toString()}`);
      const data = await res.json();
      if (res.status === 200) {
        setResidents(data);
      } else {
        setError(data.detail || "Failed to load resident directory.");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchResidents();
  };

  const handleArchiveToggle = async (profile: ResidentProfile) => {
    if (user?.user_category !== "UTRMC_ADMIN") return;
    
    const confirmMsg = profile.is_archived
      ? `Are you sure you want to restore/unarchive resident ${profile.user.full_name}?`
      : `Are you sure you want to archive resident ${profile.user.full_name}? This will also disable their user login.`;
      
    if (!confirm(confirmMsg)) return;

    try {
      let res;
      if (profile.is_archived) {
        res = await apiRequest(`/residents/${profile.id}/unarchive/`, { method: "POST" });
      } else {
        res = await apiRequest(`/residents/${profile.id}/`, { method: "DELETE" });
      }

      if (res.status === 200) {
        fetchResidents();
      } else {
        const data = await res.json();
        alert(data.detail || "Action failed.");
      }
    } catch (err: any) {
      alert(err.message || "An error occurred.");
    }
  };

  const canCreateOrEdit = user?.user_category === "UTRMC_ADMIN" || user?.user_category === "SUPPORT_STAFF";
  const isAdmin = user?.user_category === "UTRMC_ADMIN";

  return (
    <div className="shell residents-shell">
      <div className="panel directory-panel">
        <div className="header-zone">
          <div className="title-area">
            <p className="eyebrow">Directory</p>
            <h2 className="title">Resident Directory</h2>
            <p className="subtitle">Search and manage postgraduate resident profiles.</p>
          </div>
          {canCreateOrEdit && (
            <Link href="/residents/new" className="btn-create">
              + New Resident
            </Link>
          )}
        </div>

        {/* Filter Toolbar */}
        <div className="filter-toolbar">
          <form onSubmit={handleSearchSubmit} className="search-form">
            <input
              type="text"
              placeholder="Search Name, Username, CNIC, PMDC..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
            />
            <button type="submit" className="btn-search">Search</button>
          </form>

          <div className="filters-grid">
            <div className="filter-group">
              <label>Status</label>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="ON_LEAVE">On Leave</option>
                <option value="TRANSFERRED">Transferred</option>
                <option value="COMPLETED">Completed</option>
                <option value="DROPPED">Dropped</option>
                <option value="SUSPENDED">Suspended</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Hospital</label>
              <select value={hospitalFilter} onChange={(e) => setHospitalFilter(e.target.value)}>
                <option value="">All Hospitals</option>
                {options.hospitals.map((h) => (
                  <option key={h.id} value={h.id}>{h.name}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Department / Discipline</label>
              <select value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)}>
                <option value="">All Depts</option>
                {options.departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Program</label>
              <select value={programFilter} onChange={(e) => setProgramFilter(e.target.value)}>
                <option value="">All Programs</option>
                {options.programs.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Session</label>
              <select value={sessionFilter} onChange={(e) => setSessionFilter(e.target.value)}>
                <option value="">All Sessions</option>
                {options.academic_sessions.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Institution / Awarding Body</label>
              <select value={institutionFilter} onChange={(e) => setInstitutionFilter(e.target.value)}>
                <option value="">All Institutions</option>
                {options.institutions.map((i) => (
                  <option key={i.id} value={i.id}>{i.name}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Training Year</label>
              <input
                type="text"
                placeholder="e.g. 1"
                value={trainingYearFilter}
                onChange={(e) => setTrainingYearFilter(e.target.value)}
              />
            </div>

            {isAdmin && (
              <div className="filter-group">
                <label>Archive Scope</label>
                <select value={archivedFilter} onChange={(e) => setArchivedFilter(e.target.value)}>
                  <option value="false">Active Only</option>
                  <option value="true">Archived Only</option>
                </select>
              </div>
            )}
          </div>
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
            <p>Loading resident database...</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="directory-table">
              <thead>
                <tr>
                  <th>Resident</th>
                  <th>PMDC</th>
                  <th>Program / Session</th>
                  <th>Hospital & Dept</th>
                  <th>Identity</th>
                  <th>Status</th>
                  {canCreateOrEdit && <th className="actions-header">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {residents.length === 0 ? (
                  <tr>
                    <td colSpan={canCreateOrEdit ? 7 : 6} className="empty-row">
                      No residents matching the criteria found.
                    </td>
                  </tr>
                ) : (
                  residents.map((r) => (
                    <tr key={r.id} className={r.is_archived ? "row-archived" : ""}>
                      <td className="resident-col">
                        <div className="res-details">
                          <span className="res-name">{r.user.full_name || r.user.username}</span>
                          <span className="res-username">@{r.user.username}</span>
                        </div>
                      </td>
                      <td className="pmdc-col">{r.pmdc_number || <span className="muted-text">—</span>}</td>
                      <td>
                        <div className="res-details">
                          <span className="res-program">{r.program_ref_detail?.name || r.program_name || "N/A"}</span>
                          <span className="res-specialty">{r.academic_session_ref_detail?.name || r.session_year || "N/A"}</span>
                        </div>
                      </td>
                      <td>
                        <div className="res-details">
                          <span className="res-inst">{r.training_site_ref_detail?.name || r.institution_name || "N/A"}</span>
                          <span className="res-dept">{r.department_ref_detail?.name || r.department_name || "N/A"}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`status-badge badge-${r.identity_status.toLowerCase()}`}>
                          {r.identity_status}
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge badge-${r.current_status.toLowerCase()}`}>
                          {r.current_status.replace("_", " ")}
                        </span>
                        {r.is_archived && <span className="archive-badge">Archived</span>}
                      </td>
                      {canCreateOrEdit && (
                        <td className="actions-cell">
                          <div className="actions-group">
                            <Link href={`/residents/${r.id}`} className="btn-edit">
                              View/Edit
                            </Link>
                            {isAdmin && (
                              <button
                                onClick={() => handleArchiveToggle(r)}
                                className={r.is_archived ? "btn-unarchive" : "btn-archive"}
                              >
                                {r.is_archived ? "Restore" : "Archive"}
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style jsx>{`
        .residents-shell {
          padding-top: 2rem;
          place-items: start center;
        }
        .directory-panel {
          width: min(1200px, 100%);
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
          background: var(--accent);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(143, 211, 255, 0.25);
        }
        .filter-toolbar {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border);
          border-radius: 18px;
          padding: 1.5rem;
          margin-bottom: 2rem;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .search-form {
          display: flex;
          gap: 0.75rem;
        }
        .search-input {
          flex: 1;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 0.75rem 1rem;
          color: var(--text);
          outline: none;
          font-size: 0.95rem;
        }
        .search-input:focus {
          border-color: var(--accent);
        }
        .btn-search {
          background: rgba(255, 255, 255, 0.08);
          color: var(--text);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 0.75rem 1.5rem;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .btn-search:hover {
          background: rgba(255, 255, 255, 0.12);
        }
        .filters-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 1rem;
        }
        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }
        .filter-group label {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--muted);
        }
        .filter-group select,
        .filter-group input {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 0.5rem 0.75rem;
          color: var(--text);
          font-size: 0.85rem;
          outline: none;
        }
        .filter-group select option {
          background: #0a1020;
          color: var(--text);
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
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4rem 0;
          color: var(--muted);
          gap: 1rem;
        }
        .spinner {
          width: 2.5rem;
          height: 2.5rem;
          border: 3px solid rgba(255, 255, 255, 0.05);
          border-radius: 50%;
          border-top-color: var(--accent);
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .table-responsive {
          overflow-x: auto;
          border: 1px solid var(--border);
          border-radius: 16px;
        }
        .directory-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
          font-size: 0.9rem;
        }
        .directory-table th {
          background: rgba(255, 255, 255, 0.03);
          padding: 1rem;
          font-weight: 600;
          color: var(--muted);
          border-bottom: 1px solid var(--border);
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .directory-table td {
          padding: 1rem;
          border-bottom: 1px solid var(--border);
          vertical-align: middle;
        }
        .row-archived {
          opacity: 0.6;
          background: rgba(0, 0, 0, 0.2);
        }
        .empty-row {
          text-align: center;
          color: var(--muted);
          padding: 4rem !important;
        }
        .res-details {
          display: flex;
          flex-direction: column;
          line-height: 1.3;
        }
        .res-name {
          font-weight: 600;
          color: var(--text);
        }
        .res-username {
          font-size: 0.75rem;
          color: var(--muted);
        }
        .res-program {
          font-weight: 600;
          color: var(--text);
        }
        .res-specialty {
          font-size: 0.75rem;
          color: var(--muted);
        }
        .res-inst {
          font-weight: 500;
          color: var(--text);
        }
        .res-dept {
          font-size: 0.75rem;
          color: var(--muted);
        }
        .status-badge {
          display: inline-block;
          font-size: 0.75rem;
          font-weight: 700;
          padding: 0.25rem 0.5rem;
          border-radius: 6px;
          text-transform: uppercase;
          letter-spacing: 0.02em;
        }
        .badge-active {
          background: rgba(100, 255, 100, 0.1);
          color: #a3ffa3;
          border: 1px solid rgba(100, 255, 100, 0.2);
        }
        .badge-on_leave {
          background: rgba(255, 200, 100, 0.1);
          color: #ffdca3;
          border: 1px solid rgba(255, 200, 100, 0.2);
        }
        .badge-transferred {
          background: rgba(100, 200, 255, 0.1);
          color: #a3e2ff;
          border: 1px solid rgba(100, 200, 255, 0.2);
        }
        .badge-completed {
          background: rgba(143, 211, 255, 0.2);
          color: var(--accent);
          border: 1px solid var(--accent);
        }
        .badge-dropped {
          background: rgba(255, 100, 100, 0.1);
          color: #ffa3a3;
          border: 1px solid rgba(255, 100, 100, 0.2);
        }
        .badge-suspended {
          background: rgba(255, 100, 100, 0.15);
          color: #ff8080;
          border: 1px solid rgba(255, 100, 100, 0.3);
        }
        .badge-complete {
          background: rgba(100, 255, 100, 0.15);
          color: #a3ffa3;
          border: 1px solid rgba(100, 255, 100, 0.3);
        }
        .badge-incomplete {
          background: rgba(255, 150, 100, 0.15);
          color: #ffdca3;
          border: 1px solid rgba(255, 150, 100, 0.3);
        }
        .archive-badge {
          display: inline-block;
          margin-left: 0.5rem;
          font-size: 0.65rem;
          font-weight: 700;
          background: rgba(255, 255, 255, 0.1);
          color: #fff;
          border-radius: 4px;
          padding: 0.15rem 0.35rem;
          text-transform: uppercase;
        }
        .actions-cell {
          text-align: right;
        }
        .actions-group {
          display: flex;
          gap: 0.5rem;
          justify-content: flex-end;
        }
        .btn-edit {
          display: inline-block;
          text-decoration: none;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--border);
          color: var(--text);
          padding: 0.4rem 0.8rem;
          border-radius: 8px;
          font-size: 0.8rem;
          font-weight: 600;
          transition: all 0.2s ease;
        }
        .btn-edit:hover {
          background: rgba(255, 255, 255, 0.1);
        }
        .btn-archive {
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
        .btn-archive:hover {
          background: rgba(255, 100, 100, 0.2);
          border-color: rgba(255, 100, 100, 0.4);
        }
        .btn-unarchive {
          background: rgba(100, 255, 100, 0.1);
          border: 1px solid rgba(100, 255, 100, 0.2);
          color: #88ff88;
          padding: 0.4rem 0.8rem;
          border-radius: 8px;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .btn-unarchive:hover {
          background: rgba(100, 255, 100, 0.2);
          border-color: rgba(100, 255, 100, 0.4);
        }
      `}</style>
    </div>
  );
}
