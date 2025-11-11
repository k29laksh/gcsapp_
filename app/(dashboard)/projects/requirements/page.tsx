"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DataTable } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Plus, Search, Filter, FileText, CheckCircle, AlertCircle, Clock, Eye, Edit, X } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import type { ColumnDef } from "@tanstack/react-table"
import { 
  useGetRequirementsQuery, 
  useAddRequirementMutation,
  useUpdateRequirementMutation,
  useDeleteRequirementMutation 
} from "@/redux/Service/requirements"
import { useGetProjectsQuery } from "@/redux/Service/projects"

// Updated interface based on your API response
interface Requirement {
  id: string
  title: string
  description: string
  type: string
  priority: string
  status: string
  project: string
}

export default function RequirementsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [activeTab, setActiveTab] = useState("all")
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [selectedRequirement, setSelectedRequirement] = useState<Requirement | null>(null)
  
  const [newRequirement, setNewRequirement] = useState({
    title: "",
    description: "",
    type: "Functional",
    priority: "Medium",
    status: "Draft",
    project: "",
  })

  const [editRequirement, setEditRequirement] = useState({
    title: "",
    description: "",
    type: "Functional",
    priority: "Medium",
    status: "Draft",
    project: "",
  })

  const router = useRouter()
  const { toast } = useToast()

  // RTK Query hooks
  const { data: requirements = [], isLoading, error, refetch } = useGetRequirementsQuery()
  const { data: projectsData = [], isLoading: isLoadingProjects } = useGetProjectsQuery()
  const [addRequirement, { isLoading: isAdding }] = useAddRequirementMutation()
  const [updateRequirement, { isLoading: isUpdating }] = useUpdateRequirementMutation()
  const [deleteRequirement, { isLoading: isDeleting }] = useDeleteRequirementMutation()

  // Set default project when projects are loaded
  useEffect(() => {
    if (!isLoadingProjects && projectsData.length > 0 && !newRequirement.project) {
      setNewRequirement((prev) => ({ ...prev, project: projectsData[0].id }))
    }
  }, [projectsData, isLoadingProjects, newRequirement.project])

  // Filter requirements based on search and filters
  const filteredRequirements = requirements.filter((req: Requirement) => {
    // Apply tab filter
    if (activeTab !== "all" && req.status !== activeTab) {
      return false
    }

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      if (!req.title.toLowerCase().includes(searchLower) && 
          !req.description.toLowerCase().includes(searchLower)) {
        return false
      }
    }

    // Apply status filter
    if (statusFilter !== "all" && req.status !== statusFilter) {
      return false
    }

    // Apply type filter
    if (typeFilter !== "all" && req.type !== typeFilter) {
      return false
    }

    // Apply priority filter
    if (priorityFilter !== "all" && req.priority !== priorityFilter) {
      return false
    }

    return true
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setNewRequirement((prev) => ({ ...prev, [name]: value }))
  }

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setEditRequirement((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setNewRequirement((prev) => ({ ...prev, [name]: value }))
  }

  const handleEditSelectChange = (name: string, value: string) => {
    setEditRequirement((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      await addRequirement(newRequirement).unwrap()

      // Reset form
      setNewRequirement({
        title: "",
        description: "",
        type: "Functional",
        priority: "Medium",
        status: "Draft",
        project: newRequirement.project, // Keep the same project selected
      })

      toast({
        title: "Success",
        description: "Requirement created successfully",
      })
    } catch (error) {
      console.error("Error creating requirement:", error)
      toast({
        title: "Error",
        description: "Failed to create requirement",
        variant: "destructive",
      })
    }
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedRequirement) return

    try {
      await updateRequirement({
        requirementId: selectedRequirement.id,
        ...editRequirement
      }).unwrap()

      setEditModalOpen(false)
      setSelectedRequirement(null)

      toast({
        title: "Success",
        description: "Requirement updated successfully",
      })
    } catch (error) {
      console.error("Error updating requirement:", error)
      toast({
        title: "Error",
        description: "Failed to update requirement",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (requirementId: string) => {
    try {
      await deleteRequirement(requirementId).unwrap()
      
      toast({
        title: "Success",
        description: "Requirement deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting requirement:", error)
      toast({
        title: "Error",
        description: "Failed to delete requirement",
        variant: "destructive",
      })
    }
  }

  const openViewModal = (requirement: Requirement) => {
    setSelectedRequirement(requirement)
    setViewModalOpen(true)
  }

  const openEditModal = (requirement: Requirement) => {
    setSelectedRequirement(requirement)
    setEditRequirement({
      title: requirement.title,
      description: requirement.description,
      type: requirement.type,
      priority: requirement.priority,
      status: requirement.status,
      project: requirement.project,
    })
    setEditModalOpen(true)
  }

  const closeModals = () => {
    setViewModalOpen(false)
    setEditModalOpen(false)
    setSelectedRequirement(null)
  }

  const clearFilters = () => {
    setSearchTerm("")
    setStatusFilter("all")
    setTypeFilter("all")
    setPriorityFilter("all")
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Draft":
        return <Badge variant="outline">Draft</Badge>
      case "Approved":
        return <Badge className="bg-green-500">Approved</Badge>
      case "Rejected":
        return <Badge className="bg-red-500">Rejected</Badge>
      case "In Progress":
        return <Badge className="bg-amber-500">In Progress</Badge>
      case "Implemented":
        return <Badge className="bg-blue-500">Implemented</Badge>
      case "Verified":
        return <Badge className="bg-purple-500">Verified</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "Low":
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-100">
            Low
          </Badge>
        )
      case "Medium":
        return (
          <Badge variant="outline" className="bg-amber-100 text-amber-800 hover:bg-amber-100">
            Medium
          </Badge>
        )
      case "High":
        return (
          <Badge variant="outline" className="bg-orange-100 text-orange-800 hover:bg-orange-100">
            High
          </Badge>
        )
      case "Critical":
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-100">
            Critical
          </Badge>
        )
      default:
        return <Badge variant="outline">{priority}</Badge>
    }
  }

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "Functional":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">
            Functional
          </Badge>
        )
      case "Non-Functional":
        return (
          <Badge variant="outline" className="bg-purple-100 text-purple-800 hover:bg-purple-100">
            Non-Functional
          </Badge>
        )
      case "Technical":
        return (
          <Badge variant="outline" className="bg-cyan-100 text-cyan-800 hover:bg-cyan-100">
            Technical
          </Badge>
        )
      case "Business":
        return (
          <Badge variant="outline" className="bg-indigo-100 text-indigo-800 hover:bg-indigo-100">
            Business
          </Badge>
        )
      default:
        return <Badge variant="outline">{type}</Badge>
    }
  }

  const columns: ColumnDef<Requirement>[] = [
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => (
        <div>
          <div className="font-medium hover:underline cursor-pointer" onClick={() => openViewModal(row.original)}>
            {row.original.title}
          </div>
          <p className="truncate text-xs text-muted-foreground">
            {row.original.description.substring(0, 60)}...
          </p>
        </div>
      ),
    },
    {
      accessorKey: "project",
      header: "Project ID",
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground">
          {row.original.project.substring(0, 8)}...
        </div>
      ),
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => getTypeBadge(row.original.type),
    },
    {
      accessorKey: "priority",
      header: "Priority",
      cell: ({ row }) => getPriorityBadge(row.original.priority),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => getStatusBadge(row.original.status),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        return (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => openViewModal(row.original)}>
              <Eye className="h-4 w-4" />
              <span className="sr-only">View</span>
            </Button>
            <Button variant="ghost" size="icon" onClick={() => openEditModal(row.original)}>
              <Edit className="h-4 w-4" />
              <span className="sr-only">Edit</span>
            </Button>
          </div>
        )
      },
    },
  ]

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h3 className="text-lg font-medium">Error loading requirements</h3>
          <p className="text-muted-foreground">Please try again later</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* View Modal */}
      {viewModalOpen && selectedRequirement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold">Requirement Details</h3>
              <Button variant="ghost" size="icon" onClick={closeModals}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <Label className="font-semibold">Title</Label>
                <p className="mt-1">{selectedRequirement.title}</p>
              </div>
              <div>
                <Label className="font-semibold">Description</Label>
                <p className="mt-1 whitespace-pre-line">{selectedRequirement.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-semibold">Type</Label>
                  <div className="mt-1">{getTypeBadge(selectedRequirement.type)}</div>
                </div>
                <div>
                  <Label className="font-semibold">Priority</Label>
                  <div className="mt-1">{getPriorityBadge(selectedRequirement.priority)}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-semibold">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedRequirement.status)}</div>
                </div>
                <div>
                  <Label className="font-semibold">Project ID</Label>
                  <p className="mt-1 text-sm text-muted-foreground">{selectedRequirement.project}</p>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 p-6 border-t">
              <Button variant="outline" onClick={closeModals}>
                Close
              </Button>
              <Button onClick={() => {
                closeModals();
                openEditModal(selectedRequirement);
              }}>
                Edit Requirement
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModalOpen && selectedRequirement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleEditSubmit}>
              <div className="flex items-center justify-between p-6 border-b">
                <h3 className="text-lg font-semibold">Edit Requirement</h3>
                <Button variant="ghost" size="icon" onClick={closeModals}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <Label htmlFor="edit-title">Requirement Title</Label>
                  <Input
                    id="edit-title"
                    name="title"
                    value={editRequirement.title}
                    onChange={handleEditInputChange}
                    placeholder="Enter requirement title"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    name="description"
                    value={editRequirement.description}
                    onChange={handleEditInputChange}
                    placeholder="Describe the requirement in detail"
                    rows={4}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-type">Type</Label>
                    <Select value={editRequirement.type} onValueChange={(value) => handleEditSelectChange("type", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Functional">Functional</SelectItem>
                        <SelectItem value="Non-Functional">Non-Functional</SelectItem>
                        <SelectItem value="Technical">Technical</SelectItem>
                        <SelectItem value="Business">Business</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="edit-priority">Priority</Label>
                    <Select
                      value={editRequirement.priority}
                      onValueChange={(value) => handleEditSelectChange("priority", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Low">Low</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="High">High</SelectItem>
                        <SelectItem value="Critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-status">Status</Label>
                    <Select
                      value={editRequirement.status}
                      onValueChange={(value) => handleEditSelectChange("status", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Draft">Draft</SelectItem>
                        <SelectItem value="In Progress">In Progress</SelectItem>
                        <SelectItem value="Approved">Approved</SelectItem>
                        <SelectItem value="Rejected">Rejected</SelectItem>
                        <SelectItem value="Implemented">Implemented</SelectItem>
                        <SelectItem value="Verified">Verified</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="edit-project">Project</Label>
                    <Select
                      value={editRequirement.project}
                      onValueChange={(value) => handleEditSelectChange("project", value)}
                      disabled={isLoadingProjects}
                    >
                      <SelectTrigger>
                        {isLoadingProjects ? (
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Loading projects...
                          </div>
                        ) : (
                          <SelectValue placeholder="Select project" />
                        )}
                      </SelectTrigger>
                      <SelectContent>
                        {projectsData.map((project: any) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <div className="flex justify-between p-6 border-t">
                <Button 
                  type="button" 
                  variant="destructive" 
                  onClick={() => handleDelete(selectedRequirement.id)}
                  disabled={isDeleting}
                >
                  {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Delete Requirement
                </Button>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={closeModals}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isUpdating}>
                    {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isUpdating ? "Updating..." : "Update Requirement"}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Requirements Management</h2>
          <p className="text-muted-foreground">Manage and track project requirements</p>
        </div>
        <Button asChild>
          <Link href="/projects/requirements/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Requirement
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="all" onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Requirements</TabsTrigger>
          <TabsTrigger value="Draft">
            <Clock className="mr-2 h-4 w-4" />
            Draft
          </TabsTrigger>
          <TabsTrigger value="In Progress">
            <AlertCircle className="mr-2 h-4 w-4" />
            In Progress
          </TabsTrigger>
          <TabsTrigger value="Approved">
            <CheckCircle className="mr-2 h-4 w-4" />
            Approved
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {/* Quick Add Form and Data Table remain the same */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Add Requirement</CardTitle>
              <CardDescription>Create a new requirement for your project</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Quick Add Form remains the same as before */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="title">Requirement Title</Label>
                    <Input
                      id="title"
                      name="title"
                      value={newRequirement.title}
                      onChange={handleInputChange}
                      placeholder="Enter requirement title"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="project">Project</Label>
                    <Select
                      value={newRequirement.project}
                      onValueChange={(value) => handleSelectChange("project", value)}
                      disabled={isLoadingProjects}
                    >
                      <SelectTrigger>
                        {isLoadingProjects ? (
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Loading projects...
                          </div>
                        ) : (
                          <SelectValue placeholder="Select project" />
                        )}
                      </SelectTrigger>
                      <SelectContent>
                        {projectsData.map((project: any) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={newRequirement.description}
                    onChange={handleInputChange}
                    placeholder="Describe the requirement in detail"
                    rows={3}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div>
                    <Label htmlFor="type">Type</Label>
                    <Select value={newRequirement.type} onValueChange={(value) => handleSelectChange("type", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Functional">Functional</SelectItem>
                        <SelectItem value="Non-Functional">Non-Functional</SelectItem>
                        <SelectItem value="Technical">Technical</SelectItem>
                        <SelectItem value="Business">Business</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="priority">Priority</Label>
                    <Select
                      value={newRequirement.priority}
                      onValueChange={(value) => handleSelectChange("priority", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Low">Low</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="High">High</SelectItem>
                        <SelectItem value="Critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={newRequirement.status}
                      onValueChange={(value) => handleSelectChange("status", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Draft">Draft</SelectItem>
                        <SelectItem value="In Progress">In Progress</SelectItem>
                        <SelectItem value="Approved">Approved</SelectItem>
                        <SelectItem value="Rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={isAdding}>
                    {isAdding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isAdding ? "Creating..." : "Create Requirement"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search requirements..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="Draft">Draft</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="Approved">Approved</SelectItem>
                      <SelectItem value="Rejected">Rejected</SelectItem>
                      <SelectItem value="Implemented">Implemented</SelectItem>
                      <SelectItem value="Verified">Verified</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="Functional">Functional</SelectItem>
                      <SelectItem value="Non-Functional">Non-Functional</SelectItem>
                      <SelectItem value="Technical">Technical</SelectItem>
                      <SelectItem value="Business">Business</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="Filter by priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priorities</SelectItem>
                      <SelectItem value="Low">Low</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button variant="outline" size="icon" onClick={clearFilters}>
                    <Filter className="h-4 w-4" />
                    <span className="sr-only">Clear filters</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <DataTable columns={columns} data={filteredRequirements} loading={isLoading} />
        </TabsContent>

        {["Draft", "In Progress", "Approved"].map((status) => (
          <TabsContent key={status} value={status} className="space-y-4">
            <DataTable 
              columns={columns} 
              data={requirements.filter((req: Requirement) => req.status === status)} 
              loading={isLoading} 
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
