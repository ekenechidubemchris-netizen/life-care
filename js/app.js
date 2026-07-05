/* =====================================================================
   app.js — NAVIGATION + ALL DASHBOARD RENDERING LOGIC
   (Needs data.js and auth.js loaded first.)
   ===================================================================== */

/* ---------------------------------------------------------------------
   TOP-LEVEL NAVIGATION
   --------------------------------------------------------------------- */
function nav(viewId) {
  // The dashboard is only for logged-in people — bounce anyone else
  // back to the auth screen instead of showing an empty dashboard.
  if (viewId === "dashboard" && !STATE.session) {
    viewId = "auth";
  }

  document.querySelectorAll(".view-section").forEach(s => s.classList.remove("active-view"));
  document.getElementById("view-" + viewId).classList.add("active-view");
  window.scrollTo({ top: 0, behavior: "instant" });

  highlightNavLink(viewId);
  if (viewId === "dashboard") renderDashboard();
  refreshAuthBar();
}

function highlightNavLink(viewId) {
  document.querySelectorAll(".lc-nav .nav-link").forEach(link => {
    link.classList.toggle("active", link.dataset.view === viewId);
  });
}

// Shows the logged-in person's name + a logout button in the navbar,
// or a "Login / Sign Up" button if nobody is logged in.
function refreshAuthBar() {
  const slot = document.getElementById("navAuthSlot");
  const account = currentAccount();
  if (!account) {
    slot.innerHTML = `<button class="btn btn-auth" data-view="auth" onclick="nav('auth')">Login / Sign Up</button>`;
    return;
  }
  const label = STATE.session.type === "staff" ? ROLE_LABELS[account.role] : "Patient";
  slot.innerHTML = `
    <span class="text-light small me-2 d-none d-lg-inline">${escapeHtml(account.fullName)} · ${escapeHtml(label)}</span>
    <button class="btn btn-auth" onclick="nav('dashboard')">Dashboard</button>
    <button class="btn btn-outline-light btn-sm ms-2" onclick="logout()">Log Out</button>`;
}

/* ---------------------------------------------------------------------
   SCROLL-REVEAL (unchanged small utility, works across all views)
   --------------------------------------------------------------------- */
function setupScrollReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in-view");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll(".reveal").forEach(el => observer.observe(el));
}

/* ---------------------------------------------------------------------
   TOAST NOTIFICATIONS — small confirmation pop-ups for actions like
   "Bill generated" or "Vitals recorded" instead of a jarring alert().
   --------------------------------------------------------------------- */
function toast(message, isError = false) {
  const el = document.getElementById("toastEl");
  el.className = `toast align-items-center text-white border-0 ${isError ? "bg-danger" : "bg-teal"}`;
  document.getElementById("toastMsg").textContent = message;
  bootstrap.Toast.getOrCreateInstance(el, { delay: 3200 }).show();
}

/* =====================================================================
   AUTH VIEW — role toggle + login/signup forms
   ===================================================================== */
function setAuthTab(which) {
  document.getElementById("staffAuthBtn").classList.toggle("active", which === "staff");
  document.getElementById("patientAuthBtn").classList.toggle("active", which === "patient");
  document.getElementById("staffLoginForm").classList.toggle("d-none", which !== "staff");
  document.getElementById("patientLoginForm").classList.toggle("d-none", which !== "patient" || authPatientMode !== "login");
  document.getElementById("patientSignupForm").classList.toggle("d-none", which !== "patient" || authPatientMode !== "signup");
  document.getElementById("authError").classList.add("d-none");
}

let authPatientMode = "login";
function setPatientAuthMode(mode) {
  authPatientMode = mode;
  document.getElementById("patientLoginForm").classList.toggle("d-none", mode !== "login");
  document.getElementById("patientSignupForm").classList.toggle("d-none", mode !== "signup");
  document.getElementById("authError").classList.add("d-none");
}

function showAuthError(message) {
  const box = document.getElementById("authError");
  box.textContent = message;
  box.classList.remove("d-none");
}

function dashboardHomeSection() {
  const account = currentAccount();
  if (!account) return null;
  return STATE.session.type === "staff" ? account.role : "patient";
}

/* =====================================================================
   DASHBOARD SHELL — sidebar + section switching, shared by every role
   ===================================================================== */

const DASH_NAV = {
  admin: [
    ["adm-overview", "bi-speedometer2", "Overview"],
    ["adm-staff", "bi-people", "Manage Staff"],
    ["adm-patients", "bi-person-lines-fill", "All Patients"],
    ["adm-reports", "bi-bar-chart", "Reports"]
  ],
  receptionist: [
    ["rec-patients", "bi-person-plus", "Register Patient"],
    ["rec-appointments", "bi-calendar-check", "Appointments"],
    ["rec-admissions", "bi-hospital", "Admissions"]
  ],
  doctor: [
    ["doc-appointments", "bi-calendar-check", "My Patients Today"],
    ["doc-consultation", "bi-clipboard2-pulse", "Record Consultation"],
    ["doc-prescriptions", "bi-capsule", "Prescriptions"],
    ["doc-lab", "bi-droplet", "Lab Requests & Results"]
  ],
  nurse: [
    ["nur-admitted", "bi-hospital", "Admitted Patients"],
    ["nur-vitals", "bi-heart-pulse", "Record Vital Signs"],
    ["nur-meds", "bi-capsule", "Administer Medication"]
  ],
  pharmacist: [
    ["pha-dispense", "bi-capsule", "Dispense Prescriptions"],
    ["pha-inventory", "bi-boxes", "Medicine Inventory"]
  ],
  labtech: [
    ["lab-pending", "bi-hourglass-split", "Pending Test Requests"],
    ["lab-completed", "bi-clipboard-check", "Completed Tests"]
  ],
  accountant: [
    ["acc-bills", "bi-receipt", "All Bills"],
    ["acc-newbill", "bi-plus-circle", "Generate Bill"]
  ],
  patient: [
    ["pat-appointments", "bi-calendar-check", "My Appointments"],
    ["pat-records", "bi-file-earmark-medical", "Medical Records"],
    ["pat-prescriptions", "bi-capsule", "Prescriptions"],
    ["pat-lab", "bi-droplet", "Lab Results"],
    ["pat-billing", "bi-receipt", "Billing"],
    ["pat-messages", "bi-chat-dots", "Messages"]
  ]
};


