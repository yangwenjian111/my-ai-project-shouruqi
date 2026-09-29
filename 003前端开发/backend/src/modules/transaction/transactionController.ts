import { Request, Response, NextFunction } from 'express';
import { transactionService } from './transactionService';
import { success, fail } from '../../utils/response';

/** POST /api/transactions - 新增账单 */
export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { type, amount, categoryId, categoryName, transactionDate, note } = req.body ?? {};
    if (!type || !['expense', 'reserve'].includes(type)) { fail(res, '账单类型无效'); return; }
    const num = parseFloat(amount);
    if (!num || num <= 0) { fail(res, '请输入有效的金额'); return; }
    const tx = await transactionService.create(userId, { type, amount: num, categoryId, categoryName, transactionDate, note });
    success(res, tx, '记账成功', 201);
  } catch (err) { next(err); }
}

/** GET /api/transactions - 分页查询账单 */
export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const month = (req.query.month as string) || undefined;
    const type = (req.query.type as string) || undefined;
    const result = await transactionService.list(userId, { page, pageSize, month, type: type as any });
    success(res, result);
  } catch (err) { next(err); }
}

/** GET /api/transactions/today - 今日支出汇总 */
export async function todayExpense(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const data = await transactionService.todayExpense(userId);
    success(res, data);
  } catch (err) { next(err); }
}

/** GET /api/transactions/monthly - 月度收支概览 */
export async function monthlyOverview(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const month = (req.query.month as string) || undefined;
    const data = await transactionService.monthlyOverview(userId, month);
    success(res, data);
  } catch (err) { next(err); }
}

/** GET /api/transactions/export - 导出全部账单 */
export async function exportAll(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const list = await transactionService.exportAll(userId);
    success(res, list);
  } catch (err) { next(err); }
}
