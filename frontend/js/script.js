/* ============================
   Config & Utilities
   ============================ */

const API_BASE = "http://localhost:3000"; // change if needed

// helper: axios instance
const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
});
let currentPath = window.location.pathname || "/";

// attach token automatically
api.interceptors.request.use(
  (cfg) => {
    const token = localStorage.getItem("token");
    if (token) cfg.headers["Authorization"] = "Bearer " + token;
    return cfg;
  },
  (err) => Promise.reject(err)
);

// global state
const state = {
  user: JSON.parse(localStorage.getItem("user") || "null"), // { id, name, email, role } (optional)
};

// small helpers
const formatDateTime = (iso) => {
  const d = new Date(iso);
  return d.toLocaleString();
};

const showToast = (msg, type = "info") => {
  // simple alert fallback
  alert(msg);
};

/* ============================
   Auth helpers
   ============================ */

async function apiRegister({ name, email, phone, password }) {
  const res = await api.post("/auth/register", {
    name,
    email,
    phone,
    password,
  });
  return res.data;
}
async function apiLogin({ email, password }) {
  const res = await api.post("/auth/login", { email, password });
  return res.data;
}
async function fetchProfile() {
  const res = await api.get("/user/me");
  return res.data;
}
function saveAuth(token, user) {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
  state.user = user;
  document.getElementById("logoutBtn").classList.remove("hidden");
}
function clearAuth() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  state.user = null;
  document.getElementById("logoutBtn").classList.add("hidden");
}

/* ============================
   Router (simple) - SPA
   ============================ */

const routes = {};
function route(path, renderer) {
  routes[path] = renderer;
}
function navigate(path, params) {
  currentPath = path;
  if (path === "/") path = "/frontend/";

  window.history.pushState({ path, params }, "", path);
  renderRoute(path, params);
}
function renderRoute(path, params) {
  currentPath = path;
  if (path.startsWith("/frontend")) {
    path = path.replace("/frontend", "") || "/";
  }

  const renderer = routes[path] || routes["/404"];
  renderer && renderer(params);
  renderSidebar(); // update active nav
}

/* handle browser back/forward */
window.onpopstate = (e) => {
  const path = window.location.pathname;
  renderRoute(path, e.state?.params);
};

/* ============================
   UI: Sidebar and Topbar
   ============================ */

function renderSidebar() {
  const navList = document.getElementById("navList");
  navList.innerHTML = "";

  const user = state.user;
  // Public links
  navList.appendChild(navItem("Home", "/frontend/", "home"));
  navList.appendChild(navItem("Services", "/services", "list"));

  if (!user) {
    navList.appendChild(navItem("Login / Register", "/login", "login"));
  } else {
    // common
    if (user.role === "customer") {
      navList.appendChild(navItem("My Appointments", "/my-appointments"));
      navList.appendChild(navItem("My Reviews", "/my-reviews"));
    }
    if (user.role === "staff") {
      navList.appendChild(
        navItem("Assigned Appointments", "/staff/appointments")
      );
      navList.appendChild(navItem("Respond Reviews", "/staff/reviews"));
    }
    if (user.role === "admin") {
      navList.appendChild(navItem("Admin Dashboard", "/admin/dashboard"));
      navList.appendChild(navItem("Manage Users", "/admin/users"));
      navList.appendChild(
        navItem("Manage Appointments", "/admin/appointments")
      );
    }
    navList.appendChild(navItem("Profile", "/profile"));
    navList.appendChild(navItem("Logout", "/logout"));
  }

  // Mobile nav
  const mobile = document.getElementById("mobileNavBtns");
  mobile && (mobile.innerHTML = "");
  const mobileOrder = ["/", "/services", state.user ? "/profile" : "/login"];
  mobileOrder.forEach((p) => {
    const btn = document.createElement("button");
    btn.className = "px-3 py-2 rounded-md text-sm";
    btn.innerText =
      p === "/"
        ? "Home"
        : p === "/services"
        ? "Services"
        : state.user
        ? "Profile"
        : "Login";
    btn.onclick = () => navigate(p);
    mobile.appendChild(btn);
  });

  // topbar greeting
  const g = document.getElementById("userGreeting");
  g.innerText = state.user ? `Hi, ${state.user.name}` : "Welcome, guest";

  const badge = document.getElementById("topRoleBadge");
  badge.innerText = state.user ? `(${state.user.role})` : "";
}

