"use client";

import React, { useState, useEffect } from "react";
import { apiRequest } from "../../../lib/api";
import { useAuth } from "../../context";

interface User {
  id: number;
  username: string;
  email: string | null;
  full_name: string;
  user_category: string;
}

interface MasterEntity {
  id: number;
  name: string;
  code: string;
}

interface RoleAssignment {
  id: number;
  user: number;
  user_detail?: User;
  role: string;
  scope_type: string;
  institution: number | null;
  institution_detail?: MasterEntity;
  training_site: number | null;
  training_site_detail?: MasterEntity;
  department: number | null;
  department_detail?: MasterEntity;
  program: number | null;
  program_detail?: MasterEntity;
  specialty: number | null;
  specialty_detail?: MasterEntity;
  is_active: boolean;
  notes: string;
  expires_at: string | null;
  assigned_by_detail?: User;
  assigned_at: string;
}

export default function RoleAssignmentsPage() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<RoleAssignment[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // References databases
  const [institutions, setInstitutions] = useState<MasterEntity[]>([]);
  const [trainingSites, setTrainingSites] = useState<MasterEntity[]>([]);
  const [departments, setDepartments] = useState<MasterEntity[]>([]);
  const [programs, setPrograms] = useState<MasterEntity[]>([]);
  const [specialties, setSpecialties] = useState<MasterEntity[]>([]);

  // Filter States
  const [userFilter, setUserFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [activeFilter, setActiveFilter] = useState("true");

  // Modal / Form States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<RoleAssignment | null>(null);
  
  const [formUserId, setFormUserId] = useState("");
  const [formRole, setFormRole] = useState("SUPPORT_STAFF_ACCESS");
  const [formScopeType, setFormScopeType] = useState("GLOBAL");
  
  const [formInstitutionId, setFormInstitutionId] = useState("");
  const [formTrainingSiteId, setFormTrainingSiteId] = useState("");
  const [formDepartmentId, setFormDepartmentId] = useState("");
  const [formProgramId, setFormProgramId] = useState("");
  const [formSpecialtyId, setFormSpecialtyId] = useState("");
  
  const [formExpiresAt, setFormExpiresAt] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formIsActive, setFormIsActive] = useState(true);

  const canEdit = user?.user_category === "UTRMC_ADMIN";

  useEffect(() => {
    fetchAssignments();
    if (isModalOpen) {
      fetchUsers();
      fetchDropdowns();
    }
  }, [isModalOpen, userFilter, roleFilter, activeFilter]);

  const fetchAssignments = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (userFilter) params.append("user", userFilter);
      if (roleFilter) params.append("role", roleFilter);
      if (activeFilter) params.append("is_active", activeFilter);

      const res = await apiRequest(`/access/role-assignments/?${params.toString()}`);
      const data = await res.json();
      if (res.status === 200) {
        setAssignments(data);
      } else {
        setError(data.detail || "Failed to fetch role assignments.");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await apiRequest("/users/?is_active=true");
      const data = await res.json();
      if (res.status === 200) {
        setUsers(data);
      }
    } catch (e) {
      console.error("Failed to load users for assignment selection", e);
    }
  };

  const fetchDropdowns = async () => {
    const fetchCatalog = async (type: string, setter: (data: any) => void) => {
      try {
        const res = await apiRequest(`/masters/${type}/?is_active=true`);
        const data = await res.json();
        if (res.status === 200) setter(data);
      } catch (e) {
        console.error(`Failed to fetch masters: ${type}`, e);
      }
    };

    fetchCatalog("institutions", setInstitutions);
    fetchCatalog("training-sites", setTrainingSites);
    fetchCatalog("departments", setDepartments);
    fetchCatalog("programs", setPrograms);
    fetchCatalog("specialties", setSpecialties);
  };

  const openCreateModal = () => {
    setEditingAssignment(null);
    setFormUserId("");
    setFormRole("SUPPORT_STAFF_ACCESS");
    setFormScopeType("GLOBAL");
    setFormInstitutionId("");
    setFormTrainingSiteId("");
    setFormDepartmentId("");
    setFormProgramId("");
    setFormSpecialtyId("");
    setFormExpiresAt("");
    setFormNotes("");
    setFormIsActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (a: RoleAssignment) => {
    setEditingAssignment(a);
    setFormUserId(a.user.toString());
    setFormRole(a.role);
    setFormScopeType(a.scope_type);
    setFormInstitutionId(a.institution?.toString() || "");
    setFormTrainingSiteId(a.training_site?.toString() || "");
    setFormDepartmentId(a.department?.toString() || "");
    setFormProgramId(a.program?.toString() || "");
    setFormSpecialtyId(a.specialty?.toString() || "");
    setFormExpiresAt(a.expires_at ? a.expires_at.split("T")[0] : "");
    setFormNotes(a.notes);
    setFormIsActive(a.is_active);
    setIsModalOpen(true);
  };

  const handleDeactivate = async (a: RoleAssignment) => {
    if (!confirm(`Are you sure you want to deactivate this role assignment?`)) return;
    try {
      const res = await apiRequest(`/access/role-assignments/${a.id}/`, {
        method: "DELETE",
      });
      if (res.status === 200) {
        fetchAssignments();
      } else {
        const data = await res.json();
        alert(data.detail || "Deactivation failed.");
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleReactivate = async (a: RoleAssignment) => {
    if (!confirm(`Reactivate this role assignment?`)) return;
    try {
      const res = await apiRequest(`/access/role-assignments/${a.id}/`, {
        method: "PATCH",
        body: JSON.stringify({ is_active: true }),
      });
      if (res.status === 200) {
        fetchAssignments();
      } else {
        const data = await res.json();
        alert(data.detail || "Reactivation failed.");
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const payload: Record<string, any> = {
      user: Number(formUserId),
      role: formRole,
      scope_type: formScopeType,
      expires_at: formExpiresAt ? new Date(formExpiresAt).toISOString() : null,
      notes: formNotes,
      is_active: formIsActive,
    };

    // Filter properties based on scope type validation
    if (formScopeType === "GLOBAL") {
      payload.institution = null;
      payload.training_site = null;
      payload.department = null;
      payload.program = null;
      payload.specialty = null;
    } else if (formScopeType === "INSTITUTION") {
      payload.institution = formInstitutionId ? Number(formInstitutionId) : null;
      payload.training_site = null;
      payload.department = null;
      payload.program = null;
      payload.specialty = null;
    } else if (formScopeType === "TRAINING_SITE") {
      payload.training_site = formTrainingSiteId ? Number(formTrainingSiteId) : null;
      payload.institution = null;
      payload.department = null;
      payload.program = null;
      payload.specialty = null;
    } else if (formScopeType === "DEPARTMENT") {
      payload.department = formDepartmentId ? Number(formDepartmentId) : null;
      payload.institution = null;
      payload.training_site = null;
      payload.program = null;
      payload.specialty = null;
    } else if (formScopeType === "PROGRAM") {
      payload.program = formProgramId ? Number(formProgramId) : null;
      payload.institution = null;
      payload.training_site = null;
      payload.department = null;
      payload.specialty = null;
    } else if (formScopeType === "SPECIALTY") {
      payload.specialty = formSpecialtyId ? Number(formSpecialtyId) : null;
      payload.institution = null;
      payload.training_site = null;
      payload.department = null;
      payload.program = null;
    }

    try {
      let res;
      if (editingAssignment) {
        res = await apiRequest(`/access/role-assignments/${editingAssignment.id}/`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        res = await apiRequest(`/access/role-assignments/`, {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }

      if (res.status === 201 || res.status === 200) {
        setIsModalOpen(false);
        fetchAssignments();
      } else {
        const data = await res.json();
        alert(JSON.stringify(data));
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const getScopeLabel = (a: RoleAssignment) => {
    switch (a.scope_type) {
      case "GLOBAL":
        return "Global (All Entities)";
      case "INSTITUTION":
        return `Inst: ${a.institution_detail?.name || a.institution}`;
      case "TRAINING_SITE":
        return `Site: ${a.training_site_detail?.name || a.training_site}`;
      case "DEPARTMENT":
        return `Dept: ${a.department_detail?.name || a.department}`;
      case "PROGRAM":
        return `Prog: ${a.program_detail?.name || a.program}`;
      case "SPECIALTY":
        return `Spec: ${a.specialty_detail?.name || a.specialty}`;
      default:
        return a.scope_type;
    }
  };

  return (
    <div className="shell access-shell">
      <div className="panel directory-panel">
        <div className="header-zone">
          <div>
            <span className="eyebrow">ACCESS MANAGEMENT</span>
            <h1 className="title">Role Scope Mapping</h1>
            <p className="subtitle">Delegate fine-grained roles & scope restrictions on users</p>
          </div>
          {canEdit && (
            <button onClick={openCreateModal} className="btn-create">
              + Assign Role Scope
            </button>
          )}
        </div>

        {/* Toolbar Filters */}
        <div className="filter-toolbar">
          <div className="filters-grid">
            <div className="filter-group">
              <label>Filter by Role</label>
              <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                <option value="">All Roles</option>
                <option value="UTRMC_ADMIN_ACCESS">UTRMC Admin Access</option>
                <option value="SUPPORT_STAFF_ACCESS">Support Staff Access</option>
                <option value="DATA_ENTRY_ACCESS">Data Entry Access</option>
                <option value="AUDITOR_ACCESS">Auditor Access</option>
                <option value="DEPARTMENT_ADMIN_ACCESS">Department Admin Access</option>
              </select>
            </div>
            <div className="filter-group">
              <label>Status</label>
              <select value={activeFilter} onChange={(e) => setActiveFilter(e.target.value)}>
                <option value="true">Active Assignments</option>
                <option value="false">Deactivated Assignments</option>
                <option value="">All Assignments</option>
              </select>
            </div>
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
            <p>Loading role scopes...</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="directory-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Assigned Role</th>
                  <th>Scope Boundary</th>
                  <th>Expirations</th>
                  <th>Status</th>
                  {canEdit && <th className="actions-header">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {assignments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="empty-row">
                      No matching role assignments found.
                    </td>
                  </tr>
                ) : (
                  assignments.map((a) => (
                    <tr key={a.id} className={!a.is_active ? "row-archived" : ""}>
                      <td>
                        <div className="res-details">
                          <span className="res-name">
                            {a.user_detail?.full_name || "—"}
                          </span>
                          <span className="res-username">@{a.user_detail?.username}</span>
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-role">
                          {a.role.replace("_", " ")}
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-scope">{getScopeLabel(a)}</span>
                      </td>
                      <td>
                        {a.expires_at ? (
                          <span className="text-date">
                            {new Date(a.expires_at).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="text-muted">Indefinite</span>
                        )}
                      </td>
                      <td>
                        <span className={`status-badge ${a.is_active ? "active" : "inactive"}`}>
                          {a.is_active ? "Active" : "Deactivated"}
                        </span>
                      </td>
                      {canEdit && (
                        <td>
                          <div className="action-buttons">
                            <button onClick={() => openEditModal(a)} className="btn-edit">
                              Edit
                            </button>
                            {a.is_active ? (
                              <button
                                onClick={() => handleDeactivate(a)}
                                className="btn-archive"
                              >
                                Deactivate
                              </button>
                            ) : (
                              <button
                                onClick={() => handleReactivate(a)}
                                className="btn-unarchive"
                              >
                                Activate
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

      {/* Modal Form */}
      {isModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <h2>{editingAssignment ? "Modify Scope Mapping" : "Assign User Role Scope"}</h2>
            <form onSubmit={handleFormSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Select User *</label>
                  <select
                    required
                    value={formUserId}
                    onChange={(e) => setFormUserId(e.target.value)}
                    disabled={!!editingAssignment}
                  >
                    <option value="">Choose User</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.full_name || u.username} ({u.user_category})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Target Role *</label>
                  <select value={formRole} onChange={(e) => setFormRole(e.target.value)}>
                    <option value="UTRMC_ADMIN_ACCESS">UTRMC Admin Access</option>
                    <option value="SUPPORT_STAFF_ACCESS">Support Staff Access</option>
                    <option value="DATA_ENTRY_ACCESS">Data Entry Access</option>
                    <option value="AUDITOR_ACCESS">Auditor Access</option>
                    <option value="DEPARTMENT_ADMIN_ACCESS">Department Admin Access</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Scope Boundary Type *</label>
                  <select
                    value={formScopeType}
                    onChange={(e) => setFormScopeType(e.target.value)}
                  >
                    <option value="GLOBAL">Global (All Entities)</option>
                    <option value="INSTITUTION">Institution Boundary</option>
                    <option value="TRAINING_SITE">Training Site Boundary</option>
                    <option value="DEPARTMENT">Department Boundary</option>
                    <option value="PROGRAM">Program Boundary</option>
                    <option value="SPECIALTY">Specialty Boundary</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Expiration Date</label>
                  <input
                    type="date"
                    value={formExpiresAt}
                    onChange={(e) => setFormExpiresAt(e.target.value)}
                  />
                </div>

                {/* Scoped selection inputs based on Scope Type */}
                {formScopeType === "INSTITUTION" && (
                  <div className="form-group full-width">
                    <label>Institution Scope Boundary *</label>
                    <select
                      required
                      value={formInstitutionId}
                      onChange={(e) => setFormInstitutionId(e.target.value)}
                    >
                      <option value="">Select Institution</option>
                      {institutions.map((i) => (
                        <option key={i.id} value={i.id}>
                          {i.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {formScopeType === "TRAINING_SITE" && (
                  <div className="form-group full-width">
                    <label>Training Site Scope Boundary *</label>
                    <select
                      required
                      value={formTrainingSiteId}
                      onChange={(e) => setFormTrainingSiteId(e.target.value)}
                    >
                      <option value="">Select Training Site</option>
                      {trainingSites.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {formScopeType === "DEPARTMENT" && (
                  <div className="form-group full-width">
                    <label>Department Scope Boundary *</label>
                    <select
                      required
                      value={formDepartmentId}
                      onChange={(e) => setFormDepartmentId(e.target.value)}
                    >
                      <option value="">Select Department</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {formScopeType === "PROGRAM" && (
                  <div className="form-group full-width">
                    <label>Program Scope Boundary *</label>
                    <select
                      required
                      value={formProgramId}
                      onChange={(e) => setFormProgramId(e.target.value)}
                    >
                      <option value="">Select Program</option>
                      {programs.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {formScopeType === "SPECIALTY" && (
                  <div className="form-group full-width">
                    <label>Specialty Scope Boundary *</label>
                    <select
                      required
                      value={formSpecialtyId}
                      onChange={(e) => setFormSpecialtyId(e.target.value)}
                    >
                      <option value="">Select Specialty</option>
                      {specialties.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="form-group full-width">
                  <label>Auditing Notes</label>
                  <textarea
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="Provide justification or scope descriptions"
                  />
                </div>

                <div className="form-group">
                  <label>Status</label>
                  <select
                    value={formIsActive ? "true" : "false"}
                    onChange={(e) => setFormIsActive(e.target.value === "true")}
                  >
                    <option value="true">Active Mapping</option>
                    <option value="false">Deactivated Mapping</option>
                  </select>
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn-cancel"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-save">
                  Save Scope
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .access-shell {
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
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 12px;
          font-size: 0.9rem;
          font-weight: 700;
          cursor: pointer;
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
        }
        .filters-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
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
        .filter-group select {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 0.5rem 0.75rem;
          color: var(--text);
          font-size: 0.85rem;
          outline: none;
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
          opacity: 0.5;
          background: rgba(0, 0, 0, 0.15);
        }
        .empty-row {
          text-align: center;
          color: var(--muted);
          padding: 4rem !important;
        }

        .res-details {
          display: flex;
          flex-direction: column;
        }
        .res-name {
          font-weight: 600;
          color: var(--text);
        }
        .res-username {
          font-size: 0.75rem;
          color: var(--muted);
        }

        .badge {
          display: inline-block;
          font-size: 0.75rem;
          font-weight: 600;
          padding: 0.2rem 0.5rem;
          border-radius: 6px;
        }
        .badge-role {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--border);
          color: var(--text);
        }
        .badge-scope {
          background: rgba(143, 211, 255, 0.08);
          border: 1px solid rgba(143, 211, 255, 0.2);
          color: var(--accent);
        }

        .text-date {
          font-size: 0.85rem;
          font-weight: 500;
          color: var(--text);
        }

        .status-badge {
          display: inline-block;
          font-size: 0.75rem;
          font-weight: 700;
          padding: 0.2rem 0.5rem;
          border-radius: 6px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .status-badge.active {
          background: rgba(100, 255, 100, 0.1);
          color: #66ff66;
        }
        .status-badge.inactive {
          background: rgba(255, 100, 100, 0.1);
          color: #ff6666;
        }

        .action-buttons {
          display: flex;
          gap: 0.5rem;
        }
        .btn-edit {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--border);
          color: var(--text);
          border-radius: 8px;
          padding: 0.35rem 0.75rem;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .btn-edit:hover {
          background: rgba(255, 255, 255, 0.1);
        }
        .btn-archive {
          background: rgba(255, 100, 100, 0.1);
          border: 1px solid rgba(255, 100, 100, 0.2);
          color: #ff8888;
          border-radius: 8px;
          padding: 0.35rem 0.75rem;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .btn-archive:hover {
          background: rgba(255, 100, 100, 0.2);
        }
        .btn-unarchive {
          background: rgba(100, 255, 100, 0.1);
          border: 1px solid rgba(100, 255, 100, 0.2);
          color: #88ff88;
          border-radius: 8px;
          padding: 0.35rem 0.75rem;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .btn-unarchive:hover {
          background: rgba(100, 255, 100, 0.2);
        }

        .modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(8px);
          display: grid;
          place-items: center;
          z-index: 1000;
          padding: 1rem;
        }
        .modal-content {
          background: #0d1527;
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 2rem;
          width: min(600px, 100%);
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: var(--shadow);
        }
        .modal-content h2 {
          margin: 0 0 1.5rem;
          font-size: 1.5rem;
          font-weight: 800;
          letter-spacing: -0.02em;
        }
        .form-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
          margin-bottom: 1.5rem;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }
        .form-group.full-width {
          grid-column: span 2;
        }
        .form-group label {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--muted);
        }
        .form-group input,
        .form-group select,
        .form-group textarea {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 0.6rem 0.8rem;
          color: var(--text);
          font-size: 0.9rem;
          outline: none;
        }
        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          border-color: var(--accent);
        }
        .form-group textarea {
          min-height: 80px;
          resize: vertical;
        }
        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 0.75rem;
        }
        .btn-cancel {
          background: transparent;
          border: 1px solid var(--border);
          color: var(--text);
          padding: 0.6rem 1.2rem;
          border-radius: 10px;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
        }
        .btn-cancel:hover {
          background: rgba(255, 255, 255, 0.05);
        }
        .btn-save {
          background: var(--accent);
          color: var(--bg);
          border: none;
          padding: 0.6rem 1.2rem;
          border-radius: 10px;
          font-size: 0.85rem;
          font-weight: 700;
          cursor: pointer;
        }
        .btn-save:hover {
          background: #bbf0ff;
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
      `}</style>
    </div>
  );
}
