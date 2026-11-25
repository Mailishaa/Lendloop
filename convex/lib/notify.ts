import { makeFunctionReference, type FunctionReference } from "convex/server";

export const notifyLoanRef = makeFunctionReference<
  "action",
  { loanId: string; event: string; attempt: number }
>("automation:notify") as unknown as FunctionReference<
  "action",
  "internal",
  { loanId: string; event: string; attempt: number }
>;