const SECTION_RENDERERS = {};

function renderDashboard() {
  const account = currentAccount();
  const roleKey = dashboardHomeSection(); // e.g. "doctor" or "patient"
  if (!account || !roleKey) { nav("auth"); return; }

  // Show only the wrapper for this person's role, hide the other seven.
  Object.keys(DASH_NAV).forEach(key => {
    document.getElementById("dash-" + key).classList.toggle("d-none", key !== roleKey);
  });

  // Build the sidebar for this role from DASH_NAV.
  const side = document.getElementById("dashSide");
  const roleLabel = STATE.session.type === "staff" ? ROLE_LABELS[account.role] : "Patient";
  side.innerHTML = `
    <div class="dash-role">${escapeHtml(roleLabel)}</div>
    <p class="px-3 mb-3" style="color:#fff;font-weight:600;">${escapeHtml(account.fullName)}</p>
    ${DASH_NAV[roleKey].map((entry, i) => `
      <a class="dash-link ${i === 0 ? "active" : ""}" data-section="${entry[0]}" onclick="dashNav('${roleKey}','${entry[0]}', this)">
        <i class="bi ${entry[1]} me-2"></i>${entry[2]}
      </a>`).join("")}
    <a class="dash-link mt-4" onclick="nav('home')"><i class="bi bi-house me-2"></i>Back to Website</a>
    <a class="dash-link" onclick="logout()"><i class="bi bi-box-arrow-right me-2"></i>Log Out</a>
  `;

  // Show the first section by default and render it.
  dashNav(roleKey, DASH_NAV[roleKey][0][0], null);
}

function dashNav(roleKey, sectionId, linkEl) {
  const wrapper = document.getElementById("dash-" + roleKey);
  wrapper.querySelectorAll(".dash-section").forEach(sec => sec.classList.remove("active-view"));
  document.getElementById(sectionId).classList.add("active-view");

  
  document.getElementById("dashSide").querySelectorAll(".dash-link").forEach(l => l.classList.remove("active"));
  if (linkEl) linkEl.classList.add("active");
  else { const first = document.querySelector(`.dash-link[data-section="${sectionId}"]`); if (first) first.classList.add("active"); }

  if (SECTION_RENDERERS[sectionId]) SECTION_RENDERERS[sectionId]();
}

/* =====================================================================
   ADMIN
   ===================================================================== */
SECTION_RENDERERS["adm-overview"] = function () {
  const admittedCount = STATE.admissions.filter(a => a.status === "Admitted").length;
  const revenue = STATE.bills.reduce((sum, b) => sum + b.amountPaid, 0);
  document.getElementById("admOverviewTiles").innerHTML = `
    <div class="col-6 col-lg-3"><div class="stat-tile"><div class="n">${STATE.patients.length}</div><div class="l">Registered Patients</div></div></div>
    <div class="col-6 col-lg-3"><div class="stat-tile"><div class="n">${STATE.staff.length}</div><div class="l">Staff Members</div></div></div>
    <div class="col-6 col-lg-3"><div class="stat-tile"><div class="n">${admittedCount}</div><div class="l">Currently Admitted</div></div></div>
    <div class="col-6 col-lg-3"><div class="stat-tile"><div class="n">${formatNaira(revenue)}</div><div class="l">Revenue Collected</div></div></div>`;
};

SECTION_RENDERERS["adm-staff"] = function () {
  document.getElementById("admStaffBody").innerHTML = STATE.staff.map(s => `
    <tr>
      <td>${escapeHtml(s.fullName)}</td>
      <td>${escapeHtml(s.email)}</td>
      <td>${escapeHtml(s.phone)}</td>
      <td><span class="badge bg-secondary">${escapeHtml(ROLE_LABELS[s.role] || s.role)}</span></td>
    </tr>`).join("");
};

document.addEventListener("submit", function (e) {
  if (e.target.id !== "addStaffForm") return;
  e.preventDefault();
  const result = createStaffAccount({
    fullName: document.getElementById("newStaffName").value.trim(),
    email: document.getElementById("newStaffEmail").value.trim(),
    phone: document.getElementById("newStaffPhone").value.trim(),
    password: document.getElementById("newStaffPassword").value,
    role: document.getElementById("newStaffRole").value
  });
  if (!result.success) { toast(result.message, true); return; }
  toast(`Staff account created for ${result.account.fullName}.`);
  e.target.reset();
  bootstrap.Modal.getInstance(document.getElementById("addStaffModal")).hide();
  SECTION_RENDERERS["adm-staff"]();
  SECTION_RENDERERS["adm-overview"]();
});

SECTION_RENDERERS["adm-patients"] = function () {
  document.getElementById("admPatientsBody").innerHTML = STATE.patients.map(p => `
    <tr>
      <td>${escapeHtml(p.fullName)}</td>
      <td>${escapeHtml(p.email)}</td>
      <td>${escapeHtml(p.phone)}</td>
      <td>${escapeHtml(p.gender || "—")}</td>
      <td>${escapeHtml(p.bloodGroup || "—")}</td>
    </tr>`).join("") || `<tr><td colspan="5" class="text-center text-muted py-4">No patients registered yet.</td></tr>`;
};

