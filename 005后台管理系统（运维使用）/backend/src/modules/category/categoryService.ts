import { AppDataSource } from '../../config/dataSource';
import { Category } from '../../entities/Category';
import { Transaction } from '../../entities/Transaction';

function httpError(status: number, message: string): Error {
  return Object.assign(new Error(message), { status });
}

class CategoryService {
  private get catRepo() { return AppDataSource.getRepository(Category); }
  private get txRepo() { return AppDataSource.getRepository(Transaction); }

  /** 系统预设分类列表（含关联账单数） */
  async getCategories() {
    const list = await this.catRepo
      .createQueryBuilder('c')
      .select([
        'c.id',
        'c.user_id',
        'c.type',
        'c.name',
        'c.icon',
        'c.color',
        'c.bg_color',
        'c.sort_order',
        'c.is_default',
        'c.created_at',
      ])
      .addSelect(
        `(SELECT COUNT(*) FROM transactions t WHERE t.category_id = c.id)`,
        'txCount',
      )
      .where('c.user_id IS NULL')
      .orderBy('c.sort_order', 'ASC')
      .addOrderBy('c.id', 'ASC')
      .getRawMany();

    return list.map((row: Record<string, unknown>) => ({
      id: Number(row.c_id),
      type: row.c_type,
      name: row.c_name,
      icon: row.c_icon,
      color: row.c_color,
      bgColor: row.c_bg_color,
      sortOrder: Number(row.c_sort_order || 0),
      isDefault: Number(row.c_is_default || 0),
      txCount: Number(row.txCount || 0),
      createdAt: row.c_created_at,
    }));
  }

  /** 新增分类 */
  async createCategory(data: {
    type: string;
    name: string;
    icon?: string;
    color?: string;
    bgColor?: string;
    sortOrder?: number;
  }) {
    // 校验类型
    if (data.type !== 'expense' && data.type !== 'reserve') {
      throw httpError(400, '分类类型无效，可选值：expense / reserve');
    }

    // 校验名称
    const name = data.name?.trim();
    if (!name) throw httpError(400, '分类名称不能为空');
    if ([...name].length > 10) throw httpError(400, '分类名称最多10字');

    // 名称唯一性校验（系统预设分类中）
    const existing = await this.catRepo
      .createQueryBuilder('c')
      .where('c.user_id IS NULL')
      .andWhere('c.name = :name', { name })
      .getOne();
    if (existing) throw httpError(409, '该分类名称已存在');

    // 校验颜色格式
    const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
    const color = data.color || '#F2A6C0';
    const bgColor = data.bgColor || '#FDDDE6';
    if (!hexColorRegex.test(color)) throw httpError(400, '主题色格式无效，需为7位十六进制色值');
    if (!hexColorRegex.test(bgColor)) throw httpError(400, '底色格式无效，需为7位十六进制色值');

    const icon = data.icon || '📌';
    if ([...icon].length > 2) throw httpError(400, '图标最多2个字符');

    const category = this.catRepo.create({
      userId: null,
      type: data.type as 'expense' | 'reserve',
      name,
      icon,
      color,
      bgColor,
      sortOrder: data.sortOrder ?? 0,
      isDefault: 0,
    });

    const saved = await this.catRepo.save(category);
    return {
      id: Number(saved.id),
      type: saved.type,
      name: saved.name,
      icon: saved.icon,
      color: saved.color,
      bgColor: saved.bgColor,
      sortOrder: saved.sortOrder,
      isDefault: saved.isDefault,
      txCount: 0,
      createdAt: saved.createdAt,
    };
  }

  /** 删除分类 */
  async deleteCategory(categoryId: number) {
    const category = await this.catRepo.findOne({ where: { id: categoryId } });
    if (!category) throw httpError(404, '分类不存在');

    // 只允许删除系统预设分类
    if (category.userId !== null) throw httpError(400, '只能删除系统预设分类');

    // 检查关联账单数
    const txCount = await this.txRepo.count({ where: { categoryId } });
    if (txCount > 0) {
      throw httpError(400, `该分类下有 ${txCount} 条账单记录，无法删除`);
    }

    await this.catRepo.remove(category);
    return { id: categoryId };
  }
}

export const categoryService = new CategoryService();
