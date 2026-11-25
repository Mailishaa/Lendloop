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

const categories = [
  "power tools",
  "hand tools",
  "garden",
  "kitchen",
  "camping",
  "cleaning",
  "other",
];
const conditions = ["excellent", "good", "fair", "poor"];

export function MyTools() {
  const queries = useMemo(
    () => ({ myTools: { query: anyApi.tools.listMine, args: {} } }),
    [],
  );
  const result = useQueries(queries);
  const tools = result.myTools;
  const remove = useMutation(anyApi.tools.remove);
  const create = useMutation(anyApi.tools.create);
  const update = useMutation(anyApi.tools.update);

  const list = (tools instanceof Error ? [] : tools) as ToolView[];

  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState(categories[0]);
  const [condition, setCondition] = useState(conditions[0]);
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  function startEdit(tool: ToolView) {
    setEditingId(tool._id);
    setName(tool.name);
    setCategory(tool.category);
    setCondition(tool.condition);
    setDescription(tool.description);
    setError("");
  }

  function resetForm() {
    setEditingId(null);
    setName("");
    setCategory(categories[0]);
    setCondition(conditions[0]);
    setDescription("");
  }

  async function onCreate() {
    await create({ name, category, condition, description });
    resetForm();
  }

  async function onUpdate() {
    if (!editingId) return;
    await update({
      toolId: editingId,
      name,
      category,
      condition,
      description,
    });
    resetForm();
  }

  async function onRemove(toolId: string) {
    setError("");
    try {
      await remove({ toolId });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      if (editingId) await onUpdate();
      else await onCreate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  if (tools === undefined) {
    return <p>Loading tools…</p>;
  }
  if (tools instanceof Error) {
    return <p>Could not load your tools.</p>;
  }

  return (
    <div className="mt-4">
      <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-zinc-900">
          {editingId ? "Edit tool" : "Add a tool"}
        </h2>
        <form onSubmit={onSubmit}>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <input
              className="rounded-lg border border-zinc-300 bg-white p-2 text-sm focus:border-zinc-500 focus:outline-none"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={2}
              maxLength={80}
            />
            <select
              className="rounded-lg border border-zinc-300 bg-white p-2 text-sm focus:border-zinc-500 focus:outline-none"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <select
              className="rounded-lg border border-zinc-300 bg-white p-2 text-sm focus:border-zinc-500 focus:outline-none"
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
            >
              {conditions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <input
              className="rounded-lg border border-zinc-300 bg-white p-2 text-sm focus:border-zinc-500 focus:outline-none"
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={300}
            />
          </div>
          <div className="mt-3 flex gap-2">
            <button
              type="submit"
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-700"
            >
              {editingId ? "Save changes" : "Create tool"}
            </button>
            {editingId && (
              <button
                type="button"
                className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-700 transition hover:bg-zinc-50"
                onClick={resetForm}
              >
                Cancel
              </button>
            )}
          </div>
          {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
        </form>
      </div>
      <ul className="mt-6 grid gap-2">
        {list.map((tool) => (
          <li
            key={tool._id}
            className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:shadow-md"
          >
            <span className="text-sm text-zinc-700">
              {tool.name} · {tool.category} · {tool.condition}
            </span>
            <span className="flex gap-2">
              <button
                className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-700 transition hover:bg-zinc-50"
                onClick={() => startEdit(tool)}
              >
                Edit
              </button>
              <button
                className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-sm text-red-700 transition hover:bg-red-50"
                onClick={() => onRemove(tool._id)}
              >
                Remove
              </button>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}