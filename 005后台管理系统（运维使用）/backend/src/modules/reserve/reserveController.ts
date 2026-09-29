import { Request, Response, NextFunction } from 'express';
import { reserveService } from './reserveService';
import { success } from '../../utils/response';

/** GET /api/admin/reserve-funds */
export async function getReserveFunds(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(50, Math.max(1, Number(req.query.pageSize) || 20));
    const month = typeof req.query.month === 'string' ? req.query.month : undefined;
    const userId = req.query.userId ? Number(req.query.userId) : undefined;
    const data = await reserveService.getReserveFunds(page, pageSize, month, userId);
    success(res, data);
  } catch (err) {
    next(err);
  }
}

/** GET /api/admin/reserve-funds/summary */
export async function getMonthlySummary(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await reserveService.getMonthlySummary();
    success(res, data);
  } catch (err) {
    next(err);
  }
}
