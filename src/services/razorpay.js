export const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (typeof window !== "undefined" && window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export const openRazorpay = (order) => {
  const options = {
    key: order.key, // public razorpay key
    amount: order.amount,
    currency: "INR",
    order_id: order.order_id,
    name: "TrackIntake",
    description: "Subscription Purchase",

    handler: () => {
      alert("Payment successful 🎉");
      window.location.href = "/dashboard";
    },

    theme: {
      color: "#ff7a18",
    },
  };

  const rzp = new window.Razorpay(options);
  rzp.open();
};
