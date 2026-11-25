"use client";

import { useMemo } from "react";
import { useMutation, useQueries } from "convex/react";
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

export function IncomingLoans() {
  const queries = useMemo(
    () => ({ incoming: { query: anyApi.loans.listIncoming, args: {} } }),
    [],
  );
  const result = useQueries(queries);
  const loans = result.incoming;
  const approve = useMutation(anyApi.loans.approve);
  const decline = useMutation(anyApi.loans.decline);
  const markReturned = useMutation(anyApi.loans.markReturned);

  const list = (loans instanceof Error ? [] : loans) as LoanView[];

  if (loans === undefined) {
    return <p>Loading requests…</p>;
  }
  if (loans instanceof Error) {
    return <p>Could not load your requests.</p>;
  }

  if (list.length === 0) {
    return <p>No incoming requests.</p>;
  }

  async function onApprove(loanId: string) {
    await approve({ loanId });
  }

  async function onDecline(loanId: string) {
    await decline({ loanId });
  }

  async function onMarkReturned(loanId: string) {
    await markReturned({ loanId });
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
            {loan.startDate} → {loan.endDate} · Borrower: {loan.borrowerName} ·
            Status: {loan.status}
          </p>
          {loan.status === "pending" && (
            <div className="mt-3 flex gap-2">
              <button
                className="rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-700"
                onClick={() => onApprove(loan.loanId)}
              >
                Approve
              </button>
              <button
                className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-700 transition hover:bg-zinc-50"
                onClick={() => onDecline(loan.loanId)}
              >
                Decline
              </button>
            </div>
          )}
          {loan.status === "approved" && (
            <button
              className="mt-3 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-700 transition hover:bg-zinc-50"
              onClick={() => onMarkReturned(loan.loanId)}
            >
              Mark returned
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
