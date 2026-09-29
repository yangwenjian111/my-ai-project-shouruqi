import { Response } from 'express';

/**
 * 统一 API 响应格式
 * code: 0 表示成功，非 0 表示业务失败
 */
export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T | null;
}

export function success<T>(res: Response, data: T, message = 'success', status = 200): Response {
  const body: ApiResponse<T> = { code: 0, message, data };
  return res.status(status).json(body);
}

export function fail(
  res: Response,
  message: string,
  status = 400,
  code = -1,
  data: unknown = null,
): Response {
  const body: ApiResponse = { code, message, data: data as ApiResponse['data'] };
  return res.status(status).json(body);
}
