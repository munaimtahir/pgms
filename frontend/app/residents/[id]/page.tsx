"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { apiRequest, ResidentProfile } from "../../../lib/api";
import { useAuth } from "../../context";

export default function ResidentDetailPage() {
  const router = useRouter();
  const { id } = useParams();
  const { user: currentUser } = useAuth();

  const [profile, setProfile] = useState<ResidentProfile | null>(null);
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

  const [fatherName, setFatherName] = useState("");
  const [cnicOrPassport, setCnicOrPassport] = useState("");
  const [gender, setGender] = useState("MALE");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [alternateEmail, setAlternateEmail] = useState("");
  const [address, setAddress] = useState("");

  const [programName, setProgramName] = useState("");
  const [specialtyName, setSpecialtyName] = useState("");
  const [trainingLevel, setTrainingLevel] = useState("");
  const [trainingYear, setTrainingYear] = useState("");
  const [sessionYear, setSessionYear] = useState("");
  const [dateOfJoining, setDateOfJoining] = useState("");
  const [expectedCompletionDate, setExpectedCompletionDate] = useState("");
  const [institutionName, setInstitutionName] = useState("");
  const [departmentName, setDepartmentName] = useState("");
  const [currentStatus, setCurrentStatus] = useState("ACTIVE");

  const [institutionRef, setInstitutionRef] = useState("");
  const [trainingSiteRef, setTrainingSiteRef] = useState("");
  const [departmentRef, setDepartmentRef] = useState("");
  const [programRef, setProgramRef] = useState("");
  const [academicSessionRef, setAcademicSessionRef] = useState("");

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

  const [pmdcNumber, setPmdcNumber] = useState("");
  const [universityRegistrationNumber, setUniversityRegistrationNumber] = useState("");
  const [employeeOrTrainingId, setEmployeeOrTrainingId] = useState("");

  const [emergencyContactName, setEmergencyContactName] = useState("");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState("");
  const [emergencyContactRelation, setEmergencyContactRelation] = useState("");

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
      const res = await apiRequest(`/residents/${id}/`);
      const data = await res.json();
      if (res.status === 200) {
        setProfile(data);
        populateFields(data);
      } else {
        setError(data.detail || "Resident profile not found.");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const populateFields = (data: ResidentProfile) => {
    setFullName(data.user.full_name);
    setPhone(data.user.phone);
    setEmail(data.user.email || "");
    setIsActive(data.user.is_active);

    setFatherName(data.father_name);
    setCnicOrPassport(data.cnic_or_passport);
    setGender(data.gender);
    setDateOfBirth(data.date_of_birth || "");
    setWhatsappNumber(data.whatsapp_number);
    setAlternateEmail(data.alternate_email || "");
    setAddress(data.address);

    setProgramName(data.program_name);
    setSpecialtyName(data.specialty_name);
    setTrainingLevel(data.training_level);
    setTrainingYear(data.training_year);
    setSessionYear(data.session_year);
    setDateOfJoining(data.date_of_joining || "");
    setExpectedCompletionDate(data.expected_completion_date || "");
    setInstitutionName(data.institution_name);
    setDepartmentName(data.department_name);
    setCurrentStatus(data.current_status);

    setInstitutionRef(data.institution_ref ? data.institution_ref.toString() : "");
    setTrainingSiteRef(data.training_site_ref ? data.training_site_ref.toString() : "");
    setDepartmentRef(data.department_ref ? data.department_ref.toString() : "");
    setProgramRef(data.program_ref ? data.program_ref.toString() : "");
    setAcademicSessionRef(data.academic_session_ref ? data.academic_session_ref.toString() : "");

    setPmdcNumber(data.pmdc_number || "");
    setUniversityRegistrationNumber(data.university_registration_number);
    setEmployeeOrTrainingId(data.employee_or_training_id);

    setEmergencyContactName(data.emergency_contact_name);
    setEmergencyContactPhone(data.emergency_contact_phone);
    setEmergencyContactRelation(data.emergency_contact_relation);

    setNotes(data.notes);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);

    // Map roles: RESIDENT can edit limited fields.
    // Admin / Support Staff can edit more fields.
    const isSelfResident = currentUser?.user_category === "RESIDENT";

    const payload: any = {
      father_name: fatherName,
      whatsapp_number: whatsappNumber,
      alternate_email: alternateEmail || null,
      address: address,
      emergency_contact_name: emergencyContactName,
      emergency_contact_phone: emergencyContactPhone,
      emergency_contact_relation: emergencyContactRelation,
    };

    if (!isSelfResident) {
      payload.cnic_or_passport = cnicOrPassport;
      payload.gender = gender;
      payload.date_of_birth = dateOfBirth || null;
      payload.program_name = programName;
      payload.specialty_name = specialtyName;
      payload.training_level = trainingLevel;
      payload.training_year = trainingYear;
      payload.session_year = sessionYear;
      payload.date_of_joining = dateOfJoining || null;
      payload.expected_completion_date = expectedCompletionDate || null;
      payload.institution_name = institutionName;
      payload.department_name = departmentName;
      payload.current_status = currentStatus;
      payload.pmdc_number = pmdcNumber || null;
      payload.university_registration_number = universityRegistrationNumber;
      payload.employee_or_training_id = employeeOrTrainingId;
      payload.notes = notes;

      payload.training_site_ref = trainingSiteRef ? Number(trainingSiteRef) : null;
      payload.department_ref = departmentRef ? Number(departmentRef) : null;
      payload.program_ref = programRef ? Number(programRef) : null;
      payload.academic_session_ref = academicSessionRef ? Number(academicSessionRef) : null;
      payload.institution_ref = institutionRef ? Number(institutionRef) : null;

      // Check user edits
      payload["user.full_name"] = fullName;
      payload["user.phone"] = phone;
      payload["user.email"] = email || null;
      payload["user.is_active"] = isActive;
    } else {
      // If resident edits contact information, update corresponding User values
      payload["user.phone"] = whatsappNumber;
      payload["user.email"] = alternateEmail || null;
    }

    try {
      const res = await apiRequest(`/residents/${id}/`, {
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
      ? `Are you sure you want to restore/unarchive resident ${profile.user.full_name}?`
      : `Are you sure you want to archive resident ${profile.user.full_name}? This will disable their account access.`;

    if (!confirm(confirmMsg)) return;

    try {
      let res;
      if (profile.is_archived) {
        res = await apiRequest(`/residents/${profile.id}/unarchive/`, { method: "POST" });
      } else {
        res = await apiRequest(`/residents/${profile.id}/`, { method: "DELETE" });
      }

      if (res.status === 200) {
        setSuccess(profile.is_archived ? "Resident restored successfully!" : "Resident archived successfully!");
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
        setSuccess("Password reset successfully. The resident must change it on their next login.");
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
          <p>Fetching resident profile details...</p>
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
          <Link href="/residents" className="btn-back">Back to Directory</Link>
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

  const isSelfResident = currentUser?.user_category === "RESIDENT";
  const canArchive = currentUser?.user_category === "UTRMC_ADMIN";
  const canResetPass = currentUser?.user_category === "UTRMC_ADMIN";

  return (
    <div className="shell residents-shell">
      <div className="panel detail-panel">
        
        {/* Header Zone */}
        <div className="header-zone">
          <div className="title-area">
            <p className="eyebrow">Resident Details</p>
            <h2 className="title">{profile?.user.full_name || profile?.user.username}</h2>
            <p className="subtitle">@{profile?.user.username} — ID #{profile?.id}</p>
          </div>
          <div className="header-actions">
            {!editMode ? (
              <button onClick={() => setEditMode(true)} className="btn-edit-mode">
                Edit Profile
              </button>
            ) : (
              <button onClick={() => { setEditMode(false); if (profile) populateFields(profile); }} className="btn-cancel-edit">
                Cancel
              </button>
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
            <span className="alert-message">This resident record is archived. Their login account is disabled.</span>
          </div>
        )}

        <form onSubmit={handleUpdate} className="resident-form">
          
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
                  disabled={!editMode || isSelfResident}
                  required
                />
              </div>

              <div className="form-group">
                <label>Account Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={!editMode || isSelfResident}
                />
              </div>

              <div className="form-group">
                <label>Primary Phone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={!editMode || isSelfResident}
                />
              </div>

              {!isSelfResident && (
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

          {/* Section: Personal Profile Details */}
          <div className="form-section">
            <h3 className="section-title">Personal Details</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>{"Father's Name"}</label>
                <input
                  type="text"
                  value={fatherName}
                  onChange={(e) => setFatherName(e.target.value)}
                  disabled={!editMode}
                />
              </div>

              <div className="form-group">
                <label>CNIC or Passport</label>
                <input
                  type="text"
                  value={cnicOrPassport}
                  onChange={(e) => setCnicOrPassport(e.target.value)}
                  disabled={!editMode || isSelfResident}
                  required
                />
              </div>

              <div className="form-group">
                <label>Gender</label>
                <select value={gender} onChange={(e) => setGender(e.target.value)} disabled={!editMode || isSelfResident}>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label>Date of Birth</label>
                <input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  disabled={!editMode || isSelfResident}
                />
              </div>

              <div className="form-group">
                <label>WhatsApp Number</label>
                <input
                  type="tel"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  disabled={!editMode}
                />
              </div>

              <div className="form-group">
                <label>Alternate Email</label>
                <input
                  type="email"
                  value={alternateEmail}
                  onChange={(e) => setAlternateEmail(e.target.value)}
                  disabled={!editMode}
                />
              </div>

              <div className="form-group full-width">
                <label>Address</label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  disabled={!editMode}
                  rows={2}
                />
              </div>
            </div>
          </div>

          {/* Section: Academic/Training details */}
          <div className="form-section">
            <h3 className="section-title">Academic & Training Details</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Program Name</label>
                <input
                  type="text"
                  value={programName}
                  onChange={(e) => setProgramName(e.target.value)}
                  disabled={!editMode || isSelfResident}
                />
              </div>

              <div className="form-group">
                <label>Specialty Name</label>
                <input
                  type="text"
                  value={specialtyName}
                  onChange={(e) => setSpecialtyName(e.target.value)}
                  disabled={!editMode || isSelfResident}
                />
              </div>

              <div className="form-group">
                <label>Training Level</label>
                <input
                  type="text"
                  value={trainingLevel}
                  onChange={(e) => setTrainingLevel(e.target.value)}
                  disabled={!editMode || isSelfResident}
                />
              </div>

              <div className="form-group">
                <label>Training Year</label>
                <input
                  type="text"
                  value={trainingYear}
                  onChange={(e) => setTrainingYear(e.target.value)}
                  disabled={!editMode || isSelfResident}
                />
              </div>

              <div className="form-group">
                <label>Session / Year</label>
                <input
                  type="text"
                  value={sessionYear}
                  onChange={(e) => setSessionYear(e.target.value)}
                  disabled={!editMode || isSelfResident}
                />
              </div>

              <div className="form-group">
                <label>Date of Joining</label>
                <input
                  type="date"
                  value={dateOfJoining}
                  onChange={(e) => setDateOfJoining(e.target.value)}
                  disabled={!editMode || isSelfResident}
                />
              </div>

              <div className="form-group">
                <label>Expected Completion</label>
                <input
                  type="date"
                  value={expectedCompletionDate}
                  onChange={(e) => setExpectedCompletionDate(e.target.value)}
                  disabled={!editMode || isSelfResident}
                />
              </div>

              <div className="form-group">
                <label>Current Status</label>
                <select
                  value={currentStatus}
                  onChange={(e) => setCurrentStatus(e.target.value)}
                  disabled={!editMode || isSelfResident}
                >
                  <option value="ACTIVE">Active</option>
                  <option value="ON_LEAVE">On Leave</option>
                  <option value="TRANSFERRED">Transferred</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="DROPPED">Dropped</option>
                  <option value="SUSPENDED">Suspended</option>
                  <option value="UNKNOWN">Unknown</option>
                </select>
              </div>

              <div className="form-group">
                <label>Hospital / Institution (Text)</label>
                <input
                  type="text"
                  value={institutionName}
                  onChange={(e) => setInstitutionName(e.target.value)}
                  disabled={!editMode || isSelfResident}
                />
              </div>

              <div className="form-group">
                <label>Department Name (Text)</label>
                <input
                  type="text"
                  value={departmentName}
                  onChange={(e) => setDepartmentName(e.target.value)}
                  disabled={!editMode || isSelfResident}
                />
              </div>
            </div>
          </div>

          {/* Section: Medical IDs */}
          <div className="form-section">
            <h3 className="section-title">Medical Registrations</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>PMDC Registration Number</label>
                <input
                  type="text"
                  value={pmdcNumber}
                  onChange={(e) => setPmdcNumber(e.target.value)}
                  disabled={!editMode || isSelfResident}
                />
              </div>

              <div className="form-group">
                <label>University Reg Number</label>
                <input
                  type="text"
                  value={universityRegistrationNumber}
                  onChange={(e) => setUniversityRegistrationNumber(e.target.value)}
                  disabled={!editMode || isSelfResident}
                />
              </div>

              <div className="form-group">
                <label>Employee / Training ID</label>
                <input
                  type="text"
                  value={employeeOrTrainingId}
                  onChange={(e) => setEmployeeOrTrainingId(e.target.value)}
                  disabled={!editMode || isSelfResident}
                />
              </div>
            </div>
          </div>

          {/* Section: Emergency Contact */}
          <div className="form-section">
            <h3 className="section-title">Emergency Contact</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Contact Person Name</label>
                <input
                  type="text"
                  value={emergencyContactName}
                  onChange={(e) => setEmergencyContactName(e.target.value)}
                  disabled={!editMode}
                />
              </div>

              <div className="form-group">
                <label>Contact Phone</label>
                <input
                  type="tel"
                  value={emergencyContactPhone}
                  onChange={(e) => setEmergencyContactPhone(e.target.value)}
                  disabled={!editMode}
                />
              </div>

              <div className="form-group">
                <label>Relationship</label>
                <input
                  type="text"
                  value={emergencyContactRelation}
                  onChange={(e) => setEmergencyContactRelation(e.target.value)}
                  disabled={!editMode}
                />
              </div>
            </div>
          </div>

          {/* Section: Administrative Notes */}
          {!isSelfResident && (
            <div className="form-section">
              <h3 className="section-title">Administrative Notes</h3>
              <div className="form-group full-width">
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={!editMode}
                  rows={3}
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
        {!editMode && !isSelfResident && (
          <div className="admin-extra-section">
            
            {/* Archive / Delete card */}
            {canArchive && (
              <div className="admin-card card-archive">
                <h4 className="card-title">Archive Record</h4>
                <p className="card-desc">
                  {profile?.is_archived
                    ? "Restore this resident profile record and re-enable their username login access to the PGMS portal."
                    : "Archiving hides the resident profile from list views, flags it as archived, and disables their username login access."}
                </p>
                <button
                  onClick={handleArchiveToggle}
                  className={profile?.is_archived ? "btn-restore-action" : "btn-archive-action"}
                >
                  {profile?.is_archived ? "Unarchive & Restore Account" : "Archive Resident & Block Login"}
                </button>
              </div>
            )}

            {/* Password Reset card */}
            {canResetPass && (
              <div className="admin-card card-reset">
                <h4 className="card-title">Reset Resident Password</h4>
                <p className="card-desc">{"Force reset the user's password. They will be prompted to change it upon their next login."}</p>
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
          <Link href="/residents" className="btn-back">
            ← Back to Resident Directory
          </Link>
        </div>

      </div>

      <style jsx>{`
        .residents-shell {
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
        .resident-form {
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
