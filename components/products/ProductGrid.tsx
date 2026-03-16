"use client";
import { useState, useMemo } from "react";
import { useProducts } from "@/lib/hooks/useProducts";
import type { Product } from "@/types";
import { formatCurrency } from "@/lib/utils/format";
import { Loader2 } from "lucide-react";

interface Props {
  onAddItem: (product: Product) => void;
  loading?: boolean;
}

export function ProductGrid({ onAddItem, loading }: Props) {
  const { data: products, isLoading } = useProducts();
  const [activeCategory, setActiveCategory] = useState("All");
  // Track which product is being added for per-item spinner
  const [addingId, setAddingId] = useState<string | null>(null);

  const categories = useMemo(() => {
    const cats = new Set(products?.map((p) => p.category) ?? []);
    return ["All", ...Array.from(cats).sort()];
  }, [products]);

  const filtered = useMemo(() => {
    return (
      products?.filter(
        (p) =>
          p.isAvailable &&
          (activeCategory === "All" || p.category === activeCategory),
      ) ?? []
    );
  }, [products, activeCategory]);

  async function handleAdd(product: Product) {
    if (loading || addingId) return;
    setAddingId(product.id);
    try {
      await onAddItem(product);
    } finally {
      setAddingId(null);
    }
  }

  if (isLoading)
    return (
      <div className="animate-pulse space-y-3">
        <div className="h-8 bg-gray-200 rounded" />
        <div className="grid grid-cols-3 gap-3">
          {[...Array(9)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 rounded-xl" />
          ))}
        </div>
      </div>
    );

  return (
    <div>
      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              activeCategory === cat
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Product grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {filtered.map((product) => {
          const isAdding = addingId === product.id;
          return (
            <button
              key={product.id}
              onClick={() => handleAdd(product)}
              disabled={!!addingId}
              className={`relative text-left bg-white border-none border-gray-200 rounded-xl p-3 transition-all
                hover:border-blue-300 hover:shadow-sm active:scale-95
                ${addingId && !isAdding ? "opacity-50" : ""}
                ${isAdding ? "border-blue-400 shadow-sm" : ""}`}
            >
              {/* Per-item spinner overlay */}
              {isAdding && (
                <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-white/80 backdrop-blur-sm z-10">
                  <Loader2 size={20} className="animate-spin text-blue-600" />
                </div>
              )}
              <div className="font-medium text-gray-900 text-sm leading-tight mb-1">
                {product.name}
              </div>
              <div className="text-xs text-gray-400 mb-2">
                {product.category}
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-blue-600 text-sm">
                  {formatCurrency(product.price)}
                </span>
                <span className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold leading-none">
                  +
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-8 text-gray-400 text-sm">
          No products in this category
        </div>
      )}
    </div>
  );
}
