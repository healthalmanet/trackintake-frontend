const API_BASE = import.meta.env.VITE_API_URL;

// 🔹 Get all plans
export const getPlans = async (token) => {
  const res = await fetch(`${API_BASE}/subscriptions/plans/`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch plans");
  }

  return res.json();
};

// 🔹 Create Razorpay order
export const createOrder = async (planId, token) => {
  const res = await fetch(`${API_BASE}/subscriptions/create-order/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ plan_id: planId }),
  });

  if (!res.ok) {
    throw new Error("Failed to create order");
  }

  return res.json();
};
export const getMySubscription = async (token) => {
  const res = await fetch(
    `${import.meta.env.VITE_API_URL}/subscriptions/my/`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!res.ok) {
    throw new Error("Failed to fetch subscription");
  }

  return res.json();
};
