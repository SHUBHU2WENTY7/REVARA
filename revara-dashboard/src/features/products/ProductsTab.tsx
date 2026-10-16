import { useState, useMemo } from "react"
import {
  Package,
  Plus,
  Layers,
  Edit2,
  Trash2,
  Sparkles,
  LayoutGrid,
  LayoutList,
  AlertTriangle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  AppleCardsCarousel,
  type CarouselCardItem,
} from "@/components/ui/apple-cards-carousel"
import { DataTable, type ColumnDef } from "@/components/ui/table-with-dialog"
import { useDashboardData } from "@/hooks/useDashboardData"
import type { Product } from "@/types"
import { formatCurrency, stockLevel, stockColor } from "@/lib/utils"
import { deleteProductInSupabase } from "@/lib/supabase"
import { toast } from "sonner"

export interface ProductsTabProps {
  onOpenProductModal: (product?: Product | null) => void
  onOpenCategoryModal: () => void
}

export function ProductsTab({
  onOpenProductModal,
  onOpenCategoryModal,
}: ProductsTabProps) {
  const { state, refreshData } = useDashboardData()
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid")

  const filteredProducts = useMemo(() => {
    if (selectedCategory === "all") return state.products
    return state.products.filter((p) => p.category_id === selectedCategory)
  }, [state.products, selectedCategory])

  // AppleCardsCarousel items from featured/new products
  const carouselItems: CarouselCardItem[] = useMemo(() => {
    const featured = state.products.filter((p) => p.is_featured || p.is_trending || p.is_new)
    const list = featured.length > 0 ? featured : state.products.slice(0, 6)

    return list.map((p) => {
      const cat = state.categories.find((c) => c.id === p.category_id)
      return {
        id: p.id,
        title: p.name,
        category: cat?.name || p.brand || "REVARA",
        src:
          p.images?.[0] ||
          "https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&auto=format&fit=crop&q=80",
        price: p.price,
        badge: p.is_limited ? "LIMITED DROP" : p.is_featured ? "FEATURED" : p.is_new ? "NEW DROP" : undefined,
      }
    })
  }, [state.products, state.categories])

  const handleDelete = async (p: Product) => {
    if (!confirm(`Are you sure you want to archive product "${p.name}"?`)) return
    try {
      const res = await deleteProductInSupabase(p.id)
      if (res.error) throw res.error
      toast.success(`Archived "${p.name}"!`)
      await refreshData()
    } catch {
      toast.error("Failed to archive product.")
    }
  }

  const columns: ColumnDef<Product>[] = [
    {
      key: "name",
      header: "Product & SKU",
      sortable: true,
      accessor: (p) => p.name,
      render: (p) => {
        const img = p.images?.[0]
        return (
          <div className="flex items-center gap-3">
            {img ? (
              <img
                src={img}
                alt=""
                className="h-10 w-10 rounded-lg object-cover border border-white/10 shrink-0"
              />
            ) : (
              <div className="h-10 w-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                <Package className="h-4 w-4 text-slate-500" />
              </div>
            )}
            <div className="overflow-hidden">
              <p className="font-semibold text-white truncate max-w-xs">{p.name}</p>
              <p className="text-[11px] text-slate-400 font-mono">{p.sku}</p>
            </div>
          </div>
        )
      },
    },
    {
      key: "category",
      header: "Category",
      sortable: true,
      accessor: (p) => {
        const cat = state.categories.find((c) => c.id === p.category_id)
        return cat?.name || "Uncategorized"
      },
      render: (p) => {
        const cat = state.categories.find((c) => c.id === p.category_id)
        return (
          <span className="text-xs text-slate-300">
            {cat?.name || <span className="text-slate-500 italic">None</span>}
          </span>
        )
      },
    },
    {
      key: "price",
      header: "Price (₹)",
      sortable: true,
      accessor: (p) => Number(p.price),
      render: (p) => (
        <span className="font-mono font-bold text-cyan-400">
          {formatCurrency(p.price)}
        </span>
      ),
    },
    {
      key: "stock",
      header: "Stock Level",
      sortable: true,
      accessor: (p) => Number(p.stock),
      render: (p) => (
        <span className={`font-mono font-bold text-xs ${stockColor(p.stock)}`}>
          {p.stock} units
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (p) => (
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onOpenProductModal(p)}
            className="h-7 text-[11px] gap-1 text-slate-300 hover:text-white"
          >
            <Edit2 className="h-3 w-3" />
            <span>Edit</span>
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleDelete(p)}
            className="h-7 w-7 p-0 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Title & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Master Product Catalog</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage merchandise listings, pricing, Supabase storage media, and categories.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenCategoryModal}
            className="h-8 gap-1.5 text-xs text-slate-300 border-white/10"
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Manage Categories</span>
          </Button>

          <Button
            size="sm"
            onClick={() => onOpenProductModal(null)}
            className="h-8 gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Drop New Product</span>
          </Button>

          <div className="flex items-center gap-1 p-1 rounded-xl bg-[#131B2E] border border-white/[0.08] ml-2">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg text-xs cursor-pointer ${
                viewMode === "grid"
                  ? "bg-indigo-600 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-lg text-xs cursor-pointer ${
                viewMode === "table"
                  ? "bg-indigo-600 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <LayoutList className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Apple Cards Carousel Hero */}
      {carouselItems.length > 0 && (
        <AppleCardsCarousel
          items={carouselItems}
          onItemClick={(item) => {
            const fullProd = state.products.find((p) => p.id === item.id)
            if (fullProd) onOpenProductModal(fullProd)
          }}
        />
      )}

      {/* Category Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        <button
          onClick={() => setSelectedCategory("all")}
          className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer shrink-0 ${
            selectedCategory === "all"
              ? "bg-indigo-600 text-white font-semibold"
              : "bg-[#131B2E] text-slate-400 hover:text-white border border-white/[0.08]"
          }`}
        >
          All Categories ({state.products.length})
        </button>
        {state.categories.map((cat) => {
          const count = state.products.filter((p) => p.category_id === cat.id).length
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer shrink-0 ${
                selectedCategory === cat.id
                  ? "bg-indigo-600 text-white font-semibold"
                  : "bg-[#131B2E] text-slate-400 hover:text-white border border-white/[0.08]"
              }`}
            >
              <span>{cat.name}</span>
              <span className="text-[10px] opacity-70 font-mono">({count})</span>
            </button>
          )
        })}
      </div>

      {/* Products Grid or Table */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredProducts.length === 0 ? (
            <div className="col-span-full p-12 text-center rounded-2xl border border-white/10 bg-[#131B2E] text-slate-400 text-xs">
              No products found in this category.
            </div>
          ) : (
            filteredProducts.map((p) => {
              const cat = state.categories.find((c) => c.id === p.category_id)
              const img =
                p.images?.[0] ||
                "https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&auto=format&fit=crop&q=80"

              return (
                <div
                  key={p.id}
                  className="rounded-2xl border border-white/[0.08] bg-[#131B2E] overflow-hidden flex flex-col group hover:border-indigo-500/40 transition-all shadow-xl"
                >
                  <div className="relative h-44 w-full bg-slate-900 overflow-hidden">
                    <img
                      src={img}
                      alt={p.name}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-black/60 text-indigo-300 backdrop-blur-md border border-white/10">
                        {cat?.name || p.brand}
                      </span>
                      {p.is_limited && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-600 text-white shadow-md">
                          LIMITED
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <h4 className="text-xs font-bold text-white line-clamp-1 group-hover:text-indigo-400 transition-colors">
                        {p.name}
                      </h4>
                      <p className="text-[10px] font-mono text-slate-500 mt-0.5">{p.sku}</p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-white/[0.05]">
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase font-mono">Price</span>
                        <p className="text-sm font-bold font-mono text-cyan-400">
                          {formatCurrency(p.price)}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-slate-500 uppercase font-mono">Stock</span>
                        <p className={`text-xs font-bold font-mono ${stockColor(p.stock)}`}>
                          {p.stock} units
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 pt-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onOpenProductModal(p)}
                        className="flex-1 h-7 text-[11px] gap-1 hover:bg-indigo-600 hover:text-white hover:border-indigo-500 transition-colors"
                      >
                        <Edit2 className="h-3 w-3" />
                        <span>Edit SKU</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(p)}
                        className="h-7 w-7 p-0 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
                        title="Archive Product"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      ) : (
        <DataTable
          data={filteredProducts as (Product & Record<string, unknown>)[]}
          columns={columns as ColumnDef<Product & Record<string, unknown>>[]}
          keyExtractor={(p) => p.id}
          searchPlaceholder="Search product name, SKU, or category..."
          onRowClick={(p) => onOpenProductModal(p as unknown as Product)}
          exportFilename="revara-products"
        />
      )}
    </div>
  )
}
