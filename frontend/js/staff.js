// staff.js ✅ Updated
document.addEventListener("DOMContentLoaded", initStaff);

async function initStaff() {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  if (!token || role !== "staff") {
    alert("Access denied");
    window.location.href = "index.html";
    return;
  }

  const user = JSON.parse(localStorage.getItem("user"));
  const me = user.staffProfile;

  console.log("Staff Profile Loaded:", me);

  if (!me) {
    document.getElementById("staffArea").innerHTML =
      "<div class='text-red-600'>No staff profile found ❌</div>";
    return;
  }

  const workingHours = me.workingHours || {};

  const appts = me.staffAppointments || [];

  let html = `
    <div class="bg-white p-4 rounded-lg shadow mb-4">
      <div class="text-lg font-semibold">${user.name}</div>
      <div class="text-sm text-gray-500">${me.specialization || ""}</div>

      <div class="mt-3">
        <h4 class="font-semibold">Working Hours</h4>
        ${Object.entries(workingHours)
          .map(
            ([day, time]) =>
              `<div class="text-sm">${
                day.charAt(0).toUpperCase() + day.slice(1)
              }: ${time}</div>`
          )
          .join("")}
      </div>
    </div>

    <div class="bg-white p-4 rounded-lg shadow mt-4">
      <h3 class="font-semibold mb-2">Assigned Appointments</h3>
      ${
        appts.length === 0
          ? `<div class="text-gray-500 text-sm">No appointments yet</div>`
          : appts
              .map(
                (a) => `
        <div class="py-2 border-b">
          <strong>${a.service?.name}</strong><br>
          ${new Date(a.appointmentDate).toLocaleString()}<br>
          Customer: ${a.customer?.name || "N/A"}
        </div>`
              )
              .join("")
      }
    </div>
  `;

  document.getElementById("staffArea").innerHTML = html;
}
