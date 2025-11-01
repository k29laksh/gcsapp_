import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return new NextResponse(JSON.stringify({ message: "Unauthorized" }), { status: 401 })
    }

    // Get projects by status
    const projectsByStatus = await prisma.project.groupBy({
      by: ["status"],
      _count: {
        id: true,
      },
    })

    // Map status to readable labels and colors
    const statusMap: Record<string, { label: string; color: string }> = {
      PLANNING: { label: "Planning", color: "rgba(59, 130, 246, 0.7)" },
      IN_PROGRESS: { label: "In Progress", color: "rgba(16, 185, 129, 0.7)" },
      ON_HOLD: { label: "On Hold", color: "rgba(245, 158, 11, 0.7)" },
      COMPLETED: { label: "Completed", color: "rgba(139, 92, 246, 0.7)" },
      CANCELLED: { label: "Cancelled", color: "rgba(239, 68, 68, 0.7)" },
    }

    // Prepare data for chart
    const labels: string[] = []
    const dataValues: number[] = []
    const backgroundColors: string[] = []

    projectsByStatus.forEach((item) => {
      const status = statusMap[item.status] || { label: item.status, color: "rgba(156, 163, 175, 0.7)" }
      labels.push(status.label)
      dataValues.push(item._count.id)
      backgroundColors.push(status.color)
    })

    // Format data for chart
    const data = {
      labels,
      datasets: [
        {
          data: dataValues,
          backgroundColor: backgroundColors,
          borderColor: backgroundColors.map((color) => color.replace("0.7", "1")),
          borderWidth: 1,
        },
      ],
    }

    // Chart options
    const options = {
      responsive: true,
      plugins: {
        legend: {
          position: "right" as const,
        },
        tooltip: {
          callbacks: {
            label: (context: any) => {
              const label = context.label || ""
              const value = context.raw || 0
              const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0)
              const percentage = Math.round((value / total) * 100)
              return `${label}: ${value} (${percentage}%)`
            },
          },
        },
      },
      cutout: "60%",
    }

    return NextResponse.json({
      data,
      options,
    })
  } catch (error) {
    console.error("Error fetching projects status data:", error)
    return new NextResponse(JSON.stringify({ message: "Internal Server Error" }), { status: 500 })
  }
}