SECTION_RENDERERS["adm-reports"] = function () {
  const wardCards = STATE.wards.map(w => {
    const occupied = STATE.admissions.filter(a => a.status === "Admitted" && a.wardId === w.id).length;
    return `<div class="col-md-4"><div class="stat-tile mb-3"><div class="l mb-1">${escapeHtml(w.name)}</div><div class="n" style="font-size:1.3rem;">${occupied} / ${w.totalBeds} beds</div></div></div>`;
  }).join("");
  const lowStock = STATE.medicines.filter(m => m.quantity <= m.reorderLevel).length;
  const outstanding = STATE.bills.reduce((sum, b) => sum + (b.total - b.amountPaid), 0);
  document.getElementById("admReportCards").innerHTML = `
    ${wardCards}
    <div class="col-md-6"><div class="stat-tile mb-3"><div class="l mb-1">Medicines At/Below Reorder Level</div><div class="n" style="font-size:1.3rem;">${lowStock}</div></div></div>
    <div class="col-md-6"><div class="stat-tile mb-3"><div class="l mb-1">Outstanding Balance (all patients)</div><div class="n" style="font-size:1.3rem;">${formatNaira(outstanding)}</div></div></div>`;
};

/* =====================================================================
   RECEPTIONIST
   ===================================================================== */
SECTION_RENDERERS["rec-patients"] = function () {
  document.getElementById("recPatientsBody").innerHTML = STATE.patients.map(p => `
    <tr><td>${escapeHtml(p.fullName)}</td><td>${escapeHtml(p.email)}</td><td>${escapeHtml(p.phone)}</td><td>${escapeHtml(p.nin)}</td></tr>
  `).join("") || `<tr><td colspan="4" class="text-center text-muted py-4">No patients yet.</td></tr>`;
};

document.addEventListener("submit", function (e) {
  if (e.target.id !== "registerPatientForm") return;
  e.preventDefault();
  const fullName = document.getElementById("regPatientName").value.trim();
  const email = document.getElementById("regPatientEmail").value.trim();
  const phone = document.getElementById("regPatientPhone").value.trim();
  const nin = document.getElementById("regPatientNin").value.trim();

  if (!/^\d{11}$/.test(nin)) { toast("NIN must be exactly 11 digits.", true); return; }
  if (STATE.patients.some(p => p.nin === nin)) { toast("A patient with that NIN already exists.", true); return; }

  STATE.patients.push({
    id: nextId("patients", "P"), fullName, email, phone, nin,
    password: "patient123", dob: "", gender: "", bloodGroup: "", allergies: [], emergencyContact: ""
  });
  saveState();
  toast(`${fullName} registered. Default password: patient123`);
  e.target.reset();
  bootstrap.Modal.getInstance(document.getElementById("registerPatientModal")).hide();
  SECTION_RENDERERS["rec-patients"]();
  populateGlobalPatientSelects();
});

function populateGlobalPatientSelects() {
  const opts = STATE.patients.map(p => `<option value="${p.id}">${escapeHtml(p.fullName)}</option>`).join("");
  document.querySelectorAll(".patient-select").forEach(sel => sel.innerHTML = opts || `<option value="">No patients yet</option>`);
}
function populateGlobalDoctorSelects() {
  const opts = STATE.staff.filter(s => s.role === "doctor").map(d => `<option value="${d.id}">${escapeHtml(d.fullName)}${d.specialty ? " — " + escapeHtml(d.specialty) : ""}</option>`).join("");
  document.querySelectorAll(".doctor-select").forEach(sel => sel.innerHTML = opts);
}
function populateGlobalWardSelects() {
  const opts = STATE.wards.map(w => `<option value="${w.id}">${escapeHtml(w.name)}</option>`).join("");
  document.querySelectorAll(".ward-select").forEach(sel => sel.innerHTML = opts);
}

SECTION_RENDERERS["rec-appointments"] = function () {
  document.getElementById("recApptBody").innerHTML = STATE.appointments.map(a => `
    <tr>
      <td>${escapeHtml(patientName(a.patientId))}</td>
      <td>${escapeHtml(staffName(a.doctorId))}</td>
      <td>${escapeHtml(a.date)} ${escapeHtml(a.time)}</td>
      <td>${escapeHtml(a.reason)}</td>
      <td><span class="badge badge-status badge-${a.status.toLowerCase()}">${escapeHtml(a.status)}</span></td>
      <td>${a.status === "Scheduled" ? `<button class="btn btn-sm btn-outline-secondary" onclick="cancelAppointment('${a.id}')">Cancel</button>` : "—"}</td>
    </tr>`).join("") || `<tr><td colspan="6" class="text-center text-muted py-4">No appointments yet.</td></tr>`;
};

function cancelAppointment(id) {
  const appt = STATE.appointments.find(a => a.id === id);
  if (!appt) return;
  appt.status = "Cancelled";
  saveState();
  toast("Appointment cancelled.");
  ["rec-appointments", "pat-appointments", "doc-appointments"].forEach(s => SECTION_RENDERERS[s] && document.getElementById(s)?.classList.contains("active-view") && SECTION_RENDERERS[s]());
}

document.addEventListener("submit", function (e) {
  if (e.target.id !== "bookAppointmentForm") return;
  e.preventDefault();
  const patientId = document.getElementById("apptPatientSelect").value;
  const doctorId = document.getElementById("apptDoctorSelect").value;
  if (!patientId || !doctorId) { toast("Please choose a patient and a doctor.", true); return; }
  STATE.appointments.push({
    id: nextId("appointments", "A"), patientId, doctorId,
    date: document.getElementById("apptDate").value,
    time: document.getElementById("apptTime").value,
    reason: document.getElementById("apptReason").value.trim(),
    status: "Scheduled"
  });
  saveState();
  toast("Appointment booked.");
  e.target.reset();
  bootstrap.Modal.getInstance(document.getElementById("bookAppointmentModal")).hide();
  SECTION_RENDERERS["rec-appointments"]();
});

SECTION_RENDERERS["rec-admissions"] = function () {
  document.getElementById("recAdmissionsBody").innerHTML = STATE.admissions.map(a => `
    <tr>
      <td>${escapeHtml(patientName(a.patientId))}</td>
      <td>${escapeHtml(getWard(a.wardId)?.name || "—")}</td>
      <td>${a.bed}</td>
      <td>${escapeHtml(a.admittedOn)}</td>
      <td><span class="badge badge-status badge-${a.status.toLowerCase()}">${escapeHtml(a.status)}</span></td>
      <td>${a.status === "Admitted" ? `<button class="btn btn-sm btn-outline-secondary" onclick="dischargePatient('${a.id}')">Discharge</button>` : "—"}</td>
    </tr>`).join("") || `<tr><td colspan="6" class="text-center text-muted py-4">No admissions yet.</td></tr>`;
};

