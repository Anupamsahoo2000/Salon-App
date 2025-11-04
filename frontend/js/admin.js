// js/admin.js
// requires ./api.js which exposes `api` axios instance that auto-appends token

document.addEventListener("DOMContentLoaded", initAdmin);

// ✅ DARK MODE LOGIC
const themeBtn = document.getElementById("themeBtn");
const body = document.body;

// Load saved theme
if (localStorage.getItem("theme") === "dark") {
  body.classList.add("dark");
}

themeBtn.addEventListener("click", () => {
  body.classList.toggle("dark");
  localStorage.setItem(
    "theme",
    body.classList.contains("dark") ? "dark" : "light"
  );
});

// ✅ AUTH UI LOGIC
const profileLink = document.getElementById("profileLink");
const adminLink = document.getElementById("adminLink");
const staffLink = document.getElementById("staffLink");
const logoutBtn = document.getElementById("logoutBtn");

const token = localStorage.getItem("token");
const role = localStorage.getItem("role");

if (token) {
  profileLink.classList.remove("hidden");
  logoutBtn.classList.remove("hidden");

  if (role === "admin") {
    adminLink.classList.remove("hidden");
  }

  if (role === "staff") {
    staffLink.classList.remove("hidden");
  }
}

logoutBtn.addEventListener("click", () => {
  localStorage.clear();
  location.href = "login.html";
});

// --- Service Modal Elements ---
const serviceModal = qs("#serviceModal");
const serviceTitle = qs("#serviceModalTitle");
const svcName = qs("#serviceName");
const svcPrice = qs("#servicePrice");
const svcDesc = qs("#serviceDesc");
const saveSvcBtn = qs("#saveServiceBtn");
const svcDuration = qs("#serviceDuration");

let editServiceId = null;

// ✅ Open modal for Add or Edit Service
function openServiceModal(service = null) {
  if (service) {
    serviceTitle.textContent = "Edit Service";
    svcName.value = service.name;
    svcPrice.value = service.price;
    svcDesc.value = service.description || "";
    svcDuration.value = service.durationMinutes; // ✅ REQUIRED FIELD
    editServiceId = service.id;
  } else {
    serviceTitle.textContent = "Add Service";
    svcName.value = "";
    svcPrice.value = "";
    svcDesc.value = "";
    svcDuration.value = ""; // ✅ reset this too
    editServiceId = null;
  }
  showModal("#serviceModal");
}

// ✅ Close modal
qs("#closeServiceModal").onclick = () => hideModal("#serviceModal");

function qs(sel) {
  return document.querySelector(sel);
}
function qsa(sel) {
  return Array.from(document.querySelectorAll(sel));
}

function showModal(id) {
  const m = qs(id);
  m.classList.remove("hidden");
  m.classList.add("flex");
}
function hideModal(id) {
  const m = qs(id);
  m.classList.add("hidden");
  m.classList.remove("flex");
}

