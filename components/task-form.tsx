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
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2, Anchor, FileText } from "lucide-react"
import { useAddTaskMutation, useUpdateTaskMutation } from "@/redux/Service/tasks"
import { useGetEmployeeQuery } from "@/redux/Service/employee"
import { useGetProjectsQuery } from "@/redux/Service/projects"

interface TaskFormProps {
  task?: any
  isEditing?: boolean
  projectId?: string
}

export function TaskForm({ task, isEditing = false, projectId }: TaskFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  
  // RTK Query mutations and queries
  const [addTask, { isLoading: isAdding }] = useAddTaskMutation()
  const [updateTask, { isLoading: isUpdating }] = useUpdateTaskMutation()
  
  // Get employees and projects using RTK Query
  const { data: employeesData = [], isLoading: isLoadingEmployees } = useGetEmployeeQuery({})
  const { data: projectsData = [], isLoading: isLoadingProjects } = useGetProjectsQuery()
  
  const loading = isAdding || isUpdating

  // Updated form data structure to match API
  const [formData, setFormData] = useState({
    project: task?.project || projectId || "",
    project_phase: task?.project_phase || "",
    title: task?.title || "",
    description: task?.description || "",
    type: task?.type || "Review",
    plan_type: task?.plan_type || "",
    plan_number: task?.plan_number || "",
    revision: task?.revision || "A",
    assigned_to: task?.assigned_to || "unassigned",
    due_date: task?.due_date ? new Date(task.due_date) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    status: task?.status || "To Do",
    priority: task?.priority || "Medium",
    estimated_hours: task?.estimated_hours || 8,
    completion: task?.completion || 0,
    regulatory_approval: task?.regulatory_approval || false,
    dependencies: task?.dependencies || "",
    notes: task?.notes || "",
  })

  // Set default project if not editing and projectId is provided
  useEffect(() => {
    if (!isEditing && projectId && !formData.project) {
      setFormData((prev) => ({ ...prev, project: projectId }))
    }
  }, [projectId, isEditing, formData.project])

  // Set default project if projects are loaded and no project is selected
  useEffect(() => {
    if (!isEditing && !projectId && projectsData.length > 0 && !formData.project) {
      setFormData((prev) => ({ ...prev, project: projectsData[0].id }))
    }
  }, [projectsData, isEditing, projectId, formData.project])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSliderChange = (name: string, value: number[]) => {
    setFormData((prev) => ({ ...prev, [name]: value[0] }))
  }

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: checked }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      // Validate required fields
      if (!formData.title.trim()) {
        throw new Error("Task title is required")
      }

      if (!formData.project) {
        throw new Error("Project selection is required")
      }

      // Prepare data for API - convert date to string format and handle unassigned
      const apiData = {
        ...formData,
        due_date: formData.due_date.toISOString().split('T')[0], // Format as YYYY-MM-DD
        assigned_to: formData.assigned_to === "unassigned" ? "" : formData.assigned_to,
      }

      if (isEditing) {
        // Update existing task
        await updateTask({
          taskId: task.id,
          ...apiData
        }).unwrap()
      } else {
        // Create new task
        await addTask(apiData).unwrap()
      }

      toast({
        title: "Success",
        description: `Task ${isEditing ? "updated" : "created"} successfully`,
      })

      if (projectId) {
        router.push(`/projects/${projectId}`)
      } else {
        router.push("/projects/tasks")
      }
      router.refresh()
    } catch (error) {
      console.error("Error saving task:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : `Failed to ${isEditing ? "update" : "create"} task`,
        variant: "destructive",
      })
    }
  }

  // Updated options to match your API data
  const taskTypes = [
    "Design",
    "Drawing",
    "Calculation",
    "Analysis",
    "Review",
    "Approval",
    "Documentation",
    "Coordination",
    "Site Visit",
    "Meeting",
    "Other",
  ]

  const planTypes = [
    "Architectural Drawing",
    "Structural Drawing",
    "Mechanical Drawing",
    "Electrical Drawing",
    "HVAC Plan",
    "Piping Diagram",
    "General Arrangement",
    "Lines Plan",
    "Construction Plan",
    "Fire Control Plan",
    "Life Saving Appliances",
    "Capacity Plan",
    "Stability Booklet",
    "Loading Manual",
    "Damage Stability",
    "Safety Plan",
    "Navigation Equipment",
    "Communication Plan",
    "Ballast Plan",
    "Fuel System Plan",
    "Other",
  ]

  const projectPhases = [
    "Design Phase",
    "Planning Phase",
    "Approval Phase",
    "Construction Phase",
    "Testing Phase",
    "Delivery Phase",
    "Post-Delivery",
  ]

  const statusOptions = [
    "To Do",
    "In Progress",
    "Review",
    "Completed",
    "Blocked"
  ]

  const priorityOptions = [
    "Low",
    "Medium",
    "High",
    "Urgent"
  ]

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Anchor className="h-5 w-5" />
            {isEditing ? "Edit Task" : "Create New Task"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Basic Information</h3>
            <div className="grid grid-cols-2 gap-4">
              {!projectId && (
                <div>
                  <Label htmlFor="project">Project *</Label>
                  <Select 
                    value={formData.project} 
                    onValueChange={(value) => handleSelectChange("project", value)}
                    disabled={isLoadingProjects}
                  >
                    <SelectTrigger>
                      {isLoadingProjects ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Loading projects...
                        </div>
                      ) : (
                        <SelectValue placeholder="Select project" />
                      )}
                    </SelectTrigger>
                    <SelectContent>
                      {projectsData.map((project: any) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.projectCode} - {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div>
                <Label htmlFor="project_phase">Project Phase</Label>
                <Select value={formData.project_phase} onValueChange={(value) => handleSelectChange("project_phase", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select phase" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not-specified">Not Specified</SelectItem>
                    {projectPhases.map((phase) => (
                      <SelectItem key={phase} value={phase}>
                        {phase}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="title">Task Title *</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g., Architectural Plan Review"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Task Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Detailed description of the task..."
                rows={3}
              />
            </div>
          </div>

          {/* Task Type and Plan Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Task Type & Plan Details
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type">Task Type</Label>
                <Select value={formData.type} onValueChange={(value) => handleSelectChange("type", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select task type" />
                  </SelectTrigger>
                  <SelectContent>
                    {taskTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="plan_type">Plan Type</Label>
                <Select value={formData.plan_type} onValueChange={(value) => handleSelectChange("plan_type", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select plan type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not-specified">Not Specified</SelectItem>
                    {planTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="plan_number">Plan Number</Label>
                <Input
                  id="plan_number"
                  name="plan_number"
                  value={formData.plan_number}
                  onChange={handleChange}
                  placeholder="e.g., ARCH-PLAN-2025-001"
                />
              </div>
              <div>
                <Label htmlFor="revision">Revision</Label>
                <Input
                  id="revision"
                  name="revision"
                  value={formData.revision}
                  onChange={handleChange}
                  placeholder="A, B, C, etc."
                />
              </div>
            </div>
          </div>

          {/* Assignment and Timeline */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Assignment & Timeline</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="assigned_to">Assigned To</Label>
                <Select
                  value={formData.assigned_to}
                  onValueChange={(value) => handleSelectChange("assigned_to", value)}
                  disabled={isLoadingEmployees}
                >
                  <SelectTrigger>
                    {isLoadingEmployees ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading employees...
                      </div>
                    ) : (
                      <SelectValue>
                        {formData.assigned_to === "unassigned" 
                          ? "Unassigned" 
                          : employeesData.find((emp: any) => emp.id === formData.assigned_to) 
                            ? `${employeesData.find((emp: any) => emp.id === formData.assigned_to).name}`
                            : "Select employee"
                        }
                      </SelectValue>
                    )}
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {isLoadingEmployees ? (
                      <SelectItem value="loading" disabled>Loading employees...</SelectItem>
                    ) : (
                      employeesData.map((employee: any) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.name} {employee.job_title ? `- ${employee.job_title}` : ""}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Due Date</Label>
                <DatePicker
                  date={formData.due_date}
                  setDate={(date) => setFormData((prev) => ({ ...prev, due_date: date }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => handleSelectChange("status", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select value={formData.priority} onValueChange={(value) => handleSelectChange("priority", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    {priorityOptions.map((priority) => (
                      <SelectItem key={priority} value={priority}>
                        {priority}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Progress and Estimates */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Progress & Estimates</h3>
            <div>
              <Label htmlFor="estimated_hours">Estimated Hours: {formData.estimated_hours}</Label>
              <Slider
                value={[formData.estimated_hours]}
                min={1}
                max={80}
                step={1}
                onValueChange={(value) => handleSliderChange("estimated_hours", value)}
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="completion">Completion Percentage: {formData.completion}%</Label>
              <Slider
                value={[formData.completion]}
                min={0}
                max={100}
                step={5}
                onValueChange={(value) => handleSliderChange("completion", value)}
                className="mt-2"
              />
            </div>
          </div>

          {/* Approval and Dependencies */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Approval & Dependencies</h3>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="regulatory_approval"
                checked={formData.regulatory_approval}
                onCheckedChange={(checked) => handleCheckboxChange("regulatory_approval", checked as boolean)}
              />
              <Label htmlFor="regulatory_approval">Requires regulatory approval</Label>
            </div>

            <div>
              <Label htmlFor="dependencies">Task Dependencies</Label>
              <Textarea
                id="dependencies"
                name="dependencies"
                value={formData.dependencies}
                onChange={handleChange}
                placeholder="List any tasks or deliverables this task depends on..."
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Any additional notes or special instructions..."
                rows={3}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" type="button" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? "Saving..." : isEditing ? "Update Task" : "Create Task"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  )
}