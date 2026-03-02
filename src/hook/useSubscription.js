import { useEffect, useState } from "react";
import { getMySubscription } from "../api/subscriptionService";

export function useSubscription() {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }

    getMySubscription(token)
      .then((data) => {
        setSubscription(data);
      })
      .catch(() => {
        setSubscription(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return { subscription, loading };
}
