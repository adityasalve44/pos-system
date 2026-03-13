"use client";
import { useState } from "react";
import {
  useTables,
  useCreateTable,
  useUpdateTable,
  useDeleteTable,
} from "@/lib/hooks/useTables";
import {
  Plus,
  Pencil,
  Trash2,
  Users,
  X,
  LayoutGrid,
  ArrowLeft,
  Loader2,
  Search,
  CheckCircle2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import type { Table } from "@/types";

export default function TablesManagementPage() {
  const router = useRouter();
  const { data: tables, isLoading } = useTables();
  const createTable = useCreateTable();
  const updateTable = useUpdateTable();
  const deleteTable = useDeleteTable();

  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Table | null>(null);
  const [form, setForm] = useState({ name: "", capacity: "4" });
  const [deleteTarget, setDeleteTarget] = useState<Table | null>(null);
  const [toast, setToast] = useState("");

  function flash(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  }

  function openCreate() {
    setEditTarget(null);
    setForm({ name: "", capacity: "4" });
    setShowForm(true);
  }
  function openEdit(t: Table) {
    setEditTarget(t);
    setForm({ name: t.name, capacity: String(t.capacity) });
    setShowForm(true);
  }

  async function saveTable() {
    if (!form.name.trim()) return;
    if (editTarget) {
      await updateTable.mutateAsync({
        id: editTarget.id,
        name: form.name,
        capacity: parseInt(form.capacity),
      });
      flash(`"${form.name}" updated`);
    } else {
      await createTable.mutateAsync({
        name: form.name,
        capacity: parseInt(form.capacity),
      });
      flash(`"${form.name}" created`);
    }
    setShowForm(false);
    setEditTarget(null);
    setForm({ name: "", capacity: "4" });
  }

  const filtered =
    tables?.filter(
      (t) =>
        !search.trim() || t.name.toLowerCase().includes(search.toLowerCase()),
    ) ?? [];

  const available = filtered.filter((t) => t.status === "available").length;
  const occupied = filtered.filter((t) => t.status === "occupied").length;

  const statusStyle = (status: string) =>
    ({
      available: {
        dot: "var(--available)",
        text: "text-emerald-600",
        bg: "bg-emerald-50 text-emerald-700",
      },
      occupied: {
        dot: "var(--occupied)",
        text: "text-amber-600",
        bg: "bg-amber-50 text-amber-700",
      },
      reserved: {
        dot: "#f59e0b",
        text: "text-yellow-600",
        bg: "bg-yellow-50 text-yellow-700",
      },
    })[status] ?? {
      dot: "#94a3b8",
      text: "text-gray-500",
      bg: "bg-gray-100 text-gray-500",
    };

  return (
    <div className="min-h-screen" style={{ background: "var(--app-bg)" }}>
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-gray-900 text-white px-4 py-2.5 rounded-xl shadow-lg text-sm font-medium animate-in fade-in">
          <CheckCircle2 size={14} className="text-emerald-400" /> {toast}
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b px-4 md:px-6 py-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => router.push("/settings")}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 transition-colors shrink-0"
            >
              <ArrowLeft size={16} />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold text-gray-900">
                Table Management
              </h1>
              <p className="text-sm text-gray-400">
                <span className="text-emerald-600 font-medium">
                  {available} available
                </span>
                {" · "}
                <span className="text-amber-600 font-medium">
                  {occupied} occupied
                </span>
                {" · "}
                <span>{filtered.length} total</span>
              </p>
            </div>
            <button
              onClick={openCreate}
              className="flex items-center gap-1.5 text-white px-3 py-2 rounded-xl text-sm font-semibold active:scale-95 transition-all shrink-0"
              style={{ background: "var(--brand)" }}
            >
              <Plus size={14} /> Add Table
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tables…"
              className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:border-transparent"
              style={
                { "--tw-ring-color": "var(--brand)" } as React.CSSProperties
              }
            />
          </div>
        </div>
      </div>

      {/* Table list */}
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-5">
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-16 bg-white rounded-xl animate-pulse border"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <LayoutGrid size={24} className="text-gray-300" />
            </div>
            <p className="font-medium text-gray-500 text-sm">
              {search ? "No tables match your search" : "No tables yet"}
            </p>
            {!search && (
              <p className="text-gray-400 text-xs mt-1">
                Click &quot;Add Table&quot; to get started
              </p>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl border overflow-hidden divide-y">
            {filtered.map((table) => {
              const style = statusStyle(table.status);
              return (
                <div
                  key={table.id}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50/60 transition-colors group"
                >
                  {/* Status dot + icon */}
                  <div className="relative shrink-0">
                    <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center border border-gray-100">
                      <LayoutGrid size={16} className="text-gray-400" />
                    </div>
                    <span
                      className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white"
                      style={{ background: style.dot }}
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900 text-sm">
                        {table.name}
                      </span>
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${style.bg}`}
                      >
                        {table.status}
                      </span>
                      {table.activeOrder && (
                        <span className="text-[11px] text-gray-400">
                          Order #{table.activeOrder.orderNumber}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                      <Users size={10} /> {table.capacity} seats
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => openEdit(table)}
                      className="p-2 rounded-xl text-gray-300 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                      title="Edit"
                    >
                      <Pencil size={14} />
                    </button>
                    {table.status === "available" ? (
                      <button
                        onClick={() => setDeleteTarget(table)}
                        className="p-2 rounded-xl text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    ) : (
                      <div className="w-9 h-9" /> /* spacer to keep alignment */
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add / Edit modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b">
              <h2 className="text-base font-bold text-gray-900">
                {editTarget ? `Edit "${editTarget.name}"` : "Add New Table"}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditTarget(null);
                }}
                className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400"
              >
                <X size={15} />
              </button>
            </div>
            <div className="px-5 py-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                  Table Name
                </label>
                <input
                  autoFocus
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  onKeyDown={(e) => e.key === "Enter" && saveTable()}
                  placeholder="e.g. Table 1, Rooftop, VIP Room"
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:border-transparent"
                  style={
                    { "--tw-ring-color": "var(--brand)" } as React.CSSProperties
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                  Seating Capacity
                </label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        capacity: String(Math.max(1, parseInt(f.capacity) - 1)),
                      }))
                    }
                    className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:border-gray-300 active:scale-90"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={form.capacity}
                    onChange={(e) =>
                      setForm({ ...form, capacity: e.target.value })
                    }
                    className="flex-1 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-center font-semibold focus:outline-none focus:ring-2 focus:border-transparent"
                    style={
                      {
                        "--tw-ring-color": "var(--brand)",
                      } as React.CSSProperties
                    }
                  />
                  <button
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        capacity: String(
                          Math.min(50, parseInt(f.capacity) + 1),
                        ),
                      }))
                    }
                    className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:border-gray-300 active:scale-90"
                  >
                    +
                  </button>
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditTarget(null);
                  }}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-700 font-medium text-sm hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={saveTable}
                  disabled={
                    !form.name.trim() ||
                    createTable.isPending ||
                    updateTable.isPending
                  }
                  className="flex-1 py-2.5 text-white rounded-xl font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                  style={{ background: "var(--brand)" }}
                >
                  {createTable.isPending || updateTable.isPending ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      Saving…
                    </>
                  ) : editTarget ? (
                    "Save Changes"
                  ) : (
                    "Create Table"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-xs w-full shadow-2xl text-center">
            <div className="w-11 h-11 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Trash2 size={18} className="text-red-600" />
            </div>
            <h3 className="font-bold text-gray-900 text-base mb-1">
              Remove &quot;{deleteTarget.name}&quot;?
            </h3>
            <p className="text-sm text-gray-400 mb-5">
              Order history is preserved. This can&apos;t be undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2 border rounded-lg text-gray-700 font-medium text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await deleteTable.mutateAsync(deleteTarget.id);
                  flash(`"${deleteTarget.name}" removed`);
                  setDeleteTarget(null);
                }}
                disabled={deleteTable.isPending}
                className="flex-1 py-2 bg-red-600 text-white rounded-lg font-semibold text-sm hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {deleteTable.isPending ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />…
                  </>
                ) : (
                  "Remove"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
