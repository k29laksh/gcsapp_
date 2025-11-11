"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/data-table"
import { Eye, Pencil, Plus, Trash2, CheckCircle } from "lucide-react"
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
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { ColumnDef } from "@tanstack/react-table"
import { 
  useGetTasksQuery, 
  useDeleteTaskMutation,
  useUpdateTaskMutation 
} from "@/redux/Service/tasks"

// Updated interface based on your API response
interface Task {
  id: string
  project_phase: string
  title: string
  description: string
  type: string
  plan_type: string
  plan_number: string
  revision: string
  due_date: string
  status: string
  priority: string
  estimated_hours: number
  completion: number
  regulatory_approval: boolean
  dependencies: string
  notes: string
  project: string
  assigned_to: string
}

export default function TasksPage() {
  const [activeTab, setActiveTab] = useState("all")
  const { toast } = useToast()
  
  // RTK Query hooks
  const { data: tasks = [], isLoading, error } = useGetTasksQuery()
  const [deleteTask] = useDeleteTaskMutation()
  const [updateTask] = useUpdateTaskMutation()

  // Filter tasks based on active tab
  const filteredTasks = tasks.filter(task => {
    if (activeTab === "all") return true
    return task.status.toLowerCase() === activeTab.toLowerCase()
  })

  const handleDelete = async (id: string) => {
    try {
      await deleteTask(id).unwrap()
      toast({
        title: "Success",
        description: "Task deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting task:", error)
      toast({
        title: "Error",
        description: "Failed to delete task",
        variant: "destructive",
      })
    }
  }

  const handleMarkComplete = async (task: Task) => {
    try {
      await updateTask({
        taskId: task.id,
        status: "Completed",
        completion: 100
      }).unwrap()
      
      toast({
        title: "Success",
        description: "Task marked as complete",
      })
    } catch (error) {
      console.error("Error marking task as complete:", error)
      toast({
        title: "Error",
        description: "Failed to mark task as complete",
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (status: string) => {
    const statusMap: { [key: string]: { color: string, label: string } } = {
      "To Do": { color: "bg-gray-500", label: "To Do" },
      "In Progress": { color: "bg-blue-500", label: "In Progress" },
      "Review": { color: "bg-yellow-500", label: "Review" },
      "Completed": { color: "bg-green-500", label: "Completed" },
      "Blocked": { color: "bg-red-500", label: "Blocked" },
    }

    const statusConfig = statusMap[status] || { color: "bg-gray-500", label: status }
    return <Badge className={statusConfig.color}>{statusConfig.label}</Badge>
  }

  const getPriorityBadge = (priority: string) => {
    const priorityMap: { [key: string]: { color: string } } = {
      "Low": { color: "bg-gray-500" },
      "Medium": { color: "bg-blue-500" },
      "High": { color: "bg-orange-500" },
      "Urgent": { color: "bg-red-500" },
    }

    const priorityConfig = priorityMap[priority] || { color: "bg-gray-500" }
    return <Badge className={priorityConfig.color}>{priority}</Badge>
  }

  const getInitials = (name: string) => {
    return name ? name.charAt(0).toUpperCase() : "U"
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const columns: ColumnDef<Task>[] = [
    {
      accessorKey: "plan_number",
      header: "Plan #",
    },
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => {
        const task = row.original
        return (
          <div>
            <div className="font-medium">{task.title}</div>
            <div className="text-xs text-muted-foreground">
              Phase: {task.project_phase} • Type: {task.type}
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "assigned_to",
      header: "Assigned To",
      cell: ({ row }) => {
        const assignedTo = row.original.assigned_to
        if (!assignedTo) return "Unassigned"

        return (
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src="/placeholder.svg" alt="Assignee" />
              <AvatarFallback>{getInitials(assignedTo)}</AvatarFallback>
            </Avatar>
            <div>
              <div className="text-sm">{assignedTo}</div>
              <div className="text-xs text-muted-foreground">Assignee</div>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "due_date",
      header: "Due Date",
      cell: ({ row }) => formatDate(row.original.due_date),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => getStatusBadge(row.original.status),
    },
    {
      accessorKey: "priority",
      header: "Priority",
      cell: ({ row }) => getPriorityBadge(row.original.priority),
    },
    {
      accessorKey: "completion",
      header: "Progress",
      cell: ({ row }) => {
        const progress = row.original.completion
        return (
          <div className="w-full">
            <Progress value={progress} className="h-2 w-full" />
            <div className="mt-1 text-xs text-right">{progress}%</div>
          </div>
        )
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const task = row.original

        return (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild>
              <Link href={`/projects/tasks/${task.id}`}>
                <Eye className="h-4 w-4" />
                <span className="sr-only">View</span>
              </Link>
            </Button>
            <Button variant="ghost" size="icon" asChild>
              <Link href={`/projects/tasks/${task.id}/edit`}>
                <Pencil className="h-4 w-4" />
                <span className="sr-only">Edit</span>
              </Link>
            </Button>
            {task.status !== "Completed" && (
              <Button variant="ghost" size="icon" onClick={() => handleMarkComplete(task)}>
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="sr-only">Complete</span>
              </Button>
            )}
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
                  <AlertDialogDescription>
                    This will permanently delete this task and all associated data.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleDelete(task.id)}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )
      },
    },
  ]

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h3 className="text-lg font-medium">Error loading tasks</h3>
          <p className="text-muted-foreground">Please try again later</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <h2 className="text-2xl font-bold">Project Tasks</h2>
        <Button asChild>
          <Link href="/projects/tasks/new">
            <Plus className="mr-2 h-4 w-4" />
            Create Task
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tasks.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tasks.filter(task => task.status === "In Progress").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tasks.filter(task => task.status === "Completed").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {tasks.filter(task => new Date(task.due_date) < new Date() && task.status !== "Completed").length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Tasks</TabsTrigger>
          <TabsTrigger value="to do">To Do</TabsTrigger>
          <TabsTrigger value="in progress">In Progress</TabsTrigger>
          <TabsTrigger value="review">Review</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>
        
        {["all", "to do", "in progress", "review", "completed"].map((tab) => (
          <TabsContent key={tab} value={tab}>
            <Card>
              <CardHeader>
                <CardTitle>
                  {tab === "all" ? "All Tasks" : `${tab.charAt(0).toUpperCase() + tab.slice(1)} Tasks`}
                </CardTitle>
                <CardDescription>
                  {tab === "all" 
                    ? "View and manage all project tasks" 
                    : `Tasks that are ${tab.toLowerCase()}`
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="text-center">Loading tasks...</div>
                  </div>
                ) : (
                  <DataTable 
                    columns={columns} 
                    data={filteredTasks} 
                    searchKey="title" 
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}