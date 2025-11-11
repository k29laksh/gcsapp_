import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Mock payslip generation
    const payslipContent = `
      PAYSLIP
      -------
      Employee ID: EMP001
      Name: John Doe
      Month: January 2025
      
      Basic Salary: ₹50,000
      Allowances: ₹5,000
      Deductions: ₹2,000
      Net Salary: ₹53,000
      
      Generated on: ${new Date().toLocaleDateString()}
    `

    const blob = new Blob([payslipContent], { type: "text/plain" })
    const buffer = await blob.arrayBuffer()

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="payslip-${params.id}.txt"`,
      },
    })
  } catch (error) {
    console.error("Error generating payslip:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
