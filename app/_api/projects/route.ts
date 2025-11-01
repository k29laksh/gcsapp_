import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const customerId = searchParams.get("clientId") // Keep accepting clientId as parameter
    const projectManagerId = searchParams.get("projectManagerId")

    const where: any = {}

    if (status) {
      where.status = status
    }

    if (customerId) {
      where.customerId = customerId // Map to customerId in the query
    }

    if (projectManagerId) {
      where.projectManagerId = projectManagerId
    }

    const projects = await prisma.project.findMany({
      where,
      include: {
        customer: {
          // Changed from client to customer
          select: {
            id: true,
            companyName: true,
            firstName: true,
            lastName: true,
          },
        },
        vessel: {
          select: {
            id: true,
            vesselName: true,
            vesselType: true,
            imoNumber: true,
          },
        },
        projectManager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        tasks: {
          select: {
            id: true,
            status: true,
            completionPercentage: true,
          },
        },
        timeEntries: {
          select: {
            hours: true,
          },
        },
        _count: {
          select: {
            tasks: true,
            teamMembers: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    // Calculate project progress and other metrics
    const projectsWithMetrics = projects.map((project) => {
      const totalTasks = project.tasks.length
      const completedTasks = project.tasks.filter((task) => task.status === "COMPLETED").length
      const totalHours = project.timeEntries.reduce((sum, entry) => sum + entry.hours, 0)

      // Calculate overall progress
      let progress = 0
      if (totalTasks > 0) {
        progress = Math.round((completedTasks / totalTasks) * 100)
      }

      return {
        ...project,
        progress,
        totalTasks,
        completedTasks,
        totalHours,
        teamSize: project._count.teamMembers,
      }
    })

    return NextResponse.json(projectsWithMetrics)
  } catch (error) {
    console.error("Error fetching projects:", error)
    return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return new NextResponse(JSON.stringify({ message: "Unauthorized" }), { status: 401 })
    }

    const body = await request.json()
    console.log("Received project data:", body) // Debug log

    // Validate required fields
    if (!body.name) {
      return NextResponse.json({ message: "Project name is required" }, { status: 400 })
    }

    if (!body.clientId) {
      return NextResponse.json({ message: "Client selection is required" }, { status: 400 })
    }

    // Verify customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: body.clientId },
    })

    if (!customer) {
      return NextResponse.json({ message: "Selected customer does not exist" }, { status: 400 })
    }

    // Verify vessel exists if provided
    if (body.vesselId && body.vesselId !== "NONE" && body.vesselId !== "__none__") {
      const vessel = await prisma.vessel.findUnique({
        where: { id: body.vesselId },
      })

      if (!vessel) {
        return NextResponse.json({ message: "Selected vessel does not exist" }, { status: 400 })
      }
    }

    // Verify project manager exists if provided
    if (body.projectManagerId && body.projectManagerId !== "NONE" && body.projectManagerId !== "__none__") {
      const projectManager = await prisma.employee.findUnique({
        where: { id: body.projectManagerId },
      })

      if (!projectManager) {
        return NextResponse.json({ message: "Selected project manager does not exist" }, { status: 400 })
      }
    }

    // Generate project code automatically
    const currentYear = new Date().getFullYear()
    const prefix = `PRJ-${currentYear}-`

    const lastProject = await prisma.project.findFirst({
      where: {
        projectCode: {
          startsWith: prefix,
        },
      },
      orderBy: {
        projectCode: "desc",
      },
    })

    let nextNumber = 1
    if (lastProject) {
      const lastNumber = Number.parseInt(lastProject.projectCode.split("-")[2])
      nextNumber = lastNumber + 1
    }

    const projectCode = `${prefix}${nextNumber.toString().padStart(4, "0")}`

    // Prepare project data
    const projectData = {
      projectCode,
      name: body.name,
      description: body.description || "",
      customerId: body.clientId, // Changed from clientId to customerId
      vesselId: body.vesselId && body.vesselId !== "NONE" && body.vesselId !== "__none__" ? body.vesselId : null,
      startDate: body.startDate ? new Date(body.startDate) : new Date(),
      targetEndDate: body.targetEndDate ? new Date(body.targetEndDate) : null,
      budget: body.budget ? Number.parseFloat(body.budget) : null,
      status: body.status || "PLANNING",
      priority: body.priority || "MEDIUM",
      projectManagerId:
        body.projectManagerId && body.projectManagerId !== "NONE" && body.projectManagerId !== "__none__"
          ? body.projectManagerId
          : null,
      vesselType: body.vesselType || null,
      designPhase: body.designPhase || "CONCEPT",
      regulatoryBody: body.regulatoryBody || null,
      classificationSociety: body.classificationSociety || null,
      projectType: body.projectType || "NEW_DESIGN",
      contractValue: body.contractValue ? Number.parseFloat(body.contractValue) : null,
      milestonePayments: body.milestonePayments || false,
      deliveryTerms: body.deliveryTerms || null,
      notes: body.notes || "",
    }

    console.log("Creating project with data:", projectData) // Debug log

    // Create the project
    const newProject = await prisma.project.create({
      data: projectData,
      include: {
        customer: true, // Changed from client to customer
        vessel: true,
        projectManager: true,
      },
    })

    // If project manager is assigned, add them to the team
    if (newProject.projectManagerId) {
      await prisma.projectTeamMember.create({
        data: {
          projectId: newProject.id,
          employeeId: newProject.projectManagerId,
          role: "Project Manager",
          allocation: 100,
          responsibilities: "Overall project management and coordination",
        },
      })
    }

    // Create activity log
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "CREATE",
        entityType: "PROJECT",
        entityId: newProject.id,
        description: `Created project: ${newProject.name}`,
      },
    })

    return NextResponse.json(newProject, { status: 201 })
  } catch (error) {
    console.error("Error creating project:", error)
    return NextResponse.json(
      {
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
