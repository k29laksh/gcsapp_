import { prisma } from "@/lib/prisma";

export interface ActivityLogData {
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  details: string;
}

export async function createActivityLog(data: ActivityLogData): Promise<void> {
  try {
    console.log("Creating activity log:", data);

    await prisma.activityLog.create({
      data: {
        id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: data.userId,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        details: data.details,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    console.log("Activity log created successfully");
  } catch (error) {
    console.error("Failed to create activity log:", error);
    // Don't throw error to prevent breaking main operations
  }
}

export async function safeCreateActivityLog(
  data: ActivityLogData
): Promise<boolean> {
  try {
    await createActivityLog(data);
    return true;
  } catch (error) {
    console.error("Activity log creation failed:", error);
    return false;
  }
}

export async function getActivityLogs(limit = 20) {
  try {
    const activityLogs = await prisma.activityLog.findMany({
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePicture: true,
          },
        },
      },
    });

    return activityLogs;
  } catch (error) {
    console.error("Error fetching activity logs:", error);
    return [];
  }
}
