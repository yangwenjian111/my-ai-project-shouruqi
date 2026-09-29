import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

/**
 * 分类实体 —— 映射 `categories` 表（只读访问 + 管理端增删）
 */
@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true, comment: '分类ID' })
  id: number;

  @Column({ name: 'user_id', type: 'bigint', unsigned: true, nullable: true, comment: '所属用户ID，NULL=系统预设' })
  userId: number | null;

  @Column({
    type: 'enum',
    enum: ['expense', 'reserve'],
    comment: '分类类型：支出/储备金',
  })
  type: 'expense' | 'reserve';

  @Column({ type: 'varchar', length: 10, comment: '分类名称' })
  name: string;

  @Column({ type: 'varchar', length: 10, default: '📌', comment: '图标（emoji）' })
  icon: string;

  @Column({ type: 'char', length: 7, default: '#F2A6C0', comment: '主题色值' })
  color: string;

  @Column({ name: 'bg_color', type: 'char', length: 7, default: '#FDDDE6', comment: '图标底色' })
  bgColor: string;

  @Column({ name: 'sort_order', type: 'int', default: 0, comment: '排序序号' })
  sortOrder: number;

  @Column({ name: 'is_default', type: 'tinyint', default: 0, comment: '是否系统预设：1是 0否' })
  isDefault: number;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', comment: '创建时间' })
  createdAt: Date;
}
