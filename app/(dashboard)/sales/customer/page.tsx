// app/sales/customers/page.tsx
"use client";

import { useMemo } from "react";
import { DataTable } from "@/components/ui/data-table";
import { useToast } from "@/hooks/use-toast";
import {
  useGetCustomersQuery,
  useDeleteCustomerMutation,
} from "@/redux/Service/customer";
import { Eye, Edit, Trash2, Building, User, Phone, MapPin } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

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

export default function CustomersPage() {
  const { toast } = useToast();
  const { data: customers = [], isLoading, error } = useGetCustomersQuery({});
  const [deleteCustomer] = useDeleteCustomerMutation();

  // Get primary contact or first contact
  const getPrimaryContact = (customer: Customer) => {
    if (!customer.contacts || customer.contacts.length === 0) return null;
    const primaryContact = customer.contacts.find((contact) => contact.is_primary);
    return primaryContact || customer.contacts[0];
  };

  // Get billing address
  const getBillingAddress = (customer: Customer) => {
    return customer.addresses.find(addr => addr.address_type === "Billing");
  };

  const formatCurrency = (amount: string | number) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(numAmount);
  };

  const columns = [
    {
      key: "customer_type",
      label: "Type",
      render: (value: string, customer: Customer) => (
        <div className="flex items-center">
          {value === "Company" ? (
            <Building className="h-4 w-4 mr-2 text-muted-foreground" />
          ) : (
            <User className="h-4 w-4 mr-2 text-muted-foreground" />
          )}
          <Badge variant="outline">
            {value}
          </Badge>
        </div>
      ),
    },
    {
      key: "company_name",
      label: "Name",
      sortable: true,
      render: (value: string, customer: Customer) => {
        const contact = getPrimaryContact(customer);
        return (
          <div>
            <div>{customer.customer_type === "Company" ? value : `${contact?.first_name} ${contact?.last_name}`}</div>
            {customer.customer_type === "Company" && contact && (
              <div className="text-sm text-muted-foreground">
                {contact.first_name} {contact.last_name}
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: "contact",
      label: "Contact",
      render: (_: any, customer: Customer) => {
        const contact = getPrimaryContact(customer);
        return contact ? (
          <div>
            <div className="flex items-center gap-1">
              <Phone className="h-3 w-3 text-muted-foreground" />
              <span>{contact.phone}</span>
            </div>
            <div className="text-sm text-muted-foreground">{contact.email}</div>
          </div>
        ) : (
          "N/A"
        );
      },
    },
    {
      key: "gst_number",
      label: "GST Number",
      render: (value: string) => value || "N/A",
    },
    {
      key: "location",
      label: "Location",
      render: (_: any, customer: Customer) => {
        const address = getBillingAddress(customer);
        return address ? (
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3 text-muted-foreground" />
            <span>{`${address.city}, ${address.state}`}</span>
          </div>
        ) : (
          "N/A"
        );
      },
    },
    {
      key: "credit_limit",
      label: "Credit Limit",
      sortable: true,
      render: (value: string) => formatCurrency(value),
      className: "text-right",
    },
  ];

  const filters = [
    {
      key: "customer_type",
      label: "Customer Type",
      type: "select" as const,
      options: [
        { value: "Company", label: "Company" },
        { value: "Individual", label: "Individual" },
      ],
    },
  ];

  const actions = [
    {
      type: "view" as const,
      label: "View Details",
      icon: <Eye className="h-4 w-4 mr-2" />,
      href: (customer: Customer) => `/sales/customer/${customer.id}`,
    },
    {
      type: "edit" as const,
      label: "Edit",
      icon: <Edit className="h-4 w-4 mr-2" />,
      href: (customer: Customer) => `/sales/customer/${customer.id}/edit`,
    },
    {
      type: "delete" as const,
      label: "Delete",
      icon: <Trash2 className="h-4 w-4 mr-2" />,
    },
  ];

  const handleDelete = async (id: string) => {
    await deleteCustomer(id).unwrap();
  };

  const renderMobileCard = (customer: Customer) => {
    const contact = getPrimaryContact(customer);
    const address = getBillingAddress(customer);
    
    return (
      <Link key={customer.id} href={`/sales/customer/${customer.id}`}>
        <div className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer bg-card">
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="font-semibold text-sm line-clamp-1">
                {customer.customer_type === "Company" 
                  ? customer.company_name 
                  : `${contact?.first_name} ${contact?.last_name}`
                }
              </p>
              <p className="text-xs text-muted-foreground font-mono">
                {customer.id.slice(0, 8)}...
              </p>
            </div>
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${
              customer.customer_type === "Company" 
                ? "bg-blue-100 text-blue-800" 
                : "bg-green-100 text-green-800"
            }`}>
              {customer.customer_type}
            </span>
          </div>
          <div className="space-y-2 text-sm">
            {contact && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Contact:</span>
                <span className="font-medium">{contact.first_name} {contact.last_name}</span>
              </div>
            )}
            {contact && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Phone:</span>
                <span className="font-medium">{contact.phone}</span>
              </div>
            )}
            {address && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Location:</span>
                <span className="font-medium">{address.city}, {address.state}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Credit Limit:</span>
              <span className="font-medium">{formatCurrency(customer.credit_limit)}</span>
            </div>
          </div>
        </div>
      </Link>
    );
  };

  return (
    <DataTable
      data={customers}
      columns={columns}
      actions={actions}
      filters={filters}
      title="Customers"
      description="Manage your customer database and relationships"
      createButton={{
        label: "Add Customer",
        href: "/sales/customer/new",
      }}
      isLoading={isLoading}
      error={error}
      onDelete={handleDelete}
      renderMobileCard={renderMobileCard}
    />
  );
}