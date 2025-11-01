"use client"

import { cn } from "@/lib/utils"

interface ChartData {
  labels: string[]
  datasets: {
    label: string
    data: number[]
    backgroundColor?: string | string[]
    borderColor?: string | string[]
    borderWidth?: number
  }[]
}

interface ChartProps {
  type: "bar" | "line" | "pie" | "doughnut"
  data: ChartData
  options?: any
  className?: string
  height?: number
}

export function Chart({ type, data, options = {}, className, height = 300 }: ChartProps) {
  // Fallback data if data is undefined or malformed
  const safeData: ChartData = {
    labels: data?.labels || [],
    datasets: data?.datasets || [],
  }

  // Simple chart rendering without external dependencies
  const renderSimpleChart = () => {
    if (!safeData.labels.length || !safeData.datasets.length) {
      return (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          <p>No data available</p>
        </div>
      )
    }

    const maxValue = Math.max(...safeData.datasets.flatMap((dataset) => dataset.data))

    return (
      <div className="space-y-4">
        <div className="flex flex-wrap gap-4 mb-4">
          {safeData.datasets.map((dataset, index) => (
            <div key={index} className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded"
                style={{
                  backgroundColor: Array.isArray(dataset.backgroundColor)
                    ? dataset.backgroundColor[0]
                    : dataset.backgroundColor || "#3b82f6",
                }}
              />
              <span className="text-sm">{dataset.label}</span>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          {safeData.labels.map((label, index) => (
            <div key={index} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>{label}</span>
                <span>{safeData.datasets[0]?.data[index] || 0}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{
                    width: `${((safeData.datasets[0]?.data[index] || 0) / maxValue) * 100}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={cn("w-full", className)} style={{ height }}>
      {renderSimpleChart()}
    </div>
  )
}
