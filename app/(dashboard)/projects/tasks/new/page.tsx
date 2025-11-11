import { TaskForm } from "@/components/task-form"

export default function NewTaskPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Create New Task</h2>
      <TaskForm />
    </div>
  )
}

