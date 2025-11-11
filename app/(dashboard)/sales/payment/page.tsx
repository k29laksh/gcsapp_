"use client"

import { DataTable } from "@/components/ui/data-table"
import { Eye, Edit, Trash2 } from "lucide-react"
import { useGetPaymentsQuery, useDeletePaymentMutation } from "@/redux/Service/payment"
import { useToast } from "@/hooks/use-toast"

export default function PaymentsListPage() {
  const { data: payments, isLoading } = useGetPaymentsQuery({})
  const [deletePayment] = useDeletePaymentMutation()
  const { toast } = useToast()

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-IN", { 
      day: "2-digit", 
      month: "short", 
      year: "numeric" 
    })
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      completed: "bg-green-100 text-green-800",
      pending: "bg-yellow-100 text-yellow-800",
      failed: "bg-red-100 text-red-800",
      refunded: "bg-gray-100 text-gray-800",
    }
    return colors[status.toLowerCase()] || "bg-gray-100 text-gray-800"
  }

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this payment record?")) {
      try {
        await deletePayment(id).unwrap()
        toast({
          title: "Success",
          description: "Payment deleted successfully",
        })
      } catch {
        toast({
          title: "Error",
          description: "Failed to delete payment",
          variant: "destructive",
        })
      }
    }
  }

  const columns = [
    {
      key: "receipt_no",
      label: "Receipt No.",
      sortable: true,
      mobilePriority: true,
    },
    {
      key: "customer",
      label: "Customer",
      sortable: true,
      render: (value: { company_name: string; contacts: { first_name: string; last_name: string }[] }) => 
        value?.company_name || `${value?.contacts[0]?.first_name} ${value?.contacts[0]?.last_name}`,
    },
    {
      key: "invoice",
      label: "Invoice",
      sortable: true,
      render: (value: { invoice_no: string }) => value?.invoice_no || "N/A",
    },
    {
      key: "amount",
      label: "Amount",
      sortable: true,
      render: (value: string) => 
        `₹${Number.parseFloat(value).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
      className: "text-right",
    },
    {
      key: "method",
      label: "Method",
      sortable: true,
    },
    {
      key: "payment_date",
      label: "Date",
      sortable: true,
      render: (value: string) => formatDate(value),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (value: string) => (
        <span className={`text-xs font-medium px-3 py-1 rounded-full ${getStatusColor(value)}`}>
          {value.charAt(0).toUpperCase() + value.slice(1)}
        </span>
      ),
    },
  ]

  const actions = [
    {
      type: "view" as const,
      label: "View Details",
      icon: <Eye className="h-4 w-4 mr-2" />,
      href: (item: { id: string }) => `/sales/payment/${item.id}`,
    },
    {
      type: "edit" as const,
      label: "Edit",
      icon: <Edit className="h-4 w-4 mr-2" />,
      href: (item: { id: string }) => `/sales/payment/${item.id}/edit`,
    },
    {
      type: "delete" as const,
      label: "Delete",
      icon: <Trash2 className="h-4 w-4 mr-2" />,
      onClick: (item: { id: string }, e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        handleDelete(item.id)
      },
    },
  ]

  const filters = [
    {
      key: "status",
      label: "Status",
      type: "select" as const,
      options: [
        { value: "completed", label: "Completed" },
        { value: "pending", label: "Pending" },
        { value: "failed", label: "Failed" },
        { value: "refunded", label: "Refunded" },
      ],
    },
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading payments...</p>
      </div>
    )
  }

  return (
    <DataTable
      data={payments || []}
      columns={columns}
      actions={actions}
      filters={filters}
      searchable={true}
      sortable={true}
      createButton={{
        label: "Record Payment",
        href: "/sales/payment/new",
      }}
      title="Payments"
      description="Manage and track payment records"
      emptyMessage="No payments found"
      renderMobileCard={(item: {
        id: string;
        receipt_no: string;
        customer: { company_name: string; contacts: { first_name: string; last_name: string }[] };
        amount: string;
        payment_date: string;
        status: string;
      }) => (
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="font-semibold text-sm">
                {item.customer?.company_name || `${item.customer?.contacts[0]?.first_name} ${item.customer?.contacts[0]?.last_name}`}
              </p>
              <p className="text-xs text-gray-600">{item.receipt_no}</p>
            </div>
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusColor(item.status)}`}>
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </span>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Receipt:</span>
              <span className="font-medium">{item.receipt_no}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Amount:</span>
              <span className="font-medium">
                ₹{Number.parseFloat(item.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Date:</span>
              <span className="font-medium">{formatDate(item.payment_date)}</span>
            </div>
          </div>
        </div>
      )}
    />
  )
}