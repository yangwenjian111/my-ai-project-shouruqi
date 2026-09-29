import { Request, Response, NextFunction } from 'express';

export interface HttpError extends Error {
  status?: number;
  code?: number;
}

/** 404 处理 */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    code: -1,
    message: `接口不存在: ${req.method} ${req.originalUrl}`,
    data: null,
  });
}

/** 全局错误处理中间件 */
export function errorHandler(
  err: HttpError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction,
): void {
  const status = err.status && err.status >= 400 && err.status < 600 ? err.status : 500;
  const message = status === 500 ? '服务器内部错误' : err.message;
  if (status >= 500) {
    console.error('[ERROR]', err);
  }
  res.status(status).json({ code: err.code ?? -1, message, data: null });
}