function dischargePatient(id) {
  const admission = STATE.admissions.find(a => a.id === id);
  if (!admission) return;
  admission.status = "Discharged";
  saveState();
  toast("Patient discharged.");
  SECTION_RENDERERS["rec-admissions"]();
}

document.addEventListener("submit", function (e) {
  if (e.target.id !== "admitPatientForm") return;
  e.preventDefault();
  const patientId = document.getElementById("admitPatientSelect").value;
  if (!patientId) { toast("Please choose a patient.", true); return; }
  STATE.admissions.push({
    id: nextId("admissions", "AD"), patientId,
    wardId: document.getElementById("admitWardSelect").value,
    bed: Number(document.getElementById("admitBed").value),
    admittedOn: today(),
    status: "Admitted",
    reason: document.getElementById("admitReason").value.trim()
  });
  saveState();
  toast("Patient admitted.");
  e.target.reset();
  bootstrap.Modal.getInstance(document.getElementById("admitPatientModal")).hide();
  SECTION_RENDERERS["rec-admissions"]();
});

/* =====================================================================
   DOCTOR
   ===================================================================== */
SECTION_RENDERERS["doc-appointments"] = function () {
  const me = currentAccount();
  const mine = STATE.appointments.filter(a => a.doctorId === me.id);
  document.getElementById("docApptBody").innerHTML = mine.map(a => `
    <tr>
      <td>${escapeHtml(patientName(a.patientId))}</td>
      <td>${escapeHtml(a.date)}</td>
      <td>${escapeHtml(a.time)}</td>
      <td>${escapeHtml(a.reason)}</td>
      <td><span class="badge badge-status badge-${a.status.toLowerCase()}">${escapeHtml(a.status)}</span></td>
      <td>${a.status === "Scheduled" ? `<button class="btn btn-sm btn-outline-secondary" onclick="markApptCompleted('${a.id}')">Mark Completed</button>` : "—"}</td>
    </tr>`).join("") || `<tr><td colspan="6" class="text-center text-muted py-4">No appointments assigned to you yet.</td></tr>`;
};

function markApptCompleted(id) {
  const appt = STATE.appointments.find(a => a.id === id);
  if (appt) { appt.status = "Completed"; saveState(); SECTION_RENDERERS["doc-appointments"](); }
}

document.addEventListener("submit", function (e) {
  if (e.target.id !== "consultForm") return;
  e.preventDefault();
  const me = currentAccount();
  const patientId = document.getElementById("consultPatientSelect").value;
  STATE.medicalRecords.push({
    id: nextId("medicalRecords", "MR"), patientId, doctorId: me.id, date: today(),
    diagnosis: document.getElementById("consultDiagnosis").value.trim(),
    treatment: document.getElementById("consultTreatment").value.trim(),
    notes: document.getElementById("consultNotes").value.trim()
  });
  saveState();
  toast(`Consultation saved to ${patientName(patientId)}'s medical record.`);
  e.target.reset();
});

SECTION_RENDERERS["doc-prescriptions"] = function () {
  const me = currentAccount();
  const mine = STATE.prescriptions.filter(rx => rx.doctorId === me.id);
  document.getElementById("docRxBody").innerHTML = mine.map(rx => `
    <tr>
      <td>${escapeHtml(patientName(rx.patientId))}</td>
      <td>${escapeHtml(rx.medicine)}</td>
      <td>${escapeHtml(rx.dosage)}</td>
      <td>${escapeHtml(rx.date)}</td>
      <td><span class="badge badge-status badge-${rx.status === "Dispensed" ? "completed" : "pending"}">${escapeHtml(rx.status)}</span></td>
    </tr>`).join("") || `<tr><td colspan="5" class="text-center text-muted py-4">No prescriptions written yet.</td></tr>`;
};

document.addEventListener("submit", function (e) {
  if (e.target.id !== "prescribeForm") return;
  e.preventDefault();
  const me = currentAccount();
  const patientId = document.getElementById("rxPatientSelect").value;
  STATE.prescriptions.push({
    id: nextId("prescriptions", "RX"), patientId, doctorId: me.id, date: today(),
    medicine: document.getElementById("rxMedicine").value.trim(),
    dosage: document.getElementById("rxDosage").value.trim(),
    status: "Pending"
  });
  saveState();
  toast("Prescription saved.");
  e.target.reset();
  bootstrap.Modal.getInstance(document.getElementById("prescribeModal")).hide();
  SECTION_RENDERERS["doc-prescriptions"]();
});

SECTION_RENDERERS["doc-lab"] = function () {
  const me = currentAccount();
  const mine = STATE.labTests.filter(t => t.requestedBy === me.id);
  document.getElementById("docLabBody").innerHTML = mine.map(t => `
    <tr>
      <td>${escapeHtml(patientName(t.patientId))}</td>
      <td>${escapeHtml(t.testName)}</td>
      <td>${escapeHtml(t.date)}</td>
      <td><span class="badge badge-status badge-${t.status === "Completed" ? "completed" : "pending"}">${escapeHtml(t.status)}</span></td>
      <td>${t.result ? escapeHtml(t.result) : `<span class="text-muted">Pending</span>`}</td>
    </tr>`).join("") || `<tr><td colspan="5" class="text-center text-muted py-4">No lab requests sent yet.</td></tr>`;
};

document.addEventListener("submit", function (e) {
  if (e.target.id !== "labRequestForm") return;
  e.preventDefault();
  const me = currentAccount();
  const patientId = document.getElementById("labPatientSelect").value;
  STATE.labTests.push({
    id: nextId("labTests", "LT"), patientId,
    testName: document.getElementById("labTestName").value.trim(),
    requestedBy: me.id, date: today(), status: "Requested", result: ""
  });
  saveState();
  toast("Test request sent to the lab.");
  e.target.reset();
  bootstrap.Modal.getInstance(document.getElementById("labRequestModal")).hide();
  SECTION_RENDERERS["doc-lab"]();
});

