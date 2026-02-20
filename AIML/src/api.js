const BASE_URL = import.meta.env.VITE_API_URL;
console.log(import.meta.env.VITE_API_URL)

// 🔹 Common fetch wrapper
const request = async (endpoint, options = {}) => {
  const token = localStorage.getItem("token");

  const config = {
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    ...options,
  };

  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, config);

    // 🔥 If token expired or invalid → redirect to login
    if (res.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
      return;
    }

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.detail || "Something went wrong");
    }

    return await res.json();
  } catch (error) {
    console.error("API Error:", error.message);
    throw error;
  }
};


// =============================
// 📊 GET Trend
// =============================
export const getTrend = () => {
  return request("/trend", {
    method: "GET",
  });
};


// =============================
// 🧠 POST Calculate HSI
// =============================
export const calculateHSI = (payload) => {
  return request("/calculate", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};