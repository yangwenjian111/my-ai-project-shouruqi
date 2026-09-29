import { Request, Response, NextFunction } from 'express';
import { statisticsService } from './statisticsService';
import { success, fail } from '../../utils/response';

/** GET /api/statistics/trend - 支出趋势（折线图） */
export async function trend(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const period = (req.query.period as string) || 'month';
    if (!['week', 'month', 'year'].includes(period)) { fail(res, 'period 参数无效'); return; }
    const data = await statisticsService.trend(userId, period as any);
    success(res, data);
  } catch (err) { next(err); }
}

/** GET /api/statistics/category - 分类占比（饼图） */
export async function categoryPie(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const period = (req.query.period as string) || 'month';
    if (!['week', 'month', 'year'].includes(period)) { fail(res, 'period 参数无效'); return; }
    const data = await statisticsService.categoryPie(userId, period as any);
    success(res, data);
  } catch (err) { next(err); }
}

/** GET /api/statistics/ranking - 消费排行 */
export async function ranking(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const period = (req.query.period as string) || 'month';
    if (!['week', 'month', 'year'].includes(period)) { fail(res, 'period 参数无效'); return; }
    const data = await statisticsService.ranking(userId, period as any);
    success(res, data);
  } catch (err) { next(err); }
}
