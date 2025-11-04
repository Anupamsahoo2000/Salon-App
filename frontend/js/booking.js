// booking.js
document.addEventListener("DOMContentLoaded", initBooking);

async function initBooking() {
  const params = new URLSearchParams(window.location.search);
  const serviceId = params.get("serviceId");
  if (!serviceId) {
    document.getElementById("serviceBlock").innerHTML =
      "<div class='text-red-600'>No service selected</div>";
    return;
  }

  const serviceBlock = document.getElementById("serviceBlock");
  const staffSelect = document.getElementById("staffSelect");
  const dateInput = document.getElementById("dateInput");
  const slotsWrap = document.getElementById("slotsWrap");
  const confirmBtn = document.getElementById("confirmBtn");
  const confirmPaylaterBtn = document.getElementById("confirmPaylaterBtn");
  let selectedSlot = null;
  let selectedStaff = null;

  // load service details
  try {
    const res = await api.get(`/services/${serviceId}`);
    const s = res.data.service || res.data;
    serviceBlock.innerHTML = `<div class="flex items-center gap-4">
      <div class="w-24 h-24 rounded-lg bg-cover" style="background-image:url('${
        s.image || ""
      }')"></div>
      <div>
        <div class="text-lg font-semibold text-pink-600">${s.name}</div>
        <div class="text-sm text-gray-600">${s.durationMinutes} min • ₹${
      s.price
    }</div>
      </div>
    </div>`;
  } catch (err) {
    serviceBlock.innerHTML = `<div class="text-red-600">Failed to load service</div>`;
    console.error(err);
    return;
  }

  // load staff who can perform this service
  try {
    const res = await api.get(`/staff?serviceId=${serviceId}`);
    const staff = res.data.staff || res.data || [];
    if (!staff.length) {
      staffSelect.innerHTML = `<option value="">No staff available</option>`;
    } else {
      staffSelect.innerHTML = staff
        .map(
          (s) =>
            `<option value="${s.id}">${s.user?.name || "Staff"} — ${
              s.specialization || ""
            }</option>`
        )
        .join("");
    }
  } catch (err) {
    console.error(err);
    staffSelect.innerHTML = `<option value="">Error loading staff</option>`;
  }

  async function loadSlots() {
    slotsWrap.innerHTML = "Loading...";
    selectedSlot = null;
    const staffId = staffSelect.value;
    const date = dateInput.value;
    if (!staffId || !date) {
      slotsWrap.innerHTML =
        "<div class='text-gray-500'>Choose staff and date</div>";
      return;
    }
    try {
      const res = await api.get(
        `/appointments/slots?staffProfileId=${staffId}&serviceId=${serviceId}&date=${date}`
      );
      const slots = res.data.availableSlots || res.data.slots || [];
      if (!slots.length) {
        slotsWrap.innerHTML =
          "<div class='text-gray-500'>No slots available</div>";
        return;
      }
      slotsWrap.innerHTML = slots
        .map(
          (s) =>
            `<button class="slot-btn px-3 py-2 rounded bg-white border" data-time="${s}">${new Date(
              s
            ).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}</button>`
        )
        .join("");
      document.querySelectorAll(".slot-btn").forEach((btn) => {
        btn.onclick = (e) => {
          document
            .querySelectorAll(".slot-btn")
            .forEach((b) => b.classList.remove("ring", "ring-pink-300"));
          e.target.classList.add("ring", "ring-pink-300");
          selectedSlot = e.target.dataset.time;
        };
      });
    } catch (err) {
      console.error(err);
      slotsWrap.innerHTML =
        "<div class='text-red-600'>Failed to load slots</div>";
    }
  }

  staffSelect.onchange = loadSlots;
  dateInput.onchange = loadSlots;

  confirmBtn.onclick = async () => {
    if (!selectedSlot) return alert("Choose a time slot");
    const token = localStorage.getItem("token");
    if (!token) {
      if (!confirm("You must be logged in to book. Proceed to login?")) return;
      window.location.href = "login.html";
      return;
    }
    try {
      // create appointment (with pending payment)
      const payload = {
        staffProfileId: staffSelect.value,
        serviceId,
        appointmentDate: selectedSlot,
        paymentStatus: "pending",
      };
      const res = await api.post("/appointments/book", payload);
      // server should return appointment & payment info
      const appointment = res.data.appointment || res.data;
      // redirect to payment page with appointmentId
      window.location.href = `payment.html?appointmentId=${appointment.id}`;
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Booking failed");
    }
  };

  confirmPaylaterBtn.onclick = async () => {
    if (!selectedSlot) return alert("Choose a time slot");
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "login.html";
      return;
    }
    try {
      const payload = {
        staffProfileId: staffSelect.value,
        serviceId,
        appointmentDate: selectedSlot,
        paymentStatus: "unpaid",
      };
      await api.post("/appointments/book", payload);
      alert("Booking confirmed. You can pay at the salon.");
      window.location.href = "profile.html";
    } catch (err) {
      console.error(err);
      alert("Booking failed");
    }
  };
}
