const BASE_URL = import.meta.env.VITE_API_URL;
console.log("API URL:", import.meta.env.VITE_API_URL);

// Common request wrapper
const request = async (endpoint, options = {}) => {
  const token = localStorage.getItem("token");

  const config = {
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    ...options,
  };

  const res = await fetch(`${BASE_URL}${endpoint}`, config);

  if (res.status === 401) {
    localStorage.removeItem("token");
    window.location.href = "/login";
    return;
  }

  if (!res.ok) {
    throw new Error("API Error");
  }

  return res.json();
};

// ===== Auth APIs =====
export const signupUser = (data) => {
  return request("/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

export const loginUser = (data) => {
  return request("/login", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

// ===== Dashboard APIs =====
export const getTrend = () => request("/trend");
export const getHSITrend = () => request("/hsi_trend");
export const getForecast = () => request("/forecast");

export const calculateHSI = (payload) =>
  request("/calculate", {
    method: "POST",
    body: JSON.stringify(payload),
  });