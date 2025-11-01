// Simple SPA logic + axios API helpers
const BASE_URL = "http://localhost:3000"; // set if needed

// axios default
axios.defaults.baseURL = BASE_URL;
axios.interceptors.request.use((cfg) => {
  const token = localStorage.getItem("token");
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

// --- Helper DOM shorteners
const $ = (id) => document.getElementById(id);

// pages
const PAGES = {
  home: $("page-home"),
  services: $("page-services"),
  staff: $("page-staff"),
  book: $("page-book"),
  myAppointments: $("page-my-appointments"),
  auth: $("page-auth"),
};

const navLogin = $("nav-login");
const navLogout = $("nav-logout");

// init
document.addEventListener("DOMContentLoaded", () => {
  $("year").textContent = new Date().getFullYear();
  bindNav();
  showPage("home");
  loadServices();
  loadStaff();
  checkAuthUI();
});

// bind nav buttons
function bindNav() {
  $("nav-home").addEventListener("click", (e) => {
    e.preventDefault();
    showPage("home");
  });
  $("nav-services").addEventListener("click", (e) => {
    e.preventDefault();
    showPage("services");
  });
  $("nav-staff").addEventListener("click", (e) => {
    e.preventDefault();
    showPage("staff");
  });
  $("nav-appointments").addEventListener("click", (e) => {
    e.preventDefault();
    showPage("myAppointments");
    if (isLogged()) loadMyAppointments();
  });
  navLogin.addEventListener("click", (e) => {
    e.preventDefault();
    showPage("auth");
    showLogin();
  });
  navLogout.addEventListener("click", (e) => {
    e.preventDefault();
    logout();
  });

  // CTA binds
  $("cta-services").addEventListener("click", () => showPage("services"));
  $("cta-book").addEventListener("click", () => {
    showPage("book");
    populateBookingForm();
  });

  // auth forms
  $("show-register").addEventListener("click", showRegister);
  $("show-login").addEventListener("click", showLogin);
  $("btn-login").addEventListener("click", login);
  $("btn-register").addEventListener("click", register);

  // services search
  $("services-search").addEventListener("input", (e) =>
    filterServices(e.target.value)
  );

  // booking workflow
  $("book-date").addEventListener("change", loadSlotsForBooking);
  $("book-staff").addEventListener("change", loadSlotsForBooking);
  $("book-service").addEventListener("change", loadSlotsForBooking);
  $("btn-book").addEventListener("click", confirmBooking);
}

// Show one page and hide others
function showPage(name) {
  Object.values(PAGES).forEach((p) => p.classList.add("hidden-section"));
  PAGES[name].classList.remove("hidden-section");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// AUTH helpers
function isLogged() {
  return !!localStorage.getItem("token");
}
function checkAuthUI() {
  if (isLogged()) {
    navLogin.classList.add("hidden");
    navLogout.classList.remove("hidden");
  } else {
    navLogin.classList.remove("hidden");
    navLogout.classList.add("hidden");
  }
}
function saveToken(token) {
  localStorage.setItem("token", token);
  checkAuthUI();
}
function logout() {
  localStorage.removeItem("token");
  checkAuthUI();
  showPage("home");
}

// --- API interactions

// Load services
let servicesCache = [];
async function loadServices() {
  try {
    const res = await axios.get("/services");
    servicesCache = res.data.services || res.data; // flexible
    renderServices(servicesCache);
    populateBookingServices();
  } catch (err) {
    console.error("Load services error", err);
    // Fallback: show empty
    renderServices([]);
  }
}

function renderServices(list) {
  const el = $("services-list");
  el.innerHTML = "";
  if (!list.length) {
    el.innerHTML = `<div class="p-6 text-slate-500">No services found</div>`;
    return;
  }
  list.forEach((s) => {
    const card = document.createElement("div");
    card.className = "p-4 border rounded-lg bg-white";
    card.innerHTML = `
      <h3 class="font-semibold text-lg">${s.name}</h3>
      <p class="text-slate-500 text-sm mt-1">${s.description || ""}</p>
      <div class="mt-3 flex items-center justify-between">
        <div class="text-indigo-600 font-medium">₹${s.price}</div>
        <div class="text-sm text-slate-500">${s.durationMinutes} min</div>
      </div>
      <div class="mt-3">
        <button data-service-id="${
          s.id
        }" class="btn-view text-indigo-600 text-sm underline">Book</button>
      </div>
    `;
    el.appendChild(card);
  });

  // bind book buttons
  document.querySelectorAll(".btn-view").forEach((b) => {
    b.addEventListener("click", (e) => {
      const sid = e.currentTarget.dataset.serviceId;
      showPage("book");
      populateBookingForm(sid);
    });
  });
}

function filterServices(q) {
  if (!q) return renderServices(servicesCache);
  const filtered = servicesCache.filter((s) =>
    (s.name + s.description).toLowerCase().includes(q.toLowerCase())
  );
  renderServices(filtered);
}

// Load staff
let staffCache = [];
async function loadStaff() {
  try {
    const res = await axios.get("/staff");
    staffCache = res.data.staff || res.data;
    renderStaff(staffCache);
    populateBookingStaff();
  } catch (err) {
    console.error("Load staff err", err);
    renderStaff([]);
  }
}

function renderStaff(list) {
  const el = $("staff-list");
  el.innerHTML = "";
  if (!list.length) {
    el.innerHTML = `<div class="p-6 text-slate-500">No staff found</div>`;
    return;
  }
  list.forEach((s) => {
    const card = document.createElement("div");
    card.className = "p-4 border rounded-lg bg-white";
    card.innerHTML = `
      <div class="flex items-center justify-between">
        <div>
          <div class="font-semibold">${s.user?.name || "Staff"}</div>
          <div class="text-sm text-slate-500">${s.specialization || ""}</div>
        </div>
        <div class="text-sm text-slate-500">Services: ${
          (s.services || []).length
        }</div>
      </div>
      <div class="mt-3">
        <button class="btn-check-slots text-indigo-600 text-sm underline" data-staff-id="${
          s.id
        }">View Slots</button>
      </div>
    `;
    el.appendChild(card);
  });

  document.querySelectorAll(".btn-check-slots").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const id = e.currentTarget.dataset.staffId;
      showPage("book");
      populateBookingForm(null, id);
    });
  });
}

