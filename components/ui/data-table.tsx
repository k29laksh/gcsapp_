// components/ui/data-table.tsx
"use client"

import type React from "react"

import { useState, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Plus, Search, MoreHorizontal, Filter, ChevronUp, ChevronDown } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export interface Column<T> {
  key: string
  label: string
  sortable?: boolean
  render?: (value: any, item: T) => React.ReactNode
  className?: string
  mobilePriority?: boolean
}

export interface Action<T> {
  type: "view" | "edit" | "delete" | "download" | "custom"
  label?: string
  icon?: React.ReactNode
  href?: (item: T) => string
  onClick?: (item: T, e: React.MouseEvent) => void | Promise<void>
  condition?: (item: T) => boolean
}

export interface FilterConfig {
  key: string
  label: string
  type: "select"
  options: { value: string; label: string }[]
}

export interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  actions: Action<T>[]
  filters?: FilterConfig[]
  searchable?: boolean
  sortable?: boolean
  createButton?: {
    label: string
    href: string
  }
  title: string
  description: string
  isLoading?: boolean
  error?: any
  onDelete?: (id: string) => Promise<void>
  onDownload?: (id: string) => Promise<void>
  emptyMessage?: string
  renderMobileCard?: (item: T) => React.ReactNode
}

type SortDirection = "asc" | "desc"

