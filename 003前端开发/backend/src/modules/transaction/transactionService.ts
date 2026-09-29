import { AppDataSource } from '../../config/dataSource';
import { Transaction } from '../../entities/Transaction';
import { ReserveFund } from '../../entities/ReserveFund';
import { Category } from '../../entities/Category';

/** 获取当前月份字符串 YYYY-MM */
function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/** 获取今天日期字符串 YYYY-MM-DD */
function getToday(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

class TransactionService {
  private get txRepo() { return AppDataSource.getRepository(Transaction); }
  private get reserveRepo() { return AppDataSource.getRepository(ReserveFund); }
  private get catRepo() { return AppDataSource.getRepository(Category); }

  /** 新增账单 */
  async create(userId: number, dto: {
    type: 'expense' | 'reserve';
    amount: number;
    categoryId?: number;
    categoryName?: string;
    transactionDate?: string;
    note?: string;
  }): Promise<Transaction> {
    let categoryName = dto.categoryName || '其他';
    if (dto.categoryId) {
      const cat = await this.catRepo.findOne({ where: { id: dto.categoryId } });
      if (cat) categoryName = cat.name;
    }
    const tx = this.txRepo.create({
      userId,
      categoryId: dto.categoryId || null,
      categoryName,
      type: dto.type,
      amount: dto.amount,
      transactionDate: dto.transactionDate || getToday(),
      note: dto.note || '',
    });
    return this.txRepo.save(tx);
  }

  /** 分页查询账单 */
  async list(userId: number, opts: {
    page?: number;
    pageSize?: number;
    month?: string;
    type?: 'expense' | 'reserve' | 'all';
  }): Promise<{ list: Transaction[]; total: number; page: number; pageSize: number }> {
    const page = opts.page || 1;
    const pageSize = opts.pageSize || 20;
    const qb = this.txRepo.createQueryBuilder('t')
      .where('t.user_id = :userId', { userId });

    if (opts.month) {
      qb.andWhere('DATE_FORMAT(t.transaction_date, \'%Y-%m\') = :month', { month: opts.month });
    }
    if (opts.type && opts.type !== 'all') {
      qb.andWhere('t.type = :type', { type: opts.type });
    }

    qb.orderBy('t.transaction_date', 'DESC')
      .addOrderBy('t.created_at', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    const [list, total] = await qb.getManyAndCount();
    return { list, total, page, pageSize };
  }

  /** 今日支出汇总 */
  async todayExpense(userId: number): Promise<{ date: string; totalExpense: number; list: Transaction[] }> {
    const today = getToday();
    const [list, total] = await this.txRepo.findAndCount({
      where: { userId, type: 'expense', transactionDate: today },
      order: { createdAt: 'DESC' },
    });
    const totalExpense = list.reduce((sum, t) => sum + Number(t.amount), 0);
    return { date: today, totalExpense, list };
  }

  /** 月度收支概览（储备金/支出/结余） */
  async monthlyOverview(userId: number, month?: string): Promise<{
    month: string;
    reserve: number;
    totalExpense: number;
    balance: number;
    progressPercent: number;
  }> {
    const m = month || getCurrentMonth();
    const reserve = await this.reserveRepo.findOne({ where: { userId, month: m } });
    const reserveAmount = reserve ? Number(reserve.amount) : 0;

    const result = await this.txRepo
      .createQueryBuilder('t')
      .select('COALESCE(SUM(t.amount), 0)', 'total')
      .where('t.user_id = :userId', { userId })
      .andWhere('t.type = :type', { type: 'expense' })
      .andWhere('DATE_FORMAT(t.transaction_date, \'%Y-%m\') = :month', { month: m })
      .getRawOne();
    const totalExpense = Number(result?.total || 0);
    const balance = reserveAmount - totalExpense;
    const progressPercent = reserveAmount > 0 ? Math.round((totalExpense / reserveAmount) * 100) : 0;

    return { month: m, reserve: reserveAmount, totalExpense, balance, progressPercent };
  }

  /** 导出全部账单 */
  async exportAll(userId: number): Promise<Transaction[]> {
    return this.txRepo.find({
      where: { userId },
      order: { transactionDate: 'DESC', createdAt: 'DESC' },
    });
  }
}

export const transactionService = new TransactionService();
