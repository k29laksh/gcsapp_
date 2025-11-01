"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StatsOverview } from "@/components/dashboard/stats-overview";
import { RecentActivities } from "@/components/dashboard/recent-activities";
import { UpcomingTasks } from "@/components/dashboard/upcoming-tasks";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { 
  useGetCustomersQuery} from "@/redux/Service/customer";
import {
  useGetInvoicesQuery} from "@/redux/Service/invoice";
import {
  useGetProjectsQuery} from "@/redux/Service/projects";
import {
  useGetTasksQuery
} from "@/redux/Service/tasks";

export default function DashboardPage() {
  const { toast } = useToast();

  // RTK Query hooks
  const { 
    data: customersData, 
    isLoading: customersLoading, 
    refetch: refetchCustomers 
  } = useGetCustomersQuery();
  
  const { 
    data: invoicesData, 
    isLoading: invoicesLoading, 
    refetch: refetchInvoices 
  } = useGetInvoicesQuery();
  
  const { 
    data: projectsData, 
    isLoading: projectsLoading, 
    refetch: refetchProjects 
  } = useGetProjectsQuery();
  
  const { 
    data: tasksData, 
    isLoading: tasksLoading, 
    refetch: refetchTasks 
  } = useGetTasksQuery();

  // Calculate stats from RTK Query data
  const stats = {
    totalCustomers: customersData?.length || 0,
    activeProjects: projectsData?.length || 0,
    pendingInvoices: invoicesData?.length || 0,
    totalRevenue: invoicesData?.filter((invoice: any) => invoice.status === 'paid')?.reduce((sum: number, invoice: any) => sum + (parseFloat(invoice.amount) || 0), 0) || 0,
    newInquiries: customersData?.filter((customer: any) => {
      const createdDate = new Date(customer.created_at);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return createdDate > thirtyDaysAgo;
    })?.length || 0,
    overdueInvoices: invoicesData?.filter((invoice: any) => {
      if (invoice.status !== 'paid' && invoice.due_date) {
        const dueDate = new Date(invoice.due_date);
        return dueDate < new Date();
      }
      return false;
    })?.length || 0,
    tasksInProgress: tasksData?.length || 0,
    completedProjects: projectsData?.filter((project: any) => project.status === 'completed')?.length || 0,
  };

  // Loading state
  const isLoading = customersLoading || invoicesLoading || projectsLoading || tasksLoading;

  // Refresh function
  const handleRefresh = () => {
    refetchCustomers();
    refetchInvoices();
    refetchProjects();
    refetchTasks();
    
    toast({
      title: "Dashboard Updated",
      description: "Latest data has been loaded successfully",
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="mt-2 text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, User! Here's your business overview.
          </p>
        </div>
        <Button
          onClick={handleRefresh}
          variant="outline"
          disabled={isLoading}
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      <StatsOverview stats={stats} />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
            <CardDescription>
              Latest system activities and updates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RecentActivities 
              customers={customersData?.slice(0, 5) || []}
              invoices={invoicesData?.slice(0, 5) || []}
              projects={projectsData?.slice(0, 5) || []}
            />
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Upcoming Tasks</CardTitle>
            <CardDescription>Tasks requiring your attention</CardDescription>
          </CardHeader>
          <CardContent>
            <UpcomingTasks 
              tasks={tasksData?.slice(0, 5) || []}
            />
          </CardContent>
        </Card>
      </div>

      {/* Data Lengths Debug Section - You can remove this in production */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Data Overview</CardTitle>
          <CardDescription>Current data counts from RTK Query</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="space-y-1">
              <div className="font-medium">Customers</div>
              <div className="text-2xl font-bold text-primary">{customersData?.length || 0}</div>
            </div>
            <div className="space-y-1">
              <div className="font-medium">Invoices</div>
              <div className="text-2xl font-bold text-primary">{invoicesData?.length || 0}</div>
            </div>
            <div className="space-y-1">
              <div className="font-medium">Projects</div>
              <div className="text-2xl font-bold text-primary">{projectsData?.length || 0}</div>
            </div>
            <div className="space-y-1">
              <div className="font-medium">Tasks</div>
              <div className="text-2xl font-bold text-primary">{tasksData?.length || 0}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}