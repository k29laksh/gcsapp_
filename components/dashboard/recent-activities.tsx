// components/dashboard/recent-activities.tsx
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { 
  User, 
  FileText, 
  Briefcase, 
  Calendar,
  DollarSign,
  Building
} from "lucide-react";

interface RecentActivitiesProps {
  customers?: any[];
  invoices?: any[];
  projects?: any[];
}

export function RecentActivities({ customers = [], invoices = [], projects = [] }: RecentActivitiesProps) {
  // Combine and sort recent activities
  const recentActivities = [
    ...customers.map(customer => ({
      id: customer.id,
      type: 'customer',
      title: `New ${customer.customer_type === 'Company' ? 'Company' : 'Individual'}`,
      description: customer.company_name || `${customer.first_name} ${customer.last_name}`,
      date: customer.created_at,
      status: 'success',
      icon: customer.customer_type === 'Company' ? Building : User,
      amount: null
    })),
    ...invoices.map(invoice => ({
      id: invoice.id,
      type: 'invoice',
      title: `Invoice ${invoice.status === 'paid' ? 'Paid' : 'Generated'}`,
      description: `#${invoice.invoice_number}`,
      date: invoice.created_at,
      status: invoice.status,
      icon: FileText,
      amount: parseFloat(invoice.amount || 0)
    })),
    ...projects.map(project => ({
      id: project.id,
      type: 'project',
      title: `Project ${project.status === 'completed' ? 'Completed' : 'Started'}`,
      description: project.name,
      date: project.created_at,
      status: project.status,
      icon: Briefcase,
      amount: null
    }))
  ]
  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  .slice(0, 10);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
      case 'completed':
      case 'paid':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'customer':
        return 'bg-blue-50 border-blue-200';
      case 'invoice':
        return 'bg-green-50 border-green-200';
      case 'project':
        return 'bg-purple-50 border-purple-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case 'customer':
        return 'text-blue-600';
      case 'invoice':
        return 'text-green-600';
      case 'project':
        return 'text-purple-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  return (
    <ScrollArea className="h-[400px] pr-4">
      <div className="space-y-3">
        {recentActivities.length > 0 ? (
          recentActivities.map((activity) => {
            const IconComponent = activity.icon;
            
            return (
              <div 
                key={activity.id} 
                className={`
                  relative p-4 rounded-lg border-2 transition-all duration-200 
                  hover:shadow-md hover:scale-[1.02] cursor-pointer
                  ${getTypeColor(activity.type)}
                `}
              >
                {/* Notification Header */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full bg-white ${getIconColor(activity.type)}`}>
                      <IconComponent className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-gray-900">
                        {activity.title}
                      </h4>
                      <p className="text-xs text-gray-600 mt-1">
                        {activity.description}
                      </p>
                    </div>
                  </div>
                  
                  <Badge 
                    variant="secondary" 
                    className={`text-xs font-medium px-2 py-1 border ${getStatusColor(activity.status)}`}
                  >
                    {activity.status.replace('_', ' ')}
                  </Badge>
                </div>

                {/* Notification Content */}
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(activity.date)}</span>
                    </div>
                    
                    {activity.amount && (
                      <div className="flex items-center space-x-1">
                        <DollarSign className="h-3 w-3" />
                        <span className="font-medium text-gray-700">
                          ${activity.amount.toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="text-xs text-gray-400">
                    {new Date(activity.date).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                </div>

                {/* Notification Indicator */}
                <div className={`absolute top-3 right-3 w-2 h-2 rounded-full ${
                  activity.status === 'pending' || activity.status === 'in_progress' 
                    ? 'bg-yellow-400 animate-pulse' 
                    : 'bg-green-400'
                }`} />
              </div>
            );
          })
        ) : (
          <div className="text-center py-12">
            <div className="bg-gray-50 rounded-lg p-8 border-2 border-dashed border-gray-200">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-sm">No recent activities</p>
              <p className="text-gray-400 text-xs mt-1">
                Activities will appear here as they happen
              </p>
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}