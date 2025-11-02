// app/vessels/new/page.tsx
"use client"

import { VesselForm } from "@/components/vessel-form"
import { PageHeader } from "@/components/ui/page-header"

export default function AddVesselPage() {
  const breadcrumbs = [
    { label: "Vessels", href: "/vessels" },
    { label: "Add Vessel" },
  ]

  return (
    <div className="container mx-auto py-6">
      <PageHeader 
        title="Add New Vessel" 
        description="Add a new vessel to the system"
        breadcrumbs={breadcrumbs}
      />
      <VesselForm />
    </div>
  )
}
