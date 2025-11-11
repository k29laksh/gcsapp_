// components/address-component.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useEditAddressMutation } from "@/redux/Service/customer";
import { useRouter } from "next/navigation";

interface AddressComponentProps {
  customerId: string;
  addresses: Array<{
    id?: string;
    address_type: string;
    address_line1: string;
    address_line2: string;
    country: string;
    state: string;
    city: string;
    postal_code: string;
  }>;
}

interface Address {
  id?: string;
  address_type: string;
  address_line1: string;
  address_line2: string;
  country: string;
  state: string;
  city: string;
  postal_code: string;
}

export function AddressComponent({
  customerId,
  addresses,
}: AddressComponentProps) {
  const { toast } = useToast();
  const [editAddress, { isLoading }] = useEditAddressMutation();
  const router = useRouter();

  const [countries] = useState<Array<{ code: string; name: string }>>([
    { code: "IN", name: "India" },
    { code: "US", name: "United States" },
    { code: "UK", name: "United Kingdom" },
  ]);

  const [formData, setFormData] = useState({
    billingAddress: {
      address_line1: "",
      address_line2: "",
      country: "India",
      state: "",
      city: "",
      postal_code: "",
    },
    shippingAddress: {
      address_line1: "",
      address_line2: "",
      country: "India",
      state: "",
      city: "",
      postal_code: "",
    },
    same_as_billing: true,
  });

  // Initialize form data from addresses
  useEffect(() => {
    if (addresses && addresses.length > 0) {
      const billingAddress = addresses.find(
        (addr) => addr.address_type === "Billing"
      );
      const shippingAddress = addresses.find(
        (addr) => addr.address_type === "Shipping"
      );

      setFormData({
        billingAddress: {
          address_line1: billingAddress?.address_line1 || "",
          address_line2: billingAddress?.address_line2 || "",
          country: billingAddress?.country || "India",
          state: billingAddress?.state || "",
          city: billingAddress?.city || "",
          postal_code: billingAddress?.postal_code || "",
        },
        shippingAddress: {
          address_line1: shippingAddress?.address_line1 || "",
          address_line2: shippingAddress?.address_line2 || "",
          country: shippingAddress?.country || "India",
          state: shippingAddress?.state || "",
          city: shippingAddress?.city || "",
          postal_code: shippingAddress?.postal_code || "",
        },
        same_as_billing:
          billingAddress?.address_line1 === shippingAddress?.address_line1,
      });
    }
  }, [addresses]);

  const handleBillingChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      billingAddress: {
        ...prev.billingAddress,
        [field]: value,
      },
      shippingAddress: prev.same_as_billing
        ? {
            ...prev.shippingAddress,
            [field]: value,
          }
        : prev.shippingAddress,
    }));
  };

  const handleShippingChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      shippingAddress: {
        ...prev.shippingAddress,
        [field]: value,
      },
    }));
  };

  const handleSameAsBillingChange = (checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      same_as_billing: checked,
      shippingAddress: checked
        ? { ...prev.billingAddress }
        : prev.shippingAddress,
    }));
  };

  const updateAddresses = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("🔹 Form submitted"); // add this

    try {
      const billingAddressData = addresses.find(
        (addr) => addr.address_type === "Billing"
      );
      const shippingAddressData = addresses.find(
        (addr) => addr.address_type === "Shipping"
      );

      console.log("Addresses received:", addresses);
      console.log("Billing:", billingAddressData);
      console.log("Shipping:", shippingAddressData);

      if (!billingAddressData || !shippingAddressData) {
        toast({
          title: "Error",
          description: "Address data not found",
          variant: "destructive",
        });
        return;
      }

      // Update billing address
      const billingPayload = {
        customer: customerId,
        address_type: "Billing",
        address_line1: formData.billingAddress.address_line1,
        address_line2: formData.billingAddress.address_line2 || null,
        country: formData.billingAddress.country,
        state: formData.billingAddress.state,
        city: formData.billingAddress.city,
        postal_code: formData.billingAddress.postal_code,
      };

      await editAddress({
        id: billingAddressData.id!,
        ...billingPayload,
      }).unwrap();

      // Update shipping address
      const shippingPayload = {
        customer: customerId,
        address_type: "Shipping",
        address_line1: formData.shippingAddress.address_line1,
        address_line2: formData.shippingAddress.address_line2 || null,
        country: formData.shippingAddress.country,
        state: formData.shippingAddress.state,
        city: formData.shippingAddress.city,
        postal_code: formData.shippingAddress.postal_code,
      };

      await editAddress({
        id: shippingAddressData.id!,
        ...shippingPayload,
      }).unwrap();

      toast({
        title: "Success",
        description: "Addresses updated successfully",
      });
      router.refresh();
        router.push(`/sales/customer/${customerId}`);
    } catch (error: any) {
      console.error("Error updating addresses:", error);

      let errorMessage = "Failed to update addresses";
      if (error?.data) {
        if (typeof error.data === "string") {
          errorMessage = error.data;
        } else if (error.data.message) {
          errorMessage = error.data.message;
        } else if (error.data.detail) {
          errorMessage = error.data.detail;
        }
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Address Information</CardTitle>
      </CardHeader>
      <form onSubmit={updateAddresses}>
        <CardContent className="space-y-8">
          {/* Billing Address Section */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Billing Address</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="billingAddressLine1">Address Line 1</Label>
                <Input
                  id="billingAddressLine1"
                  value={formData.billingAddress.address_line1}
                  onChange={(e) =>
                    handleBillingChange("address_line1", e.target.value)
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="billingAddressLine2">Address Line 2</Label>
                <Input
                  id="billingAddressLine2"
                  value={formData.billingAddress.address_line2}
                  onChange={(e) =>
                    handleBillingChange("address_line2", e.target.value)
                  }
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="billingCountry">Country</Label>
                  <Select
                    value={formData.billingAddress.country}
                    onValueChange={(value) =>
                      handleBillingChange("country", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem key={country.code} value={country.name}>
                          {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="billingState">State</Label>
                  <Input
                    id="billingState"
                    value={formData.billingAddress.state}
                    onChange={(e) =>
                      handleBillingChange("state", e.target.value)
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="billingCity">City</Label>
                  <Input
                    id="billingCity"
                    value={formData.billingAddress.city}
                    onChange={(e) =>
                      handleBillingChange("city", e.target.value)
                    }
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="billingPostalCode">Postal Code</Label>
                <Input
                  id="billingPostalCode"
                  value={formData.billingAddress.postal_code}
                  onChange={(e) =>
                    handleBillingChange("postal_code", e.target.value)
                  }
                  required
                />
              </div>
            </div>
          </div>

          {/* Shipping Address Section */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Checkbox
                id="same_as_billing"
                checked={formData.same_as_billing}
                onCheckedChange={handleSameAsBillingChange}
              />
              <label
                htmlFor="same_as_billing"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Same as Billing Address
              </label>
            </div>

            <h3 className="text-lg font-semibold mb-4">Shipping Address</h3>

            <div className="space-y-4">
              <div>
                <Label htmlFor="shippingAddressLine1">Address Line 1</Label>
                <Input
                  id="shippingAddressLine1"
                  value={formData.shippingAddress.address_line1}
                  onChange={(e) =>
                    handleShippingChange("address_line1", e.target.value)
                  }
                  disabled={formData.same_as_billing}
                  required
                />
              </div>
              <div>
                <Label htmlFor="shippingAddressLine2">Address Line 2</Label>
                <Input
                  id="shippingAddressLine2"
                  value={formData.shippingAddress.address_line2}
                  onChange={(e) =>
                    handleShippingChange("address_line2", e.target.value)
                  }
                  disabled={formData.same_as_billing}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="shippingCountry">Country</Label>
                  <Select
                    value={formData.shippingAddress.country}
                    onValueChange={(value) =>
                      handleShippingChange("country", value)
                    }
                    disabled={formData.same_as_billing}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem key={country.code} value={country.name}>
                          {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="shippingState">State</Label>
                  <Input
                    id="shippingState"
                    value={formData.shippingAddress.state}
                    onChange={(e) =>
                      handleShippingChange("state", e.target.value)
                    }
                    disabled={formData.same_as_billing}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="shippingCity">City</Label>
                  <Input
                    id="shippingCity"
                    value={formData.shippingAddress.city}
                    onChange={(e) =>
                      handleShippingChange("city", e.target.value)
                    }
                    disabled={formData.same_as_billing}
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="shippingPostalCode">Postal Code</Label>
                <Input
                  id="shippingPostalCode"
                  value={formData.shippingAddress.postal_code}
                  onChange={(e) =>
                    handleShippingChange("postal_code", e.target.value)
                  }
                  disabled={formData.same_as_billing}
                  required
                />
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating Addresses...
              </>
            ) : (
              "Update Addresses"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
