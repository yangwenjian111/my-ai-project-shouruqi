import { AppDataSource } from '../../config/dataSource';
import { Transaction } from '../../entities/Transaction';

function httpError(status: number, message: string): Error {
  return Object.assign(new Error(message), { status });
}

class TransactionService {
  private get txRepo() { return AppDataSource.getRepository(Transaction); }

  /** 账单列表（分页 + 多条件筛选） */
  async getTransactions(page: number, pageSize: number, filters: {
    userId?: number;
    type?: string;
    month?: string;
    categoryId?: number;
  }) {
    const qb = this.txRepo.createQueryBuilder('t')
      .select([
        't.id',
        't.user_id',
        't.category_id',
        't.category_name',
        't.type',
        't.amount',
        't.transaction_date',
        't.note',
        't.created_at',
      ])
      .addSelect('u.username', 'username')
      .addSelect('u.nickname', 'nickname')
      .leftJoin('users', 'u', 'u.id = t.user_id');

    if (filters.userId) {
      qb.andWhere('t.user_id = :userId', { userId: filters.userId });
    }
    if (filters.type && (filters.type === 'expense' || filters.type === 'reserve')) {
      qb.andWhere('t.type = :type', { type: filters.type });
    }
    if (filters.month) {
      qb.andWhere(`DATE_FORMAT(t.transaction_date, '%Y-%m') = :month`, { month: filters.month });
    }
    if (filters.categoryId) {
      qb.andWhere('t.category_id = :categoryId', { categoryId: filters.categoryId });
    }

    // 金额汇总子查询（基于筛选条件）
    const sumQb = this.txRepo.createQueryBuilder('t2')
      .select('COALESCE(SUM(t2.amount), 0)', 'totalAmount')
      .where('1=1');

    if (filters.userId) sumQb.andWhere('t2.user_id = :userId', { userId: filters.userId });
    if (filters.type && (filters.type === 'expense' || filters.type === 'reserve')) {
      sumQb.andWhere('t2.type = :type', { type: filters.type });
    }
    if (filters.month) {
      sumQb.andWhere(`DATE_FORMAT(t2.transaction_date, '%Y-%m') = :month`, { month: filters.month });
    }
    if (filters.categoryId) {
      sumQb.andWhere('t2.category_id = :categoryId', { categoryId: filters.categoryId });
    }

    const [sumResult, rawList, total] = await Promise.all([
      sumQb.getRawOne(),
      qb.orderBy('t.created_at', 'DESC').skip((page - 1) * pageSize).take(pageSize).getRawMany(),
      // count
      (() => {
        const countQb = this.txRepo.createQueryBuilder('t3');
        if (filters.userId) countQb.andWhere('t3.user_id = :userId', { userId: filters.userId });
        if (filters.type && (filters.type === 'expense' || filters.type === 'reserve')) {
          countQb.andWhere('t3.type = :type', { type: filters.type });
        }
        if (filters.month) {
          countQb.andWhere(`DATE_FORMAT(t3.transaction_date, '%Y-%m') = :month`, { month: filters.month });
        }
        if (filters.categoryId) {
          countQb.andWhere('t3.category_id = :categoryId', { categoryId: filters.categoryId });
        }
        return countQb.getCount();
      })(),
    ]);

    const list = rawList.map((row: Record<string, unknown>) => ({
      id: Number(row.t_id),
      userId: Number(row.t_user_id),
      username: row.username,
      nickname: row.nickname,
      categoryId: row.t_category_id,
      categoryName: row.t_category_name,
      type: row.t_type,
      amount: Number(row.t_amount),
      transactionDate: row.t_transaction_date,
      note: row.t_note,
      createdAt: row.t_created_at,
    }));

    return {
      list,
      total,
      page,
      pageSize,
      totalAmount: Number(sumResult?.totalAmount || 0),
    };
  }

  /** 账单详情 */
  async getTransactionDetail(txId: number) {
    const qb = this.txRepo.createQueryBuilder('t')
      .select([
        't.id',
        't.user_id',
        't.category_id',
        't.category_name',
        't.type',
        't.amount',
        't.transaction_date',
        't.note',
        't.created_at',
        't.updated_at',
      ])
      .addSelect('u.username', 'username')
      .addSelect('u.nickname', 'nickname')
      .leftJoin('users', 'u', 'u.id = t.user_id')
      .where('t.id = :txId', { txId });

    const row = await qb.getRawOne();
    if (!row) throw httpError(404, '账单不存在');

    return {
      id: Number(row.t_id),
      userId: Number(row.t_user_id),
      username: row.username,
      nickname: row.nickname,
      categoryId: row.t_category_id,
      categoryName: row.t_category_name,
      type: row.t_type,
      amount: Number(row.t_amount),
      transactionDate: row.t_transaction_date,
      note: row.t_note,
      createdAt: row.t_created_at,
      updatedAt: row.t_updated_at,
    };
  }
}

export const transactionService = new TransactionService();