function navItem(title, path, icon) {
  const a = document.createElement("div");
  a.className = "p-2 rounded-md hover:bg-gray-50 clickable";

  // ✅ Active state check (SPA friendly)
  if (currentPath === path) {
    a.classList.add("nav-active", "bg-indigo-600", "text-white");
  }

  a.onclick = () => {
    if (path === "/logout") return doLogout();
    currentPath = path; // ✅ update state
    navigate(path);
  };

  a.innerHTML = `
    <div class="flex items-center gap-3">
      <div class="w-6 h-6 rounded flex items-center justify-center text-sm font-semibold 
      ${
        currentPath === path
          ? "bg-white text-indigo-600"
          : "text-indigo-600 bg-indigo-50"
      }">
        ${icon ? icon[0].toUpperCase() : title[0]}
      </div>
      <div class="text-sm font-medium">${title}</div>
    </div>
  `;
  return a;
}

/* ============================
   Pages / Components
   ============================ */

/* Home */
route("/", async () => {
  document.getElementById("content").innerHTML = `
    <div class="w-full">

      <!-- Hero Banner -->
      <section class="relative bg-[url('https://images.unsplash.com/photo-1560066984-138dadb4c035?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1074')] bg-cover bg-center rounded-2xl shadow-lg overflow-hidden">
        <div class="bg-black/40 p-10 md:p-16 text-white">
          <h2 class="text-4xl font-bold mb-3">Welcome to Salonly</h2>
          <p class="text-lg opacity-90">
            Your beauty, our duty — book premium salon services at your convenience.
          </p>
          <button id="exploreServices" class="mt-6 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-semibold">
            Explore Services
          </button>
        </div>
      </section>


      <!-- About Section -->
      <section class="mt-10 max-w-5xl mx-auto text-center">
        <h3 class="text-2xl font-semibold mb-3 text-gray-800">Why Choose Salonly?</h3>
        <p class="text-gray-600 text-sm md:text-base max-w-3xl mx-auto">
          We bring together expert stylists, premium products, and seamless online booking
          to ensure you always look and feel your best. From quick touch-ups to full beauty 
          treatments — we’ve got you covered.
        </p>
      </section>


      <!-- Services Showcase -->
      <section class="mt-12 max-w-6xl mx-auto">
        <h3 class="text-xl font-semibold mb-5">Popular Services</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">

          <div class="rounded-xl overflow-hidden shadow bg-white">
            <img src="https://images.unsplash.com/photo-1580618672591-eb180b1a973f?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1169" class="h-40 w-full object-cover">
            <div class="p-4">
              <p class="font-semibold text-gray-800">Hair Styling</p>
              <p class="text-xs text-gray-500">Trendy cuts & styling</p>
            </div>
          </div>

          <div class="rounded-xl overflow-hidden shadow bg-white">
            <img src="https://images.unsplash.com/photo-1690749138086-7422f71dc159?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=627" class="h-40 w-full object-cover">
            <div class="p-4">
              <p class="font-semibold text-gray-800">Nail Art</p>
              <p class="text-xs text-gray-500">Creative nail designs</p>
            </div>
          </div>

          <div class="rounded-xl overflow-hidden shadow bg-white">
            <img src="https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1170" class="h-40 w-full object-cover">
            <div class="p-4">
              <p class="font-semibold text-gray-800">Facial & Skin Care</p>
              <p class="text-xs text-gray-500">Glow & hydration</p>
            </div>
          </div>

        </div>

        <div class="text-center mt-6">
          <button id="browseBtn" class="px-6 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700">
            View All Services →
          </button>
        </div>
      </section>
    </div>
  `;

  document.getElementById("exploreServices").onclick = () =>
    navigate("/frontend/service.html");
  document.getElementById("browseBtn").onclick = () =>
    navigate("/frontend/service.html");
});

