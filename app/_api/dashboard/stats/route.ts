import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get current date ranges for comparison
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    // Get comprehensive dashboard statistics
    const [
      totalCustomers,
      totalVendors,
      totalProjects,
      totalEmployees,
      totalInvoices,
      totalQuotations,
      activeProjects,
      completedProjects,
      pendingInvoices,
      overdueInvoices,
      thisMonthInvoices,
      lastMonthInvoices,
      thisMonthRevenue,
      lastMonthRevenue,
      thisYearRevenue,
      pendingTasks,
      completedTasks,
      newCustomersThisMonth,
      newCustomersLastMonth,
      recentActivities,
    ] = await Promise.all([
      // Basic counts
      prisma.customer.count(),
      prisma.vendor.count(),
      prisma.project.count(),
      prisma.employee.count(),
      prisma.invoice.count(),
      prisma.quotation.count(),

      // Project statistics
      prisma.project.count({
        where: { status: "IN_PROGRESS" },
      }),
      prisma.project.count({
        where: { status: "COMPLETED" },
      }),

      // Invoice statistics
      prisma.invoice.count({
        where: { status: { in: ["SENT", "PARTIALLY_PAID"] } },
      }),
      prisma.invoice.count({
        where: {
          status: { in: ["SENT", "PARTIALLY_PAID", "OVERDUE"] },
          dueDate: { lt: now },
        },
      }),

      // Monthly invoice counts
      prisma.invoice.count({
        where: {
          createdAt: { gte: startOfMonth },
        },
      }),
      prisma.invoice.count({
        where: {
          createdAt: { gte: startOfLastMonth, lt: startOfMonth },
        },
      }),

      // Revenue calculations
      prisma.invoice.aggregate({
        where: {
          createdAt: { gte: startOfMonth },
          status: { not: "CANCELLED" },
        },
        _sum: { total: true },
      }),
      prisma.invoice.aggregate({
        where: {
          createdAt: { gte: startOfLastMonth, lt: startOfMonth },
          status: { not: "CANCELLED" },
        },
        _sum: { total: true },
      }),
      prisma.invoice.aggregate({
        where: {
          createdAt: { gte: startOfYear },
          status: { not: "CANCELLED" },
        },
        _sum: { total: true },
      }),

      // Task statistics
      prisma.task.count({
        where: { status: { in: ["TODO", "IN_PROGRESS"] } },
      }),
      prisma.task.count({
        where: { status: "COMPLETED" },
      }),

      // Customer growth
      prisma.customer.count({
        where: { createdAt: { gte: startOfMonth } },
      }),
      prisma.customer.count({
        where: { createdAt: { gte: startOfLastMonth, lt: startOfMonth } },
      }),

      // Recent activities
      prisma.activityLog.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: { firstName: true, lastName: true },
          },
        },
      }),
    ]);

    // Calculate growth percentages
    const revenueGrowth = lastMonthRevenue._sum.total
      ? Math.round(
          (((thisMonthRevenue._sum.total || 0) -
            (lastMonthRevenue._sum.total || 0)) /
            (lastMonthRevenue._sum.total || 1)) *
            100
        )
      : 100;

    const customerGrowth = newCustomersLastMonth
      ? Math.round(
          ((newCustomersThisMonth - newCustomersLastMonth) /
            newCustomersLastMonth) *
            100
        )
      : 100;

    const invoiceGrowth = lastMonthInvoices
      ? Math.round(
          ((thisMonthInvoices - lastMonthInvoices) / lastMonthInvoices) * 100
        )
      : 100;

    // Calculate project completion rate
    const totalProjectsCount = activeProjects + completedProjects;
    const projectCompletionRate =
      totalProjectsCount > 0
        ? Math.round((completedProjects / totalProjectsCount) * 100)
        : 0;

    // Get top customers by revenue
    const topCustomers = await prisma.customer.findMany({
      include: {
        invoices: {
          where: { status: { not: "CANCELLED" } },
          select: { total: true },
        },
      },
      take: 5,
    });

    const topCustomersData = topCustomers
      .map((customer) => ({
        name:
          customer.companyName || `${customer.firstName} ${customer.lastName}`,
        value: customer.invoices.reduce(
          (sum, invoice) => sum + invoice.total,
          0
        ),
      }))
      .filter((customer) => customer.value > 0)
      .sort((a, b) => b.value - a.value);

    // Get top vendors by purchase amount
    const topVendors = await prisma.vendor.findMany({
      include: {
        purchaseOrders: {
          where: { status: { not: "CANCELLED" } },
          select: { total: true },
        },
      },
      take: 5,
    });

    const topVendorsData = topVendors
      .map((vendor) => ({
        name: vendor.companyName || `${vendor.firstName} ${vendor.lastName}`,
        value: vendor.purchaseOrders.reduce((sum, po) => sum + po.total, 0),
      }))
      .filter((vendor) => vendor.value > 0)
      .sort((a, b) => b.value - a.value);

    // Get monthly sales data for the last 6 months
    const salesData = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      const monthlyRevenue = await prisma.invoice.aggregate({
        where: {
          createdAt: { gte: monthStart, lte: monthEnd },
          status: { not: "CANCELLED" },
        },
        _sum: { total: true },
      });

      salesData.push({
        month: monthStart.toLocaleDateString("en-US", { month: "short" }),
        amount: monthlyRevenue._sum.total || 0,
      });
    }

    // Get monthly purchases data for the last 6 months
    const purchasesData = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      const monthlyPurchases = await prisma.purchaseOrder.aggregate({
        where: {
          createdAt: { gte: monthStart, lte: monthEnd },
          status: { not: "CANCELLED" },
        },
        _sum: { total: true },
      });

      purchasesData.push({
        month: monthStart.toLocaleDateString("en-US", { month: "short" }),
        amount: monthlyPurchases._sum.total || 0,
      });
    }

    // Get project status distribution
    const projectStatusData = await prisma.project.groupBy({
      by: ["status"],
      _count: { status: true },
    });

    const projectStatusFormatted = projectStatusData.map((item) => ({
      name: item.status.replace("_", " "),
      value: item._count.status,
    }));

    return NextResponse.json({
      // Basic counts
      totalCustomers,
      totalVendors,
      totalProjects,
      totalEmployees,
      totalInvoices,
      totalQuotations,

      // Project metrics
      activeProjects,
      completedProjects,
      projectCompletionRate,

      // Financial metrics
      revenueThisMonth: thisMonthRevenue._sum.total || 0,
      revenueLastMonth: lastMonthRevenue._sum.total || 0,
      totalRevenue: thisYearRevenue._sum.total || 0,
      revenueGrowth,

      // Invoice metrics
      pendingInvoices,
      overdueInvoices,
      pendingInvoiceAmount: 0, // Will calculate separately if needed
      invoiceGrowth,

      // Task metrics
      pendingTasks,
      completedTasks,
      tasksInProgress: pendingTasks,

      // Customer metrics
      newCustomers: newCustomersThisMonth,
      customerGrowth,

      // Purchase metrics
      totalPurchases: purchasesData.reduce((sum, item) => sum + item.amount, 0),
      pendingPayments: 0, // Will implement if needed
      activeVendors: totalVendors,
      newVendors: 0, // Will implement if needed

      // Chart data
      salesData,
      purchasesData,
      projectStatusData: projectStatusFormatted,
      topCustomers: topCustomersData,
      topVendors: topVendorsData,

      // Recent activities
      recentActivities,

      // Additional metrics
      salesGrowth: revenueGrowth,
      purchaseGrowth: 0, // Will calculate if needed
      upcomingDeadlines: 0, // Will implement if needed
      overdueDeadlines: 0, // Will implement if needed
      projectRevenue: thisYearRevenue._sum.total || 0,
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard statistics" },
      { status: 500 }
    );
  }
}
