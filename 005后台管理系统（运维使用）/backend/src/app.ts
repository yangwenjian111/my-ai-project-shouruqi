import 'reflect-metadata';
import express, { Request, Response } from 'express';
import { corsMiddleware } from './middleware/cors';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import authRoutes from './modules/auth/authRoutes';
import dashboardRoutes from './modules/dashboard/dashboardRoutes';
import userRoutes from './modules/user/userRoutes';
import reserveRoutes from './modules/reserve/reserveRoutes';
import transactionRoutes from './modules/transaction/transactionRoutes';
import categoryRoutes from './modules/category/categoryRoutes';

const app = express();

// 全局中间件
app.use(corsMiddleware);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 健康检查
app.get('/api/admin/health', (_req: Request, res: Response) => {
  res.json({
    code: 0,
    message: 'ok',
    data: { status: 'up', timestamp: new Date().toISOString() },
  });
});

// 业务路由
app.use('/api/admin/auth', authRoutes);
app.use('/api/admin/dashboard', dashboardRoutes);
app.use('/api/admin/users', userRoutes);
app.use('/api/admin/reserve-funds', reserveRoutes);
app.use('/api/admin/transactions', transactionRoutes);
app.use('/api/admin/categories', categoryRoutes);

// 404 与全局错误处理
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
