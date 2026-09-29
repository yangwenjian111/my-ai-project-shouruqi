import { Request, Response, NextFunction } from 'express';
import { transactionService } from './transactionService';
import { success, fail } from '../../utils/response';

/** GET /api/admin/transactions */
export async function getTransactions(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(50, Math.max(1, Number(req.query.pageSize) || 20));
    const filters = {
      userId: req.query.userId ? Number(req.query.userId) : undefined,
      type: typeof req.query.type === 'string' ? req.query.type : undefined,
      month: typeof req.query.month === 'string' ? req.query.month : undefined,
      categoryId: req.query.categoryId ? Number(req.query.categoryId) : undefined,
    };
    const data = await transactionService.getTransactions(page, pageSize, filters);
    success(res, data);
  } catch (err) {
    next(err);
  }
}

/** GET /api/admin/transactions/:id */
export async function getTransactionDetail(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const txId = Number(req.params.id);
    if (!txId) { fail(res, '账单ID无效'); return; }
    const data = await transactionService.getTransactionDetail(txId);
    success(res, data);
  } catch (err) {
    next(err);
  }
}