/* =====================================================================
   NURSE
   ===================================================================== */
function latestVitalsFor(patientId) {
  const records = STATE.vitals.filter(v => v.patientId === patientId);
  return records.length ? records[records.length - 1] : null;
}

SECTION_RENDERERS["nur-admitted"] = function () {
  const admitted = STATE.admissions.filter(a => a.status === "Admitted");
  document.getElementById("nurAdmittedBody").innerHTML = admitted.map(a => {
    const v = latestVitalsFor(a.patientId);
    return `
    <tr>
      <td>${escapeHtml(patientName(a.patientId))}</td>
      <td>${escapeHtml(getWard(a.wardId)?.name || "—")}</td>
      <td>${a.bed}</td>
      <td>${escapeHtml(a.admittedOn)}</td>
      <td>${v ? `Temp ${escapeHtml(v.temp)}, BP ${escapeHtml(v.bp)} <span class="text-muted small">(${escapeHtml(v.date)})</span>` : `<span class="text-muted">No vitals recorded yet</span>`}</td>
    </tr>`;
  }).join("") || `<tr><td colspan="5" class="text-center text-muted py-4">No patients currently admitted.</td></tr>`;

  const admittedOpts = admitted.map(a => `<option value="${a.patientId}">${escapeHtml(patientName(a.patientId))}</option>`).join("");
  const vSel = document.getElementById("vitalsPatientSelect");
  if (vSel) vSel.innerHTML = admittedOpts || `<option value="">No admitted patients</option>`;
};

document.addEventListener("submit", function (e) {
  if (e.target.id !== "vitalsForm") return;
  e.preventDefault();
  const me = currentAccount();
  const patientId = document.getElementById("vitalsPatientSelect").value;
  if (!patientId) { toast("No admitted patient selected.", true); return; }
  STATE.vitals.push({
    id: nextId("vitals", "V"), patientId, recordedBy: me.id, date: today(),
    temp: document.getElementById("vitalsTemp").value.trim(),
    bp: document.getElementById("vitalsBp").value.trim(),
    pulse: document.getElementById("vitalsPulse").value.trim(),
    resp: document.getElementById("vitalsResp").value.trim(),
    notes: document.getElementById("vitalsNotes").value.trim()
  });
  saveState();
  toast(`Vitals recorded for ${patientName(patientId)}.`);
  e.target.reset();
  SECTION_RENDERERS["nur-admitted"]();
});

SECTION_RENDERERS["nur-meds"] = function () {
  const pending = STATE.prescriptions.filter(rx => rx.status === "Pending");
  document.getElementById("nurMedsBody").innerHTML = pending.map(rx => `
    <tr>
      <td>${escapeHtml(patientName(rx.patientId))}</td>
      <td>${escapeHtml(rx.medicine)}</td>
      <td>${escapeHtml(rx.dosage)}</td>
      <td><span class="badge badge-status badge-pending">${escapeHtml(rx.status)}</span></td>
      <td><button class="btn btn-sm btn-outline-secondary" onclick="markMedGiven('${rx.id}')">Mark as Given</button></td>
    </tr>`).join("") || `<tr><td colspan="5" class="text-center text-muted py-4">No medication currently pending.</td></tr>`;
};

function markMedGiven(rxId) {
  const rx = STATE.prescriptions.find(r => r.id === rxId);
  if (rx) { rx.status = "Dispensed"; saveState(); toast("Medication marked as given."); SECTION_RENDERERS["nur-meds"](); }
}

/* =====================================================================
   PHARMACIST
   ===================================================================== */
SECTION_RENDERERS["pha-dispense"] = function () {
  document.getElementById("phaRxBody").innerHTML = STATE.prescriptions.map(rx => `
    <tr>
      <td>${escapeHtml(patientName(rx.patientId))}</td>
      <td>${escapeHtml(rx.medicine)}</td>
      <td>${escapeHtml(rx.dosage)}</td>
      <td>${escapeHtml(staffName(rx.doctorId))}</td>
      <td><span class="badge badge-status badge-${rx.status === "Dispensed" ? "completed" : "pending"}">${escapeHtml(rx.status)}</span></td>
      <td>${rx.status === "Pending" ? `<button class="btn btn-sm btn-outline-secondary" onclick="dispenseRx('${rx.id}')">Dispense</button>` : "—"}</td>
    </tr>`).join("") || `<tr><td colspan="6" class="text-center text-muted py-4">No prescriptions yet.</td></tr>`;
};

function dispenseRx(rxId) {
  const rx = STATE.prescriptions.find(r => r.id === rxId);
  if (!rx) return;
  // Loose name match against stock, reducing quantity by 1 unit per
  // dispensed prescription. A real system would track exact units.
  const stockItem = STATE.medicines.find(m => rx.medicine.toLowerCase().includes(m.name.toLowerCase().split(" ")[0]));
  if (stockItem && stockItem.quantity > 0) stockItem.quantity -= 1;
  rx.status = "Dispensed";
  saveState();
  toast(`${rx.medicine} dispensed to ${patientName(rx.patientId)}.`);
  SECTION_RENDERERS["pha-dispense"]();
  SECTION_RENDERERS["pha-inventory"]();
}

SECTION_RENDERERS["pha-inventory"] = function () {
  document.getElementById("phaStockBody").innerHTML = STATE.medicines.map(m => {
    const low = m.quantity <= m.reorderLevel;
    return `
    <tr>
      <td>${escapeHtml(m.name)}</td>
      <td>${m.quantity}</td>
      <td>${m.reorderLevel}</td>
      <td>${formatNaira(m.unitPrice)}</td>
      <td><span class="badge badge-status ${low ? "badge-unpaid" : "badge-active"}">${low ? "Low Stock" : "In Stock"}</span></td>
    </tr>`;
  }).join("");
  const sel = document.getElementById("restockSelect");
  if (sel) sel.innerHTML = STATE.medicines.map(m => `<option value="${m.id}">${escapeHtml(m.name)}</option>`).join("");
};

