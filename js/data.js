/* =====================================================================
   data.js — THE "DATABASE" FOR LIFECARE GENERAL HOSPITAL
   ===================================================================== */

const STORAGE_KEY = "lifecare_state_v1";

/* ---------------------------------------------------------------------
   SEED DATA — what a brand new visitor sees before they change anything
   --------------------------------------------------------------------- */
const SEED_DATA = {

  // ----- 1. STAFF ACCOUNTS -----
  // role is one of: admin, receptionist, doctor, nurse, pharmacist, labtech, accountant
  staff: [
    { id: "S001", fullName: "Margaret Obi",        email: "admin@lifecare.com",     phone: "08030000001", password: "admin123", role: "admin" },
    { id: "S002", fullName: "Tunde Bakare",        email: "reception@lifecare.com", phone: "08030000002", password: "front123", role: "receptionist" },
    { id: "S003", fullName: "Dr. Folake Adeyemi",  email: "doctor@lifecare.com",    phone: "08030000003", password: "doc123",   role: "doctor", specialty: "General Medicine" },
    { id: "S004", fullName: "Dr. Ibrahim Sule",    email: "doctor2@lifecare.com",   phone: "08030000004", password: "doc123",   role: "doctor", specialty: "Pediatrics" },
    { id: "S005", fullName: "Chidinma Eze",        email: "nurse@lifecare.com",     phone: "08030000005", password: "nurse123", role: "nurse" },
    { id: "S006", fullName: "Pharm. Yusuf Lawal",  email: "pharmacy@lifecare.com",  phone: "08030000006", password: "pharm123", role: "pharmacist" },
    { id: "S007", fullName: "Blessing Okonkwo",    email: "lab@lifecare.com",       phone: "08030000007", password: "lab123",   role: "labtech" },
    { id: "S008", fullName: "David Umeh",          email: "accounts@lifecare.com",  phone: "08030000008", password: "acct123",  role: "accountant" }
  ],

  // ----- 2. PATIENT ACCOUNTS -----
  patients: [
    { id: "P001", fullName: "Grace Nwosu",   email: "grace@example.com",  phone: "08111111111", password: "patient123", nin: "20000000001", dob: "1994-03-12", gender: "Female", bloodGroup: "O+",  allergies: ["Penicillin"], emergencyContact: "Peter Nwosu - 08122223333" },
    { id: "P002", fullName: "Samuel Okafor", email: "samuel@example.com", phone: "08144445555", password: "patient123", nin: "20000000002", dob: "1988-07-25", gender: "Male",   bloodGroup: "A-",  allergies: [],              emergencyContact: "Ngozi Okafor - 08166667777" }
  ],

  // ----- 3. WARDS (for admissions) -----
  wards: [
    { id: "W1", name: "General Ward A", totalBeds: 6 },
    { id: "W2", name: "General Ward B", totalBeds: 6 },
    { id: "W3", name: "Maternity Ward", totalBeds: 4 },
    { id: "W4", name: "Pediatric Ward", totalBeds: 4 },
    { id: "W5", name: "ICU",            totalBeds: 2 }
  ],

  // ----- 4. APPOINTMENTS ----- status: Scheduled | Completed | Cancelled
  appointments: [
    { id: "A1001", patientId: "P001", doctorId: "S003", date: "2026-07-05", time: "10:00", reason: "Persistent headache", status: "Scheduled" },
    { id: "A1002", patientId: "P002", doctorId: "S004", date: "2026-07-04", time: "13:30", reason: "Child's routine check-up", status: "Scheduled" },
    { id: "A1003", patientId: "P001", doctorId: "S003", date: "2026-06-10", time: "09:00", reason: "Fever and body pain", status: "Completed" }
  ],

  // ----- 5. ADMISSIONS ----- status: Admitted | Discharged
  admissions: [
    { id: "AD1", patientId: "P002", wardId: "W1", bed: 3, admittedOn: "2026-06-20", status: "Admitted", reason: "Observation after malaria treatment" }
  ],

  // ----- 6. MEDICAL RECORDS (diagnoses/consultations) -----
  medicalRecords: [
    { id: "MR1", patientId: "P001", doctorId: "S003", date: "2026-06-10", diagnosis: "Malaria (uncomplicated)", treatment: "Artemether-Lumefantrine, 3 days course", notes: "Patient responded well. Advised plenty of fluids and rest." }
  ],

  // ----- 7. VITALS -----
  vitals: [
    { id: "V1", patientId: "P002", recordedBy: "S005", date: "2026-06-21", temp: "37.8°C", bp: "118/76", pulse: "82 bpm", resp: "18/min", notes: "Stable, slight fever down from yesterday." }
  ],

  // ----- 8. PRESCRIPTIONS ----- status: Pending | Dispensed
  prescriptions: [
    { id: "RX1", patientId: "P001", doctorId: "S003", date: "2026-06-10", medicine: "Artemether-Lumefantrine", dosage: "1 tablet twice daily for 3 days", status: "Dispensed" },
    { id: "RX2", patientId: "P002", doctorId: "S004", date: "2026-06-20", medicine: "Paracetamol 500mg", dosage: "1 tablet every 6 hours as needed", status: "Pending" }
  ],

  // ----- 9. LAB TESTS ----- status: Requested | Completed
  labTests: [
    { id: "LT1", patientId: "P002", testName: "Malaria Parasite Test", requestedBy: "S004", date: "2026-06-20", status: "Completed", result: "Positive — P. falciparum, moderate parasite density" },
    { id: "LT2", patientId: "P001", testName: "Full Blood Count", requestedBy: "S003", date: "2026-06-23", status: "Requested", result: "" }
  ],

  // ----- 10. MEDICINE INVENTORY -----
  medicines: [
    { id: "M1", name: "Paracetamol 500mg",         quantity: 320, reorderLevel: 50, unitPrice: 50 },
    { id: "M2", name: "Artemether-Lumefantrine",   quantity: 18,  reorderLevel: 20, unitPrice: 1200 },
    { id: "M3", name: "Amoxicillin 500mg",         quantity: 140, reorderLevel: 40, unitPrice: 90 },
    { id: "M4", name: "ORS Sachets",               quantity: 8,   reorderLevel: 30, unitPrice: 150 },
    { id: "M5", name: "Vitamin C 1000mg",          quantity: 200, reorderLevel: 25, unitPrice: 70 }
  ],

  // ----- 11. BILLS ----- status: Paid | Unpaid | Partial
  bills: [
    { id: "B1", patientId: "P001", date: "2026-06-10", items: [ { desc: "Consultation", amount: 5000 }, { desc: "Medication - Artemether-Lumefantrine", amount: 3600 } ], total: 8600, amountPaid: 8600, status: "Paid" },
    { id: "B2", patientId: "P002", date: "2026-06-20", items: [ { desc: "Consultation", amount: 5000 }, { desc: "Malaria Test", amount: 2500 }, { desc: "Ward admission (per day)", amount: 6000 } ], total: 13500, amountPaid: 5000, status: "Partial" }
  ],

  // ----- 12. MESSAGES (patient <-> hospital) -----
  messages: [
    { id: "MSG1", patientId: "P002", date: "2026-06-21", subject: "Question about my son's medication", body: "Should the Paracetamol be given before or after food?", reply: "After food is best, to be gentle on the stomach. — Dr. Ibrahim Sule" }
  ],

  // ----- 13. SESSION (who is currently logged in, if anyone) -----
  session: null // becomes { type: "staff"|"patient", id: "S003" } after login
};

