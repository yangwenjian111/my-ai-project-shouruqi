import { Request, Response, NextFunction } from 'express';
import { userService } from './userService';
import { success, fail } from '../../utils/response';

/** GET /api/admin/users */
export async function getUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(50, Math.max(1, Number(req.query.pageSize) || 20));
    const keyword = typeof req.query.keyword === 'string' ? req.query.keyword.trim() : undefined;
    const data = await userService.getUsers(page, pageSize, keyword || undefined);
    success(res, data);
  } catch (err) {
    next(err);
  }
}

/** GET /api/admin/users/:id */
export async function getUserDetail(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = Number(req.params.id);
    if (!userId) { fail(res, '用户ID无效'); return; }
    const data = await userService.getUserDetail(userId);
    success(res, data);
  } catch (err) {
    next(err);
  }
}

/** GET /api/admin/users/:id/transactions */
export async function getUserTransactions(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = Number(req.params.id);
    if (!userId) { fail(res, '用户ID无效'); return; }
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(50, Math.max(1, Number(req.query.pageSize) || 20));
    const month = typeof req.query.month === 'string' ? req.query.month : undefined;
    const type = typeof req.query.type === 'string' ? req.query.type : undefined;
    const data = await userService.getUserTransactions(userId, page, pageSize, month, type);
    success(res, data);
  } catch (err) {
    next(err);
  }
}

/** GET /api/admin/users/:id/reserve-funds */
export async function getUserReserveFunds(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = Number(req.params.id);
    if (!userId) { fail(res, '用户ID无效'); return; }
    const data = await userService.getUserReserveFunds(userId);
    success(res, data);
  } catch (err) {
    next(err);
  }
}
