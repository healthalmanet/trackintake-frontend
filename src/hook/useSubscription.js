import { useEffect, useState } from "react";
import { getMySubscription } from "../api/subscriptionService";

const CACHE_KEY = "user_sub_cache";
const CACHE_TTL = 60 * 1000; // 1 minute TTL

export function useSubscription() {
  const [subscription, setSubscription] = useState(() => {
    try {
      const raw = sessionStorage.getItem(CACHE_KEY);
      if (raw) {
        const { data, timestamp } = JSON.parse(raw);
        if (Date.now() - timestamp < CACHE_TTL) {
          return data;
        }
      }
    } catch {
      // Ignore storage errors
    }
    return null;
  });

  const [loading, setLoading] = useState(() => {
    try {
      const raw = sessionStorage.getItem(CACHE_KEY);
      if (raw) {
        const { timestamp } = JSON.parse(raw);
        if (Date.now() - timestamp < CACHE_TTL) {
          return false; // Instant load from cache!
        }
      }
    } catch {
      // Ignore
    }
    return true;
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }

    getMySubscription(token)
      .then((data) => {
        setSubscription(data);
        try {
          sessionStorage.setItem(
            CACHE_KEY,
            JSON.stringify({ data, timestamp: Date.now() })
          );
        } catch {
          // Ignore storage errors
        }
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
