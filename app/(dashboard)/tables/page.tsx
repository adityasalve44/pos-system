"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useTables } from "@/lib/hooks/useTables";
import { useCreateOrder, TableConflictError } from "@/lib/hooks/useOrders";
import { formatCurrency, formatRelative } from "@/lib/utils/format";
import { RefreshCw, Users, AlertTriangle, Loader2 } from "lucide-react";
import type { Table } from "@/types";

export default function TablesPage() {
  const router = useRouter();
  const { data: session } = useSession();
  void session;

  const { data: tables, isLoading, refetch, isFetching } = useTables();
  const createOrder = useCreateOrder();
  const [openingTableId, setOpeningTableId] = useState<string | null>(null);
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
    setOpeningTableId(table.id);
    try {
      const order = await createOrder.mutateAsync({
        tableId: table.id,
        orderType: "dine_in",
      });
      router.push(`/orders/${order.id}`);
    } catch (err) {
      setOpeningTableId(null);
      if (err instanceof TableConflictError)
        setConflict({
          orderId: err.existingOrderId,
          orderNumber: err.orderNumber,
          tableName: table.name,
        });
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      {/* Conflict banner */}
      {conflict && (
        <div className="mb-4 bg-amber-50 border-none border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={18} />
          <div className="flex-1">
            <p className="font-semibold text-amber-800 text-sm">
              &quot;{conflict.tableName}&quot; was just opened by another user
            </p>
            <p className="text-amber-600 text-xs mt-0.5">
              Order #{conflict.orderNumber} is already active on this table.
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => {
                setConflict(null);
                router.push(`/orders/${conflict.orderId}`);
              }}
              className="px-3 py-1.5 text-white rounded-lg text-xs font-semibold"
              style={{ background: "var(--sidebar-active)" }}
            >
              Open Order
            </button>
            <button
              onClick={() => setConflict(null)}
              className="px-3 py-1.5 border border-amber-200 text-amber-700 rounded-lg text-xs hover:bg-amber-100"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">
            Tables
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            <span className="font-medium" style={{ color: "var(--available)" }}>
              {available} free
            </span>
            {" · "}
            <span className="font-medium" style={{ color: "var(--occupied)" }}>
              {occupied} occupied
            </span>
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="p-2 rounded-full shadow-card hover:bg-gray-100 text-gray-400 disabled:opacity-50 transition-colors"
          title="Refresh"
        >
          <RefreshCw size={16} className={isFetching ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Grid */}
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
          {tables?.map((table) => {
            const isOpening = openingTableId === table.id;
            const isOccupied = table.status === "occupied";
            const isAvailable = table.status === "available";
            return (
              <div
                key={table.id}
                onClick={() =>
                  table.status !== "reserved" &&
                  !isOpening &&
                  handleTableTap(table)
                }
                className={`relative shadow-card rounded-xl p-3 border-none transition-all select-none h-28
                  ${table.status !== "reserved" ? "cursor-pointer active:scale-95" : "opacity-60 cursor-not-allowed"}
                  ${isOpening ? "pointer-events-none opacity-75" : ""}`}
                style={
                  isAvailable
                    ? {
                        borderColor: "var(--available-border)",
                        background: "var(--available-bg)",
                      }
                    : isOccupied
                      ? {
                          borderColor: "var(--occupied-border)",
                          background: "var(--occupied-bg)",
                        }
                      : { borderColor: "#fde68a", background: "#fefce8" }
                }
              >
                {isOpening && (
                  <div className="absolute  inset-0 flex items-center justify-center rounded-xl bg-white/70 backdrop-blur-sm z-10">
                    <Loader2
                      size={20}
                      className="animate-spin"
                      style={{ color: "var(--brand)" }}
                    />
                  </div>
                )}

                {/* Status dot + name */}
                <div className="flex items-center  gap-1.5 mb-1">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{
                      background: isAvailable
                        ? "var(--available)"
                        : isOccupied
                          ? "var(--occupied)"
                          : "#f59e0b",
                    }}
                  />
                  <span className="font-medium text-gray-800  text-sm truncate">
                    {table.name}
                  </span>
                </div>

                <div className="absolute bottom-2 right-2 shadow-sm bg-gray-50 text-slate-700 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                  <Users size={10} /> {table.capacity}
                </div>

                {table.activeOrder ? (
                  <div className="text-xs space-y-0.5">
                    <div
                      className="font-semibold"
                      style={{ color: "var(--occupied)" }}
                    >
                      #{table.activeOrder.orderNumber}
                    </div>
                    <div className="text-gray-600">
                      {formatCurrency(table.activeOrder.subtotal || "0")}
                    </div>
                    <div className="text-gray-400 truncate">
                      {formatRelative(table.activeOrder.openedAt)}
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}

      {!isLoading && !tables?.length && (
        <div className="text-center py-20 text-gray-400">
          <div className="text-5xl mb-3">🪑</div>
          <p className="font-medium">No tables configured</p>
          <p className="text-sm mt-1">Add tables in Settings → Tables</p>
        </div>
      )}
    </div>
  );
}
