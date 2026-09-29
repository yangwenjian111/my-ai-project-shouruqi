import { AppDataSource } from '../../config/dataSource';
import { ReserveFund } from '../../entities/ReserveFund';

/** 获取当前月份字符串 YYYY-MM */
function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

class ReserveService {
  private get repo() { return AppDataSource.getRepository(ReserveFund); }

  /** 获取当月储备金 */
  async getCurrent(userId: number): Promise<ReserveFund | null> {
    const month = getCurrentMonth();
    return this.repo.findOne({ where: { userId, month } });
  }

  /** 创建/更新当月储备金 */
  async setReserve(userId: number, amount: number): Promise<ReserveFund> {
    const month = getCurrentMonth();
    const existing = await this.repo.findOne({ where: { userId, month } });
    if (existing) {
      existing.amount = amount;
      return this.repo.save(existing);
    }
    const fund = this.repo.create({ userId, month, amount });
    return this.repo.save(fund);
  }
}

export const reserveService = new ReserveService();
