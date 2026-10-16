import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Layers, Plus, Trash2, Edit2, Check, X } from "lucide-react"
import { useDashboardData } from "@/hooks/useDashboardData"
import {
  createCategoryInSupabase,
  updateCategoryInSupabase,
  deleteCategoryInSupabase,
} from "@/lib/supabase"
import { toast } from "sonner"

export interface CategoryModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CategoryModal({ open, onOpenChange }: CategoryModalProps) {
  const { state, refreshData } = useDashboardData()
  const [newCatName, setNewCatName] = useState("")
  const [newCatSlug, setNewCatSlug] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCatName.trim()) return

    setIsSubmitting(true)
    try {
      const res = await createCategoryInSupabase({
        name: newCatName.trim(),
        slug: newCatSlug.trim() || undefined,
        sort_order: state.categories.length + 1,
      })
      if (res.error) throw res.error
      toast.success(`Created category "${newCatName}"`)
      setNewCatName("")
      setNewCatSlug("")
      await refreshData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create category.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSaveEdit = async (catId: string) => {
    if (!editingName.trim()) return
    try {
      const res = await updateCategoryInSupabase(catId, { name: editingName.trim() })
      if (res.error) throw res.error
      toast.success("Category updated!")
      setEditingId(null)
      await refreshData()
    } catch {
      toast.error("Failed to update category.")
    }
  }

  const handleDelete = async (catId: string, name: string) => {
    if (!confirm(`Are you sure you want to delete category "${name}"? Products in this category will be unlinked.`)) return
    try {
      const res = await deleteCategoryInSupabase(catId, name)
      if (res.error) throw res.error
      toast.success(`Deleted category "${name}"`)
      await refreshData()
    } catch {
      toast.error("Failed to delete category.")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
              <Layers className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle>Category Taxonomy Manager</DialogTitle>
              <DialogDescription>
                Manage collection categories for store navigation and drops.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Add New Category Form */}
        <form onSubmit={handleCreate} className="space-y-2 pt-2">
          <div className="flex gap-2">
            <Input
              required
              placeholder="New category name (e.g. Streetwear)"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              className="text-xs h-9"
            />
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-indigo-600 hover:bg-indigo-500 text-white shrink-0 h-9 gap-1"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add</span>
            </Button>
          </div>
        </form>

        {/* Category List */}
        <div className="space-y-1.5 max-h-64 overflow-y-auto pt-3 border-t border-white/[0.08]">
          {state.categories.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-4">No categories configured.</p>
          ) : (
            state.categories.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between p-2 rounded-lg bg-[#0B101D] border border-white/[0.06] text-xs"
              >
                {editingId === c.id ? (
                  <div className="flex items-center gap-1.5 flex-1 mr-2">
                    <Input
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="h-7 text-xs"
                    />
                    <Button
                      size="icon"
                      variant="emerald"
                      className="h-7 w-7"
                      onClick={() => handleSaveEdit(c.id)}
                    >
                      <Check className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-slate-400"
                      onClick={() => setEditingId(null)}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ) : (
                  <div>
                    <span className="font-semibold text-white">{c.name}</span>
                    <span className="text-[10px] text-slate-500 font-mono ml-2">
                      ({c.slug})
                    </span>
                  </div>
                )}

                {editingId !== c.id && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingId(c.id)
                        setEditingName(c.name)
                      }}
                      className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/10"
                    >
                      <Edit2 className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => handleDelete(c.id, c.name)}
                      className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
