import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    name: v.string(),
    email: v.string(),
    role: v.string(),
    trustedLender: v.boolean(),
  }).index("by_clerkId", ["clerkId"]),
  tools: defineTable({
    ownerId: v.string(),
    name: v.string(),
    category: v.string(),
    condition: v.string(),
    description: v.string(),
    isAvailable: v.boolean(),
  })
    .index("by_owner", ["ownerId"])
    .index("by_category", ["category"]),
  loans: defineTable({
    toolId: v.string(),
    borrowerId: v.string(),
    lenderId: v.string(),
    startDate: v.string(),
    endDate: v.string(),
    status: v.string(),
  })
    .index("by_borrower", ["borrowerId"])
    .index("by_lender", ["lenderId"])
    .index("by_tool", ["toolId"])
    .index("by_status", ["status"]),
  reminders: defineTable({
    loanId: v.string(),
    key: v.string(),
    status: v.string(),
    detail: v.optional(v.string()),
    sentAt: v.number(),
  })
    .index("by_key", ["key"])
    .index("by_loan", ["loanId"]),
});
