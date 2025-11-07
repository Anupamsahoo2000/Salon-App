document.addEventListener("DOMContentLoaded", initStaff);

async function initStaff() {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  if (!token || role !== "staff") {
    alert("Access denied");
    window.location.href = "index.html";
    return;
  }

  try {
    // ✅ Fetch staff profiles from backend
    const res = await api.get("/staff");
    const staffList = res.data.staff || [];
    const user = JSON.parse(localStorage.getItem("user"));
    const me = staffList.find((s) => s.user?.id === user?.id);

    console.log("✅ Staff Profile Loaded:", me);

    if (!me) {
      document.getElementById("staffArea").innerHTML =
        "<div class='text-red-600'>No staff profile found ❌</div>";
      return;
    }

    const workingHours = me.workingHours || {};
    const appts =
      (me.staffAppointments || []).filter((a) =>
        ["booked", "completed"].includes(a.status)
      ) || [];

    let html = `
      <div class="bg-white p-4 rounded-lg shadow mb-4">
        <div class="text-lg font-semibold">${me.user?.name || "Staff"}</div>
        <div class="text-sm text-gray-500">${me.specialization || "General"}</div>

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

      <div id="reviewsSection" class="bg-white p-4 rounded-lg shadow mt-4">
        <h3 class="font-semibold mb-2">Customer Reviews</h3>
        <div id="staffReviews" class="space-y-3 text-sm text-gray-700">
          Loading reviews...
        </div>
      </div>
    `;

    document.getElementById("staffArea").innerHTML = html;

    // ✅ Load staff-specific reviews
    loadStaffReviews(me);
  } catch (err) {
    console.error("Staff Load Error:", err);
    document.getElementById("staffArea").innerHTML =
      "<div class='text-red-600'>Failed to load staff profile ❌</div>";
  }
}

// ✅ Load Reviews Related to Staff’s Services
async function loadStaffReviews(me) {
  try {
    const res = await api.get("/reviews/all");
    const reviews = res.data.reviews || [];

    const myServiceIds = (me.services || []).map((s) => s.id);
    const myReviews = reviews.filter((r) =>
      myServiceIds.includes(r.serviceId)
    );

    if (myReviews.length === 0) {
      document.getElementById("staffReviews").innerHTML =
        "<div class='text-gray-500 text-sm'>No reviews yet</div>";
      return;
    }

    document.getElementById("staffReviews").innerHTML = myReviews
      .map(
        (r) => `
        <div class="border rounded p-3">
          <div class="font-semibold">${r.User?.name || "Anonymous"}</div>
          <div class="text-xs text-gray-500">${r.Service?.name || "Service"} — ⭐ ${
          r.rating
        }/5</div>
          <p class="mt-1">${r.comment}</p>

          ${
            r.staffResponse
              ? `<div class="mt-2 text-sm bg-gray-100 p-2 rounded"><strong>Response:</strong> ${r.staffResponse}</div>`
              : `<div class="mt-2 flex gap-2">
                  <textarea id="resp-${r.id}" placeholder="Write a response..." class="border p-1 rounded w-full text-sm"></textarea>
                  <button onclick="respondToReview('${r.id}')" class="bg-indigo-600 text-white px-3 py-1 rounded text-sm">Reply</button>
                </div>`
          }
        </div>
      `
      )
      .join("");
  } catch (err) {
    console.error("Load Staff Reviews Error:", err);
    document.getElementById("staffReviews").innerHTML =
      "<div class='text-red-600'>Failed to load reviews</div>";
  }
}

// ✅ Respond to Review
async function respondToReview(reviewId) {
  const response = document.getElementById(`resp-${reviewId}`).value.trim();
  if (!response) return alert("Please write a response before submitting.");

  try {
    await api.put(`/reviews/${reviewId}/respond`, { response });
    alert("Response added successfully!");
    initStaff(); // Reload to show updated response
  } catch (err) {
    console.error("Respond Error:", err);
    alert(err.response?.data?.message || "Failed to respond to review");
  }
}
