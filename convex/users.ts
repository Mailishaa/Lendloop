import { internalMutationGeneric, mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";
import { getCurrentUser, requireAdmin } from "./lib/auth";

export const store = mutationGeneric({
  args: v.object({}),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.subject) {
      throw new Error("You must be signed in to do that.");
    }
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (existing) {
      return existing;
    }
    const newUserId = await ctx.db.insert("users", {
      clerkId: identity.subject,
      name: identity.name ?? identity.subject,
      email: identity.email ?? "",
      role: "user",
      trustedLender: false,
    });
    return newUserId;
  },
});

export const me = queryGeneric({
  args: v.object({}),
  handler: async (ctx) => getCurrentUser(ctx),
});

export const setTrustedLender = mutationGeneric({
  args: { userId: v.id("users"), trusted: v.boolean() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const user = await ctx.db.get("users", args.userId);
    if (!user) {
      throw new Error("User not found.");
    }
    await ctx.db.patch("users", args.userId, { trustedLender: args.trusted });
    return null;
  },
});

export const makeAdmin = internalMutationGeneric({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .collect()
      .then((users) => users.find((u) => u.email === args.email));
    if (!user) {
      throw new Error("User not found.");
    }
    await ctx.db.patch("users", user._id, { role: "admin" });
    return null;
  },
});

export const listUsers = queryGeneric({
  args: v.object({}),
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.db.query("users").collect();
  },
});
