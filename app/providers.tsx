"use client";

import { useMemo } from "react";
import type { ReactNode } from "react";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { useAuth } from "@clerk/nextjs";
import { EnsureUser } from "@/components/ensure-user";

export function Providers({ children }: { children: ReactNode }) {
  const convex = useMemo(
    () =>
      new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL ?? "", {
        logger: false,
      }),
    [],
  );
  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      <EnsureUser />
      {children}
    </ConvexProviderWithClerk>
  );
}
