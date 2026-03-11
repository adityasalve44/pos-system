"use client";
import { useOrder, useRemoveItem, useBillOrder, useUpdateItemQty } from "@/lib/hooks/useOrders";
import { formatCurrency } from "@/lib/utils/format";
import { Trash2, Receipt, Plus, Minus } from "lucide-react";

interface Props { orderId: string; onBill: () => void; }

export function OrderSheet({ orderId, onBill }: Props) {
  const { data: order, isLoading } = useOrder(orderId);
  const removeItem = useRemoveItem();
  const updateQty = useUpdateItemQty();
  const billOrder = useBillOrder();

  if (isLoading || !order) return (
    <div className="flex items-center justify-center h-32">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
    </div>
  );

  const items = order.items ?? [];
  const isBillable = order.status === "open" && items.length > 0;
  const isOpen = order.status === "open";

  // Fix 3: always compute live subtotal from items on the client
  const liveSubtotal = items.reduce((s, i) => s + parseFloat(i.lineTotal), 0);

  async function handleBill() { await billOrder.mutateAsync(orderId); onBill(); }

  function adjustQty(itemId: string, current: number, delta: number) {
    const next = current + delta;
    if (next < 1) {
      removeItem.mutate({ orderId, itemId });
    } else {
      updateQty.mutate({ orderId, itemId, quantity: next });
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-2">
        {items.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <div className="text-3xl mb-2">🍽️</div>
            <p className="text-sm">No items yet</p>
            <p className="text-xs mt-1">Tap a product on the left to add</p>
          </div>
        ) : items.map((item) => (
          <div key={item.id} className="flex items-center gap-2 bg-white rounded-xl p-3 shadow-sm border border-gray-100">
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm text-gray-900 truncate">{item.productName}</div>
              <div className="text-xs text-gray-400">{formatCurrency(item.unitPrice)} each</div>
            </div>
            {isOpen ? (
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => adjustQty(item.id, item.quantity, -1)}
                  className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:border-red-300 hover:text-red-500 transition-colors active:scale-90">
                  <Minus size={12} />
                </button>
                <span className="w-7 text-center text-sm font-bold">{item.quantity}</span>
                <button onClick={() => adjustQty(item.id, item.quantity, 1)}
                  className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:border-green-300 hover:text-green-600 transition-colors active:scale-90">
                  <Plus size={12} />
                </button>
              </div>
            ) : (
              <span className="text-xs text-gray-400 shrink-0">×{item.quantity}</span>
            )}
            <div className="text-sm font-bold text-gray-900 w-16 text-right shrink-0">{formatCurrency(item.lineTotal)}</div>
            {isOpen && (
              <button onClick={() => removeItem.mutate({ orderId, itemId: item.id })} disabled={removeItem.isPending}
                className="text-gray-300 hover:text-red-500 transition-colors shrink-0 active:scale-90">
                <Trash2 size={14} />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Fix 3: live totals always visible */}
      {items.length > 0 && (
        <div className="border-t pt-3 mt-3 space-y-1.5 bg-gray-50 rounded-xl p-3">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} items)</span>
            <span className="font-medium">{formatCurrency(liveSubtotal)}</span>
          </div>
          {parseFloat(order.taxAmount || "0") > 0 && (
            <div className="flex justify-between text-xs text-gray-500">
              <span>GST</span>
              <span>{formatCurrency(order.taxAmount)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-gray-900 border-t border-gray-200 pt-1.5">
            <span>Total</span>
            <span className="text-blue-600 text-base">{formatCurrency(parseFloat(order.taxAmount || "0") > 0
              ? (liveSubtotal + parseFloat(order.taxAmount || "0")).toFixed(2)
              : liveSubtotal)}</span>
          </div>
        </div>
      )}

      {isBillable && (
        <button onClick={handleBill} disabled={billOrder.isPending}
          className="mt-3 w-full bg-blue-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-blue-700 disabled:opacity-50 transition-colors active:scale-95">
          <Receipt size={18} />
          {billOrder.isPending ? "Calculating..." : "Generate Bill"}
        </button>
      )}
    </div>
  );
}