/* Login/Register page (split view) */
route("/login", () => {
  document.getElementById("content").innerHTML = `
    <div class="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="p-6 rounded-xl glass shadow">
        <h2 class="text-2xl font-semibold">Login</h2>
        <form id="loginForm" class="mt-4 space-y-3">
          <input id="loginEmail" class="w-full p-3 border rounded" placeholder="Email" />
          <input id="loginPassword" type="password" class="w-full p-3 border rounded" placeholder="Password" />
          <button class="px-4 py-2 bg-indigo-600 text-white rounded">Login</button>
        </form>
      </div>

      <div class="p-6 rounded-xl glass shadow">
        <h2 class="text-2xl font-semibold">Register</h2>
        <form id="regForm" class="mt-4 space-y-3">
          <input id="regName" class="w-full p-3 border rounded" placeholder="Full name" />
          <input id="regEmail" class="w-full p-3 border rounded" placeholder="Email" />
          <input id="regPhone" class="w-full p-3 border rounded" placeholder="Phone (optional)" />
          <input id="regPassword" type="password" class="w-full p-3 border rounded" placeholder="Password" />
          <button class="px-4 py-2 bg-green-600 text-white rounded">Register</button>
        </form>
      </div>
    </div>
  `;

  document.getElementById("loginForm").onsubmit = async (e) => {
    e.preventDefault();
    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;
    try {
      const data = await api.post("/auth/login", { email, password });
      // backend returns token and user maybe
      const token = data.data.token || data.data.accessToken;
      const user = data.data.user || {
        name: data.data.user?.name || email,
        role: data.data.user?.role || "customer",
        id: data.data.user?.id,
      };
      saveAuth(token, user);
      showToast("Logged in");
      navigate("/");
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || "Login failed");
    }
  };

  document.getElementById("regForm").onsubmit = async (e) => {
    e.preventDefault();
    const name = document.getElementById("regName").value;
    const email = document.getElementById("regEmail").value;
    const phone = document.getElementById("regPhone").value;
    const password = document.getElementById("regPassword").value;
    try {
      const res = await api.post("/auth/register", {
        name,
        email,
        phone,
        password,
      });
      showToast("Registered — please login");
      navigate("/login");
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || "Registration failed");
    }
  };
});

/* Services list + booking */
route("/services", async () => {
  const content = document.getElementById("content");
  content.innerHTML =
    '<div class="max-w-5xl mx-auto"><h2 class="text-xl mb-4">Services</h2><div id="servicesGrid" class="grid gap-4 md:grid-cols-2"></div></div>';
  try {
    const res = await api.get("/services");
    const services = res.data.services || res.data; // tolerate different shapes
    const grid = document.getElementById("servicesGrid");
    grid.innerHTML = "";
    services.forEach((s) => {
      const card = document.createElement("div");
      card.className =
        "bg-white p-4 rounded-xl shadow flex flex-col justify-between";
      card.innerHTML = `
        <div>
          <h3 class="font-semibold">${s.name}</h3>
          <p class="text-sm text-gray-600">${s.description || ""}</p>
        </div>
        <div class="mt-4 flex items-center justify-between">
          <div class="text-indigo-600 font-bold">₹${s.price}</div>
          <div class="text-sm text-gray-500">${s.durationMinutes} mins</div>
          <button class="px-3 py-1 bg-indigo-600 text-white rounded bookBtn" data-id="${
            s.id
          }">Book</button>
        </div>
      `;
      grid.appendChild(card);
    });

    document.querySelectorAll(".bookBtn").forEach((b) => {
      b.onclick = (e) => {
        const serviceId = e.target.dataset.id;
        navigate("/book", { serviceId });
      };
    });
  } catch (err) {
    console.error(err);
    showToast("Failed to load services");
  }
});

