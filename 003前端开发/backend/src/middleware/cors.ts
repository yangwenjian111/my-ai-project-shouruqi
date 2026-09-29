import { Request, Response, NextFunction } from 'express';

/**
 * 轻量 CORS 中间件（手写实现，避免引入额外依赖）
 * 允许前端页面（不同端口/源）跨域访问后端 API。
 * 通过环境变量 CORS_ORIGIN 控制允许的来源。
 */
export function corsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const origin = process.env.CORS_ORIGIN || '*';

  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');
  if (origin !== '*') {
    res.setHeader('Vary', 'Origin');
  }

  // 预检请求直接返回，无需进入业务逻辑
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
}
