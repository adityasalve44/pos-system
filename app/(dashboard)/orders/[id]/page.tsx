"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useOrder, useCancelOrder, useAddItem } from "@/lib/hooks/useOrders";
import { useSettings } from "@/lib/hooks/useProducts";
import { ProductGrid } from "@/components/products/ProductGrid";
import { OrderSheet } from "@/components/orders/OrderSheet";
import { PaymentModal } from "@/components/billing/PaymentModal";
import { ReceiptView } from "@/components/billing/ReceiptView";
import { formatCurrency } from "@/lib/utils/format";
import { can } from "@/lib/rbac";
import {
  ArrowLeft,
  X,
  Printer,
  CheckCircle2,
  CreditCard,
  Loader2,
} from "lucide-react";
import type { Product } from "@/types";

export default function OrderPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session } = useSession();
  const role = session?.user?.role;

  const { data: order, isLoading } = useOrder(id);
  const { data: settings } = useSettings();
  const addItem = useAddItem();
  const cancelOrder = useCancelOrder();

  const [view, setView] = useState<"order" | "pay" | "receipt">("order");
  const [showCancel, setShowCancel] = useState(false);
  const [showBackConfirm, setShowBackConfirm] = useState(false);

  const canCancel = can(role, "orders_cancel");

  if (isLoading)
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <Loader2 size={28} className="animate-spin text-gray-300" />
      </div>
    );
  if (!order)
    return (
      <div className="text-center p-12">
        <p className="text-gray-500">Order not found</p>
        <button
          onClick={() => router.push("/tables")}
          className="mt-4 text-sm underline"
          style={{ color: "var(--brand)" }}
        >
          ← Back to Tables
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

  const orderLabel =
    order.orderType === "takeout"
      ? `Takeout · ${order.customerName}`
      : `Order #${order.orderNumber}`;

  /* Status badge style */
  const statusStyle = isOpen
    ? "bg-emerald-100 text-emerald-700"
    : isBilled
      ? "bg-amber-100 text-amber-700"
      : isPaid
        ? "bg-blue-100 text-blue-700"
        : "bg-gray-100 text-gray-500";

  const typeStyle =
    order.orderType === "takeout"
      ? "bg-purple-100 text-purple-700"
      : "bg-teal-100 text-teal-700";

  return (
    <div className="flex flex-col md:flex-row h-[calc(100dvh-3.5rem)] md:h-screen overflow-hidden bg-gray-50">
      {/* ── LEFT: product catalogue ───────────────────────────────── */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Topbar */}
        <div className="flex items-center gap-2 px-3 py-2.5 bg-white border-b shrink-0 shadow-sm">
          <button
            onClick={handleBack}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 active:scale-90 transition-all shrink-0"
          >
            <ArrowLeft size={17} />
          </button>

          <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-gray-900 text-sm truncate">
              {orderLabel}
            </span>
            <span
              className={`text-[11px] px-2 py-0.5 rounded-full font-semibold shrink-0 ${statusStyle}`}
            >
              {order.status}
            </span>
            <span
              className={`text-[11px] px-2 py-0.5 rounded-full font-semibold shrink-0 ${typeStyle}`}
            >
              {order.orderType === "takeout" ? "Takeout" : "Dine-in"}
            </span>
          </div>

          {/* Cancel (admin/manager only) */}
          {isOpen && canCancel && (
            <button
              onClick={() => setShowCancel(true)}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors shrink-0"
            >
              <X size={16} />
            </button>
          )}
          {/* Print receipt toggle (paid) */}
          {isPaid && (
            <button
              onClick={() =>
                setView((v) => (v === "receipt" ? "order" : "receipt"))
              }
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors shrink-0"
            >
              <Printer size={16} />
            </button>
          )}
        </div>

        {/* Product grid (open orders only) */}
        {isOpen && (
          <div className="flex-1 overflow-y-auto p-3">
            <ProductGrid
              onAddItem={handleAddItem}
              loading={addItem.isPending}
            />
          </div>
        )}

        {/* Billed — centre state */}
        {isBilled && view !== "pay" && (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: "var(--brand-light)" }}
              >
                <CreditCard size={28} style={{ color: "var(--brand)" }} />
              </div>
              <p className="text-xl font-bold text-gray-900 mb-1">
                Bill Closed
              </p>
              <p
                className="text-3xl font-bold mb-2"
                style={{ color: "var(--brand)" }}
              >
                {formatCurrency(order.totalAmount)}
              </p>
              <p className="text-sm text-gray-400">
                Collect payment from the right panel →
              </p>
            </div>
          </div>
        )}

        {/* Paid — receipt view */}
        {isPaid && view === "receipt" && (
          <div className="flex-1 overflow-y-auto p-4">
            <ReceiptView
              order={order}
              restaurantName={settings?.name ?? "Restaurant"}
            />
          </div>
        )}

        {/* Paid — confirmation centre state */}
        {isPaid && view !== "receipt" && (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={28} className="text-emerald-500" />
              </div>
              <p className="text-xl font-bold text-gray-900 mb-1">
                Payment Received
              </p>
              <p className="text-sm text-gray-400">
                Tap the printer icon to view / print receipt
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── RIGHT: order summary panel ──────────────────────────── */}
      <div className="w-full md:w-80 lg:w-96 bg-white border-t md:border-t-0 md:border-l flex flex-col max-h-[48vh] md:max-h-none shrink-0 shadow-sm">
        {/* Panel header */}
        <div className="px-4 py-3 border-b shrink-0 flex items-center justify-between bg-white">
          <div>
            <h2 className="font-semibold text-gray-900 text-sm">
              {items.length} item{items.length !== 1 ? "s" : ""}
            </h2>
            {isOpen && items.length > 0 && (
              <p className="text-[11px] text-gray-400">
                Tap − / + to adjust quantity
              </p>
            )}
          </div>
          {isOpen && (
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
              Open
            </span>
          )}
        </div>

        {/* Order sheet (items + totals + generate bill) */}
        <div className="flex-1 overflow-y-auto p-3 min-h-0">
          <OrderSheet orderId={id} onBill={() => setView("receipt")} />
        </div>

        {/* Billed footer — collect payment CTA */}
        {isBilled && (
          <div className="p-4 border-t bg-white shrink-0 space-y-2.5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-gray-500">Total due</span>
              <span
                className="text-xl font-bold"
                style={{ color: "var(--brand)" }}
              >
                {formatCurrency(order.totalAmount)}
              </span>
            </div>
            <button
              onClick={() => setView("pay")}
              className="w-full text-white py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all"
              style={{ background: "var(--brand)" }}
            >
              <CreditCard size={15} /> Collect Payment
            </button>
          </div>
        )}

        {/* Paid footer */}
        {isPaid && (
          <div className="p-4 border-t bg-white shrink-0 space-y-2">
            <button
              onClick={() =>
                setView((v) => (v === "receipt" ? "order" : "receipt"))
              }
              className="w-full border border-gray-200 text-gray-700 py-2.5 rounded-xl font-medium text-sm hover:bg-gray-50 flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              <Printer size={14} />
              {view === "receipt" ? "Hide Receipt" : "Print Receipt"}
            </button>
            <button
              onClick={() => router.push("/tables")}
              className="w-full bg-gray-900 text-white py-2.5 rounded-xl font-medium text-sm active:scale-95 transition-all"
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

      {/* Cancel confirm (admin/manager) */}
      {showCancel && (
        <Modal onClose={() => setShowCancel(false)}>
          <div className="w-11 h-11 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <X size={20} className="text-red-600" />
          </div>
          <h3 className="font-bold text-gray-900 text-base mb-1">
            Cancel this order?
          </h3>
          <p className="text-sm text-gray-500 mb-5">
            The order will be voided and the table freed.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setShowCancel(false)}
              className="flex-1 py-2 border rounded-lg font-medium text-gray-700 text-sm hover:bg-gray-50"
            >
              Keep
            </button>
            <button
              onClick={handleCancelOrder}
              disabled={cancelOrder.isPending}
              className="flex-1 py-2 bg-red-600 text-white rounded-lg font-semibold text-sm disabled:opacity-50 hover:bg-red-700 flex items-center justify-center gap-1.5"
            >
              {cancelOrder.isPending ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  Wait…
                </>
              ) : (
                "Cancel Order"
              )}
            </button>
          </div>
        </Modal>
      )}

      {/* Back confirm (all roles) */}
      {showBackConfirm && (
        <Modal onClose={() => setShowBackConfirm(false)}>
          <div className="w-11 h-11 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <ArrowLeft size={20} className="text-amber-600" />
          </div>
          <h3 className="font-bold text-gray-900 text-base mb-1">
            Leave this order?
          </h3>
          <p className="text-sm text-gray-500 mb-5">
            The order stays open — return by tapping the table again.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setShowBackConfirm(false)}
              className="flex-1 py-2 border rounded-lg font-medium text-gray-700 text-sm hover:bg-gray-50"
            >
              Stay
            </button>
            <button
              onClick={() => router.push("/tables")}
              className="flex-1 py-2 text-white rounded-lg font-semibold text-sm"
              style={{ background: "var(--brand)" }}
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
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl p-6 max-w-xs w-full shadow-2xl text-center"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
