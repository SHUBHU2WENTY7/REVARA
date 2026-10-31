import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Package,
  Upload,
  Plus,
  Trash2,
  Sparkles,
  RefreshCw,
  Image as ImageIcon,
} from "lucide-react"
import type { Product } from "@/types"
import {
  createProductInSupabase,
  updateProductInSupabase,
  uploadProductImageToStorage,
} from "@/lib/supabase"
import { useDashboardData } from "@/hooks/useDashboardData"
import { generateSku } from "@/lib/utils"
import { toast } from "sonner"

export interface ProductModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product?: Product | null
}

export function ProductModal({ open, onOpenChange, product }: ProductModalProps) {
  const { state, refreshData } = useDashboardData()

  const [name, setName] = useState("")
  const [sku, setSku] = useState("")
  const [price, setPrice] = useState<number | "">("")
  const [stock, setStock] = useState<number | "">("")
  const [categoryId, setCategoryId] = useState<string>("")
  const [brand, setBrand] = useState("REVARA")
  const [description, setDescription] = useState("")
  const [images, setImages] = useState<string[]>([])
  const [manualImageUrl, setManualImageUrl] = useState("")
  const [isLimited, setIsLimited] = useState(false)
  const [isTrending, setIsTrending] = useState(false)
  const [isNew, setIsNew] = useState(true)
  const [isFeatured, setIsFeatured] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Wearable / Fashion Sizing System
  const [hasSizes, setHasSizes] = useState(false)
  const [selectedSizes, setSelectedSizes] = useState<string[]>([])
  const [customSizeInput, setCustomSizeInput] = useState("")
  const [activeSizeCategory, setActiveSizeCategory] = useState<"apparel" | "bottoms" | "footwear">("apparel")

  const isCategoryWearable = (catId: string) => {
    const cat = state.categories.find((c) => c.id === catId)
    if (!cat) return false
    const name = (cat.name || "").toLowerCase()
    const slug = (cat.slug || "").toLowerCase()
    return /wear|cloth|apparel|shoe|footwear|sneaker|bottom|pant|jean|trouser|shirt|top|hoodie|jacket|t-shirt|kurti|dress|garment/i.test(
      `${name} ${slug}`
    )
  }

  const handleCategoryChange = (newCatId: string) => {
    setCategoryId(newCatId)
    const wearable = isCategoryWearable(newCatId)
    if (wearable) {
      setHasSizes(true)
      const cat = state.categories.find((c) => c.id === newCatId)
      const name = (cat?.name || "").toLowerCase()
      if (/shoe|footwear|sneaker/i.test(name)) {
        setActiveSizeCategory("footwear")
      } else if (/pant|jean|trouser|bottom/i.test(name)) {
        setActiveSizeCategory("bottoms")
      } else {
        setActiveSizeCategory("apparel")
      }
      toast.info("Wearable category detected. Size selection activated.")
    } else {
      setHasSizes(false)
      setSelectedSizes([])
    }
  }

  const SIZE_PRESETS = {
    apparel: {
      label: "Tops / T-Shirts / Shirts / Kurtis",
      sizes: ["XS", "S", "M", "L", "XL", "2XL", "3XL", "Free Size"],
    },
    bottoms: {
      label: "Pants / Jeans / Trousers",
      sizes: ["28", "30", "32", "34", "36", "38", "40"],
    },
    footwear: {
      label: "Shoes / Sandals / Footwear",
      sizes: ["UK 4", "UK 5", "UK 6", "UK 7", "UK 8", "UK 9", "UK 10", "UK 11", "UK 12"],
    },
  }

  const toggleSize = (size: string) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    )
  }

  const addCustomSize = () => {
    const val = customSizeInput.trim().toUpperCase()
    if (val && !selectedSizes.includes(val)) {
      setSelectedSizes((prev) => [...prev, val])
      setCustomSizeInput("")
    }
  }

  useEffect(() => {
    if (product) {
      setName(product.name || "")
      setSku(product.sku || "")
      setPrice(product.price ?? "")
      setStock(product.stock ?? "")
      setCategoryId(product.category_id || "")
      setBrand(product.brand || "REVARA")
      setDescription(product.description || "")
      setImages(product.images || [])
      setIsLimited(Boolean(product.is_limited))
      setIsTrending(Boolean(product.is_trending))
      setIsNew(Boolean(product.is_new))
      setIsFeatured(Boolean(product.is_featured))

      // Extract existing sizes from tags or dimensions
      const sizeTags = (product.tags || [])
        .filter((t) => t.startsWith("size:"))
        .map((t) => t.replace("size:", ""))
      const dimensionSizes = product.dimensions
        ? product.dimensions.split(",").map((s) => s.trim()).filter(Boolean)
        : []
      const mergedSizes = Array.from(new Set([...sizeTags, ...dimensionSizes]))
      setSelectedSizes(mergedSizes)
      setHasSizes(mergedSizes.length > 0 || isCategoryWearable(product.category_id || ""))
    } else {
      setName("")
      setSku(generateSku())
      setPrice("")
      setStock("")
      const initialCatId = state.categories[0]?.id || ""
      setCategoryId(initialCatId)
      setBrand("REVARA")
      setDescription("")
      setImages([])
      setIsLimited(false)
      setIsTrending(false)
      setIsNew(true)
      setIsFeatured(false)
      setSelectedSizes([])
      setHasSizes(isCategoryWearable(initialCatId))
    }
  }, [product, state.categories, open])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)
    try {
      const uploadPromises = Array.from(files).map((file) =>
        uploadProductImageToStorage(file)
      )
      const uploadedUrls = await Promise.all(uploadPromises)
      setImages((prev) => [...prev, ...uploadedUrls])
      toast.success(`${uploadedUrls.length} image(s) uploaded to Supabase storage!`)
    } catch {
      toast.error("Failed to upload image.")
    } finally {
      setIsUploading(false)
      e.target.value = ""
    }
  }

  const handleAddManualUrl = () => {
    if (manualImageUrl.trim()) {
      setImages((prev) => [...prev, manualImageUrl.trim()])
      setManualImageUrl("")
    }
  }

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || price === "" || stock === "") {
      toast.error("Please fill in product name, price, and stock quantity.")
      return
    }

    setIsSaving(true)
    try {
      const nonSizeTags = (product?.tags || []).filter((t) => !t.startsWith("size:"))
      const sizeTags = hasSizes ? selectedSizes.map((s) => `size:${s}`) : []

      const payload: Partial<Product> = {
        name: name.trim(),
        sku: sku.trim() || generateSku(),
        price: Number(price),
        stock: Number(stock),
        category_id: categoryId || null,
        brand: brand.trim() || "REVARA",
        description: description.trim(),
        is_limited: isLimited,
        is_trending: isTrending,
        is_new: isNew,
        is_featured: isFeatured,
        tags: [...nonSizeTags, ...sizeTags],
        dimensions: hasSizes && selectedSizes.length > 0 ? selectedSizes.join(", ") : null,
        images: images.length > 0 ? images : [
          "https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&auto=format&fit=crop&q=80"
        ],
      }

      if (product) {
        const res = await updateProductInSupabase(product.id, payload)
        if (res.error) throw res.error
        toast.success(`Updated product "${name}"`)
      } else {
        const res = await createProductInSupabase(payload)
        if (res.error) throw res.error
        toast.success(`Created product "${name}"`)
      }

      await refreshData()
      onOpenChange(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save product.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
              <Package className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle>
                {product ? "Edit Product Listing" : "Drop New Product Catalog Item"}
              </DialogTitle>
              <DialogDescription>
                Synchronized with the REVARA live catalog and inventory movements.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Images Section */}
          <div className="space-y-2 p-3.5 rounded-xl bg-[#0B101D] border border-white/[0.08]">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <ImageIcon className="h-3.5 w-3.5 text-indigo-400" />
                Product Imagery (Supabase Storage: tff-products)
              </label>
              {isUploading && (
                <span className="text-[10px] text-indigo-400 font-mono flex items-center gap-1">
                  <RefreshCw className="h-3 w-3 animate-spin" /> Uploading...
                </span>
              )}
            </div>

            {/* Thumbnails */}
            <div className="flex flex-wrap gap-2 pt-1">
              {images.map((imgUrl, idx) => (
                <div
                  key={idx}
                  className="relative h-16 w-16 rounded-lg overflow-hidden border border-white/10 group bg-slate-900"
                >
                  <img src={imgUrl} alt={`Thumb ${idx}`} className="h-full w-full object-cover" />
                  {idx === 0 && (
                    <span className="absolute bottom-0 inset-x-0 bg-indigo-600/90 text-white text-[8px] font-bold text-center py-0.5">
                      COVER
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    className="absolute top-1 right-1 h-5 w-5 rounded bg-black/70 text-rose-400 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}

              <label className="h-16 w-16 rounded-lg border border-dashed border-white/20 hover:border-indigo-500/50 flex flex-col items-center justify-center text-slate-400 hover:text-indigo-400 cursor-pointer transition-colors bg-white/[0.02]">
                <Upload className="h-4 w-4" />
                <span className="text-[9px] mt-1">Upload</span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Manual URL input fallback */}
            <div className="flex gap-2 pt-2">
              <Input
                placeholder="Or paste external image URL..."
                value={manualImageUrl}
                onChange={(e) => setManualImageUrl(e.target.value)}
                className="h-8 text-xs"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddManualUrl}
                className="h-8 shrink-0 text-xs gap-1"
              >
                <Plus className="h-3 w-3" />
                Add
              </Button>
            </div>
          </div>

          {/* Title & SKU */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2 space-y-1">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Product Title
              </label>
              <Input
                required
                placeholder="e.g. 5-in-1 Gardening Hand Tool Set"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  SKU Code
                </label>
                <button
                  type="button"
                  onClick={() => setSku(generateSku())}
                  className="text-[10px] text-indigo-400 hover:underline"
                >
                  Regenerate
                </button>
              </div>
              <Input
                required
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="font-mono text-xs"
              />
            </div>
          </div>

          {/* Pricing, Stock & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Price (₹)
              </label>
              <Input
                type="number"
                step="0.01"
                min="0"
                required
                placeholder="96.00"
                value={price}
                onChange={(e) => setPrice(e.target.value === "" ? "" : Number(e.target.value))}
                className="font-mono text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Stock Quantity
              </label>
              <Input
                type="number"
                min="0"
                required
                placeholder="120"
                value={stock}
                onChange={(e) => setStock(e.target.value === "" ? "" : Number(e.target.value))}
                className="font-mono text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Category
              </label>
              <select
                value={categoryId}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="flex h-9 w-full rounded-lg border border-white/10 bg-[#0B101D] px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">Uncategorized</option>
                {state.categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Brand & Description */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Brand Label
              </label>
              <Input
                placeholder="REVARA UTILITY"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
              />
            </div>

            <div className="md:col-span-2 space-y-1">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Description
              </label>
              <Input
                placeholder="Materials, specifications, dimensions..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          {/* Wearable & Fashion Size Manager */}
          <div className="space-y-3 p-3.5 rounded-xl bg-[#0B101D] border border-white/[0.08]">
            <div className="flex items-center justify-between">
              <label className="text-[12px] font-semibold text-slate-200 flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={hasSizes}
                  onCheckedChange={(checked) => {
                    const val = Boolean(checked)
                    setHasSizes(val)
                    if (!val) {
                      setSelectedSizes([])
                    }
                  }}
                />
                <span>Include Size Selection for this Product? (Wearables / Apparel / Footwear)</span>
              </label>
              {hasSizes && (
                <span className="text-[10px] font-mono text-cyan-400">
                  {selectedSizes.length} {selectedSizes.length === 1 ? "size active" : "sizes active"}
                </span>
              )}
            </div>

            {!hasSizes ? (
              <p className="text-[11px] text-slate-400 pl-6">
                Size options disabled. This item will display with no size picker in the mobile app (ideal for tech, electronics, accessories, and one-size collectibles).
              </p>
            ) : (
              <>
                {/* Sizing Category Tabs */}
                <div className="flex gap-1.5 p-1 rounded-lg bg-white/[0.03] border border-white/5">
                  {(Object.keys(SIZE_PRESETS) as Array<keyof typeof SIZE_PRESETS>).map((catKey) => (
                    <button
                      key={catKey}
                      type="button"
                      onClick={() => setActiveSizeCategory(catKey)}
                      className={`flex-1 py-1 px-2 rounded-md text-[11px] font-medium transition-all ${
                        activeSizeCategory === catKey
                          ? "bg-indigo-600 text-white font-semibold shadow-sm"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      {SIZE_PRESETS[catKey].label.split("/")[0].trim()}
                    </button>
                  ))}
                </div>

                {/* Preset Size Pills */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {SIZE_PRESETS[activeSizeCategory].sizes.map((sz) => {
                    const isSelected = selectedSizes.includes(sz)
                    return (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => toggleSize(sz)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
                          isSelected
                            ? "bg-indigo-600 text-white border border-indigo-400/50 shadow-sm"
                            : "bg-white/[0.04] text-slate-400 hover:text-slate-200 border border-white/10 hover:border-white/20"
                        }`}
                      >
                        {isSelected ? `✓ ${sz}` : sz}
                      </button>
                    )
                  })}
                </div>

                {/* Custom Size Addition */}
                <div className="flex gap-2 pt-1 border-t border-white/5">
                  <Input
                    placeholder="Or add custom size (e.g. Free Size, 42, UK 13)..."
                    value={customSizeInput}
                    onChange={(e) => setCustomSizeInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        addCustomSize()
                      }
                    }}
                    className="h-8 text-xs font-mono"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addCustomSize}
                    className="h-8 shrink-0 text-xs gap-1 border-white/10"
                  >
                    <Plus className="h-3 w-3" />
                    Add Size
                  </Button>
                </div>

                {/* Active Selected Sizes summary */}
                {selectedSizes.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    <span className="text-[10px] text-slate-500 uppercase font-mono">Catalog Sizes:</span>
                    {selectedSizes.map((s) => (
                      <span
                        key={s}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 text-[10px] font-mono font-bold"
                      >
                        <span>{s}</span>
                        <button
                          type="button"
                          onClick={() => toggleSize(s)}
                          className="hover:text-rose-400 text-slate-400 ml-0.5"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Feature Badges & Toggles */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-xl bg-[#0B101D] border border-white/[0.08]">
            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <Checkbox
                checked={isFeatured}
                onCheckedChange={(c) => setIsFeatured(Boolean(c))}
              />
              <span className="flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-amber-400" /> Featured
              </span>
            </label>

            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <Checkbox
                checked={isTrending}
                onCheckedChange={(c) => setIsTrending(Boolean(c))}
              />
              <span>Trending Drop</span>
            </label>

            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <Checkbox
                checked={isLimited}
                onCheckedChange={(c) => setIsLimited(Boolean(c))}
              />
              <span className="text-rose-400 font-semibold">Limited Run</span>
            </label>

            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <Checkbox
                checked={isNew}
                onCheckedChange={(c) => setIsNew(Boolean(c))}
              />
              <span className="text-emerald-400 font-semibold">New Arrival</span>
            </label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold gap-2"
            >
              <span>{isSaving ? "Saving to Cloud..." : product ? "Update Listing" : "Drop Product"}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
