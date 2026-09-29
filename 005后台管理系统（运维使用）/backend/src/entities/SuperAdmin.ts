import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * 超级管理员实体 —— 映射 `super_admins` 表
 * 仅用于后台管理系统登录，与用户端 users 表完全隔离
 */
@Entity('super_admins')
export class SuperAdmin {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true, comment: '管理员ID' })
  id: number;

  @Column({ type: 'varchar', length: 20, unique: true, comment: '管理员用户名，唯一' })
  username: string;

  @Column({ name: 'password_hash', type: 'varchar', length: 255, comment: '密码哈希（bcrypt）' })
  passwordHash: string;

  @Column({ type: 'varchar', length: 15, default: '超级管理员', comment: '显示名称' })
  nickname: string;

  @Column({ name: 'last_login_at', type: 'datetime', nullable: true, comment: '最近登录时间' })
  lastLoginAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', comment: '创建时间' })
  createdAt: Date;
}