/* Booking page (SPA param via history state) */
route("/book", async (params) => {
  // get serviceId from history state if not provided
  const serviceId =
    params?.serviceId || window.history.state?.params?.serviceId;
  if (!serviceId) {
    document.getElementById("content").innerHTML =
      "<div>Select a service first</div>";
    return;
  }

  const content = document.getElementById("content");
  content.innerHTML = `<div class="max-w-4xl mx-auto bg-white p-6 rounded-xl shadow">
    <h2 class="text-xl font-semibold mb-4">Book Service</h2>
    <div id="bookArea">Loading...</div>
  </div>`;

  try {
    // fetch service
    const sres = await api.get("/services/" + serviceId);
    const service = sres.data.service || sres.data;
    // fetch staff offering this service
    const staffRes = await api.get("/staff?serviceId=" + serviceId);
    const staff = staffRes.data.staff || staffRes.data;

    const staffSelect = staff
      .map(
        (st) =>
          `<option value="${st.id}">${st.user?.name || "Staff"} (${
            st.specialization || ""
          })</option>`
      )
      .join("");
    document.getElementById("bookArea").innerHTML = `
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <p class="text-gray-700"><strong>${service.name}</strong></p>
          <p class="text-sm text-gray-500">${service.description || ""}</p>
          <p class="mt-2">Duration: ${service.durationMinutes} mins</p>
        </div>
        <div>
          <label class="text-sm">Select Staff</label>
          <select id="selectStaff" class="w-full p-2 border rounded">${staffSelect}</select>
        </div>
      </div>

      <div class="mt-4">
        <label class="text-sm">Select Date</label>
        <input id="selectDate" type="date" class="w-full p-2 border rounded" />
      </div>

      <div class="mt-4">
        <button id="findSlots" class="px-4 py-2 bg-indigo-600 text-white rounded">Find Slots</button>
      </div>

      <div id="slotsArea" class="mt-4"></div>
    `;

    document.getElementById("findSlots").onclick = async () => {
      const staffId = document.getElementById("selectStaff").value;
      const date = document.getElementById("selectDate").value;
      if (!date || !staffId) {
        showToast("Choose staff and date");
        return;
      }
      try {
        const slotsRes = await api.get(
          `/appointments/slots?staffProfileId=${staffId}&serviceId=${serviceId}&date=${date}`
        );
        const slots = slotsRes.data.availableSlots || [];
        const slotsArea = document.getElementById("slotsArea");
        if (slots.length === 0) {
          slotsArea.innerHTML =
            '<div class="text-sm text-gray-500">No slots available</div>';
          return;
        }
        slotsArea.innerHTML =
          '<div class="grid grid-cols-2 md:grid-cols-4 gap-2">' +
          slots
            .map(
              (s) =>
                `<button class="slotBtn p-2 border rounded" data-time="${s}">${new Date(
                  s
                ).toLocaleTimeString()}</button>`
            )
            .join("") +
          "</div>";
        document.querySelectorAll(".slotBtn").forEach((btn) => {
          btn.onclick = async (e) => {
            const time = e.target.dataset.time;
            if (!state.user) {
              showToast("Please login to book");
              navigate("/login");
              return;
            }
            try {
              const res = await api.post("/appointments/book", {
                staffProfileId: staffId,
                serviceId,
                appointmentDate: time,
              });
              showToast("Booked successfully");
              navigate("/my-appointments");
            } catch (err) {
              console.error(err);
              showToast(err.response?.data?.message || "Booking failed");
            }
          };
        });
      } catch (err) {
        console.error(err);
        showToast("Failed to fetch slots");
      }
    };
  } catch (err) {
    console.error(err);
    showToast("Failed to prepare booking");
  }
});

/* My appointments (customer) */
route("/my-appointments", async () => {
  if (!state.user) {
    navigate("/login");
    return;
  }
  if (state.user.role !== "customer") {
    document.getElementById("content").innerHTML = "<div>Access denied</div>";
    return;
  }

  document.getElementById("content").innerHTML =
    '<div class="max-w-4xl mx-auto"><h2 class="text-xl mb-4">My Appointments</h2><div id="myAppts"></div></div>';
  try {
    const res = await api.get("/appointments/my-appointments");
    const appts = res.data.appointments || [];
    const el = document.getElementById("myAppts");
    el.innerHTML = appts
      .map(
        (a) => `
      <div class="bg-white p-4 rounded mb-3 shadow">
        <div class="flex justify-between items-center">
          <div>
            <div class="font-semibold">${a.service?.name || "Service"}</div>
            <div class="text-sm text-gray-600">${formatDateTime(
              a.appointmentDate
            )}</div>
            <div class="text-sm text-gray-500">Staff: ${
              a.staff?.user?.name || "—"
            }</div>
          </div>
          <div class="flex gap-2">
            <button class="px-3 py-1 bg-yellow-500 text-white rounded resched" data-id="${
              a.id
            }">Reschedule</button>
            <button class="px-3 py-1 bg-red-500 text-white rounded cancel" data-id="${
              a.id
            }">Cancel</button>
          </div>
        </div>
      </div>
    `
      )
      .join("");
    document.querySelectorAll(".cancel").forEach(
      (b) =>
        (b.onclick = async (e) => {
          const id = e.target.dataset.id;
          if (!confirm("Cancel appointment?")) return;
          try {
            await api.patch(`/appointments/cancel/${id}`);
            showToast("Cancelled");
            navigate("/my-appointments");
          } catch (err) {
            showToast("Cancel failed");
          }
        })
    );
    document.querySelectorAll(".resched").forEach(
      (b) =>
        (b.onclick = (e) => {
          const id = e.target.dataset.id;
          const newDate = prompt(
            "New date-time (ISO, e.g. 2025-11-01T10:00:00.000Z)"
          );
          if (!newDate) return;
          api
            .patch(`/appointments/reschedule/${id}`, {
              newAppointmentDate: newDate,
            })
            .then(() => {
              showToast("Rescheduled");
              navigate("/my-appointments");
            })
            .catch(() => showToast("Reschedule failed"));
        })
    );
  } catch (err) {
    console.error(err);
    showToast("Failed to fetch appointments");
  }
});

