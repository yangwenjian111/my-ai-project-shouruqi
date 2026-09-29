import { AppDataSource } from '../../config/dataSource';
import { User } from '../../entities/User';
import { Transaction } from '../../entities/Transaction';
import { Category } from '../../entities/Category';
import { ReserveFund } from '../../entities/ReserveFund';

class DashboardService {
  /** 获取 8 项核心统计指标 */
  async getOverview() {
    const userRepo = AppDataSource.getRepository(User);
    const txRepo = AppDataSource.getRepository(Transaction);
    const catRepo = AppDataSource.getRepository(Category);
    const rfRepo = AppDataSource.getRepository(ReserveFund);

    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    const monthStr = today.toISOString().slice(0, 7);

    // 1. 用户总数（status=1）
    const totalUsers = await userRepo.count({ where: { status: 1 } });

    // 2. 今日新增用户
    const todayNewUsers = await userRepo
      .createQueryBuilder('u')
      .where('DATE(u.created_at) = :today', { today: todayStr })
      .getCount();

    // 3. 账单总数
    const totalTransactions = await txRepo.count();

    // 4. 今日账单数
    const todayTransactions = await txRepo
      .createQueryBuilder('t')
      .where('DATE(t.created_at) = :today', { today: todayStr })
      .getCount();

    // 5. 系统总支出
    const totalExpenseResult = await txRepo
      .createQueryBuilder('t')
      .select('COALESCE(SUM(t.amount), 0)', 'total')
      .where('t.type = :type', { type: 'expense' })
      .getRawOne();
    const totalExpense = Number(totalExpenseResult?.total || 0);

    // 6. 本月总支出
    const monthExpenseResult = await txRepo
      .createQueryBuilder('t')
      .select('COALESCE(SUM(t.amount), 0)', 'total')
      .where('t.type = :type', { type: 'expense' })
      .andWhere('DATE_FORMAT(t.transaction_date, \'%Y-%m\') = :month', { month: monthStr })
      .getRawOne();
    const monthExpense = Number(monthExpenseResult?.total || 0);

    // 7. 储备金总额（当月）
    const reserveTotalResult = await rfRepo
      .createQueryBuilder('r')
      .select('COALESCE(SUM(r.amount), 0)', 'total')
      .where('r.month = :month', { month: monthStr })
      .getRawOne();
    const reserveTotal = Number(reserveTotalResult?.total || 0);

    // 8. 分类总数（系统预设，user_id IS NULL）
    const totalCategories = await catRepo
      .createQueryBuilder('c')
      .where('c.user_id IS NULL')
      .getCount();

    return {
      totalUsers,
      todayNewUsers,
      totalTransactions,
      todayTransactions,
      totalExpense,
      monthExpense,
      reserveTotal,
      totalCategories,
    };
  }
}

export const dashboardService = new DashboardService();
