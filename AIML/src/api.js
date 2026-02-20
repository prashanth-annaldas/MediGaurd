const BASE_URL = "http://127.0.0.1:8000";

export const getTrend = async () => {
  const res = await fetch(`${BASE_URL}/trend`);
  return res.json();
};

export const calculateHSI = async (payload) => {
  const res = await fetch(`${BASE_URL}/calculate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  return res.json();
};