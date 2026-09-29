import 'dotenv/config';
import { DataSource } from 'typeorm';
import { SuperAdmin } from '../entities/SuperAdmin';
import { User } from '../entities/User';
import { Transaction } from '../entities/Transaction';
import { Category } from '../entities/Category';
import { ReserveFund } from '../entities/ReserveFund';

/**
 * TypeORM 数据源配置
 * - synchronize 关闭：表已由 DBA 脚本创建，禁止 TypeORM 自动改动表结构
 * - 与用户端共享同一个 daily_finance 数据库
 */
export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'daily_finance',
  synchronize: false,
  logging: false,
  charset: 'utf8mb4',
  entities: [SuperAdmin, User, Transaction, Category, ReserveFund],
});
