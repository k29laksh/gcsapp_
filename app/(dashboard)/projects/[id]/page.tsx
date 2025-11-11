"use client"

import { useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ArrowLeft,
  Calendar,
  Users,
  Clock,
  Edit,
  Trash2,
  Plus,
  CheckCircle,
  AlertCircle,
  User,
  FileText,
  Ship,
  DollarSign,
  Target,
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
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
import { useGetSingleProjectQuery, useDeleteProjectMutation } from "@/redux/Service/projects"
import { useGetCustomersQuery } from "@/redux/Service/customer"
import { useGetEmployeeQuery } from "@/redux/Service/employee"
import { useGetVesselsQuery } from "@/redux/Service/vessel"

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  
  const id = params.id as string

  // RTK Query hooks
  const { data: project, isLoading, error } = useGetSingleProjectQuery(id)
  const [deleteProject] = useDeleteProjectMutation()

  // Fetch related data
  const { data: customers = [] } = useGetCustomersQuery()
  const { data: employees = [] } = useGetEmployeeQuery()
  const { data: vessels = [] } = useGetVesselsQuery()

  useEffect(() => {
    if (error) {
      console.error("Error fetching project:", error)
      toast({
        title: "Error",
        description: "Failed to load project details",
        variant: "destructive",
      })
    }
  }, [error, toast])

  const handleDelete = async () => {
    try {
      await deleteProject(id).unwrap()
      
      toast({
        title: "Success",
        description: "Project deleted successfully",
      })

      router.push("/projects")
    } catch (error) {
      console.error("Error deleting project:", error)
      toast({
        title: "Error",
        description: "Failed to delete project",
        variant: "destructive",
      })
    }
  }

  // Find related data
  const customer = customers.find((c: any) => c.id === project?.customer)
  const manager = employees.find((e: any) => e.id === project?.manager)
  const vessel = vessels.find((v: any) => v.id === project?.vessel)

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "bg-green-500"
      case "planning":
        return "bg-blue-500"
      case "in progress":
        return "bg-yellow-500"
      case "on hold":
        return "bg-orange-500"
      case "completed":
        return "bg-emerald-500"
      case "cancelled":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case "low":
        return "bg-green-500"
      case "medium":
        return "bg-yellow-500"
      case "high":
        return "bg-orange-500"
      case "urgent":
        return "bg-red-500"
      case "critical":
        return "bg-red-600"
      default:
        return "bg-gray-500"
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading project...</p>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Project not found</h2>
          <p className="mt-2 text-gray-600">The project you're looking for doesn't exist.</p>
          <Button asChild className="mt-4">
            <Link href="/projects">Back to Projects</Link>
          </Button>
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
            <Link href="/projects">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{project.name}</h1>
            <p className="text-gray-600">{project.description}</p>
            <div className="flex items-center gap-4 mt-1">
              <Badge variant="outline" className={getStatusColor(project.status)}>
                {project.status}
              </Badge>
              <Badge variant="outline" className={getPriorityColor(project.priority)}>
                {project.priority}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" asChild>
            <Link href={`/projects/${project.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete this project and all associated data.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Budget
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(project.budget)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4" />
              Contract Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(project.value)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <p className="text-sm">Start: {formatDate(project.start_date)}</p>
              <p className="text-sm">End: {formatDate(project.end_date)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={project.enable_payments ? "default" : "secondary"}>
              {project.enable_payments ? "Enabled" : "Disabled"}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Button asChild className="h-20 flex-col">
          <Link href={`/projects/${project.id}/deliverables`}>
            <FileText className="h-6 w-6 mb-2" />
            Drawing Register
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-20 flex-col">
          <Link href={`/projects/${project.id}/tasks`}>
            <CheckCircle className="h-6 w-6 mb-2" />
            Tasks
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-20 flex-col">
          <Link href={`/projects/${project.id}/time`}>
            <Clock className="h-6 w-6 mb-2" />
            Time Tracking
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-20 flex-col">
          <Link href={`/projects/${project.id}/team`}>
            <Users className="h-6 w-6 mb-2" />
            Team
          </Link>
        </Button>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="details">Project Details</TabsTrigger>
          <TabsTrigger value="commercial">Commercial</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Project Information */}
            <Card>
              <CardHeader>
                <CardTitle>Project Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Project Type</h4>
                  <p className="text-sm">{project.type}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Design Phase</h4>
                  <p className="text-sm">{project.design_phase}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Regulatory Body</h4>
                  <p className="text-sm">{project.regulatory_body}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Classification Society</h4>
                  <p className="text-sm">{project.classification_society}</p>
                </div>
              </CardContent>
            </Card>

            {/* Stakeholders */}
            <Card>
              <CardHeader>
                <CardTitle>Stakeholders</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <User className="h-5 w-5 text-gray-400" />
                  <div>
                    <h4 className="text-sm font-medium">Customer</h4>
                    <p className="text-sm text-gray-600">
                      {customer?.company_name || customer?.companyName || "No customer"}
                    </p>
                    {customer && (
                      <p className="text-xs text-gray-500">ID: {customer.id}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Users className="h-5 w-5 text-gray-400" />
                  <div>
                    <h4 className="text-sm font-medium">Project Manager</h4>
                    <p className="text-sm text-gray-600">
                      {manager?.name || "No manager assigned"}
                    </p>
                    {manager && (
                      <p className="text-xs text-gray-500">{manager.job_title}</p>
                    )}
                  </div>
                </div>

                {vessel && (
                  <div className="flex items-center space-x-3">
                    <Ship className="h-5 w-5 text-gray-400" />
                    <div>
                      <h4 className="text-sm font-medium">Vessel</h4>
                      <p className="text-sm text-gray-600">{vessel.name}</p>
                      <p className="text-xs text-gray-500">
                        {vessel.type} • IMO: {vessel.imo_number}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Terms and Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {project.terms && (
              <Card>
                <CardHeader>
                  <CardTitle>Terms & Conditions</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{project.terms}</p>
                </CardContent>
              </Card>
            )}

            {project.notes && (
              <Card>
                <CardHeader>
                  <CardTitle>Project Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{project.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Project Specifications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Project ID:</span>
                  <span className="text-sm text-gray-600">{project.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Type:</span>
                  <span className="text-sm text-gray-600">{project.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Status:</span>
                  <Badge className={getStatusColor(project.status)}>{project.status}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Priority:</span>
                  <Badge className={getPriorityColor(project.priority)}>{project.priority}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Design Phase:</span>
                  <span className="text-sm text-gray-600">{project.design_phase}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Regulatory Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Regulatory Body:</span>
                  <span className="text-sm text-gray-600">{project.regulatory_body}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Classification Society:</span>
                  <span className="text-sm text-gray-600">{project.classification_society}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="commercial" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Financial Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Project Budget:</span>
                  <span className="text-lg font-bold text-green-600">{formatCurrency(project.budget)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Contract Value:</span>
                  <span className="text-lg font-bold text-blue-600">{formatCurrency(project.value)}</span>
                </div>
                {project.budget > 0 && project.value > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Profit Margin:</span>
                    <span className={`text-lg font-bold ${
                      project.value - project.budget >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(project.value - project.budget)}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Milestone Payments:</span>
                  <Badge variant={project.enable_payments ? "default" : "secondary"}>
                    {project.enable_payments ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
                {project.terms && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Payment Terms:</h4>
                    <p className="text-sm text-gray-600">{project.terms}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Project Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-blue-500" />
                  <div>
                    <h4 className="text-sm font-medium">Start Date</h4>
                    <p className="text-sm text-gray-600">{formatDate(project.start_date)}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-green-500" />
                  <div>
                    <h4 className="text-sm font-medium">End Date</h4>
                    <p className="text-sm text-gray-600">{formatDate(project.end_date)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}