"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  useTables,
  useCreateTable,
  useUpdateTable,
  useDeleteTable,
} from "@/lib/hooks/useTables";
import { useCreateOrder, TableConflictError } from "@/lib/hooks/useOrders";
import { formatCurrency, formatRelative } from "@/lib/utils/format";
import { can } from "@/lib/rbac";
import {
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  Users,
  AlertTriangle,
} from "lucide-react";
import type { Table } from "@/types";

export default function TablesPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const role = session?.user?.role;

  const isAdmin = can(role, "tables_delete"); // admin only
  const canManage = can(role, "tables_create"); // admin + manager

  const { data: tables, isLoading, refetch } = useTables();
  const createOrder = useCreateOrder();
  const createTable = useCreateTable();
  const updateTable = useUpdateTable();
  const deleteTable = useDeleteTable();

  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Table | null>(null);
  const [form, setForm] = useState({ name: "", capacity: "4" });
  const [deleteTarget, setDeleteTarget] = useState<Table | null>(null);

  // ── Conflict banner state ────────────────────────────────────────────────
  const [conflict, setConflict] = useState<{
    orderId: string;
    orderNumber: number;
    tableName: string;
  } | null>(null);

  const available = tables?.filter((t) => t.status === "available").length ?? 0;
  const occupied = tables?.filter((t) => t.status === "occupied").length ?? 0;

  async function handleTableTap(table: Table) {
    if (table.status === "occupied" && table.activeOrder) {
      router.push(`/orders/${table.activeOrder.id}`);
      return;
    }
    if (table.status !== "available") return;

    try {
      const order = await createOrder.mutateAsync({
        tableId: table.id,
        orderType: "dine_in",
      });
      router.push(`/orders/${order.id}`);
    } catch (err) {
      if (err instanceof TableConflictError) {
        // Another user beat us to it — show a friendly banner with a redirect link
        setConflict({
          orderId: err.existingOrderId,
          orderNumber: err.orderNumber,
          tableName: table.name,
        });
      }
    }
  }

  async function saveTable() {
    if (!form.name.trim()) return;
    if (editTarget) {
      await updateTable.mutateAsync({
        id: editTarget.id,
        name: form.name,
        capacity: parseInt(form.capacity),
      });
    } else {
      await createTable.mutateAsync({
        name: form.name,
        capacity: parseInt(form.capacity),
      });
    }
    setShowForm(false);
    setEditTarget(null);
    setForm({ name: "", capacity: "4" });
  }

  function startEdit(t: Table, e: React.MouseEvent) {
    e.stopPropagation();
    setEditTarget(t);
    setForm({ name: t.name, capacity: String(t.capacity) });
    setShowForm(true);
  }

  const statusStyle: Record<string, string> = {
    available:
      "border-green-200 bg-green-50 hover:shadow-md hover:border-green-400",
    occupied:
      "border-orange-200 bg-orange-50 hover:shadow-md hover:border-orange-400",
    reserved: "border-yellow-200 bg-yellow-50 cursor-not-allowed opacity-75",
  };
  const dotColor: Record<string, string> = {
    available: "bg-green-400",
    occupied: "bg-orange-400",
    reserved: "bg-yellow-400",
  };

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      {/* ── Conflict banner ── */}
      {conflict && (
        <div className="mb-4 bg-orange-50 border border-orange-300 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle
            className="text-orange-500 shrink-0 mt-0.5"
            size={20}
          />
          <div className="flex-1">
            <p className="font-semibold text-orange-800 text-sm">
              &quot;{conflict.tableName}&quot; was just opened by another user
            </p>
            <p className="text-orange-700 text-xs mt-0.5">
              Order #{conflict.orderNumber} is already active on this table.
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => {
                setConflict(null);
                router.push(`/orders/${conflict.orderId}`);
              }}
              className="px-3 py-1.5 bg-orange-600 text-white rounded-lg text-xs font-semibold hover:bg-orange-700"
            >
              Open Order
            </button>
            <button
              onClick={() => setConflict(null)}
              className="px-3 py-1.5 border border-orange-300 text-orange-700 rounded-lg text-xs hover:bg-orange-100"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">
            Tables
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            <span className="text-green-600 font-medium">{available} free</span>
            {" · "}
            <span className="text-orange-600 font-medium">
              {occupied} occupied
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-400"
            title="Refresh"
          >
            <RefreshCw size={16} />
          </button>
          {canManage && (
            <button
              onClick={() => {
                setEditTarget(null);
                setForm({ name: "", capacity: "4" });
                setShowForm(true);
              }}
              className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 active:scale-95"
            >
              <Plus size={16} /> Add Table
            </button>
          )}
        </div>
      </div>

      {/* ── Table grid ── */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="h-28 bg-gray-200 rounded-xl animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {tables?.map((table) => (
            <div
              key={table.id}
              onClick={() =>
                table.status !== "reserved" &&
                !createOrder.isPending &&
                handleTableTap(table)
              }
              className={`relative border-2 rounded-xl p-3 transition-all select-none
                ${statusStyle[table.status]}
                ${table.status !== "reserved" ? "cursor-pointer active:scale-95" : ""}
                ${createOrder.isPending ? "pointer-events-none opacity-75" : ""}`}
            >
              {/* Admin/manager action buttons */}
              {canManage && (
                <div
                  className="absolute top-2 right-2 flex gap-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={(e) => startEdit(table, e)}
                    className="w-6 h-6 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-400 hover:text-blue-600 shadow-sm transition-colors"
                    title="Edit table"
                  >
                    <Pencil size={10} />
                  </button>
                  {isAdmin && table.status === "available" && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTarget(table);
                      }}
                      className="w-6 h-6 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 shadow-sm transition-colors"
                      title="Remove table"
                    >
                      <Trash2 size={10} />
                    </button>
                  )}
                </div>
              )}

              <div className="flex items-center gap-1.5 mb-1 pr-14">
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${dotColor[table.status]}`}
                />
                <span className="font-bold text-gray-900 text-sm truncate">
                  {table.name}
                </span>
              </div>
              <div className="flex items-center gap-1 text-gray-400 text-xs mb-1">
                <Users size={10} /> {table.capacity} seats
              </div>

              {table.activeOrder ? (
                <div className="mt-1 text-xs space-y-0.5">
                  <div className="font-semibold text-orange-700">
                    #{table.activeOrder.orderNumber}
                  </div>
                  <div className="text-gray-600">
                    {formatCurrency(table.activeOrder.subtotal || "0")}
                  </div>
                  <div className="text-gray-400 truncate">
                    {formatRelative(table.activeOrder.openedAt)}
                  </div>
                </div>
              ) : table.status === "available" ? (
                <div className="text-xs text-green-600 mt-1 font-medium">
                  Tap to open
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}

      {!isLoading && !tables?.length && (
        <div className="text-center py-20 text-gray-400">
          <div className="text-5xl mb-3">🪑</div>
          <p className="font-medium">No tables yet</p>
          {canManage && (
            <p className="text-sm mt-1">Click &quot;Add Table&quot; to get started</p>
          )}
        </div>
      )}

      {/* ── Add / Edit table modal ── */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl">
            <h2 className="text-lg font-bold mb-4">
              {editTarget ? "Edit Table" : "Add Table"}
            </h2>
            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Table Name
                </label>
                <input
                  autoFocus
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  onKeyDown={(e) => e.key === "Enter" && saveTable()}
                  placeholder="e.g. Table 1, VIP Room"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Seating Capacity
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={form.capacity}
                  onChange={(e) =>
                    setForm({ ...form, capacity: e.target.value })
                  }
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditTarget(null);
                }}
                className="flex-1 py-2.5 border rounded-xl text-gray-700 font-medium text-sm"
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
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-semibold text-sm disabled:opacity-50"
              >
                {editTarget ? "Save" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete confirm ── */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center">
            <div className="text-3xl mb-3">🗑️</div>
            <h3 className="font-bold text-gray-900 mb-2">
              Remove &quot;{deleteTarget.name}&quot;?
            </h3>
            <p className="text-sm text-gray-500 mb-5">
              Table will be hidden but order history is preserved.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 border rounded-xl text-gray-700 font-medium text-sm"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await deleteTable.mutateAsync(deleteTarget.id);
                  setDeleteTarget(null);
                }}
                disabled={deleteTable.isPending}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-semibold text-sm disabled:opacity-50"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
