"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2, ArrowRight } from "lucide-react"

interface Task {
  id: string
  title: string
  dueDate: string
  priority: string
  project: {
    name: string
  }
}

export function UpcomingTasks() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true)
        // Using try-catch to handle potential network errors
        const response = await fetch("/api/projects/tasks?upcoming=true")

        // Handle non-OK responses without throwing
        if (!response.ok) {
          console.error("Failed to fetch upcoming tasks:", response.status, response.statusText)
          setTasks([]) // Set empty tasks array instead of throwing
          return
        }

        const data = await response.json()
        setTasks(data.slice(0, 5)) // Show only 5 upcoming tasks
      } catch (error) {
        console.error("Error fetching upcoming tasks:", error)
        setTasks([]) // Set empty tasks on error
      } finally {
        setLoading(false)
      }
    }

    fetchTasks()
  }, [])

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "LOW":
        return "bg-gray-500"
      case "MEDIUM":
        return "bg-blue-500"
      case "HIGH":
        return "bg-orange-500"
      case "URGENT":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }

  if (loading) {
    return (
      <div className="flex h-[200px] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  if (tasks.length === 0) {
    return (
      <div className="flex h-[200px] flex-col items-center justify-center text-center">
        <p className="text-muted-foreground">No upcoming tasks</p>
        <Button variant="link" className="mt-2" onClick={() => router.push("/projects/tasks/new")}>
          Create a new task
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {tasks.map((task) => (
          <div key={task.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
            <div className="space-y-1">
              <p className="font-medium leading-none">{task.title}</p>
              <p className="text-xs text-muted-foreground">{task.project.name}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{formatDate(task.dueDate)}</Badge>
              <Badge className={getPriorityColor(task.priority)}>{task.priority}</Badge>
            </div>
          </div>
        ))}
      </div>

      <Button variant="outline" className="w-full" onClick={() => router.push("/projects/tasks")}>
        View All Tasks
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  )
}