document.addEventListener("submit", function (e) {
  if (e.target.id !== "restockForm") return;
  e.preventDefault();
  const item = STATE.medicines.find(m => m.id === document.getElementById("restockSelect").value);
  item.quantity += Number(document.getElementById("restockQty").value);
  saveState();
  toast(`${item.name} restocked.`);
  e.target.reset();
  bootstrap.Modal.getInstance(document.getElementById("restockModal")).hide();
  SECTION_RENDERERS["pha-inventory"]();
});

/* =====================================================================
   LAB TECHNICIAN
   ===================================================================== */
SECTION_RENDERERS["lab-pending"] = function () {
  const pending = STATE.labTests.filter(t => t.status === "Requested");
  document.getElementById("labPendingBody").innerHTML = pending.map(t => `
    <tr>
      <td>${escapeHtml(patientName(t.patientId))}</td>
      <td>${escapeHtml(t.testName)}</td>
      <td>${escapeHtml(staffName(t.requestedBy))}</td>
      <td>${escapeHtml(t.date)}</td>
      <td><button class="btn btn-sm btn-teal" onclick="openResultModal('${t.id}')">Enter Result</button></td>
    </tr>`).join("") || `<tr><td colspan="5" class="text-center text-muted py-4">No pending test requests. All caught up!</td></tr>`;
};

SECTION_RENDERERS["lab-completed"] = function () {
  const completed = STATE.labTests.filter(t => t.status === "Completed");
  document.getElementById("labCompletedBody").innerHTML = completed.map(t => `
    <tr>
      <td>${escapeHtml(patientName(t.patientId))}</td>
      <td>${escapeHtml(t.testName)}</td>
      <td>${escapeHtml(staffName(t.requestedBy))}</td>
      <td>${escapeHtml(t.result)}</td>
    </tr>`).join("") || `<tr><td colspan="4" class="text-center text-muted py-4">No completed tests yet.</td></tr>`;
};

function openResultModal(testId) {
  const test = STATE.labTests.find(t => t.id === testId);
  document.getElementById("resultTestId").value = testId;
  document.getElementById("resultContext").textContent = `${patientName(test.patientId)} — ${test.testName} (requested by ${staffName(test.requestedBy)})`;
  document.getElementById("resultText").value = "";
  new bootstrap.Modal(document.getElementById("resultModal")).show();
}

document.addEventListener("submit", function (e) {
  if (e.target.id !== "resultForm") return;
  e.preventDefault();
  const test = STATE.labTests.find(t => t.id === document.getElementById("resultTestId").value);
  test.result = document.getElementById("resultText").value.trim();
  test.status = "Completed";
  saveState();
  toast("Result saved and sent to the requesting doctor.");
  bootstrap.Modal.getInstance(document.getElementById("resultModal")).hide();
  SECTION_RENDERERS["lab-pending"]();
  SECTION_RENDERERS["lab-completed"]();
});

/* =====================================================================
   ACCOUNTANT
   ===================================================================== */
SECTION_RENDERERS["acc-bills"] = function () {
  document.getElementById("accBillsBody").innerHTML = STATE.bills.map(b => `
    <tr>
      <td>${escapeHtml(patientName(b.patientId))}</td>
      <td>${escapeHtml(b.date)}</td>
      <td>${formatNaira(b.total)}</td>
      <td>${formatNaira(b.amountPaid)}</td>
      <td><span class="badge badge-status badge-${b.status.toLowerCase()}">${escapeHtml(b.status)}</span></td>
      <td>
        ${b.status !== "Paid" ? `<button class="btn btn-sm btn-outline-secondary mb-1" onclick="openPaymentModal('${b.id}')">Record Payment</button>` : ""}
        <button class="btn btn-sm btn-teal mb-1" onclick="openReceipt('${b.id}')">Receipt</button>
      </td>
    </tr>`).join("") || `<tr><td colspan="6" class="text-center text-muted py-4">No bills yet.</td></tr>`;

  const totalBilled = STATE.bills.reduce((sum, b) => sum + b.total, 0);
  const totalCollected = STATE.bills.reduce((sum, b) => sum + b.amountPaid, 0);
  document.getElementById("accTotalBilled").textContent = formatNaira(totalBilled);
  document.getElementById("accTotalCollected").textContent = formatNaira(totalCollected);
  document.getElementById("accOutstanding").textContent = formatNaira(totalBilled - totalCollected);
};

function openPaymentModal(billId) {
  const bill = STATE.bills.find(b => b.id === billId);
  document.getElementById("paymentBillId").value = billId;
  document.getElementById("paymentContext").textContent =
    `${patientName(bill.patientId)} — Total ${formatNaira(bill.total)}, already paid ${formatNaira(bill.amountPaid)}, outstanding ${formatNaira(bill.total - bill.amountPaid)}.`;
  document.getElementById("paymentAmount").value = "";
  new bootstrap.Modal(document.getElementById("paymentModal")).show();
}

document.addEventListener("submit", function (e) {
  if (e.target.id !== "paymentForm") return;
  e.preventDefault();
  const bill = STATE.bills.find(b => b.id === document.getElementById("paymentBillId").value);
  const amount = Number(document.getElementById("paymentAmount").value);
  bill.amountPaid = Math.min(bill.total, bill.amountPaid + amount);
  bill.status = bill.amountPaid >= bill.total ? "Paid" : "Partial";
  saveState();
  toast("Payment recorded.");
  SECTION_RENDERERS["acc-bills"]();
  bootstrap.Modal.getInstance(document.getElementById("paymentModal")).hide();
});

