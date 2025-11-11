import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// Try to import prisma
let prisma: any = null
try {
  prisma = require("@/lib/prisma").default || require("@/lib/prisma").prisma
} catch (error) {
  console.log("Prisma not available, using fallback")
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    if (prisma) {
      try {
        const payroll = await prisma.payroll.findUnique({
          where: { id: params.id },
          include: {
            employee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                employeeId: true,
                position: true,
                email: true,
                salary: true,
              },
            },
          },
        })

        if (!payroll) {
          return new NextResponse("Payroll record not found", { status: 404 })
        }

        return NextResponse.json(payroll)
      } catch (dbError) {
        console.error("Database error:", dbError)
        return new NextResponse("Database error", { status: 500 })
      }
    }

    // Fallback mock data
    const mockPayroll = {
      id: params.id,
      employeeId: "emp1",
      month: "2025-01",
      basicSalary: 50000,
      allowances: 5000,
      deductions: 2000,
      netSalary: 53000,
      status: "paid",
      paymentDate: "2025-01-31",
      notes: "Mock data - database unavailable",
      employee: {
        id: "emp1",
        firstName: "John",
        lastName: "Doe",
        employeeId: "EMP001",
        position: "Software Developer",
        email: "john.doe@example.com",
        salary: 50000,
      },
    }

    return NextResponse.json(mockPayroll)
  } catch (error) {
    console.error("Error fetching payroll record:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await request.json()

    if (prisma) {
      try {
        // Validate required fields
        if (!body.month || !body.employeeId || body.basicSalary === undefined) {
          return new NextResponse("Missing required fields", { status: 400 })
        }

        // Check if payroll record exists
        const existingRecord = await prisma.payroll.findUnique({
          where: { id: params.id },
        })

        if (!existingRecord) {
          return new NextResponse("Payroll record not found", { status: 404 })
        }

        // Calculate net salary
        const basicSalary = Number(body.basicSalary)
        const allowances = Number(body.allowances || 0)
        const deductions = Number(body.deductions || 0)
        const netSalary = basicSalary + allowances - deductions

        // Update payroll record
        const payroll = await prisma.payroll.update({
          where: { id: params.id },
          data: {
            month: body.month,
            employeeId: body.employeeId,
            basicSalary: basicSalary,
            allowances: allowances,
            deductions: deductions,
            netSalary: netSalary,
            status: body.status,
            paymentDate: body.paymentDate,
            notes: body.notes,
          },
          include: {
            employee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                employeeId: true,
                position: true,
                salary: true,
              },
            },
          },
        })

        return NextResponse.json(payroll)
      } catch (dbError) {
        console.error("Database error updating payroll:", dbError)
        return new NextResponse("Database error: " + dbError.message, { status: 500 })
      }
    }

    return new NextResponse("Database not available", { status: 503 })
  } catch (error) {
    console.error("Error updating payroll record:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    if (prisma) {
      try {
        // Check if payroll record exists
        const existingRecord = await prisma.payroll.findUnique({
          where: { id: params.id },
        })

        if (!existingRecord) {
          return new NextResponse("Payroll record not found", { status: 404 })
        }

        // Delete payroll record
        await prisma.payroll.delete({
          where: { id: params.id },
        })

        return new NextResponse(null, { status: 204 })
      } catch (dbError) {
        console.error("Database error deleting payroll:", dbError)
        return new NextResponse("Database error: " + dbError.message, { status: 500 })
      }
    }

    return new NextResponse("Database not available", { status: 503 })
  } catch (error) {
    console.error("Error deleting payroll record:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
