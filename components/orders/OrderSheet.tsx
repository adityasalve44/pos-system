"use client";
import { useState } from "react";
import {
  useOrder,
  useRemoveItem,
  useBillOrder,
  useUpdateItemQty,
} from "@/lib/hooks/useOrders";
import { formatCurrency } from "@/lib/utils/format";
import {
  Trash2,
  Receipt,
  Plus,
  Minus,
  AlertTriangle,
  Loader2,
} from "lucide-react";

interface Props {
  orderId: string;
  onBill: () => void;
}

export function OrderSheet({ orderId, onBill }: Props) {
  const { data: order, isLoading } = useOrder(orderId);
  const removeItem = useRemoveItem();
  const updateQty = useUpdateItemQty();
  const billOrder = useBillOrder();
  const [showBillConfirm, setShowBillConfirm] = useState(false);

  if (isLoading || !order)
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 size={22} className="animate-spin text-gray-300" />
      </div>
    );

  const items = order.items ?? [];
  const isBillable = order.status === "open" && items.length > 0;
  const isOpen = order.status === "open";
  const liveSubtotal = items.reduce((s, i) => s + parseFloat(i.lineTotal), 0);
  const tax = parseFloat(order.taxAmount || "0");
  const liveTotal = liveSubtotal + tax;

  async function confirmBill() {
    await billOrder.mutateAsync(orderId);
    setShowBillConfirm(false);
    onBill();
  }

  function adjustQty(itemId: string, current: number, delta: number) {
    const next = current + delta;
    if (next < 1) removeItem.mutate({ orderId, itemId });
    else updateQty.mutate({ orderId, itemId, quantity: next });
  }

  return (
    <div className="flex flex-col h-full">
      {/* Item list */}
      <div className="flex-1 overflow-y-auto space-y-1.5">
        {items.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <div className="text-3xl mb-2">🍽️</div>
            <p className="text-sm font-medium">No items yet</p>
            <p className="text-xs mt-1 text-gray-300">Tap a product to add</p>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-2 bg-white rounded-lg px-3 py-2.5 border border-gray-100 shadow-sm"
            >
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm text-gray-900 truncate">
                  {item.productName}
                </div>
                <div className="text-xs text-gray-400">
                  {formatCurrency(item.unitPrice)} each
                </div>
              </div>
              {isOpen ? (
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => adjustQty(item.id, item.quantity, -1)}
                    className="w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:border-red-300 hover:text-red-500 transition-colors active:scale-90"
                  >
                    <Minus size={11} />
                  </button>
                  <span className="w-6 text-center text-sm font-bold text-gray-900">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => adjustQty(item.id, item.quantity, 1)}
                    className="w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:border-green-300 hover:text-green-600 transition-colors active:scale-90"
                  >
                    <Plus size={11} />
                  </button>
                </div>
              ) : (
                <span className="text-xs text-gray-400 shrink-0 w-6 text-center">
                  ×{item.quantity}
                </span>
              )}
              <div className="text-sm font-semibold text-gray-900 w-14 text-right shrink-0">
                {formatCurrency(item.lineTotal)}
              </div>
              {isOpen && (
                <button
                  onClick={() =>
                    removeItem.mutate({ orderId, itemId: item.id })
                  }
                  disabled={removeItem.isPending}
                  className="text-gray-300 hover:text-red-400 transition-colors shrink-0 active:scale-90 ml-0.5"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Totals */}
      {items.length > 0 && (
        <div className="mt-3 rounded-xl bg-gray-50 border border-gray-100 p-3 space-y-1.5">
          <div className="flex justify-between text-sm text-gray-600">
            <span>
              Subtotal{" "}
              <span className="text-gray-400 text-xs">
                ({items.reduce((s, i) => s + i.quantity, 0)} items)
              </span>
            </span>
            <span className="font-medium">{formatCurrency(liveSubtotal)}</span>
          </div>
          {tax > 0 && (
            <div className="flex justify-between text-xs text-gray-500">
              <span>GST</span>
              <span>{formatCurrency(order.taxAmount)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-gray-900 border-t border-gray-200 pt-1.5">
            <span>Total</span>
            <span className="text-base" style={{ color: "var(--brand)" }}>
              {formatCurrency(liveTotal)}
            </span>
          </div>
        </div>
      )}

      {/* Generate Bill button */}
      {isBillable && (
        <button
          onClick={() => setShowBillConfirm(true)}
          disabled={billOrder.isPending}
          className="mt-3 w-full text-white py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 text-sm disabled:opacity-50 transition-all active:scale-95"
          style={{ background: "var(--brand)" }}
        >
          <Receipt size={15} />
          {billOrder.isPending ? "Generating…" : "Generate Bill"}
        </button>
      )}

      {/* Bill confirmation modal */}
      {showBillConfirm && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowBillConfirm(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-xs w-full shadow-2xl text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <AlertTriangle size={18} className="text-orange-500" />
            </div>
            <h3 className="font-bold text-gray-900 text-base mb-1">
              Generate Bill?
            </h3>
            <p className="text-sm text-gray-500 mb-1">
              Total:{" "}
              <span className="font-bold text-gray-900">
                {formatCurrency(liveTotal)}
              </span>
            </p>
            <p className="text-xs text-gray-400 mb-5">
              You won&apos;t be able to add or remove items after this.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowBillConfirm(false)}
                className="flex-1 py-2 border rounded-lg text-gray-700 font-medium text-sm hover:bg-gray-50"
              >
                Keep Editing
              </button>
              <button
                onClick={confirmBill}
                disabled={billOrder.isPending}
                className="flex-1 py-2 text-white rounded-lg font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-1"
                style={{ background: "var(--brand)" }}
              >
                {billOrder.isPending ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    Wait…
                  </>
                ) : (
                  "Confirm"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
