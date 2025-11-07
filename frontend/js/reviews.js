document.addEventListener("DOMContentLoaded", initReviews);

async function initReviews() {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  const user = JSON.parse(localStorage.getItem("user") || "null");

  // Show logout if logged in
  if (token) document.getElementById("logoutBtn").classList.remove("hidden");
  document.getElementById("logoutBtn").onclick = () => {
    localStorage.clear();
    window.location.href = "login.html";
  };

  const serviceSelect = document.getElementById("serviceSelect");
  const reviewsContainer = document.getElementById("reviewsContainer");
  const addReviewForm = document.getElementById("addReviewForm");

  // Load available services
  try {
    const res = await api.get("/services");
    const services = res.data.services || [];
    serviceSelect.innerHTML =
      '<option value="">Select a service</option>' +
      services
        .map((s) => `<option value="${s.id}">${s.name}</option>`)
        .join("");
  } catch (err) {
    console.error("Service load failed:", err);
  }

  // Load reviews when button clicked
  document.getElementById("loadReviewsBtn").onclick = async () => {
    const serviceId = serviceSelect.value;
    if (!serviceId) return alert("Please select a service");

    try {
      const res = await api.get(`/reviews/service/${serviceId}`);
      const reviews = res.data.reviews || [];

      if (reviews.length === 0) {
        reviewsContainer.innerHTML = `<div class="text-gray-500">No reviews yet.</div>`;
      } else {
        reviewsContainer.innerHTML = reviews
          .map(
            (r) => `
          <div class="border rounded-lg p-4 shadow-sm">
            <div class="flex justify-between items-center">
              <div>
                <div class="font-semibold">${r.User?.name || "Anonymous"}</div>
                <div class="text-sm text-gray-500">⭐ ${r.rating}/5</div>
              </div>
              <div class="text-xs text-gray-400">
                ${new Date(r.createdAt).toLocaleString()}
              </div>
            </div>
            <p class="mt-2">${r.comment}</p>
            ${
              r.staffResponse
                ? `<div class="mt-3 text-sm bg-gray-100 p-2 rounded"><strong>Staff Response:</strong> ${r.staffResponse}</div>`
                : role === "staff"
                ? `<textarea id="resp-${r.id}" placeholder="Write response..." class="border p-2 rounded w-full mt-2"></textarea>
                   <button onclick="submitResponse('${r.id}')" class="bg-indigo-600 text-white px-3 py-1 rounded mt-1">Respond</button>`
                : ""
            }
          </div>`
          )
          .join("");
      }

      // Show add review form for customers only
      addReviewForm.classList.toggle("hidden", role !== "customer");
    } catch (err) {
      console.error("Failed to load reviews:", err);
      alert("Failed to load reviews");
    }
  };

  // Submit new review (customer only)
  document.getElementById("submitReviewBtn").onclick = async () => {
    const appointmentId = document.getElementById("appointmentId").value.trim();
    const rating = Number(document.getElementById("rating").value);
    const comment = document.getElementById("comment").value.trim();

    if (!appointmentId || !rating || !comment)
      return alert("All fields required");

    try {
      await api.post("/reviews", { appointmentId, rating, comment });
      alert("Review submitted!");
      document.getElementById("comment").value = "";
      document.getElementById("rating").value = "";
      document.getElementById("appointmentId").value = "";
      document.getElementById("loadReviewsBtn").click(); // refresh
    } catch (err) {
      alert(err.response?.data?.message || "Failed to add review");
    }
  };
}

// Staff responds to a review
async function submitResponse(reviewId) {
  const response = document.getElementById(`resp-${reviewId}`).value.trim();
  if (!response) return alert("Please write a response");
  try {
    await api.put(`/reviews/${reviewId}/respond`, { response });
    alert("Response added!");
    document.getElementById("loadReviewsBtn").click();
  } catch (err) {
    console.error("Respond Error:", err);
    alert(err.response?.data?.message || "Failed to respond");
  }
}
