import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PUT(req: Request, { params }: { params: { id: string } }) {
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

    // Update task to completed
    const task = await prisma.task.update({
      where: {
        id: params.id,
      },
      data: {
        status: "COMPLETED",
        completionPercentage: 100,
        completedDate: new Date(),
      },
    })

    // Create activity log
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "UPDATE",
        entityType: "TASK",
        entityId: task.id,
        description: `Marked task as completed: ${task.title}`,
      },
    })

    return NextResponse.json(task)
  } catch (error) {
    console.error("Error completing task:", error)
    return new NextResponse(JSON.stringify({ message: "Internal Server Error" }), { status: 500 })
  }
}
