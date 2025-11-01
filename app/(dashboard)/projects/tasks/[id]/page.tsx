"use client"

import { useState } from "react"
import { Textarea } from "@/components/ui/textarea"
import { notFound, useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Pencil, ArrowLeft, CheckCircle, Clock, MessageSquare, FileText } from "lucide-react"
import { useGetSingleTaskQuery, useUpdateTaskMutation } from "@/redux/Service/tasks"
import { useToast } from "@/components/ui/use-toast"

export default function TaskPage() {
  const params = useParams()
  const taskId = params.id as string
  const { toast } = useToast()
  
  const { data: task, isLoading, error } = useGetSingleTaskQuery(taskId)
  const [updateTask] = useUpdateTaskMutation()

  const [comment, setComment] = useState("")

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">Loading task details...</div>
      </div>
    )
  }

  if (error || !task) {
    notFound()
  }

  const handleMarkComplete = async () => {
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link href="/projects/tasks">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back</span>
            </Link>
          </Button>
          <div>
            <h2 className="text-2xl font-bold">{task.title}</h2>
            <div className="text-sm text-muted-foreground">
              {task.plan_number} • Phase: {task.project_phase}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {task.status !== "Completed" && (
            <>
              <Button variant="outline" asChild>
                <Link href={`/projects/tasks/${task.id}/edit`}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </Link>
              </Button>
              <Button variant="default" className="bg-green-600 hover:bg-green-700" onClick={handleMarkComplete}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Mark Complete
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Task Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-sm font-medium mb-2">Description</h3>
              <div className="p-4 bg-muted rounded-md whitespace-pre-line">
                {task.description || "No description provided."}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium mb-2">Status</h3>
                <div>{getStatusBadge(task.status)}</div>
              </div>
              <div>
                <h3 className="text-sm font-medium mb-2">Priority</h3>
                <div>{getPriorityBadge(task.priority)}</div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-2">Progress</h3>
              <div className="space-y-2">
                <Progress value={task.completion} className="h-2 w-full" />
                <div className="text-sm text-right">{task.completion}% complete</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium mb-2">Due Date</h3>
                <div>{formatDate(task.due_date)}</div>
              </div>
              <div>
                <h3 className="text-sm font-medium mb-2">Estimated Hours</h3>
                <div>{task.estimated_hours} hours</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium mb-2">Project Phase</h3>
                <div>{task.project_phase}</div>
              </div>
              <div>
                <h3 className="text-sm font-medium mb-2">Task Type</h3>
                <div>{task.type}</div>
              </div>
            </div>

            {task.dependencies && (
              <div>
                <h3 className="text-sm font-medium mb-2">Dependencies</h3>
                <div className="p-3 bg-muted rounded-md">{task.dependencies}</div>
              </div>
            )}

            {task.notes && (
              <div>
                <h3 className="text-sm font-medium mb-2">Notes</h3>
                <div className="p-3 bg-muted rounded-md">{task.notes}</div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Assignment</CardTitle>
          </CardHeader>
          <CardContent>
            {task.assigned_to ? (
              <div className="flex flex-col items-center">
                <Avatar className="h-20 w-20">
                  <AvatarImage src="/placeholder.svg" alt={task.assigned_to} />
                  <AvatarFallback>{getInitials(task.assigned_to)}</AvatarFallback>
                </Avatar>
                <h3 className="mt-4 text-lg font-semibold">{task.assigned_to}</h3>
                <p className="text-muted-foreground">Assigned User</p>

                <div className="mt-6 w-full">
                  <Button variant="outline" className="w-full">
                    <Clock className="mr-2 h-4 w-4" />
                    Log Time
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center py-6">
                <p className="text-muted-foreground mb-4">No one is assigned to this task</p>
                <Button variant="outline">Assign Task</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="comments">
        <TabsList>
          <TabsTrigger value="comments">
            <MessageSquare className="h-4 w-4 mr-2" />
            Comments
          </TabsTrigger>
          <TabsTrigger value="details">
            <FileText className="h-4 w-4 mr-2" />
            Additional Details
          </TabsTrigger>
        </TabsList>
        <TabsContent value="comments">
          <Card>
            <CardHeader>
              <CardTitle>Comments</CardTitle>
              <CardDescription>Task discussion and updates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">No comments yet</div>

              <div className="mt-6">
                <Textarea 
                  placeholder="Add a comment..." 
                  className="mb-2" 
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
                <div className="flex justify-end">
                  <Button>Post Comment</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>Additional Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium mb-2">Plan Type</h3>
                  <div>{task.plan_type}</div>
                </div>
                <div>
                  <h3 className="text-sm font-medium mb-2">Revision</h3>
                  <div>{task.revision}</div>
                </div>
                <div>
                  <h3 className="text-sm font-medium mb-2">Regulatory Approval</h3>
                  <div>{task.regulatory_approval ? "Required" : "Not Required"}</div>
                </div>
                <div>
                  <h3 className="text-sm font-medium mb-2">Project ID</h3>
                  <div className="text-sm font-mono">{task.project}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}