// ------------------ BOOKING FLOW ------------------

async function populateBookingServices() {
  const sel = $("book-service");
  sel.innerHTML = `<option value="">Select a service</option>`;
  servicesCache.forEach((s) => {
    const opt = document.createElement("option");
    opt.value = s.id;
    opt.textContent = `${s.name} — ₹${s.price} (${s.durationMinutes}m)`;
    sel.appendChild(opt);
  });
}

async function populateBookingStaff() {
  const sel = $("book-staff");
  sel.innerHTML = `<option value="">Any staff</option>`;
  staffCache.forEach((s) => {
    const opt = document.createElement("option");
    opt.value = s.id;
    opt.textContent = `${s.user?.name || "Staff"} — ${s.specialization || ""}`;
    sel.appendChild(opt);
  });
}

// optionally open with preselected service or staff
function populateBookingForm(serviceId = null, staffId = null) {
  if (serviceId) $("book-service").value = serviceId;
  if (staffId) $("book-staff").value = staffId;
  $("book-date").value = "";
  $(
    "book-slot"
  ).innerHTML = `<option value="">Select date & staff to load slots</option>`;
}

// Load slots from server
async function loadSlotsForBooking() {
  const staffId = $("book-staff").value;
  const serviceId = $("book-service").value;
  const date = $("book-date").value;
  const sel = $("book-slot");
  sel.innerHTML = `<option>Loading...</option>`;
  if (!serviceId || !date || !staffId) {
    sel.innerHTML = `<option value="">Select service, staff and date</option>`;
    return;
  }
  try {
    const res = await axios.get(`/appointments/slots`, {
      params: { staffProfileId: staffId, serviceId, date },
    });
    const slots = res.data.availableSlots || [];
    if (!slots.length) {
      sel.innerHTML = `<option value="">No slots available</option>`;
      return;
    }
    sel.innerHTML = "";
    slots.forEach((s) => {
      const opt = document.createElement("option");
      const iso = new Date(s).toISOString();
      opt.value = iso;
      opt.textContent = new Date(s).toLocaleString();
      sel.appendChild(opt);
    });
  } catch (err) {
    console.error("slots err", err);
    sel.innerHTML = `<option value="">Failed to load slots</option>`;
  }
}

