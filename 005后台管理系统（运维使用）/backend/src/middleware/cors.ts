import { Request, Response, NextFunction } from 'express';

/**
 * 轻量 CORS 中间件
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

  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
}
