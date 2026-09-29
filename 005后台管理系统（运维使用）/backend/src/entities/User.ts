import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * 用户实体 —— 映射 `users` 表（只读访问）
 */
export type AvatarColor = 'pink' | 'orange' | 'mint' | 'lavender' | 'blue';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true, comment: '用户ID' })
  id: number;

  @Column({ type: 'varchar', length: 20, unique: true, comment: '用户名' })
  username: string;

  @Column({ name: 'password_hash', type: 'varchar', length: 255, comment: '密码哈希' })
  passwordHash: string;

  @Column({ type: 'varchar', length: 15, default: '记账达人', comment: '昵称' })
  nickname: string;

  @Column({
    type: 'enum',
    enum: ['pink', 'orange', 'mint', 'lavender', 'blue'],
    default: 'pink',
    comment: '预设头像颜色',
  })
  avatar: AvatarColor;

  @Column({ type: 'tinyint', default: 1, comment: '账户状态：1正常 0注销' })
  status: number;

  @Column({ name: 'last_login_at', type: 'datetime', nullable: true, comment: '最近登录时间' })
  lastLoginAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', comment: '注册时间' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', comment: '更新时间' })
  updatedAt: Date;
}
