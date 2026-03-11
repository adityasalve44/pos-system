"use client";
import { useState, useMemo } from "react";
import { useProducts } from "@/lib/hooks/useProducts";
import type { Product } from "@/types";
import { formatCurrency } from "@/lib/utils/format";
import { Plus } from "lucide-react";

interface Props {
  onAddItem: (product: Product) => void;
  loading?: boolean;
}

export function ProductGrid({ onAddItem, loading }: Props) {
  const { data: products, isLoading } = useProducts();
  const [activeCategory, setActiveCategory] = useState("All");

  const categories = useMemo(() => {
    const cats = new Set(products?.map((p) => p.category) ?? []);
    return ["All", ...Array.from(cats).sort()];
  }, [products]);

  const filtered = useMemo(() => {
    return products?.filter(
      (p) => p.isAvailable && (activeCategory === "All" || p.category === activeCategory)
    ) ?? [];
  }, [products, activeCategory]);

  if (isLoading) return <div className="animate-pulse space-y-3"><div className="h-8 bg-gray-200 rounded"/><div className="grid grid-cols-3 gap-3">{[...Array(9)].map((_, i) => <div key={i} className="h-20 bg-gray-200 rounded-xl"/>)}</div></div>;

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
        {filtered.map((product) => (
          <button
            key={product.id}
            onClick={() => !loading && onAddItem(product)}
            disabled={loading}
            className="text-left bg-white border border-gray-200 rounded-xl p-3 hover:border-blue-300 hover:shadow-sm active:scale-95 transition-all disabled:opacity-50"
          >
            <div className="font-medium text-gray-900 text-sm leading-tight mb-1">{product.name}</div>
            <div className="text-xs text-gray-500 mb-2">{product.category}</div>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-blue-600 text-sm">{formatCurrency(product.price)}</span>
              <span className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                <Plus size={14} className="text-white" />
              </span>
            </div>
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-8 text-gray-400 text-sm">
          No products in this category
        </div>
      )}
    </div>
  );
}
