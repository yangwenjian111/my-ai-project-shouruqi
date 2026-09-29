import { Request, Response, NextFunction } from 'express';
import { authService } from './authService';
import { success, fail } from '../../utils/response';

/**
 * POST /api/admin/auth/login
 */
export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { username, password } = req.body ?? {};
    if (!username || !password) { fail(res, '请输入用户名和密码'); return; }
    const result = await authService.login({ username, password });
    success(res, result, '登录成功');
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/admin/auth/profile
 */
export async function profile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const adminId = req.admin!.adminId;
    const admin = await authService.getProfile(adminId);
    success(res, admin);
  } catch (err) {
    next(err);
  }
}
