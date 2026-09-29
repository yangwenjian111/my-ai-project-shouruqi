import { Request, Response, NextFunction } from 'express';
import { authService } from './authService';
import { success, fail } from '../../utils/response';
import {
  validateUsername,
  validatePassword,
  validateNickname,
  validateAvatar,
} from '../../utils/validate';

/**
 * POST /api/auth/register
 * 注册（校验规则见 PRD 3.0.2）
 */
export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { username, password, confirmPassword, nickname, avatar } = req.body ?? {};

    const usernameErr = validateUsername(username);
    if (usernameErr) { fail(res, usernameErr); return; }

    const passwordErr = validatePassword(password);
    if (passwordErr) { fail(res, passwordErr); return; }

    if (password !== confirmPassword) { fail(res, '两次密码不一致'); return; }

    const nicknameErr = validateNickname(nickname);
    if (nicknameErr) { fail(res, nicknameErr); return; }

    const avatarErr = validateAvatar(avatar);
    if (avatarErr) { fail(res, avatarErr); return; }

    const user = await authService.register({ username, password, confirmPassword, nickname, avatar });
    success(res, user, '注册成功', 201);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/login
 * 登录，成功返回 JWT 与用户信息
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
 * GET /api/auth/profile
 * 获取当前登录用户信息（需携带 JWT）
 */
export async function profile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const user = await authService.getProfile(userId);
    success(res, user);
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/auth/nickname
 * 修改昵称
 */
export async function updateNickname(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { nickname } = req.body ?? {};
    const nicknameErr = validateNickname(nickname);
    if (nicknameErr) { fail(res, nicknameErr); return; }
    const user = await authService.updateNickname(userId, nickname);
    success(res, user, '昵称修改成功');
  } catch (err) {
    next(err);
  }
}
