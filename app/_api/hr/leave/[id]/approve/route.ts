import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// Mock data store
const leaveRequestsStore = [
  {
    id: "1",
    employeeId: "emp1",
    leaveType: "SICK",
    startDate: new Date("2025-01-15"),
    endDate: new Date("2025-01-16"),
    totalDays: 2,
    reason: "Fever and cold",
    status: "PENDING",
    contactDetails: "9876543210",
    emergencyContact: "9876543211",
    createdAt: new Date(),
    employee: {
      id: "emp1",
      firstName: "John",
      lastName: "Doe",
      employeeId: "EMP001",
      position: "Software Developer",
    },
  },
]

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const index = leaveRequestsStore.findIndex((req) => req.id === params.id)

    if (index === -1) {
      return new NextResponse("Leave request not found", { status: 404 })
    }

    // Update status to approved
    leaveRequestsStore[index].status = "APPROVED"

    return NextResponse.json(leaveRequestsStore[index])
  } catch (error) {
    console.error("Error approving leave request:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
