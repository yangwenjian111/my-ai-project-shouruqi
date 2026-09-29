/** 注册请求参数（对应 PRD 3.0.2 注册页字段） */
export interface RegisterDto {
  username: string;
  password: string;
  confirmPassword: string;
  nickname: string;
  avatar?: string;
}
