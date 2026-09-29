import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * 储备金实体 —— 映射 `reserve_funds` 表（只读访问）
 */
@Entity('reserve_funds')
export class ReserveFund {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true, comment: '储备金ID' })
  id: number;

  @Column({ name: 'user_id', type: 'bigint', unsigned: true, comment: '所属用户ID' })
  userId: number;

  @Column({ name: 'month', type: 'char', length: 7, comment: '月份，格式 YYYY-MM' })
  month: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, comment: '储备金金额' })
  amount: number;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', comment: '更新时间' })
  updatedAt: Date;
}
