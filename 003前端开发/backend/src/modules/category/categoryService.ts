import { AppDataSource } from '../../config/dataSource';
import { Category } from '../../entities/Category';

class CategoryService {
  private get repo() { return AppDataSource.getRepository(Category); }

  /** 获取分类列表（系统预设 + 用户自定义），按类型筛选 */
  async list(userId: number, type?: 'expense' | 'reserve'): Promise<Category[]> {
    const qb = this.repo.createQueryBuilder('c')
      .where('(c.user_id IS NULL OR c.user_id = :userId)', { userId });
    if (type) qb.andWhere('c.type = :type', { type });
    qb.orderBy('c.sort_order', 'ASC');
    return qb.getMany();
  }
}

export const categoryService = new CategoryService();
