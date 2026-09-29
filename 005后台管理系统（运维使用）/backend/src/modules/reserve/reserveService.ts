import { AppDataSource } from '../../config/dataSource';
import { ReserveFund } from '../../entities/ReserveFund';

class ReserveService {
  private get rfRepo() { return AppDataSource.getRepository(ReserveFund); }

  /** 储备金列表（分页 + 筛选） */
  async getReserveFunds(page: number, pageSize: number, month?: string, userId?: number) {
    const qb = this.rfRepo.createQueryBuilder('r')
      .select([
        'r.id',
        'r.user_id',
        'r.month',
        'r.amount',
        'r.created_at',
      ])
      .addSelect('u.username', 'username')
      .addSelect('u.nickname', 'nickname')
      .addSelect(
        `(SELECT COALESCE(SUM(t.amount), 0) FROM transactions t WHERE t.user_id = r.user_id AND t.type = 'expense' AND DATE_FORMAT(t.transaction_date, '%Y-%m') = r.month)`,
        'actualExpense',
      )
      .leftJoin('users', 'u', 'u.id = r.user_id');

    if (month) {
      qb.andWhere('r.month = :month', { month });
    }
    if (userId) {
      qb.andWhere('r.user_id = :userId', { userId });
    }

    qb.orderBy('r.created_at', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    const rawList = await qb.getRawMany();

    // 总数
    const countQb = this.rfRepo.createQueryBuilder('r');
    if (month) countQb.andWhere('r.month = :month', { month });
    if (userId) countQb.andWhere('r.user_id = :userId', { userId });
    const total = await countQb.getCount();

    const list = rawList.map((row: Record<string, unknown>) => {
      const amount = Number(row.r_amount || 0);
      const actualExpense = Number(row.actualExpense || 0);
      return {
        id: Number(row.r_id),
        userId: Number(row.r_user_id),
        username: row.username,
        nickname: row.nickname,
        month: row.r_month,
        amount,
        actualExpense,
        balance: amount - actualExpense,
        createdAt: row.r_created_at,
      };
    });

    return { list, total, page, pageSize };
  }

  /** 储备金月度汇总 */
  async getMonthlySummary() {
    const result = await this.rfRepo
      .createQueryBuilder('r')
      .select('r.month', 'month')
      .addSelect('COUNT(*)', 'userCount')
      .addSelect('COALESCE(SUM(r.amount), 0)', 'totalReserve')
      .addSelect(
        `(SELECT COALESCE(SUM(t.amount), 0) FROM transactions t WHERE t.type = 'expense' AND DATE_FORMAT(t.transaction_date, '%Y-%m') = r.month)`,
        'totalExpense',
      )
      .groupBy('r.month')
      .orderBy('r.month', 'DESC')
      .getRawMany();

    return result.map((row: Record<string, unknown>) => {
      const totalReserve = Number(row.totalReserve || 0);
      const totalExpense = Number(row.totalExpense || 0);
      return {
        month: row.month,
        userCount: Number(row.userCount || 0),
        totalReserve,
        totalExpense,
        balance: totalReserve - totalExpense,
      };
    });
  }
}

export const reserveService = new ReserveService();
