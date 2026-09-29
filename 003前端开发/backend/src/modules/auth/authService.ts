import * as bcrypt from 'bcryptjs';
import { AppDataSource } from '../../config/dataSource';
import { User, AvatarColor } from '../../entities/User';
import { RegisterDto } from '../../dto/register.dto';
import { LoginDto } from '../../dto/login.dto';
import { signToken } from '../../utils/jwt';

/** bcrypt 加密强度（与 DBA 脚本中 password_hash 的 $2b$10$ 保持一致） */
const SALT_ROUNDS = 10;

/** 构造带 HTTP 状态码的错误，交由全局错误中间件处理 */
function httpError(status: number, message: string): Error {
  return Object.assign(new Error(message), { status });
}

/** 对外暴露的安全用户信息（剔除密码哈希等敏感字段） */
export interface SafeUser {
  id: number;
  username: string;
  nickname: string;
  avatar: AvatarColor;
}

class AuthService {
  private get userRepo() { return AppDataSource.getRepository(User); }

  private toSafeUser(user: User): SafeUser {
    return {
      id: Number(user.id),
      username: user.username,
      nickname: user.nickname,
      avatar: user.avatar,
    };
  }

  /** 注册：校验用户名唯一 → bcrypt 加密密码 → 落库 */
  async register(dto: RegisterDto): Promise<SafeUser> {
    const repo = this.userRepo;
    const existing = await repo.findOne({ where: { username: dto.username } });
    if (existing) throw httpError(409, '用户名已被注册');

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
    const nickname = dto.nickname.trim();
    const avatar = (dto.avatar as AvatarColor) || 'pink';

    const user = repo.create({ username: dto.username, passwordHash, nickname, avatar, status: 1 });
    const saved = await repo.save(user);
    return this.toSafeUser(saved);
  }

  /** 登录：校验密码 → 更新登录时间 → 签发 JWT */
  async login(dto: LoginDto): Promise<{ token: string; user: SafeUser }> {
    const repo = this.userRepo;
    const user = await repo.findOne({ where: { username: dto.username } });
    if (!user) throw httpError(401, '用户名或密码错误');
    if (user.status === 0) throw httpError(403, '账号已注销，无法登录');

    const matched = await bcrypt.compare(dto.password, user.passwordHash);
    if (!matched) throw httpError(401, '用户名或密码错误');

    user.lastLoginAt = new Date();
    await repo.save(user);

    const token = signToken({ userId: Number(user.id), username: user.username });
    return { token, user: this.toSafeUser(user) };
  }

  /** 获取当前登录用户信息 */
  async getProfile(userId: number): Promise<SafeUser> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw httpError(404, '用户不存在');
    return this.toSafeUser(user);
  }

  /** 修改昵称 */
  async updateNickname(userId: number, nickname: string): Promise<SafeUser> {
    const repo = this.userRepo;
    const user = await repo.findOne({ where: { id: userId } });
    if (!user) throw httpError(404, '用户不存在');
    user.nickname = nickname.trim();
    const saved = await repo.save(user);
    return this.toSafeUser(saved);
  }
}

export const authService = new AuthService();
