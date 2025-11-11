import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get("projectId")
    const assignedToId = searchParams.get("assignedToId")
    const status = searchParams.get("status")
    const upcoming = searchParams.get("upcoming") === "true"

    const where: any = {}

    if (projectId) {
      where.projectId = projectId
    }

    if (assignedToId) {
      where.assignedToId = assignedToId
    }

    if (status && status !== "all") {
      where.status = status.toUpperCase()
    }

    // For upcoming tasks, filter to show only incomplete tasks with due dates
    if (upcoming) {
      const today = new Date()
      const oneWeekFromNow = new Date(today)
      oneWeekFromNow.setDate(today.getDate() + 7)

      where.AND = [
        {
          status: { not: "COMPLETED" },
        },
        {
          dueDate: { lte: oneWeekFromNow },
        },
      ]
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        project: {
          select: {
            id: true,
            name: true,
            projectCode: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            position: true,
          },
        },
        phase: {
          select: {
            id: true,
            name: true,
          },
        },
        timeEntries: {
          select: {
            hours: true,
          },
        },
        comments: {
          select: {
            id: true,
          },
        },
        attachments: {
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        dueDate: "asc",
      },
    })

    // Add calculated fields
    const tasksWithMetrics = tasks.map((task) => ({
      ...task,
      actualHours: task.timeEntries.reduce((sum, entry) => sum + entry.hours, 0),
      commentsCount: task.comments.length,
      attachmentsCount: task.attachments.length,
    }))

    return NextResponse.json(tasksWithMetrics)
  } catch (error) {
    console.error("Error fetching tasks:", error)
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return new NextResponse(JSON.stringify({ message: "Unauthorized" }), { status: 401 })
    }

    const body = await request.json()

    // Validate required fields
    if (!body.title || !body.projectId) {
      return NextResponse.json({ error: "Title and project ID are required" }, { status: 400 })
    }

    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id: body.projectId },
      select: { projectCode: true },
    })

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // Validate phase exists if phaseId is provided
    let validPhaseId = null
    if (body.phaseId && body.phaseId !== "" && body.phaseId !== "NONE") {
      const phase = await prisma.projectPhase.findUnique({
        where: { id: body.phaseId },
        select: { id: true, projectId: true },
      })

      if (!phase) {
        return NextResponse.json({ error: "Project phase not found" }, { status: 404 })
      }

      if (phase.projectId !== body.projectId) {
        return NextResponse.json({ error: "Phase does not belong to the selected project" }, { status: 400 })
      }

      validPhaseId = phase.id
    }

    // Validate assigned employee exists if assignedToId is provided
    if (body.assignedToId && body.assignedToId !== "" && body.assignedToId !== "NONE") {
      const employee = await prisma.employee.findUnique({
        where: { id: body.assignedToId },
        select: { id: true },
      })

      if (!employee) {
        return NextResponse.json({ error: "Assigned employee not found" }, { status: 404 })
      }
    }

    // Generate task number
    const lastTask = await prisma.task.findFirst({
      where: {
        projectId: body.projectId,
      },
      orderBy: {
        taskNumber: "desc",
      },
    })

    let nextNumber = 1
    if (lastTask) {
      const lastNumber = Number.parseInt(lastTask.taskNumber.split("-").pop() || "0")
      nextNumber = lastNumber + 1
    }

    const taskNumber = `${project.projectCode}-T${nextNumber.toString().padStart(3, "0")}`

    // Prepare task data
    const taskData: any = {
      taskNumber,
      title: body.title,
      description: body.description || "",
      taskType: body.taskType || "DESIGN",
      planType: body.planType && body.planType !== "NONE" ? body.planType : null,
      projectId: body.projectId,
      phaseId: validPhaseId,
      assignedToId: body.assignedToId && body.assignedToId !== "NONE" ? body.assignedToId : null,
      status: body.status || "TODO",
      priority: body.priority || "MEDIUM",
      estimatedHours: body.estimatedHours ? Number.parseFloat(body.estimatedHours) : null,
      startDate: body.startDate ? new Date(body.startDate) : null,
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      completionPercentage: body.completionPercentage || 0,
      drawingNumber: body.drawingNumber || null,
      revision: body.revision || "A",
      approvalRequired: body.approvalRequired || false,
      regulatoryBody: body.regulatoryBody && body.regulatoryBody !== "" ? body.regulatoryBody : null,
      dependencies: body.dependencies || null,
      notes: body.notes || "",
    }

    // Create the task
    const task = await prisma.task.create({
      data: taskData,
      include: {
        project: {
          select: {
            id: true,
            name: true,
            projectCode: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            position: true,
          },
        },
        phase: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    // Create activity log only if user exists
    try {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { id: true },
      })

      if (user) {
        await prisma.activityLog.create({
          data: {
            userId: session.user.id,
            action: "CREATE",
            entityType: "TASK",
            entityId: task.id,
            description: `Created task: ${task.title}`,
          },
        })
      }
    } catch (logError) {
      console.warn("Failed to create activity log:", logError)
      // Don't fail the task creation if activity log fails
    }

    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    console.error("Error creating task:", error)

    // Provide specific error messages for different constraint violations
    if (error instanceof Error) {
      if (error.message.includes("Task_phaseId_fkey")) {
        return NextResponse.json({ error: "Invalid project phase selected" }, { status: 400 })
      }
      if (error.message.includes("Task_assignedToId_fkey")) {
        return NextResponse.json({ error: "Invalid employee assigned" }, { status: 400 })
      }
      if (error.message.includes("Task_projectId_fkey")) {
        return NextResponse.json({ error: "Invalid project selected" }, { status: 400 })
      }
    }

    return NextResponse.json({ error: "Failed to create task" }, { status: 500 })
  }
}
