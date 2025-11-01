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

    const project = await prisma.project.findUnique({
      where: {
        id: params.id,
      },
      include: {
        client: {
          select: {
            id: true,
            companyName: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        vessel: {
          select: {
            id: true,
            vesselName: true,
            vesselType: true,
            imoNumber: true,
            length: true,
            breadth: true,
            grossTonnage: true,
          },
        },
        projectManager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        teamMembers: {
          include: {
            employee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                position: true,
              },
            },
          },
        },
        phases: {
          include: {
            tasks: {
              select: {
                id: true,
                status: true,
                completionPercentage: true,
              },
            },
          },
          orderBy: {
            startDate: "asc",
          },
        },
        tasks: {
          include: {
            assignedTo: {
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
        timeEntries: {
          include: {
            employee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
            task: {
              select: {
                id: true,
                title: true,
              },
            },
          },
          orderBy: {
            date: "desc",
          },
          take: 10, // Limit to recent entries
        },
        deliverables: {
          orderBy: {
            dueDate: "asc",
          },
        },
        documents: {
          include: {
            uploadedBy: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: {
            uploadDate: "desc",
          },
        },
        planApprovals: {
          include: {
            submittedBy: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
            approvedBy: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: {
            submittedDate: "desc",
          },
        },
        issues: {
          include: {
            reportedBy: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
            assignedTo: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: {
            reportedDate: "desc",
          },
        },
        _count: {
          select: {
            tasks: true,
            teamMembers: true,
            timeEntries: true,
            deliverables: true,
          },
        },
      },
    })

    if (!project) {
      return new NextResponse(JSON.stringify({ message: "Project not found" }), { status: 404 })
    }

    // Calculate project metrics
    const totalTasks = project.tasks.length
    const completedTasks = project.tasks.filter((task) => task.status === "COMPLETED").length
    const totalHours = project.timeEntries.reduce((sum, entry) => sum + entry.hours, 0)

    // Calculate overall progress
    let progress = 0
    if (totalTasks > 0) {
      progress = Math.round((completedTasks / totalTasks) * 100)
    }

    // Calculate phase progress
    const phasesWithProgress = project.phases.map((phase) => {
      const phaseTasks = phase.tasks.length
      const phaseCompletedTasks = phase.tasks.filter((task) => task.status === "COMPLETED").length
      const phaseProgress = phaseTasks > 0 ? Math.round((phaseCompletedTasks / phaseTasks) * 100) : 0

      return {
        ...phase,
        progress: phaseProgress,
        totalTasks: phaseTasks,
        completedTasks: phaseCompletedTasks,
      }
    })

    const projectWithMetrics = {
      ...project,
      progress,
      totalTasks,
      completedTasks,
      totalHours,
      teamSize: project._count.teamMembers,
      phases: phasesWithProgress,
    }

    return NextResponse.json(projectWithMetrics)
  } catch (error) {
    console.error("Error fetching project:", error)
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

    // Check if project exists
    const existingProject = await prisma.project.findUnique({
      where: {
        id: params.id,
      },
      include: {
        teamMembers: true,
      },
    })

    if (!existingProject) {
      return new NextResponse(JSON.stringify({ message: "Project not found" }), { status: 404 })
    }

    // Update project
    const project = await prisma.project.update({
      where: {
        id: params.id,
      },
      data: {
        name: data.name,
        description: data.description,
        clientId: data.clientId,
        vesselId: data.vesselId,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        targetEndDate: data.targetEndDate ? new Date(data.targetEndDate) : undefined,
        budget: data.budget ? Number.parseFloat(data.budget) : undefined,
        status: data.status,
        priority: data.priority,
        projectManagerId: data.projectManagerId === "none" ? null : data.projectManagerId,
        vesselType: data.vesselType,
        designPhase: data.designPhase,
        regulatoryBody: data.regulatoryBody,
        classificationSociety: data.classificationSociety,
        projectType: data.projectType,
        contractValue: data.contractValue ? Number.parseFloat(data.contractValue) : undefined,
        milestonePayments: data.milestonePayments,
        deliveryTerms: data.deliveryTerms,
        notes: data.notes,
      },
    })

    // Handle project manager team membership
    if (data.projectManagerId !== existingProject.projectManagerId) {
      // Remove old project manager from team if they were added as PM
      if (existingProject.projectManagerId) {
        const oldManagerInTeam = existingProject.teamMembers.find(
          (member) => member.employeeId === existingProject.projectManagerId && member.role === "Project Manager",
        )
        if (oldManagerInTeam) {
          await prisma.projectTeamMember.delete({
            where: {
              id: oldManagerInTeam.id,
            },
          })
        }
      }

      // Add new project manager to team
      if (data.projectManagerId && data.projectManagerId !== "none") {
        const newManagerInTeam = existingProject.teamMembers.find(
          (member) => member.employeeId === data.projectManagerId,
        )

        if (newManagerInTeam) {
          // Update their role to Project Manager
          await prisma.projectTeamMember.update({
            where: {
              id: newManagerInTeam.id,
            },
            data: {
              role: "Project Manager",
            },
          })
        } else {
          // Add them to the team
          await prisma.projectTeamMember.create({
            data: {
              projectId: project.id,
              employeeId: data.projectManagerId,
              role: "Project Manager",
              allocation: 100,
              responsibilities: "Overall project management and coordination",
            },
          })
        }
      }
    }

    // Create activity log
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "UPDATE",
        entityType: "PROJECT",
        entityId: project.id,
        description: `Updated project: ${project.name}`,
      },
    })

    return NextResponse.json(project)
  } catch (error) {
    console.error("Error updating project:", error)
    return new NextResponse(JSON.stringify({ message: "Internal Server Error" }), { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return new NextResponse(JSON.stringify({ message: "Unauthorized" }), { status: 401 })
    }

    // Check if project exists
    const existingProject = await prisma.project.findUnique({
      where: {
        id: params.id,
      },
    })

    if (!existingProject) {
      return new NextResponse(JSON.stringify({ message: "Project not found" }), { status: 404 })
    }

    // Delete project (cascade will handle related records)
    await prisma.project.delete({
      where: {
        id: params.id,
      },
    })

    // Create activity log
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "DELETE",
        entityType: "PROJECT",
        entityId: params.id,
        description: `Deleted project: ${existingProject.name}`,
      },
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("Error deleting project:", error)
    return new NextResponse(JSON.stringify({ message: "Internal Server Error" }), { status: 500 })
  }
}
