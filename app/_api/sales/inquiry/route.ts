import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return new NextResponse(JSON.stringify({ message: "Unauthorized" }), { status: 401 })
    }

    const inquiries = await prisma.inquiry.findMany({
      include: {
        customer: true,
        assignedTo: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json(inquiries)
  } catch (error) {
    console.error("Error fetching inquiries:", error)
    return new NextResponse(JSON.stringify({ message: "Internal Server Error" }), { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return new NextResponse(JSON.stringify({ message: "Unauthorized" }), { status: 401 })
    }

    const body = await req.json()

    // Validate required fields
    if (!body.customerId || !body.subject) {
      return new NextResponse(JSON.stringify({ message: "Customer and subject are required fields" }), { status: 400 })
    }

    try {
      // Create inquiry
      const inquiry = await prisma.inquiry.create({
        data: {
          date: body.date ? new Date(body.date) : new Date(),
          customerId: body.customerId,
          subject: body.subject,
          description: body.description || "",
          notes: body.notes || "",
          status: body.status || "NEW",
          source: body.source || "DIRECT",
          assignedToId: body.assignedToId || null,
          expectedBudget: body.expectedBudget ? Number.parseFloat(body.expectedBudget) : null,
          expectedTimeline: body.expectedTimeline || "",
          followUpDate: body.followUpDate ? new Date(body.followUpDate) : null,
        },
      })

      // Create activity log
      try {
        await prisma.activityLog.create({
          data: {
            userId: session.user.id,
            action: "CREATE",
            entityType: "INQUIRY",
            entityId: inquiry.id,
            details: `Created inquiry: ${inquiry.subject}`,
          },
        })
      } catch (activityError) {
        console.error("Failed to create activity log:", activityError)
      }

      return NextResponse.json(inquiry)
    } catch (createError) {
      console.error("Error creating inquiry:", createError)
      return new NextResponse(
        JSON.stringify({ message: "Failed to create inquiry in database. Please check your database connection." }),
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error in inquiry creation:", error)
    return new NextResponse(JSON.stringify({ message: "Internal server error. Please try again later." }), {
      status: 500,
    })
  }
}
