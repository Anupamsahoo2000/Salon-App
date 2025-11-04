document.addEventListener("DOMContentLoaded", initPayment);

async function waitForCashfree() {
  while (typeof Cashfree === "undefined") {
    console.log("⏳ Waiting for Cashfree SDK to load...");
    await new Promise((r) => setTimeout(r, 100));
  }
  return new Cashfree({ mode: "sandbox" });
}

async function initPayment() {
  const params = new URLSearchParams(window.location.search);
  const appointmentId = params.get("appointmentId");
  const payBtn = document.getElementById("payBtn");
  const paymentInfo = document.getElementById("paymentInfo");

  if (!appointmentId) {
    paymentInfo.innerHTML = "<div>No appointment found</div>";
    return;
  }

  try {
    const { data } = await api.get(`/appointments/${appointmentId}`);
    const appt = data.appointment;

    if (!appt?.service) {
      paymentInfo.innerHTML = `
        <div class='text-red-600'>Failed to load appointment</div>`;
      return;
    }

    paymentInfo.innerHTML = `
      <div><strong>Service:</strong> ${appt.service.name}</div>
      <div><strong>Date:</strong> ${new Date(
        appt.appointmentDate
      ).toLocaleString()}</div>
      <div><strong>Amount:</strong> ₹${appt.service.price}</div>
    `;

    payBtn.onclick = async () => {
      try {
        const res = await api.post("/payment/create-order", { appointmentId });
        if (!res.data.success) return alert(res.data.message);

        const cashfree = await waitForCashfree(); // ✅ ensure SDK ready

        await cashfree.checkout({
          paymentSessionId: res.data.paymentSessionId,
          redirectTarget: "_self",
        });
      } catch (err) {
        console.error("⚠ Payment init failed:", err);
        alert("Unable to start payment");
      }
    };
  } catch (err) {
    console.error(err);
    paymentInfo.innerHTML = `
      <div class='text-red-600'>Failed to load appointment</div>`;
  }
}
