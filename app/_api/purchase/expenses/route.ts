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

    const expenses = await prisma.expense.findMany({
      include: {
        vendor: true,
        project: true,
        account: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json(expenses)
  } catch (error) {
    console.error("Error fetching expenses:", error)
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
    if (!body.vendorId || !body.category || !body.amount) {
      return new NextResponse(
        JSON.stringify({ message: "Missing required fields: vendorId, category, and amount are required" }),
        { status: 400 },
      )
    }

    // Create expense
    const expense = await prisma.expense.create({
      data: {
        date: body.date ? new Date(body.date) : new Date(),
        vendorId: body.vendorId,
        category: body.category,
        amount: Number.parseFloat(body.amount),
        description: body.description || "",
        reference: body.reference || "",
        projectId: body.projectId === "none" ? null : body.projectId,
        accountId: body.accountId === "none" ? null : body.accountId,
      },
      include: {
        vendor: true,
        project: true,
        account: true,
      },
    })

    // Create activity log
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "CREATE",
        entityType: "EXPENSE",
        entityId: expense.id,
        description: `Created expense: ${expense.category} - ${expense.amount}`,
      },
    })

    return NextResponse.json(expense)
  } catch (error) {
    console.error("Error creating expense:", error)
    return new NextResponse(JSON.stringify({ message: "Internal Server Error" }), { status: 500 })
  }
}
