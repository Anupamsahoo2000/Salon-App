document.addEventListener("DOMContentLoaded", initProfile);

async function initProfile() {
  const token = localStorage.getItem("token");

  if (!token) {
    alert("Session expired! Please login again.");
    window.location.href = "login.html";
    return;
  }

  const container = document.getElementById("appointmentsList");

  async function loadAppointments() {
    try {
      const res = await api.get("/appointments/my-appointments");
      const appointments = res.data.appointments || [];

      if (!appointments.length) {
        container.innerHTML = `<p class="text-gray-500 text-center">No Appointments Yet</p>`;
        return;
      }

      container.innerHTML = appointments
        .map((a) => appointmentCardHtml(a))
        .join("");
      attachActions();
    } catch (err) {
      console.error(err);
      container.innerHTML = `<p class="text-red-600 text-center">Failed to load appointments</p>`;
    }
  }

  function appointmentCardHtml(a) {
    const isCancelled = a.status === "cancelled";
    const isCompleted = a.status === "completed";

    return `
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow p-4 mb-4">

        <div class="flex justify-between items-center text-gray-300">
          <h3 class="text-lg font-semibold">${a.service?.name}</h3>
          <span class="px-3 py-1 rounded text-xs ${
            isCancelled
              ? "bg-red-200 text-red-700"
              : isCompleted
              ? "bg-green-200 text-green-700"
              : "bg-blue-200 text-blue-700"
          }">
            ${a.status.toUpperCase()}
          </span>
        </div>

        <p class="text-sm mt-2 text-gray-600 dark:text-gray-300">
          <strong>Date:</strong> ${new Date(a.appointmentDate).toLocaleString()}
        </p>

        <p class="text-sm text-gray-600 dark:text-gray-300">
          <strong>Staff:</strong> ${a.staff?.user?.name}
        </p>

        <div class="mt-4 flex gap-2">
          ${
            !isCancelled && !isCompleted
              ? `
              <button class="cancel-btn bg-red-600 text-white text-sm px-3 py-1 rounded" data-id="${a.id}">
                Cancel
              </button>
              <button class="reschedule-btn bg-blue-600 text-white text-sm px-3 py-1 rounded" data-id="${a.id}">
                Reschedule
              </button>
            `
              : `<span class="text-gray-400 text-xs italic">No actions available</span>`
          }
        </div>
      </div>
    `;
  }

  function attachActions() {
    document.querySelectorAll(".cancel-btn").forEach((btn) => {
      btn.onclick = async () => {
        const id = btn.dataset.id;
        try {
          await api.patch(`/appointments/cancel/${id}`);
          alert("Appointment cancelled ✅");
          loadAppointments(); // ✅ Refresh UI
        } catch (err) {
          console.error(err);
          alert("Failed to cancel appointment");
        }
      };
    });

    document.querySelectorAll(".reschedule-btn").forEach((btn) => {
      btn.onclick = async () => {
        const id = btn.dataset.id;
        const newDate = prompt("Enter new date/time: yyyy-mm-dd HH:MM");
        if (!newDate) return;

        try {
          await api.patch(`/appointments/reschedule/${id}`, {
            newAppointmentDate: newDate,
          });

          alert("Appointment rescheduled ✅");
          loadAppointments(); // ✅ Refresh UI
        } catch (err) {
          console.error(err);
          alert("Failed to reschedule appointment");
        }
      };
    });
  }

  // Initial Load
  loadAppointments();
}
