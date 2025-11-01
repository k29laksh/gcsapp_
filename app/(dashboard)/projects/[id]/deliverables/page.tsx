"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/data-table"
import { useToast } from "@/components/ui/use-toast"
import {
  ArrowLeft,
  Plus,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  Download,
  Upload,
  Edit,
  Trash2,
} from "lucide-react"
import { format } from "date-fns"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface Project {
  id: string
  name: string
  projectCode: string
  client?: {
    companyName: string
    firstName: string
    lastName: string
    email: string
    phone: string
    address: string
  }
  vessel?: {
    vesselName: string
    vesselType: string
    imoNumber: string
    classificationSociety: string
  }
  projectManager?: {
    firstName: string
    lastName: string
    email: string
    phone: string
  }
}

interface Deliverable {
  id: string
  irsProjectId: string
  irsPassword: string
  documentTitle: string
  documentNumber: string
  latestRevisionNumber: string
  planCategory: string
  status: string
  transmittalDate: string | null
  submittedDate: string | null
  approvedDate: string | null
  reminderDays: number
  remarks: string
  invoiceRaised: boolean
  planMadeBy: string
  planWithIRS: string
  contactDetails: string
  createdAt: string
  updatedAt: string
}

export default function ProjectDeliverablesPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [project, setProject] = useState<Project | null>(null)
  const [deliverables, setDeliverables] = useState<Deliverable[]>([])
  const [loading, setLoading] = useState(true)

  const projectId = params.id as string

  useEffect(() => {
    fetchProject()
    fetchDeliverables()
  }, [projectId])

  const fetchProject = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}`)
      if (!response.ok) throw new Error("Failed to fetch project")
      const data = await response.json()
      setProject(data)
    } catch (error) {
      console.error("Error fetching project:", error)
      toast({
        title: "Error",
        description: "Failed to load project details",
        variant: "destructive",
      })
    }
  }

  const fetchDeliverables = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/projects/${projectId}/deliverables`)
      if (!response.ok) throw new Error("Failed to fetch deliverables")
      const data = await response.json()
      setDeliverables(data)
    } catch (error) {
      console.error("Error fetching deliverables:", error)
      toast({
        title: "Error",
        description: "Failed to load deliverables",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/deliverables/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete deliverable")

      toast({
        title: "Success",
        description: "Deliverable deleted successfully",
      })

      fetchDeliverables()
    } catch (error) {
      console.error("Error deleting deliverable:", error)
      toast({
        title: "Error",
        description: "Failed to delete deliverable",
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; icon: any }> = {
      DRAFT: { color: "bg-gray-500", icon: FileText },
      SUBMITTED: { color: "bg-blue-500", icon: Upload },
      UNDER_REVIEW: { color: "bg-yellow-500", icon: Clock },
      APPROVED: { color: "bg-green-500", icon: CheckCircle },
      REJECTED: { color: "bg-red-500", icon: AlertTriangle },
      REVISION_REQUIRED: { color: "bg-orange-500", icon: Edit },
    }

    const config = statusConfig[status] || { color: "bg-gray-500", icon: FileText }
    const Icon = config.icon

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {status.replace(/_/g, " ")}
      </Badge>
    )
  }

  const getReminderBadge = (days: number) => {
    if (days > 30) return <Badge className="bg-green-500">{days} days</Badge>
    if (days > 7) return <Badge className="bg-yellow-500">{days} days</Badge>
    return <Badge className="bg-red-500">{days} days</Badge>
  }

  const columns = [
    {
      accessorKey: "irsProjectId",
      header: "IRS Project ID",
    },
    {
      accessorKey: "documentTitle",
      header: "Document/Plan Title",
      cell: ({ row }: any) => (
        <div className="max-w-xs truncate" title={row.original.documentTitle}>
          {row.original.documentTitle}
        </div>
      ),
    },
    {
      accessorKey: "documentNumber",
      header: "Document No.",
    },
    {
      accessorKey: "latestRevisionNumber",
      header: "Rev. No.",
    },
    {
      accessorKey: "planCategory",
      header: "Plan Category",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }: any) => getStatusBadge(row.original.status),
    },
    {
      accessorKey: "submittedDate",
      header: "Submitted Date",
      cell: ({ row }: any) =>
        row.original.submittedDate ? format(new Date(row.original.submittedDate), "dd/MM/yyyy") : "-",
    },
    {
      accessorKey: "approvedDate",
      header: "Approved Date",
      cell: ({ row }: any) =>
        row.original.approvedDate ? format(new Date(row.original.approvedDate), "dd/MM/yyyy") : "-",
    },
    {
      accessorKey: "reminderDays",
      header: "Reminder",
      cell: ({ row }: any) => getReminderBadge(row.original.reminderDays),
    },
    {
      accessorKey: "invoiceRaised",
      header: "Invoice",
      cell: ({ row }: any) => (
        <Badge className={row.original.invoiceRaised ? "bg-green-500" : "bg-gray-500"}>
          {row.original.invoiceRaised ? "Yes" : "No"}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }: any) => {
        const deliverable = row.original
        return (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild>
              <Link href={`/projects/${projectId}/deliverables/${deliverable.id}/edit`}>
                <Edit className="h-4 w-4" />
                <span className="sr-only">Edit</span>
              </Link>
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Delete</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>This will permanently delete this deliverable.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleDelete(deliverable.id)}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )
      },
    },
  ]

  if (!project) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading project...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/projects/${projectId}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Drawing Register</h1>
            <p className="text-gray-600">Plan Deliverables & Status Sheet</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" asChild>
            <Link href={`/projects/${projectId}/deliverables/register`}>
              <Download className="mr-2 h-4 w-4" />
              Export Register
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/projects/${projectId}/deliverables/new`}>
              <Plus className="mr-2 h-4 w-4" />
              Add Deliverable
            </Link>
          </Button>
        </div>
      </div>

      {/* Project Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Project Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="font-medium">Project ID:</span>
                <span>{project.projectCode}</span>
                <span className="font-medium">Project Name:</span>
                <span>{project.name}</span>
                <span className="font-medium">Vessel Name:</span>
                <span>{project.vessel?.vesselName || "N/A"}</span>
                <span className="font-medium">Company:</span>
                <span>{project.client?.companyName || `${project.client?.firstName} ${project.client?.lastName}`}</span>
                <span className="font-medium">Address:</span>
                <span>{project.client?.address || "N/A"}</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="font-medium">Project Incharge:</span>
                <span>
                  {project.projectManager
                    ? `${project.projectManager.firstName} ${project.projectManager.lastName}`
                    : "N/A"}
                </span>
                <span className="font-medium">Type of Vessel:</span>
                <span>{project.vessel?.vesselType || "N/A"}</span>
                <span className="font-medium">Contact Person:</span>
                <span>{project.client ? `${project.client.firstName} ${project.client.lastName}` : "N/A"}</span>
                <span className="font-medium">Phone No.:</span>
                <span>{project.client?.phone || "N/A"}</span>
                <span className="font-medium">Email ID:</span>
                <span>{project.client?.email || "N/A"}</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="font-medium">Project Completed:</span>
                <span>TBA</span>
                <span className="font-medium">Class of Ship:</span>
                <span>{project.vessel?.classificationSociety || "N/A"}</span>
                <span className="font-medium">Document No.:</span>
                <span>GCS/FF/05/06</span>
                <span className="font-medium">Issue:</span>
                <span>1, Rev: 1, Dt: {format(new Date(), "dd.MM.yyyy")}</span>
                <span className="font-medium">Invoice Raised:</span>
                <span>☐ Yes</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Plans</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{deliverables.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Submitted</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {deliverables.filter((d) => d.status === "SUBMITTED").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Under Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {deliverables.filter((d) => d.status === "UNDER_REVIEW").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {deliverables.filter((d) => d.status === "APPROVED").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {deliverables.filter((d) => d.reminderDays <= 7).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Deliverables Table */}
      <Card>
        <CardHeader>
          <CardTitle>Plan Deliverables</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={deliverables} loading={loading} />
        </CardContent>
      </Card>
    </div>
  )
}
