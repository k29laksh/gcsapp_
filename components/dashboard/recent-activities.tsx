"use client";

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, RefreshCw, Activity } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ActivityLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  details: string;
  createdAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    profilePicture: string | null;
  };
}

export function RecentActivities() {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("Fetching activities...");

      const response = await fetch("/api/activity-logs?limit=10", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log("Response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch activity logs");
      }

      const data = await response.json();
      console.log("Fetched activities:", data);
      setActivities(data);
    } catch (error: any) {
      console.error("Error fetching activity logs:", error);
      setError(error.message || "Failed to fetch activities");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  const getActionColor = (action: string) => {
    switch (action) {
      case "CREATE":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "UPDATE":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "DELETE":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "SEND":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  const getEntityTypeIcon = (entityType: string) => {
    switch (entityType) {
      case "PROJECT":
        return "🏗️";
      case "TASK":
        return "📋";
      case "CUSTOMER":
        return "👥";
      case "INVOICE":
        return "📄";
      case "QUOTATION":
        return "💼";
      case "EMPLOYEE":
        return "👤";
      case "PAYMENT":
        return "���";
      default:
        return "📌";
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const formatTimeAgo = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center space-x-2">
          <Activity className="h-5 w-5 text-primary" />
          <div>
            <CardTitle className="text-base font-medium">
              Recent Activities
            </CardTitle>
            <CardDescription>
              Latest system activities and updates
            </CardDescription>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchActivities}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex h-[300px] items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="flex h-[300px] flex-col items-center justify-center space-y-2">
            <p className="text-sm text-destructive">Error: {error}</p>
            <Button variant="outline" size="sm" onClick={fetchActivities}>
              Try Again
            </Button>
          </div>
        ) : activities.length === 0 ? (
          <div className="flex h-[300px] items-center justify-center">
            <p className="text-muted-foreground">No recent activities</p>
          </div>
        ) : (
          <div className="space-y-6 max-h-[400px] overflow-y-auto">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-4 p-2 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src={activity.user.profilePicture || ""}
                    alt={`${activity.user.firstName} ${activity.user.lastName}`}
                  />
                  <AvatarFallback>
                    {getInitials(
                      activity.user.firstName,
                      activity.user.lastName
                    )}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">
                      {activity.user.firstName} {activity.user.lastName}
                    </span>
                    <Badge
                      variant="outline"
                      className={`text-xs ${getActionColor(activity.action)}`}
                    >
                      {activity.action}
                    </Badge>
                    <span className="text-sm flex items-center gap-1">
                      <span>{getEntityTypeIcon(activity.entityType)}</span>
                      <span className="text-muted-foreground">
                        {activity.entityType.toLowerCase()}
                      </span>
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {activity.details}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatTimeAgo(activity.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
