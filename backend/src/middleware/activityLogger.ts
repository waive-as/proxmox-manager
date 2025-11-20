import { Request, Response, NextFunction } from 'express';
import { activityLogService } from '../services/activityLogService';

/**
 * Activity logging middleware
 * Automatically logs HTTP requests as activity
 */
export function activityLogger(action: string, options?: {
  includeBody?: boolean;
  includeQuery?: boolean;
  resourceFromParam?: string;
}) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Store original send to intercept response
    const originalSend = res.send;

    res.send = function(data: any) {
      // Determine status based on response code
      let status: 'success' | 'failure' | 'error' = 'success';
      if (res.statusCode >= 400 && res.statusCode < 500) {
        status = 'failure';
      } else if (res.statusCode >= 500) {
        status = 'error';
      }

      // Build details object
      const details: any = {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
      };

      if (options?.includeBody && req.body) {
        details.body = sanitizeBody(req.body);
      }

      if (options?.includeQuery && req.query) {
        details.query = req.query;
      }

      // Extract resource ID from route params if specified
      let resource: string | undefined;
      if (options?.resourceFromParam && req.params[options.resourceFromParam]) {
        resource = req.params[options.resourceFromParam];
      }

      // Log activity (don't await - fire and forget)
      if (req.user?.id) {
        activityLogService.log({
          userId: req.user.id,
          action,
          resource,
          details,
          ipAddress: req.ip || req.socket.remoteAddress,
          userAgent: req.get('user-agent'),
          status,
        }).catch(err => {
          // Silently fail - logging shouldn't break the app
          console.error('Activity logging failed:', err);
        });
      }

      // Call original send
      return originalSend.call(this, data);
    };

    next();
  };
}

/**
 * Sanitize request body to remove sensitive data
 */
function sanitizeBody(body: any): any {
  if (!body || typeof body !== 'object') return body;

  const sanitized = { ...body };
  const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'creditCard'];

  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  }

  return sanitized;
}

/**
 * Log specific user actions manually
 */
export async function logUserAction(
  req: Request,
  action: string,
  resource?: string,
  details?: any
) {
  if (!req.user?.id) return;

  await activityLogService.log({
    userId: req.user.id,
    action,
    resource,
    details,
    ipAddress: req.ip || req.socket.remoteAddress,
    userAgent: req.get('user-agent'),
    status: 'success',
  });
}