function openReceipt(billId) {
  const bill = STATE.bills.find(b => b.id === billId);
  const itemsHtml = bill.items.map(i => `<tr><td>${escapeHtml(i.desc)}</td><td class="text-end">${formatNaira(i.amount)}</td></tr>`).join("");
  document.getElementById("receiptContent").innerHTML = `
    <h5 class="display-font">LifeCare General Hospital</h5>
    <p class="text-muted small mb-3">Official Receipt — Bill ${escapeHtml(bill.id)}</p>
    <p class="mb-1"><strong>Patient:</strong> ${escapeHtml(patientName(bill.patientId))}</p>
    <p class="mb-3"><strong>Date:</strong> ${escapeHtml(bill.date)}</p>
    <table class="table table-sm"><tbody>${itemsHtml}</tbody></table>
    <p class="mb-1"><strong>Total:</strong> ${formatNaira(bill.total)}</p>
    <p class="mb-1"><strong>Amount Paid:</strong> ${formatNaira(bill.amountPaid)}</p>
    <p class="mb-0"><strong>Status:</strong> ${escapeHtml(bill.status)}</p>`;
  new bootstrap.Modal(document.getElementById("receiptModal")).show();
}

SECTION_RENDERERS["acc-newbill"] = function () { /* form is static; nothing to render */ };

document.getElementById("addBillItemBtn")?.addEventListener("click", function () {
  const container = document.getElementById("billItemsContainer");
  const firstRow = container.querySelector(".bill-item-row");
  const newRow = firstRow.cloneNode(true);
  newRow.querySelectorAll("input").forEach(input => input.value = "");
  container.appendChild(newRow);
});

document.addEventListener("submit", function (e) {
  if (e.target.id !== "newBillForm") return;
  e.preventDefault();
  const patientId = document.getElementById("billPatientSelect").value;
  if (!patientId) { toast("Please choose a patient.", true); return; }
  const rows = document.querySelectorAll(".bill-item-row");
  const items = Array.from(rows).map(row => {
    const inputs = row.querySelectorAll("input");
    return { desc: inputs[0].value.trim(), amount: Number(inputs[1].value) };
  }).filter(i => i.desc && i.amount > 0);
  if (items.length === 0) { toast("Add at least one billed item.", true); return; }
  const total = items.reduce((sum, i) => sum + i.amount, 0);

  STATE.bills.push({ id: nextId("bills", "B"), patientId, date: today(), items, total, amountPaid: 0, status: "Unpaid" });
  saveState();
  toast(`Bill generated for ${patientName(patientId)}: ${formatNaira(total)}`);
  e.target.reset();
  document.getElementById("billItemsContainer").innerHTML = `
    <div class="row bill-item-row">
      <div class="col-7 mb-2"><input type="text" class="form-control" placeholder="Item description e.g. Consultation" required></div>
      <div class="col-5 mb-2"><input type="number" class="form-control" placeholder="Amount (₦)" required></div>
    </div>`;
});

/* =====================================================================
   PATIENT PORTAL
   ===================================================================== */
SECTION_RENDERERS["pat-appointments"] = function () {
  const me = currentAccount();
  const mine = STATE.appointments.filter(a => a.patientId === me.id);
  document.getElementById("patApptBody").innerHTML = mine.map(a => `
    <tr>
      <td>${escapeHtml(staffName(a.doctorId))}</td>
      <td>${escapeHtml(a.date)} ${escapeHtml(a.time)}</td>
      <td>${escapeHtml(a.reason)}</td>
      <td><span class="badge badge-status badge-${a.status.toLowerCase()}">${escapeHtml(a.status)}</span></td>
      <td>${a.status === "Scheduled" ? `<button class="btn btn-sm btn-outline-secondary" onclick="cancelAppointment('${a.id}')">Cancel</button>` : "—"}</td>
    </tr>`).join("") || `<tr><td colspan="5" class="text-center text-muted py-4">You have no appointments yet — book one below.</td></tr>`;
};

document.addEventListener("submit", function (e) {
  if (e.target.id !== "patBookApptForm") return;
  e.preventDefault();
  const me = currentAccount();
  const doctorId = document.getElementById("patApptDoctorSelect").value;
  STATE.appointments.push({
    id: nextId("appointments", "A"), patientId: me.id, doctorId,
    date: document.getElementById("patApptDate").value,
    time: document.getElementById("patApptTime").value,
    reason: document.getElementById("patApptReason").value.trim(),
    status: "Scheduled"
  });
  saveState();
  toast("Appointment requested.");
  e.target.reset();
  SECTION_RENDERERS["pat-appointments"]();
});

SECTION_RENDERERS["pat-records"] = function () {
  const me = currentAccount();
  const mine = STATE.medicalRecords.filter(r => r.patientId === me.id);
  document.getElementById("patRecordsBody").innerHTML = mine.map(r => `
    <tr>
      <td>${escapeHtml(r.date)}</td>
      <td>${escapeHtml(staffName(r.doctorId))}</td>
      <td>${escapeHtml(r.diagnosis)}</td>
      <td>${escapeHtml(r.treatment)}</td>
      <td>${escapeHtml(r.notes)}</td>
    </tr>`).join("") || `<tr><td colspan="5" class="text-center text-muted py-4">No medical records on file yet.</td></tr>`;
};

SECTION_RENDERERS["pat-prescriptions"] = function () {
  const me = currentAccount();
  const mine = STATE.prescriptions.filter(rx => rx.patientId === me.id);
  document.getElementById("patRxBody").innerHTML = mine.map(rx => `
    <tr>
      <td>${escapeHtml(rx.medicine)}</td>
      <td>${escapeHtml(rx.dosage)}</td>
      <td>${escapeHtml(staffName(rx.doctorId))}</td>
      <td>${escapeHtml(rx.date)}</td>
      <td><span class="badge badge-status badge-${rx.status === "Dispensed" ? "completed" : "pending"}">${escapeHtml(rx.status)}</span></td>
    </tr>`).join("") || `<tr><td colspan="5" class="text-center text-muted py-4">No prescriptions on file yet.</td></tr>`;
};

