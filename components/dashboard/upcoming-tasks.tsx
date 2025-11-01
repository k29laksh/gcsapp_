// components/dashboard/upcoming-tasks.tsx
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  Clock, 
  AlertTriangle, 
  CheckCircle2,
  PlayCircle,
  Flag,
  Target
} from "lucide-react";

interface UpcomingTasksProps {
  tasks?: any[];
}

export function UpcomingTasks({ tasks = [] }: UpcomingTasksProps) {
  console.log("UpcomingTasks received tasks:", tasks);
  
  const upcomingTasks = tasks
    .filter(task => {
      if (task.due_date) {
        const dueDate = new Date(task.due_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return dueDate >= today;
      }
      return true;
    })
    .sort((a, b) => {
      // Sort by priority first (high > medium > low), then by due date
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const priorityA = priorityOrder[a.priority] || 0;
      const priorityB = priorityOrder[b.priority] || 0;
      
      if (priorityB !== priorityA) {
        return priorityB - priorityA;
      }
      
      if (a.due_date && b.due_date) {
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      }
      
      return 0;
    })
    .slice(0, 6);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 border-green-200';
      case 'in_progress':
        return 'bg-blue-50 border-blue-200';
      case 'pending':
        return 'bg-yellow-50 border-yellow-200';
      case 'overdue':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return CheckCircle2;
      case 'in_progress':
        return PlayCircle;
      case 'overdue':
        return AlertTriangle;
      default:
        return Target;
    }
  };

  const getStatusIconColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600';
      case 'in_progress':
        return 'text-blue-600';
      case 'overdue':
        return 'text-red-600';
      default:
        return 'text-yellow-600';
    }
  };

  const getDueDateColor = (dueDate: string, status: string) => {
    if (status === 'completed') return 'text-green-600';
    if (status === 'overdue') return 'text-red-600';
    
    const due = new Date(dueDate);
    const today = new Date();
    const timeDiff = due.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    if (daysDiff < 0) return 'text-red-600';
    if (daysDiff <= 1) return 'text-orange-600';
    if (daysDiff <= 3) return 'text-yellow-600';
    return 'text-gray-600';
  };

  const getDueDateText = (dueDate: string, status: string) => {
    if (status === 'completed') return 'Completed';
    if (status === 'overdue') return 'Overdue';
    
    const due = new Date(dueDate);
    const today = new Date();
    const timeDiff = due.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    if (daysDiff < 0) return 'Overdue';
    if (daysDiff === 0) return 'Due today';
    if (daysDiff === 1) return 'Due tomorrow';
    if (daysDiff <= 7) return `Due in ${daysDiff} days`;
    return `Due ${due.toLocaleDateString()}`;
  };

  const isUrgent = (dueDate: string, priority: string, status: string) => {
    if (status === 'completed') return false;
    
    const due = new Date(dueDate);
    const today = new Date();
    const timeDiff = due.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    return (priority === 'high' && daysDiff <= 3) || daysDiff <= 1;
  };

  return (
    <ScrollArea className="h-[400px] pr-4">
      <div className="space-y-3">
        {upcomingTasks.length > 0 ? (
          upcomingTasks.map((task) => {
            const StatusIcon = getStatusIcon(task.status);
            const isTaskUrgent = isUrgent(task.due_date, task.priority, task.status);
            
            return (
              <div 
                key={task.id} 
                className={`
                  relative p-4 rounded-lg border-2 transition-all duration-200 
                  hover:shadow-md hover:scale-[1.02] cursor-pointer
                  ${getStatusColor(task.status)}
                  ${isTaskUrgent ? 'ring-2 ring-orange-200' : ''}
                `}
              >
                {/* Task Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3 flex-1">
                    <div className={`p-2 rounded-full bg-white ${getStatusIconColor(task.status)}`}>
                      <StatusIcon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm text-gray-900 truncate">
                        {task.title}
                      </h4>
                      {task.description && (
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                          {task.description}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <Badge 
                    variant="secondary" 
                    className={`text-xs font-medium px-2 py-1 border whitespace-nowrap ${getPriorityColor(task.priority)}`}
                  >
                    <Flag className="h-3 w-3 mr-1" />
                    {task.priority}
                  </Badge>
                </div>

                {/* Task Details */}
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center space-x-4 text-xs">
                    {task.due_date && (
                      <div className={`flex items-center space-x-1 font-medium ${getDueDateColor(task.due_date, task.status)}`}>
                        <Calendar className="h-3 w-3" />
                        <span>{getDueDateText(task.due_date, task.status)}</span>
                      </div>
                    )}
                    
                    {task.estimated_hours && (
                      <div className="flex items-center space-x-1 text-gray-500">
                        <Clock className="h-3 w-3" />
                        <span>{task.estimated_hours}h</span>
                      </div>
                    )}
                  </div>

                  {task.due_date && (
                    <div className={`text-xs font-medium ${getDueDateColor(task.due_date, task.status)}`}>
                      {new Date(task.due_date).toLocaleDateString()}
                    </div>
                  )}
                </div>

                {/* Urgent Indicator */}
                {isTaskUrgent && (
                  <div className="absolute top-2 right-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
                    <div className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full" />
                  </div>
                )}

                {/* Progress bar for in-progress tasks */}
                {task.status === 'in_progress' && task.progress !== undefined && (
                  <div className="mt-3">
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div 
                        className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${task.progress}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Progress</span>
                      <span>{task.progress}%</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="text-center py-12">
            <div className="bg-gray-50 rounded-lg p-8 border-2 border-dashed border-gray-200">
              <Target className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-sm">No upcoming tasks</p>
              <p className="text-gray-400 text-xs mt-1">
                All caught up! New tasks will appear here
              </p>
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}