"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { BarChart3, Users, FileText, Settings, CreditCard, ChevronDown, ChevronRight, Ship, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"

interface SidebarItem {
  title: string
  href?: string
  icon: React.ReactNode
  submenu?: SidebarItem[]
  expanded?: boolean
}

interface SidebarProps {
  isMobileOpen?: boolean
  onMobileClose?: () => void
}

export function Sidebar({ isMobileOpen = false, onMobileClose }: SidebarProps = {}) {
  const pathname = usePathname()
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    sales: true,
    purchase: false,
    hr: false,
    projects: false,
  })
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const toggleExpanded = (key: string) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const sidebarItems: SidebarItem[] = [
    {
      title: "Dashboard",
      href: "/",
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
      <div key={index} className={cn(level > 0 && "ml-3 sm:ml-4")}>
        {item.href ? (
          <Button
            variant="ghost"
            asChild
            className={cn(
              "mb-1 flex w-full justify-start text-sm h-9 sm:h-10",
              pathname === item.href
                ? "bg-muted font-medium text-primary hover:bg-muted hover:text-primary"
                : "font-normal hover:bg-transparent hover:text-primary",
              level > 0 && "h-8 sm:h-9 text-xs sm:text-sm",
            )}
            onClick={() => onMobileClose?.()}
          >
            <Link href={item.href} className="flex items-center w-full">
              <span className="shrink-0">{item.icon}</span>
              <span className="ml-2 truncate">{item.title}</span>
            </Link>
          </Button>
        ) : (
          <Button
            variant="ghost"
            className={cn("mb-1 flex w-full justify-between font-medium text-sm h-9 sm:h-10", level > 0 && "h-8 sm:h-9 text-xs sm:text-sm")}
            onClick={() => toggleExpanded(item.title.toLowerCase())}
          >
            <span className="flex items-center truncate">
              <span className="shrink-0">{item.icon}</span>
              <span className="ml-2 truncate">{item.title}</span>
            </span>
            <span className="shrink-0">
              {item.expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </span>
          </Button>
        )}
        {item.submenu && item.expanded && renderSidebarItems(item.submenu, level + 1)}
      </div>
    ))
  }

  const sidebarContent = (
    <div className="px-2 sm:px-3 py-3 sm:py-4">
      <h2 className="mb-2 px-3 sm:px-4 text-base sm:text-lg font-semibold tracking-tight">GCS Marine</h2>
      <div className="space-y-1">{renderSidebarItems(sidebarItems)}</div>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:block h-screen w-56 lg:w-64 border-r bg-background z-40">
        <ScrollArea className="h-full">
          {sidebarContent}
        </ScrollArea>
      </div>
      
      {/* Mobile Sidebar */}
      <Sheet open={isMobileOpen} onOpenChange={(open) => !open && onMobileClose?.()}>
        <SheetContent side="left" className="w-[280px] sm:w-[320px] p-0">
          <ScrollArea className="h-full">
            {sidebarContent}
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </>
  )
}
