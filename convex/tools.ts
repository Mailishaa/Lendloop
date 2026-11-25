import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";
import { categoryValidator, conditionValidator } from "./lib/validators";
import { getCurrentUser } from "./lib/auth";
import { notifyLoanRef } from "./lib/notify";

export const listPublic = queryGeneric({
  args: v.object({}),
  handler: async (ctx) => {
    const all = await ctx.db.query("tools").collect();
    return all
      .filter((t) => t.isAvailable)
      .map((t) => ({ name: t.name, category: t.category }));
  },
});

export const list = queryGeneric({
  args: { category: v.optional(categoryValidator) },
  handler: async (ctx, args) => {
    await getCurrentUser(ctx);
    const all = await ctx.db.query("tools").collect();
    const tools = args.category
      ? all.filter((t) => t.category === args.category)
      : all;
    const result = await Promise.all(
      tools.map(async (t) => {
        const owner = await ctx.db
          .query("users")
          .withIndex("by_clerkId", (q) => q.eq("clerkId", t.ownerId))
          .first();
        return {
          _id: t._id,
          name: t.name,
          category: t.category,
          condition: t.condition,
          description: t.description,
          ownerId: t.ownerId,
          ownerName: owner?.name ?? null,
          trustedLender: owner?.trustedLender ?? false,
          isAvailable: t.isAvailable,
        };
      }),
    );
    return result;
  },
});

export const listMine = queryGeneric({
  args: v.object({}),
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    const all = await ctx.db.query("tools").collect();
    return all
      .filter((t) => t.ownerId === user.clerkId)
      .map((t) => ({
        _id: t._id,
        name: t.name,
        category: t.category,
        condition: t.condition,
        description: t.description,
        ownerId: t.ownerId,
        ownerName: user.name,
        trustedLender: user.trustedLender,
        isAvailable: t.isAvailable,
      }));
  },
});

export const create = mutationGeneric({
  args: {
    name: v.string(),
    category: categoryValidator,
    condition: conditionValidator,
    description: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const name = args.name.trim();
    const description = args.description.trim();
    if (name.length < 2 || name.length > 80) {
      throw new Error("Tool name must be between 2 and 80 characters.");
    }
    if (description.length > 300) {
      throw new Error("Description must be at most 300 characters.");
    }
    const toolId = await ctx.db.insert("tools", {
      ownerId: user.clerkId,
      name,
      category: args.category,
      condition: args.condition,
      description,
      isAvailable: true,
    });
    return toolId;
  },
});

export const update = mutationGeneric({
  args: {
    toolId: v.id("tools"),
    name: v.optional(v.string()),
    category: v.optional(categoryValidator),
    condition: v.optional(conditionValidator),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const tool = await ctx.db.get("tools", args.toolId);
    if (!tool) {
      throw new Error("Tool not found.");
    }
    if (user.role !== "admin" && tool.ownerId !== user.clerkId) {
      throw new Error("You can only change your own listings.");
    }
    const patch: {
      name?: string;
      category?: string;
      condition?: string;
      description?: string;
    } = {};
    if (args.name !== undefined) {
      const name = args.name.trim();
      if (name.length < 2 || name.length > 80) {
        throw new Error("Tool name must be between 2 and 80 characters.");
      }
      patch.name = name;
    }
    if (args.category !== undefined) {
      patch.category = args.category;
    }
    if (args.condition !== undefined) {
      patch.condition = args.condition;
    }
    if (args.description !== undefined) {
      const description = args.description.trim();
      if (description.length > 300) {
        throw new Error("Description must be at most 300 characters.");
      }
      patch.description = description;
    }
    if (Object.keys(patch).length > 0) {
      await ctx.db.patch("tools", args.toolId, patch);
    }
    return null;
  },
});

export const remove = mutationGeneric({
  args: { toolId: v.id("tools") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const tool = await ctx.db.get("tools", args.toolId);
    if (!tool) {
      throw new Error("Tool not found.");
    }
    const isOwner = tool.ownerId === user.clerkId;
    const isAdmin = user.role === "admin";
    if (!isOwner && !isAdmin) {
      throw new Error("You can only remove your own listings.");
    }
    const toolLoans = await ctx.db
      .query("loans")
      .withIndex("by_tool", (q) => q.eq("toolId", args.toolId))
      .collect();
    const hasActiveLoan = toolLoans.some(
      (l) => l.status === "approved" && l.endDate >= new Date().toISOString().slice(0, 10),
    );
    if (isOwner && hasActiveLoan) {
      throw new Error("Cannot remove a tool that has an active loan.");
    }
    const pendingLoans = toolLoans.filter((l) => l.status === "pending");
    if (isAdmin) {
      // Admin delete cascades: decline pending requests for the tool.
      for (const loan of pendingLoans) {
        await ctx.db.patch("loans", loan._id, { status: "declined" });
        await ctx.scheduler.runAfter(0, notifyLoanRef, { loanId: loan._id, event: "request.declined", attempt: 0 });
      }
    }
    await ctx.db.delete("tools", args.toolId);
    return null;
  },
});
