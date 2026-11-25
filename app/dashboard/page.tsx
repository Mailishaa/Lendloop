"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useQueries } from "convex/react";
import { anyApi } from "convex/server";

export function DashboardHome() {
  const queries = useMemo(
    () => ({
      myTools: { query: anyApi.tools.listMine, args: {} },
      myLoans: { query: anyApi.loans.listMine, args: {} },
      incoming: { query: anyApi.loans.listIncoming, args: {} },
    }),
    [],
  );
  const result = useQueries(queries);
  const tools = result.myTools;
  const myLoans = result.myLoans;
  const incoming = result.incoming;

  const toolsList = (tools instanceof Error || tools === undefined ? [] : tools) as Array<{
    _id: string;
  }>;
  const loansList = (myLoans instanceof Error || myLoans === undefined ? [] : myLoans) as Array<{
    status: string;
  }>;
  const incomingList = (incoming instanceof Error || incoming === undefined ? [] : incoming) as Array<{
    status: string;
  }>;

  const activeLoans = loansList.filter((l) => l.status === "approved").length;
  const pendingIncoming = incomingList.filter(
    (l) => l.status === "pending",
  ).length;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Overview</h1>
      <p className="mt-1 text-sm text-zinc-500">Borrow what you need. Lend what you don&apos;t.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-zinc-500">My tools</p>
          <p className="mt-1 text-3xl font-semibold text-zinc-900">{toolsList.length}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-zinc-500">Active loans</p>
          <p className="mt-1 text-3xl font-semibold text-zinc-900">{activeLoans}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-zinc-500">Pending requests</p>
          <p className="mt-1 text-3xl font-semibold text-zinc-900">{pendingIncoming}</p>
        </div>
      </div>
      <div className="mt-6 flex gap-3">
        <Link href="/dashboard/tools" className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-700">
          Manage tools
        </Link>
        <Link href="/dashboard/borrow" className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50">
          Browse tools
        </Link>
      </div>
    </div>
  );
}

export default function DashboardHomePage() {
  return <DashboardHome />;
}
