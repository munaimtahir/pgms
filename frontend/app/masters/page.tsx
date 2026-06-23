"use client";

import React, { useState, useEffect } from "react";
import { apiRequest } from "../../lib/api";
import { useAuth } from "../context";

type MasterType =
  | "institutions"
  | "training-sites"
  | "departments"
  | "programs"
  | "specialties"
  | "designations"
  | "academic-sessions";

interface MasterRecord {
  id: number;
  name: string;
  code: string;
  description: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  created_by_detail?: { id: number; username: string };
  // institution type
  short_name?: string;
  city?: string;
  // training site type
  institution?: number;
  institution_detail?: { id: number; name: string };
  site_type?: string;
  address?: string;
  // department type
  training_site?: number;
  training_site_detail?: { id: number; name: string };
  is_clinical?: boolean;
  // program type
  program_type?: string;
  duration_years?: number;
  // specialty type
  program?: number;
  program_detail?: { id: number; name: string };
  // academic session type
  start_year?: number;
  end_year?: number;
}

export default function MastersPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<MasterType>("institutions");
  const [records, setRecords] = useState<MasterRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // References lists for dropdowns
  const [institutions, setInstitutions] = useState<MasterRecord[]>([]);
  const [trainingSites, setTrainingSites] = useState<MasterRecord[]>([]);
  const [programs, setPrograms] = useState<MasterRecord[]>([]);

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<MasterRecord | null>(null);
  const [formName, setFormName] = useState("");
  const [formCode, setFormCode] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formSortOrder, setFormSortOrder] = useState(0);
  const [formIsActive, setFormIsActive] = useState(true);

  // Field specific state
  const [formShortName, setFormShortName] = useState("");
  const [formCity, setFormCity] = useState("");
  const [formInstitutionId, setFormInstitutionId] = useState("");
  const [formSiteType, setFormSiteType] = useState("HOSPITAL");
  const [formAddress, setFormAddress] = useState("");
  const [formTrainingSiteId, setFormTrainingSiteId] = useState("");
  const [formIsClinical, setFormIsClinical] = useState(true);
  const [formProgramType, setFormProgramType] = useState("FCPS");
  const [formDurationYears, setFormDurationYears] = useState(4);
  const [formProgramId, setFormProgramId] = useState("");
  const [formStartYear, setFormStartYear] = useState(new Date().getFullYear());
  const [formEndYear, setFormEndYear] = useState(new Date().getFullYear() + 4);

  const canEdit = user?.user_category === "UTRMC_ADMIN";

  useEffect(() => {
    fetchRecords();
    if (activeTab === "training-sites" || activeTab === "departments") {
      fetchDropdownData("institutions");
    }
    if (activeTab === "departments") {
      fetchDropdownData("training-sites");
    }
    if (activeTab === "specialties") {
      fetchDropdownData("programs");
    }
  }, [activeTab]);

  const fetchRecords = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest(`/masters/${activeTab}/`);
      const data = await res.json();
      if (res.status === 200) {
        setRecords(data);
      } else {
        setError(data.detail || `Failed to fetch ${activeTab}`);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const fetchDropdownData = async (type: "institutions" | "training-sites" | "programs") => {
    try {
      const res = await apiRequest(`/masters/${type}/?is_active=true`);
      const data = await res.json();
      if (res.status === 200) {
        if (type === "institutions") setInstitutions(data);
        if (type === "training-sites") setTrainingSites(data);
        if (type === "programs") setPrograms(data);
      }
    } catch (e) {
      console.error(`Failed to load ${type} dropdown data`, e);
    }
  };

  const openCreateModal = () => {
    setEditingRecord(null);
    setFormName("");
    setFormCode("");
    setFormDesc("");
    setFormSortOrder(0);
    setFormIsActive(true);
    setFormShortName("");
    setFormCity("");
    setFormInstitutionId("");
    setFormSiteType("HOSPITAL");
    setFormAddress("");
    setFormTrainingSiteId("");
    setFormIsClinical(true);
    setFormProgramType("FCPS");
    setFormDurationYears(4);
    setFormProgramId("");
    setFormStartYear(new Date().getFullYear());
    setFormEndYear(new Date().getFullYear() + 4);
    setIsModalOpen(true);
  };

  const openEditModal = (rec: MasterRecord) => {
    setEditingRecord(rec);
    setFormName(rec.name);
    setFormCode(rec.code);
    setFormDesc(rec.description);
    setFormSortOrder(rec.sort_order);
    setFormIsActive(rec.is_active);
    setFormShortName(rec.short_name || "");
    setFormCity(rec.city || "");
    setFormInstitutionId(rec.institution?.toString() || "");
    setFormSiteType(rec.site_type || "HOSPITAL");
    setFormAddress(rec.address || "");
    setFormTrainingSiteId(rec.training_site?.toString() || "");
    setFormIsClinical(rec.is_clinical ?? true);
    setFormProgramType(rec.program_type || "FCPS");
    setFormDurationYears(rec.duration_years || 4);
    setFormProgramId(rec.program?.toString() || "");
    setFormStartYear(rec.start_year || new Date().getFullYear());
    setFormEndYear(rec.end_year || new Date().getFullYear() + 4);
    setIsModalOpen(true);
  };

  const handleDeactivate = async (rec: MasterRecord) => {
    if (!confirm(`Are you sure you want to deactivate ${rec.name}?`)) return;
    try {
      const res = await apiRequest(`/masters/${activeTab}/${rec.id}/`, {
        method: "DELETE",
      });
      if (res.status === 200) {
        fetchRecords();
      } else {
        const data = await res.json();
        alert(data.detail || "Deactivation failed.");
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleReactivate = async (rec: MasterRecord) => {
    if (!confirm(`Reactivate ${rec.name}?`)) return;
    try {
      const res = await apiRequest(`/masters/${activeTab}/${rec.id}/`, {
        method: "PATCH",
        body: JSON.stringify({ is_active: true }),
      });
      if (res.status === 200) {
        fetchRecords();
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
      name: formName,
      code: formCode,
      description: formDesc,
      sort_order: Number(formSortOrder),
      is_active: formIsActive,
    };

    if (activeTab === "institutions") {
      payload.short_name = formShortName;
      payload.city = formCity;
    } else if (activeTab === "training-sites") {
      payload.institution = Number(formInstitutionId);
      payload.short_name = formShortName;
      payload.site_type = formSiteType;
      payload.city = formCity;
      payload.address = formAddress;
    } else if (activeTab === "departments") {
      payload.training_site = Number(formTrainingSiteId);
      payload.short_name = formShortName;
      payload.is_clinical = formIsClinical;
    } else if (activeTab === "programs") {
      payload.program_type = formProgramType;
      payload.duration_years = Number(formDurationYears);
    } else if (activeTab === "specialties") {
      payload.program = Number(formProgramId);
    } else if (activeTab === "academic-sessions") {
      payload.start_year = Number(formStartYear);
      payload.end_year = Number(formEndYear);
    }

    try {
      let res;
      if (editingRecord) {
        res = await apiRequest(`/masters/${activeTab}/${editingRecord.id}/`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        res = await apiRequest(`/masters/${activeTab}/`, {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }

      if (res.status === 201 || res.status === 200) {
        setIsModalOpen(false);
        fetchRecords();
      } else {
        const data = await res.json();
        alert(JSON.stringify(data));
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="shell masters-shell">
      <div className="panel directory-panel">
        <div className="header-zone">
          <div>
            <span className="eyebrow">SYSTEM TAXONOMIES</span>
            <h1 className="title">Master Catalogs</h1>
            <p className="subtitle">Configure foundational data hierarchies & matrix records</p>
          </div>
          {canEdit && (
            <button onClick={openCreateModal} className="btn-create">
              + Create Record
            </button>
          )}
        </div>

        {/* Tab Selection */}
        <div className="tabs-bar">
          {(
            [
              { id: "institutions", label: "Institutions" },
              { id: "training-sites", label: "Training Sites" },
              { id: "departments", label: "Departments" },
              { id: "programs", label: "Programs" },
              { id: "specialties", label: "Specialties" },
              { id: "designations", label: "Designations" },
              { id: "academic-sessions", label: "Sessions" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`tab-btn ${activeTab === tab.id ? "tab-active" : ""}`}
            >
              {tab.label}
            </button>
          ))}
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
            <p>Loading master catalog...</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="directory-table">
              <thead>
                <tr>
                  <th>Name / Code</th>
                  <th>Description</th>
                  <th>Hierarchy Detail</th>
                  <th>Sort Order</th>
                  <th>Status</th>
                  {canEdit && <th className="actions-header">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {records.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="empty-row">
                      No records found in this catalog.
                    </td>
                  </tr>
                ) : (
                  records.map((r) => (
                    <tr key={r.id} className={!r.is_active ? "row-archived" : ""}>
                      <td>
                        <div className="res-details">
                          <span className="res-name">{r.name}</span>
                          <span className="res-username">{r.code}</span>
                        </div>
                      </td>
                      <td>
                        <span className="text-desc">{r.description || "—"}</span>
                      </td>
                      <td>
                        {activeTab === "training-sites" && r.institution_detail && (
                          <span className="badge badge-hierarchy">
                            Inst: {r.institution_detail.name}
                          </span>
                        )}
                        {activeTab === "departments" && r.training_site_detail && (
                          <span className="badge badge-hierarchy">
                            Site: {r.training_site_detail.name}
                          </span>
                        )}
                        {activeTab === "specialties" && r.program_detail && (
                          <span className="badge badge-hierarchy">
                            Prog: {r.program_detail.name}
                          </span>
                        )}
                        {activeTab === "academic-sessions" && (
                          <span className="badge badge-hierarchy">
                            Years: {r.start_year} - {r.end_year}
                          </span>
                        )}
                        {(!r.institution_detail &&
                          !r.training_site_detail &&
                          !r.program_detail &&
                          activeTab !== "academic-sessions") &&
                          "—"}
                      </td>
                      <td>{r.sort_order}</td>
                      <td>
                        <span className={`status-badge ${r.is_active ? "active" : "inactive"}`}>
                          {r.is_active ? "Active" : "Deactivated"}
                        </span>
                      </td>
                      {canEdit && (
                        <td>
                          <div className="action-buttons">
                            <button onClick={() => openEditModal(r)} className="btn-edit">
                              Edit
                            </button>
                            {r.is_active ? (
                              <button
                                onClick={() => handleDeactivate(r)}
                                className="btn-archive"
                              >
                                Deactivate
                              </button>
                            ) : (
                              <button
                                onClick={() => handleReactivate(r)}
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

      {/* modal block */}
      {isModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <h2>{editingRecord ? "Edit Record" : "Create Master Record"}</h2>
            <form onSubmit={handleFormSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Display Name *</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Allied Hospital"
                  />
                </div>
                <div className="form-group">
                  <label>Identifier Code *</label>
                  <input
                    type="text"
                    required
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    placeholder="e.g. ALLIED-HOSP"
                  />
                </div>
                <div className="form-group full-width">
                  <label>Description</label>
                  <textarea
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    placeholder="Detailed description of the master record"
                  />
                </div>

                <div className="form-group">
                  <label>Sort Order</label>
                  <input
                    type="number"
                    value={formSortOrder}
                    onChange={(e) => setFormSortOrder(Number(e.target.value))}
                  />
                </div>

                <div className="form-group">
                  <label>Status</label>
                  <select
                    value={formIsActive ? "true" : "false"}
                    onChange={(e) => setFormIsActive(e.target.value === "true")}
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>

                {/* Institution specific fields */}
                {activeTab === "institutions" && (
                  <>
                    <div className="form-group">
                      <label>Short Name</label>
                      <input
                        type="text"
                        value={formShortName}
                        onChange={(e) => setFormShortName(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>City</label>
                      <input
                        type="text"
                        value={formCity}
                        onChange={(e) => setFormCity(e.target.value)}
                      />
                    </div>
                  </>
                )}

                {/* Training Site specific fields */}
                {activeTab === "training-sites" && (
                  <>
                    <div className="form-group">
                      <label>Institution *</label>
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
                    <div className="form-group">
                      <label>Site Type</label>
                      <select
                        value={formSiteType}
                        onChange={(e) => setFormSiteType(e.target.value)}
                      >
                        <option value="UNIVERSITY">University</option>
                        <option value="HOSPITAL">Hospital</option>
                        <option value="COLLEGE">College</option>
                        <option value="INSTITUTE">Institute</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Short Name</label>
                      <input
                        type="text"
                        value={formShortName}
                        onChange={(e) => setFormShortName(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>City</label>
                      <input
                        type="text"
                        value={formCity}
                        onChange={(e) => setFormCity(e.target.value)}
                      />
                    </div>
                    <div className="form-group full-width">
                      <label>Address</label>
                      <input
                        type="text"
                        value={formAddress}
                        onChange={(e) => setFormAddress(e.target.value)}
                      />
                    </div>
                  </>
                )}

                {/* Department specific fields */}
                {activeTab === "departments" && (
                  <>
                    <div className="form-group">
                      <label>Training Site *</label>
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
                    <div className="form-group">
                      <label>Short Name</label>
                      <input
                        type="text"
                        value={formShortName}
                        onChange={(e) => setFormShortName(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Clinical Status</label>
                      <select
                        value={formIsClinical ? "true" : "false"}
                        onChange={(e) => setFormIsClinical(e.target.value === "true")}
                      >
                        <option value="true">Clinical Department</option>
                        <option value="false">Non-Clinical Department</option>
                      </select>
                    </div>
                  </>
                )}

                {/* Program specific fields */}
                {activeTab === "programs" && (
                  <>
                    <div className="form-group">
                      <label>Program Type</label>
                      <select
                        value={formProgramType}
                        onChange={(e) => setFormProgramType(e.target.value)}
                      >
                        <option value="FCPS">FCPS</option>
                        <option value="MD">MD</option>
                        <option value="MS">MS</option>
                        <option value="MPHIL">MPhil</option>
                        <option value="DIPLOMA">Diploma</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Duration (Years)</label>
                      <input
                        type="number"
                        value={formDurationYears}
                        onChange={(e) => setFormDurationYears(Number(e.target.value))}
                      />
                    </div>
                  </>
                )}

                {/* Specialty specific fields */}
                {activeTab === "specialties" && (
                  <div className="form-group">
                    <label>Program *</label>
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

                {/* Academic Session fields */}
                {activeTab === "academic-sessions" && (
                  <>
                    <div className="form-group">
                      <label>Start Year</label>
                      <input
                        type="number"
                        value={formStartYear}
                        onChange={(e) => setFormStartYear(Number(e.target.value))}
                      />
                    </div>
                    <div className="form-group">
                      <label>End Year</label>
                      <input
                        type="number"
                        value={formEndYear}
                        onChange={(e) => setFormEndYear(Number(e.target.value))}
                      />
                    </div>
                  </>
                )}
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
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .masters-shell {
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
          margin-bottom: 2rem;
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

        .tabs-bar {
          display: flex;
          gap: 0.5rem;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--border);
          padding: 0.35rem;
          border-radius: 14px;
          margin-bottom: 2rem;
          overflow-x: auto;
        }
        .tab-btn {
          background: transparent;
          border: none;
          color: var(--muted);
          padding: 0.6rem 1.2rem;
          border-radius: 10px;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.2s ease;
        }
        .tab-btn:hover {
          color: var(--text);
          background: rgba(255, 255, 255, 0.02);
        }
        .tab-active {
          background: rgba(255, 255, 255, 0.08) !important;
          color: var(--accent) !important;
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
        .text-desc {
          font-size: 0.85rem;
          color: var(--muted);
          max-width: 40ch;
          display: inline-block;
        }
        .badge {
          display: inline-block;
          font-size: 0.75rem;
          font-weight: 600;
          padding: 0.2rem 0.5rem;
          border-radius: 6px;
        }
        .badge-hierarchy {
          background: rgba(143, 211, 255, 0.08);
          border: 1px solid rgba(143, 211, 255, 0.2);
          color: var(--accent);
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
