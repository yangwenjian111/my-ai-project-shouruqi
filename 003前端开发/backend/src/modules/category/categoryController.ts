import { Request, Response, NextFunction } from 'express';
import { categoryService } from './categoryService';
import { success } from '../../utils/response';

/** GET /api/categories - 获取分类列表 */
export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const type = (req.query.type as string) || undefined;
    const list = await categoryService.list(userId, type as any);
    success(res, list);
  } catch (err) { next(err); }
}