// Confirm booking
async function confirmBooking() {
  if (!isLogged()) {
    alert("Please login to book");
    showPage("auth");
    showLogin();
    return;
  }

  const staffProfileId = $("book-staff").value;
  const serviceId = $("book-service").value;
  const appointmentDate = $("book-slot").value;

  if (!staffProfileId || !serviceId || !appointmentDate) {
    alert("Please choose staff, service and slot");
    return;
  }

  try {
    const res = await axios.post(`/appointments/book`, {
      staffProfileId,
      serviceId,
      appointmentDate,
    });
    alert("Booked! Check your email for confirmation");
    showPage("myAppointments");
    loadMyAppointments();
  } catch (err) {
    console.error("book err", err);
    alert(err.response?.data?.message || "Booking failed");
  }
}

// ------------------ AUTH ------------------

function showLogin() {
  $("auth-title").textContent = "Login";
  $("login-form").classList.remove("hidden");
  $("register-form").classList.add("hidden");
  showPage("auth");
}
function showRegister() {
  $("auth-title").textContent = "Register";
  $("login-form").classList.add("hidden");
  $("register-form").classList.remove("hidden");
  showPage("auth");
}
async function login() {
  const email = $("login-email").value.trim();
  const password = $("login-password").value.trim();
  if (!email || !password) return alert("Email & password required");

  try {
    const res = await axios.post("/auth/login", { email, password });
    const { token, user } = res.data;

    if (!token) return alert("Login failed");

    saveToken(token);

    console.log("Logged in user:", user.role);

    if (user.role === "admin") {
      alert("Welcome Admin!");
      window.location.href = "./admin.html";
    } else {
      alert("Login successful");
      showPage("home");
    }
  } catch (err) {
    console.error("login err", err);
    alert(err.response?.data?.message || "Login failed");
  }
}

async function register() {
  const name = $("reg-name").value.trim();
  const email = $("reg-email").value.trim();
  const phone = $("reg-phone").value.trim();
  const password = $("reg-password").value.trim();
  if (!name || !email || !password) return alert("All fields required");
  try {
    const res = await axios.post("/auth/signup", {
      name,
      email,
      phone,
      password,
    });
    alert("Registration successful. Please login.");
    showLogin();
  } catch (err) {
    console.error("register err", err);
    alert(err.response?.data?.message || "Registration failed");
  }
}

// ------------------ MY APPOINTMENTS ------------------

async function loadMyAppointments() {
  try {
    const res = await axios.get("/appointments/my-appointments");
    const list = res.data.appointments || [];
    const el = $("my-appointments-list");
    el.innerHTML = "";
    if (!list.length)
      el.innerHTML = `<div class="p-4 text-slate-500">No appointments</div>`;
    list.forEach((a) => {
      const card = document.createElement("div");
      card.className =
        "p-4 border rounded bg-white flex justify-between items-center";
      const left = document.createElement("div");
      left.innerHTML = `
        <div class="font-semibold">${a.service?.name || "Service"}</div>
        <div class="text-sm text-slate-600">${new Date(
          a.appointmentDate
        ).toLocaleString()}</div>
        <div class="text-sm text-slate-500">Staff: ${
          a.staff?.user?.name || "—"
        }</div>
      `;
      const right = document.createElement("div");
      right.innerHTML = `<div class="text-sm text-slate-500">${a.status}</div>`;
      card.appendChild(left);
      card.appendChild(right);
      el.appendChild(card);
    });
  } catch (err) {
    console.error("my appts", err);
  }
}
