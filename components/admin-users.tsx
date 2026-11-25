"use client";

import { useMemo } from "react";
import { useMutation, useQueries } from "convex/react";
import { anyApi } from "convex/server";

type UserView = {
  _id: string;
  clerkId: string;
  name: string;
  email: string;
  role: string;
  trustedLender: boolean;
};

export function AdminUsers() {
  const queries = useMemo(
    () => ({ users: { query: anyApi.users.listUsers, args: {} } }),
    [],
  );
  const result = useQueries(queries);
  const users = result.users;
  const setTrustedLender = useMutation(anyApi.users.setTrustedLender);

  const list = (users instanceof Error ? [] : users) as UserView[];

  if (users === undefined) {
    return <p>Loading users…</p>;
  }
  if (users instanceof Error) {
    return <p>Could not load users.</p>;
  }

  async function onToggleTrust(userId: string, trusted: boolean) {
    await setTrustedLender({ userId, trusted });
  }

  if (list.length === 0) {
    return <p>No users yet.</p>;
  }

  return (
    <ul className="mt-4 grid gap-2">
      {list.map((user) => (
        <li
          key={user._id}
          className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:shadow-md"
        >
          <span className="text-sm text-zinc-700">
            {user.name} · {user.email} ·{" "}
            <span className="text-zinc-500">{user.role}</span>
          </span>
          {user.role !== "admin" && (
            <button
              className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-700 transition hover:bg-zinc-50"
              onClick={() => onToggleTrust(user._id, !user.trustedLender)}
            >
              {user.trustedLender ? "Remove trust" : "Mark trusted lender"}
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
