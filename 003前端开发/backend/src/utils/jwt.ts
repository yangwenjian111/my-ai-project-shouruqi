import jwt, { SignOptions } from 'jsonwebtoken';

export interface JwtPayload {
  userId: number;
  username: string;
}

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('未配置 JWT_SECRET 环境变量');
  }
  return secret;
}

/** 签发 JWT */
export function signToken(payload: JwtPayload): string {
  const options: SignOptions = {
    expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as SignOptions['expiresIn'],
  };
  return jwt.sign(payload, getSecret(), options);
}

/** 校验并解析 JWT，失败抛异常 */
export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, getSecret()) as JwtPayload;
}
