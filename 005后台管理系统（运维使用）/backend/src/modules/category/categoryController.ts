import { Request, Response, NextFunction } from 'express';
import { categoryService } from './categoryService';
import { success, fail } from '../../utils/response';

/** GET /api/admin/categories */
export async function getCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await categoryService.getCategories();
    success(res, data);
  } catch (err) {
    next(err);
  }
}

/** POST /api/admin/categories */
export async function createCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { type, name, icon, color, bgColor, sortOrder } = req.body ?? {};
    if (!type || !name) { fail(res, '类型和名称为必填项'); return; }
    const data = await categoryService.createCategory({ type, name, icon, color, bgColor, sortOrder });
    success(res, data, '分类创建成功', 201);
  } catch (err) {
    next(err);
  }
}

/** DELETE /api/admin/categories/:id */
export async function deleteCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const categoryId = Number(req.params.id);
    if (!categoryId) { fail(res, '分类ID无效'); return; }
    const data = await categoryService.deleteCategory(categoryId);
    success(res, data, '分类删除成功');
  } catch (err) {
    next(err);
  }
}
