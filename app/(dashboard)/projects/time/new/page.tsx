import { TimeEntryForm } from "@/components/time-entry-form"

export default function NewTimeEntryPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Log Time</h2>
      <TimeEntryForm />
    </div>
  )
}

