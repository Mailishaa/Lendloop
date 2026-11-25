"use client";

import { useMemo } from "react";
import { useQueries } from "convex/react";
import { anyApi } from "convex/server";

type LoanView = {
  loanId: string;
  toolId: string;
  toolName: string;
  borrowerId: string;
  borrowerName: string;
  lenderId: string;
  lenderName: string;
  status: string;
  startDate: string;
  endDate: string;
  isOverdue: boolean;
  lastReminderAt: number | null;
};

export function MyLoans() {
  const queries = useMemo(
    () => ({ myLoans: { query: anyApi.loans.listMine, args: {} } }),
    [],
  );
  const result = useQueries(queries);
  const loans = result.myLoans;

  const list = (loans instanceof Error ? [] : loans) as LoanView[];

  if (loans === undefined) {
    return <p>Loading loans…</p>;
  }
  if (loans instanceof Error) {
    return <p>Could not load your loans.</p>;
  }

  if (list.length === 0) {
    return <p>You have no loans yet.</p>;
  }

  return (
    <ul className="mt-4 grid gap-2">
      {list.map((loan) => (
        <li
          key={loan.loanId}
          className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:shadow-md"
        >
          <p className="font-medium text-zinc-900">{loan.toolName}</p>
          <p className="mt-1 text-sm text-zinc-600">
            {loan.startDate} → {loan.endDate}
          </p>
          <p className="text-sm text-zinc-500">
            Lender: {loan.lenderName} · Status: {loan.status}
          </p>
        </li>
      ))}
    </ul>
  );
}
