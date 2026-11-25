import { internalQueryGeneric, mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";
import { GenericId } from "convex/values";
import { getCurrentUser, requireAdmin, type AnyCtx } from "./lib/auth";
import { notifyLoanRef } from "./lib/notify";

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

function isValidDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function daysBetween(from: string, to: string): number {
  const ms = Date.parse(to) - Date.parse(from);
  return Math.round(ms / (24 * 60 * 60 * 1000));
}

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

async function toLoanView(ctx: AnyCtx, loanId: GenericId<"loans">): Promise<LoanView> {
  const loan = await ctx.db.get("loans", loanId);
  if (!loan) {
    throw new Error("Loan not found.");
  }
  const tool = await ctx.db.get("tools", loan.toolId as GenericId<"tools">);
  const borrower = await ctx.db.get("users", loan.borrowerId as GenericId<"users">);
  const lender = await ctx.db.get("users", loan.lenderId as GenericId<"users">);
  const reminders = await ctx.db
    .query("reminders")
    .withIndex("by_loan", (q) => q.eq("loanId", loanId))
    .collect();
  const lastSent = reminders
    .filter((r) => r.status === "sent")
    .reduce((max, r) => Math.max(max, r.sentAt), 0);
  return {
    loanId,
    toolId: loan.toolId,
    toolName: tool?.name ?? "Unknown tool",
    borrowerId: loan.borrowerId,
    borrowerName: borrower?.name ?? "Unknown neighbor",
    lenderId: loan.lenderId,
    lenderName: lender?.name ?? "Unknown neighbor",
    status: loan.status,
    startDate: loan.startDate,
    endDate: loan.endDate,
    isOverdue: loan.status === "approved" && loan.endDate < todayUtc(),
    lastReminderAt: lastSent > 0 ? lastSent : null,
  };
}

export const request = mutationGeneric({
  args: {
    toolId: v.id("tools"),
    startDate: v.string(),
    endDate: v.string(),
  },
  handler: async (ctx, args) => {
    const borrower = await getCurrentUser(ctx);
    const tool = await ctx.db.get("tools", args.toolId);
    if (!tool) {
      throw new Error("Tool not found.");
    }
    if (tool.ownerId === borrower.clerkId) {
      throw new Error("You cannot borrow a tool you listed.");
    }
    if (!tool.isAvailable) {
      throw new Error("This tool is not available right now.");
    }
    if (!isValidDate(args.startDate) || !isValidDate(args.endDate)) {
      throw new Error("Dates must be valid YYYY-MM-DD strings.");
    }
    const today = todayUtc();
    if (args.startDate < today) {
      throw new Error("Start date must be today or later.");
    }
    if (args.endDate < args.startDate) {
      throw new Error("End date must be on or after the start date.");
    }
    const pending = await ctx.db
      .query("loans")
      .withIndex("by_tool", (q) => q.eq("toolId", args.toolId))
      .collect();
    const existing = pending.filter(
      (l) => l.borrowerId === borrower.clerkId && l.status === "pending",
    );
    if (existing.length > 0) {
      throw new Error("You already have a pending request for this tool.");
    }
    const loanId = await ctx.db.insert("loans", {
      toolId: args.toolId,
      borrowerId: borrower.clerkId,
      lenderId: tool.ownerId,
      startDate: args.startDate,
      endDate: args.endDate,
      status: "pending",
    });
    await ctx.scheduler.runAfter(0, notifyLoanRef, { loanId, event: "request.created", attempt: 0 });
    return null;
  },
});

export const approve = mutationGeneric({
  args: { loanId: v.id("loans") },
  handler: async (ctx, args) => {
    const lender = await getCurrentUser(ctx);
    const loan = await ctx.db.get("loans", args.loanId);
    if (!loan) {
      throw new Error("Loan not found.");
    }
    if (loan.status !== "pending") {
      throw new Error("Only pending loans can be approved.");
    }
    const isLender = loan.lenderId === lender.clerkId;
    const isAdmin = lender.role === "admin";
    if (!isLender && !isAdmin) {
      throw new Error("Only the lender can approve a request.");
    }
    await ctx.db.patch("loans", args.loanId, { status: "approved" });
    await ctx.db.patch("tools", loan.toolId, { isAvailable: false });
    const sameToolPending = await ctx.db
      .query("loans")
      .withIndex("by_tool", (q) => q.eq("toolId", loan.toolId))
      .collect();
    const others = sameToolPending.filter((l) => l.status === "pending" && l._id !== args.loanId);
    for (const other of others) {
      await ctx.db.patch("loans", other._id, { status: "declined" });
      await ctx.scheduler.runAfter(0, notifyLoanRef, { loanId: other._id, event: "request.declined", attempt: 0 });
    }
    await ctx.scheduler.runAfter(0, notifyLoanRef, { loanId: args.loanId, event: "request.approved", attempt: 0 });
    return null;
  },
});

export const decline = mutationGeneric({
  args: { loanId: v.id("loans") },
  handler: async (ctx, args) => {
    const actor = await getCurrentUser(ctx);
    const loan = await ctx.db.get("loans", args.loanId);
    if (!loan) {
      throw new Error("Loan not found.");
    }
    if (loan.status !== "pending") {
      throw new Error("Only pending loans can be declined.");
    }
    const isLender = loan.lenderId === actor.clerkId;
    const isAdmin = actor.role === "admin";
    if (!isLender && !isAdmin) {
      throw new Error("Only the lender can decline a request.");
    }
    await ctx.db.patch("loans", args.loanId, { status: "declined" });
    await ctx.scheduler.runAfter(0, notifyLoanRef, { loanId: args.loanId, event: "request.declined", attempt: 0 });
    return null;
  },
});

export const markReturned = mutationGeneric({
  args: { loanId: v.id("loans") },
  handler: async (ctx, args) => {
    const actor = await getCurrentUser(ctx);
    const loan = await ctx.db.get("loans", args.loanId);
    if (!loan) {
      throw new Error("Loan not found.");
    }
    if (loan.status !== "approved") {
      throw new Error("Only approved loans can be marked returned.");
    }
    const isLender = loan.lenderId === actor.clerkId;
    const isAdmin = actor.role === "admin";
    if (!isLender && !isAdmin) {
      throw new Error("Only the lender can mark a loan returned.");
    }
    await ctx.db.patch("loans", args.loanId, { status: "returned" });
    await ctx.db.patch("tools", loan.toolId, { isAvailable: true });
    await ctx.scheduler.runAfter(0, notifyLoanRef, { loanId: args.loanId, event: "request.returned", attempt: 0 });
    return null;
  },
});

export const listMine = queryGeneric({
  args: v.object({}),
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    const loans = await ctx.db
      .query("loans")
      .withIndex("by_borrower", (q) => q.eq("borrowerId", user.clerkId))
      .collect();
    const views: LoanView[] = [];
    for (const loan of loans) {
      views.push(await toLoanView(ctx, loan._id));
    }
    return views;
  },
});

