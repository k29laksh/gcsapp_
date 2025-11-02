"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/data-table"
import { Eye, Pencil, Plus, Trash2, Calendar } from "lucide-react"
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DatePicker } from "@/components/ui/date-picker"
import { format, startOfWeek, endOfWeek, addDays, isSameDay } from "date-fns"
import type { ColumnDef } from "@tanstack/react-table"

interface TimeEntry {
  id: string
  employee: {
    id: string
    firstName: string
    lastName: string
    position: string
  }
  project: {
    id: string
    name: string
    projectCode: string
  }
  task?: {
    id: string
    title: string
    taskNumber: string
  } | null
  startTime: string
  endTime: string
  durationMinutes: number
  description: string
  billable: boolean
  approved: boolean
  createdAt: string
}

export default function TimeTrackingPage() {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("week")
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const { toast } = useToast()

  useEffect(() => {
    fetchTimeEntries()
  }, [activeTab, selectedDate])

  const fetchTimeEntries = async () => {
    try {
      setLoading(true)
      let queryParams = ""

      if (activeTab === "day") {
        queryParams = `date=${format(selectedDate, "yyyy-MM-dd")}`
      } else if (activeTab === "week") {
        const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 })
        const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 })
        queryParams = `startDate=${format(weekStart, "yyyy-MM-dd")}&endDate=${format(weekEnd, "yyyy-MM-dd")}`
      } else if (activeTab === "month") {
        queryParams = `month=${format(selectedDate, "yyyy-MM")}`
      }

      const response = await fetch(`/api/projects/time?${queryParams}`)
      if (!response.ok) throw new Error("Failed to fetch time entries")
      const data = await response.json()
      setTimeEntries(data)
    } catch (error) {
      console.error("Error fetching time entries:", error)
      toast({
        title: "Error",
        description: "Failed to load time entries",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/projects/time/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete time entry")

      setTimeEntries(timeEntries.filter((entry) => entry.id !== id))

      toast({
        title: "Success",
        description: "Time entry deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting time entry:", error)
      toast({
        title: "Error",
        description: "Failed to delete time entry",
        variant: "destructive",
      })
    }
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  const getTotalHours = () => {
    return timeEntries.reduce((total, entry) => total + entry.durationMinutes, 0) / 60
  }

  const getBillableHours = () => {
    return timeEntries.filter((entry) => entry.billable).reduce((total, entry) => total + entry.durationMinutes, 0) / 60
  }

  const getWeekDays = () => {
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 })
    const days = []

    for (let i = 0; i < 7; i++) {
      const day = addDays(weekStart, i)
      days.push(day)
    }

    return days
  }

  const columns: ColumnDef<TimeEntry>[] = [
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => formatDate(row.original.startTime),
    },
    {
      accessorKey: "employee",
      header: "Employee",
      cell: ({ row }) => {
        const employee = row.original.employee
        return (
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src="/placeholder.svg" alt={`${employee.firstName} ${employee.lastName}`} />
              <AvatarFallback>{getInitials(employee.firstName, employee.lastName)}</AvatarFallback>
            </Avatar>
            <div>
              <div className="text-sm">
                {employee.firstName} {employee.lastName}
              </div>
              <div className="text-xs text-muted-foreground">{employee.position}</div>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "project",
      header: "Project",
      cell: ({ row }) => {
        const project = row.original.project
        return (
          <div>
            <div className="text-sm">{project.name}</div>
            <div className="text-xs text-muted-foreground">{project.projectCode}</div>
          </div>
        )
      },
    },
    {
      accessorKey: "task",
      header: "Task",
      cell: ({ row }) => {
        const task = row.original.task
        if (!task) return "N/A"

        return (
          <div>
            <div className="text-sm">{task.title}</div>
            <div className="text-xs text-muted-foreground">{task.taskNumber}</div>
          </div>
        )
      },
    },
    {
      accessorKey: "time",
      header: "Time",
      cell: ({ row }) => {
        const entry = row.original
        return (
          <div>
            <div className="text-sm">
              {formatTime(entry.startTime)} - {formatTime(entry.endTime)}
            </div>
            <div className="text-xs text-muted-foreground">{formatDuration(entry.durationMinutes)}</div>
          </div>
        )
      },
    },
    {
      accessorKey: "billable",
      header: "Billable",
      cell: ({ row }) => (row.original.billable ? "Yes" : "No"),
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => row.original.description || "N/A",
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const entry = row.original

        return (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild>
              <Link href={`/projects/time/${entry.id}`}>
                <Eye className="h-4 w-4" />
                <span className="sr-only">View</span>
              </Link>
            </Button>
            <Button variant="ghost" size="icon" asChild>
              <Link href={`/projects/time/${entry.id}/edit`}>
                <Pencil className="h-4 w-4" />
                <span className="sr-only">Edit</span>
              </Link>
            </Button>
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
                  <AlertDialogDescription>This will permanently delete this time entry.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleDelete(entry.id)}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )
      },
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <h2 className="text-2xl font-bold">Time Tracking</h2>
        <Button asChild>
          <Link href="/projects/time/new">
            <Plus className="mr-2 h-4 w-4" />
            Log Time
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getTotalHours().toFixed(1)}h</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Billable Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getBillableHours().toFixed(1)}h</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Utilization</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {getTotalHours() > 0 ? ((getBillableHours() / getTotalHours()) * 100).toFixed(0) : 0}%
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              if (activeTab === "day") {
                setSelectedDate(addDays(selectedDate, -1))
              } else if (activeTab === "week") {
                setSelectedDate(addDays(selectedDate, -7))
              } else if (activeTab === "month") {
                const newDate = new Date(selectedDate)
                newDate.setMonth(newDate.getMonth() - 1)
                setSelectedDate(newDate)
              }
            }}
          >
            <Calendar className="h-4 w-4 rotate-180" />
          </Button>

          <DatePicker date={selectedDate} setDate={setSelectedDate} />

          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              if (activeTab === "day") {
                setSelectedDate(addDays(selectedDate, 1))
              } else if (activeTab === "week") {
                setSelectedDate(addDays(selectedDate, 7))
              } else if (activeTab === "month") {
                const newDate = new Date(selectedDate)
                newDate.setMonth(newDate.getMonth() + 1)
                setSelectedDate(newDate)
              }
            }}
          >
            <Calendar className="h-4 w-4" />
          </Button>
        </div>

        <Tabs defaultValue="week" onValueChange={setActiveTab} className="flex-1">
          <TabsList className="grid w-full max-w-[400px] grid-cols-3">
            <TabsTrigger value="day">Day</TabsTrigger>
            <TabsTrigger value="week">Week</TabsTrigger>
            <TabsTrigger value="month">Month</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {activeTab === "week" && (
        <div className="grid grid-cols-7 gap-2 mb-4">
          {getWeekDays().map((day, index) => {
            const isToday = isSameDay(day, new Date())
            const dayEntries = timeEntries.filter((entry) => isSameDay(new Date(entry.startTime), day))
            const totalHours = dayEntries.reduce((total, entry) => total + entry.durationMinutes, 0) / 60

            return (
              <Card key={index} className={isToday ? "border-primary" : ""}>
                <CardHeader className="p-3 pb-0">
                  <CardTitle className="text-sm font-medium">{format(day, "EEE")}</CardTitle>
                  <CardDescription>{format(day, "MMM d")}</CardDescription>
                </CardHeader>
                <CardContent className="p-3 pt-1">
                  <div className="text-xl font-bold">{totalHours.toFixed(1)}h</div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Time Entries</CardTitle>
          <CardDescription>
            {activeTab === "day" && `Time entries for ${format(selectedDate, "MMMM d, yyyy")}`}
            {activeTab === "week" &&
              `Time entries for week of ${format(startOfWeek(selectedDate, { weekStartsOn: 1 }), "MMMM d")} - ${format(endOfWeek(selectedDate, { weekStartsOn: 1 }), "MMMM d, yyyy")}`}
            {activeTab === "month" && `Time entries for ${format(selectedDate, "MMMM yyyy")}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={timeEntries} searchKey="description" />
        </CardContent>
      </Card>
    </div>
  )
}

