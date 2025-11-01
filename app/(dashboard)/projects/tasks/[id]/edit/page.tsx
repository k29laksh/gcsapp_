"use client"

import { useParams } from "next/navigation"
import { TaskForm } from "@/components/task-form"
import { useGetSingleTaskQuery } from "@/redux/Service/tasks"

export default function EditTaskPage() {
  const params = useParams()
  const taskId = params.id as string
  
  const { data: task, isLoading, error } = useGetSingleTaskQuery(taskId)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">Loading task details...</div>
      </div>
    )
  }

  if (error || !task) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h3 className="text-lg font-medium">Task not found</h3>
          <p className="text-muted-foreground">The task you're looking for doesn't exist.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Edit Task</h2>
      <TaskForm task={task} isEditing />
    </div>
  )
}