export function DataTable<T extends { id: string }>({
  data,
  columns,
  actions,
  filters = [],
  searchable = true,
  sortable = true,
  createButton,
  title,
  description,
  isLoading = false,
  error = null,
  onDelete,
  onDownload,
  emptyMessage = "No data found",
  renderMobileCard,
}: DataTableProps<T>) {
  const router = useRouter()
  const { toast } = useToast()

  const [searchTerm, setSearchTerm] = useState("")
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({})
  const [sortField, setSortField] = useState<string>(columns[0]?.key || "")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")
  const [showFilters, setShowFilters] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<string | null>(null)

  // Initialize filters with "all" option like in second table
  const filterConfigs = useMemo(() => {
    return filters.map(filter => ({
      ...filter,
      options: [{ value: "all", label: `All ${filter.label}` }, ...filter.options],
    }))
  }, [filters])

  const filteredData = useMemo(() => {
    let filtered = [...data]

    // Apply search
    if (searchable && searchTerm) {
      filtered = filtered.filter((item) =>
        columns.some((column) => {
          const value = item[column.key as keyof T]
          return value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
        }),
      )
    }

    // Apply filters - updated to use object format like second table
    Object.entries(activeFilters).forEach(([key, value]) => {
      if (value !== "all") {
        filtered = filtered.filter((item) => item[key as keyof T] === value)
      }
    })

    // Apply sorting
    if (sortable && sortField) {
      filtered.sort((a, b) => {
        const aValue = a[sortField as keyof T]
        const bValue = b[sortField as keyof T]

        if (sortDirection === "asc") {
          return aValue > bValue ? 1 : -1
        } else {
          return aValue < bValue ? 1 : -1
        }
      })
    }

    return filtered
  }, [data, searchTerm, activeFilters, sortField, sortDirection, columns, searchable, sortable])

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("desc")
    }
  }

  // Get sort icon like in second table
  const getSortIcon = (field: string) => {
    if (sortField !== field) {
      return <ChevronUp className="w-3 h-3 opacity-50" />
    }
    return sortDirection === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
  }

  const handleDeleteClick = (itemId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setItemToDelete(itemId)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!itemToDelete || !onDelete) return

    try {
      await onDelete(itemToDelete)
      toast({
        title: "Success",
        description: "Item deleted successfully",
      })
    } catch (error: any) {
      console.error("Error deleting item:", error)
      toast({
        title: "Error",
        description: error?.data?.message || "Failed to delete item",
        variant: "destructive",
      })
    } finally {
      setDeleteDialogOpen(false)
      setItemToDelete(null)
    }
  }

  const handleActionClick = async (action: Action<T>, item: T, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    try {
      if (action.type === "delete") {
        handleDeleteClick(item.id, e)
      } else if (action.type === "download" && onDownload) {
        await onDownload(item.id)
      } else if (action.onClick) {
        await action.onClick(item, e)
      } else if (action.href) {
        router.push(action.href(item))
      }
    } catch (error) {
      console.error("Error performing action:", error)
      toast({
        title: "Error",
        description: "Failed to perform action",
        variant: "destructive",
      })
    }
  }

  // Updated filter methods like in second table
  const clearFilters = () => {
    setActiveFilters({})
    setSearchTerm("")
  }

  const hasActiveFilters = Object.values(activeFilters).some(value => value !== "all") || searchTerm

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6 flex items-center justify-center">
        <Card className="p-6 text-center">
          <h2 className="text-lg font-semibold text-red-600 mb-2">Error Loading Data</h2>
          <p className="text-muted-foreground">Failed to load data. Please try again later.</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="px-4 md:px-6 py-4">
          {/* Header Section */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold">{title}</h1>
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
            </div>
            {createButton && (
              <Link href={createButton.href}>
                <Button className="gap-2 w-full md:w-auto">
                  <Plus className="w-4 h-4" />
                  {createButton.label}
                </Button>
              </Link>
            )}
          </div>

          <div className="flex flex-col gap-3">
            {/* Search and Filter Bar - Updated like second table */}
            <div className="flex flex-col md:flex-row gap-4">
              {searchable && (
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search..."
                    className="pl-10 bg-gray-100 border-0"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              )}
              {(filters.length > 0 || hasActiveFilters) && (
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className="gap-2 bg-white"
                >
                  <Filter className="w-4 h-4" />
                  Filters
                  {hasActiveFilters && (
                    <span className="bg-blue-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">
                      {Object.values(activeFilters).filter(v => v !== "all").length + (searchTerm ? 1 : 0)}
                    </span>
                  )}
                </Button>
              )}
            </div>

            {/* Expandable Filters - Updated like second table */}
            {showFilters && (filters.length > 0 || searchTerm) && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg bg-gray-50">
                {filterConfigs.map((filter) => (
                  <div key={filter.key}>
                    <label className="text-sm font-medium mb-2 block">{filter.label}</label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-sm"
                      value={activeFilters[filter.key] || "all"}
                      onChange={(e) => setActiveFilters(prev => ({ ...prev, [filter.key]: e.target.value }))}
                    >
                      {filter.options.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
                <div className="flex items-end">
                  <Button variant="outline" onClick={clearFilters} className="w-full">
                    Clear Filters
                  </Button>
                </div>
              </div>
            )}

            {/* Sort Options - Updated like second table */}
            {sortable && (
              <div className="flex gap-2 flex-wrap">
                {columns
                  .filter(column => column.sortable)
                  .map(column => (
                    <button
                      key={column.key}
                      onClick={() => handleSort(column.key)}
                      className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors ${
                        sortField === column.key ? "bg-zinc-800 text-white" : "bg-gray-200 hover:bg-gray-300"
                      }`}
                    >
                      {column.label} {getSortIcon(column.key)}
                    </button>
                  ))}
              </div>
            )}

            {/* Active filters display */}
            {hasActiveFilters && (
              <div className="flex flex-wrap gap-2">
                {Object.entries(activeFilters)
                  .filter(([_, value]) => value !== "all")
                  .map(([key, value]) => {
                    const filter = filters.find(f => f.key === key)
                    const option = filter?.options.find(o => o.value === value)
                    return (
                      <Badge key={`${key}-${value}`} variant="secondary" className="cursor-pointer">
                        {option?.label || value}
                        <span 
                          className="ml-1 hover:text-red-600"
                          onClick={() => setActiveFilters(prev => ({ ...prev, [key]: "all" }))}
                        >
                          ×
                        </span>
                      </Badge>
                    )
                  })}
                {searchTerm && (
                  <Badge variant="secondary" className="cursor-pointer">
                    Search: {searchTerm}
                    <span 
                      className="ml-1 hover:text-red-600"
                      onClick={() => setSearchTerm("")}
                    >
                      ×
                    </span>
                  </Badge>
                )}
                {hasActiveFilters && (
                  <Badge
                    variant="outline"
                    className="cursor-pointer text-red-600 hover:text-red-700"
                    onClick={clearFilters}
                  >
                    Clear All
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="px-4 md:px-6 py-4">
        <Card className="border-gray-200 overflow-hidden">
          <div className="md:hidden space-y-3 p-4">
            {isLoading ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : filteredData.length === 0 ? (
              <div className="text-center py-8 text-gray-500">{emptyMessage}</div>
            ) : renderMobileCard ? (
              filteredData.map((item) => renderMobileCard(item))
            ) : (
              filteredData.map((item, index) => (
                <div key={item.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-start gap-2">
                      <span className="text-sm font-semibold text-gray-400 mt-1">{index + 1}</span>
                      <div>
                        {columns.slice(0, 1).map((column) => (
                          <p key={column.key} className="font-semibold text-gray-900">
                            {column.render
                              ? column.render(item[column.key as keyof T], item)
                              : String(item[column.key as keyof T] || "")}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1 mb-3">
                    {columns.slice(1, 3).map((column) => (
                      <p key={column.key}>
                        {column.label}:{" "}
                        {column.render
                          ? column.render(item[column.key as keyof T], item)
                          : String(item[column.key as keyof T] || "N/A")}
                      </p>
                    ))}
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {actions.map((action, index) => (
                      <Button
                        key={index}
                        size="sm"
                        variant="outline"
                        onClick={(e) => handleActionClick(action, item, e)}
                        className={action.type === "delete" ? "text-red-600 bg-transparent" : ""}
                      >
                        {action.icon}
                        {action.label}
                      </Button>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="hidden md:block overflow-x-auto">
            {isLoading ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-4 py-3 text-left w-12 text-sm font-semibold text-gray-700">#</th>
                    {columns.map((column) => (
                      <th
                        key={column.key}
                        className={`px-4 py-3 text-left text-sm font-semibold text-gray-700 ${column.className || ""}`}
                      >
                        {column.sortable ? (
                          <button
                            onClick={() => handleSort(column.key)}
                            className="flex items-center gap-1 hover:text-blue-600 transition-colors"
                          >
                            {column.label} {getSortIcon(column.key)}
                          </button>
                        ) : (
                          column.label
                        )}
                      </th>
                    ))}
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 w-20">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.length === 0 ? (
                    <tr>
                      <td colSpan={columns.length + 2} className="px-4 py-8 text-center text-gray-500">
                        {emptyMessage}
                      </td>
                    </tr>
                  ) : (
                    filteredData.map((item, index) => (
                      <tr key={item.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-sm text-gray-600 font-medium">{index + 1}</td>
                        {columns.map((column) => (
                          <td key={column.key} className={`px-4 py-3 text-sm text-gray-900 ${column.className || ""}`}>
                            {column.render
                              ? column.render(item[column.key as keyof T], item)
                              : String(item[column.key as keyof T] || "")}
                          </td>
                        ))}
                        <td className="px-4 py-3 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {actions.map((action, index) => (
                                <DropdownMenuItem
                                  key={index}
                                  onClick={(e) => handleActionClick(action, item, e)}
                                  className={action.type === "delete" ? "text-red-600 focus:text-red-600" : ""}
                                >
                                  {action.icon}
                                  {action.label}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </Card>

        {!isLoading && (
          <div className="mt-6 text-sm text-gray-600 text-center">
            Showing {filteredData.length} of {data.length} items
          </div>
        )}
      </main>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the item.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}