async function initAdmin() {
  // state
  let currentTab = "appointments";
  let page = 1;
  const pageSize = 8;
  let lastResults = [];

  const adminContent = qs("#adminContent");
  const pagination = qs("#pagination");
  const searchInput = qs("#adminSearch");
  const filterSelect = qs("#entityFilter");
  const refreshBtn = qs("#refreshBtn");

  // modal elements
  const staffModal = qs("#staffModal");
  const assignModal = qs("#assignModal");
  const staffForm = qs("#staffForm");

  // tab buttons
  qsa(".tabBtn").forEach((b) => {
    b.addEventListener("click", () => {
      currentTab = b.dataset.tab;
      page = 1;
      updateView();
    });
  });

  // search/filter handlers (debounced)
  let searchTimer;
  searchInput.addEventListener("input", () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      page = 1;
      updateView();
    }, 350);
  });
  filterSelect.addEventListener("change", () => {
    page = 1;
    updateView();
  });
  refreshBtn.onclick = () => updateView();

  // staff modal handlers
  qs("#closeStaffModal").onclick = () => hideModal("#staffModal");
  staffForm.onsubmit = async (e) => {
    e.preventDefault();
    try {
      const body = {
        name: qs("#staffName").value.trim(),
        email: qs("#staffEmail").value.trim(),
        phone: qs("#staffPhone").value.trim(),
        password: qs("#staffPassword").value,
        role: "staff",
      };

      const signupRes = await api.post("/auth/signup", body);

      const newUser = signupRes.data.user;
      if (!newUser || !newUser.id) {
        throw new Error("Signup succeeded but user id missing");
      }

      const staffProfileRes = await api.post("/staff/create-profile", {
        userId: newUser.id,
        specialization: qs("#staffSpecialization").value.trim() || "General",
      });

      alert("✅ Staff created successfully!");
      hideModal("#staffModal");
      staffForm.reset();
      updateView();
    } catch (err) {
      console.error("Create staff error:", err);
      alert(err.response?.data?.message || "Failed to create staff");
    }
  };

  // assign modal handlers
  qs("#closeAssignModal").onclick = () => hideModal("#assignModal");
  qs("#saveAssignBtn").onclick = async () => {
    const staffId = qs("#saveAssignBtn").dataset.staffId;
    const checked = Array.from(qsa('input[name="assignSvc"]:checked')).map(
      (i) => i.value
    );
    try {
      await api.post("/staff/assign-services", {
        staffProfileId: staffId,
        serviceIds: checked,
      });
      alert("Services assigned");
      hideModal("#assignModal");
      updateView();
    } catch (err) {
      console.error("Assign err:", err);
      alert("Failed to assign services");
    }
  };

  saveSvcBtn.onclick = async () => {
    const payload = {
      name: svcName.value.trim(),
      price: Number(svcPrice.value),
      description: svcDesc.value.trim(),
      durationMinutes: Number(svcDuration.value),
    };

    if (!payload.name) return alert("Name is required!");
    if (isNaN(payload.price) || payload.price <= 0)
      return alert("Valid price required!");
    if (
      !Number.isInteger(payload.durationMinutes) ||
      payload.durationMinutes <= 0
    )
      return alert("Valid duration required!");

    try {
      if (editServiceId) {
        await api.patch(`/services/${editServiceId}`, payload);
        alert("Service updated ✅");
      } else {
        await api.post(`/services`, payload);
        alert("Service added ✅");
      }

      hideModal("#serviceModal");
      updateView();
      updateCounts();
    } catch (err) {
      console.error("Save service error:", err);
      alert(err.response?.data?.message || "Service save failed ❌");
    }
  };

  // initial load
  await updateCounts();
  await updateView();

  // ----- core view routing -----
  async function updateView() {
    const forced = filterSelect.value;
    if (forced !== "all") currentTab = forced;

    const q = (searchInput.value || "").trim().toLowerCase();

    if (currentTab === "appointments") return loadAppointments(q);
    if (currentTab === "customers") return loadCustomers(q);
    if (currentTab === "services") return loadServices(q);
    if (currentTab === "staff") return loadStaff(q);
    if (currentTab === "payments") return loadPayments(q);
  }

  // ----- helpers -----
  function renderPagination(total) {
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    pagination.innerHTML = "";

    function pageBtn(p, label = p) {
      const active = p === page;
      const btn = document.createElement("button");
      btn.className = `px-3 py-1 rounded ${
        active ? "bg-indigo-600 text-white" : "bg-white border"
      }`;
      btn.innerText = label;
      btn.onclick = () => {
        page = p;
        updateView();
      };
      return btn;
    }

    if (page > 1) pagination.appendChild(pageBtn(page - 1, "Prev"));
    for (let p = 1; p <= totalPages; p++) {
      pagination.appendChild(pageBtn(p));
      if (p >= 7) break; // avoid huge lists — simple behavior
    }
    if (page < totalPages) pagination.appendChild(pageBtn(page + 1, "Next"));
  }

  async function updateCounts() {
    try {
      const [cu, ap, sv] = await Promise.all([
        api.get("/admin/customers").catch(() => ({ data: { customers: [] } })),
        api
          .get("/admin/appointments")
          .catch(() => ({ data: { appointments: [] } })),
        api.get("/services").catch(() => ({ data: { services: [] } })),
      ]);
      qs("#custCount").innerText = (cu.data.customers || cu.data || []).length;
      qs("#apptCount").innerText = (
        ap.data.appointments ||
        ap.data ||
        []
      ).length;
      qs("#svcCount").innerText = (sv.data.services || sv.data || []).length;
    } catch (err) {
      console.warn("Counts update failed", err);
    }
  }

  // ----- load: appointments -----
  async function loadAppointments(q) {
    adminContent.innerHTML = "Loading appointments...";
    try {
      const res = await api.get("/admin/appointments");
      const items = res.data.appointments || [];
      lastResults = items.filter(filterByQuery(q));
      const paged = paginate(lastResults);
      adminContent.innerHTML = `
        <h2 class="text-lg font-semibold">Appointments (${
          lastResults.length
        })</h2>
        <div class="space-y-3 mt-3">
          ${paged.map((a) => appointmentRowHtml(a)).join("")}
        </div>
      `;
      attachAppointmentActions();
      renderPagination(lastResults.length);
    } catch (err) {
      console.error(err);
      adminContent.innerHTML = `<div class="text-red-600">Failed to load appointments</div>`;
    }
  }

  function appointmentRowHtml(a) {
    const date = new Date(a.appointmentDate).toLocaleString();
    const staffName = a.staff?.user?.name || "-";
    const cust = a.customer?.name || a.customer?.email || "-";
    const svc = a.service?.name || "-";
    return `
      <div class="bg-white p-3 rounded shadow flex justify-between items-center">
        <div>
          <div class="font-semibold">${svc} — <span class="text-sm text-gray-500">${cust}</span></div>
          <div class="text-xs text-gray-500">${date} • Staff: ${staffName}</div>
        </div>
        <div class="flex gap-2 items-center">
          <select data-id="${
            a.id
          }" class="statusSelect px-2 py-1 border rounded">
            <option value="pending" ${
              a.status === "pending" ? "selected" : ""
            }>PENDING</option>
            <option value="booked" ${
              a.status === "booked" ? "selected" : ""
            }>BOOKED</option>
            <option value="completed" ${
              a.status === "completed" ? "selected" : ""
            }>COMPLETED</option>
            <option value="cancelled" ${
              a.status === "cancelled" ? "selected" : ""
            }>CANCELLED</option>
          </select>
          <button class="deleteAppt px-2 py-1 text-red-600" data-id="${
            a.id
          }">Delete</button>
        </div>
      </div>
    `;
  }

  function attachAppointmentActions() {
    qsa(".statusSelect").forEach((s) => {
      s.onchange = async (e) => {
        const id = e.target.dataset.id;
        const status = e.target.value;
        try {
          await api.put(`/admin/appointments/${id}`, { status });
          alert("Updated");
          updateView();
          updateCounts();
        } catch (err) {
          console.error(err);
          alert("Failed to update");
        }
      };
    });
    qsa(".deleteAppt").forEach((b) => {
      b.onclick = async (e) => {
        const id = e.target.dataset.id;
        if (!confirm("Delete appointment?")) return;
        try {
          await api.delete(`/admin/appointments/${id}`);

          updateView();
          updateCounts();
        } catch (err) {
          console.error(err);
          alert("Delete failed");
        }
      };
    });
  }

  // ----- load: customers -----
  async function loadCustomers(q) {
    adminContent.innerHTML = "Loading customers...";
    try {
      const res = await api.get("/admin/customers");
      const items = res.data.customers || [];
      lastResults = items.filter(filterByQuery(q));
      const paged = paginate(lastResults);
      adminContent.innerHTML = `
        <h2 class="text-lg font-semibold">Customers (${lastResults.length})</h2>
        <div class="space-y-3 mt-3">
          ${paged
            .map(
              (c) => `
            <div class="bg-white p-3 rounded shadow flex justify-between items-center">
              <div>
                <div class="font-semibold">${c.name}</div>
                <div class="text-xs text-gray-500">${c.email} • ${
                c.phone || "-"
              }</div>
              </div>
              <div>
                <button class="editCustomer px-2 py-1 text-blue-600" data-id="${
                  c.id
                }">Edit</button>
              </div>
            </div>
          `
            )
            .join("")}
        </div>
      `;
      qsa(".editCustomer").forEach((b) => (b.onclick = editCustomer));
      renderPagination(lastResults.length);
    } catch (err) {
      console.error(err);
      adminContent.innerHTML = `<div class="text-red-600">Failed to load customers</div>`;
    }
  }

  async function editCustomer(e) {
    const id = e.target.dataset.id;
    const name = prompt("New name:");
    if (!name) return;
    try {
      await api.put(`/admin/customers/${id}`, { name });
      alert("Updated");
      updateView();
    } catch (err) {
      console.error(err);
      alert("Failed to update");
    }
  }

  // ----- load: services -----
  async function loadServices(q) {
    adminContent.innerHTML = "Loading services...";
    try {
      const res = await api.get("/services");
      const items = res.data.services || [];
      lastResults = items.filter(filterByQuery(q));
      const paged = paginate(lastResults);

      adminContent.innerHTML = `
      <div class="flex justify-between items-center">
        <h2 class="text-lg font-semibold">Services (${lastResults.length})</h2>
        <button id="addSvcBtn" 
          class="px-3 py-2 bg-pink-600 text-white rounded">Add Service</button>
      </div>

      <div class="mt-3 space-y-3">
        ${paged
          .map(
            (s) => `
          <div class="bg-white p-3 rounded shadow flex justify-between items-center">
            <div>
              <div class="font-semibold">${s.name}</div>
              <div class="text-xs text-gray-500">₹${s.price}</div>
            </div>
            <div class="flex gap-2">
              <button class="editSvc text-blue-600" data-id="${s.id}">Edit</button>
              <button class="delSvc text-red-600" data-id="${s.id}">Delete</button>
            </div>
          </div>
        `
          )
          .join("")}
      </div>
    `;

      // ✅ listeners
      qs("#addSvcBtn").onclick = () => openServiceModal();

      qsa(".editSvc").forEach((btn) => {
        btn.onclick = () => {
          const service = items.find((s) => s.id == btn.dataset.id);
          openServiceModal(service);
        };
      });

      qsa(".delSvc").forEach((btn) => {
        btn.onclick = async () => {
          if (!confirm("Delete this service?")) return;
          await api.delete(`/services/${btn.dataset.id}`);
          alert("Deleted ✅");
          updateView();
          updateCounts();
        };
      });

      renderPagination(lastResults.length);
    } catch (err) {
      console.error(err);
      adminContent.innerHTML = `<div class="text-red-600">Failed to load services</div>`;
    }
  }

  async function createOrEditService(id) {
    const name = prompt("Service name:");
    if (!name) return;

    const description = prompt("Description (optional):") || "";

    const priceStr = prompt("Price:");
    const durationStr = prompt("Duration (minutes):");

    const price = parseFloat(priceStr);
    const durationMinutes = parseInt(durationStr);

    if (!price || !durationMinutes) {
      alert("Price & Duration must be numbers!");
      return;
    }

    const payload = { name, description, durationMinutes, price };

    try {
      if (id) {
        await api.patch(`/services/${id}`, payload);
        alert("Service updated ✅");
      } else {
        await api.post(`/services`, payload);
        alert("Service created ✅");
      }
      updateView();
      updateCounts();
    } catch (err) {
      console.error("Save failed:", err);
      alert(err.response?.data?.message || "Service save failed ❌");
    }
  }

  // ----- load: staff -----
  async function loadStaff(q) {
    adminContent.innerHTML = "Loading staff...";
    try {
      const res = await api.get("/staff");
      console.log("DEBUG staff response:", res.data);

      // ✅ Fix data reading from API
      const items = Array.isArray(res.data.staff) ? res.data.staff : [];
      console.log("DEBUG parsed items:", items);

      lastResults = items.filter(filterByQuery(q));
      const paged = paginate(lastResults);

      adminContent.innerHTML = `
      <div class="flex justify-between items-center">
        <h2 class="text-lg font-semibold">Staff (${lastResults.length})</h2>
        <div>
          <button id="openAddStaff" class="px-3 py-2 bg-green-600 text-white rounded">Add Staff</button>
        </div>
      </div>

      <div class="mt-3 space-y-3">
        ${paged
          .map(
            (st) => `
          <div class="bg-white p-3 rounded shadow flex justify-between items-center">
            <div>
              <div class="font-semibold">${st.user?.name || "-"}</div>
              <div class="text-xs text-gray-500">${st.user?.email || "-"} • ${
              st.specialization || "-"
            }</div>
              <div class="text-xs text-gray-400">Services: ${
                (st.services || []).map((s) => s.name).join(", ") || "None"
              }</div>
            </div>

            <div class="flex gap-2">
              <button class="assignBtn px-2 py-1 bg-indigo-600 text-white rounded" 
                data-id="${st.id}">
                Assign
              </button>
            </div>
          </div>
        `
          )
          .join("")}
      </div>
    `;

      qs("#openAddStaff").onclick = () => showModal("#staffModal");

      qsa(".assignBtn").forEach((b) => {
        b.onclick = async (ev) => {
          const staffId = ev.target.dataset.id;
          await openAssignModal(staffId);
        };
      });

      renderPagination(lastResults.length);
    } catch (err) {
      console.error(err);
      adminContent.innerHTML = `<div class="text-red-600">Failed to load staff</div>`;
    }
  }

  async function openAssignModal(staffId) {
    try {
      const [svcRes, staffRes] = await Promise.all([
        api.get("/services"),
        api.get(`/staff`), // returns staff list
      ]);
      const services = svcRes.data.services || svcRes.data || [];
      const staffList = staffRes.data.staff || staffRes.data || [];
      const staff = staffList.find((s) => s.id === staffId) || {};
      const assigned = (staff.services || []).map((s) => s.id);

      const body = qs("#assignModalBody");
      body.innerHTML = `
        <p class="text-sm mb-2">Assign services to <strong>${
          staff.user?.name || "-"
        }</strong></p>
        <div class="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
          ${services
            .map(
              (s) => `
            <label class="flex items-center gap-2 p-2 border rounded">
              <input name="assignSvc" type="checkbox" value="${s.id}" ${
                assigned.includes(s.id) ? "checked" : ""
              } />
              <span class="text-sm">${s.name} — ₹${s.price}</span>
            </label>
          `
            )
            .join("")}
        </div>
      `;
      qs("#saveAssignBtn").dataset.staffId = staffId;
      showModal("#assignModal");
    } catch (err) {
      console.error(err);
      alert("Failed to load services or staff");
    }
  }

  // ----- load: payments -----
  async function loadPayments(q) {
    adminContent.innerHTML = "Loading payments...";
    try {
      const res = await api.get("/admin/payments");
      const items = res.data.payments || res.data || [];
      lastResults = items.filter(filterByQuery(q));
      const paged = paginate(lastResults);
      adminContent.innerHTML = `
        <h2 class="text-lg font-semibold">Payments (${lastResults.length})</h2>
        <div class="mt-3 space-y-3">
          ${paged
            .map(
              (p) => `
            <div class="bg-white p-3 rounded shadow flex justify-between items-center">
              <div>
                <div class="font-semibold">${p.orderId || p.order_id}</div>
                <div class="text-xs text-gray-500">₹${
                  p.amount || p.order_amount
                } • ${p.status || p.order_status || "-"}</div>
              </div>
              <div class="text-xs text-gray-400">${new Date(
                p.createdAt || p.order_created_at || Date.now()
              ).toLocaleString()}</div>
            </div>
          `
            )
            .join("")}
        </div>
      `;
      renderPagination(lastResults.length);
    } catch (err) {
      console.error(err);
      adminContent.innerHTML = `<div class="text-red-600">Failed to load payments</div>`;
    }
  }

  // ----- utilities -----
  function filterByQuery(q) {
    if (!q) return () => true;
    return (obj) => JSON.stringify(obj).toLowerCase().includes(q);
  }
  function paginate(list) {
    const start = (page - 1) * pageSize;
    return list.slice(start, start + pageSize);
  }
}
