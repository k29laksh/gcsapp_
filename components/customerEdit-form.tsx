// Example usage in a parent component
"use client";

import { ProfileComponent } from "@/components/customer-profile";
import { ContactComponent } from "@/components/customer-contacts";
import { AddressComponent } from "@/components/customer-address";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function CustomerDetails({ customer }) {
  return (
    <Tabs defaultValue="profile" className="space-y-4">
      <TabsList>
        <TabsTrigger value="profile">Profile</TabsTrigger>
        <TabsTrigger value="contacts">Contacts</TabsTrigger>
        <TabsTrigger value="address">Address</TabsTrigger>
      </TabsList>
      <TabsContent value="profile">
        <ProfileComponent
          customerId={customer.id}
          customerData={{
            customer_type: customer.customer_type,
            company_name: customer.company_name,
            gst_number: customer.gst_number,
            pan_number: customer.pan_number,
            gst_state: customer.gst_state,
            gst_type: customer.gst_type,
            credit_terms_days: customer.credit_terms_days,
            credit_limit: customer.credit_limit,
          }}
        />
      </TabsContent>
      <TabsContent value="contacts">
        <ContactComponent customerId={customer.id} contacts={customer.contacts} />
      </TabsContent>

      <TabsContent value="address">
        <AddressComponent
          customerId={customer.id}
          addresses={customer.addresses}
        />
      </TabsContent>    
    </Tabs>
  );
}
