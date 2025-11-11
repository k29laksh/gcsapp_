"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from "recharts";
import { Loader2 } from "lucide-react";
import { StatsCard } from "@/components/dashboard/stats-card";
import {
  Users,
  Briefcase,
  FileText,
  CreditCard,
  TrendingUp,
  Clock,
  AlertCircle,
  CheckCircle,
  DollarSign,
} from "lucide-react";

interface StatsOverviewProps {
  stats: {
    totalCustomers: number;
    activeProjects: number;
    pendingInvoices: number;
    totalRevenue: number;
    newInquiries: number;
    overdueInvoices: number;
    tasksInProgress: number;
    completedProjects: number;
  };
}

export function StatsOverview({ stats }: StatsOverviewProps) {
  const [loading, setLoading] = useState(true);
  const [apiStats, setApiStats] = useState<any>({});
  const [salesData, setSalesData] = useState<any[]>([]);
  const [purchasesData, setPurchasesData] = useState<any[]>([]);
  const [projectStatusData, setProjectStatusData] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch real dashboard stats
        const statsResponse = await fetch("/api/dashboard/stats");
        if (!statsResponse.ok) throw new Error("Failed to fetch stats");

        const statsData = await statsResponse.json();
        setApiStats(statsData);

        // Use the real data from API
        setSalesData(statsData.salesData || []);
        setPurchasesData(statsData.purchasesData || []);
        setProjectStatusData(statsData.projectStatusData || []);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        // Set fallback data
        setApiStats({
          totalCustomers: stats.totalCustomers,
          activeProjects: stats.activeProjects,
          pendingInvoices: stats.pendingInvoices,
          totalRevenue: stats.totalRevenue,
          overdueInvoices: stats.overdueInvoices,
          completedProjects: stats.completedProjects,
          tasksInProgress: stats.tasksInProgress,
          revenueGrowth: 0,
          customerGrowth: 0,
          projectCompletionRate: 0,
        });
        setSalesData([]);
        setPurchasesData([]);
        setProjectStatusData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [stats]);

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

  if (loading) {
    return (
      <div className="flex h-[300px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Tabs defaultValue="overview" className="space-y-4">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="sales">Sales</TabsTrigger>
        <TabsTrigger value="purchases">Purchases</TabsTrigger>
        <TabsTrigger value="projects">Projects</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Customers"
            value={apiStats.totalCustomers || 0}
            description="Active customers"
            trend={apiStats.customerGrowth || 0}
            icon={<Users className="h-4 w-4 text-muted-foreground" />}
          />

          <StatsCard
            title="Active Projects"
            value={apiStats.activeProjects || 0}
            description="Projects in progress"
            trend={5.2}
            icon={<Briefcase className="h-4 w-4 text-muted-foreground" />}
          />

          <StatsCard
            title="Pending Invoices"
            value={apiStats.pendingInvoices || 0}
            description="Awaiting payment"
            trend={-1.8}
            trendDirection="down"
            icon={<FileText className="h-4 w-4 text-muted-foreground" />}
          />

          <StatsCard
            title="Total Revenue"
            value={apiStats.totalRevenue || 0}
            isCurrency={true}
            description="This year"
            trend={apiStats.revenueGrowth || 0}
            icon={<CreditCard className="h-4 w-4 text-muted-foreground" />}
          />

          <StatsCard
            title="Monthly Revenue"
            value={apiStats.revenueThisMonth || 0}
            isCurrency={true}
            description="Current month"
            trend={apiStats.revenueGrowth || 0}
            icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
          />

          <StatsCard
            title="Overdue Invoices"
            value={apiStats.overdueInvoices || 0}
            description="Needs attention"
            trend={3.2}
            trendDirection="down"
            icon={<AlertCircle className="h-4 w-4 text-muted-foreground" />}
          />

          <StatsCard
            title="Tasks In Progress"
            value={apiStats.tasksInProgress || 0}
            description="Across all projects"
            trend={1.2}
            icon={<Clock className="h-4 w-4 text-muted-foreground" />}
          />

          <StatsCard
            title="Completed Projects"
            value={apiStats.completedProjects || 0}
            description="Total completed"
            trend={4.9}
            icon={<CheckCircle className="h-4 w-4 text-muted-foreground" />}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Monthly Revenue Trend</CardTitle>
              <CardDescription>Revenue over the last 6 months</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <ResponsiveContainer width="100%" height={350}>
                {salesData.length > 0 ? (
                  <LineChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip
                      formatter={(value) => [
                        `₹${Number(value).toLocaleString()}`,
                        "Revenue",
                      ]}
                    />
                    <Line
                      type="monotone"
                      dataKey="amount"
                      stroke="#0088FE"
                      strokeWidth={3}
                      dot={{ fill: "#0088FE", strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    No revenue data available
                  </div>
                )}
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>Project Status</CardTitle>
              <CardDescription>Current status distribution</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                {projectStatusData.length > 0 ? (
                  <PieChart>
                    <Pie
                      data={projectStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                    >
                      {projectStatusData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    No project data available
                  </div>
                )}
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="sales" className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₹{(apiStats.totalRevenue || 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                +{apiStats.revenueGrowth || 0}% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Pending Invoices
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {apiStats.pendingInvoices || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                ₹{(apiStats.pendingInvoiceAmount || 0).toLocaleString()} pending
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                New Customers
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {apiStats.newCustomers || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                +{apiStats.customerGrowth || 0}% from last month
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Sales Overview</CardTitle>
              <CardDescription>Monthly sales performance</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <ResponsiveContainer width="100%" height={350}>
                {salesData.length > 0 ? (
                  <BarChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip
                      formatter={(value) => [
                        `₹${Number(value).toLocaleString()}`,
                        "Sales",
                      ]}
                    />
                    <Bar dataKey="amount" fill="#0088FE" name="Sales" />
                  </BarChart>
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    No sales data available
                  </div>
                )}
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>Top Customers</CardTitle>
              <CardDescription>By revenue contribution</CardDescription>
            </CardHeader>
            <CardContent>
              {apiStats.topCustomers && apiStats.topCustomers.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={apiStats.topCustomers}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                    >
                      {apiStats.topCustomers.map(
                        (entry: any, index: number) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        )
                      )}
                    </Pie>
                    <Tooltip
                      formatter={(value) => [
                        `₹${Number(value).toLocaleString()}`,
                        "Revenue",
                      ]}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                  No customer data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="purchases" className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Purchases
              </CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₹{(apiStats.totalPurchases || 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                +{apiStats.purchaseGrowth || 0}% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Vendors
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {apiStats.activeVendors || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {apiStats.newVendors || 0} new this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Pending Payments
              </CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {apiStats.pendingPayments || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                ₹{(apiStats.pendingPaymentAmount || 0).toLocaleString()} pending
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Purchase Overview</CardTitle>
              <CardDescription>
                Monthly purchases for the current year
              </CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <ResponsiveContainer width="100%" height={350}>
                {purchasesData.length > 0 ? (
                  <BarChart data={purchasesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip
                      formatter={(value) => [
                        `₹${Number(value).toLocaleString()}`,
                        "Purchases",
                      ]}
                    />
                    <Bar dataKey="amount" fill="#00C49F" name="Purchases" />
                  </BarChart>
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    No purchase data available
                  </div>
                )}
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>Top Vendors</CardTitle>
              <CardDescription>By purchase volume</CardDescription>
            </CardHeader>
            <CardContent>
              {apiStats.topVendors && apiStats.topVendors.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={apiStats.topVendors}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                    >
                      {apiStats.topVendors.map((entry: any, index: number) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => [
                        `₹${Number(value).toLocaleString()}`,
                        "Purchases",
                      ]}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                  No vendor data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="projects" className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Projects
              </CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {apiStats.activeProjects || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {apiStats.completedProjects || 0} completed this year
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Project Revenue
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₹{(apiStats.projectRevenue || 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {apiStats.totalRevenue > 0
                  ? Math.round(
                      (apiStats.projectRevenue / apiStats.totalRevenue) * 100
                    )
                  : 0}
                % of total revenue
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Completion Rate
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {apiStats.projectCompletionRate || 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                Average project completion
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Project Status Distribution</CardTitle>
              <CardDescription>Current status of all projects</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                {projectStatusData.length > 0 ? (
                  <PieChart>
                    <Pie
                      data={projectStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                    >
                      {projectStatusData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    No project status data available
                  </div>
                )}
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>Project Metrics</CardTitle>
              <CardDescription>Key performance indicators</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">On Time Delivery</span>
                  <span className="text-sm font-bold">85%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Budget Adherence</span>
                  <span className="text-sm font-bold">92%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    Client Satisfaction
                  </span>
                  <span className="text-sm font-bold">4.8/5</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    Resource Utilization
                  </span>
                  <span className="text-sm font-bold">78%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>
    </Tabs>
  );
}
