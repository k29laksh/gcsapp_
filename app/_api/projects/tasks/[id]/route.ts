import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return new NextResponse(JSON.stringify({ message: "Unauthorized" }), { status: 401 })
    }

    const task = await prisma.task.findUnique({
      where: {
        id: params.id,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            projectCode: true,
          },
        },
        phase: {
          select: {
            id: true,
            name: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            position: true,
            email: true,
          },
        },
        timeEntries: {
          include: {
            employee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: {
            date: "desc",
          },
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        attachments: {
          include: {
            uploadedBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: {
            uploadedAt: "desc",
          },
        },
      },
    })

    if (!task) {
      return new NextResponse(JSON.stringify({ message: "Task not found" }), { status: 404 })
    }

    // Calculate metrics
    const totalHours = task.timeEntries.reduce((sum, entry) => sum + entry.hours, 0)

    const taskWithMetrics = {
      ...task,
      actualHours: totalHours,
    }

    return NextResponse.json(taskWithMetrics)
  } catch (error) {
    console.error("Error fetching task:", error)
    return new NextResponse(JSON.stringify({ message: "Internal Server Error" }), { status: 500 })
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return new NextResponse(JSON.stringify({ message: "Unauthorized" }), { status: 401 })
    }

    const data = await req.json()

    // Check if task exists
    const existingTask = await prisma.task.findUnique({
      where: {
        id: params.id,
      },
    })

    if (!existingTask) {
      return new NextResponse(JSON.stringify({ message: "Task not found" }), { status: 404 })
    }

    // Update task
    const task = await prisma.task.update({
      where: {
        id: params.id,
      },
      data: {
        title: data.title,
        description: data.description,
        taskType: data.taskType,
        planType: data.planType,
        phaseId: data.phaseId,
        assignedToId: data.assignedToId,
        status: data.status,
        priority: data.priority,
        estimatedHours: data.estimatedHours ? Number.parseFloat(data.estimatedHours) : undefined,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        completionPercentage: data.completionPercentage,
        drawingNumber: data.drawingNumber,
        revision: data.revision,
        approvalRequired: data.approvalRequired,
        regulatoryBody: data.regulatoryBody,
        dependencies: data.dependencies,
        notes: data.notes,
        completedDate: data.status === "COMPLETED" ? new Date() : undefined,
      },
    })

    // Create activity log
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "UPDATE",
        entityType: "TASK",
        entityId: task.id,
        description: `Updated task: ${task.title}`,
      },
    })

    return NextResponse.json(task)
  } catch (error) {
    console.error("Error updating task:", error)
    return new NextResponse(JSON.stringify({ message: "Internal Server Error" }), { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return new NextResponse(JSON.stringify({ message: "Unauthorized" }), { status: 401 })
    }

    // Check if task exists
    const existingTask = await prisma.task.findUnique({
      where: {
        id: params.id,
      },
    })

    if (!existingTask) {
      return new NextResponse(JSON.stringify({ message: "Task not found" }), { status: 404 })
    }

    // Delete task
    await prisma.task.delete({
      where: {
        id: params.id,
      },
    })

    // Create activity log
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "DELETE",
        entityType: "TASK",
        entityId: params.id,
        description: `Deleted task: ${existingTask.title}`,
      },
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("Error deleting task:", error)
    return new NextResponse(JSON.stringify({ message: "Internal Server Error" }), { status: 500 })
  }
}