/* Profile */
route("/profile", async () => {
  if (!state.user) {
    navigate("/login");
    return;
  }
  document.getElementById("content").innerHTML = `
    <div class="max-w-3xl mx-auto bg-white p-6 rounded-xl shadow">
      <h2 class="text-xl font-semibold">Profile</h2>
      <form id="profileForm" class="mt-4 space-y-3">
        <input id="pName" class="w-full p-3 border rounded" />
        <input id="pPhone" class="w-full p-3 border rounded" />
        <button class="px-4 py-2 bg-indigo-600 text-white rounded">Save</button>
      </form>
    </div>
  `;
  const pName = document.getElementById("pName");
  const pPhone = document.getElementById("pPhone");
  try {
    const data = await api.get("/user/me");
    const user = data.data.user || data.data;
    pName.value = user.name || "";
    pPhone.value = user.phone || "";
    document.getElementById("profileForm").onsubmit = async (e) => {
      e.preventDefault();
      try {
        await api.patch("/user/me", {
          name: pName.value,
          phone: pPhone.value,
        });
        showToast("Profile saved");
        // refresh local user
        state.user.name = pName.value;
        localStorage.setItem("user", JSON.stringify(state.user));
        renderSidebar();
      } catch (err) {
        showToast("Save failed");
      }
    };
  } catch (err) {
    showToast("Failed to load profile");
  }
});

/* Staff: view assigned appointments */
route("/staff/appointments", async () => {
  if (!state.user) {
    navigate("/login");
    return;
  }
  if (state.user.role !== "staff") {
    document.getElementById("content").innerHTML = "Access denied";
    return;
  }

  document.getElementById("content").innerHTML =
    '<div class="max-w-4xl mx-auto"><h2 class="text-xl mb-4">Assigned Appointments</h2><div id="staffAppts"></div></div>';
  try {
    const res = await api.get("/staff"); // backend: GET /staff returns staff with appointments if configured
    const myProfile = res.data.staff.find((s) => s.user?.id === state.user.id);
    const appts = myProfile?.staffAppointments || [];
    const el = document.getElementById("staffAppts");
    el.innerHTML = appts
      .map(
        (a) => `
      <div class="bg-white p-4 rounded mb-3 shadow">
        <div class="flex justify-between">
          <div>
            <div class="font-semibold">${a.service?.name || ""}</div>
            <div class="text-sm text-gray-600">${formatDateTime(
              a.appointmentDate
            )}</div>
          </div>
          <div>
            <button class="px-3 py-1 bg-green-600 text-white rounded complete" data-id="${
              a.id
            }">Mark Complete</button>
          </div>
        </div>
      </div>
    `
      )
      .join("");
    document.querySelectorAll(".complete").forEach(
      (b) =>
        (b.onclick = async (e) => {
          try {
            const id = e.target.dataset.id;
            await api.post(`/appointments/${id}/complete`);
            showToast("Marked complete");
            navigate("/staff/appointments");
          } catch (err) {
            showToast("Action failed");
          }
        })
    );
  } catch (err) {
    console.error(err);
    showToast("Failed to fetch staff appointments");
  }
});

