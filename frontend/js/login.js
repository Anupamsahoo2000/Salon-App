async function login() {
  try {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    const res = await api.post("/auth/login", { email, password });

    localStorage.setItem("token", res.data.token);
    localStorage.setItem("role", res.data.user.role);
    localStorage.setItem("user", JSON.stringify(res.data.user));

    // ✅ Redirect based on role
    if (res.data.user.role === "admin") {
      window.location.href = "admin.html";
    } else if (res.data.user.role === "staff") {
      window.location.href = "staff.html";
    } else {
      window.location.href = "index.html";
    }
  } catch (err) {
    console.error("Login error:", err);
    alert(err.response?.data?.message || "Login failed");
  }
}

// ✅ Signup Function (for users signing up)
async function signup() {
  try {
    const name = document.getElementById("regName").value.trim();
    const email = document.getElementById("regEmail").value.trim();
    const password = document.getElementById("regPassword").value;
    const phone = document.getElementById("regPhone").value.trim();

    if (!name || !email || !password || !phone) {
      return alert("All fields are required");
    }

    const res = await api.post("/auth/signup", {
      name,
      email,
      password,
      phone,
      role: "customer", // ✅ default when signing up
    });

    alert("Account created ✅ Please login now!");

    // ✅ Switch back to login form
    document.getElementById("regName").value = "";
    document.getElementById("regEmail").value = "";
    document.getElementById("regPassword").value = "";
    document.getElementById("regPhone").value = "";
    toggleForm();
  } catch (err) {
    console.error("Signup error:", err);
    alert(err.response?.data?.message || "Signup failed");
  }
}
