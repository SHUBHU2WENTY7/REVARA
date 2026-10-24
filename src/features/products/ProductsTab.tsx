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
    if (confirm(`Permanently remove "${p.name}" (${p.sku}) from catalog?`)) {
      try {
        const res = await deleteProductInSupabase(p.id)
        if (res.error) throw res.error
        toast.success(`Product "${p.name}" removed.`)
        await refreshData()
      } catch {
        toast.error("Failed to delete product from catalog.")
      }
    }
  }

  const columns: ColumnDef<Product>[] = [
    {
      key: "name",
      header: "Product & SKU",
      sortable: true,
      accessor: (p) => p.name,
      render: (p) => (
        <div className="flex items-center gap-3">
          {p.images?.[0] ? (
            <img
              src={p.images[0]}
              alt=""
              className="h-10 w-10 rounded-xl object-cover border border-[var(--line-2)] shrink-0"
            />
          ) : (
            <div className="h-10 w-10 rounded-xl bg-[var(--well)] border border-[var(--line)] flex items-center justify-center shrink-0">
              <Package className="h-4 w-4 text-[var(--muted)]" />
            </div>
          )}
          <div className="overflow-hidden">
            <p className="font-semibold text-[var(--text)] truncate max-w-xs">{p.name}</p>
            <p className="text-[11px] text-[var(--muted)] font-mono">{p.sku}</p>
          </div>
        </div>
      ),
    },
    {
      key: "category",
      header: "Category",
      accessor: (p) => {
        const cat = state.categories.find((c) => c.id === p.category_id)
        return cat?.name || "Uncategorized"
      },
      render: (p) => {
        const cat = state.categories.find((c) => c.id === p.category_id)
        return (
          <span className="text-xs text-[var(--muted)]">
            {cat?.name || "Uncategorized"}
          </span>
        )
      },
    },
    {
      key: "price",
      header: "Price (₹)",
      sortable: true,
      accessor: (p) => p.price,
      render: (p) => (
        <span className="font-mono text-[var(--primary)] font-bold">
          {formatCurrency(p.price)}
        </span>
      ),
    },
    {
      key: "stock",
      header: "In Stock",
      sortable: true,
      accessor: (p) => p.stock,
      render: (p) => (
        <span className={`font-mono font-bold text-xs ${stockColor(p.stock)}`}>
          {p.stock} units
        </span>
      ),
    },
    {
      key: "tags",
      header: "Status Tags",
      render: (p) => (
        <div className="flex items-center gap-1">
          {p.is_featured && (
            <span className="px-1.5 py-0.5 rounded bg-[var(--well)] text-[var(--primary)] border border-[var(--line-2)] text-[10px] font-mono">
              FEATURED
            </span>
          )}
          {p.is_limited && (
            <span className="px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-500 border border-rose-500/20 text-[10px] font-mono">
              LIMITED
            </span>
          )}
        </div>
      ),
    },
    {
      key: "actions",
      header: "Manage",
      render: (p) => (
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onOpenProductModal(p)}
            className="h-7 text-[11px] gap-1 hover:border-[var(--primary)] hover:text-[var(--primary)]"
          >
            <Edit2 className="h-3 w-3" />
            <span>Edit</span>
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleDelete(p)}
            className="h-7 w-7 p-0 text-[var(--muted)] hover:text-rose-500 hover:bg-rose-500/10"
            title="Archive Product"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-[var(--text)] tracking-tight font-['Manrope']">
            Product Catalog
          </h2>
          <p className="text-xs text-[var(--muted)] mt-0.5">
            Manage SKU listings, verified attributes, luxury pricing, and drops.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenCategoryModal}
            className="h-8 gap-1.5 text-xs rounded-xl"
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Manage Categories</span>
          </Button>

          <Button
            size="sm"
            onClick={() => onOpenProductModal(null)}
            className="h-8 gap-1.5 text-xs bg-[var(--ink)] text-[var(--on-ink)] hover:opacity-90 rounded-xl shadow-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Drop New Product</span>
          </Button>

          <div className="flex items-center gap-1 p-1 rounded-2xl bg-[var(--surface-2)] border border-[var(--line)] ml-1">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-xl text-xs cursor-pointer transition-colors ${
                viewMode === "grid"
                  ? "bg-[var(--surface)] text-[var(--text)] font-semibold shadow-xs border border-[var(--line)]"
                  : "text-[var(--muted)] hover:text-[var(--text)]"
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-xl text-xs cursor-pointer transition-colors ${
                viewMode === "table"
                  ? "bg-[var(--surface)] text-[var(--text)] font-semibold shadow-xs border border-[var(--line)]"
                  : "text-[var(--muted)] hover:text-[var(--text)]"
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
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
        <button
          type="button"
          onClick={() => setSelectedCategory("all")}
          className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer shrink-0 ${
            selectedCategory === "all"
              ? "bg-[var(--ink)] text-[var(--on-ink)] font-semibold shadow-xs"
              : "bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--text)] border border-[var(--line)]"
          }`}
        >
          All Categories ({state.products.length})
        </button>
        {state.categories.map((cat) => {
          const count = state.products.filter((p) => p.category_id === cat.id).length
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer shrink-0 ${
                selectedCategory === cat.id
                  ? "bg-[var(--ink)] text-[var(--on-ink)] font-semibold shadow-xs"
                  : "bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--text)] border border-[var(--line)]"
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
            <div className="col-span-full p-12 text-center rounded-2xl border border-[var(--line)] bg-[var(--surface)] text-[var(--muted)] text-xs">
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
                  className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] overflow-hidden flex flex-col group hover:border-[var(--line-2)] hover:shadow-md transition-all"
                >
                  <div className="relative h-44 w-full bg-[var(--surface-2)] overflow-hidden">
                    <img
                      src={img}
                      alt={p.name}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-black/60 text-white backdrop-blur-md border border-white/10">
                        {cat?.name || p.brand}
                      </span>
                      {p.is_limited && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-600 text-white shadow-xs">
                          LIMITED
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <h4 className="text-xs font-bold text-[var(--text)] line-clamp-1 group-hover:text-[var(--primary)] transition-colors">
                        {p.name}
                      </h4>
                      <p className="text-[10px] font-mono text-[var(--muted)] mt-0.5">{p.sku}</p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-[var(--line)]">
                      <div>
                        <span className="text-[10px] text-[var(--muted)] uppercase font-mono">Price</span>
                        <p className="text-sm font-bold font-mono text-[var(--primary)]">
                          {formatCurrency(p.price)}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-[var(--muted)] uppercase font-mono">Stock</span>
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
                        className="flex-1 h-7 text-[11px] gap-1 hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors"
                      >
                        <Edit2 className="h-3 w-3" />
                        <span>Edit SKU</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(p)}
                        className="h-7 w-7 p-0 text-[var(--muted)] hover:text-rose-500 hover:bg-rose-500/10"
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
