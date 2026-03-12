"use client";
import { useState } from "react";
import {
  useProducts,
  useCreateProduct,
  useUpdateProduct,
  useCategories,
  useCreateCategory,
  useDeleteCategory,
} from "@/lib/hooks/useProducts";
import { formatCurrency } from "@/lib/utils/format";
import {
  Plus,
  Pencil,
  ToggleLeft,
  ToggleRight,
  Tag,
  Trash2,
  ChevronDown,
} from "lucide-react";
import type { Product } from "@/types";

export default function ProductsPage() {
  const { data: products, isLoading } = useProducts();
  const { data: categories } = useCategories();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const createCategory = useCreateCategory();
  const deleteCategory = useDeleteCategory();

  const [tab, setTab] = useState<"products" | "categories">("products");
  const [showProductForm, setShowProductForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState({ name: "", category: "", price: "" });
  const [newCatName, setNewCatName] = useState("");
  const [addingCat, setAddingCat] = useState(false);

  const catNames = categories?.map((c) => c.name) ?? [];

  function openCreate() {
    setEditing(null);
    setForm({ name: "", category: catNames[0] ?? "", price: "" });
    setShowProductForm(true);
  }
  function openEdit(p: Product) {
    setEditing(p);
    setForm({ name: p.name, category: p.category, price: p.price });
    setShowProductForm(true);
  }
  async function submitProduct() {
    if (!form.name || !form.category || !form.price) return;
    await (editing
      ? updateProduct.mutateAsync({ id: editing.id, ...form })
      : createProduct.mutateAsync(form));
    setShowProductForm(false);
  }
  async function addCategory() {
    if (!newCatName.trim()) return;
    await createCategory.mutateAsync({ name: newCatName.trim() });
    setNewCatName("");
    setAddingCat(false);
  }

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">Menu</h1>
        <div className="flex gap-2">
          {tab === "products" && (
            <button
              onClick={openCreate}
              disabled={catNames.length === 0}
              className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-40 active:scale-95"
            >
              <Plus size={16} /> Add Item
            </button>
          )}
          {tab === "categories" && (
            <button
              onClick={() => setAddingCat(true)}
              className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 active:scale-95"
            >
              <Plus size={16} /> Add Category
            </button>
          )}
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex bg-gray-100 rounded-xl p-1 w-fit mb-5">
        {(["products", "categories"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${tab === t ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"}`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Categories tab */}
      {tab === "categories" && (
        <div className="space-y-3">
          {addingCat && (
            <div className="flex gap-2 mb-3">
              <input
                autoFocus
                type="text"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addCategory()}
                placeholder="Category name e.g. Starters, Biryani…"
                className="flex-1 px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={addCategory}
                disabled={!newCatName.trim() || createCategory.isPending}
                className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium disabled:opacity-50"
              >
                Add
              </button>
              <button
                onClick={() => setAddingCat(false)}
                className="px-3 py-2.5 border rounded-xl text-sm text-gray-600"
              >
                ✕
              </button>
            </div>
          )}
          {!categories?.length ? (
            <div className="text-center py-14 text-gray-400">
              <Tag size={36} className="mx-auto mb-2 opacity-40" />
              <p className="font-medium">No categories yet</p>
              <p className="text-sm mt-1">
                Add categories before creating menu items
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border divide-y">
              {categories.map((cat) => {
                const count =
                  products?.filter((p) => p.category === cat.name).length ?? 0;
                return (
                  <div key={cat.id} className="flex items-center gap-3 p-4">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                      <Tag size={14} className="text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 text-sm">
                        {cat.name}
                      </div>
                      <div className="text-xs text-gray-400">
                        {count} item{count !== 1 ? "s" : ""}
                      </div>
                    </div>
                    {count === 0 && (
                      <button
                        onClick={() => deleteCategory.mutateAsync(cat.id)}
                        className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Products tab */}
      {tab === "products" && (
        <>
          {catNames.length === 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4 text-sm text-amber-800 flex items-center gap-2">
              ⚠️ Create a category first.
              <button
                onClick={() => setTab("categories")}
                className="underline font-medium"
              >
                Go to Categories →
              </button>
            </div>
          )}
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="h-14 bg-gray-200 rounded-xl animate-pulse"
                />
              ))}
            </div>
          ) : (
            <div className="space-y-5">
              {catNames.map((cat) => {
                const catProducts =
                  products?.filter((p) => p.category === cat) ?? [];
                if (!catProducts.length) return null;
                return (
                  <div key={cat}>
                    <div className="flex items-center gap-2 mb-2">
                      <Tag size={12} className="text-gray-400" />
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        {cat}
                      </span>
                      <span className="text-xs text-gray-300">
                        ({catProducts.length})
                      </span>
                    </div>
                    <div className="bg-white rounded-xl border divide-y">
                      {catProducts.map((product) => (
                        <div
                          key={product.id}
                          className={`flex items-center gap-3 p-3 md:p-4 ${!product.isAvailable ? "opacity-50" : ""}`}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 text-sm">
                              {product.name}
                            </div>
                            <div className="text-xs font-semibold text-blue-600">
                              {formatCurrency(product.price)}
                            </div>
                          </div>
                          <button
                            onClick={() =>
                              updateProduct.mutateAsync({
                                id: product.id,
                                isAvailable: product.isAvailable ? 0 : 1,
                              })
                            }
                            className="shrink-0"
                          >
                            {product.isAvailable ? (
                              <ToggleRight
                                size={22}
                                className="text-green-500"
                              />
                            ) : (
                              <ToggleLeft size={22} className="text-gray-300" />
                            )}
                          </button>
                          <button
                            onClick={() => openEdit(product)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          >
                            <Pencil size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              {!products?.length && (
                <div className="text-center py-14 text-gray-400">
                  <div className="text-4xl mb-2">🍽️</div>
                  <p className="font-medium">No menu items yet</p>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Product form – Fix 6: category as <select> dropdown */}
      {showProductForm && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl">
            <h2 className="text-lg font-bold mb-4">
              {editing ? "Edit Item" : "Add Menu Item"}
            </h2>
            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Chicken Biryani"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <div className="relative">
                  <select
                    value={form.category}
                    onChange={(e) =>
                      setForm({ ...form, category: e.target.value })
                    }
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white pr-8"
                  >
                    <option value="">Select category…</option>
                    {catNames.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={14}
                    className="absolute right-3 top-3.5 text-gray-400 pointer-events-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  placeholder="0.00"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowProductForm(false)}
                className="flex-1 py-2.5 border rounded-xl font-medium text-gray-700 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={submitProduct}
                disabled={
                  !form.name ||
                  !form.category ||
                  !form.price ||
                  createProduct.isPending ||
                  updateProduct.isPending
                }
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-semibold text-sm disabled:opacity-50"
              >
                {editing ? "Save" : "Add Item"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
