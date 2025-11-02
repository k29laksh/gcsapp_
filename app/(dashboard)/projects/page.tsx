"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { X, Eye, Edit, Trash2, Plus, MoreHorizontal, ChevronDown, Grid, List } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { useGetProjectsQuery, useDeleteProjectMutation } from "@/redux/Service/projects"
import { formatCurrency, formatDate, getStatusColor } from "@/lib/utils"

const SORT_OPTIONS = [
  { label: "Status", value: "Status" },
  { label: "Project Name", value: "Project Name" },
  { label: "Priority", value: "Priority" },
  { label: "Design Phase", value: "Design Phase" },
  { label: "Start Date", value: "Start Date" },
  { label: "End Date", value: "End Date" },
  { label: "Budget", value: "Budget" },
  { label: "Value", value: "Value" },
]

export default function ProjectsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [viewMode, setViewMode] = useState("list")
  const [sortBy, setSortBy] = useState("Status")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [statusFilter, setStatusFilter] = useState<string[]>([])
  const [priorityFilter, setPriorityFilter] = useState<string[]>([])

  const { data: projectsData, isLoading, error } = useGetProjectsQuery()
  const [deleteProject] = useDeleteProjectMutation()

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this project?")) return

    try {
      await deleteProject(id).unwrap()
      toast({
        title: "Success",
        description: "Project deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting project:", error)
      toast({
        title: "Error",
        description: "Failed to delete project",
        variant: "destructive",
      })
    }
  }

  const filteredAndSortedProjects = useMemo(() => {
    const filtered = (projectsData || []).filter((project: any) => {
      const matchesSearch =
        project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.id.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus = statusFilter.length === 0 || statusFilter.includes(project.status)
      const matchesPriority = priorityFilter.length === 0 || priorityFilter.includes(project.priority)

      return matchesSearch && matchesStatus && matchesPriority
    })

    filtered.sort((a: any, b: any) => {
      let compareValue = 0

      switch (sortBy) {
        case "Project Name":
          compareValue = a.name.localeCompare(b.name)
          break
        case "Priority":
          compareValue = a.priority.localeCompare(b.priority)
          break
        case "Design Phase":
          compareValue = a.design_phase.localeCompare(b.design_phase)
          break
        case "Start Date":
          compareValue = new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
          break
        case "End Date":
          compareValue = new Date(a.end_date).getTime() - new Date(b.end_date).getTime()
          break
        case "Budget":
          compareValue = (a.budget || 0) - (b.budget || 0)
          break
        case "Value":
          compareValue = (a.value || 0) - (b.value || 0)
          break
        case "Status":
        default:
          compareValue = a.status.localeCompare(b.status)
      }

      return sortDirection === "desc" ? -compareValue : compareValue
    })

    return filtered
  }, [projectsData, searchTerm, sortBy, sortDirection, statusFilter, priorityFilter])

  const uniqueStatuses = useMemo(() => [...new Set((projectsData || []).map((p: any) => p.status))], [projectsData])
  const uniquePriorities = useMemo(() => [...new Set((projectsData || []).map((p: any) => p.priority))], [projectsData])

  const toggleStatusFilter = (status: string) => {
    setStatusFilter((prev) => (prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]))
  }

  const togglePriorityFilter = (priority: string) => {
    setPriorityFilter((prev) => (prev.includes(priority) ? prev.filter((p) => p !== priority) : [...prev, priority]))
  }

  const clearAllFilters = () => {
    setStatusFilter([])
    setPriorityFilter([])
    setSearchTerm("")
  }

  const hasActiveFilters = statusFilter.length > 0 || priorityFilter.length > 0

  const truncateId = (id: string, maxLength = 4) => {
    return id.length > maxLength ? id.substring(0, maxLength) + "..." : id
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="px-4 md:px-6 py-4">
          <div className="flex items-center justify-end mb-4">

            <div className="flex items-center gap-2">
             

              <Button
                size="sm"
                className="hidden sm:flex bg-black hover:bg-gray-800 text-white"
                onClick={() => router.push("/projects/new")}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Project
              </Button>

              <Button
                size="icon"
                className="sm:hidden bg-black hover:bg-gray-800 text-white"
                onClick={() => router.push("/projects/new")}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center justify-between">
              <div className="w-full sm:flex-1 max-w-sm">
                <Input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="text-sm bg-gray-100 border-0"
                />
              </div>

              <div className="flex gap-2 items-center w-full sm:w-auto">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className={`bg-white ${hasActiveFilters ? "border-blue-500" : ""}`}
                    >
                      <MoreHorizontal className="h-4 w-4 mr-2" />
                      Filter
                      {hasActiveFilters && <X className="h-4 w-4 ml-2" />}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56">
                    <div className="p-3 border-b">
                      <h3 className="text-sm font-semibold mb-2">Status</h3>
                      {uniqueStatuses.map((status) => (
                        <label key={status} className="flex items-center gap-2 mb-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={statusFilter.includes(status)}
                            onChange={() => toggleStatusFilter(status)}
                            className="rounded"
                          />
                          <span className="text-sm">{status}</span>
                        </label>
                      ))}
                    </div>
                    <div className="p-3 border-b">
                      <h3 className="text-sm font-semibold mb-2">Priority</h3>
                      {uniquePriorities.map((priority) => (
                        <label key={priority} className="flex items-center gap-2 mb-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={priorityFilter.includes(priority)}
                            onChange={() => togglePriorityFilter(priority)}
                            className="rounded"
                          />
                          <span className="text-sm">{priority}</span>
                        </label>
                      ))}
                    </div>
                    {hasActiveFilters && (
                      <div className="p-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={clearAllFilters}
                          className="w-full text-red-600 hover:text-red-700"
                        >
                          Clear All Filters
                        </Button>
                      </div>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="bg-white">
                      {sortBy}
                      <ChevronDown className="h-4 w-4 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52">
                    <div className="p-2 border-b">
                      <h3 className="text-xs font-semibold text-gray-600 uppercase mb-2 px-2">Sort By</h3>
                      {SORT_OPTIONS.map((option) => (
                        <DropdownMenuItem key={option.value} onClick={() => setSortBy(option.value)}>
                          <span className={sortBy === option.value ? "font-semibold" : ""}>{option.label}</span>
                        </DropdownMenuItem>
                      ))}
                    </div>
                    <div className="p-2">
                      <h3 className="text-xs font-semibold text-gray-600 uppercase mb-2 px-2">Direction</h3>
                      <DropdownMenuItem onClick={() => setSortDirection("asc")}>
                        <span className={sortDirection === "asc" ? "font-semibold" : ""}>Ascending</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSortDirection("desc")}>
                        <span className={sortDirection === "desc" ? "font-semibold" : ""}>Descending</span>
                      </DropdownMenuItem>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {hasActiveFilters && (
              <div className="flex flex-wrap gap-2">
                {statusFilter.map((status) => (
                  <Badge key={status} variant="secondary" className="cursor-pointer">
                    {status}
                    <X className="h-3 w-3 ml-1" onClick={() => toggleStatusFilter(status)} />
                  </Badge>
                ))}
                {priorityFilter.map((priority) => (
                  <Badge key={priority} variant="secondary" className="cursor-pointer">
                    {priority}
                    <X className="h-3 w-3 ml-1" onClick={() => togglePriorityFilter(priority)} />
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="px-4 md:px-6 py-4">
        <Card className="border-gray-200 overflow-hidden">
          {(viewMode === "grid" || true) && (
            <div className="md:hidden space-y-3 p-4">
              {isLoading ? (
                <div className="text-center py-8 text-gray-500">Loading projects...</div>
              ) : error ? (
                <div className="text-center py-8 text-red-500">Error loading projects</div>
              ) : filteredAndSortedProjects.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No projects found</div>
              ) : (
                filteredAndSortedProjects.map((project: any, index: number) => (
                  <div key={project.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-start gap-2">
                        <span className="text-sm font-semibold text-gray-400 mt-1">{index + 1}</span>
                        <div>
                          <p className="font-semibold text-gray-900">{project.name}</p>
                          <p className="text-xs text-gray-600">{truncateId(project.id)}</p>
                        </div>
                      </div>
                      <Badge className={getStatusColor(project.status)}>{project.status}</Badge>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1 mb-3">
                      <p>Type: {project.type}</p>
                      <p>Value: {project.value ? formatCurrency(project.value) : "-"}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => router.push(`/projects/${project.id}`)}>
                        View
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => router.push(`/projects/${project.id}/edit`)}>
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 bg-transparent"
                        onClick={() => handleDelete(project.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-4 py-3 text-left w-12 text-sm font-semibold text-gray-700">#</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 min-w-[150px]">
                    Project Name
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 min-w-[100px]">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 min-w-[120px]">
                    Project Type
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 min-w-[130px]">
                    Expected End...
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 min-w-[120px]">
                    Estimated Cost
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 min-w-[80px]">ID</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 w-20">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                      Loading projects...
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-red-500">
                      Error loading projects
                    </td>
                  </tr>
                ) : filteredAndSortedProjects.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                      {projectsData?.length === 0 ? "No projects found" : "No projects match your filters"}
                    </td>
                  </tr>
                ) : (
                  filteredAndSortedProjects.map((project: any, index: number) => (
                    <tr key={project.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm text-gray-600 font-medium">{index + 1}</td>
                      <td className="px-4 py-3">
                        <span
                          className="text-sm font-medium text-gray-900 cursor-pointer hover:text-blue-600"
                          onClick={() => router.push(`/projects/${project.id}`)}
                        >
                          {project.name}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={getStatusColor(project.status)}>{project.status}</Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{project.type}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {project.end_date ? formatDate(project.end_date) : "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                        {project.value ? formatCurrency(project.value) : "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">{truncateId(project.id)}</td>
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => router.push(`/projects/${project.id}`)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push(`/projects/${project.id}/edit`)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(project.id)} className="text-red-600">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </main>
    </div>
  )
}
