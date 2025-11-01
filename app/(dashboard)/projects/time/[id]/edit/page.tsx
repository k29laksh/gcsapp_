// import { notFound } from "next/navigation"
// import { TimeEntryForm } from "@/components/time-entry-form"
// import prisma from "@/lib/prisma"

// interface EditTimeEntryPageProps {
//   params: {
//     id: string
//   }
// }

// export default async function EditTimeEntryPage({ params }: EditTimeEntryPageProps) {
//   const timeEntry = await prisma.timeEntry.findUnique({
//     where: {
//       id: params.id,
//     },
//   })

//   if (!timeEntry) {
//     notFound()
//   }

//   return (
//     <div className="space-y-4">
//       <h2 className="text-2xl font-bold">Edit Time Entry</h2>
//       <TimeEntryForm timeEntry={timeEntry} isEditing />
//     </div>
//   )
// }


import React from 'react'

function page() {
  return (
    <div>
      
    </div>
  )
}

export default page
