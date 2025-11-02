"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ProjectForm } from "@/components/project-form"
import { useGetSingleProjectQuery } from "@/redux/Service/projects"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"

export default function EditProjectPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  // Use RTK Query to fetch the project
  const { data: project, isLoading, error, isError } = useGetSingleProjectQuery(id)

  // Transform the API data to match the form structure
  const [transformedProject, setTransformedProject] = useState<any>(null)

  useEffect(() => {
    if (project) {
      // Transform the API response to match the form structure
      const transformed = {
        id: project.id,
        name: project.name,
        type: project.type,
        description: project.description,
        status: project.status,
        priority: project.priority,
        design_phase: project.design_phase,
        regulatory_body: project.regulatory_body,
        classification_society: project.classification_society,
        start_date: project.start_date,
        end_date: project.end_date,
        terms: project.terms,
        notes: project.notes,
        budget: project.budget,
        value: project.value,
        enable_payments: project.enable_payments,
        customer: project.customer,
        vessel: project.vessel,
        manager: project.manager
      }
      setTransformedProject(transformed)
    }
  }, [project])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-lg">Loading project details...</p>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/projects">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h2 className="text-2xl font-bold">Edit Project</h2>
        </div>
        
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error && 'data' in error ? 
              `Failed to load project: ${(error as any).data?.message || 'Project not found'}` : 
              'Failed to load project. Please try again.'
            }
          </AlertDescription>
        </Alert>
        
        
      </div>
    )
  }

  if (!project && !isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/projects">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h2 className="text-2xl font-bold">Edit Project</h2>
        </div>
        
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Project not found. It may have been deleted or you don't have permission to access it.
          </AlertDescription>
        </Alert>
        
        <Button asChild>
          <Link href="/projects">
            Back to Projects
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      
      
      {transformedProject && (
        <ProjectForm project={transformedProject} isEditing />
      )}
    </div>
  )
}