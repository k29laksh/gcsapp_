import type React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown } from "lucide-react"

interface StatsCardProps {
  title: string
  value: number | string
  description: string
  trend: number
  trendDirection?: "up" | "down"
  icon?: React.ReactNode
  isCurrency?: boolean
  isPercentage?: boolean
  trendLabel?: string
}

export function StatsCard({
  title,
  value,
  description,
  trend,
  trendDirection = "up",
  icon,
  isCurrency = false,
  isPercentage = false,
  trendLabel = "from last period",
}: StatsCardProps) {
  const formattedValue =
    typeof value === "number"
      ? isCurrency
        ? new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
          }).format(value)
        : isPercentage
          ? `${value}%`
          : value.toLocaleString()
      : value

  const actualTrendDirection = trendDirection === "down" ? (trend > 0 ? "down" : "up") : trend > 0 ? "up" : "down"
  const trendColor = actualTrendDirection === "up" ? "text-green-600" : "text-red-600"

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 sm:px-6 pt-4 sm:pt-6">
        <CardTitle className="text-xs sm:text-sm font-medium truncate pr-2">{title}</CardTitle>
        <div className="shrink-0">{icon}</div>
      </CardHeader>
      <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
        <div className="text-xl sm:text-2xl md:text-3xl font-bold truncate">{formattedValue}</div>
        <CardDescription className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mt-1 sm:mt-0 text-xs sm:text-sm">
          <span className="truncate">{description}</span>
          <div className={`flex items-center gap-1 ${trendColor} shrink-0`}>
            {actualTrendDirection === "up" ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            <span className="text-xs">{Math.abs(trend)}%</span>
            <span className="hidden sm:inline text-xs text-muted-foreground">{trendLabel}</span>
          </div>
        </CardDescription>
      </CardContent>
    </Card>
  )
}