SECTION_RENDERERS["pat-lab"] = function () {
  const me = currentAccount();
  const mine = STATE.labTests.filter(t => t.patientId === me.id);
  document.getElementById("patLabBody").innerHTML = mine.map(t => `
    <tr>
      <td>${escapeHtml(t.testName)}</td>
      <td>${escapeHtml(t.date)}</td>
      <td><span class="badge badge-status badge-${t.status === "Completed" ? "completed" : "pending"}">${escapeHtml(t.status)}</span></td>
      <td>${t.result ? escapeHtml(t.result) : `<span class="text-muted">Pending</span>`}</td>
    </tr>`).join("") || `<tr><td colspan="4" class="text-center text-muted py-4">No lab tests on file yet.</td></tr>`;
};

SECTION_RENDERERS["pat-billing"] = function () {
  const me = currentAccount();
  const mine = STATE.bills.filter(b => b.patientId === me.id);
  document.getElementById("patBillingBody").innerHTML = mine.map(b => `
    <tr>
      <td>${escapeHtml(b.date)}</td>
      <td>${formatNaira(b.total)}</td>
      <td>${formatNaira(b.amountPaid)}</td>
      <td>${formatNaira(b.total - b.amountPaid)}</td>
      <td><span class="badge badge-status badge-${b.status.toLowerCase()}">${escapeHtml(b.status)}</span></td>
    </tr>`).join("") || `<tr><td colspan="5" class="text-center text-muted py-4">No bills on file yet.</td></tr>`;
};

SECTION_RENDERERS["pat-messages"] = function () {
  const me = currentAccount();
  const mine = STATE.messages.filter(m => m.patientId === me.id);
  document.getElementById("patMessagesList").innerHTML = mine.map(m => `
    <div class="chart-card mb-3">
      <div class="cc-id">${escapeHtml(m.date)}</div>
      <h5>${escapeHtml(m.subject)}</h5>
      <p class="mb-2">${escapeHtml(m.body)}</p>
      ${m.reply
        ? `<div class="border-top pt-2 mt-2"><span class="badge bg-teal mb-1">Hospital Reply</span><p class="mb-0">${escapeHtml(m.reply)}</p></div>`
        : `<p class="text-muted small mb-0">Awaiting a reply from our team.</p>`}
    </div>`).join("") || `<p class="text-muted">You haven't sent any messages yet.</p>`;
};

document.addEventListener("submit", function (e) {
  if (e.target.id !== "patMessageForm") return;
  e.preventDefault();
  const me = currentAccount();
  STATE.messages.push({
    id: nextId("messages", "MSG"), patientId: me.id, date: today(),
    subject: document.getElementById("patMsgSubject").value.trim(),
    body: document.getElementById("patMsgBody").value.trim(),
    reply: ""
  });
  saveState();
  toast("Message sent to our team.");
  e.target.reset();
  SECTION_RENDERERS["pat-messages"]();
});

/* =====================================================================
   AUTH FORM WIRING (staff login, patient login, patient signup)
   ===================================================================== */
document.addEventListener("submit", function (e) {
  if (e.target.id !== "staffLoginForm") return;
  e.preventDefault();
  const identifier = document.getElementById("staffIdentifier").value;
  const password = document.getElementById("staffPassword").value;
  const result = attemptLogin(identifier, password, "staff");
  if (result.success) { e.target.reset(); nav("dashboard"); }
  else showAuthError("Those staff credentials don't match our records. Please check and try again.");
});

document.addEventListener("submit", function (e) {
  if (e.target.id !== "patientLoginForm") return;
  e.preventDefault();
  const identifier = document.getElementById("patientIdentifier").value;
  const password = document.getElementById("patientPassword").value;
  const result = attemptLogin(identifier, password, "patient");
  if (result.success) { e.target.reset(); nav("dashboard"); }
  else showAuthError("Those patient credentials don't match our records. Please check and try again, or create an account.");
});

document.addEventListener("submit", function (e) {
  if (e.target.id !== "patientSignupForm") return;
  e.preventDefault();
  const fullName = document.getElementById("suFullName").value.trim();
  const email = document.getElementById("suEmail").value.trim();
  const phone = document.getElementById("suPhone").value.trim();
  const nin = document.getElementById("suNin").value.trim();
  const password = document.getElementById("suPassword").value;
  const passwordConfirm = document.getElementById("suPasswordConfirm").value;

  if (!email.toLowerCase().endsWith("@gmail.com")) { showAuthError("Please sign up with a Gmail address (it should end in @gmail.com)."); return; }
  if (!/^\d{11}$/.test(nin)) { showAuthError("NIN must be exactly 11 digits, with no letters or spaces."); return; }
  if (password.length < 6) { showAuthError("Your password should be at least 6 characters long."); return; }
  if (password !== passwordConfirm) { showAuthError("Those two passwords don't match. Please re-type them."); return; }

  const result = attemptPatientSignup({ fullName, email, phone, nin, password });
  if (!result.success) { showAuthError(result.message); return; }
  e.target.reset();
  toast(`Welcome, ${result.account.fullName}! Your patient account is ready.`);
  nav("dashboard");
});

/* ---------------------------------------------------------------------
   GUEST CONTACT FORM (public "Customer Service" page — not tied to a
   logged-in account, just a friendly on-screen confirmation since
   there's no server to actually send this anywhere)
   --------------------------------------------------------------------- */
document.addEventListener("submit", function (e) {
  if (e.target.id !== "guestContactForm") return;
  e.preventDefault();
  const name = document.getElementById("guestName").value.trim();
  const confirmation = document.getElementById("guestFormConfirmation");
  confirmation.textContent = `Thanks${name ? ", " + name : ""}! Your message has been received. Our team will get back to you shortly.`;
  confirmation.classList.remove("d-none");
  e.target.reset();
});

/* =====================================================================
   PAGE LOAD
   ===================================================================== */
document.addEventListener("DOMContentLoaded", function () {
  setupScrollReveal();
  populateGlobalPatientSelects();
  populateGlobalDoctorSelects();
  populateGlobalWardSelects();
  refreshAuthBar();

  // If a session already exists (restored from localStorage), skip
  // straight to the dashboard instead of showing the homepage.
  if (STATE.session && currentAccount()) {
    nav("dashboard");
  } else {
    nav("home");
  }
});