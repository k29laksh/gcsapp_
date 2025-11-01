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

    const expense = await prisma.expense.findUnique({
      where: {
        id: params.id,
      },
      include: {
        vendor: true,
        project: true,
        account: true,
      },
    })

    if (!expense) {
      return new NextResponse(JSON.stringify({ message: "Expense not found" }), { status: 404 })
    }

    return NextResponse.json(expense)
  } catch (error) {
    console.error("Error fetching expense:", error)
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

    // Check if expense exists
    const existingExpense = await prisma.expense.findUnique({
      where: {
        id: params.id,
      },
    })

    if (!existingExpense) {
      return new NextResponse(JSON.stringify({ message: "Expense not found" }), { status: 404 })
    }

    // Update expense
    const expense = await prisma.expense.update({
      where: {
        id: params.id,
      },
      data: {
        date: data.date ? new Date(data.date) : undefined,
        vendorId: data.vendorId,
        category: data.category,
        amount: Number.parseFloat(data.amount),
        description: data.description || "",
        reference: data.reference || "",
        projectId: data.projectId === "none" ? null : data.projectId,
        accountId: data.accountId === "none" ? null : data.accountId,
      },
    })

    // Create activity log
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "UPDATE",
        entityType: "EXPENSE",
        entityId: expense.id,
        description: `Updated expense: ${expense.category} - ${expense.amount}`,
      },
    })

    return NextResponse.json(expense)
  } catch (error) {
    console.error("Error updating expense:", error)
    return new NextResponse(JSON.stringify({ message: "Internal Server Error" }), { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return new NextResponse(JSON.stringify({ message: "Unauthorized" }), { status: 401 })
    }

    // Check if expense exists
    const existingExpense = await prisma.expense.findUnique({
      where: {
        id: params.id,
      },
    })

    if (!existingExpense) {
      return new NextResponse(JSON.stringify({ message: "Expense not found" }), { status: 404 })
    }

    // Delete expense
    await prisma.expense.delete({
      where: {
        id: params.id,
      },
    })

    // Create activity log
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "DELETE",
        entityType: "EXPENSE",
        entityId: params.id,
        description: `Deleted expense: ${existingExpense.category} - ${existingExpense.amount}`,
      },
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("Error deleting expense:", error)
    return new NextResponse(JSON.stringify({ message: "Internal Server Error" }), { status: 500 })
  }
}
