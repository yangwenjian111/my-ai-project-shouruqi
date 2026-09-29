import * as bcrypt from 'bcryptjs';
import { AppDataSource } from '../../config/dataSource';
import { SuperAdmin } from '../../entities/SuperAdmin';
import { LoginDto } from '../../dto/login.dto';
import { signToken } from '../../utils/jwt';

const SALT_ROUNDS = 10;

function httpError(status: number, message: string): Error {
  return Object.assign(new Error(message), { status });
}

export interface SafeAdmin {
  id: number;
  username: string;
  nickname: string;
}

class AuthService {
  private get adminRepo() { return AppDataSource.getRepository(SuperAdmin); }

  private toSafeAdmin(admin: SuperAdmin): SafeAdmin {
    return {
      id: Number(admin.id),
      username: admin.username,
      nickname: admin.nickname,
    };
  }

  /** 管理员登录：校验密码 → 更新登录时间 → 签发 JWT */
  async login(dto: LoginDto): Promise<{ token: string; admin: SafeAdmin }> {
    const repo = this.adminRepo;
    const admin = await repo.findOne({ where: { username: dto.username } });
    if (!admin) throw httpError(401, '用户名或密码错误');

    const matched = await bcrypt.compare(dto.password, admin.passwordHash);
    if (!matched) throw httpError(401, '用户名或密码错误');

    admin.lastLoginAt = new Date();
    await repo.save(admin);

    const token = signToken({ adminId: Number(admin.id), username: admin.username });
    return { token, admin: this.toSafeAdmin(admin) };
  }

  /** 获取当前管理员信息 */
  async getProfile(adminId: number): Promise<SafeAdmin> {
    const admin = await this.adminRepo.findOne({ where: { id: adminId } });
    if (!admin) throw httpError(404, '管理员不存在');
    return this.toSafeAdmin(admin);
  }
}

export const authService = new AuthService();
