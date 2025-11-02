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
import { 
  useGetCustomersQuery} from "@/redux/Service/customer";
import {
  useGetInvoicesQuery} from "@/redux/Service/invoice";
import {
  useGetProjectsQuery} from "@/redux/Service/projects";
import {
  useGetTasksQuery
} from "@/redux/Service/tasks";

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
  
  // RTK Query hooks
  const { 
    data: customersData = [], 
    isLoading: customersLoading 
  } = useGetCustomersQuery();
  
  const { 
    data: invoicesData = [], 
    isLoading: invoicesLoading 
  } = useGetInvoicesQuery();
  
  const { 
    data: projectsData = [], 
    isLoading: projectsLoading 
  } = useGetProjectsQuery();
  
  const { 
    data: tasksData = [], 
    isLoading: tasksLoading 
  } = useGetTasksQuery();
  
 

  const isLoading = customersLoading || invoicesLoading || projectsLoading || tasksLoading ;

  // Calculate stats from RTK Query data
  const calculatedStats = {
    // Customer stats
    totalCustomers: customersData.length,
    newCustomers: customersData.filter((customer: any) => {
      const createdDate = new Date(customer.created_at);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return createdDate > thirtyDaysAgo;
    }).length,
    customerGrowth: 12.5, // You can calculate this based on historical data

    // Project stats
    activeProjects: projectsData.filter((project: any) => 
      project.status === 'Active' || project.status === 'In Progress'
    ).length,
    completedProjects: projectsData.filter((project: any) => 
      project.status === 'Completed'
    ).length,
    projectRevenue: projectsData.reduce((sum: number, project: any) => 
      sum + (parseFloat(project.value) || 0), 0
    ),
    projectCompletionRate: projectsData.length > 0 ? 
      Math.round((projectsData.filter((p: any) => p.status === 'Completed').length / projectsData.length) * 100) : 0,

    // Invoice stats
    pendingInvoices: invoicesData.filter((invoice: any) => 
      invoice.status === 'pending' || invoice.status === 'unpaid'
    ).length,
    overdueInvoices: invoicesData.filter((invoice: any) => {
      if ((invoice.status === 'pending' || invoice.status === 'unpaid') && invoice.due_date) {
        const dueDate = new Date(invoice.due_date);
        return dueDate < new Date();
      }
      return false;
    }).length,
    totalRevenue: invoicesData
      .filter((invoice: any) => invoice.status === 'paid')
      .reduce((sum: number, invoice: any) => sum + (parseFloat(invoice.amount) || 0), 0),
    revenueThisMonth: invoicesData
      .filter((invoice: any) => {
        if (invoice.status === 'paid' && invoice.payment_date) {
          const paymentDate = new Date(invoice.payment_date);
          const now = new Date();
          return paymentDate.getMonth() === now.getMonth() && 
                 paymentDate.getFullYear() === now.getFullYear();
        }
        return false;
      })
      .reduce((sum: number, invoice: any) => sum + (parseFloat(invoice.amount) || 0), 0),
    revenueGrowth: 8.3, // Calculate based on historical data

    // Task stats
    tasksInProgress: tasksData.filter((task: any) => 
      task.status === 'in_progress' || task.status === 'pending'
    ).length,

 
    totalPurchases: 0, // You might need purchase data from another endpoint
    purchaseGrowth: 5.7,
    pendingPayments: 0, // You might need payment data from another endpoint
    pendingPaymentAmount: 0,
  };

  // Generate chart data from RTK Query data
  const salesData = generateSalesData(invoicesData);
  const purchasesData = generatePurchasesData(); // You might need actual purchase data
  const projectStatusData = generateProjectStatusData(projectsData);
  const topCustomers = generateTopCustomers(customersData, invoicesData);

  function generateSalesData(invoices: any[]) {
    const paidInvoices = invoices.filter((inv: any) => inv.status === 'paid');
    const monthlyData: { [key: string]: number } = {};
    
    paidInvoices.forEach((invoice: any) => {
      if (invoice.payment_date) {
        const date = new Date(invoice.payment_date);
        const monthYear = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        monthlyData[monthYear] = (monthlyData[monthYear] || 0) + (parseFloat(invoice.amount) || 0);
      }
    });
    
    return Object.entries(monthlyData)
      .map(([month, amount]) => ({ month, amount }))
      .slice(-6); // Last 6 months
  }

  function generatePurchasesData() {
    // Mock data - replace with actual purchase data
    return [
      { month: 'Jan', amount: 45000 },
      { month: 'Feb', amount: 52000 },
      { month: 'Mar', amount: 48000 },
      { month: 'Apr', amount: 61000 },
      { month: 'May', amount: 55000 },
      { month: 'Jun', amount: 59000 },
    ];
  }

  function generateProjectStatusData(projects: any[]) {
    const statusCount: { [key: string]: number } = {};
    
    projects.forEach((project: any) => {
      const status = project.status || 'Unknown';
      statusCount[status] = (statusCount[status] || 0) + 1;
    });
    
    return Object.entries(statusCount).map(([name, value]) => ({ name, value }));
  }

  function generateTopCustomers(customers: any[], invoices: any[]) {
    const customerRevenue: { [key: string]: number } = {};
    
    invoices
      .filter((inv: any) => inv.status === 'paid')
      .forEach((invoice: any) => {
        if (invoice.customer) {
          const customer = customers.find((c: any) => c.id === invoice.customer);
          if (customer) {
            const customerName = customer.company_name || `${customer.first_name} ${customer.last_name}`;
            customerRevenue[customerName] = (customerRevenue[customerName] || 0) + (parseFloat(invoice.amount) || 0);
          }
        }
      });
    
    return Object.entries(customerRevenue)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([name, value]) => ({ name, value }));
  }

 
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

  if (isLoading) {
    return (
      <div className="flex h-[300px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Tabs defaultValue="overview" className="space-y-4">
      <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto gap-1">
        <TabsTrigger value="overview" className="text-xs sm:text-sm py-2">Overview</TabsTrigger>
        <TabsTrigger value="sales" className="text-xs sm:text-sm py-2">Sales</TabsTrigger>
        <TabsTrigger value="purchases" className="text-xs sm:text-sm py-2">Purchases</TabsTrigger>
        <TabsTrigger value="projects" className="text-xs sm:text-sm py-2">Projects</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Customers"
            value={calculatedStats.totalCustomers}
            description="Active customers"
            trend={calculatedStats.customerGrowth}
            icon={<Users className="h-4 w-4 text-muted-foreground" />}
          />

          <StatsCard
            title="Active Projects"
            value={calculatedStats.activeProjects}
            description="Projects in progress"
            trend={5.2}
            icon={<Briefcase className="h-4 w-4 text-muted-foreground" />}
          />

          <StatsCard
            title="Pending Invoices"
            value={calculatedStats.pendingInvoices}
            description="Awaiting payment"
            trend={-1.8}
            trendDirection="down"
            icon={<FileText className="h-4 w-4 text-muted-foreground" />}
          />

          <StatsCard
            title="Total Revenue"
            value={calculatedStats.totalRevenue}
            isCurrency={true}
            description="This year"
            trend={calculatedStats.revenueGrowth}
            icon={<CreditCard className="h-4 w-4 text-muted-foreground" />}
          />

          <StatsCard
            title="Monthly Revenue"
            value={calculatedStats.revenueThisMonth}
            isCurrency={true}
            description="Current month"
            trend={calculatedStats.revenueGrowth}
            icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
          />

          <StatsCard
            title="Overdue Invoices"
            value={calculatedStats.overdueInvoices}
            description="Needs attention"
            trend={3.2}
            trendDirection="down"
            icon={<AlertCircle className="h-4 w-4 text-muted-foreground" />}
          />

          <StatsCard
            title="Tasks In Progress"
            value={calculatedStats.tasksInProgress}
            description="Across all projects"
            trend={1.2}
            icon={<Clock className="h-4 w-4 text-muted-foreground" />}
          />

          <StatsCard
            title="Completed Projects"
            value={calculatedStats.completedProjects}
            description="Total completed"
            trend={4.9}
            icon={<CheckCircle className="h-4 w-4 text-muted-foreground" />}
          />
        </div>

        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-7">
          <Card className="lg:col-span-4">
            <CardHeader className="px-4 sm:px-6">
              <CardTitle className="text-base sm:text-lg">Monthly Revenue Trend</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Revenue over the last 6 months</CardDescription>
            </CardHeader>
            <CardContent className="pl-0 sm:pl-2 px-2 sm:px-6">
              <ResponsiveContainer width="100%" height={300} className="sm:h-[350px]">
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

          <Card className="lg:col-span-3">
            <CardHeader className="px-4 sm:px-6">
              <CardTitle className="text-base sm:text-lg">Project Status</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Current status distribution</CardDescription>
            </CardHeader>
            <CardContent className="px-2 sm:px-6">
              <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
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
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 sm:px-6">
              <CardTitle className="text-xs sm:text-sm font-medium">Total Sales</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₹{calculatedStats.totalRevenue.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                +{calculatedStats.revenueGrowth}% from last month
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
                {calculatedStats.pendingInvoices}
              </div>
              <p className="text-xs text-muted-foreground">
                {/* You can add pending invoice amount calculation here */}
                {calculatedStats.pendingInvoices} invoices pending
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
                {calculatedStats.newCustomers}
              </div>
              <p className="text-xs text-muted-foreground">
                +{calculatedStats.customerGrowth}% from last month
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-7">
          <Card className="lg:col-span-4">
            <CardHeader className="px-4 sm:px-6">
              <CardTitle className="text-base sm:text-lg">Sales Overview</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Monthly sales performance</CardDescription>
            </CardHeader>
            <CardContent className="pl-0 sm:pl-2 px-2 sm:px-6">
              <ResponsiveContainer width="100%" height={300} className="sm:h-[350px]">
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

          <Card className="lg:col-span-3">
            <CardHeader className="px-4 sm:px-6">
              <CardTitle className="text-base sm:text-lg">Top Customers</CardTitle>
              <CardDescription className="text-xs sm:text-sm">By revenue contribution</CardDescription>
            </CardHeader>
            <CardContent className="px-2 sm:px-6">
              {topCustomers.length > 0 ? (
                <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
                  <PieChart>
                    <Pie
                      data={topCustomers}
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
                      {topCustomers.map((entry: any, index: number) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
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
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 sm:px-6">
              <CardTitle className="text-xs sm:text-sm font-medium">
                Total Purchases
              </CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₹{calculatedStats.totalPurchases.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                +{calculatedStats.purchaseGrowth}% from last month
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
                {calculatedStats.pendingPayments}
              </div>
              <p className="text-xs text-muted-foreground">
                ₹{calculatedStats.pendingPaymentAmount.toLocaleString()} pending
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-7">
          <Card className="lg:col-span-4">
            <CardHeader className="px-4 sm:px-6">
              <CardTitle className="text-base sm:text-lg">Purchase Overview</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Monthly purchases for the current year
              </CardDescription>
            </CardHeader>
            <CardContent className="pl-0 sm:pl-2 px-2 sm:px-6">
              <ResponsiveContainer width="100%" height={300} className="sm:h-[350px]">
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

        </div>
      </TabsContent>

      <TabsContent value="projects" className="space-y-4">
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 sm:px-6">
              <CardTitle className="text-xs sm:text-sm font-medium">
                Active Projects
              </CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {calculatedStats.activeProjects}
              </div>
              <p className="text-xs text-muted-foreground">
                {calculatedStats.completedProjects} completed this year
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
                ₹{calculatedStats.projectRevenue.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {calculatedStats.totalRevenue > 0
                  ? Math.round(
                      (calculatedStats.projectRevenue / calculatedStats.totalRevenue) * 100
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
                {calculatedStats.projectCompletionRate}%
              </div>
              <p className="text-xs text-muted-foreground">
                Average project completion
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-7">
          <Card className="lg:col-span-4">
            <CardHeader className="px-4 sm:px-6">
              <CardTitle className="text-base sm:text-lg">Project Status Distribution</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Current status of all projects</CardDescription>
            </CardHeader>
            <CardContent className="px-2 sm:px-6">
              <ResponsiveContainer width="100%" height={300} className="sm:h-[350px]">
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

          <Card className="lg:col-span-3">
            <CardHeader className="px-4 sm:px-6">
              <CardTitle className="text-base sm:text-lg">Project Metrics</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Key performance indicators</CardDescription>
            </CardHeader>
            <CardContent className="px-4 sm:px-6">
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-medium">On Time Delivery</span>
                  <span className="text-sm sm:text-base font-bold">85%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-medium">Budget Adherence</span>
                  <span className="text-sm sm:text-base font-bold">92%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-medium">
                    Client Satisfaction
                  </span>
                  <span className="text-sm sm:text-base font-bold">4.8/5</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-medium">
                    Resource Utilization
                  </span>
                  <span className="text-sm sm:text-base font-bold">78%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>
    </Tabs>
  );
}