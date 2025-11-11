"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { CalendarIcon, Plus, Edit, Trash2, Eye, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { DataTable } from "@/components/ui/data-table";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  useGetPayrollQuery,
  useDeletePayrollMutation,
  useDownloadPayslipMutation,
} from "@/redux/Service/payroll";
import { useGetEmployeeQuery } from "@/redux/Service/employee";

interface PayrollRecord {
  id: string;
  employee: string;
  date: string;
  basic_salary: string;
  allowances: string;
  deductions: string;
  net_salary: string;
  status: string;
  notes?: string;
  pdf?: string;
  pay_month: string;
  transaction_id?: string;
  employee_details?: {
    name: string;
    employee_id: string;
    job_title: string;
    department_name: string;
  };
}

export default function PayrollPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [date, setDate] = useState<Date>(new Date());

  const {
    data: payrollData = [],
    isLoading,
    error,
  } = useGetPayrollQuery({ month: format(date, "yyyy-MM") });
  const [deletePayroll] = useDeletePayrollMutation();
  const [downloadPayslip] = useDownloadPayslipMutation();
  const { data: employees = [] } = useGetEmployeeQuery();

  // Prepare data with employee details
  const preparedData = useMemo(() => {
    return payrollData.map((record: PayrollRecord) => {
      const employee = employees.find((emp: any) => emp.id === record.employee);
      return {
        ...record,
        employee_details: employee
          ? {
              name: employee.name,
              employee_id: employee.employee_id,
              job_title: employee.job_title,
              department_name: employee.department_name,
            }
          : {
              name: "Unknown Employee",
              employee_id: "N/A",
              job_title: "N/A",
              department_name: "N/A",
            },
      };
    });
  }, [payrollData, employees]);

  const handleDelete = async (id: string) => {
    try {
      await deletePayroll(id).unwrap();
      toast({
        title: "Success",
        description: "Payroll record deleted successfully",
      });
    } catch (error: any) {
      console.error("Error deleting payroll record:", error);
      toast({
        title: "Error",
        description: error?.data?.message || "Failed to delete payroll record",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleDownloadPayslip = async (item: any) => {
    try {
      if (item.pdf) {
        // If PDF URL exists, download directly
        const a = document.createElement("a");
        a.href = item.pdf;
        a.download = `payslip-${item.employee_details.employee_id}-${item.pay_month}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        toast({
          title: "Success",
          description: "Payslip downloaded successfully",
        });
      } else {
        // If no PDF URL, use the mutation to generate/download
        const result = await downloadPayslip(item.id).unwrap();
        if (result.pdf) {
          const a = document.createElement("a");
          a.href = result.pdf;
          a.download = `payslip-${item.employee_details.employee_id}-${item.pay_month}.pdf`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          toast({
            title: "Success",
            description: "Payslip downloaded successfully",
          });
        }
      }
    } catch (error: any) {
      console.error("Error downloading payslip:", error);
      toast({
        title: "Error",
        description: error?.data?.message || "Failed to download payslip",
        variant: "destructive",
      });
      throw error;
    }
  };

  const getStatusBadge = (status: string) => (
    <Badge
      className={
        status === "paid"
          ? "bg-green-100 text-green-800 border-green-300"
          : "bg-yellow-100 text-yellow-800 border-yellow-300"
      }
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );

  const formatCurrency = (amount: string | number) => {
    const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(numAmount);
  };

  // Define columns for DataTable
  const columns = [
    {
      key: "employee_details",
      label: "Employee",
      sortable: true,
      render: (value: any, item: any) => (
        <div>
          <div className="font-medium text-gray-900">
            {item.employee_details.name}
          </div>
          <div className="text-sm text-gray-500">
            ID: {item.employee_details.employee_id} •{" "}
            {item.employee_details.job_title}
          </div>
        </div>
      ),
    },
    {
      key: "pay_month",
      label: "Month",
      sortable: true,
    },
    {
      key: "basic_salary",
      label: "Basic Salary",
      sortable: true,
      render: (value: any) => formatCurrency(value),
    },
    {
      key: "allowances",
      label: "Allowances",
      sortable: true,
      render: (value: any) => formatCurrency(value),
    },
    {
      key: "deductions",
      label: "Deductions",
      sortable: true,
      render: (value: any) => formatCurrency(value),
    },
    {
      key: "net_salary",
      label: "Net Salary",
      sortable: true,
      render: (value: any) => formatCurrency(value),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (value: any, item: any) => getStatusBadge(item.status),
    },
  ];

  // Define actions for DataTable
  const actions = [
    {
      type: "view" as const,
      label: "View",
      icon: <Eye className="h-4 w-4" />,
      href: (item: any) => `/hr/payroll/${item.id}`,
    },
    {
      type: "edit" as const,
      label: "Edit",
      icon: <Edit className="h-4 w-4" />,
      href: (item: any) => `/hr/payroll/${item.id}/edit`,
    },
    {
      type: "download" as const,
      label: "Download Payslip",
      icon: <Download className="h-4 w-4" />,
      onClick: async (item: any, e: React.MouseEvent) => {
        await handleDownloadPayslip(item);
      },
    },
    {
      type: "delete" as const,
      label: "Delete",
      icon: <Trash2 className="h-4 w-4" />,
      onClick: async (item: any, e: React.MouseEvent) => {
        await handleDelete(item.id);
      },
    },
  ];

  // Define filters for DataTable
  const filters = [
    {
      key: "status",
      label: "Status",
      type: "select" as const,
      options: [
        { value: "pending", label: "Pending" },
        { value: "paid", label: "Paid" },
      ],
    },
    {
      key: "employee",
      label: "Employee",
      type: "select" as const,
      options: [
        ...employees.map((emp: any) => ({
          value: emp.id,
          label: emp.name,
        })),
      ],
    },
  ];

  // Mobile card renderer
  const renderMobileCard = (item: any) => (
    <div
      key={item.id}
      className="bg-gray-50 p-4 rounded-lg border border-gray-200"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-start gap-2">
          <div>
            <p className="font-semibold text-gray-900">
              {item.employee_details.name}
            </p>
            <p className="text-sm text-gray-500">
              ID: {item.employee_details.employee_id} •{" "}
              {item.employee_details.job_title}
            </p>
          </div>
        </div>
        {getStatusBadge(item.status)}
      </div>
      <div className="text-sm text-gray-600 space-y-1 mb-3">
        <p>
          <span className="font-medium">Month:</span> {item.pay_month}
        </p>
        <p>
          <span className="font-medium">Basic:</span>{" "}
          {formatCurrency(item.basic_salary)}
        </p>
        <p>
          <span className="font-medium">Allowances:</span>{" "}
          {formatCurrency(item.allowances)}
        </p>
        <p>
          <span className="font-medium">Deductions:</span>{" "}
          {formatCurrency(item.deductions)}
        </p>
        <p>
          <span className="font-medium">Net Salary:</span>{" "}
          {formatCurrency(item.net_salary)}
        </p>
      </div>
      <div className="flex gap-2 flex-wrap">
        {actions.map((action, index) => (
          <Button
            key={index}
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (action.onClick) {
                action.onClick(item, e);
              } else if (action.href) {
                window.location.href = action.href(item);
              }
            }}
            className={
              action.type === "delete" ? "text-red-600 bg-transparent" : ""
            }
          >
            {action.icon}
            {action.label}
          </Button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* DataTable */}
      <DataTable
        data={preparedData}
        columns={columns}
        actions={actions}
        filters={filters}
        searchable={true}
        sortable={true}
        createButton={{
          label: "Generate Payroll",
          href: "/hr/payroll/new",
        }}
        title={`Payroll for ${format(date, "MMMM yyyy")}`}
        description={`View and manage all employee payroll records `}
        isLoading={isLoading}
        error={error}
        onDelete={handleDelete}
        emptyMessage="No payroll records found for the selected month."
        renderMobileCard={renderMobileCard}
      />
    </div>
  );
}
