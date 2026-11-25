"use client";

import { useMutation, useQueries } from "convex/react";
import { anyApi } from "convex/server";
import { useMemo, useState } from "react";

type ToolView = {
  _id: string;
  ownerId: string;
  name: string;
  category: string;
  condition: string;
  description: string;
  isAvailable: boolean;
  ownerName: string | null;
  trustedLender: boolean;
};

export function BrowseTools() {
  const queries = useMemo(
    () => ({ tools: { query: anyApi.tools.list, args: {} } }),
    [],
  );
  const result = useQueries(queries);
  const tools = result.tools;
  const request = useMutation(anyApi.loans.request);

  const list = (tools instanceof Error || tools === undefined ? [] : tools) as ToolView[];
  const available = list.filter((t) => t.isAvailable);

  const [selectedTool, setSelectedTool] = useState<ToolView | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  async function onRequest() {
    if (!selectedTool) return;
    await request({
      toolId: selectedTool._id,
      startDate,
      endDate,
    });
    setSelectedTool(null);
    setStartDate("");
    setEndDate("");
  }

  return (
    <div className="mt-4">
      <h2 className="font-semibold">Available tools</h2>
      <ul className="mt-3 grid gap-2">
        {available.map((tool) => (
          <li
            key={tool._id}
            className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:shadow-md"
          >
            <span className="text-sm text-zinc-700">
              {tool.name} · {tool.category} · {tool.condition} · by{" "}
              {tool.ownerName}
            </span>
            <button
              className="rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-700"
              onClick={() => setSelectedTool(tool)}
            >
              Request
            </button>
          </li>
        ))}
      </ul>
      {selectedTool && (
        <form
          className="mt-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm"
          onSubmit={async (e) => {
            e.preventDefault();
            await onRequest();
          }}
        >
          <p className="font-semibold text-zinc-900">Request {selectedTool.name}</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <input
              type="date"
              className="rounded-lg border border-zinc-300 bg-white p-2 text-sm focus:border-zinc-500 focus:outline-none"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <input
              type="date"
              className="rounded-lg border border-zinc-300 bg-white p-2 text-sm focus:border-zinc-500 focus:outline-none"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="mt-3 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-700"
          >
            Send request
          </button>
        </form>
      )}
    </div>
  );
}
