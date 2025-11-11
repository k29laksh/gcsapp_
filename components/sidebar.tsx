"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { BarChart3, Users, FileText, Settings, CreditCard, ChevronDown, ChevronRight, Ship } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

interface SidebarItem {
  title: string
  href?: string
  icon: React.ReactNode
  submenu?: SidebarItem[]
  expanded?: boolean
}

export function Sidebar() {
  const pathname = usePathname()
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    sales: true,
    purchase: false,
    hr: false,
    projects: false,
  })

  const toggleExpanded = (key: string) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const sidebarItems: SidebarItem[] = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: <BarChart3 className="h-5 w-5" />,
    },
    {
      title: "Sales",
      icon: <FileText className="h-5 w-5" />,
      expanded: expanded.sales,
      submenu: [
        {
          title: "Dashboard",
          href: "/sales/dashboard",
          icon: <BarChart3 className="h-4 w-4" />,
        },
        {
          title: "Inquiries",
          href: "/sales/inquiry",
          icon: <FileText className="h-4 w-4" />,
        },
        {
          title: "Customers",
          href: "/sales/customer",
          icon: <Users className="h-4 w-4" />,
        },
        {
          title: "Quotations",
          href: "/sales/quotation",
          icon: <FileText className="h-4 w-4" />,
        },
        {
          title: "Invoices",
          href: "/sales/invoice",
          icon: <FileText className="h-4 w-4" />,
        },
        {
          title: "Delivery Challan",
          href: "/sales/deliverychallan",
          icon: <FileText className="h-4 w-4" />,
        },
        {
          title: "Credit Notes",
          href: "/sales/creditnote",
          icon: <FileText className="h-4 w-4" />,
        },
        {
          title: "Payments",
          href: "/sales/payment",
          icon: <CreditCard className="h-4 w-4" />,
        },
      ],
    },
    {
      title: "Purchase",
      icon: <FileText className="h-5 w-5" />,
      expanded: expanded.purchase,
      submenu: [
        {
          title: "Vendors",
          href: "/purchase/vendor",
          icon: <Users className="h-4 w-4" />,
        },
        {
          title: "Purchase Orders",
          href: "/purchase/po",
          icon: <FileText className="h-4 w-4" />,
        },
        {
          title: "Bills",
          href: "/purchase/bills",
          icon: <FileText className="h-4 w-4" />,
        },
        {
          title: "Expenses",
          href: "/purchase/expenses",
          icon: <CreditCard className="h-4 w-4" />,
        },
        {
          title: "Debit Notes",
          href: "/purchase/debitnote",
          icon: <FileText className="h-4 w-4" />,
        },
        {
          title: "Payments",
          href: "/purchase/payment",
          icon: <CreditCard className="h-4 w-4" />,
        },
      ],
    },
    {
      title: "HR",
      icon: <Users className="h-5 w-5" />,
      expanded: expanded.hr,
      submenu: [
        {
          title: "Employees",
          href: "/hr/employees",
          icon: <Users className="h-4 w-4" />,
        },
        {
          title: "Attendance",
          href: "/hr/attendance",
          icon: <FileText className="h-4 w-4" />,
        },
        {
          title: "Leave Management",
          href: "/hr/leave",
          icon: <FileText className="h-4 w-4" />,
        },
        {
          title: "Payroll",
          href: "/hr/payroll",
          icon: <CreditCard className="h-4 w-4" />,
        },
      ],
    },
    {
      title: "Projects",
      icon: <BarChart3 className="h-5 w-5" />,
      expanded: expanded.projects,
      submenu: [
        {
          title: "All Projects",
          href: "/projects",
          icon: <BarChart3 className="h-4 w-4" />,
        },
        {
          title: "Tasks",
          href: "/projects/tasks",
          icon: <FileText className="h-4 w-4" />,
        },
        {
          title: "Time Tracking",
          href: "/projects/time",
          icon: <FileText className="h-4 w-4" />,
        },
        {
          title: "Requirements",
          href: "/projects/requirements",
          icon: <FileText className="h-4 w-4" />,
        },
      ],
    },
    {
      title: "Vessels",
      href: "/vessels",
      icon: <Ship className="h-5 w-5" />,
    },
    {
      title: "Settings",
      href: "/settings/company-profile",
      icon: <Settings className="h-5 w-5" />,
    },
  ]

  const renderSidebarItems = (items: SidebarItem[], level = 0) => {
    return items.map((item, index) => (
      <div key={index} className={cn(level > 0 && "ml-4")}>
        {item.href ? (
          <Button
            variant="ghost"
            asChild
            className={cn(
              "mb-1 flex w-full justify-start",
              pathname === item.href
                ? "bg-muted font-medium text-primary hover:bg-muted hover:text-primary"
                : "font-normal hover:bg-transparent hover:text-primary",
              level > 0 && "h-9 text-sm",
            )}
          >
            <Link href={item.href}>
              {item.icon}
              <span className="ml-2">{item.title}</span>
            </Link>
          </Button>
        ) : (
          <Button
            variant="ghost"
            className={cn("mb-1 flex w-full justify-between font-medium", level > 0 && "h-9 text-sm")}
            onClick={() => toggleExpanded(item.title.toLowerCase())}
          >
            <span className="flex items-center">
              {item.icon}
              <span className="ml-2">{item.title}</span>
            </span>
            {item.expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        )}
        {item.submenu && item.expanded && renderSidebarItems(item.submenu, level + 1)}
      </div>
    ))
  }

  return (
    <div className="h-screen w-64 border-r bg-background z-40">
      <ScrollArea className="h-full">
        <div className="px-3 py-4">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">GCS Marine</h2>
          <div className="space-y-1">{renderSidebarItems(sidebarItems)}</div>
        </div>
      </ScrollArea>
    </div>
  )
}
