import {
  internalActionGeneric,
  internalQueryGeneric,
  makeFunctionReference,
} from "convex/server";
import { v, type GenericId } from "convex/values";
import { notifyLoanRef } from "./lib/notify";
import { sign } from "./lib/hmac";

type NotifyPayload = {
  eventId: string;
  event: string;
  toolName: string;
  startDate: string;
  endDate: string;
  recipient: { name: string; email: string };
  otherParty: { name: string };
};

export const loadNotifyPayload = internalQueryGeneric({
  args: { loanId: v.string(), event: v.string() },
  handler: async (ctx, args): Promise<NotifyPayload | null> => {
    const loan = await ctx.db.get(args.loanId as GenericId<"loans">);
    if (!loan) return null;
    const tool = await ctx.db.get(loan.toolId as GenericId<"tools">);
    const borrower = await ctx.db.get(loan.borrowerId as GenericId<"users">);
    const lender = await ctx.db.get(loan.lenderId as GenericId<"users">);
    const isRequestCreated = args.event === "request.created";
    const recipient = isRequestCreated ? lender : borrower;
    const otherParty = isRequestCreated ? borrower : lender;
    return {
      eventId: `${loan._id}:${loan.status}`,
      event: args.event,
      toolName: tool?.name ?? "Unknown tool",
      startDate: loan.startDate,
      endDate: loan.endDate,
      recipient: { name: recipient?.name ?? "Neighbor", email: recipient?.email ?? "" },
      otherParty: { name: otherParty?.name ?? "Neighbor" },
    };
  },
});

const loadPayloadRef = makeFunctionReference<
  "query",
  { loanId: string; event: string },
  NotifyPayload | null
>("automation:loadNotifyPayload");

export const notify = internalActionGeneric({
  args: { loanId: v.string(), event: v.string(), attempt: v.number() },
  handler: async (ctx, args) => {
    const payload = await ctx.runQuery(loadPayloadRef, {
      loanId: args.loanId,
      event: args.event,
    });
    if (!payload) {
      console.error(`Notification skipped, loan ${args.loanId} not found`);
      return null;
    }

    const rawBody = JSON.stringify(payload);
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = await sign(`${timestamp}.${rawBody}`, process.env.HMAC_SECRET ?? "");

    let ok = false;
    let detail = "";
    try {
      const response = await fetch(process.env.N8N_WEBHOOK_URL ?? "", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-LendLoop-Timestamp": String(timestamp),
          "X-LendLoop-Signature": signature,
        },
        body: rawBody,
      });
      ok = response.ok;
      detail = `status ${response.status}`;
    } catch (err) {
      detail = err instanceof Error ? err.message : "network error";
    }

    if (ok) return null;

    console.error(`Notification ${args.event} failed for loan ${args.loanId}: ${detail}`);
    if (args.attempt < 3) {
      await ctx.scheduler.runAfter(Math.pow(2, args.attempt) * 1000, notifyLoanRef, {
        loanId: args.loanId,
        event: args.event,
        attempt: args.attempt + 1,
      });
    } else {
      console.error(`Final notification failure for loan ${args.loanId}: ${args.event}`);
    }
    return null;
  },
});