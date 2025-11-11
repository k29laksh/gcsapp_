// app/sales/customer/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTableEnhanced } from "@/components/ui/data-table-enhanced";
import { PageHeader } from "@/components/ui/page-header";
import {
  Eye,
  Pencil,
  Plus,
  Trash2,
  Building,
  User,
  Users,
  TrendingUp,
  MapPin,
  Phone,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import {
  useGetCustomersQuery,
  useGetCustomerStatsQuery,
  useDeleteCustomerMutation,
} from "@/redux/Service/customer";

interface CustomerContact {
  id: string;
  title: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  alternate_phone: string | null;
  designation: string;
  notes: string | null;
  is_primary: boolean;
}

interface CustomerAddress {
  id: string;
  address_type: string;
  address_line1: string;
  address_line2: string | null;
  country: string;
  state: string;
  city: string;
  postal_code: string;
}

interface Customer {
  id: string;
  customer_type: string;
  company_name: string | null;
  gst_number: string | null;
  pan_number: string | null;
  gst_state: string;
  gst_type: string;
  credit_terms_days: number;
  credit_limit: string;
  contacts: CustomerContact[];
  addresses: CustomerAddress[];
  created_at: string;
}

interface CustomerStats {
  totalCustomers: number;
  companyCustomers: number;
  individualCustomers: number;
  activeCustomers: number;
  newThisMonth: number;
  totalProjects: number;
  totalRevenue: number;
  avgProjectValue: number;
}

export default function CustomersPage() {
  const router = useRouter();
  const { toast } = useToast();

  // RTK Query hooks
  const { 
    data: customers = [], 
    isLoading, 
    error,
    refetch 
  } = useGetCustomersQuery();
  
  const { data: stats } = useGetCustomerStatsQuery();
  const [deleteCustomer] = useDeleteCustomerMutation();

  // Handle errors
  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: "Failed to load customers",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  const handleDelete = async (id: string) => {
    try {
      await deleteCustomer(id).unwrap();
      toast({
        title: "Success",
        description: "Customer deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting customer:", error);
      toast({
        title: "Error",
        description: "Failed to delete customer",
        variant: "destructive",
      });
    }
  };

  // Get primary contact or first contact
  const getPrimaryContact = (customer: Customer) => {
    if (!customer.contacts || customer.contacts.length === 0) return null;

    const primaryContact = customer.contacts.find(
      (contact) => contact.is_primary
    );
    return primaryContact || customer.contacts[0];
  };

  // Get billing address
  const getBillingAddress = (customer: Customer) => {
    return customer.addresses.find(addr => addr.address_type === "Billing");
  };

  const columns: ColumnDef<Customer>[] = [
    {
      accessorKey: "customer_type",
      header: "Type",
      cell: ({ row }) => {
        const type = row.original.customer_type;
        return (
          <div className="flex items-center">
            {type === "Company" ? (
              <Building className="h-4 w-4 mr-2 text-muted-foreground" />
            ) : (
              <User className="h-4 w-4 mr-2 text-muted-foreground" />
            )}
            <Badge variant="outline">
              {type}
            </Badge>
          </div>
        );
      },
    },
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => {
        const customer = row.original;
        const contact = getPrimaryContact(customer);

        if (customer.customer_type === "Company") {
          return (
            <div>
              <div className="font-medium">{customer.company_name || "N/A"}</div>
              {contact && (
                <div className="text-sm text-muted-foreground">
                  {contact.first_name} {contact.last_name}
                </div>
              )}
            </div>
          );
        } else {
          return contact ? `${contact.first_name} ${contact.last_name}` : "N/A";
        }
      },
    },
    {
      accessorKey: "contact",
      header: "Contact",
      cell: ({ row }) => {
        const customer = row.original;
        const contact = getPrimaryContact(customer);

        if (!contact) return "N/A";

        return (
          <div>
            <div className="flex items-center gap-1">
              <Phone className="h-3 w-3 text-muted-foreground" />
              <span className="text-sm">{contact.phone}</span>
            </div>
            <div className="text-sm text-muted-foreground">{contact.email}</div>
          </div>
        );
      },
    },
    {
      accessorKey: "gst_number",
      header: "GST Number",
      cell: ({ row }) => row.original.gst_number || "N/A",
    },
    {
      accessorKey: "location",
      header: "Location",
      cell: ({ row }) => {
        const address = getBillingAddress(row.original);
        if (!address) return "N/A";
        return (
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3 text-muted-foreground" />
            <span>{`${address.city}, ${address.state}`}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "credit_limit",
      header: "Credit Limit",
      cell: ({ row }) => {
        const creditLimit = parseFloat(row.original.credit_limit);
        return new Intl.NumberFormat('en-IN', {
          style: 'currency',
          currency: 'INR'
        }).format(creditLimit);
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const customer = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => router.push(`/sales/customer/${customer.id}`)}
              >
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  router.push(`/sales/customer/${customer.id}/edit`)
                }
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem
                    onSelect={(e) => e.preventDefault()}
                    className="text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete the customer and all
                      associated data.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleDelete(customer.id)}
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const breadcrumbs = [
    { label: "Sales", href: "/sales" },
    { label: "Customers" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers"
        description="Manage your customer database and relationships"
        breadcrumbs={breadcrumbs}
        action={
          <Button onClick={() => router.push("/sales/customer/new")}>
            <Plus className="mr-2 h-4 w-4" />
            Add Customer
          </Button>
        }
      />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Customers
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalCustomers || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.companyCustomers || 0} companies, {stats?.individualCustomers || 0}{" "}
              individuals
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Customers
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeCustomers || 0}</div>
            <p className="text-xs text-muted-foreground">
              With ongoing projects
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              New This Month
            </CardTitle>
            <Plus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.newThisMonth || 0}</div>
            <p className="text-xs text-muted-foreground">
              Recently added customers
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Projects
            </CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalProjects || 0}</div>
            <p className="text-xs text-muted-foreground">
              Across all customers
            </p>
          </CardContent>
        </Card>
      </div>

      <DataTableEnhanced
        columns={columns}
        data={customers}
        searchKey="company_name"
        searchPlaceholder="Search customers..."
        onAdd={() => router.push("/sales/customer/new")}
        addLabel="Add Customer"
        loading={isLoading}
      />
    </div>
  );
}