"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiRequest } from "../../../lib/api";

export default function NewSupervisorPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

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

  React.useEffect(() => {
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

  // Duplicate Check Warnings
  const [dupWarnings, setDupWarnings] = useState<Record<string, string>>({});
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);

  const runDuplicateCheck = async () => {
    if (!username) return;
    setCheckingDuplicates(true);
    try {
      const res = await apiRequest("/supervisors/check-duplicates/", {
        method: "POST",
        body: JSON.stringify({
          username,
          email: email || null,
          pmdc_number: pmdcNumber || null,
        }),
      });
      if (res.status === 200) {
        const data = await res.json();
        if (data.has_duplicates) {
          setDupWarnings(data.duplicates);
        } else {
          setDupWarnings({});
        }
      }
    } catch (err) {
      console.error("Duplicate check error:", err);
    } finally {
      setCheckingDuplicates(false);
    }
  };

  const handleBlur = () => {
    runDuplicateCheck();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !fullName || !phone || !trainingSiteRef || !departmentRef || !designationRef) {
      setError("Please fill in all required fields and selections (Username, Full Name, Contact Phone, Hospital, Department / Discipline, and Designation).");
      return;
    }

    setError(null);
    setSubmitting(true);

    const payload = {
      username,
      email: email || null,
      full_name: fullName,
      phone,
      password: password || null,
      designation,
      qualification,
      pmdc_number: pmdcNumber || null,
      specialty_name: specialtyName,
      subspecialty_name: subspecialtyName,
      institution_name: institutionName,
      department_name: departmentName,
      program_name: programName,
      alternate_phone: alternatePhone,
      room_or_office: roomOrOffice,
      availability_notes: availabilityNotes,
      supervision_status: supervisionStatus,
      max_active_residents: Number(maxActiveResidents),
      can_supervise_thesis: canSuperviseThesis,
      can_supervise_clinical_training: canSuperviseClinicalTraining,
      notes,

      training_site_ref: Number(trainingSiteRef),
      department_ref: Number(departmentRef),
      designation_ref: Number(designationRef),
      program_ref: programRef ? Number(programRef) : null,
      institution_ref: institutionRef ? Number(institutionRef) : null,
    };

    try {
      const res = await apiRequest("/supervisors/", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.status === 201) {
        router.push("/supervisors");
      } else {
        let msg = "Failed to create supervisor profile.";
        if (data.username) msg = `Username: ${data.username[0]}`;
        else if (data.email) msg = `Email: ${data.email[0]}`;
        else if (data.pmdc_number) msg = `PMDC: ${data.pmdc_number[0]}`;
        else if (data.detail) msg = data.detail;
        else if (typeof data === "object") {
          const keys = Object.keys(data);
          if (keys.length > 0) {
            msg = `${keys[0]}: ${data[keys[0]][0]}`;
          }
        }
        setError(msg);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="shell supervisors-shell">
      <div className="panel form-panel">
        <div className="header-zone">
          <p className="eyebrow">Directory</p>
          <h2 className="title">New Supervisor Registration</h2>
          <p className="subtitle">Atomically create a login account and professional profile.</p>
        </div>

        {error && (
          <div className="alert alert-error">
            <span className="alert-icon">⚠️</span>
            <span className="alert-message">{error}</span>
          </div>
        )}

        {Object.keys(dupWarnings).length > 0 && (
          <div className="alert alert-warning">
            <span className="alert-icon">⚠️</span>
            <div className="alert-content">
              <strong>Potential duplicates detected:</strong>
              <ul>
                {Object.entries(dupWarnings).map(([key, val]) => (
                  <li key={key}>{key.replace("_", " ").toUpperCase()}: {val}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="supervisor-form">
          
          {/* Section: User Account Info */}
          <div className="form-section">
            <h3 className="section-title">1. User Account Setup</h3>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="username">Username (Login ID) *</label>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onBlur={handleBlur}
                  placeholder="e.g. prof.john"
                  required
                />
                <p className="hint">Must be unique. Default temporary password matches the username.</p>
              </div>

              <div className="form-group">
                <label htmlFor="password">Custom Password (Optional)</label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Leave empty for default"
                />
              </div>

              <div className="form-group">
                <label htmlFor="fullName">Full Name *</label>
                <input
                  type="text"
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Dr. John Doe"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="phone">Contact Phone *</label>
                <input
                  type="tel"
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 03001234567"
                  required
                />
              </div>

              <div className="form-group full-width">
                <label htmlFor="email">Official Email</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={handleBlur}
                  placeholder="e.g. john.doe@institution.edu"
                />
                <p className="hint">Primary institutional contact email.</p>
              </div>
            </div>
          </div>

          {/* Section: Professional Details */}
          <div className="form-section">
            <h3 className="section-title">2. Professional Details</h3>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="designation">Designation *</label>
                <select
                  id="designation"
                  value={designationRef}
                  onChange={(e) => {
                    const val = e.target.value;
                    setDesignationRef(val);
                    const selected = options.designations.find(d => d.id.toString() === val);
                    setDesignation(selected ? selected.name : "");
                  }}
                  required
                >
                  <option value="">Select Designation</option>
                  {options.designations.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="qualification">Qualification Details</label>
                <input
                  type="text"
                  id="qualification"
                  value={qualification}
                  onChange={(e) => setQualification(e.target.value)}
                  placeholder="e.g. MBBS, FCPS (Surgery)"
                />
              </div>

              <div className="form-group">
                <label htmlFor="pmdc">PMDC Number</label>
                <input
                  type="text"
                  id="pmdc"
                  value={pmdcNumber}
                  onChange={(e) => setPmdcNumber(e.target.value)}
                  onBlur={handleBlur}
                  placeholder="e.g. 12345-S"
                />
                <p className="hint">Must be unique if specified.</p>
              </div>

              <div className="form-group">
                <label htmlFor="specialty">Primary Specialty</label>
                <input
                  type="text"
                  id="specialty"
                  value={specialtyName}
                  onChange={(e) => setSpecialtyName(e.target.value)}
                  placeholder="e.g. Cardiology"
                />
              </div>

              <div className="form-group">
                <label htmlFor="subspecialty">Sub-specialty Name</label>
                <input
                  type="text"
                  id="subspecialty"
                  value={subspecialtyName}
                  onChange={(e) => setSubspecialtyName(e.target.value)}
                  placeholder="e.g. Interventional Cardiology"
                />
              </div>
            </div>
          </div>

          {/* Section: Institutional Scope */}
          <div className="form-section">
            <h3 className="section-title">3. Department & Institution / Master references</h3>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="hospitalSelect">Hospital / Training Site *</label>
                <select
                  id="hospitalSelect"
                  value={trainingSiteRef}
                  onChange={(e) => {
                    const val = e.target.value;
                    setTrainingSiteRef(val);
                    const selected = options.hospitals.find(h => h.id.toString() === val);
                    setInstitutionName(selected ? selected.name : "");
                  }}
                  required
                >
                  <option value="">Select Hospital</option>
                  {options.hospitals.map(h => (
                    <option key={h.id} value={h.id}>{h.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="departmentSelect">Department / Discipline *</label>
                <select
                  id="departmentSelect"
                  value={departmentRef}
                  onChange={(e) => {
                    const val = e.target.value;
                    setDepartmentRef(val);
                    const selected = options.departments.find(d => d.id.toString() === val);
                    setDepartmentName(selected ? selected.name : "");
                  }}
                  required
                >
                  <option value="">Select Department / Discipline</option>
                  {options.departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="programSelect">Program (Optional)</label>
                <select
                  id="programSelect"
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
              </div>

              <div className="form-group">
                <label htmlFor="institutionSelect">Institution (Optional)</label>
                <select
                  id="institutionSelect"
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
              </div>
            </div>
          </div>

          {/* Section: Professional Contacts */}
          <div className="form-section">
            <h3 className="section-title">4. Offices & Alternative Contacts</h3>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="altPhone">Alternate Contact Phone</label>
                <input
                  type="tel"
                  id="altPhone"
                  value={alternatePhone}
                  onChange={(e) => setAlternatePhone(e.target.value)}
                  placeholder="e.g. 03009988776"
                />
              </div>

              <div className="form-group">
                <label htmlFor="room">Room or Office ID</label>
                <input
                  type="text"
                  id="room"
                  value={roomOrOffice}
                  onChange={(e) => setRoomOrOffice(e.target.value)}
                  placeholder="e.g. Room 405, OPD Block"
                />
              </div>

              <div className="form-group full-width">
                <label htmlFor="availability">Availability Notes</label>
                <textarea
                  id="availability"
                  value={availabilityNotes}
                  onChange={(e) => setAvailabilityNotes(e.target.value)}
                  placeholder="e.g. Available Mon-Thu 9:00 AM - 1:00 PM..."
                  rows={2}
                />
              </div>
            </div>
          </div>

          {/* Section: Supervision Capacity */}
          <div className="form-section">
            <h3 className="section-title">5. Supervision Status & Capacity</h3>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="status">Supervision Status</label>
                <select id="status" value={supervisionStatus} onChange={(e) => setSupervisionStatus(e.target.value)}>
                  <option value="ACTIVE">Active</option>
                  <option value="ON_LEAVE">On Leave</option>
                  <option value="RETIRED">Retired</option>
                  <option value="TRANSFERRED">Transferred</option>
                  <option value="SUSPENDED">Suspended</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="maxResidents">Max Active Residents (Quota)</label>
                <input
                  type="number"
                  id="maxResidents"
                  value={maxActiveResidents}
                  onChange={(e) => setMaxActiveResidents(Number(e.target.value))}
                  min={1}
                  max={20}
                />
              </div>

              <div className="form-group">
                <label>Clinical Training Supervisor?</label>
                <select
                  value={canSuperviseClinicalTraining ? "yes" : "no"}
                  onChange={(e) => setCanSuperviseClinicalTraining(e.target.value === "yes")}
                >
                  <option value="yes">Yes (Permitted)</option>
                  <option value="no">No (Restricted)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Thesis Supervisor?</label>
                <select
                  value={canSuperviseThesis ? "yes" : "no"}
                  onChange={(e) => setCanSuperviseThesis(e.target.value === "yes")}
                >
                  <option value="no">No (Restricted)</option>
                  <option value="yes">Yes (Permitted)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section: Notes & Comments */}
          <div className="form-section">
            <h3 className="section-title">6. Administrative Notes</h3>
            <div className="form-group full-width">
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any administrative details, academic remarks, or history..."
                rows={3}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="actions-bar">
            <Link href="/supervisors" className="btn-cancel">
              Cancel
            </Link>
            <button type="submit" className="btn-submit" disabled={submitting || checkingDuplicates}>
              {submitting ? "Registering Supervisor..." : "Register Supervisor"}
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .supervisors-shell {
          padding-top: 2rem;
          place-items: start center;
        }
        .form-panel {
          width: min(850px, 100%);
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
          padding: 1.25rem;
          border-radius: 12px;
          margin-bottom: 2rem;
          font-size: 0.85rem;
        }
        .alert-error {
          background: rgba(255, 100, 100, 0.08);
          border: 1px solid rgba(255, 100, 100, 0.2);
          color: #ff9999;
        }
        .alert-warning {
          background: rgba(255, 200, 100, 0.08);
          border: 1px solid rgba(255, 200, 100, 0.2);
          color: #ffd299;
          align-items: flex-start;
        }
        .alert-content ul {
          margin: 0.5rem 0 0;
          padding-left: 1.25rem;
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
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--accent);
          margin: 0 0 1.5rem;
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
          color: var(--text);
        }
        .form-group input,
        .form-group select,
        .form-group textarea {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid var(--border);
          color: var(--text);
          padding: 0.7rem 1rem;
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
        .form-group select option {
          background: #0a1020;
          color: var(--text);
        }
        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          border-color: var(--accent);
          background: rgba(255, 255, 255, 0.06);
          box-shadow: 0 0 0 4px rgba(143, 211, 255, 0.15);
        }
        .hint {
          font-size: 0.72rem;
          color: var(--muted);
          margin: 0.1rem 0 0;
          line-height: 1.3;
        }
        .actions-bar {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 1rem;
          border-top: 1px solid var(--border);
          padding-top: 2rem;
        }
        .btn-cancel {
          text-decoration: none;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--border);
          color: var(--muted);
          padding: 0.75rem 1.5rem;
          border-radius: 12px;
          font-size: 0.9rem;
          font-weight: 700;
          transition: all 0.2s ease;
        }
        .btn-cancel:hover {
          background: var(--bg-soft);
          color: var(--text);
        }
        .btn-submit {
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
        .btn-submit:hover:not(:disabled) {
          background: var(--accent);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(143, 211, 255, 0.2);
        }
        .btn-submit:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