/* Staff: respond to reviews */
route("/staff/reviews", async () => {
  if (!state.user) {
    navigate("/login");
    return;
  }
  if (state.user.role !== "staff") {
    document.getElementById("content").innerHTML = "Access denied";
    return;
  }

  document.getElementById("content").innerHTML =
    '<div class="max-w-4xl mx-auto"><h2 class="text-xl mb-4">Reviews to respond</h2><div id="reviewsList"></div></div>';
  try {
    const res = await api.get("/reviews/service/"); // adjust if API requires serviceId
    const reviews = res.data.reviews || [];
    const el = document.getElementById("reviewsList");
    el.innerHTML = reviews
      .map(
        (r) => `
      <div class="bg-white p-4 rounded mb-3 shadow">
        <div><strong>${r.User?.name || "Customer"}</strong> — ${r.rating}★</div>
        <div class="text-sm">${r.comment}</div>
        <div class="mt-2">
          <input class="resp_${
            r.id
          } p-2 border rounded w-3/4" placeholder="Write response" />
          <button class="respBtn px-3 py-1 bg-indigo-600 text-white rounded" data-id="${
            r.id
          }">Reply</button>
        </div>
      </div>
    `
      )
      .join("");
    document.querySelectorAll(".respBtn").forEach((btn) => {
      btn.onclick = async (e) => {
        const id = e.target.dataset.id;
        const val = document.querySelector(`.resp_${id}`).value;
        if (!val) return showToast("Write a response");
        await api.put(`/reviews/${id}/respond`, { response: val });
        showToast("Responded");
        navigate("/staff/reviews");
      };
    });
  } catch (err) {
    console.error(err);
    showToast("Failed to load reviews");
  }
});

/* Admin Dashboard overview */
route("/admin/dashboard", async () => {
  if (!state.user || state.user.role !== "admin") {
    navigate("/login");
    return;
  }
  document.getElementById("content").innerHTML =
    '<div class="max-w-6xl mx-auto"><h2 class="text-xl mb-4">Admin Dashboard</h2><div id="adminStats" class="grid grid-cols-1 md:grid-cols-3 gap-4"></div></div>';
  try {
    const usersRes = await api.get("/admin/customers");
    const apptsRes = await api.get("/admin/appointments");
    const customers = usersRes.data.customers || [];
    const appts = apptsRes.data.appointments || [];
    const stats = document.getElementById("adminStats");
    stats.innerHTML = `
      <div class="bg-white p-4 rounded shadow">
        <div class="text-sm text-gray-500">Customers</div>
        <div class="text-2xl font-bold">${customers.length}</div>
      </div>
      <div class="bg-white p-4 rounded shadow">
        <div class="text-sm text-gray-500">Appointments</div>
        <div class="text-2xl font-bold">${appts.length}</div>
      </div>
      <div class="bg-white p-4 rounded shadow">
        <div class="text-sm text-gray-500">Revenue (est)</div>
        <div class="text-2xl font-bold">₹${appts.reduce(
          (s, a) => s + Number(a.service?.price || 0),
          0
        )}</div>
      </div>
    `;
  } catch (err) {
    console.error(err);
    showToast("Failed to load admin data");
  }
});

/* Admin: users & appointments pages */
route("/admin/users", async () => {
  if (!state.user || state.user.role !== "admin") {
    navigate("/login");
    return;
  }
  document.getElementById("content").innerHTML =
    '<div class="max-w-6xl mx-auto"><h2 class="text-xl mb-4">Manage Customers</h2><div id="usersTable"></div></div>';
  try {
    const res = await api.get("/admin/customers");
    const users = res.data.customers || [];
    const el = document.getElementById("usersTable");
    el.innerHTML = users
      .map(
        (u) => `
      <div class="bg-white p-4 rounded mb-2 shadow flex justify-between">
        <div><strong>${u.name}</strong><div class="text-sm text-gray-500">${u.email}</div></div>
        <div><button class="px-3 py-1 bg-red-500 text-white rounded delUser" data-id="${u.id}">Deactivate</button></div>
      </div>
    `
      )
      .join("");
    document.querySelectorAll(".delUser").forEach(
      (b) =>
        (b.onclick = async (e) => {
          const id = e.target.dataset.id;
          try {
            await api.put(`/admin/customers/${id}`, { active: false });
            showToast("User updated");
            navigate("/admin/users");
          } catch (err) {
            showToast("Action failed");
          }
        })
    );
  } catch (err) {
    showToast("Failed to load users");
  }
});

