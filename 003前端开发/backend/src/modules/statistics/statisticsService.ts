import { AppDataSource } from '../../config/dataSource';
import { Transaction } from '../../entities/Transaction';
import { Category } from '../../entities/Category';

/** 获取当前月份字符串 YYYY-MM */
function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

class StatisticsService {
  private get txRepo() { return AppDataSource.getRepository(Transaction); }

  /**
   * 支出趋势（折线图）
   * period: 'week' | 'month' | 'year'
   */
  async trend(userId: number, period: 'week' | 'month' | 'year'): Promise<{
    labels: string[];
    data: number[];
  }> {
    const now = new Date();
    let startDate: string;
    let labels: string[] = [];

    if (period === 'week') {
      const d = new Date(now);
      d.setDate(d.getDate() - 6);
      startDate = this.formatDate(d);
      for (let i = 0; i < 7; i++) {
        const dd = new Date(now);
        dd.setDate(dd.getDate() - 6 + i);
        labels.push(`${dd.getMonth() + 1}/${dd.getDate()}`);
      }
    } else if (period === 'month') {
      const y = now.getFullYear();
      const m = now.getMonth();
      startDate = `${y}-${String(m + 1).padStart(2, '0')}-01`;
      const daysInMonth = new Date(y, m + 1, 0).getDate();
      for (let i = 1; i <= daysInMonth; i++) {
        labels.push(`${m + 1}/${i}`);
      }
    } else {
      const y = now.getFullYear();
      startDate = `${y}-01-01`;
      for (let i = 1; i <= 12; i++) {
        labels.push(`${i}月`);
      }
    }

    const groupBy = period === 'year' ? '%Y-%m' : '%Y-%m-%d';

    const rows: any[] = await this.txRepo
      .createQueryBuilder('t')
      .select(`DATE_FORMAT(t.transaction_date, '${groupBy}')`, 'period')
      .addSelect('COALESCE(SUM(t.amount), 0)', 'total')
      .where('t.user_id = :userId', { userId })
      .andWhere('t.type = :type', { type: 'expense' })
      .andWhere('t.transaction_date >= :startDate', { startDate })
      .groupBy('period')
      .orderBy('period', 'ASC')
      .getRawMany();

    const dataMap: Record<string, number> = {};
    rows.forEach(r => { dataMap[r.period] = Number(r.total); });

    const data: number[] = labels.map(label => {
      if (period === 'year') {
        const monthIdx = labels.indexOf(label) + 1;
        const key = `${now.getFullYear()}-${String(monthIdx).padStart(2, '0')}`;
        return dataMap[key] || 0;
      } else {
        const parts = label.split('/');
        const key = `${now.getFullYear()}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
        return dataMap[key] || 0;
      }
    });

    return { labels, data };
  }

  /** 分类占比（饼图） */
  async categoryPie(userId: number, period: 'week' | 'month' | 'year'): Promise<{
    list: { name: string; value: number; color: string; bgColor: string; icon: string }[];
    totalExpense: number;
  }> {
    const now = new Date();
    let startDate: string;

    if (period === 'week') {
      const d = new Date(now);
      d.setDate(d.getDate() - 6);
      startDate = this.formatDate(d);
    } else if (period === 'month') {
      startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    } else {
      startDate = `${now.getFullYear()}-01-01`;
    }

    const rows: any[] = await this.txRepo
      .createQueryBuilder('t')
      .select('t.category_name', 'name')
      .addSelect('t.category_id', 'categoryId')
      .addSelect('COALESCE(SUM(t.amount), 0)', 'total')
      .where('t.user_id = :userId', { userId })
      .andWhere('t.type = :type', { type: 'expense' })
      .andWhere('t.transaction_date >= :startDate', { startDate })
      .groupBy('t.category_id')
      .addGroupBy('t.category_name')
      .orderBy('total', 'DESC')
      .getRawMany();

    const catIds = rows.map(r => r.categoryId).filter(Boolean);
    const colors: Record<number, { color: string; bgColor: string; icon: string }> = {};
    if (catIds.length > 0) {
      const catRepo = AppDataSource.getRepository(Category);
      const cats = await catRepo
        .createQueryBuilder('c')
        .where('c.id IN (:...ids)', { ids: catIds })
        .getMany();
      cats.forEach((c) => {
        colors[c.id] = { color: c.color, bgColor: c.bgColor, icon: c.icon };
      });
    }

    const defaultColors = ['#F2A6C0', '#FFD6A5', '#C9B8E6', '#B8E6D0', '#A8D8EA', '#FFB347', '#FF6B6B', '#7BC89C'];
    let totalExpense = 0;
    const list = rows.map((r, i) => {
      const val = Number(r.total);
      totalExpense += val;
      const c = colors[r.categoryId] || {};
      return {
        name: r.name,
        value: val,
        color: c.color || defaultColors[i % defaultColors.length],
        bgColor: c.bgColor || '#FDDDE6',
        icon: c.icon || '📌',
      };
    });

    return { list, totalExpense };
  }

  /** 消费排行 */
  async ranking(userId: number, period: 'week' | 'month' | 'year'): Promise<{
    list: { name: string; amount: number; color: string; icon: string }[];
  }> {
    const result = await this.categoryPie(userId, period);
    const rankColors = ['#F2A6C0', '#FFD6A5', '#C9B8E6', '#B8E6D0', '#A8D8EA', '#FFB347'];
    const list = result.list.map((item, i) => ({
      name: item.name,
      amount: item.value,
      color: rankColors[i % rankColors.length],
      icon: item.icon,
    }));
    return { list };
  }

  private formatDate(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
}

export const statisticsService = new StatisticsService();
