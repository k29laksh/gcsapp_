import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const id = params.id
    const attendance = await prisma.attendance.findUnique({
      where: { id },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (!attendance) {
      return new NextResponse("Attendance record not found", { status: 404 })
    }

    return NextResponse.json(attendance)
  } catch (error) {
    console.error("Error fetching attendance record:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const id = params.id
    const body = await request.json()
    const { date, employeeId, status, checkIn, checkOut, notes } = body

    // Validate required fields
    if (!date || !employeeId || !status) {
      return new NextResponse("Missing required fields", { status: 400 })
    }

    // Check if attendance record exists
    const existingRecord = await prisma.attendance.findUnique({
      where: { id },
    })

    if (!existingRecord) {
      return new NextResponse("Attendance record not found", { status: 404 })
    }

    // Update attendance record
    const attendance = await prisma.attendance.update({
      where: { id },
      data: {
        date,
        employeeId,
        status,
        checkIn,
        checkOut,
        notes,
      },
    })

    return NextResponse.json(attendance)
  } catch (error) {
    console.error("Error updating attendance record:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const id = params.id

    // Check if attendance record exists
    const existingRecord = await prisma.attendance.findUnique({
      where: { id },
    })

    if (!existingRecord) {
      return new NextResponse("Attendance record not found", { status: 404 })
    }

    // Delete attendance record
    await prisma.attendance.delete({
      where: { id },
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("Error deleting attendance record:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
