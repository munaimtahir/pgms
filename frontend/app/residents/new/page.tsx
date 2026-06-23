"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiRequest } from "../../../lib/api";

export default function NewResidentPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

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

  const [pmdcNumber, setPmdcNumber] = useState("");
  const [universityRegistrationNumber, setUniversityRegistrationNumber] = useState("");
  const [employeeOrTrainingId, setEmployeeOrTrainingId] = useState("");

  const [emergencyContactName, setEmergencyContactName] = useState("");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState("");
  const [emergencyContactRelation, setEmergencyContactRelation] = useState("");

  const [notes, setNotes] = useState("");

  // Duplicate Check Warnings
  const [dupWarnings, setDupWarnings] = useState<Record<string, string>>({});
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);

  const runDuplicateCheck = async () => {
    if (!username && !cnicOrPassport) return;
    setCheckingDuplicates(true);
    try {
      const res = await apiRequest("/residents/check-duplicates/", {
        method: "POST",
        body: JSON.stringify({
          username,
          cnic_or_passport: cnicOrPassport,
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
    if (!username || !fullName || !phone || !cnicOrPassport) {
      setError("Please fill in all required fields (Username, Full Name, Contact Phone, and CNIC/Passport).");
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
      father_name: fatherName,
      cnic_or_passport: cnicOrPassport,
      gender,
      date_of_birth: dateOfBirth || null,
      whatsapp_number: whatsappNumber,
      alternate_email: alternateEmail || null,
      address,
      program_name: programName,
      specialty_name: specialtyName,
      training_level: trainingLevel,
      training_year: trainingYear,
      session_year: sessionYear,
      date_of_joining: dateOfJoining || null,
      expected_completion_date: expectedCompletionDate || null,
      institution_name: institutionName,
      department_name: departmentName,
      current_status: currentStatus,
      pmdc_number: pmdcNumber || null,
      university_registration_number: universityRegistrationNumber,
      employee_or_training_id: employeeOrTrainingId,
      emergency_contact_name: emergencyContactName,
      emergency_contact_phone: emergencyContactPhone,
      emergency_contact_relation: emergencyContactRelation,
      notes,
    };

    try {
      const res = await apiRequest("/residents/", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.status === 201) {
        router.push("/residents");
      } else {
        // Detailed error parser
        let msg = "Failed to create resident profile.";
        if (data.username) msg = `Username: ${data.username[0]}`;
        else if (data.email) msg = `Email: ${data.email[0]}`;
        else if (data.cnic_or_passport) msg = `CNIC/Passport: ${data.cnic_or_passport[0]}`;
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
    <div className="shell residents-shell">
      <div className="panel form-panel">
        <div className="header-zone">
          <p className="eyebrow">Directory</p>
          <h2 className="title">New Resident Registration</h2>
          <p className="subtitle">Atomically create a login account and postgraduate profile.</p>
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

        <form onSubmit={handleSubmit} className="resident-form">
          
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
                  placeholder="e.g. resident.john"
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
                  placeholder="e.g. John Doe"
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
                <label htmlFor="email">Account Email</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={handleBlur}
                  placeholder="e.g. resident.john@institution.edu"
                />
                <p className="hint">Used for future email and password-recovery compatibility.</p>
              </div>
            </div>
          </div>

          {/* Section: Personal Profile Details */}
          <div className="form-section">
            <h3 className="section-title">2. Personal Profile details</h3>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="fatherName">{"Father's Name"}</label>
                <input
                  type="text"
                  id="fatherName"
                  value={fatherName}
                  onChange={(e) => setFatherName(e.target.value)}
                  placeholder="e.g. Robert Doe"
                />
              </div>

              <div className="form-group">
                <label htmlFor="cnic">CNIC or Passport *</label>
                <input
                  type="text"
                  id="cnic"
                  value={cnicOrPassport}
                  onChange={(e) => setCnicOrPassport(e.target.value)}
                  onBlur={handleBlur}
                  placeholder="e.g. 35201-1234567-8"
                  required
                />
                <p className="hint">Required and must be unique.</p>
              </div>

              <div className="form-group">
                <label htmlFor="gender">Gender</label>
                <select id="gender" value={gender} onChange={(e) => setGender(e.target.value)}>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="dob">Date of Birth</label>
                <input
                  type="date"
                  id="dob"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="whatsapp">WhatsApp Number</label>
                <input
                  type="tel"
                  id="whatsapp"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  placeholder="e.g. 03001234567"
                />
              </div>

              <div className="form-group">
                <label htmlFor="altEmail">Alternate Personal Email</label>
                <input
                  type="email"
                  id="altEmail"
                  value={alternateEmail}
                  onChange={(e) => setAlternateEmail(e.target.value)}
                  placeholder="e.g. alternate@gmail.com"
                />
              </div>

              <div className="form-group full-width">
                <label htmlFor="address">Permanent / Present Address</label>
                <textarea
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Complete residential address..."
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* Section: Academic and Training Details */}
          <div className="form-section">
            <h3 className="section-title">3. Postgrad training & Academic details</h3>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="program">Program Name</label>
                <input
                  type="text"
                  id="program"
                  value={programName}
                  onChange={(e) => setProgramName(e.target.value)}
                  placeholder="e.g. FCPS, MD, MS"
                />
              </div>

              <div className="form-group">
                <label htmlFor="specialty">Specialty Name</label>
                <input
                  type="text"
                  id="specialty"
                  value={specialtyName}
                  onChange={(e) => setSpecialtyName(e.target.value)}
                  placeholder="e.g. General Medicine"
                />
              </div>

              <div className="form-group">
                <label htmlFor="level">Training Level</label>
                <input
                  type="text"
                  id="level"
                  value={trainingLevel}
                  onChange={(e) => setTrainingLevel(e.target.value)}
                  placeholder="e.g. Post-Graduate Trainee"
                />
              </div>

              <div className="form-group">
                <label htmlFor="year">Training Year</label>
                <input
                  type="text"
                  id="year"
                  value={trainingYear}
                  onChange={(e) => setTrainingYear(e.target.value)}
                  placeholder="e.g. Year 1"
                />
              </div>

              <div className="form-group">
                <label htmlFor="session">Session / Year</label>
                <input
                  type="text"
                  id="session"
                  value={sessionYear}
                  onChange={(e) => setSessionYear(e.target.value)}
                  placeholder="e.g. Jan 2026"
                />
              </div>

              <div className="form-group">
                <label htmlFor="doj">Date of Joining</label>
                <input
                  type="date"
                  id="doj"
                  value={dateOfJoining}
                  onChange={(e) => setDateOfJoining(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="completion">Expected Completion Date</label>
                <input
                  type="date"
                  id="completion"
                  value={expectedCompletionDate}
                  onChange={(e) => setExpectedCompletionDate(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="status">Training Status</label>
                <select id="status" value={currentStatus} onChange={(e) => setCurrentStatus(e.target.value)}>
                  <option value="ACTIVE">Active</option>
                  <option value="ON_LEAVE">On Leave</option>
                  <option value="TRANSFERRED">Transferred</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="DROPPED">Dropped</option>
                  <option value="SUSPENDED">Suspended</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="inst">Hospital / Institution Name (Text)</label>
                <input
                  type="text"
                  id="inst"
                  value={institutionName}
                  onChange={(e) => setInstitutionName(e.target.value)}
                  placeholder="e.g. Allied Hospital Faisalabad"
                />
              </div>

              <div className="form-group">
                <label htmlFor="dept">Department Name (Text)</label>
                <input
                  type="text"
                  id="dept"
                  value={departmentName}
                  onChange={(e) => setDepartmentName(e.target.value)}
                  placeholder="e.g. Medicine Unit 3"
                />
              </div>
            </div>
          </div>

          {/* Section: Medical Credentials */}
          <div className="form-section">
            <h3 className="section-title">4. Medical Credentials & Reg IDs</h3>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="pmdc">PMDC Number</label>
                <input
                  type="text"
                  id="pmdc"
                  value={pmdcNumber}
                  onChange={(e) => setPmdcNumber(e.target.value)}
                  onBlur={handleBlur}
                  placeholder="e.g. 12345-P"
                />
                <p className="hint">Must be unique if specified.</p>
              </div>

              <div className="form-group">
                <label htmlFor="uniReg">University Reg Number</label>
                <input
                  type="text"
                  id="uniReg"
                  value={universityRegistrationNumber}
                  onChange={(e) => setUniversityRegistrationNumber(e.target.value)}
                  placeholder="e.g. FMU-2026-RES-049"
                />
              </div>

              <div className="form-group">
                <label htmlFor="employeeId">Employee / Training ID</label>
                <input
                  type="text"
                  id="employeeId"
                  value={employeeOrTrainingId}
                  onChange={(e) => setEmployeeOrTrainingId(e.target.value)}
                  placeholder="e.g. EMP-998877"
                />
              </div>
            </div>
          </div>

          {/* Section: Emergency Contacts */}
          <div className="form-section">
            <h3 className="section-title">5. Emergency Contact Details</h3>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="emergName">Contact Name</label>
                <input
                  type="text"
                  id="emergName"
                  value={emergencyContactName}
                  onChange={(e) => setEmergencyContactName(e.target.value)}
                  placeholder="e.g. Spouse / Parent Name"
                />
              </div>

              <div className="form-group">
                <label htmlFor="emergPhone">Contact Phone</label>
                <input
                  type="tel"
                  id="emergPhone"
                  value={emergencyContactPhone}
                  onChange={(e) => setEmergencyContactPhone(e.target.value)}
                  placeholder="e.g. 03009876543"
                />
              </div>

              <div className="form-group">
                <label htmlFor="emergRel">Relation</label>
                <input
                  type="text"
                  id="emergRel"
                  value={emergencyContactRelation}
                  onChange={(e) => setEmergencyContactRelation(e.target.value)}
                  placeholder="e.g. Father, Spouse, Sibling"
                />
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
                placeholder="Add any additional remarks, training remarks, or history..."
                rows={4}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="actions-bar">
            <Link href="/residents" className="btn-cancel">
              Cancel
            </Link>
            <button type="submit" className="btn-submit" disabled={submitting || checkingDuplicates}>
              {submitting ? "Registering Resident..." : "Register Resident"}
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .residents-shell {
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
