import { ChevronUp, ChevronDown } from "lucide-react"

export const getSortIcon = (field: string, sortField: string, sortDirection: "asc" | "desc") => {
  if (sortField !== field) {
    return <ChevronUp className="w-3 h-3 opacity-50" />
  }
  return sortDirection === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
}

export const formatCurrency = (amount: string | number, currency = "INR") => {
  const numAmount = typeof amount === "string" ? Number.parseFloat(amount) : amount
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currency,
    maximumFractionDigits: 2,
  }).format(numAmount)
}

export const formatDate = (dateString: string) => {
  if (!dateString) return "N/A"
  return new Date(dateString).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

export const shortenId = (id: string, length = 8) => {
  return `${id.slice(0, length)}...`
}

export const handleSort = (
  field: string,
  sortField: string,
  sortDirection: "asc" | "desc",
  setSortField: (field: string) => void,
  setSortDirection: (direction: "asc" | "desc") => void,
) => {
  if (sortField === field) {
    setSortDirection(sortDirection === "asc" ? "desc" : "asc")
  } else {
    setSortField(field)
    setSortDirection("desc")
  }
}