route("/admin/appointments", async () => {
  if (!state.user || state.user.role !== "admin") {
    navigate("/login");
    return;
  }
  document.getElementById("content").innerHTML =
    '<div class="max-w-6xl mx-auto"><h2 class="text-xl mb-4">Manage Appointments</h2><div id="adminAppts"></div></div>';
  try {
    const res = await api.get("/admin/appointments");
    const appts = res.data.appointments || [];
    const el = document.getElementById("adminAppts");
    el.innerHTML = appts
      .map(
        (a) => `
      <div class="bg-white p-4 rounded mb-2 shadow flex justify-between">
        <div><strong>${
          a.service?.name
        }</strong><div class="text-sm">${formatDateTime(
          a.appointmentDate
        )}</div></div>
        <div class="flex gap-2">
          <button class="px-3 py-1 bg-yellow-500 updateStatus" data-id="${
            a.id
          }" data-status="confirmed">Confirm</button>
          <button class="px-3 py-1 bg-red-500 deleteApt" data-id="${
            a.id
          }">Delete</button>
        </div>
      </div>
    `
      )
      .join("");
    document.querySelectorAll(".updateStatus").forEach(
      (b) =>
        (b.onclick = async (e) => {
          const id = e.target.dataset.id;
          const status = e.target.dataset.status;
          await api.put(`/admin/appointments/${id}`, { status });
          showToast("Updated");
          navigate("/admin/appointments");
        })
    );
    document.querySelectorAll(".deleteApt").forEach(
      (b) =>
        (b.onclick = async (e) => {
          const id = e.target.dataset.id;
          if (!confirm("Delete appointment?")) return;
          await api.delete(`/admin/appointments/${id}`);
          showToast("Deleted");
          navigate("/admin/appointments");
        })
    );
  } catch (err) {
    showToast("Failed to load appointments");
  }
});

/* Reviews & public listing */
route("/reviews", async () => {
  document.getElementById("content").innerHTML =
    '<div class="max-w-4xl mx-auto"><h2 class="text-xl mb-4">Reviews</h2><div id="reviewsPublic"></div></div>';
  try {
    // we fetch reviews for all services - endpoint may vary
    const res = await api.get("/reviews/service/");
    const reviews = res.data.reviews || [];
    document.getElementById("reviewsPublic").innerHTML = reviews
      .map(
        (r) => `
      <div class="bg-white p-4 rounded mb-3 shadow">
        <div class="flex justify-between"><div><strong>${
          r.User?.name || "Customer"
        }</strong></div><div>${r.rating}★</div></div>
        <div class="text-sm text-gray-700">${r.comment}</div>
        <div class="text-sm text-gray-500 mt-2">Response: ${
          r.staffResponse || "—"
        }</div>
      </div>
    `
      )
      .join("");
  } catch (err) {
    showToast("Failed to load reviews");
  }
});

/* Fallback 404 */
route("/404", () => {
  document.getElementById("content").innerHTML =
    '<div class="text-center p-10">Page not found</div>';
});

/* ============================
   Actions: Logout, init
   ============================ */

async function doLogout() {
  clearAuth();
  showToast("Logged out");
  navigate("/");
}

/* wire logout button */
document.getElementById("logoutBtn").onclick = doLogout;

/* Set year */
document.getElementById("year").innerText = new Date().getFullYear();

/* initial render */
renderSidebar();
const initial = window.location.pathname.startsWith("/frontend")
  ? "/frontend/"
  : window.location.pathname;

renderRoute(initial);

/* On load: if token exists, try to populate user (best effort) */
(async function initAuth() {
  const token = localStorage.getItem("token");
  if (!token) return;
  try {
    const res = await api.get("/user/me");
    const user = res.data.user || res.data;
    state.user = user;
    localStorage.setItem("user", JSON.stringify(user));
    document.getElementById("logoutBtn").classList.remove("hidden");
    renderSidebar();
  } catch (err) {
    console.warn("Auth init failed", err);
    clearAuth();
  }
})();
