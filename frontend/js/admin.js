// admin.js
const BASE_URL = "http://localhost:3000";
axios.defaults.baseURL = BASE_URL; // Root path (no extra /api)
const token = localStorage.getItem("token");

if (!token) {
  alert("Unauthorized! Login again");
  window.location = "/";
}

axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

// ✅ Check Admin Role from Backend
async function checkAdminRole() {
  try {
    const res = await axios.get("/user/me");

    console.log("Profile:", res.data);
    if (res.data.user.role !== "admin") {
      alert("Access Denied — Admin Only!");
      window.location = "/";
      return;
    }
  } catch (err) {
    alert("Login expired");
    window.location = "/";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  checkAdminRole();
  loadCustomers();
  loadAppointments();
  setupTabSwitching();
  document.getElementById("logoutBtn").addEventListener("click", logout);
});

/* ------------------ USERS ------------------ */

async function loadCustomers() {
  try {
    const res = await axios.get("/admin/customers");
    const customers = res.data.customers || [];
    const tbody = document.getElementById("users-table");
    tbody.innerHTML = "";

    customers.forEach((user) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td class="p-2">${user.name}</td>
        <td class="p-2">${user.email}</td>
        <td class="p-2">${user.role}</td>
        <td class="p-2 text-center">
            <button class="disable-btn text-red-500 underline"
              data-id="${user.id}">
              Disable
            </button>
        </td>`;
      tbody.appendChild(row);
    });

    document
      .querySelectorAll(".disable-btn")
      .forEach((btn) => btn.addEventListener("click", disableCustomer));
  } catch (error) {
    console.error(error);
    alert("Unable to fetch users");
  }
}

async function disableCustomer(e) {
  const id = e.target.dataset.id;
  if (!confirm("Disable this user?")) return;

  try {
    await axios.put(`/admin/customers/${id}`, { status: "disabled" });
    loadCustomers();
  } catch {
    alert("Error updating user");
  }
}

/* ------------------ APPOINTMENTS ------------------ */
async function loadAppointments() {
  try {
    const res = await axios.get("/admin/appointments");
    const appts = res.data.appointments || [];
    const tbody = document.getElementById("appointments-table");
    tbody.innerHTML = "";

    appts.forEach((a) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td class="p-2">${a.customer?.name || "N/A"}</td>
        <td class="p-2">${a.service?.name}</td>
        <td class="p-2">${a.staff?.user?.name}</td>
        <td class="p-2">${new Date(a.appointmentDate).toLocaleString()}</td>
        <td class="p-2">${a.status}</td>
        <td class="p-2 flex gap-2 justify-center">
          <button class="status-btn bg-green-500 text-white px-2 py-1 rounded"
            data-id="${a.id}" data-status="approved">Approve</button>

          <button class="status-btn bg-blue-500 text-white px-2 py-1 rounded"
            data-id="${a.id}" data-status="completed">Complete</button>

          <button class="status-btn bg-yellow-500 text-white px-2 py-1 rounded"
            data-id="${a.id}" data-status="cancelled">Cancel</button>

          <button class="del-btn bg-red-600 text-white px-2 py-1 rounded"
            data-id="${a.id}">Delete</button>
        </td>`;

      tbody.appendChild(row);
    });

    document
      .querySelectorAll(".status-btn")
      .forEach((btn) => btn.addEventListener("click", updateAppointmentStatus));

    document
      .querySelectorAll(".del-btn")
      .forEach((btn) => btn.addEventListener("click", deleteAppointment));
  } catch (error) {
    alert("Failed to fetch appointments");
  }
}

async function updateAppointmentStatus(e) {
  const id = e.target.dataset.id;
  const status = e.target.dataset.status;

  try {
    await axios.put(`/admin/appointments/${id}`, { status });
    loadAppointments();
  } catch {
    alert("Unable to update status");
  }
}

async function deleteAppointment(e) {
  const id = e.target.dataset.id;
  if (!confirm("Delete this appointment?")) return;

  try {
    await axios.delete(`/admin/appointments/${id}`);
    loadAppointments();
  } catch {
    alert("Failed to delete appointment");
  }
}

/* ------------------ GENERAL ------------------ */
function setActiveAdminTab(activeBtnId) {
  document.querySelectorAll(".admin-tab").forEach((btn) => {
    btn.classList.remove(
      "bg-indigo-600",
      "text-white", // active styles
      "bg-gray-200",
      "text-gray-700" // inactive styles
    );
    btn.classList.add("bg-gray-200", "text-gray-700");
  });
  const activeBtn = document.getElementById(activeBtnId);
  activeBtn.classList.remove("bg-gray-200", "text-gray-700");
  activeBtn.classList.add("bg-indigo-600", "text-white");
}

function setupTabSwitching() {
  const usersTab = document.getElementById("tab-users");
  const apptTab = document.getElementById("tab-appointments");

  usersTab.addEventListener("click", () => {
    setActiveAdminTab("tab-users");
    switchTab("users");
  });
  apptTab.addEventListener("click", () => {
    setActiveAdminTab("tab-appointments");
    switchTab("appointments");
  });
}

function switchTab(tab) {
  document
    .getElementById("admin-users")
    .classList.toggle("hidden", tab !== "users");
  document
    .getElementById("admin-appointments")
    .classList.toggle("hidden", tab !== "appointments");
}

function logout() {
  localStorage.removeItem("token");
  window.location = "/";
}
