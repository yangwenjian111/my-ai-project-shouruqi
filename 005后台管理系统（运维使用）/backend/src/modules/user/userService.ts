import { AppDataSource } from '../../config/dataSource';
import { User } from '../../entities/User';
import { Transaction } from '../../entities/Transaction';
import { ReserveFund } from '../../entities/ReserveFund';

function httpError(status: number, message: string): Error {
  return Object.assign(new Error(message), { status });
}

class UserService {
  private get userRepo() { return AppDataSource.getRepository(User); }
  private get txRepo() { return AppDataSource.getRepository(Transaction); }
  private get rfRepo() { return AppDataSource.getRepository(ReserveFund); }

  /** 用户列表（分页 + 搜索 + 关联账单数/总支出） */
  async getUsers(page: number, pageSize: number, keyword?: string) {
    const qb = AppDataSource.getRepository(User)
      .createQueryBuilder('u')
      .select([
        'u.id',
        'u.username',
        'u.nickname',
        'u.avatar',
        'u.status',
        'u.last_login_at',
        'u.created_at',
      ])
      .addSelect(
        `(SELECT COUNT(*) FROM transactions t WHERE t.user_id = u.id)`,
        'txCount',
      )
      .addSelect(
        `(SELECT COALESCE(SUM(t.amount), 0) FROM transactions t WHERE t.user_id = u.id AND t.type = 'expense')`,
        'totalExpense',
      );

    if (keyword) {
      qb.where('u.username LIKE :kw OR u.nickname LIKE :kw', { kw: `%${keyword}%` });
    }

    qb.orderBy('u.created_at', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    const rawList = await qb.getRawMany();

    const total = await AppDataSource.getRepository(User)
      .createQueryBuilder('u')
      .where(keyword ? 'u.username LIKE :kw OR u.nickname LIKE :kw' : '1=1', keyword ? { kw: `%${keyword}%` } : undefined)
      .getCount();

    const list = rawList.map((row: Record<string, unknown>) => ({
      id: Number(row.u_id),
      username: row.u_username,
      nickname: row.u_nickname,
      avatar: row.u_avatar,
      status: row.u_status,
      lastLoginAt: row.u_last_login_at,
      createdAt: row.u_created_at,
      txCount: Number(row.txCount || 0),
      totalExpense: Number(row.totalExpense || 0),
    }));

    return { list, total, page, pageSize };
  }

  /** 用户详情 */
  async getUserDetail(userId: number) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw httpError(404, '用户不存在');

    // 账单统计
    const txStats = await this.txRepo
      .createQueryBuilder('t')
      .select('COUNT(*)', 'totalCount')
      .addSelect('COALESCE(SUM(t.amount), 0)', 'totalAmount')
      .addSelect(`COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0)`, 'expenseAmount')
      .addSelect(`COALESCE(SUM(CASE WHEN t.type = 'reserve' THEN t.amount ELSE 0 END), 0)`, 'reserveAmount')
      .where('t.user_id = :userId', { userId })
      .getRawOne();

    // 最近账单
    const recentTx = await this.txRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 5,
    });

    // 储备金记录
    const reserveFunds = await this.rfRepo.find({
      where: { userId },
      order: { month: 'DESC' },
    });

    return {
      user: {
        id: Number(user.id),
        username: user.username,
        nickname: user.nickname,
        avatar: user.avatar,
        status: user.status,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
      },
      txStats: {
        totalCount: Number(txStats?.totalCount || 0),
        totalAmount: Number(txStats?.totalAmount || 0),
        expenseAmount: Number(txStats?.expenseAmount || 0),
        reserveAmount: Number(txStats?.reserveAmount || 0),
      },
      recentTransactions: recentTx.map((t: Transaction) => ({
        id: Number(t.id),
        categoryName: t.categoryName,
        type: t.type,
        amount: Number(t.amount),
        transactionDate: t.transactionDate,
        note: t.note,
        createdAt: t.createdAt,
      })),
      reserveFunds: reserveFunds.map((r: ReserveFund) => ({
        id: Number(r.id),
        month: r.month,
        amount: Number(r.amount),
        createdAt: r.createdAt,
      })),
    };
  }

  /** 用户账单列表（分页 + 筛选） */
  async getUserTransactions(userId: number, page: number, pageSize: number, month?: string, type?: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw httpError(404, '用户不存在');

    const qb = this.txRepo.createQueryBuilder('t')
      .where('t.user_id = :userId', { userId });

    if (month) {
      qb.andWhere(`DATE_FORMAT(t.transaction_date, '%Y-%m') = :month`, { month });
    }
    if (type && (type === 'expense' || type === 'reserve')) {
      qb.andWhere('t.type = :type', { type });
    }

    qb.orderBy('t.created_at', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    const [list, total] = await qb.getManyAndCount();

    return {
      list: list.map((t: Transaction) => ({
        id: Number(t.id),
        categoryName: t.categoryName,
        type: t.type,
        amount: Number(t.amount),
        transactionDate: t.transactionDate,
        note: t.note,
        createdAt: t.createdAt,
      })),
      total,
      page,
      pageSize,
    };
  }

  /** 用户储备金记录 */
  async getUserReserveFunds(userId: number) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw httpError(404, '用户不存在');

    const list = await this.rfRepo.find({
      where: { userId },
      order: { month: 'DESC' },
    });

    return list.map((r: ReserveFund) => ({
      id: Number(r.id),
      month: r.month,
      amount: Number(r.amount),
      createdAt: r.createdAt,
    }));
  }
}

export const userService = new UserService();
