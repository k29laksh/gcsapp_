import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Get total customers
    const totalCustomers = await prisma.customer.count()

    // Get company customers
    const companyCustomers = await prisma.customer.count({
      where: {
        customerType: "company",
      },
    })

    // Get individual customers
    const individualCustomers = await prisma.customer.count({
      where: {
        customerType: "individual",
      },
    })

    // Get customers with active projects
    const activeCustomers = await prisma.customer.count({
      where: {
        projects: {
          some: {
            status: {
              in: ["IN_PROGRESS", "ACTIVE", "ONGOING"],
            },
          },
        },
      },
    })

    // Get customers created this month
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const newThisMonth = await prisma.customer.count({
      where: {
        createdAt: {
          gte: startOfMonth,
        },
      },
    })

    // Get total projects
    const totalProjects = await prisma.project.count()

    // Get total revenue from invoices
    const invoiceRevenue = await prisma.invoice.aggregate({
      _sum: {
        total: true,
      },
    })

    const totalRevenue = Number(invoiceRevenue._sum.total || 0)

    // Calculate average project value
    const avgProjectValue = totalProjects > 0 ? totalRevenue / totalProjects : 0

    return NextResponse.json({
      totalCustomers,
      companyCustomers,
      individualCustomers,
      activeCustomers,
      newThisMonth,
      totalProjects,
      totalRevenue,
      avgProjectValue,
    })
  } catch (error) {
    console.error("Error fetching customer stats:", error)
    return NextResponse.json({ message: "Failed to fetch customer stats" }, { status: 500 })
  }
}
