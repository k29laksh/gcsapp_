import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return new NextResponse(JSON.stringify({ message: "Unauthorized" }), { status: 401 })
    }

    // Mock data for team performance metrics
    const data = {
      labels: [
        "Productivity",
        "Code Quality",
        "Collaboration",
        "On-time Delivery",
        "Technical Skills",
        "Problem Solving",
        "Documentation",
      ],
      datasets: [
        {
          label: "Frontend Team",
          data: [85, 78, 90, 82, 88, 85, 75],
          backgroundColor: "rgba(54, 162, 235, 0.2)",
          borderColor: "rgb(54, 162, 235)",
          pointBackgroundColor: "rgb(54, 162, 235)",
          pointBorderColor: "#fff",
          pointHoverBackgroundColor: "#fff",
          pointHoverBorderColor: "rgb(54, 162, 235)",
        },
        {
          label: "Backend Team",
          data: [80, 92, 75, 88, 95, 90, 82],
          backgroundColor: "rgba(255, 99, 132, 0.2)",
          borderColor: "rgb(255, 99, 132)",
          pointBackgroundColor: "rgb(255, 99, 132)",
          pointBorderColor: "#fff",
          pointHoverBackgroundColor: "#fff",
          pointHoverBorderColor: "rgb(255, 99, 132)",
        },
        {
          label: "DevOps Team",
          data: [75, 85, 80, 95, 90, 85, 88],
          backgroundColor: "rgba(75, 192, 192, 0.2)",
          borderColor: "rgb(75, 192, 192)",
          pointBackgroundColor: "rgb(75, 192, 192)",
          pointBorderColor: "#fff",
          pointHoverBackgroundColor: "#fff",
          pointHoverBorderColor: "rgb(75, 192, 192)",
        },
      ],
    }

    const options = {
      responsive: true,
      plugins: {
        legend: {
          position: "top",
        },
        title: {
          display: true,
          text: "Team Performance Metrics",
        },
      },
      scales: {
        r: {
          angleLines: {
            display: true,
          },
          suggestedMin: 0,
          suggestedMax: 100,
        },
      },
    }

    // Team velocity data
    const velocityData = {
      labels: ["Sprint 1", "Sprint 2", "Sprint 3", "Sprint 4", "Sprint 5", "Sprint 6"],
      datasets: [
        {
          label: "Frontend Team",
          data: [32, 36, 40, 38, 42, 45],
          borderColor: "rgb(54, 162, 235)",
          backgroundColor: "rgba(54, 162, 235, 0.5)",
          tension: 0.3,
        },
        {
          label: "Backend Team",
          data: [28, 35, 38, 42, 40, 44],
          borderColor: "rgb(255, 99, 132)",
          backgroundColor: "rgba(255, 99, 132, 0.5)",
          tension: 0.3,
        },
        {
          label: "DevOps Team",
          data: [20, 25, 28, 30, 32, 35],
          borderColor: "rgb(75, 192, 192)",
          backgroundColor: "rgba(75, 192, 192, 0.5)",
          tension: 0.3,
        },
      ],
    }

    const velocityOptions = {
      responsive: true,
      plugins: {
        legend: {
          position: "top",
        },
        title: {
          display: true,
          text: "Team Velocity (Story Points)",
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: "Story Points",
          },
        },
      },
    }

    return NextResponse.json({
      data,
      options,
      velocityData,
      velocityOptions,
    })
  } catch (error) {
    console.error("Error fetching team metrics:", error)
    return new NextResponse(JSON.stringify({ message: "Internal Server Error" }), { status: 500 })
  }
}
