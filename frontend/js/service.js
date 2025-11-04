// service.js
document.addEventListener("DOMContentLoaded", initServices);

async function initServices() {
  const grid = document.getElementById("servicesGrid");
  const search = document.getElementById("searchInput");

  async function load() {
    try {
      const res = await api.get("/services"); // GET /services
      const services = res.data.services || res.data || [];
      render(services);
    } catch (err) {
      console.error(err);
      grid.innerHTML = `<div class="text-red-600">Failed to load services</div>`;
    }
  }

  function render(items) {
    grid.innerHTML = items.map((s) => cardHtml(s)).join("");
    document.querySelectorAll(".book-now-btn").forEach((btn) => {
      btn.onclick = (e) => {
        const sid = e.target.dataset.id;
        window.location.href = `booking.html?serviceId=${sid}`;
      };
    });
  }

  function cardHtml(s) {
    return `
      <div class="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow card-hover transition">
        <div class="h-40 rounded-lg bg-cover bg-center" style="background-image:url('${
          s.image ||
          "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1169"
        }')"></div>
        <h3 class="mt-4 text-lg font-semibold text-pink-600">${s.name}</h3>
        <p class="text-sm text-gray-600 dark:text-gray-300 mt-2">${
          s.description || ""
        }</p>
        <div class="flex items-center justify-between mt-4">
          <div class="text-xl font-bold text-pink-600">₹${s.price}</div>
          <div class="text-sm text-gray-500">${s.durationMinutes} min</div>
        </div>
        <div class="mt-4">
          <button class="book-now-btn w-full py-2 rounded-lg bg-pink-600 text-white font-semibold" data-id="${
            s.id
          }">
            Book Now
          </button>
        </div>
      </div>
    `;
  }

  search.addEventListener("input", (e) => {
    const q = e.target.value.trim().toLowerCase();
    const cards = document.querySelectorAll("#servicesGrid > div");
    cards.forEach((card) => {
      const txt = card.innerText.toLowerCase();
      card.style.display = txt.includes(q) ? "" : "none";
    });
  });

  await load();
}
