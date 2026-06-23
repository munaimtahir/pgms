"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { apiRequest, SupervisorProfile } from "../../../lib/api";
import { useAuth } from "../../context";

export default function SupervisorDetailPage() {
  const router = useRouter();
  const { id } = useParams();
  const { user: currentUser } = useAuth();

  const [profile, setProfile] = useState<SupervisorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  // Edit Mode state
  const [editMode, setEditMode] = useState(false);

  // Fields state
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [designation, setDesignation] = useState("");
  const [qualification, setQualification] = useState("");
  const [pmdcNumber, setPmdcNumber] = useState("");
  const [specialtyName, setSpecialtyName] = useState("");
  const [subspecialtyName, setSubspecialtyName] = useState("");

  const [institutionName, setInstitutionName] = useState("");
  const [departmentName, setDepartmentName] = useState("");
  const [programName, setProgramName] = useState("");

  const [trainingSiteRef, setTrainingSiteRef] = useState("");
  const [departmentRef, setDepartmentRef] = useState("");
  const [designationRef, setDesignationRef] = useState("");
  const [programRef, setProgramRef] = useState("");
  const [institutionRef, setInstitutionRef] = useState("");

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

  const [alternatePhone, setAlternatePhone] = useState("");
  const [roomOrOffice, setRoomOrOffice] = useState("");
  const [availabilityNotes, setAvailabilityNotes] = useState("");

  const [supervisionStatus, setSupervisionStatus] = useState("ACTIVE");
  const [maxActiveResidents, setMaxActiveResidents] = useState(5);
  const [canSuperviseThesis, setCanSuperviseThesis] = useState(false);
  const [canSuperviseClinicalTraining, setCanSuperviseClinicalTraining] = useState(true);

  const [notes, setNotes] = useState("");

  // Password reset admin tools
  const [newPassword, setNewPassword] = useState("");
  const [resettingPassword, setResettingPassword] = useState(false);

  useEffect(() => {
    if (id) {
      fetchProfile();
    }
  }, [id]);

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest(`/supervisors/${id}/`);
      const data = await res.json();
      if (res.status === 200) {
        setProfile(data);
        populateFields(data);
      } else {
        setError(data.detail || "Supervisor profile not found.");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const populateFields = (data: SupervisorProfile) => {
    setFullName(data.user.full_name);
    setPhone(data.user.phone);
    setEmail(data.user.email || "");
    setIsActive(data.user.is_active);

    setDesignation(data.designation);
    setQualification(data.qualification);
    setPmdcNumber(data.pmdc_number || "");
    setSpecialtyName(data.specialty_name);
    setSubspecialtyName(data.subspecialty_name);

    setInstitutionName(data.institution_name);
    setDepartmentName(data.department_name);
    setProgramName(data.program_name);

    setTrainingSiteRef(data.training_site_ref ? data.training_site_ref.toString() : "");
    setDepartmentRef(data.department_ref ? data.department_ref.toString() : "");
    setDesignationRef(data.designation_ref ? data.designation_ref.toString() : "");
    setProgramRef(data.program_ref ? data.program_ref.toString() : "");
    setInstitutionRef(data.institution_ref ? data.institution_ref.toString() : "");

    setAlternatePhone(data.alternate_phone);
    setRoomOrOffice(data.room_or_office);
    setAvailabilityNotes(data.availability_notes);

    setSupervisionStatus(data.supervision_status);
    setMaxActiveResidents(data.max_active_residents);
    setCanSuperviseThesis(data.can_supervise_thesis);
    setCanSuperviseClinicalTraining(data.can_supervise_clinical_training);

    setNotes(data.notes);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);

    const isSelfSupervisor = currentUser?.user_category === "SUPERVISOR";

    const payload: any = {
      alternate_phone: alternatePhone,
      room_or_office: roomOrOffice,
      availability_notes: availabilityNotes,
    };

    if (!isSelfSupervisor) {
      payload.designation = designation;
      payload.qualification = qualification;
      payload.pmdc_number = pmdcNumber || null;
      payload.specialty_name = specialtyName;
      payload.subspecialty_name = subspecialtyName;
      payload.institution_name = institutionName;
      payload.department_name = departmentName;
      payload.program_name = programName;
      payload.supervision_status = supervisionStatus;
      payload.max_active_residents = Number(maxActiveResidents);
      payload.can_supervise_thesis = canSuperviseThesis;
      payload.can_supervise_clinical_training = canSuperviseClinicalTraining;
      payload.notes = notes;

      payload.training_site_ref = trainingSiteRef ? Number(trainingSiteRef) : null;
      payload.department_ref = departmentRef ? Number(departmentRef) : null;
      payload.designation_ref = designationRef ? Number(designationRef) : null;
      payload.program_ref = programRef ? Number(programRef) : null;
      payload.institution_ref = institutionRef ? Number(institutionRef) : null;

      // Check user edits
      payload["user.full_name"] = fullName;
      payload["user.phone"] = phone;
      payload["user.email"] = email || null;
      payload["user.is_active"] = isActive;
    } else {
      // If supervisor edits office contact details, sync back to core phone/email if needed
      payload["user.phone"] = alternatePhone || phone;
      payload["user.email"] = email;
    }

    try {
      const res = await apiRequest(`/supervisors/${id}/`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.status === 200) {
        setProfile(data);
        populateFields(data);
        setSuccess("Profile updated successfully!");
        setEditMode(false);
      } else {
        setError(data.detail || "Failed to update profile details.");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleArchiveToggle = async () => {
    if (currentUser?.user_category !== "UTRMC_ADMIN" || !profile) return;
    
    const confirmMsg = profile.is_archived
      ? `Are you sure you want to restore/unarchive supervisor ${profile.user.full_name}?`
      : `Are you sure you want to archive supervisor ${profile.user.full_name}? This will disable their account access.`;

    if (!confirm(confirmMsg)) return;

    try {
      let res;
      if (profile.is_archived) {
        res = await apiRequest(`/supervisors/${profile.id}/unarchive/`, { method: "POST" });
      } else {
        res = await apiRequest(`/supervisors/${profile.id}/`, { method: "DELETE" });
      }

      if (res.status === 200) {
        setSuccess(profile.is_archived ? "Supervisor restored successfully!" : "Supervisor archived successfully!");
        fetchProfile();
      } else {
        const data = await res.json();
        setError(data.detail || "Archive toggle failed.");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6 || !profile) return;

    setResettingPassword(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await apiRequest(`/users/${profile.user.id}/reset-password/`, {
        method: "POST",
        body: JSON.stringify({ new_password: newPassword }),
      });

      if (res.status === 200) {
        setSuccess("Password reset successfully. The supervisor must change it on their next login.");
        setNewPassword("");
      } else {
        const data = await res.json();
        setError(data.detail || "Failed to reset password.");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    } finally {
      setResettingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="shell loading-shell">
        <div className="panel loading-panel">
          <div className="spinner"></div>
          <p>Fetching supervisor profile details...</p>
        </div>
        <style jsx>{`
          .loading-shell { padding-top: 5rem; }
          .loading-panel { text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1rem; }
          .spinner { width: 3rem; height: 3rem; border: 3px solid rgba(255,255,255,0.05); border-radius: 50%; border-top-color: var(--accent); animation: spin 1s linear infinite; }
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="shell error-shell">
        <div className="panel error-panel">
          <h2 className="error-title">Error</h2>
          <p className="error-message">{error}</p>
          <Link href="/supervisors" className="btn-back">Back to Directory</Link>
        </div>
        <style jsx>{`
          .error-shell { padding-top: 5rem; }
          .error-panel { text-align: center; }
          .error-title { color: #ff8888; font-size: 1.5rem; margin-bottom: 1rem; }
          .btn-back { display: inline-block; text-decoration: none; background: var(--text); color: var(--bg); padding: 0.5rem 1rem; border-radius: 8px; font-weight: 700; margin-top: 1.5rem; }
        `}</style>
      </div>
    );
  }

  const isSelfSupervisor = currentUser?.user_category === "SUPERVISOR";
  const canArchive = currentUser?.user_category === "UTRMC_ADMIN";
  const canResetPass = currentUser?.user_category === "UTRMC_ADMIN";
  const canEdit = currentUser?.user_category === "UTRMC_ADMIN" || isSelfSupervisor;

  return (
    <div className="shell supervisors-shell">
      <div className="panel detail-panel">
        
        {/* Header Zone */}
        <div className="header-zone">
          <div className="title-area">
            <p className="eyebrow">Supervisor Details</p>
            <h2 className="title">
              {profile?.user.full_name || profile?.user.username}
              {profile && (
                <span className={`status-badge badge-${profile.identity_status.toLowerCase()}`} style={{ marginLeft: "1rem" }}>
                  Identity: {profile.identity_status}
                </span>
              )}
            </h2>
            <p className="subtitle">@{profile?.user.username} — ID #{profile?.id}</p>
          </div>
          <div className="header-actions">
            {canEdit && (
              !editMode ? (
                <button onClick={() => setEditMode(true)} className="btn-edit-mode">
                  Edit Profile
                </button>
              ) : (
                <button onClick={() => { setEditMode(false); if (profile) populateFields(profile); }} className="btn-cancel-edit">
                  Cancel
                </button>
              )
            )}
          </div>
        </div>

        {success && (
          <div className="alert alert-success">
            <span className="alert-icon">✨</span>
            <span className="alert-message">{success}</span>
          </div>
        )}

        {error && (
          <div className="alert alert-error">
            <span className="alert-icon">⚠️</span>
            <span className="alert-message">{error}</span>
          </div>
        )}

        {profile?.is_archived && (
          <div className="alert alert-archived-banner">
            <span className="alert-icon">🗄️</span>
            <span className="alert-message">This supervisor record is archived. Their login access is disabled.</span>
          </div>
        )}

        <form onSubmit={handleUpdate} className="supervisor-form">
          
          {/* Section: Account Overview */}
          <div className="form-section">
            <h3 className="section-title">Account Credentials</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Login ID (Username)</label>
                <input type="text" value={profile?.user.username} disabled />
              </div>

              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={!editMode || isSelfSupervisor}
                  required
                />
              </div>

              <div className="form-group">
                <label>Official Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={!editMode || isSelfSupervisor}
                />
              </div>

              <div className="form-group">
                <label>Office Phone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={!editMode || isSelfSupervisor}
                />
              </div>

              {!isSelfSupervisor && (
                <div className="form-group">
                  <label>Login Access</label>
                  <select
                    value={isActive ? "active" : "inactive"}
                    onChange={(e) => setIsActive(e.target.value === "active")}
                    disabled={!editMode}
                  >
                    <option value="active">Enabled / Active</option>
                    <option value="inactive">Disabled / Suspended</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Section: Professional Profile Details */}
          <div className="form-section">
            <h3 className="section-title">Professional Details</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Designation *</label>
                {editMode && !isSelfSupervisor ? (
                  <select
                    value={designationRef}
                    onChange={(e) => {
                      const val = e.target.value;
                      setDesignationRef(val);
                      const selected = options.designations.find(d => d.id.toString() === val);
                      setDesignation(selected ? selected.name : "");
                    }}
                  >
                    <option value="">Select Designation</option>
                    {options.designations.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={profile?.designation_ref_detail?.name || designation || "—"}
                    disabled
                  />
                )}
              </div>

              <div className="form-group">
                <label>Qualifications</label>
                <input
                  type="text"
                  value={qualification}
                  onChange={(e) => setQualification(e.target.value)}
                  disabled={!editMode || isSelfSupervisor}
                />
              </div>

              <div className="form-group">
                <label>PMDC Registration Number</label>
                <input
                  type="text"
                  value={pmdcNumber}
                  onChange={(e) => setPmdcNumber(e.target.value)}
                  disabled={!editMode || isSelfSupervisor}
                />
              </div>

              <div className="form-group">
                <label>Primary Specialty</label>
                <input
                  type="text"
                  value={specialtyName}
                  onChange={(e) => setSpecialtyName(e.target.value)}
                  disabled={!editMode || isSelfSupervisor}
                />
              </div>

              <div className="form-group">
                <label>Sub-specialty Name</label>
                <input
                  type="text"
                  value={subspecialtyName}
                  onChange={(e) => setSubspecialtyName(e.target.value)}
                  disabled={!editMode || isSelfSupervisor}
                />
              </div>
            </div>
          </div>

          {/* Section: Institutional Scope */}
          <div className="form-section">
            <h3 className="section-title">Hospital & Dept Details / Master references</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Hospital / Training Site *</label>
                {editMode && !isSelfSupervisor ? (
                  <select
                    value={trainingSiteRef}
                    onChange={(e) => {
                      const val = e.target.value;
                      setTrainingSiteRef(val);
                      const selected = options.hospitals.find(h => h.id.toString() === val);
                      setInstitutionName(selected ? selected.name : "");
                    }}
                  >
                    <option value="">Select Hospital</option>
                    {options.hospitals.map(h => (
                      <option key={h.id} value={h.id}>{h.name}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={profile?.training_site_ref_detail?.name || institutionName || "N/A"}
                    disabled
                  />
                )}
              </div>

              <div className="form-group">
                <label>Department / Discipline *</label>
                {editMode && !isSelfSupervisor ? (
                  <select
                    value={departmentRef}
                    onChange={(e) => {
                      const val = e.target.value;
                      setDepartmentRef(val);
                      const selected = options.departments.find(d => d.id.toString() === val);
                      setDepartmentName(selected ? selected.name : "");
                    }}
                  >
                    <option value="">Select Department / Discipline</option>
                    {options.departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={profile?.department_ref_detail?.name || departmentName || "N/A"}
                    disabled
                  />
                )}
              </div>

              <div className="form-group">
                <label>Associated Program (Optional)</label>
                {editMode && !isSelfSupervisor ? (
                  <select
                    value={programRef}
                    onChange={(e) => {
                      const val = e.target.value;
                      setProgramRef(val);
                      const selected = options.programs.find(p => p.id.toString() === val);
                      setProgramName(selected ? selected.name : "");
                    }}
                  >
                    <option value="">Select Program</option>
                    {options.programs.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={profile?.program_ref_detail?.name || programName || "N/A"}
                    disabled
                  />
                )}
              </div>

              <div className="form-group">
                <label>Institution (Optional)</label>
                {editMode && !isSelfSupervisor ? (
                  <select
                    value={institutionRef}
                    onChange={(e) => {
                      const val = e.target.value;
                      setInstitutionRef(val);
                    }}
                  >
                    <option value="">Select Institution</option>
                    {options.institutions.map(i => (
                      <option key={i.id} value={i.id}>{i.name}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={profile?.institution_ref_detail?.name || "N/A"}
                    disabled
                  />
                )}
              </div>
            </div>
          </div>

          {/* Section: Availability & Alternate Contacts */}
          <div className="form-section">
            <h3 className="section-title">Office & Availability</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Alternate Phone</label>
                <input
                  type="tel"
                  value={alternatePhone}
                  onChange={(e) => setAlternatePhone(e.target.value)}
                  disabled={!editMode}
                />
              </div>

              <div className="form-group">
                <label>Office / Room ID</label>
                <input
                  type="text"
                  value={roomOrOffice}
                  onChange={(e) => setRoomOrOffice(e.target.value)}
                  disabled={!editMode}
                />
              </div>

              <div className="form-group full-width">
                <label>Availability & Office Hours Notes</label>
                <textarea
                  value={availabilityNotes}
                  onChange={(e) => setAvailabilityNotes(e.target.value)}
                  disabled={!editMode}
                  rows={2}
                />
              </div>
            </div>
          </div>

          {/* Section: Supervision Capacity */}
          <div className="form-section">
            <h3 className="section-title">Supervision Status & Capacity</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Status</label>
                <select
                  value={supervisionStatus}
                  onChange={(e) => setSupervisionStatus(e.target.value)}
                  disabled={!editMode || isSelfSupervisor}
                >
                  <option value="ACTIVE">Active</option>
                  <option value="ON_LEAVE">On Leave</option>
                  <option value="RETIRED">Retired</option>
                  <option value="TRANSFERRED">Transferred</option>
                  <option value="SUSPENDED">Suspended</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>

              <div className="form-group">
                <label>Max Active Residents Quota</label>
                <input
                  type="number"
                  value={maxActiveResidents}
                  onChange={(e) => setMaxActiveResidents(Number(e.target.value))}
                  disabled={!editMode || isSelfSupervisor}
                  min={1}
                />
              </div>

              <div className="form-group">
                <label>Clinical Training Supervision</label>
                <select
                  value={canSuperviseClinicalTraining ? "yes" : "no"}
                  onChange={(e) => setCanSuperviseClinicalTraining(e.target.value === "yes")}
                  disabled={!editMode || isSelfSupervisor}
                >
                  <option value="yes">Yes (Authorized)</option>
                  <option value="no">No (Restricted)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Thesis supervision</label>
                <select
                  value={canSuperviseThesis ? "yes" : "no"}
                  onChange={(e) => setCanSuperviseThesis(e.target.value === "yes")}
                  disabled={!editMode || isSelfSupervisor}
                >
                  <option value="no">No (Restricted)</option>
                  <option value="yes">Yes (Authorized)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section: Notes */}
          {!isSelfSupervisor && (
            <div className="form-section">
              <h3 className="section-title">Administrative Notes</h3>
              <div className="form-group full-width">
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={!editMode}
                  rows={2}
                />
              </div>
            </div>
          )}

          {/* Save/Submit bar inside edit mode */}
          {editMode && (
            <div className="actions-bar">
              <button
                type="button"
                onClick={() => { setEditMode(false); if (profile) populateFields(profile); }}
                className="btn-cancel"
                disabled={submitting}
              >
                Discard Changes
              </button>
              <button type="submit" className="btn-submit" disabled={submitting}>
                {submitting ? "Saving Changes..." : "Save Changes"}
              </button>
            </div>
          )}
        </form>

        {/* Extra Panels (Admin Only): Archive & Password Reset */}
        {!editMode && !isSelfSupervisor && (
          <div className="admin-extra-section">
            
            {/* Archive / Delete card */}
            {canArchive && (
              <div className="admin-card card-archive">
                <h4 className="card-title">Archive Record</h4>
                <p className="card-desc">
                  {profile?.is_archived
                    ? "Restore this supervisor profile record and re-enable their username login access to the PGMS portal."
                    : "Archiving hides the supervisor profile from list views, flags it as archived, and disables their login account."}
                </p>
                <button
                  onClick={handleArchiveToggle}
                  className={profile?.is_archived ? "btn-restore-action" : "btn-archive-action"}
                >
                  {profile?.is_archived ? "Unarchive & Restore Account" : "Archive Supervisor & Block Login"}
                </button>
              </div>
            )}

            {/* Password Reset card */}
            {canResetPass && (
              <div className="admin-card card-reset">
                <h4 className="card-title">Reset Supervisor Password</h4>
                <p className="card-desc">{"Force reset the supervisor's password. They will be prompted to change it upon their next login."}</p>
                <form onSubmit={handlePasswordReset} className="reset-inline-form">
                  <input
                    type="password"
                    placeholder="Enter new temporary password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                  <button type="submit" className="btn-reset-action" disabled={resettingPassword}>
                    {resettingPassword ? "Resetting..." : "Reset"}
                  </button>
                </form>
              </div>
            )}
          </div>
        )}

        <div className="panel-footer">
          <Link href="/supervisors" className="btn-back">
            ← Back to Supervisor Directory
          </Link>
        </div>

      </div>

      <style jsx>{`
        .supervisors-shell {
          padding-top: 2rem;
          place-items: start center;
        }
        .detail-panel {
          width: min(850px, 100%);
          border-radius: 24px;
        }
        .header-zone {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1.5rem;
          margin-bottom: 2.5rem;
          flex-wrap: wrap;
          border-bottom: 1px solid var(--border);
          padding-bottom: 1.5rem;
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
        .btn-edit-mode {
          background: var(--text);
          color: var(--bg);
          border: none;
          padding: 0.65rem 1.25rem;
          border-radius: 10px;
          font-size: 0.85rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .btn-edit-mode:hover {
          background: var(--accent);
          transform: translateY(-1px);
        }
        .btn-cancel-edit {
          background: rgba(255, 255, 255, 0.05);
          color: var(--text);
          border: 1px solid var(--border);
          padding: 0.65rem 1.25rem;
          border-radius: 10px;
          font-size: 0.85rem;
          font-weight: 700;
          cursor: pointer;
        }
        .alert {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem;
          border-radius: 12px;
          margin-bottom: 2rem;
          font-size: 0.85rem;
        }
        .alert-error {
          background: rgba(255, 100, 100, 0.08);
          border: 1px solid rgba(255, 100, 100, 0.2);
          color: #ff9999;
        }
        .alert-success {
          background: rgba(100, 255, 100, 0.08);
          border: 1px solid rgba(100, 255, 100, 0.2);
          color: #99ff99;
        }
        .alert-archived-banner {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: var(--muted);
        }
        .supervisor-form {
          display: flex;
          flex-direction: column;
          gap: 2.5rem;
        }
        .form-section {
          border-bottom: 1px solid var(--border);
          padding-bottom: 2rem;
        }
        .form-section:last-of-type {
          border-bottom: none;
          padding-bottom: 0;
        }
        .section-title {
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--accent);
          margin: 0 0 1.25rem;
          letter-spacing: -0.01em;
        }
        .form-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.25rem;
        }
        @media (min-width: 600px) {
          .form-grid {
            grid-template-columns: 1fr 1fr;
          }
          .full-width {
            grid-column: span 2;
          }
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }
        .form-group label {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--muted);
        }
        .form-group input,
        .form-group select,
        .form-group textarea {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border);
          color: var(--text);
          padding: 0.65rem 0.9rem;
          border-radius: 10px;
          font-size: 0.9rem;
          outline: none;
          transition: all 0.2s ease;
          width: 100%;
        }
        .form-group textarea {
          resize: vertical;
          font-family: inherit;
        }
        .form-group input:disabled,
        .form-group select:disabled,
        .form-group textarea:disabled {
          background: rgba(255, 255, 255, 0.01);
          border-color: rgba(255, 255, 255, 0.05);
          color: rgba(245, 247, 255, 0.5);
          cursor: not-allowed;
        }
        .form-group select option {
          background: #0a1020;
          color: var(--text);
        }
        .form-group input:focus:not(:disabled),
        .form-group select:focus:not(:disabled),
        .form-group textarea:focus:not(:disabled) {
          border-color: var(--accent);
          background: rgba(255, 255, 255, 0.05);
          box-shadow: 0 0 0 4px rgba(143, 211, 255, 0.15);
        }
        .actions-bar {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 1rem;
          border-top: 1px solid var(--border);
          padding-top: 2rem;
          margin-top: 1rem;
        }
        .btn-cancel {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--border);
          color: var(--muted);
          padding: 0.7rem 1.5rem;
          border-radius: 12px;
          font-size: 0.9rem;
          font-weight: 700;
          cursor: pointer;
        }
        .btn-submit {
          background: var(--text);
          color: var(--bg);
          border: none;
          padding: 0.7rem 1.5rem;
          border-radius: 12px;
          font-size: 0.9rem;
          font-weight: 700;
          cursor: pointer;
        }
        .btn-submit:hover:not(:disabled) {
          background: var(--accent);
        }
        .admin-extra-section {
          margin-top: 3rem;
          border-top: 1px solid var(--border);
          padding-top: 2rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .admin-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 1.5rem;
        }
        .card-title {
          font-size: 1rem;
          font-weight: 700;
          margin: 0 0 0.5rem;
        }
        .card-desc {
          font-size: 0.85rem;
          color: var(--muted);
          margin: 0 0 1.25rem;
          line-height: 1.4;
        }
        .btn-archive-action {
          background: rgba(255, 100, 100, 0.1);
          border: 1px solid rgba(255, 100, 100, 0.2);
          color: #ff8888;
          padding: 0.6rem 1.2rem;
          border-radius: 8px;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .btn-archive-action:hover {
          background: rgba(255, 100, 100, 0.2);
          border-color: rgba(255, 100, 100, 0.4);
        }
        .btn-restore-action {
          background: rgba(100, 255, 100, 0.1);
          border: 1px solid rgba(100, 255, 100, 0.2);
          color: #88ff88;
          padding: 0.6rem 1.2rem;
          border-radius: 8px;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .btn-restore-action:hover {
          background: rgba(100, 255, 100, 0.2);
          border-color: rgba(100, 255, 100, 0.4);
        }
        .reset-inline-form {
          display: flex;
          gap: 0.75rem;
          max-width: 480px;
        }
        .reset-inline-form input {
          flex: 1;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 0.5rem 0.75rem;
          color: var(--text);
          font-size: 0.85rem;
          outline: none;
        }
        .reset-inline-form input:focus {
          border-color: var(--accent);
        }
        .btn-reset-action {
          background: rgba(255, 255, 255, 0.08);
          color: var(--text);
          border: 1px solid var(--border);
          padding: 0.5rem 1rem;
          border-radius: 8px;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .btn-reset-action:hover {
          background: rgba(255, 255, 255, 0.12);
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
        .panel-footer {
          margin-top: 2rem;
          border-top: 1px solid var(--border);
          padding-top: 1.5rem;
        }
        .btn-back {
          text-decoration: none;
          font-size: 0.85rem;
          color: var(--muted);
          transition: color 0.2s ease;
        }
        .btn-back:hover {
          color: var(--text);
        }
      `}</style>
    </div>
  );
}
