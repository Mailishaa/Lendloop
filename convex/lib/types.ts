import type { GenericFieldPaths } from "convex/server";

export type LendingDataModel = {
  users: {
    document: {
      clerkId: string;
      name: string;
      email: string;
      role: string;
      trustedLender: boolean;
    };
    fieldPaths: GenericFieldPaths;
    indexes: { by_clerkId: ["clerkId"] };
    searchIndexes: Record<string, never>;
    vectorIndexes: Record<string, never>;
  };
  tools: {
    document: {
      ownerId: string;
      name: string;
      category: string;
      condition: string;
      description: string;
      isAvailable: boolean;
    };
    fieldPaths: GenericFieldPaths;
    indexes: { by_owner: ["ownerId"]; by_category: ["category"] };
    searchIndexes: Record<string, never>;
    vectorIndexes: Record<string, never>;
  };
  loans: {
    document: {
      toolId: string;
      borrowerId: string;
      lenderId: string;
      startDate: string;
      endDate: string;
      status: string;
    };
    fieldPaths: GenericFieldPaths;
    indexes: { by_borrower: ["borrowerId"]; by_lender: ["lenderId"]; by_tool: ["toolId"]; by_status: ["status"] };
    searchIndexes: Record<string, never>;
    vectorIndexes: Record<string, never>;
  };
  reminders: {
    document: {
      loanId: string;
      key: string;
      status: string;
      detail?: string;
      sentAt: number;
    };
    fieldPaths: GenericFieldPaths;
    indexes: { by_key: ["key"]; by_loan: ["loanId"] };
    searchIndexes: Record<string, never>;
    vectorIndexes: Record<string, never>;
  };
};

export type DataModel = LendingDataModel;
