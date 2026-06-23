"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { apiRequest, SupervisorProfile } from "../../lib/api";
import { useAuth } from "../context";

export default function SupervisorsDirectoryPage() {
  const { user } = useAuth();
  const [supervisors, setSupervisors] = useState<SupervisorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters state
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [designationFilter, setDesignationFilter] = useState("");
  const [programFilter, setProgramFilter] = useState("");
  const [specialtyFilter, setSpecialtyFilter] = useState("");
  const [institutionFilter, setInstitutionFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [hospitalFilter, setHospitalFilter] = useState("");
  const [archivedFilter, setArchivedFilter] = useState("false");

  // Options state
  const [options, setOptions] = useState<{
    institutions: any[];
    hospitals: any[];
    departments: any[];
    programs: any[];
    designations: any[];
  }>({
    institutions: [],
    hospitals: [],
    departments: [],
    programs: [],
    designations: [],
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
    fetchSupervisors();
  }, [
    statusFilter,
    designationFilter,
    programFilter,
    specialtyFilter,
    institutionFilter,
    departmentFilter,
    hospitalFilter,
    archivedFilter,
  ]);

  const fetchSupervisors = async (searchVal?: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      
      const querySearch = typeof searchVal === "string" ? searchVal : search;
      if (querySearch) params.append("search", querySearch);
      
      if (statusFilter) params.append("supervision_status", statusFilter);
      if (designationFilter) params.append("designation_ref", designationFilter);
      if (programFilter) params.append("program_name", programFilter);
      if (specialtyFilter) params.append("specialty_name", specialtyFilter);
      if (institutionFilter) params.append("institution_ref", institutionFilter);
      if (departmentFilter) params.append("department_ref", departmentFilter);
      if (hospitalFilter) params.append("hospital", hospitalFilter);
      
      if (user?.user_category === "UTRMC_ADMIN" || user?.user_category === "SUPPORT_STAFF") {
        params.append("is_archived", archivedFilter);
      }

      const res = await apiRequest(`/supervisors/?${params.toString()}`);
      const data = await res.json();
      if (res.status === 200) {
        setSupervisors(data);
      } else {
        setError(data.detail || "Failed to load supervisor directory.");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchSupervisors();
  };

  const handleArchiveToggle = async (profile: SupervisorProfile) => {
    if (user?.user_category !== "UTRMC_ADMIN") return;
    
    const confirmMsg = profile.is_archived
      ? `Are you sure you want to restore/unarchive supervisor ${profile.user.full_name}?`
      : `Are you sure you want to archive supervisor ${profile.user.full_name}? This will also disable their user login.`;
      
    if (!confirm(confirmMsg)) return;

    try {
      let res;
      if (profile.is_archived) {
        res = await apiRequest(`/supervisors/${profile.id}/unarchive/`, { method: "POST" });
      } else {
        res = await apiRequest(`/supervisors/${profile.id}/`, { method: "DELETE" });
      }

      if (res.status === 200) {
        fetchSupervisors();
      } else {
        const data = await res.json();
        alert(data.detail || "Action failed.");
      }
    } catch (err: any) {
      alert(err.message || "An error occurred.");
    }
  };

  const canCreate = user?.user_category === "UTRMC_ADMIN";
  const isAdmin = user?.user_category === "UTRMC_ADMIN";

  return (
    <div className="shell supervisors-shell">
      <div className="panel directory-panel">
        <div className="header-zone">
          <div className="title-area">
            <p className="eyebrow">Directory</p>
            <h2 className="title">Supervisor Directory</h2>
            <p className="subtitle">Search and manage supervisor profiles and credentials.</p>
          </div>
          {canCreate && (
            <Link href="/supervisors/new" className="btn-create">
              + New Supervisor
            </Link>
          )}
        </div>

        {/* Filter Toolbar */}
        <div className="filter-toolbar">
          <form onSubmit={handleSearchSubmit} className="search-form">
            <input
              type="text"
              placeholder="Search Name, Username, PMDC, Official Email..."
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
                <option value="RETIRED">Retired</option>
                <option value="TRANSFERRED">Transferred</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>

             <div className="filter-group">
              <label>Designation</label>
              <select value={designationFilter} onChange={(e) => setDesignationFilter(e.target.value)}>
                <option value="">All Designations</option>
                {options.designations.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
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
              <input
                type="text"
                placeholder="e.g. FCPS"
                value={programFilter}
                onChange={(e) => setProgramFilter(e.target.value)}
              />
            </div>

            <div className="filter-group">
              <label>Specialty</label>
              <input
                type="text"
                placeholder="e.g. Surgery"
                value={specialtyFilter}
                onChange={(e) => setSpecialtyFilter(e.target.value)}
              />
            </div>

            <div className="filter-group">
              <label>Institution</label>
              <select value={institutionFilter} onChange={(e) => setInstitutionFilter(e.target.value)}>
                <option value="">All Institutions</option>
                {options.institutions.map((i) => (
                  <option key={i.id} value={i.id}>{i.name}</option>
                ))}
              </select>
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
            <p>Loading supervisor database...</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="directory-table">
              <thead>
                <tr>
                  <th>Supervisor</th>
                  <th>Designation</th>
                  <th>PMDC</th>
                  <th>Hospital & Dept</th>
                  <th>Identity</th>
                  <th>Capacity</th>
                  <th>Status</th>
                  <th className="actions-header">Actions</th>
                </tr>
              </thead>
              <tbody>
                {supervisors.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="empty-row">
                      No supervisors matching the criteria found.
                    </td>
                  </tr>
                ) : (
                  supervisors.map((s) => (
                    <tr key={s.id} className={s.is_archived ? "row-archived" : ""}>
                      <td className="supervisor-col">
                        <div className="sup-details">
                          <span className="sup-name">{s.user.full_name || s.user.username}</span>
                          <span className="sup-username">@{s.user.username}</span>
                        </div>
                      </td>
                      <td>{s.designation_ref_detail?.name || s.designation || <span className="muted-text">—</span>}</td>
                      <td className="pmdc-col">{s.pmdc_number || <span className="muted-text">—</span>}</td>
                      <td>
                        <div className="sup-details">
                          <span className="sup-inst">{s.training_site_ref_detail?.name || s.institution_name || "N/A"}</span>
                          <span className="sup-dept">{s.department_ref_detail?.name || s.department_name || "N/A"}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`status-badge badge-${s.identity_status.toLowerCase()}`}>
                          {s.identity_status}
                        </span>
                      </td>
                      <td className="capacity-col">{s.max_active_residents} Active</td>
                      <td>
                        <span className={`status-badge badge-${s.supervision_status.toLowerCase()}`}>
                          {s.supervision_status.replace("_", " ")}
                        </span>
                        {s.is_archived && <span className="archive-badge">Archived</span>}
                      </td>
                      <td className="actions-cell">
                        <div className="actions-group">
                          <Link href={`/supervisors/${s.id}`} className="btn-edit">
                            {isAdmin ? "View/Edit" : "View"}
                          </Link>
                          {isAdmin && (
                            <button
                              onClick={() => handleArchiveToggle(s)}
                              className={s.is_archived ? "btn-unarchive" : "btn-archive"}
                            >
                              {s.is_archived ? "Restore" : "Archive"}
                            </button>
                          )}
                        </div>
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
        .supervisors-shell {
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
        .sup-details {
          display: flex;
          flex-direction: column;
          line-height: 1.3;
        }
        .sup-name {
          font-weight: 600;
          color: var(--text);
        }
        .sup-username {
          font-size: 0.75rem;
          color: var(--muted);
        }
        .sup-inst {
          font-weight: 500;
          color: var(--text);
        }
        .sup-dept {
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
        .badge-retired {
          background: rgba(255, 255, 255, 0.05);
          color: #d1d5db;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .badge-transferred {
          background: rgba(100, 200, 255, 0.1);
          color: #a3e2ff;
          border: 1px solid rgba(100, 200, 255, 0.2);
        }
        .badge-inactive {
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
