import { PrismaClient } from '@prisma/client';
import { logger } from '../config/logger';

const prisma = new PrismaClient();

export interface ActivityLogData {
  userId: string;
  action: string;
  resource?: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
  status?: 'success' | 'failure' | 'error';
}

/**
 * Activity Log Service
 * Tracks user actions and system events
 */
export class ActivityLogService {
  /**
   * Create a new activity log entry
   */
  async log(data: ActivityLogData): Promise<void> {
    try {
      await prisma.activityLog.create({
        data: {
          userId: data.userId,
          action: data.action,
          resource: data.resource,
          details: data.details ? JSON.stringify(data.details) : null,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          status: data.status || 'success',
        },
      });

      logger.info('Activity logged', {
        userId: data.userId,
        action: data.action,
        status: data.status,
      });
    } catch (error) {
      logger.error('Failed to log activity', { error, data });
      // Don't throw - logging failure shouldn't break the application
    }
  }

  /**
   * Get activity logs with pagination and filtering
   */
  async getLogs(options: {
    userId?: string;
    action?: string;
    status?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }) {
    const {
      userId,
      action,
      status,
      startDate,
      endDate,
      page = 1,
      limit = 50,
    } = options;

    const where: any = {};

    if (userId) where.userId = userId;
    if (action) where.action = action;
    if (status) where.status = status;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.activityLog.count({ where }),
    ]);

    return {
      logs: logs.map((log: any) => ({
        ...log,
        details: log.details ? JSON.parse(log.details) : null,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get activity statistics
   */
  async getStatistics(userId?: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const where: any = {
      createdAt: {
        gte: startDate,
      },
    };

    if (userId) where.userId = userId;

    const [totalLogs, byAction, byStatus, byDay] = await Promise.all([
      // Total count
      prisma.activityLog.count({ where }),

      // Group by action
      prisma.activityLog.groupBy({
        by: ['action'],
        where,
        _count: {
          action: true,
        },
        orderBy: {
          _count: {
            action: 'desc',
          },
        },
      }),

      // Group by status
      prisma.activityLog.groupBy({
        by: ['status'],
        where,
        _count: {
          status: true,
        },
      }),

      // Group by day
      prisma.$queryRaw`
        SELECT
          DATE(createdAt) as date,
          COUNT(*) as count
        FROM activity_logs
        WHERE createdAt >= ${startDate}
        ${userId ? prisma.$queryRaw`AND userId = ${userId}` : prisma.$queryRaw``}
        GROUP BY DATE(createdAt)
        ORDER BY date DESC
      `,
    ]);

    return {
      totalLogs,
      byAction: byAction.map((item: any) => ({
        action: item.action,
        count: item._count.action,
      })),
      byStatus: byStatus.map((item: any) => ({
        status: item.status,
        count: item._count.status,
      })),
      byDay,
    };
  }

  /**
   * Delete old activity logs (cleanup)
   */
  async cleanup(daysToKeep: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await prisma.activityLog.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    logger.info('Activity logs cleaned up', {
      deletedCount: result.count,
      cutoffDate,
    });

    return result.count;
  }
}

export const activityLogService = new ActivityLogService();
export default activityLogService;
