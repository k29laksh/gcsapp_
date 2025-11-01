"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePicker } from "@/components/ui/date-picker"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2 } from "lucide-react"
import { format } from "date-fns"

interface TimeEntryFormProps {
  timeEntry?: any
  isEditing?: boolean
}

export function TimeEntryForm({ timeEntry, isEditing = false }: TimeEntryFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [projects, setProjects] = useState([])
  const [tasks, setTasks] = useState([])
  const [employees, setEmployees] = useState([])
  const [formData, setFormData] = useState({
    employeeId: timeEntry?.employeeId || "",
    projectId: timeEntry?.projectId || "",
    taskId: timeEntry?.taskId || "",
    date: timeEntry?.startTime ? new Date(timeEntry.startTime) : new Date(),
    startTime: timeEntry?.startTime ? format(new Date(timeEntry.startTime), "HH:mm") : "09:00",
    endTime: timeEntry?.endTime ? format(new Date(timeEntry.endTime), "HH:mm") : "17:00",
    description: timeEntry?.description || "",
    billable: timeEntry?.billable ?? true,
  })

  useEffect(() => {
    fetchProjects()
    fetchEmployees()
  }, [])

  useEffect(() => {
    if (formData.projectId) {
      fetchTasks(formData.projectId)
    }
  }, [formData.projectId])

  const fetchProjects = async () => {
    try {
      const response = await fetch("/api/projects")
      if (!response.ok) throw new Error("Failed to fetch projects")
      const data = await response.json()
      setProjects(data)

      // Set default project if creating new time entry and projects exist
      if (!isEditing && data.length > 0 && !formData.projectId) {
        setFormData((prev) => ({ ...prev, projectId: data[0].id }))
      }
    } catch (error) {
      console.error("Error fetching projects:", error)
      toast({
        title: "Error",
        description: "Failed to load projects",
        variant: "destructive",
      })
    }
  }

  const fetchTasks = async (projectId: string) => {
    try {
      const response = await fetch(`/api/projects/tasks?projectId=${projectId}`)
      if (!response.ok) throw new Error("Failed to fetch tasks")
      const data = await response.json()
      setTasks(data)
    } catch (error) {
      console.error("Error fetching tasks:", error)
      toast({
        title: "Error",
        description: "Failed to load tasks",
        variant: "destructive",
      })
    }
  }

  const fetchEmployees = async () => {
    try {
      const response = await fetch("/api/hr/employees")
      if (!response.ok) throw new Error("Failed to fetch employees")
      const data = await response.json()
      setEmployees(data)

      // Set default employee if creating new time entry and employees exist
      if (!isEditing && data.length > 0 && !formData.employeeId) {
        setFormData((prev) => ({ ...prev, employeeId: data[0].id }))
      }
    } catch (error) {
      console.error("Error fetching employees:", error)
      toast({
        title: "Error",
        description: "Failed to load employees",
        variant: "destructive",
      })
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: checked }))
  }

  const calculateDuration = () => {
    const startDateTime = new Date(`${format(formData.date, "yyyy-MM-dd")}T${formData.startTime}`)
    const endDateTime = new Date(`${format(formData.date, "yyyy-MM-dd")}T${formData.endTime}`)

    // Handle case where end time is on the next day
    let durationMs = endDateTime.getTime() - startDateTime.getTime()
    if (durationMs < 0) {
      durationMs += 24 * 60 * 60 * 1000 // Add 24 hours
    }

    return Math.round(durationMs / (1000 * 60)) // Convert to minutes
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const startDateTime = new Date(`${format(formData.date, "yyyy-MM-dd")}T${formData.startTime}`)
      const endDateTime = new Date(`${format(formData.date, "yyyy-MM-dd")}T${formData.endTime}`)

      // Handle case where end time is on the next day
      if (endDateTime < startDateTime) {
        endDateTime.setDate(endDateTime.getDate() + 1)
      }

      const durationMinutes = calculateDuration()

      const payload = {
        employeeId: formData.employeeId,
        projectId: formData.projectId,
        taskId: formData.taskId || null,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        durationMinutes,
        description: formData.description,
        billable: formData.billable,
      }

      const url = isEditing ? `/api/projects/time/${timeEntry.id}` : "/api/projects/time"

      const method = isEditing ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) throw new Error("Failed to save time entry")

      toast({
        title: "Success",
        description: `Time entry ${isEditing ? "updated" : "created"} successfully`,
      })

      router.push("/projects/time")
      router.refresh()
    } catch (error) {
      console.error("Error saving time entry:", error)
      toast({
        title: "Error",
        description: `Failed to ${isEditing ? "update" : "create"} time entry`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>{isEditing ? "Edit Time Entry" : "Log Time"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="employeeId">Employee</Label>
              <Select value={formData.employeeId} onValueChange={(value) => handleSelectChange("employeeId", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((employee: any) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.firstName} {employee.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Date</Label>
              <DatePicker date={formData.date} setDate={(date) => setFormData((prev) => ({ ...prev, date }))} />
            </div>
          </div>

          <div>
            <Label htmlFor="projectId">Project</Label>
            <Select value={formData.projectId} onValueChange={(value) => handleSelectChange("projectId", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project: any) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.projectCode} - {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="taskId">Task (Optional)</Label>
            <Select value={formData.taskId} onValueChange={(value) => handleSelectChange("taskId", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select task" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no-task">No Task</SelectItem>
                {tasks.map((task: any) => (
                  <SelectItem key={task.id} value={task.id}>
                    {task.taskNumber} - {task.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startTime">Start Time</Label>
              <Input
                id="startTime"
                name="startTime"
                type="time"
                value={formData.startTime}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="endTime">End Time</Label>
              <Input
                id="endTime"
                name="endTime"
                type="time"
                value={formData.endTime}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div>
            <Label>Duration</Label>
            <Input value={`${Math.floor(calculateDuration() / 60)}h ${calculateDuration() % 60}m`} disabled />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="What did you work on?"
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="billable"
              checked={formData.billable}
              onCheckedChange={(checked) => handleCheckboxChange("billable", checked as boolean)}
            />
            <Label htmlFor="billable">Billable</Label>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" type="button" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? "Saving..." : "Save"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  )
}
