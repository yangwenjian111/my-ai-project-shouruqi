import { Request, Response, NextFunction } from 'express';
import { dashboardService } from './dashboardService';
import { success } from '../../utils/response';

/**
 * GET /api/admin/dashboard
 */
export async function getOverview(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await dashboardService.getOverview();
    success(res, data);
  } catch (err) {
    next(err);
  }
}
