import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from '../utils/jwt';

// 扩展 Express Request 类型，附加已认证管理员信息
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      admin?: JwtPayload;
    }
  }
}

/**
 * 管理员 JWT 鉴权中间件
 */
export function adminAuthGuard(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : null;

  if (!token) {
    res.status(401).json({ code: -1, message: '未提供认证令牌', data: null });
    return;
  }

  try {
    req.admin = verifyToken(token);
    next();
  } catch {
    res.status(401).json({ code: -1, message: '认证令牌无效或已过期', data: null });
  }
}
