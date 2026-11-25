"use client";

import { useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQueries } from "convex/react";
import { anyApi } from "convex/server";

const links = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/tools", label: "My Tools" },
  { href: "/dashboard/borrow", label: "Borrow" },
  { href: "/dashboard/loans", label: "My Loans" },
  { href: "/dashboard/requests", label: "Requests" },
  { href: "/dashboard/admin", label: "Admin" },
];

export function DashboardNav() {
  const pathname = usePathname();
  const queries = useMemo(
    () => ({ me: { query: anyApi.users.me, args: {} } }),
    [],
  );
  const result = useQueries(queries);
  const me = result.me;
  const isAdmin = !!(
    me &&
    !(me instanceof Error) &&
    (me as { role?: string }).role === "admin"
  );

  return (
    <nav className="flex items-center justify-between border-b border-zinc-200 bg-white px-8 py-4 shadow-sm">
      <Link href="/dashboard" className="text-lg font-bold tracking-tight text-zinc-900">
        LendLoop
      </Link>
      <div className="flex gap-1">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={
              pathname === link.href
                ? "rounded-lg bg-zinc-100 px-3 py-1.5 text-sm font-medium text-zinc-900"
                : "rounded-lg px-3 py-1.5 text-sm text-zinc-500 transition hover:bg-zinc-50 hover:text-zinc-900"
            }
          >
            {link.label}
          </Link>
        ))}
      </div>
      {isAdmin && <span className="text-xs font-medium text-zinc-400">Admin</span>}
    </nav>
  );
}
