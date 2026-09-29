import { Request, Response, NextFunction } from 'express';
import { reserveService } from './reserveService';
import { success, fail } from '../../utils/response';

/** GET /api/reserve/current - 获取当月储备金 */
export async function getCurrent(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const data = await reserveService.getCurrent(userId);
    success(res, data);
  } catch (err) { next(err); }
}

/** POST /api/reserve - 创建/更新当月储备金 */
export async function setReserve(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { amount } = req.body ?? {};
    const num = parseFloat(amount);
    if (!num || num <= 0) { fail(res, '请输入有效的储备金金额'); return; }
    const data = await reserveService.setReserve(userId, num);
    success(res, data, '储备金设置成功');
  } catch (err) { next(err); }
}
