import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// Try to import prisma
let prisma: any = null
try {
  prisma = require("@/lib/prisma").default || require("@/lib/prisma").prisma
} catch (error) {
  console.log("Prisma not available, using fallback")
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const month = searchParams.get("month")
    const employeeId = searchParams.get("employeeId")

    if (prisma) {
      try {
        const whereClause: any = {}

        if (month) {
          whereClause.month = month
        }

        if (employeeId && employeeId !== "all") {
          whereClause.employeeId = employeeId
        }

        const payrollRecords = await prisma.payroll.findMany({
          where: whereClause,
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
          orderBy: {
            createdAt: "desc",
          },
        })

        return NextResponse.json(payrollRecords)
      } catch (dbError) {
        console.error("Database error, using fallback:", dbError)
        // Fall through to mock data
      }
    }

    // Fallback mock data
    const mockData = [
      {
        id: "mock_1",
        employeeId: "emp1",
        month: month || "2025-01",
        basicSalary: 50000,
        allowances: 5000,
        deductions: 2000,
        netSalary: 53000,
        status: "paid",
        paymentDate: "2025-01-31",
        notes: "Mock data - database unavailable",
        createdAt: new Date(),
        employee: {
          id: "emp1",
          firstName: "John",
          lastName: "Doe",
          employeeId: "EMP001",
          position: "Software Developer",
          salary: 50000,
        },
      },
    ]

    return NextResponse.json(mockData)
  } catch (error) {
    console.error("Error fetching payroll records:", error)
    return NextResponse.json({ message: "Failed to fetch payroll records" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const data = await request.json()

    // Validate required fields
    if (!data.employeeId || !data.month || data.basicSalary === undefined) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 })
    }

    if (prisma) {
      try {
        // Check if employee exists
        const employee = await prisma.employee.findUnique({
          where: { id: data.employeeId },
        })

        if (!employee) {
          return NextResponse.json({ message: "Employee not found" }, { status: 404 })
        }

        // Check if payroll already exists for this employee and month
        const existingPayroll = await prisma.payroll.findFirst({
          where: {
            employeeId: data.employeeId,
            month: data.month,
          },
        })

        if (existingPayroll) {
          return NextResponse.json({ message: "Payroll already exists for this employee and month" }, { status: 400 })
        }

        // Calculate net salary
        const basicSalary = Number(data.basicSalary)
        const allowances = Number(data.allowances || 0)
        const deductions = Number(data.deductions || 0)
        const netSalary = basicSalary + allowances - deductions

        // Create payroll record
        const payrollRecord = await prisma.payroll.create({
          data: {
            employeeId: data.employeeId,
            month: data.month,
            basicSalary: basicSalary,
            allowances: allowances,
            deductions: deductions,
            netSalary: netSalary,
            status: data.status || "pending",
            paymentDate: data.paymentDate || null,
            notes: data.notes || "",
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

        return NextResponse.json(payrollRecord, { status: 201 })
      } catch (dbError) {
        console.error("Database error creating payroll:", dbError)
        return NextResponse.json({ message: "Database error: " + dbError.message }, { status: 500 })
      }
    }

    // Fallback for when database is not available
    return NextResponse.json({ message: "Database not available" }, { status: 503 })
  } catch (error) {
    console.error("Error creating payroll record:", error)
    return NextResponse.json({ message: "Failed to create payroll record" }, { status: 500 })
  }
}
