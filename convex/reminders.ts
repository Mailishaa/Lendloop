import { internalMutationGeneric } from "convex/server";
import { v } from "convex/values";

export const record = internalMutationGeneric({
  args: {
    key: v.string(),
    loanId: v.string(),
    status: v.union(v.literal("sent"), v.literal("failed")),
    detail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("reminders")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();
    if (existing) {
      return { duplicate: true };
    }
    const insertArgs: {
      loanId: string;
      key: string;
      status: string;
      detail?: string;
      sentAt: number;
    } = {
      loanId: args.loanId,
      key: args.key,
      status: args.status,
      sentAt: Date.now(),
    };
    if (args.detail !== undefined) {
      insertArgs.detail = args.detail;
    }
    await ctx.db.insert("reminders", insertArgs);
    return { duplicate: false };
  },
});
