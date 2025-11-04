// ✅ Correct Backend API Base URL
const api = axios.create({
  baseURL: "http://localhost:3000", // ✅ Add this
});

// ✅ Auto-add token if logged in
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
