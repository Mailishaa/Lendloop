"use client";

import { useMemo } from "react";
import { useQueries } from "convex/react";
import { anyApi } from "convex/server";

export function PublicTools() {
  const queries = useMemo(
    () => ({ availableTools: { query: anyApi.tools.listPublic, args: {} } }),
    [],
  );
  const result = useQueries(queries);
  const tools = result.availableTools;
  if (tools === undefined) {
    return <p className="mt-6 text-sm text-zinc-500">Loading tools…</p>;
  }
  if (tools instanceof Error) {
    return <p className="mt-6 text-sm text-red-600">Could not load the tool list right now.</p>;
  }
  const list = tools as Array<{ name: string; category: string }>;
  if (list.length === 0) {
    return <p className="mt-6 text-sm text-zinc-500">No tools available right now.</p>;
  }
  return (
    <ul className="mt-8 grid w-full max-w-md gap-2">
      {list.map((tool) => (
        <li
          key={`${tool.name}-${tool.category}`}
          className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:shadow-md"
        >
          <p className="font-medium text-zinc-900">{tool.name}</p>
          <p className="text-sm text-zinc-500">{tool.category}</p>
        </li>
      ))}
    </ul>
  );
}