export const listIncoming = queryGeneric({
  args: v.object({}),
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    const loans = await ctx.db
      .query("loans")
      .withIndex("by_lender", (q) => q.eq("lenderId", user.clerkId))
      .collect();
    const views: LoanView[] = [];
    for (const loan of loans) {
      views.push(await toLoanView(ctx, loan._id));
    }
    return views;
  },
});

export const listAll = queryGeneric({
  args: v.object({}),
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const loans = await ctx.db.query("loans").collect();
    const views: LoanView[] = [];
    for (const loan of loans) {
      views.push(await toLoanView(ctx, loan._id));
    }
    return views;
  },
});

export const listOverdueForReminders = internalQueryGeneric({
  args: v.object({}),
  handler: async (ctx) => {
    const today = todayUtc();
    const loans = await ctx.db
      .query("loans")
      .withIndex("by_status", (q) => q.eq("status", "approved"))
      .collect();
    const overdue: Array<Record<string, unknown>> = [];
    for (const loan of loans) {
      if (loan.endDate >= today) {
        continue;
      }
      const tool = await ctx.db.get("tools", loan.toolId as GenericId<"tools">);
      const borrower = await ctx.db.get("users", loan.borrowerId as GenericId<"users">);
      const reminderKey = `${loan._id}:${today}`;
      const sent = await ctx.db
        .query("reminders")
        .withIndex("by_key", (q) => q.eq("key", reminderKey))
        .first();
      if (sent && sent.status === "sent") {
        continue;
      }
      overdue.push({
        loanId: loan._id,
        toolName: tool?.name ?? "Unknown tool",
        endDate: loan.endDate,
        daysOverdue: daysBetween(loan.endDate, today),
        borrower: { name: borrower?.name ?? "Unknown neighbor", email: borrower?.email ?? "" },
        reminderKey,
      });
    }
    return overdue;
  },
});
