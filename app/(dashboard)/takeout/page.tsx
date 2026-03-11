"use client";
import { useState } from "react";
import { useActiveOrders, useCreateOrder } from "@/lib/hooks/useOrders";
import { useRouter } from "next/navigation";
import { formatCurrency, formatRelative } from "@/lib/utils/format";
import { Plus, Package } from "lucide-react";

export default function TakeoutPage() {
  const { data: orders, isLoading } = useActiveOrders();
  const createOrder = useCreateOrder();
  const router = useRouter();
  const [showNew, setShowNew] = useState(false);
  const [customerName, setCustomerName] = useState("");

  const takeoutOrders = orders?.filter(o => o.orderType === "takeout") ?? [];

  async function handleCreate() {
    if (!customerName.trim()) return;
    const order = await createOrder.mutateAsync({ orderType: "takeout", customerName: customerName.trim() });
    setShowNew(false); setCustomerName("");
    router.push(`/orders/${order.id}`);
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Takeout Queue</h1>
          <p className="text-sm text-gray-500 mt-0.5">{takeoutOrders.length} active orders</p>
        </div>
        <button onClick={() => setShowNew(true)}
          className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 active:scale-95">
          <Plus size={16} /> New Takeout
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-gray-200 rounded-xl animate-pulse" />)}</div>
      ) : takeoutOrders.length === 0 ? (
        <div className="text-center py-20">
          <Package size={44} className="text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 font-medium">No active takeout orders</p>
          <p className="text-gray-400 text-sm mt-1">Tap "New Takeout" to create one</p>
        </div>
      ) : (
        <div className="space-y-3">
          {takeoutOrders.map(order => (
            <button key={order.id} onClick={() => router.push(`/orders/${order.id}`)}
              className="w-full text-left bg-white border border-purple-100 rounded-xl p-4 hover:border-purple-300 hover:shadow-sm transition-all active:scale-95">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-gray-900">#{order.orderNumber} · {order.customerName}</div>
                  <div className="text-sm text-gray-500">{formatRelative(order.openedAt)}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-gray-900">{formatCurrency(order.subtotal || "0")}</div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    order.status === "open" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}>
                    {order.status}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {showNew && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl">
            <h2 className="text-lg font-bold mb-4">New Takeout Order</h2>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Customer Name</label>
            <input autoFocus type="text" value={customerName}
              onChange={e => setCustomerName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleCreate()}
              placeholder="Enter customer name"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4" />
            <div className="flex gap-3">
              <button onClick={() => setShowNew(false)} className="flex-1 py-2.5 border rounded-xl font-medium text-gray-700 text-sm">Cancel</button>
              <button onClick={handleCreate} disabled={!customerName.trim() || createOrder.isPending}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-semibold text-sm disabled:opacity-50">
                {createOrder.isPending ? "Creating…" : "Create Order"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
