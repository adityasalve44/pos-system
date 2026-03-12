"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useOrder, useCancelOrder, useAddItem } from "@/lib/hooks/useOrders";
import { ProductGrid } from "@/components/products/ProductGrid";
import { OrderSheet } from "@/components/orders/OrderSheet";
import { PaymentModal } from "@/components/billing/PaymentModal";
import { ReceiptView } from "@/components/billing/ReceiptView";
import { formatCurrency } from "@/lib/utils/format";
import { can } from "@/lib/rbac";
import { ArrowLeft, X, Printer } from "lucide-react";
import type { Product } from "@/types";

export default function OrderPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session } = useSession();
  const role = session?.user?.role;

  const { data: order, isLoading } = useOrder(id);
  const addItem = useAddItem();
  const cancelOrder = useCancelOrder();

  const [view, setView] = useState<"order" | "pay" | "receipt">("order");
  const [showCancel, setShowCancel] = useState(false);
  const [showBackConfirm, setShowBackConfirm] = useState(false);

  const canCancel = can(role, "orders_cancel");

  if (isLoading)
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  if (!order)
    return (
      <div className="text-center p-12">
        <p className="text-gray-500">Order not found</p>
        <button
          onClick={() => router.push("/tables")}
          className="mt-4 text-blue-600 underline"
        >
          ← Tables
        </button>
      </div>
    );

  const items = order.items ?? [];
  const isPaid = order.status === "paid";
  const isBilled = order.status === "billed";
  const isOpen = order.status === "open";

  function handleBack() {
    if (isOpen && items.length > 0) {
      setShowBackConfirm(true);
      return;
    }
    if (isOpen && items.length === 0) {
      cancelOrder.mutateAsync(id).then(() => router.push("/tables"));
      return;
    }
    router.push("/tables");
  }

  async function handleCancelOrder() {
    await cancelOrder.mutateAsync(id);
    router.push("/tables");
  }
  async function handleAddItem(product: Product) {
    await addItem.mutateAsync({ orderId: id, productId: product.id });
  }

  const title =
    order.orderType === "takeout"
      ? `Takeout — ${order.customerName}`
      : `Order #${order.orderNumber}`;

  return (
    <div className="flex flex-col md:flex-row h-[calc(100dvh-3.5rem)] md:h-screen overflow-hidden">
      {/* ── Left: product grid ── */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-2 border-b bg-white sticky top-0 z-10 shrink-0">
          <button
            onClick={handleBack}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-600 active:scale-90"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-semibold text-gray-900 text-sm truncate">
                {title}
              </h1>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
                  isOpen
                    ? "bg-green-100 text-green-700"
                    : isBilled
                      ? "bg-orange-100 text-orange-700"
                      : isPaid
                        ? "bg-blue-100 text-blue-700"
                        : "bg-gray-100 text-gray-500"
                }`}
              >
                {order.status}
              </span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
                  order.orderType === "takeout"
                    ? "bg-purple-100 text-purple-700"
                    : "bg-teal-100 text-teal-700"
                }`}
              >
                {order.orderType === "takeout" ? "Takeout" : "Dine In"}
              </span>
            </div>
          </div>
          {/* Cancel button — only admin/manager */}
          {isOpen && canCancel && (
            <button
              onClick={() => setShowCancel(true)}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500"
            >
              <X size={18} />
            </button>
          )}
          {isPaid && (
            <button
              onClick={() =>
                setView((v) => (v === "receipt" ? "order" : "receipt"))
              }
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500"
            >
              <Printer size={18} />
            </button>
          )}
        </div>

        {isOpen && (
          <div className="flex-1 overflow-y-auto p-3">
            <ProductGrid
              onAddItem={handleAddItem}
              loading={addItem.isPending}
            />
          </div>
        )}

        {isBilled && view !== "pay" && (
          <div className="flex-1 flex items-center justify-center p-6 text-center">
            <div>
              <div className="text-5xl mb-3">🧾</div>
              <div className="text-xl font-bold text-gray-900 mb-1">
                Bill Generated
              </div>
              <div className="text-3xl font-bold text-blue-600 mb-3">
                {formatCurrency(order.totalAmount)}
              </div>
              <p className="text-sm text-gray-500">
                Collect payment using the panel →
              </p>
            </div>
          </div>
        )}

        {isPaid && view === "receipt" && (
          <div className="flex-1 overflow-y-auto p-4">
            <ReceiptView order={order} />
          </div>
        )}
      </div>

      {/* ── Right: order summary ── */}
      <div className="w-full md:w-80 lg:w-96 border-t md:border-t-0 md:border-l bg-gray-50 flex flex-col max-h-[45vh] md:max-h-none shrink-0">
        <div className="px-4 py-3 border-b bg-white shrink-0 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900 text-sm">
            Order · {items.length} item{items.length !== 1 ? "s" : ""}
          </h2>
          {isOpen && items.length > 0 && (
            <span className="text-xs text-gray-400">−/+ to adjust</span>
          )}
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          <OrderSheet orderId={id} onBill={() => setView("receipt")} />
        </div>

        {isBilled && (
          <div className="p-4 border-t bg-white shrink-0 space-y-2">
            <div className="text-center mb-1">
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(order.totalAmount)}
              </div>
              <div className="text-xs text-gray-500">Ready to collect</div>
            </div>
            <button
              onClick={() => setView("pay")}
              className="w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 text-sm active:scale-95"
            >
              💳 Collect Payment
            </button>
          </div>
        )}

        {isPaid && (
          <div className="p-4 border-t bg-white shrink-0 space-y-2">
            <div className="flex items-center justify-center gap-2 text-green-600 font-bold text-sm mb-1">
              <span>✓</span> Payment Received
            </div>
            <button
              onClick={() =>
                setView((v) => (v === "receipt" ? "order" : "receipt"))
              }
              className="w-full border border-gray-300 text-gray-700 py-2.5 rounded-xl font-medium text-sm hover:bg-gray-50 flex items-center justify-center gap-2 active:scale-95"
            >
              <Printer size={15} />{" "}
              {view === "receipt" ? "Hide Receipt" : "Print Receipt"}
            </button>
            <button
              onClick={() => router.push("/tables")}
              className="w-full bg-gray-800 text-white py-2.5 rounded-xl font-medium text-sm active:scale-95"
            >
              ← Back to Tables
            </button>
          </div>
        )}
      </div>

      {/* Payment modal */}
      {view === "pay" && isBilled && (
        <PaymentModal
          orderId={id}
          onClose={() => setView("order")}
          onPaid={() => setView("receipt")}
        />
      )}

      {/* Cancel confirm */}
      {showCancel && (
        <Modal onClose={() => setShowCancel(false)}>
          <div className="text-2xl mb-3">⚠️</div>
          <h3 className="font-bold text-gray-900 mb-2">Cancel this order?</h3>
          <p className="text-sm text-gray-500 mb-5">
            This will cancel the order and free the table.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setShowCancel(false)}
              className="flex-1 py-2.5 border rounded-xl font-medium text-gray-700 text-sm"
            >
              Keep
            </button>
            <button
              onClick={handleCancelOrder}
              disabled={cancelOrder.isPending}
              className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-semibold text-sm disabled:opacity-50"
            >
              Cancel Order
            </button>
          </div>
        </Modal>
      )}

      {/* Back confirmation */}
      {showBackConfirm && (
        <Modal onClose={() => setShowBackConfirm(false)}>
          <div className="text-2xl mb-3">🔙</div>
          <h3 className="font-bold text-gray-900 mb-2">Leave this order?</h3>
          <p className="text-sm text-gray-500 mb-5">
            The order stays open. Return by tapping the table again.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setShowBackConfirm(false)}
              className="flex-1 py-2.5 border rounded-xl font-medium text-gray-700 text-sm"
            >
              Stay here
            </button>
            <button
              onClick={() => router.push("/tables")}
              className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-semibold text-sm"
            >
              Go to Tables
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Modal({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
