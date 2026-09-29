import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * 账单实体 —— 映射 `transactions` 表（只读访问）
 */
@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true, comment: '账单ID' })
  id: number;

  @Column({ name: 'user_id', type: 'bigint', unsigned: true, comment: '所属用户ID' })
  userId: number;

  @Column({ name: 'category_id', type: 'bigint', unsigned: true, nullable: true, comment: '分类ID' })
  categoryId: number | null;

  @Column({ name: 'category_name', type: 'varchar', length: 10, default: '其他', comment: '分类名称快照' })
  categoryName: string;

  @Column({
    type: 'enum',
    enum: ['expense', 'reserve'],
    comment: '类型：支出/储备金',
  })
  type: 'expense' | 'reserve';

  @Column({ type: 'decimal', precision: 12, scale: 2, comment: '金额' })
  amount: number;

  @Column({ name: 'transaction_date', type: 'date', comment: '账单日期' })
  transactionDate: string;

  @Column({ type: 'varchar', length: 50, default: '', comment: '备注' })
  note: string;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', comment: '更新时间' })
  updatedAt: Date;
}
