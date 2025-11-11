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

    // Mock data for project metrics
    const projectStatusData = {
      data: {
        labels: ["In Progress", "Planning", "On Hold", "Completed", "Cancelled"],
        datasets: [
          {
            label: "Projects",
            data: [8, 3, 2, 12, 1],
            backgroundColor: [
              "rgba(54, 162, 235, 0.6)",
              "rgba(255, 206, 86, 0.6)",
              "rgba(255, 159, 64, 0.6)",
              "rgba(75, 192, 192, 0.6)",
              "rgba(255, 99, 132, 0.6)",
            ],
            borderColor: [
              "rgba(54, 162, 235, 1)",
              "rgba(255, 206, 86, 1)",
              "rgba(255, 159, 64, 1)",
              "rgba(75, 192, 192, 1)",
              "rgba(255, 99, 132, 1)",
            ],
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: "right",
          },
          title: {
            display: true,
            text: "Project Status Distribution",
          },
        },
      },
    }

    const projectCompletionData = {
      data: {
        labels: ["E-Commerce Platform", "CRM Integration", "Mobile App", "API Gateway", "Dashboard Redesign"],
        datasets: [
          {
            label: "Completed",
            data: [68, 42, 58, 85, 25],
            backgroundColor: "rgba(75, 192, 192, 0.6)",
          },
          {
            label: "Remaining",
            data: [32, 58, 42, 15, 75],
            backgroundColor: "rgba(201, 203, 207, 0.6)",
          },
        ],
      },
      options: {
        indexAxis: "y",
        responsive: true,
        plugins: {
          legend: {
            position: "top",
          },
          title: {
            display: true,
            text: "Project Completion Percentage",
          },
        },
        scales: {
          x: {
            stacked: true,
            max: 100,
          },
          y: {
            stacked: true,
          },
        },
      },
    }

    const deploymentData = {
      data: {
        labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct"],
        datasets: [
          {
            label: "Deployments",
            data: [3, 5, 4, 6, 8, 7, 9, 8, 10, 5],
            borderColor: "rgb(54, 162, 235)",
            backgroundColor: "rgba(54, 162, 235, 0.5)",
            tension: 0.3,
          },
          {
            label: "Build Success Rate (%)",
            data: [92, 94, 90, 95, 97, 96, 98, 97, 99, 95],
            borderColor: "rgb(75, 192, 192)",
            backgroundColor: "rgba(75, 192, 192, 0.5)",
            tension: 0.3,
            yAxisID: "y1",
          },
        ],
      },
      options: {
        responsive: true,
        interaction: {
          mode: "index",
          intersect: false,
        },
        plugins: {
          title: {
            display: true,
            text: "Deployment Metrics",
          },
        },
        scales: {
          y: {
            type: "linear",
            display: true,
            position: "left",
            title: {
              display: true,
              text: "Number of Deployments",
            },
          },
          y1: {
            type: "linear",
            display: true,
            position: "right",
            title: {
              display: true,
              text: "Success Rate (%)",
            },
            min: 80,
            max: 100,
            grid: {
              drawOnChartArea: false,
            },
          },
        },
      },
    }

    return NextResponse.json({
      projectStatusData,
      projectCompletionData,
      deploymentData,
      deploymentOptions: deploymentData.options,
    })
  } catch (error) {
    console.error("Error fetching project metrics:", error)
    return new NextResponse(JSON.stringify({ message: "Internal Server Error" }), { status: 500 })
  }
}
