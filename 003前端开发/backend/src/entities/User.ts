import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * 预设头像颜色标识（对应 PRD 3.0.2 注册页 5 种 SVG 笑脸头像）
 */
export type AvatarColor = 'pink' | 'orange' | 'mint' | 'lavender' | 'blue';

/**
 * 用户实体 —— 映射 DBA 脚本已创建的 `users` 表
 * 注意：所有列均显式声明类型/长度，确保与现有表结构精确一致，
 * 且不依赖 emitDecoratorMetadata 的类型推断。
 */
@Entity('users')
export class User {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true, comment: '用户ID' })
  id: number;

  @Column({ type: 'varchar', length: 20, unique: true, comment: '用户名，3-20位，唯一' })
  username: string;

  @Column({ name: 'password_hash', type: 'varchar', length: 255, comment: '密码哈希（bcrypt）' })
  passwordHash: string;

  @Column({ type: 'varchar', length: 15, default: '记账达人', comment: '昵称，最多15字' })
  nickname: string;

  @Column({
    type: 'enum',
    enum: ['pink', 'orange', 'mint', 'lavender', 'blue'],
    default: 'pink',
    comment: '预设头像颜色标识',
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
