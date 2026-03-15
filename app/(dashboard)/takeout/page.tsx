"use client";
import { useState } from "react";
import { useActiveOrders, useCreateOrder } from "@/lib/hooks/useOrders";
import { useRouter } from "next/navigation";
import { formatCurrency, formatRelative } from "@/lib/utils/format";
import { Plus, Package, Clock, ChevronRight, Loader2 } from "lucide-react";

export default function TakeoutPage() {
  const { data: orders, isLoading } = useActiveOrders();
  const createOrder = useCreateOrder();
  const router = useRouter();
  const [showNew, setShowNew] = useState(false);
  const [customerName, setCustomerName] = useState("");

  const takeoutOrders = orders?.filter((o) => o.orderType === "takeout") ?? [];

  async function handleCreate() {
    if (!customerName.trim()) return;
    const order = await createOrder.mutateAsync({
      orderType: "takeout",
      customerName: customerName.trim(),
    });
    setShowNew(false);
    setCustomerName("");
    router.push(`/orders/${order.id}`);
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">
            Takeout
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {takeoutOrders.length} active order
            {takeoutOrders.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="flex items-center gap-1.5 text-white px-3 py-2 rounded-xl text-sm font-medium active:scale-95 transition-all"
          style={{ background: "var(--brand)" }}
        >
          <Plus size={15} /> New Order
        </button>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-20 bg-gray-200 rounded-xl animate-pulse"
            />
          ))}
        </div>
      ) : takeoutOrders.length === 0 ? (
        <div className="text-center py-24">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Package size={28} className="text-gray-300" />
          </div>
          <p className="text-gray-500 font-medium">No active takeout orders</p>
          <p className="text-gray-400 text-sm mt-1">
            Tap &quot;New Order&quot; to create one
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {takeoutOrders.map((order) => (
            <button
              key={order.id}
              onClick={() => router.push(`/orders/${order.id}`)}
              className="w-full text-left bg-white border border-gray-200 rounded-xl p-4 hover:border-sky-200 hover:shadow-sm transition-all active:scale-[0.99] group"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: "var(--brand-light)" }}
                >
                  <Package size={17} style={{ color: "var(--brand)" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900 text-sm">
                      #{order.orderNumber}
                    </span>
                    <span className="text-gray-600 text-sm truncate">
                      {order.customerName}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                    <Clock size={10} /> {formatRelative(order.openedAt)}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-bold text-gray-900 text-sm">
                    {formatCurrency(order.subtotal || "0")}
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      order.status === "open"
                        ? "bg-green-100 text-green-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {order.status}
                  </span>
                </div>
                <ChevronRight
                  size={16}
                  className="text-gray-300 group-hover:text-gray-400 shrink-0 transition-colors"
                />
              </div>
            </button>
          ))}
        </div>
      )}

      {/* New order modal */}
      {showNew && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-5">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "var(--brand-light)" }}
              >
                <Package size={18} style={{ color: "var(--brand)" }} />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900">
                  New Takeout Order
                </h2>
                <p className="text-xs text-gray-400">
                  Enter customer name to begin
                </p>
              </div>
            </div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Customer Name
            </label>
            <input
              autoFocus
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              placeholder="e.g. Rahul Sharma"
              className="input mb-5"
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowNew(false);
                  setCustomerName("");
                }}
                className="flex-1 py-2.5 border rounded-xl font-medium text-gray-700 text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!customerName.trim() || createOrder.isPending}
                className="flex-1 py-2.5 text-white rounded-xl font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-1.5"
                style={{ background: "var(--brand)" }}
              >
                {createOrder.isPending ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Creating…
                  </>
                ) : (
                  "Create Order"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
