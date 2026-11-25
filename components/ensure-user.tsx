"use client";

import { useEffect, useRef } from "react";
import { useConvexAuth, useMutation } from "convex/react";
import { anyApi } from "convex/server";

export function EnsureUser() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const store = useMutation(anyApi.users.store);
  const done = useRef(false);

  useEffect(() => {
    if (isLoading || !isAuthenticated || done.current) {
      return;
    }
    done.current = true;
    store({}).catch(() => {
      done.current = false;
    });
  }, [isAuthenticated, isLoading, store]);

  return null;
}
