import * as React from "react"
import { useState, useMemo } from "react"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Download,
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

export interface ColumnDef<T> {
  key: string
  header: string
  sortable?: boolean
  render?: (row: T) => React.ReactNode
  accessor?: (row: T) => string | number | boolean | null | undefined
}

export interface DataTableProps<T> {
  data: T[]
  columns: ColumnDef<T>[]
  keyExtractor: (row: T) => string
  searchKey?: keyof T | ((row: T) => string)
  searchPlaceholder?: string
  isLoading?: boolean
  emptyMessage?: string
  onRowClick?: (row: T) => void
  bulkActions?: {
    label: string
    onClick: (selectedRows: T[]) => void
    variant?: "default" | "destructive" | "outline" | "secondary"
  }[]
  filterComponent?: React.ReactNode
  pageSize?: number
  exportFilename?: string
}

export function DataTable<T extends Record<string, unknown>>({
  data,
  columns,
  keyExtractor,
  searchKey,
  searchPlaceholder = "Search records...",
  isLoading = false,
  emptyMessage = "No matching records found.",
  onRowClick,
  bulkActions = [],
  filterComponent,
  pageSize = 10,
  exportFilename = "revara-export",
}: DataTableProps<T>) {
  const [search, setSearch] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(pageSize)
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set())
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set(columns.map((c) => c.key))
  )

  // Filter by search query
  const filteredData = useMemo(() => {
    if (!search.trim()) return data

    const query = search.toLowerCase()
    return data.filter((row) => {
      if (typeof searchKey === "function") {
        return searchKey(row).toLowerCase().includes(query)
      }
      if (searchKey) {
        const val = row[searchKey]
        return String(val ?? "").toLowerCase().includes(query)
      }
      return Object.values(row).some((val) =>
        String(val ?? "").toLowerCase().includes(query)
      )
    })
  }, [data, search, searchKey])

  // Sorting
  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData

    const col = columns.find((c) => c.key === sortKey)
    return [...filteredData].sort((a, b) => {
      const valA = col?.accessor ? col.accessor(a) : a[sortKey]
      const valB = col?.accessor ? col.accessor(b) : b[sortKey]

      if (valA === valB) return 0
      if (valA === null || valA === undefined) return 1
      if (valB === null || valB === undefined) return -1

      if (typeof valA === "number" && typeof valB === "number") {
        return sortDirection === "asc" ? valA - valB : valB - valA
      }

      const strA = String(valA).toLowerCase()
      const strB = String(valB).toLowerCase()
      return sortDirection === "asc"
        ? strA.localeCompare(strB)
        : strB.localeCompare(strA)
    })
  }, [filteredData, sortKey, sortDirection, columns])

  // Pagination
  const totalPages = Math.ceil(sortedData.length / rowsPerPage) || 1
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage
    return sortedData.slice(start, start + rowsPerPage)
  }, [sortedData, currentPage, rowsPerPage])

  // Selection
  const allPageKeysSelected =
    paginatedData.length > 0 &&
    paginatedData.every((row) => selectedKeys.has(keyExtractor(row)))

  const toggleSelectAll = () => {
    const newSelected = new Set(selectedKeys)
    if (allPageKeysSelected) {
      paginatedData.forEach((row) => newSelected.delete(keyExtractor(row)))
    } else {
      paginatedData.forEach((row) => newSelected.add(keyExtractor(row)))
    }
    setSelectedKeys(newSelected)
  }

  const toggleSelectRow = (key: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const newSelected = new Set(selectedKeys)
    if (newSelected.has(key)) {
      newSelected.delete(key)
    } else {
      newSelected.add(key)
    }
    setSelectedKeys(newSelected)
  }

  const selectedRows = useMemo(() => {
    return data.filter((row) => selectedKeys.has(keyExtractor(row)))
  }, [data, selectedKeys, keyExtractor])

  // Sort click handler
  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortDirection === "asc") {
        setSortDirection("desc")
      } else {
        setSortKey(null)
        setSortDirection("asc")
      }
    } else {
      setSortKey(key)
      setSortDirection("asc")
    }
  }

  // Export to CSV
  const handleExportCSV = () => {
    const activeCols = columns.filter((c) => visibleColumns.has(c.key))
    const headers = activeCols.map((c) => `"${c.header.replace(/"/g, '""')}"`).join(",")

    const rows = sortedData.map((row) => {
      return activeCols
        .map((col) => {
          const val = col.accessor ? col.accessor(row) : row[col.key]
          return `"${String(val ?? "").replace(/"/g, '""')}"`
        })
        .join(",")
    })

    const csvContent = [headers, ...rows].join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${exportFilename}-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-3.5">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-500" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setCurrentPage(1)
              }}
              placeholder={searchPlaceholder}
              className="pl-8 h-8 text-xs"
            />
          </div>
          {filterComponent}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Bulk actions */}
          {selectedKeys.size > 0 && (
            <div className="flex items-center gap-1.5 bg-indigo-500/10 border border-indigo-500/30 px-2.5 py-1 rounded-lg">
              <span className="text-[11px] font-semibold text-indigo-300">
                {selectedKeys.size} selected
              </span>
              {bulkActions.map((action, idx) => (
                <Button
                  key={idx}
                  size="sm"
                  variant={action.variant || "secondary"}
                  onClick={() => action.onClick(selectedRows)}
                  className="h-6 text-[10px] px-2"
                >
                  {action.label}
                </Button>
              ))}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelectedKeys(new Set())}
                className="h-6 text-[10px] px-1.5 text-slate-400 hover:text-white"
              >
                Clear
              </Button>
            </div>
          )}

          {/* Column Visibility */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {columns.map((col) => (
                <DropdownMenuCheckboxItem
                  key={col.key}
                  checked={visibleColumns.has(col.key)}
                  onCheckedChange={(checked) => {
                    const next = new Set(visibleColumns)
                    if (checked) next.add(col.key)
                    else if (next.size > 1) next.delete(col.key)
                    setVisibleColumns(next)
                  }}
                >
                  {col.header}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Export CSV */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="h-8 gap-1.5 text-xs"
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="rounded-xl border border-white/[0.08] bg-[#131B2E] overflow-hidden shadow-xl">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={allPageKeysSelected}
                  onCheckedChange={toggleSelectAll}
                  aria-label="Select all on page"
                />
              </TableHead>
              {columns
                .filter((c) => visibleColumns.has(c.key))
                .map((col) => (
                  <TableHead
                    key={col.key}
                    onClick={() => col.sortable && handleSort(col.key)}
                    className={col.sortable ? "cursor-pointer select-none" : ""}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{col.header}</span>
                      {col.sortable && (
                        <span className="text-slate-500">
                          {sortKey === col.key ? (
                            sortDirection === "asc" ? (
                              <ArrowUp className="h-3 w-3 text-indigo-400" />
                            ) : (
                              <ArrowDown className="h-3 w-3 text-indigo-400" />
                            )
                          ) : (
                            <ArrowUpDown className="h-3 w-3" />
                          )}
                        </span>
                      )}
                    </div>
                  </TableHead>
                ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <TableRow key={idx}>
                  <TableCell>
                    <Skeleton className="h-4 w-4" />
                  </TableCell>
                  {columns
                    .filter((c) => visibleColumns.has(c.key))
                    .map((col) => (
                      <TableCell key={col.key}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                </TableRow>
              ))
            ) : paginatedData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={visibleColumns.size + 1}
                  className="h-32 text-center text-slate-400"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((row) => {
                const key = keyExtractor(row)
                const isSelected = selectedKeys.has(key)
                return (
                  <TableRow
                    key={key}
                    data-state={isSelected ? "selected" : undefined}
                    onClick={() => onRowClick && onRowClick(row)}
                    className={onRowClick ? "cursor-pointer" : ""}
                  >
                    <TableCell onClick={(e) => toggleSelectRow(key, e)}>
                      <Checkbox
                        checked={isSelected}
                        aria-label={`Select row ${key}`}
                      />
                    </TableCell>
                    {columns
                      .filter((c) => visibleColumns.has(c.key))
                      .map((col) => (
                        <TableCell key={col.key}>
                          {col.render
                            ? col.render(row)
                            : String(
                                col.accessor
                                  ? col.accessor(row) ?? "—"
                                  : row[col.key] ?? "—"
                              )}
                        </TableCell>
                      ))}
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>

        {/* Pagination Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-white/[0.05] bg-[#0E1524]/60 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span>
              Showing{" "}
              <strong className="text-white font-tabular">
                {sortedData.length === 0
                  ? 0
                  : (currentPage - 1) * rowsPerPage + 1}
                -
                {Math.min(currentPage * rowsPerPage, sortedData.length)}
              </strong>{" "}
              of <strong className="text-white font-tabular">{sortedData.length}</strong> records
            </span>

            <select
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value))
                setCurrentPage(1)
              }}
              className="bg-[#0B101D] border border-white/10 rounded px-2 py-0.5 text-xs text-slate-200 focus:outline-none"
            >
              <option value={10}>10 per page</option>
              <option value={20}>20 per page</option>
              <option value={50}>50 per page</option>
              <option value={100}>100 per page</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs mr-2">
              Page <strong className="text-white font-tabular">{currentPage}</strong> of{" "}
              <strong className="text-white font-tabular">{totalPages}</strong>
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage <= 1}
            >
              <ChevronsLeft className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage >= totalPages}
            >
              <ChevronsRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
