import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// Try to import prisma, fallback to mock if connection fails
let prisma: any = null
try {
  prisma = require("@/lib/prisma").prisma
} catch (error) {
  console.log("Prisma not available, using mock data")
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Try to fetch from database first
    if (prisma) {
      try {
        const employee = await prisma.employee.findUnique({
          where: { id: params.id },
        })

        if (!employee) {
          return new NextResponse("Employee not found", { status: 404 })
        }

        return NextResponse.json(employee)
      } catch (dbError) {
        console.error("Database error:", dbError)
        return new NextResponse("Database connection error", { status: 500 })
      }
    }

    // Fallback response
    return new NextResponse("Employee service temporarily unavailable", { status: 503 })
  } catch (error) {
    console.error("Error fetching employee:", error)
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

    // Try to update in database first
    if (prisma) {
      try {
        const employee = await prisma.employee.update({
          where: { id: params.id },
          data: body,
        })

        return NextResponse.json(employee)
      } catch (dbError) {
        console.error("Database error:", dbError)
        return new NextResponse("Database connection error", { status: 500 })
      }
    }

    // Fallback response
    return new NextResponse("Employee service temporarily unavailable", { status: 503 })
  } catch (error) {
    console.error("Error updating employee:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Try to delete from database first
    if (prisma) {
      try {
        await prisma.employee.delete({
          where: { id: params.id },
        })

        return new NextResponse(null, { status: 204 })
      } catch (dbError) {
        console.error("Database error:", dbError)
        return new NextResponse("Database connection error", { status: 500 })
      }
    }

    // Fallback response
    return new NextResponse("Employee service temporarily unavailable", { status: 503 })
  } catch (error) {
    console.error("Error deleting employee:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
