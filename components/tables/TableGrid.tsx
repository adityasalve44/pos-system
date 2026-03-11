"use client";
import { useTables } from "@/lib/hooks/useTables";
import { TableCard } from "./TableCard";
import { RefreshCw } from "lucide-react";

export function TableGrid() {
  const { data: tables, isLoading, error, refetch } = useTables();

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>
  );

  if (error) return (
    <div className="text-center py-12">
      <p className="text-red-500 mb-4">Failed to load tables</p>
      <button onClick={() => refetch()} className="text-blue-600 underline">Retry</button>
    </div>
  );

  const available = tables?.filter((t) => t.status === "available").length ?? 0;
  const occupied = tables?.filter((t) => t.status === "occupied").length ?? 0;

  return (
    <div>
      <div className="flex items-center gap-4 mb-6 text-sm">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-green-400 inline-block" />
          <span className="text-gray-600">{available} available</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-orange-400 inline-block" />
          <span className="text-gray-600">{occupied} occupied</span>
        </span>
        <button onClick={() => refetch()} className="ml-auto text-gray-400 hover:text-gray-600">
          <RefreshCw size={16} />
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {tables?.map((table) => <TableCard key={table.id} table={table} />)}
      </div>

      {!tables?.length && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg font-medium mb-1">No tables configured</p>
          <p className="text-sm">Ask an admin to add tables in the products page</p>
        </div>
      )}
    </div>
  );
}
