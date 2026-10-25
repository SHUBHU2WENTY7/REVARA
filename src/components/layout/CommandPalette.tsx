import { useEffect } from "react"
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command"
import {
  BarChart3,
  Activity,
  ShoppingBag,
  Package,
  Layers,
  Repeat,
  Wallet,
  Users,
  Star,
  Tag,
  Bell,
  MapPin,
  ShieldCheck,
  Settings,
  Plus,
  RefreshCw,
} from "lucide-react"
import type { TabId } from "@/types"
import { useDashboardData } from "@/hooks/useDashboardData"

export interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectTab: (tab: TabId) => void
  onOpenBroadcastModal: () => void
  onOpenProductModal: () => void
}

export function CommandPalette({
  open,
  onOpenChange,
  onSelectTab,
  onOpenBroadcastModal,
  onOpenProductModal,
}: CommandPaletteProps) {
  const { state, refreshData } = useDashboardData()

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        onOpenChange(!open)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [open, onOpenChange])

  const runCommand = (command: () => void) => {
    onOpenChange(false)
    command()
  }

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Type a command, tab, product, or order..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Quick Actions">
          <CommandItem
            onSelect={() => runCommand(onOpenProductModal)}
            className="gap-2 cursor-pointer"
          >
            <Plus className="h-4 w-4 text-indigo-400" />
            <span>Drop New Product</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(onOpenBroadcastModal)}
            className="gap-2 cursor-pointer"
          >
            <Bell className="h-4 w-4 text-amber-400" />
            <span>Broadcast Push Alert</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => refreshData())}
            className="gap-2 cursor-pointer"
          >
            <RefreshCw className="h-4 w-4 text-cyan-400" />
            <span>Force Cloud Resync</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => runCommand(() => onSelectTab("overview"))} className="gap-2">
            <BarChart3 className="h-4 w-4 text-slate-400" />
            <span>Executive Overview</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => onSelectTab("activity"))} className="gap-2">
            <Activity className="h-4 w-4 text-slate-400" />
            <span>Live Operations Feed</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => onSelectTab("orders"))} className="gap-2">
            <ShoppingBag className="h-4 w-4 text-slate-400" />
            <span>Order Fulfillment</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => onSelectTab("products"))} className="gap-2">
            <Package className="h-4 w-4 text-slate-400" />
            <span>Product Catalog</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => onSelectTab("inventory"))} className="gap-2">
            <Layers className="h-4 w-4 text-slate-400" />
            <span>Stock Radar</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => onSelectTab("exchanges"))} className="gap-2">
            <Repeat className="h-4 w-4 text-slate-400" />
            <span>Garments Trade-In Studio</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => onSelectTab("wallets"))} className="gap-2">
            <Wallet className="h-4 w-4 text-slate-400" />
            <span>Wallets & Credit Ledger</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => onSelectTab("users"))} className="gap-2">
            <Users className="h-4 w-4 text-slate-400" />
            <span>Customer 360 CRM</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => onSelectTab("reviews"))} className="gap-2">
            <Star className="h-4 w-4 text-slate-400" />
            <span>Reviews & UGC</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => onSelectTab("coupons"))} className="gap-2">
            <Tag className="h-4 w-4 text-slate-400" />
            <span>Coupons & Promotions</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => onSelectTab("serviceability"))} className="gap-2">
            <MapPin className="h-4 w-4 text-slate-400" />
            <span>PIN Codes & Serviceability</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => onSelectTab("audit_logs"))} className="gap-2">
            <ShieldCheck className="h-4 w-4 text-slate-400" />
            <span>Forensic Audit Trail</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => onSelectTab("settings"))} className="gap-2">
            <Settings className="h-4 w-4 text-slate-400" />
            <span>Database Settings</span>
          </CommandItem>
        </CommandGroup>

        {state.products.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Recent Products">
              {state.products.slice(0, 5).map((p) => (
                <CommandItem
                  key={p.id}
                  onSelect={() => runCommand(() => onSelectTab("products"))}
                  className="gap-2"
                >
                  <Package className="h-4 w-4 text-indigo-400" />
                  <span className="truncate">{p.name}</span>
                  <span className="ml-auto text-[10px] font-mono text-slate-500">{p.sku}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  )
}
