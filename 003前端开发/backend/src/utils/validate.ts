/**
 * 参数校验工具 —— 规则依据 PRD 3.0.2 注册页
 * 每个校验函数返回 null 表示通过，返回字符串表示错误提示。
 */

/** 用户名：3-20 位，支持中英文、数字、下划线 */
const USERNAME_REGEX = /^[\u4e00-\u9fa5a-zA-Z0-9_]{3,20}$/;

/** 密码：6-20 位，至少含字母和数字（允许特殊字符，不含空白） */
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)\S{6,20}$/;

const AVATAR_COLORS = ['pink', 'orange', 'mint', 'lavender', 'blue'];

export function validateUsername(username: unknown): string | null {
  if (typeof username !== 'string' || !USERNAME_REGEX.test(username)) {
    return '用户名需为3-20位，支持中英文、数字、下划线';
  }
  return null;
}

export function validatePassword(password: unknown): string | null {
  if (typeof password !== 'string' || !PASSWORD_REGEX.test(password)) {
    return '密码需为6-20位，且至少包含字母和数字';
  }
  return null;
}

export function validateNickname(nickname: unknown): string | null {
  if (typeof nickname !== 'string' || nickname.trim() === '') {
    return '请输入昵称';
  }
  if ([...nickname.trim()].length > 15) {
    return '昵称最多15字';
  }
  return null;
}

export function validateAvatar(avatar: unknown): string | null {
  if (avatar === undefined || avatar === null || avatar === '') return null; // 可选，默认 pink
  if (typeof avatar !== 'string' || !AVATAR_COLORS.includes(avatar)) {
    return '头像颜色无效，可选值：pink/orange/mint/lavender/blue';
  }
  return null;
}
