import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Mock data for revenue analysis
    const data = {
      data: {
        labels: ["Container Shipping", "Bulk Cargo", "Special Cargo", "Value-Added Services", "Documentation"],
        datasets: [
          {
            label: "Revenue Distribution",
            data: [45, 25, 15, 10, 5],
            backgroundColor: [
              "rgba(53, 162, 235, 0.7)",
              "rgba(255, 99, 132, 0.7)",
              "rgba(75, 192, 192, 0.7)",
              "rgba(255, 159, 64, 0.7)",
              "rgba(153, 102, 255, 0.7)",
            ],
            borderColor: [
              "rgba(53, 162, 235, 1)",
              "rgba(255, 99, 132, 1)",
              "rgba(75, 192, 192, 1)",
              "rgba(255, 159, 64, 1)",
              "rgba(153, 102, 255, 1)",
            ],
            borderWidth: 1,
          },
        ],
      },
      options: {
        plugins: {
          title: {
            display: true,
            text: "Revenue Distribution by Service Type (%)",
          },
          legend: {
            position: "right",
          },
        },
        cutout: "60%",
      },
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching revenue metrics:", error)
    return NextResponse.json({ error: "Failed to fetch revenue metrics" }, { status: 500 })
  }
}
