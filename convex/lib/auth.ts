import { type Auth, type GenericDatabaseReader } from "convex/server";
import { type DataModel } from "./types";

export type AnyCtx = {
  auth: Auth;
  db: GenericDatabaseReader<DataModel>;
};

export async function getCurrentUser(ctx: AnyCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity?.subject) {
    throw new Error("You must be signed in to do that.");
  }
  const user = await ctx.db
    .query("users")
    .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
    .first();
  if (!user) {
    throw new Error("No user profile found for this account.");
  }
  return user;
}

export async function requireAdmin(ctx: AnyCtx) {
  const user = await getCurrentUser(ctx);
  if (user.role !== "admin") {
    throw new Error("Admin access required.");
  }
  return user;
}

export function assertOwnerOrAdmin(
  user: { role: string; clerkId: string },
  ownerId: string,
): void {
  if (user.role !== "admin" && user.clerkId !== ownerId) {
    throw new Error("You can only change your own listings.");
  }
}