/* ---------------------------------------------------------------------
   LOAD / SAVE
   STATE starts as whatever is in localStorage; if this is the very
   first visit (nothing saved yet), we clone SEED_DATA instead.
   structuredClone makes a completely independent copy so editing
   STATE later never accidentally edits SEED_DATA too.
   --------------------------------------------------------------------- */
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.warn("Could not read saved hospital data, starting fresh.", err);
  }
  return structuredClone(SEED_DATA);
}

let STATE = loadState();

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(STATE));
}

// Wipes everything back to the original demo data — used by the
// "Reset demo data" link in case a testing session gets messy.
function resetState() {
  STATE = structuredClone(SEED_DATA);
  saveState();
  location.reload();
}

/* =====================================================================
   HELPERS — small reusable functions other files call instead of
   repeating the same logic everywhere.
   ===================================================================== */

// Generates a simple unique-enough ID, e.g. nextId("appointments", "A")
function nextId(collectionName, prefix) {
  return prefix + (1000 + STATE[collectionName].length + 1);
}

function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

// Format a number as Naira currency, e.g. formatNaira(8600) -> "₦8,600"
function formatNaira(amount) {
  return "₦" + Number(amount || 0).toLocaleString("en-NG");
}

// Today's date as "YYYY-MM-DD", used to timestamp new records.
function today() {
  return new Date().toISOString().split("T")[0];
}

function getPatient(id)  { return STATE.patients.find(p => p.id === id); }
function getStaff(id)    { return STATE.staff.find(s => s.id === id); }
function getWard(id)     { return STATE.wards.find(w => w.id === id); }
function staffName(id)   { const s = getStaff(id);   return s ? s.fullName : "—"; }
function patientName(id) { const p = getPatient(id); return p ? p.fullName : "—"; }

function findStaffByLogin(identifier)   { return STATE.staff.find(s => s.email === identifier || s.phone === identifier); }
function findPatientByLogin(identifier) { return STATE.patients.find(p => p.email === identifier || p.phone === identifier); }

// Human-friendly label for a role code, used in sidebars/badges
const ROLE_LABELS = {
  admin: "Administrator", receptionist: "Receptionist", doctor: "Doctor",
  nurse: "Nurse", pharmacist: "Pharmacist", labtech: "Lab Technician", accountant: "Accountant"
};
