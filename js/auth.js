/* =====================================================================
   auth.js — LOGIN, SIGN-UP, AND SESSION MANAGEMENT
   (Needs data.js loaded first — it uses STATE and its helpers.)

   HOW "BEING LOGGED IN" WORKS HERE:
   STATE.session is either null (nobody logged in) or an object like
   { type: "staff", id: "S003" }. Because STATE is saved to
   localStorage after every change, the session survives a page
   refresh too — reopen the tab and you're still logged in, just like
   a real website. logout() sets it back to null and saves.

   Only PATIENTS can self-register (attemptPatientSignup). Staff
   accounts are created by the Admin from inside the Admin dashboard —
   a real hospital would never let a random visitor make themselves a
   "Doctor" account through a public form.
   ===================================================================== */

/* ---------------------------------------------------------------------
   LOGIN
   identifier = whatever the visitor typed into the email/phone box
   password   = whatever they typed into the password box
   type       = "staff" or "patient", from which tab they had open
   --------------------------------------------------------------------- */
function attemptLogin(identifier, password, type) {
  const account = type === "staff"
    ? findStaffByLogin(identifier.trim())
    : findPatientByLogin(identifier.trim());

  if (account && account.password === password) {
    STATE.session = { type, id: account.id };
    saveState();
    return { success: true, account };
  }
  return { success: false };
}

/* ---------------------------------------------------------------------
   SIGN-UP (patients only)
   --------------------------------------------------------------------- */
function attemptPatientSignup(data) {
  const emailTaken = STATE.patients.some(p => p.email === data.email) ||
                      STATE.staff.some(s => s.email === data.email);
  const ninTaken = STATE.patients.some(p => p.nin === data.nin);

  if (emailTaken) return { success: false, message: "That email is already registered. Please log in instead." };
  if (ninTaken)   return { success: false, message: "That NIN is already linked to an existing account." };

  const newPatient = {
    id: nextId("patients", "P"),
    fullName: data.fullName, email: data.email, phone: data.phone,
    password: data.password, nin: data.nin,
    dob: "", gender: "", bloodGroup: "", allergies: [], emergencyContact: ""
  };
  STATE.patients.push(newPatient);
  STATE.session = { type: "patient", id: newPatient.id };
  saveState();
  return { success: true, account: newPatient };
}

/* ---------------------------------------------------------------------
   STAFF CREATION (admin-only — called from the Admin dashboard)
   --------------------------------------------------------------------- */
function createStaffAccount(data) {
  const emailTaken = STATE.staff.some(s => s.email === data.email) ||
                      STATE.patients.some(p => p.email === data.email);
  if (emailTaken) return { success: false, message: "That email is already in use." };

  const newStaff = {
    id: nextId("staff", "S"),
    fullName: data.fullName, email: data.email, phone: data.phone,
    password: data.password, role: data.role
  };
  STATE.staff.push(newStaff);
  saveState();
  return { success: true, account: newStaff };
}

/* ---------------------------------------------------------------------
   CURRENT-USER HELPERS
   --------------------------------------------------------------------- */
function currentAccount() {
  if (!STATE.session) return null;
  return STATE.session.type === "staff" ? getStaff(STATE.session.id) : getPatient(STATE.session.id);
}

function isLoggedInAs(type) {
  return !!STATE.session && STATE.session.type === type;
}

function logout() {
  STATE.session = null;
  saveState();
  nav("home");
}
