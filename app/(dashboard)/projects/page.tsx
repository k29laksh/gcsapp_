"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import type { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, Eye, Edit, Trash2, Plus, Ship } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { DataTableEnhanced } from "@/components/ui/data-table-enhanced"
import { PageHeader } from "@/components/ui/page-header"
import { formatCurrency, formatDate, getStatusColor } from "@/lib/utils"
import { useGetProjectsQuery, useDeleteProjectMutation } from "@/redux/Service/projects"

interface Project {
  id: string
  name: string
  type: string
  description?: string
  status: string
  priority: string
  design_phase: string
  regulatory_body: string
  classification_society: string
  start_date: string
  end_date?: string
  terms?: string
  notes?: string
  budget: number
  value: number
  enable_payments: boolean
  customer: string
  vessel: string
  manager: string
}

interface ProjectWithRelations extends Project {
  customerDetails?: {
    id: string
    companyName?: string
    firstName?: string
    lastName?: string
  }
  vesselDetails?: {
    id: string
    vesselName: string
    vesselType: string
  }
  managerDetails?: {
    id: string
    firstName: string
    lastName: string
  }
}

export default function ProjectsPage() {
  const router = useRouter()
  const { toast } = useToast()
  
  // RTK Query hooks
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

  const columns: ColumnDef<Project>[] = [
    {
      accessorKey: "name",
      header: "Project Name",
      cell: ({ row }) => <div className="max-w-[200px] truncate">{row.getValue("name")}</div>,
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => <div>{row.getValue("type")}</div>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string
        return <Badge className={getStatusColor(status)}>{status}</Badge>
      },
    },
    {
      accessorKey: "priority",
      header: "Priority",
      cell: ({ row }) => {
        const priority = row.getValue("priority") as string
        const priorityColors = {
          LOW: "bg-gray-100 text-gray-800",
          MEDIUM: "bg-blue-100 text-blue-800",
          HIGH: "bg-orange-100 text-orange-800",
          URGENT: "bg-red-100 text-red-800",
          CRITICAL: "bg-red-100 text-red-800",
        }
        return (
          <Badge className={priorityColors[priority as keyof typeof priorityColors] || "bg-gray-100 text-gray-800"}>
            {priority}
          </Badge>
        )
      },
    },
    {
      accessorKey: "design_phase",
      header: "Design Phase",
      cell: ({ row }) => <div>{row.getValue("design_phase")}</div>,
    },
    {
      accessorKey: "start_date",
      header: "Start Date",
      cell: ({ row }) => formatDate(row.getValue("start_date")),
    },
    {
      accessorKey: "end_date",
      header: "End Date",
      cell: ({ row }) => {
        const endDate = row.getValue("end_date") as string
        return endDate ? formatDate(endDate) : "-"
      },
    },
    {
      accessorKey: "value",
      header: "Contract Value",
      cell: ({ row }) => {
        const value = row.getValue("value") as number
        return value ? formatCurrency(value) : "-"
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const project = row.original

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => router.push(`/projects/${project.id}`)}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push(`/projects/${project.id}/edit`)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleDelete(project.id)} className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  const breadcrumbs = [{ label: "Projects" }]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Marine Projects"
        description="Manage your marine design and engineering projects"
        breadcrumbs={breadcrumbs}
        action={
          <Button onClick={() => router.push("/projects/new")}>
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Button>
        }
      />

      <DataTableEnhanced
        columns={columns}
        data={projectsData || []}
        searchKey="name"
        searchPlaceholder="Search projects..."
        onAdd={() => router.push("/projects/new")}
        addLabel="New Project"
        loading={isLoading}
      />
    </div>
  )
}