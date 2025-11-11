"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import {
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Users,
  CreditCard,
  AlertTriangle,
  FileText,
  TrendingUp,
  Percent,
  Calendar,
} from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { DataTable } from "@/components/data-table"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { format } from "date-fns"
import type { ColumnDef } from "@tanstack/react-table"

// Types
interface SalesMetric {
  title: string
  value: string | number
  change: number
  icon: React.ReactNode
  iconColor: string
}

interface SalesByProduct {
  productName: string
  revenue: number
  quantity: number
  profit: number
  profitMargin: number
}

interface AccountsReceivable {
  id: string
  customer: string
  invoiceNumber: string
  amount: number
  dueDate: string
  status: string
  daysOverdue: number
}

interface SalesRepPerformance {
  id: string
  name: string
  revenue: number
  deals: number
  conversionRate: number
  avgDealSize: number
  commission: number
}

export default function SalesDashboard() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date(),
  })

  // State for metrics and data
  const [salesMetrics, setSalesMetrics] = useState<SalesMetric[]>([])
  const [revenueData, setRevenueData] = useState([])
  const [salesByCategory, setSalesByCategory] = useState([])
  const [productPerformance, setProductPerformance] = useState<SalesByProduct[]>([])
  const [accountsReceivable, setAccountsReceivable] = useState<AccountsReceivable[]>([])
  const [salesRepPerformance, setSalesRepPerformance] = useState<SalesRepPerformance[]>([])
  const [taxLiability, setTaxLiability] = useState([])
  const [quarterlyTarget, setQuarterlyTarget] = useState({ current: 0, target: 0 })

  useEffect(() => {
    fetchDashboardData()
  }, [dateRange])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)

      // Format date range for API
      const fromDate = format(dateRange.from, "yyyy-MM-dd")
      const toDate = format(dateRange.to, "yyyy-MM-dd")

      // Fetch all required data
      const [
        metricsResponse,
        revenueResponse,
        categoryResponse,
        productResponse,
        receivablesResponse,
        performanceResponse,
        taxResponse,
        targetResponse,
      ] = await Promise.all([
        fetch(`/api/sales/dashboard/metrics?from=${fromDate}&to=${toDate}`),
        fetch(`/api/sales/dashboard/revenue-trend?from=${fromDate}&to=${toDate}`),
        fetch(`/api/sales/dashboard/sales-by-category?from=${fromDate}&to=${toDate}`),
        fetch(`/api/sales/dashboard/product-performance?from=${fromDate}&to=${toDate}`),
        fetch(`/api/sales/dashboard/accounts-receivable`),
        fetch(`/api/sales/dashboard/sales-rep-performance?from=${fromDate}&to=${toDate}`),
        fetch(`/api/sales/dashboard/tax-liability?from=${fromDate}&to=${toDate}`),
        fetch(`/api/sales/dashboard/quarterly-target`),
      ])

      // Process responses
      const metrics = await metricsResponse.json()
      const revenue = await revenueResponse.json()
      const categories = await categoryResponse.json()
      const products = await productResponse.json()
      const receivables = await receivablesResponse.json()
      const performance = await performanceResponse.json()
      const tax = await taxResponse.json()
      const target = await targetResponse.json()

      // Update state with fetched data
      setSalesMetrics([
        {
          title: "Total Revenue",
          value: `$${metrics.totalRevenue.toLocaleString()}`,
          change: metrics.revenueChange,
          icon: <DollarSign className="h-4 w-4" />,
          iconColor: "text-green-500",
        },
        {
          title: "Gross Profit",
          value: `$${metrics.grossProfit.toLocaleString()}`,
          change: metrics.profitChange,
          icon: <TrendingUp className="h-4 w-4" />,
          iconColor: "text-blue-500",
        },
        {
          title: "Profit Margin",
          value: `${metrics.profitMargin}%`,
          change: metrics.marginChange,
          icon: <Percent className="h-4 w-4" />,
          iconColor: "text-purple-500",
        },
        {
          title: "New Customers",
          value: metrics.newCustomers,
          change: metrics.customerChange,
          icon: <Users className="h-4 w-4" />,
          iconColor: "text-orange-500",
        },
        {
          title: "Avg. Deal Size",
          value: `$${metrics.avgDealSize.toLocaleString()}`,
          change: metrics.dealSizeChange,
          icon: <FileText className="h-4 w-4" />,
          iconColor: "text-cyan-500",
        },
        {
          title: "Tax Collected",
          value: `$${metrics.taxCollected.toLocaleString()}`,
          change: metrics.taxChange,
          icon: <CreditCard className="h-4 w-4" />,
          iconColor: "text-emerald-500",
        },
        {
          title: "Overdue Invoices",
          value: metrics.overdueInvoices,
          change: metrics.overdueChange,
          icon: <AlertTriangle className="h-4 w-4" />,
          iconColor: "text-red-500",
        },
        {
          title: "Sales Cycle",
          value: `${metrics.salesCycle} days`,
          change: metrics.cycleChange,
          icon: <Calendar className="h-4 w-4" />,
          iconColor: "text-amber-500",
        },
      ])

      setRevenueData(revenue)
      setSalesByCategory(categories)
      setProductPerformance(products)
      setAccountsReceivable(receivables)
      setSalesRepPerformance(performance)
      setTaxLiability(tax)
      setQuarterlyTarget(target)
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
      toast({
        title: "Error",
        description: "",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Table columns
  const productColumns: ColumnDef<SalesByProduct>[] = [
    {
      accessorKey: "productName",
      header: "Product/Service",
    },
    {
      accessorKey: "revenue",
      header: "Revenue",
      cell: ({ row }) => `$${row.original.revenue.toLocaleString()}`,
    },
    {
      accessorKey: "quantity",
      header: "Quantity",
    },
    {
      accessorKey: "profit",
      header: "Profit",
      cell: ({ row }) => `$${row.original.profit.toLocaleString()}`,
    },
    {
      accessorKey: "profitMargin",
      header: "Margin",
      cell: ({ row }) => `${row.original.profitMargin}%`,
    },
  ]

  const receivablesColumns: ColumnDef<AccountsReceivable>[] = [
    {
      accessorKey: "customer",
      header: "Customer",
    },
    {
      accessorKey: "invoiceNumber",
      header: "Invoice #",
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => `$${row.original.amount.toLocaleString()}`,
    },
    {
      accessorKey: "dueDate",
      header: "Due Date",
      cell: ({ row }) => new Date(row.original.dueDate).toLocaleDateString(),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status
        let className = "px-2 py-1 rounded text-xs font-medium"

        switch (status) {
          case "PAID":
            className += " bg-green-100 text-green-800"
            break
          case "OVERDUE":
            className += " bg-red-100 text-red-800"
            break
          case "PENDING":
            className += " bg-yellow-100 text-yellow-800"
            break
          default:
            className += " bg-gray-100 text-gray-800"
        }

        return <span className={className}>{status}</span>
      },
    },
    {
      accessorKey: "daysOverdue",
      header: "Days Overdue",
      cell: ({ row }) => {
        const days = row.original.daysOverdue
        if (days <= 0) return "-"
        return <span className="text-red-500 font-medium">{days}</span>
      },
    },
  ]

  const performanceColumns: ColumnDef<SalesRepPerformance>[] = [
    {
      accessorKey: "name",
      header: "Sales Rep",
    },
    {
      accessorKey: "revenue",
      header: "Revenue",
      cell: ({ row }) => `$${row.original.revenue.toLocaleString()}`,
    },
    {
      accessorKey: "deals",
      header: "Deals Closed",
    },
    {
      accessorKey: "conversionRate",
      header: "Conversion",
      cell: ({ row }) => `${row.original.conversionRate}%`,
    },
    {
      accessorKey: "avgDealSize",
      header: "Avg. Deal Size",
      cell: ({ row }) => `$${row.original.avgDealSize.toLocaleString()}`,
    },
    {
      accessorKey: "commission",
      header: "Commission",
      cell: ({ row }) => `$${row.original.commission.toLocaleString()}`,
    },
  ]

  // Colors for charts
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sales Dashboard</h1>
          <p className="text-muted-foreground">Financial overview of your sales performance and metrics</p>
        </div>

        <div className="flex items-center gap-2">
          <DateRangePicker date={dateRange} setDate={setDateRange} />
          <Button onClick={fetchDashboardData} variant="outline">
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {salesMetrics.map((metric, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between space-y-0">
                <p className="text-sm font-medium text-muted-foreground">{metric.title}</p>
                <div className={`p-2 rounded-full ${metric.iconColor} bg-opacity-10`}>{metric.icon}</div>
              </div>
              <div className="flex items-baseline justify-between mt-4">
                <h3 className="text-2xl font-bold">{metric.value}</h3>
                <div className={`flex items-center text-xs ${metric.change >= 0 ? "text-green-500" : "text-red-500"}`}>
                  {metric.change >= 0 ? (
                    <ArrowUpRight className="h-3 w-3 mr-1" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3 mr-1" />
                  )}
                  {Math.abs(metric.change)}%
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quarterly Target */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Quarterly Sales Target</CardTitle>
          <CardDescription>Progress toward your quarterly revenue goal</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                ${quarterlyTarget.current.toLocaleString()} of ${quarterlyTarget.target.toLocaleString()}
              </span>
              <span className="text-sm font-medium">
                {Math.round((quarterlyTarget.current / quarterlyTarget.target) * 100)}%
              </span>
            </div>
            <Progress value={(quarterlyTarget.current / quarterlyTarget.target) * 100} />
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="revenue">
        <TabsList className="grid grid-cols-1 md:grid-cols-4 h-auto">
          <TabsTrigger value="revenue">Revenue Analysis</TabsTrigger>
          <TabsTrigger value="receivables">Accounts Receivable</TabsTrigger>
          <TabsTrigger value="products">Product Performance</TabsTrigger>
          <TabsTrigger value="salesreps">Sales Rep Performance</TabsTrigger>
        </TabsList>

        {/* Revenue Analysis Tab */}
        <TabsContent value="revenue" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trend</CardTitle>
                <CardDescription>Monthly revenue over time</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, "Revenue"]} />
                    <Legend />
                    <Line type="monotone" dataKey="revenue" stroke="#0088FE" strokeWidth={2} />
                    <Line type="monotone" dataKey="target" stroke="#8884d8" strokeDasharray="5 5" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sales by Category</CardTitle>
                <CardDescription>Revenue distribution by product category</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={salesByCategory}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {salesByCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, "Revenue"]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Tax Liability</CardTitle>
              <CardDescription>Monthly sales tax collected</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={taxLiability}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, "Tax Amount"]} />
                  <Legend />
                  <Bar dataKey="taxAmount" fill="#8884d8" name="Tax Collected" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Accounts Receivable Tab */}
        <TabsContent value="receivables" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Accounts Receivable Aging</CardTitle>
              <CardDescription>Outstanding invoices by age</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    { name: "Current", value: 45000 },
                    { name: "1-30 Days", value: 32000 },
                    { name: "31-60 Days", value: 18000 },
                    { name: "61-90 Days", value: 8500 },
                    { name: "90+ Days", value: 4200 },
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, "Amount"]} />
                  <Bar dataKey="value" fill="#82ca9d" name="Outstanding Amount">
                    <Cell fill="#4ade80" />
                    <Cell fill="#facc15" />
                    <Cell fill="#fb923c" />
                    <Cell fill="#f87171" />
                    <Cell fill="#ef4444" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Outstanding Invoices</CardTitle>
              <CardDescription>Detailed list of unpaid and overdue invoices</CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable columns={receivablesColumns} data={accountsReceivable} searchKey="customer" />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Product Performance Tab */}
        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Product Performance</CardTitle>
              <CardDescription>Revenue and profitability by product</CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable columns={productColumns} data={productPerformance} searchKey="productName" />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Top Products by Revenue</CardTitle>
                <CardDescription>Highest revenue generating products</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={productPerformance.slice(0, 5)}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="productName" width={150} />
                    <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, "Revenue"]} />
                    <Bar dataKey="revenue" fill="#0088FE" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Profit Margin by Product</CardTitle>
                <CardDescription>Products ranked by profit margin</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[...productPerformance].sort((a, b) => b.profitMargin - a.profitMargin).slice(0, 5)}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" unit="%" />
                    <YAxis type="category" dataKey="productName" width={150} />
                    <Tooltip formatter={(value) => [`${value}%`, "Profit Margin"]} />
                    <Bar dataKey="profitMargin" fill="#00C49F" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Sales Rep Performance Tab */}
        <TabsContent value="salesreps" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sales Representative Performance</CardTitle>
              <CardDescription>Revenue, deals, and commission by sales rep</CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable columns={performanceColumns} data={salesRepPerformance} searchKey="name" />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Sales Rep</CardTitle>
                <CardDescription>Total revenue generated by each sales rep</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={salesRepPerformance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, "Revenue"]} />
                    <Bar dataKey="revenue" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Conversion Rate by Sales Rep</CardTitle>
                <CardDescription>Lead to deal conversion percentage</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={salesRepPerformance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis unit="%" />
                    <Tooltip formatter={(value) => [`${value}%`, "Conversion Rate"]} />
                    <Bar dataKey="conversionRate" fill="#FF8042" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
