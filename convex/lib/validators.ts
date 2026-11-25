import { v } from "convex/values";
import { categories } from "./categories";

export const categoryValidator = v.union(...categories.map((c) => v.literal(c)));

export const conditionValidator = v.union(
  v.literal("excellent"),
  v.literal("good"),
  v.literal("fair"),
  v.literal("poor"),
);

export const loanStatusValidator = v.union(
  v.literal("pending"),
  v.literal("approved"),
  v.literal("declined"),
  v.literal("returned"),
);

export const userRoleValidator = v.union(v.literal("admin"), v.literal("user"));
