"use client"

import { useRouter, useParams } from "next/navigation"
import { ChevronLeft, Calendar, DollarSign, FileText, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useGetProjectsQuery } from "@/redux/Service/projects"
import { formatCurrency, formatDate } from "@/lib/utils"

export default function ProjectDetailPage() {
  const router = useRouter()
  const params = useParams()
  const projectId = params.id as string

  const { data: projectsData, isLoading, error } = useGetProjectsQuery()

  const project = projectsData?.find((p: any) => p.id === projectId)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading project...</p>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="px-4 md:px-6 py-4">
          <Button variant="ghost" onClick={() => router.back()} className="mb-4">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-lg text-gray-600">Project not found</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="px-4 md:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
          </div>
          <Badge className="text-sm  px-4 py-2">{project.status}</Badge>
        </div>
      </header>

      <main className="px-4 md:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Project ID</label>
                  <p className="text-gray-900 font-medium">{project.id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Project Name</label>
                  <p className="text-gray-900 font-medium">{project.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Status</label>
                  <Badge className="mt-1 mx-2">{project.status}</Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Priority</label>
                  <Badge variant="outline" className="mt-1 mx-2">
                    {project.priority}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Type</label>
                  <p className="text-gray-900">{project.type}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Design Phase</label>
                  <p className="text-gray-900">{project.design_phase}</p>
                </div>
              </div>
            </Card>

            {/* Dates */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Timeline</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Start Date
                  </label>
                  <p className="text-gray-900 font-medium">{formatDate(project.start_date)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    End Date
                  </label>
                  <p className="text-gray-900 font-medium">{formatDate(project.end_date)}</p>
                </div>
              </div>
            </Card>

            {/* Financial Information */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Financial Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    Budget
                  </label>
                  <p className="text-gray-900 font-medium text-lg">{formatCurrency(project.budget)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    Value
                  </label>
                  <p className="text-gray-900 font-medium text-lg">{formatCurrency(project.value)}</p>
                </div>
              </div>
            </Card>

            {/* Classifications */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Classifications</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Regulatory Body</label>
                  <p className="text-gray-900">{project.regulatory_body || "-"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Classification Society</label>
                  <p className="text-gray-900">{project.classification_society || "-"}</p>
                </div>
              </div>
            </Card>

            {/* Description */}
            {project.description && (
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Description
                </h2>
                <p className="text-gray-700 leading-relaxed">{project.description}</p>
              </Card>
            )}

            {/* Terms */}
            {project.terms && (
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Terms</h2>
                <p className="text-gray-700 leading-relaxed">{project.terms}</p>
              </Card>
            )}

            {/* Notes */}
            {project.notes && (
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Notes</h2>
                <p className="text-gray-700 leading-relaxed">{project.notes}</p>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status Card */}
            <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100">
              <h3 className="text-sm font-semibold text-gray-600 uppercase mb-2">Current Status</h3>
              <p className="text-2xl font-bold text-gray-900">{project.status}</p>
              <Badge className="mt-4">{project.priority} Priority</Badge>
            </Card>

            {/* Quick Stats */}
            <Card className="p-6">
              <h3 className="text-sm font-semibold text-gray-600 uppercase mb-4">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center pb-3 border-b">
                  <span className="text-sm text-gray-600">Payments Enabled</span>
                  <Badge variant={project.enable_payments ? "default" : "secondary"}>
                    {project.enable_payments ? "Yes" : "No"}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Budget vs Value</span>
                  <span className="text-sm font-medium">
                    {project.budget && project.value ? `${Math.round((project.value / project.budget) * 100)}%` : "-"}
                  </span>
                </div>
              </div>
            </Card>

            {/* Action Buttons */}
            <div className="space-y-2">
              <Button className="w-full" onClick={() => router.push(`/projects/${project.id}/edit`)}>
                Edit Project
              </Button>
              <Button variant="outline" className="w-full bg-transparent" onClick={() => router.back()}>
                Back to Projects
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
