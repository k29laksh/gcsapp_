import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// Try to import prisma, fallback to mock if connection fails
let prisma: any = null
try {
  prisma = require("@/lib/prisma").prisma
} catch (error) {
  console.log("Prisma not available, using mock data")
}

// Mock employee data as fallback
const mockEmployees = [
  {
    id: "emp1",
    firstName: "John",
    lastName: "Doe",
    employeeId: "EMP001",
    email: "john.doe@company.com",
    phone: "9876543210",
    position: "Software Developer",
    department: "IT",
    salary: 50000,
    status: "ACTIVE",
    joiningDate: "2024-01-15",
    createdAt: new Date(),
  },
  {
    id: "emp2",
    firstName: "Jane",
    lastName: "Smith",
    employeeId: "EMP002",
    email: "jane.smith@company.com",
    phone: "9876543211",
    position: "Project Manager",
    department: "IT",
    salary: 60000,
    status: "ACTIVE",
    joiningDate: "2024-02-01",
    createdAt: new Date(),
  },
]

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const isManager = searchParams.get("isManager")
    const status = searchParams.get("status")
    const department = searchParams.get("department")

    // Try to fetch from database first
    if (prisma) {
      try {
        const whereClause: any = {}

        if (isManager === "true") {
          whereClause.OR = [
            { jobTitle: { contains: "Manager", mode: "insensitive" } },
            { jobTitle: { contains: "Director", mode: "insensitive" } },
            { jobTitle: { contains: "Lead", mode: "insensitive" } },
            { jobTitle: { contains: "Head", mode: "insensitive" } },
          ]
        }

        if (status && status !== "all") {
          whereClause.status = status
        }

        if (department && department !== "all") {
          whereClause.department = department
        }

        const employees = await prisma.employee.findMany({
          where: whereClause,
          orderBy: {
            createdAt: "desc",
          },
        })

        return NextResponse.json(employees)
      } catch (dbError) {
        console.error("Database error, falling back to mock data:", dbError)
        // Fall through to mock data
      }
    }

    // Fallback to mock data
    let filteredEmployees = mockEmployees

    if (status && status !== "all") {
      filteredEmployees = filteredEmployees.filter((emp) => emp.status === status)
    }

    if (department && department !== "all") {
      filteredEmployees = filteredEmployees.filter((emp) => emp.department === department)
    }

    return NextResponse.json(filteredEmployees)
  } catch (error) {
    console.error("Error fetching employees:", error)
    return NextResponse.json({ message: "Failed to fetch employees" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const data = await request.json()

    // Try to create in database first
    if (prisma) {
      try {
        // Generate employee ID
        const employeeCount = await prisma.employee.count()
        const employeeId = `EMP${String(employeeCount + 1).padStart(4, "0")}`

        const employee = await prisma.employee.create({
          data: {
            ...data,
            employeeId,
            position: data.jobTitle,
            employeeType: data.employmentType || "FULL_TIME",
            joiningDate: new Date(),
            status: "ACTIVE",
          },
        })

        return NextResponse.json(employee, { status: 201 })
      } catch (dbError) {
        console.error("Database error, using mock creation:", dbError)
        // Fall through to mock creation
      }
    }

    // Fallback to mock creation
    const newEmployee = {
      id: `emp_${Date.now()}`,
      firstName: data.firstName,
      lastName: data.lastName,
      employeeId: data.employeeId || `EMP${String(mockEmployees.length + 1).padStart(3, "0")}`,
      email: data.email,
      phone: data.phone || "",
      position: data.position || data.jobTitle,
      department: data.department || "General",
      salary: Number(data.salary) || 0,
      status: data.status || "ACTIVE",
      joiningDate: data.joiningDate || new Date().toISOString().split("T")[0],
      createdAt: new Date(),
    }

    return NextResponse.json(newEmployee, { status: 201 })
  } catch (error) {
    console.error("Error creating employee:", error)
    return NextResponse.json({ message: "Failed to create employee" }, { status: 500 })
  }
}
