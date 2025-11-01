import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return new NextResponse(JSON.stringify({ message: "Unauthorized" }), { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const date = searchParams.get("date")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const month = searchParams.get("month")
    const employeeId = searchParams.get("employeeId")
    const projectId = searchParams.get("projectId")
    const taskId = searchParams.get("taskId")

    const whereClause: any = {}

    if (date) {
      const parsedDate = new Date(date)
      whereClause.startTime = {
        gte: new Date(parsedDate.setHours(0, 0, 0, 0)),
        lt: new Date(parsedDate.setHours(23, 59, 59, 999)),
      }
    } else if (startDate && endDate) {
      whereClause.startTime = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    }

    if (month) {
      const parsedMonth = new Date(month)
      const year = parsedMonth.getFullYear()
      const monthIndex = parsedMonth.getMonth()
      whereClause.startTime = {
        gte: new Date(year, monthIndex, 1),
        lt: new Date(year, monthIndex + 1, 0, 23, 59, 59, 999),
      }
    }

    if (employeeId) {
      whereClause.employeeId = employeeId
    }

    if (projectId) {
      whereClause.projectId = projectId
    }

    if (taskId) {
      whereClause.taskId = taskId
    }

    const timeEntries = await prisma.timeEntry.findMany({
      where: whereClause,
      include: {
        employee: true,
        project: true,
        task: true,
      },
    })

    return NextResponse.json(timeEntries)
  } catch (error) {
    console.error("Error fetching time entries:", error)
    return new NextResponse(JSON.stringify({ message: "Internal Server Error" }), { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return new NextResponse(JSON.stringify({ message: "Unauthorized" }), { status: 401 })
    }

    const data = await req.json()

    // Validate required fields
    if (!data.employeeId || !data.projectId || !data.startTime || !data.endTime || !data.description) {
      return new NextResponse(JSON.stringify({ message: "Missing required fields" }), { status: 400 })
    }

    // Convert string dates to Date objects
    if (typeof data.startTime === "string") {
      data.startTime = new Date(data.startTime)
    }

    if (typeof data.endTime === "string") {
      data.endTime = new Date(data.endTime)
    }

    // Calculate duration in hours
    const startTime = new Date(data.startTime)
    const endTime = new Date(data.endTime)
    const durationMs = endTime.getTime() - startTime.getTime()
    const durationHours = durationMs / (1000 * 60 * 60)

    // Create time entry
    const timeEntry = await prisma.timeEntry.create({
      data: {
        ...data,
        durationHours,
        createdBy: session.user.id,
      },
      include: {
        employee: true,
        project: true,
        task: true,
      },
    })

    return NextResponse.json(timeEntry)
  } catch (error) {
    console.error("Error creating time entry:", error)
    return new NextResponse(JSON.stringify({ message: "Internal Server Error" }), { status: 500 })
  }
}
